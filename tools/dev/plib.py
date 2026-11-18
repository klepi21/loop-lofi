# Small helper for exact-text patches of the one-file game. Usage: from plib import Pt; p=Pt(); p.sub(old,new); p.done()
import re,sys,os
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
class Pt:
    def __init__(self,path=None):
        self.path=path or os.path.join(ROOT,'index.html');self.s=open(self.path).read()
    def sub(self,a,b,n=1):
        c=self.s.count(a)
        assert c==n,('COUNT',c,'expected',n,a[:90])
        self.s=self.s.replace(a,b)
    def after(self,a,b): self.sub(a,a+b)
    def before(self,a,b): self.sub(a,b+a)
    def done(self):
        m=re.search(r'<script>([\s\S]*)</script>',self.s)
        assert m,'main script not found'
        assert self.s.count('<script>')==1,'only the main script may be a plain <script> tag (the server reads it)'
        names=re.findall(r'\nfunction (\w+)\(',m.group(1));dup={n for n in names if names.count(n)>1}
        assert not dup,('duplicate functions',dup)
        open(self.path,'w').write(self.s);open(os.path.join(os.path.dirname(__file__),'out','_chk.js'),'w').write(m.group(1))
        print('saved',len(self.s))
