from pathlib import Path
from bs4 import BeautifulSoup, Comment
from urllib.parse import urlparse, urljoin, unquote
from concurrent.futures import ThreadPoolExecutor
import base64, hashlib, mimetypes, re, subprocess

root=Path(__file__).resolve().parents[1]
dist=root/'dist'
out=root.parent/'homepage.html'
cache=Path('/tmp/chonghe-offline-assets'); cache.mkdir(exist_ok=True)
soup=BeautifulSoup((dist/'index.html').read_text(),'html.parser')
soup.html.insert(0,Comment('\nOffline export of Chonghe Jiang’s al-folio homepage.\n'+(root/'LICENSE').read_text()+'\n'))
main=soup.body.find('div',recursive=False)
main.name='main';main['id']='local-content'
home=soup.new_tag('section',id='home');home['data-local-page']=''
for child in list(main.contents):home.append(child.extract())
main.append(home)
for route,source in [('bio','bio/index.html')]:
 doc=BeautifulSoup((dist/source).read_text(),'html.parser')
 section=soup.new_tag('section',id=route);section['data-local-page']='';section['hidden']=''
 for child in list(doc.body.find('div',recursive=False).contents): section.append(child.extract())
 main.append(section)
# IDs must stay unique when pages share one document.
for section in main.select('[data-local-page]'):
 idmap={t['id']:section['id']+'-'+t['id'] for t in section.select('[id]')}
 for t in section.select('[id]'):t['id']=idmap[t['id']]
 for a in section.select('a[href^="#"]'):
  if a['href'][1:] in idmap:a['href']='#'+idmap[a['href'][1:]]
 for t in section.select('[aria-labelledby], [aria-controls]'):
  for attr in ['aria-labelledby','aria-controls']:
   if attr in t.attrs:t[attr]=' '.join(idmap.get(v,v) for v in t[attr].split())
 for h in section.select('h1'):h['tabindex']='-1'
route_map={'/':'#home','/publications/':'#home-research','/bio/':'#bio'}
for a in soup.select('a[href]'):
 if a['href'] in route_map:
  a['href']=route_map[a['href']];a['data-local-nav']=''
for x in soup.select('nav .sr-only'):
 if '(current)' in x.get_text(): x.decompose()
for x in soup.select('link[rel="canonical"],meta[property="og:url"]'):x.decompose()

memory={}
def fetch(url):
 if url in memory:return memory[url]
 if not url.startswith(('https://','http://')):
  data=(dist/unquote(urlparse(url).path.lstrip('/'))).read_bytes()
 else:
  p=cache/hashlib.sha256(url.encode()).hexdigest()
  if not p.exists():
   subprocess.run(['curl','-fsSL','--retry','2','--max-time','40','-A','Mozilla/5.0',url,'-o',str(p)],check=True,capture_output=True)
  data=p.read_bytes()
 memory[url]=data
 return data

def data_url(url):
 if url.startswith(('data:','#')):return url
 mime=mimetypes.guess_type(urlparse(url).path)[0] or 'application/octet-stream'
 return 'data:'+mime+';base64,'+base64.b64encode(fetch(url)).decode()

urlpat=re.compile(r'url\(\s*[\'\"]?([^\)\'\"]+)[\'\"]?\s*\)')
def css_embed(css,base):
 css=re.sub(r'/\*[#@]\s*sourceMappingURL=.*?\*/','',css,flags=re.S)
 refs={urljoin(base,m.group(1).strip()) for m in urlpat.finditer(css) if not m.group(1).startswith(('data:','#'))}
 with ThreadPoolExecutor(max_workers=8) as pool: list(pool.map(fetch,refs))
 return urlpat.sub(lambda m:'url("'+data_url(urljoin(base,m.group(1).strip()))+'")' if not m.group(1).startswith(('data:','#')) else m.group(0),css)

links=list(soup.select('link[rel="stylesheet"]'))
scripts=list(soup.select('script[src]'))
with ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(fetch,[x['href'] for x in links]+[x['src'] for x in scripts]))
for link in links:
 src=link['href'];style=soup.new_tag('style')
 for attr in ['id','media']:
  if attr in link.attrs:style[attr]=link[attr]
 style.string=css_embed(fetch(src).decode("utf-8-sig"),src)
 link.replace_with(style)
for script in scripts:
 code=fetch(script['src']).decode()
 code=re.sub(r'//# sourceMappingURL=.*','',code)
 script.attrs={k:v for k,v in script.attrs.items() if k in ['id','type']}
 script.string=code.replace('</script','<\\/script')
for link in soup.select('link[rel~="icon"], link[rel="apple-touch-icon"]'):
 link['href']=data_url(link['href'])
for img in soup.select('img[src]'):
 img['src']=data_url(img['src'])
 if 'srcset' in img.attrs:del img['srcset']
for source in soup.select('source[srcset]'): source.decompose()
style=soup.new_tag('style');style.string='[data-local-page][hidden] { display: none !important; } h1[tabindex="-1"]:focus { outline: none; }'
soup.head.append(style)
router=soup.new_tag('script');router.string='''
(() => {
  const pages = [...document.querySelectorAll('[data-local-page]')];
  const names = {home: 'Chonghe Jiang', bio: 'Bio | Chonghe Jiang'};
  function showPage(focus) {
    const requestedHash = decodeURIComponent(location.hash.slice(1)) || 'home';
    const hash = requestedHash === 'research' ? 'home-research' : requestedHash;
    const target = document.getElementById(hash);
    const section = pages.find(p => p.id === hash) || target?.closest('[data-local-page]') || pages[0];
    pages.forEach(p => p.hidden = p !== section);
    document.title = names[section.id];
    document.querySelectorAll('nav [data-local-nav]').forEach(a => {
      const active = a.hash === '#' + section.id;
      a.closest('li')?.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.getElementById('navbarNav').classList.remove('show');
    const toggle = document.querySelector('[data-nav-toggle]');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.add('collapsed');
    if (focus) {
      if (target && target !== section) target.scrollIntoView();
      else { window.scrollTo(0, 0); section.querySelector('h1')?.focus({preventScroll:true}); }
    }
  }
  window.addEventListener('hashchange', () => showPage(true));
  showPage(false);
})();
'''
soup.body.append(router)
out.write_text(str(soup),encoding='utf-8')
print('Exported:',out)
print('Size:',round(out.stat().st_size/1024/1024,2),'MiB')
print('Embedded resources:',len(memory))
