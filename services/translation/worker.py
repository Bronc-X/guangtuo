"""Use Argos packages with their CTranslate2 engine, one CPU model at a time.

Sentence boundaries are handled locally; no sentence-model downloads at runtime.
"""
import contextlib
import gc
import json
import re
import sys
from pathlib import Path

requests = json.load(sys.stdin)
with contextlib.redirect_stdout(sys.stderr):
    import argostranslate.package
    import ctranslate2

    packages = {(p.from_code, p.to_code): p for p in argostranslate.package.get_installed_packages()}

    def translate_texts(texts, source, target):
        package = packages[(source, target)]
        engine = ctranslate2.Translator(str(package.package_path / 'model'), device='cpu', compute_type='int8', inter_threads=1, intra_threads=2)
        results = {}
        for text in texts:
            paragraphs = re.split(r'(\n+|ZXQ[A-Z]+XZQ)', text)
            output = []
            for paragraph in paragraphs:
                if not paragraph.strip() or re.fullmatch(r'ZXQ[A-Z]+XZQ', paragraph) or not re.search(r'[^\W\d_]', paragraph):
                    output.append(paragraph)
                    continue
                # Keep decimals and Latin identifiers intact at sentence boundaries.
                sentences = re.split(r'(?<=[。！？!?])|(?<=\.)\s+', paragraph)
                chunks = []
                for sentence in sentences:
                    tokens = package.tokenizer.encode(sentence)
                    chunks.extend(tokens[i:i + 180] for i in range(0, len(tokens), 180))
                if not chunks:
                    continue
                batches = engine.translate_batch(chunks, target_prefix=[[package.target_prefix]] * len(chunks) if package.target_prefix else None, replace_unknowns=True, beam_size=4, max_batch_size=16, max_input_length=0, max_decoding_length=512, length_penalty=0.2)
                translated = []
                for batch in batches:
                    value = package.tokenizer.decode(batch.hypotheses[0])
                    if package.target_prefix and value.startswith(package.target_prefix):
                        value = value[len(package.target_prefix):]
                    translated.append(value.strip())
                output.append(' '.join(translated))
            results[text] = ''.join(output)
        engine.unload_model()
        del engine
        gc.collect()
        return results

    glossary = json.loads((Path(__file__).parent / 'glossary.json').read_text(encoding='utf-8'))
    terms = sorted(glossary, key=len, reverse=True)
    protected = {}
    def token_for(index):
        letters = ''
        while True:
            letters = chr(65 + index % 26) + letters
            index = index // 26 - 1
            if index < 0:
                return 'ZXQ' + letters + 'XZQ'
    numeric_tokens = {}
    def protect_number(match):
        number = match.group(0)
        if number not in numeric_tokens:
            token = token_for(len(terms) + len(numeric_tokens))
            numeric_tokens[number] = token
            protected[token] = {locale: number for locale in ['en', 'fr', 'es', 'ru', 'ar']}
        return numeric_tokens[number]
    original_requests = requests
    requests = []
    for request in original_requests:
        text = request['text']
        for index, term in enumerate(terms):
            token = token_for(index)
            text = text.replace(term, token)
            protected[token] = glossary[term]
        text = re.sub(r'\d+(?:[.,]\d+)*', protect_number, text)
        requests.append({**request, 'text': text})
    source_texts = list(dict.fromkeys(request['text'] for request in requests))
    chinese_texts = [text for text in source_texts if re.search(r'[\u3400-\u9fff]', text)]
    english = {text: text for text in source_texts}
    if chinese_texts:
        english.update(translate_texts(chinese_texts, 'zh', 'en'))
    results = [''] * len(requests)
    for target in dict.fromkeys(request['target'] for request in requests):
        indexes = [i for i, request in enumerate(requests) if request['target'] == target]
        translated = translate_texts(list(dict.fromkeys(english[requests[i]['text']] for i in indexes)), 'en', target) if target != 'en' else None
        for i in indexes:
            value = english[requests[i]['text']]
            value = translated[value] if translated is not None else value
            for token, localized in protected.items():
                if token in requests[i]['text'] and token not in value:
                    raise ValueError('Terminology token missing')
                value = value.replace(token, ' ' + localized[target] + ' ')
            results[i] = re.sub(r' +', ' ', value).strip()
json.dump(results, sys.stdout, ensure_ascii=False)
