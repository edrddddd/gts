"""Verify built HTML, shared shell, local resources and navigation targets."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids=[]; self.refs=[]; self.h1=0; self.descriptions=0; self.inline_handlers=[]
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='h1': self.h1+=1
        if tag=='meta' and a.get('name')=='description' and a.get('content'): self.descriptions+=1
        for key in ('href','src'):
            if a.get(key): self.refs.append(a[key])
        self.inline_handlers.extend(k for k in a if k.startswith('on'))

def main():
    pages=list(ROOT.glob('*.html'))+list((ROOT/'cursos').glob('*.html'))
    parsed={path:Page(path.read_text(encoding='utf-8')) for path in pages}
    errors=[]
    for path,page in parsed.items():
        label=path.relative_to(ROOT).as_posix()
        if page.h1!=1: errors.append(f'{label}: expected one h1, found {page.h1}')
        if page.descriptions!=1: errors.append(f'{label}: expected one meta description')
        if len(page.ids)!=len(set(page.ids)): errors.append(f'{label}: duplicate ids')
        if 'site-navigation' not in page.ids or 'main-content' not in page.ids: errors.append(f'{label}: missing shared shell/main target')
        if page.inline_handlers: errors.append(f'{label}: inline event handlers')
        for ref in page.refs:
            url=urlsplit(ref)
            if url.scheme or url.netloc: continue
            target=(path.parent / unquote(url.path)).resolve() if url.path else path
            if not target.is_relative_to(ROOT): errors.append(f'{label}: path outside site: {ref}'); continue
            if not target.is_file(): errors.append(f'{label}: missing resource: {ref}'); continue
            if url.fragment and target in parsed and unquote(url.fragment) not in parsed[target].ids:
                errors.append(f'{label}: missing anchor: {ref}')
    if errors:
        print('\n'.join(errors)); return 1
    print(f'{len(pages)} pages checked: local links, assets, headings, descriptions and shared navigation OK.')
    return 0

if __name__=='__main__': sys.exit(main())
