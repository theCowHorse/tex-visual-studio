"""Build an offline VSIX using only the Python standard library."""
import argparse
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output-dir', type=Path, default=root.parent / 'outputs')
parser.add_argument('--source-zip', action='store_true', help='also archive the repository files')
args = parser.parse_args()
out = args.output_dir.resolve()
out.mkdir(exist_ok=True)
p = json.loads((root / 'package.json').read_text(encoding='utf-8'))
ns = 'http://schemas.microsoft.com/developer/vsx-schema/2011'
ET.register_namespace('', ns)
tag = lambda n: '{' + ns + '}' + n
m = ET.Element(tag('PackageManifest'), Version='2.0.0')
md = ET.SubElement(m, tag('Metadata'))
ET.SubElement(md, tag('Identity'), Language='en-US', Id=p['name'], Version=p['version'], Publisher=p['publisher'])
ET.SubElement(md, tag('DisplayName')).text = p['displayName']
ET.SubElement(md, tag('Description')).text = p['description']
ET.SubElement(md, tag('Tags')).text = 'latex,tikz,math,visual'
ET.SubElement(md, tag('Categories')).text = 'Visualization,Other'
props = ET.SubElement(md, tag('Properties'))
for k, v in {'Microsoft.VisualStudio.Code.Engine': p['engines']['vscode'], 'Microsoft.VisualStudio.Code.ExtensionKind':'ui', 'Microsoft.VisualStudio.Code.ExecutesCode':'true'}.items():
    ET.SubElement(props, tag('Property'), Id=k, Value=v)
inst = ET.SubElement(m, tag('Installation'))
ET.SubElement(inst, tag('InstallationTarget'), Id='Microsoft.VisualStudio.Code')
ET.SubElement(m, tag('Dependencies'))
assets = ET.SubElement(m, tag('Assets'))
for kind, name in [('Manifest','package.json'),('Details','README.md'),('License','LICENSE')]:
    ET.SubElement(assets,tag('Asset'),Type='Microsoft.VisualStudio.Code.'+kind,Path='extension/'+name,Addressable='true')
content_types = '''<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="application/json"/><Default Extension="js" ContentType="application/javascript"/><Default Extension="css" ContentType="text/css"/><Default Extension="html" ContentType="text/html"/><Default Extension="md" ContentType="text/markdown"/><Default Extension="txt" ContentType="text/plain"/><Default Extension="woff" ContentType="font/woff"/><Default Extension="woff2" ContentType="font/woff2"/><Default Extension="svg" ContentType="image/svg+xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="vsixmanifest" ContentType="text/xml"/></Types>'''
target = out / f"{p['name']}-{p['version']}.vsix"
docs = ('package.json', 'README.md', 'LICENSE', 'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md')
runtime = [root / name for name in docs]
for folder in ('src', 'media', 'licenses', 'examples'):
    runtime.extend(sorted(f for f in (root / folder).rglob('*') if f.is_file()))

with ZipFile(target,'w',ZIP_DEFLATED) as z:
    z.writestr('extension.vsixmanifest',ET.tostring(m,encoding='utf-8',xml_declaration=True))
    z.writestr('[Content_Types].xml',content_types)
    for f in runtime:
        z.write(f, 'extension/' + f.relative_to(root).as_posix())
print(target)
print(f'{target.stat().st_size / 1024 / 1024:.1f} MiB')

if args.source_zip:
    source = runtime + [root / '.gitignore']
    source.extend(sorted((root / 'scripts').glob('*.py')))
    source.extend(sorted((root / 'test').glob('*.js')))
    folder = f"{p['name']}-{p['version']}"
    archive = out / f'{folder}-source.zip'
    with ZipFile(archive, 'w', ZIP_DEFLATED) as z:
        for f in source:
            z.write(f, f'{folder}/{f.relative_to(root).as_posix()}')
    print(archive)
