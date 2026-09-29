"""Install only the five directed language models required by this website."""
import argostranslate.package
import argostranslate.settings
import zipfile

required = {('zh', 'en'), ('en', 'fr'), ('en', 'es'), ('en', 'ru'), ('en', 'ar')}
argostranslate.package.update_package_index()
available = argostranslate.package.get_available_packages()
installed = {(p.from_code, p.to_code) for p in argostranslate.package.get_installed_packages()}
for source, target in sorted(required - installed):
    package = next(p for p in available if p.from_code == source and p.to_code == target)
    print(f'Installing {source} -> {target}', flush=True)
    model = package.download()
    if not zipfile.is_zipfile(model):
        raise RuntimeError(f'Invalid Argos model archive: {source} -> {target}')
    with zipfile.ZipFile(model, 'r') as archive:
        archive.extractall(path=argostranslate.settings.package_data_dir)
print('All five translation routes installed.', flush=True)
