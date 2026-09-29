export type Ranked = {id: string; score: number};
const stopWords = new Set(['the', 'and', 'or', 'of', 'for', 'to', 'a', 'an', 'is', 'are', 'with', 'in', '的', '了', '和']);
const segmenter = new Intl.Segmenter('zh', {granularity: 'word'});

export function tokenizeKnowledge(text: string): string[] {
  const normalized = text.normalize('NFKC').toLowerCase();
  const tokens = [...normalized.matchAll(/[a-z0-9]+(?:[-_.][a-z0-9]+)+/g)].map(match => match[0]);
  for (const part of segmenter.segment(normalized)) {
    if (part.isWordLike && !stopWords.has(part.segment)) tokens.push(part.segment);
  }
  // Overlapping Han bigrams retain matches when the corpus and query segment differently.
  for (const match of normalized.matchAll(/\p{Script=Han}{2,}/gu)) {
    const chars = [...match[0]];
    for (let index = 0; index < chars.length - 1; index++) tokens.push(chars[index] + chars[index + 1]);
  }
  return tokens;
}

export function rankBm25(query: string, chunks: Array<{id: string; text: string}>, limit = 30): Ranked[] {
  const terms = [...new Set(tokenizeKnowledge(query))].slice(0, 100);
  if (!terms.length || !chunks.length) return [];
  const documents = chunks.map(chunk => {
    const tokens = tokenizeKnowledge(chunk.text);
    const frequencies = new Map<string, number>();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    return {...chunk, length: tokens.length, frequencies};
  });
  const averageLength = documents.reduce((total, doc) => total + doc.length, 0) / documents.length || 1;
  const documentFrequency = new Map(terms.map(term => [term, documents.filter(doc => doc.frequencies.has(term)).length]));
  const k1 = 1.2;
  const b = .75;
  return documents.map(doc => ({id: doc.id, score: terms.reduce((score, term) => {
    const frequency = doc.frequencies.get(term) ?? 0;
    if (!frequency) return score;
    const df = documentFrequency.get(term)!;
    const idf = Math.log(1 + (documents.length - df + .5) / (df + .5));
    return score + idf * frequency * (k1 + 1) / (frequency + k1 * (1 - b + b * doc.length / averageLength));
  }, 0)})).filter(hit => hit.score > 0).sort((a, other) => other.score - a.score || a.id.localeCompare(other.id)).slice(0, limit);
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length) throw new Error('VECTOR_DIMENSION_MISMATCH');
  if (!left.length || left.length > 4096 || [...left, ...right].some(value => !Number.isFinite(value))) throw new Error('INVALID_VECTOR');
  let dot = 0; let leftNorm = 0; let rightNorm = 0;
  for (let index = 0; index < left.length; index++) {
    dot += left[index] * right[index]; leftNorm += left[index] ** 2; rightNorm += right[index] ** 2;
  }
  if (!Number.isFinite(leftNorm * rightNorm) || leftNorm === 0 || rightNorm === 0) throw new Error('INVALID_VECTOR');
  return dot / Math.sqrt(leftNorm * rightNorm);
}

export function reciprocalRankFusion(lexical: Ranked[], semantic: Ranked[], limit = 10): Ranked[] {
  const scores = new Map<string, number>();
  for (const [hits, weight] of [[lexical, .6], [semantic, .4]] as const) {
    hits.forEach((hit, index) => scores.set(hit.id, (scores.get(hit.id) ?? 0) + weight / (60 + index + 1)));
  }
  return [...scores].map(([id, score]) => ({id, score})).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}
