import re
src='/home/claude/taily-site/src/'
css=open(src+'style.css').read()
js='\n'.join(open(src+f).read() for f in ['data.js','app.js'])
html=f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#F0F0F0">
<title>Taily — learn money by living it</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap">
<style>{css}</style>
</head>
<body>
<div class="stage"><main id="app"></main></div>
<script>
{js}
</script>
</body>
</html>
'''
open('/home/claude/taily-site/index.html','w').write(html)
print('built', len(html))
