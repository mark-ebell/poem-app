import re,sys,html
SRC='/Users/markebell/Dropbox/Projects/InfoRetriever app project/EEPlus chapters/EE Topics'
done=set()
try:
    for l in open('edges.txt'):
        p=l.split()
        if len(p)>=2 and not l.startswith('#'): done.add((p[0],p[1]))
except FileNotFoundError: pass
todo=[l.rstrip('\n').split('\t') for l in open('todo.tsv')]
todo=[t for t in todo if (t[0],t[1]) not in done]
n=int(sys.argv[1]) if len(sys.argv)>1 else 5
print(f'{len(todo)} left')
for ch,fig,ncell,img,title in todo[:n]:
    xml=open(f'{SRC}/{ch.upper()}.xml',encoding='utf-8').read()
    a=re.search(r'<algorithm\b[^>]*\bid="%s"[\s\S]*?</algorithm>'%fig,xml).group(0)
    print(f'== {ch} {fig} {img} | {title}')
    for c in re.findall(r'<cell\b[^>]*>[\s\S]*?</cell>',a):
        cid=(re.search(r"id=\"cell-(\d+)\"",c) or re.search(r"id=\"([^\"]*)\"",c)).group(1); typ=re.search(r'type="([^"]*)"',c).group(1)[0]
        lab=re.sub(r'<[^>]+>','',(re.search(r'<label>([\s\S]*?)</label>',c) or [None,''])[1]); lab=html.unescape(re.sub(r'\s+',' ',lab)).strip()
        print(f' {cid}{typ} {lab[:70]}')
