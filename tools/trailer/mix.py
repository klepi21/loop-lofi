import json,sys,subprocess,numpy as np,os,wave
vid,out=sys.argv[1],sys.argv[2]
SR=44100;DUR=int(sys.argv[3])/30;N=int(DUR*SR)+SR//2
G='/Users/konstantinoslepidas/Desktop/loop/sounds/game/'
def dec(path,ch=1,ss=None,t=None):
    cmd=['ffmpeg','-loglevel','error']+(['-ss',str(ss)] if ss is not None else [])+(['-t',str(t)] if t else [])+['-i',path,'-ac',str(ch),'-ar',str(SR),'-f','f32le','-']
    a=np.frombuffer(subprocess.run(cmd,capture_output=True).stdout,dtype=np.float32)
    return a.reshape(-1,ch) if ch>1 else a
SM={f[:-4]:dec(G+f) for f in os.listdir(G) if f.endswith('.mp3')}
sfx=np.zeros(N,np.float32)
def add(buf,t,g):
    i=int(t*SR)
    if i>=N or i<0:return
    n=min(len(buf),N-i);sfx[i:i+n]+=buf[:n]*g
rng=np.random.default_rng(7)
def tone(typ,f,dur,vol,att=.006):
    n=int((dur+.02)*SR);t=np.arange(n)/SR;f=list(f)
    if len(f)==1:f=f*2
    seg=dur/(len(f)-1);fr=np.empty(n)
    for k in range(len(f)-1):
        m=(t>=k*seg)&((t<(k+1)*seg)|(k==len(f)-2))
        u=np.clip((t[m]-k*seg)/seg,0,1);fr[m]=f[k]*(f[k+1]/f[k])**u
    ph=2*np.pi*np.cumsum(fr)/SR
    if typ=='sine':w=np.sin(ph)
    elif typ=='triangle':w=2/np.pi*np.arcsin(np.sin(ph))
    elif typ=='square':w=np.sign(np.sin(ph))*.6
    else:w=(2*((ph/(2*np.pi))%1)-1)*.6
    env=np.where(t<att,t/att,np.exp(np.log(1e-4/1)*np.clip((t-att)/max(1e-3,dur-att),0,1)))
    return (w*env*vol).astype(np.float32)
def noise(dur,vol,typ,f0,f1):
    n=int((dur+.02)*SR);x=rng.standard_normal(n).astype(np.float32)*.5
    X=np.fft.rfft(x);fq=np.fft.rfftfreq(n,1/SR);fc=np.sqrt(f0*f1) if f1 else f0
    if typ=='lowpass':H=1/np.sqrt(1+(fq/fc)**4)
    elif typ=='highpass':H=1/np.sqrt(1+(fc/np.maximum(fq,1))**4)
    else:H=1/np.sqrt(1+((fq/fc-fc/np.maximum(fq,1))*2.5)**2)
    y=np.fft.irfft(X*H,n);t=np.arange(n)/SR;env=np.exp(np.log(1e-4)*np.clip(t/dur,0,1))
    return (y*env*vol).astype(np.float32)
log=json.load(open(vid+'.json'));cnt={}
for e in log:
    k=e[0];cnt[k]=cnt.get(k,0)+1
    if k=='p':
        _,t,name,vol,rate=e;b=SM.get(name)
        if b is None:continue
        if abs(rate-1)>.01:
            m=int(len(b)/rate);b=np.interp(np.arange(m)*rate,np.arange(len(b)),b).astype(np.float32)
        g=vol*(.5 if name=='pop' else 1.0)
        add(b,t,g)
    elif k=='t':
        _,t,typ,f,dur,vol=e;add(tone(typ,f,dur,vol),t,.8)
    elif k=='n':
        _,t,dur,vol,typ,f0,f1=e;add(noise(dur,vol,typ,f0,f1),t,.9)
# LOOP demo: frozen ambient intro, riser into the logo slam, Exhilarate under the trailer, Chill Wave under the demo
SLAM=186/30;DEMO=1012/30;END=DUR-240/30
r=int(1.8*SR);x=rng.standard_normal(r).astype(np.float32);ris=np.zeros(r,np.float32);blk=2048
for i in range(0,r-blk,blk//2):
    u=i/r;fc=300*(18**u);X=np.fft.rfft(x[i:i+blk]*np.hanning(blk));fq=np.fft.rfftfreq(blk,1/SR);H=1/np.sqrt(1+((fq/fc-fc/np.maximum(fq,1))*1.6)**2);ris[i:i+blk]+=np.fft.irfft(X*H,blk)*u*u
add(ris*.7,SLAM-1.8,1)
dr=int(SLAM*SR);td=np.arange(dr)/SR;drone=(np.sin(2*np.pi*55*td)+.45*np.sin(2*np.pi*82.5*td)*(1+.3*np.sin(2*np.pi*.5*td))+.2*np.sin(2*np.pi*220*td)*np.sin(2*np.pi*.25*td)**2)*np.minimum(1,td/1.2)*np.minimum(1,(SLAM-td)/.1)*.12;add(drone.astype(np.float32),0,1)
wind=noise(SLAM,.06,'bandpass',900,0);add(wind,0,1)
add(tone('sine',[95,30],1.1,1.0),SLAM,1.0);add(noise(.6,.6,'lowpass',900,150),SLAM,1)
# a whoosh on every title card
for e in log:
    if e[0]=='p' and e[2]=='ring' and abs(e[4]-.6)<.01 and e[1]>DEMO-1:
        add(noise(.55,.32,'bandpass',600,3000),e[1]-.12,1);add(tone('sine',[180,60],.35,.35),e[1],1)
sfx=np.tanh(sfx*1.1)/1.1
M=np.zeros((N,2),np.float32);t=np.arange(N)/SR
ex=dec(os.path.dirname(os.path.abspath(__file__))+'/music/Exhilarate.mp3',2)
s0=int((SLAM-.72)*SR);n=min(len(ex),int((DEMO+1.6)*SR)-s0)
seg=ex[:n].copy();fo=np.clip((DEMO+1.6-(np.arange(n)/SR+SLAM-.72))/1.6,0,1);seg*=fo[:,None];M[s0:s0+n]+=seg
cw=dec(os.path.dirname(os.path.abspath(__file__))+'/music/ChillWave.mp3',2)
c0=int((DEMO-.4)*SR);n=min(len(cw),N-c0);seg=cw[:n].copy();fi=np.clip(np.arange(n)/SR/1.8,0,1);seg*=(fi*1.15)[:,None];M[c0:c0+n]+=seg
env=np.clip((DUR-t)/2.5,0,1)
duck=np.ones(N,np.float32);
mix=M*env[:,None]*.85+sfx[:,None]*.62
pk=np.abs(mix).max();mix=mix/pk*.92
mix=mix[:int(DUR*SR)]
w=wave.open(out,'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype(np.int16).tobytes());w.close()
print(vid,'events',cnt,'peak %.2f'%pk,'sfx rms %.3f music rms %.3f'%(float(np.sqrt((sfx**2).mean())),float(np.sqrt((M**2).mean())*.62)))
