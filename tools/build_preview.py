import re, base64, os
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
W='../iphone'; h=open(W+'/index.html').read()
css=open(W+'/css/app.css').read()
def font(m):
    p=os.path.normpath(os.path.join(W,'css',m.group(1)))
    return 'url(data:font/woff2;base64,'+base64.b64encode(open(p,'rb').read()).decode()+')'
css=re.sub(r'url\((\.\./fonts/[^)]+\.woff2)\)',font,css)
h=h.replace('<link rel="stylesheet" href="css/app.css">','<style>'+css+'</style>')
h=re.sub(r'<script src="(js/[^"]+)"></script>',lambda m:'<script>'+open(W+'/'+m.group(1)).read().replace('</script','<\\/script')+'</script>',h)
h=re.sub(r'<link rel="(manifest|apple-touch-icon)"[^>]*>\n?|<meta name="(apple-mobile-web-app-[a-z-]+|mobile-web-app-capable)"[^>]*>\n?','',h)
h=re.sub(r'<!doctype html>\s*|</?html[^>]*>|</?head>|</?body>|<meta charset[^>]*>|<meta name="viewport"[^>]*>','',h)
os.makedirs('preview',exist_ok=True)
open('preview/index.html','w').write(h.strip()+'\n')
print(len(h)//1024,'KB')
