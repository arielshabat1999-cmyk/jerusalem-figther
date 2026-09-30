(()=>{
const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
function installStyle(){
  if(document.getElementById('boss-progress-bar-style'))return;
  const style=document.createElement('style');style.id='boss-progress-bar-style';style.textContent=`
  .boss-progress{--boss-from:#fff7a6;--boss-to:#ffd21f;--boss-glow:#ffc400;--boss-particle:#fff4a3;position:absolute;left:0;right:0;top:0;height:calc(env(safe-area-inset-top) + 25px);padding-top:env(safe-area-inset-top);pointer-events:none;z-index:2;filter:drop-shadow(0 2px 8px #000b)}
  .boss-progress-label{position:absolute;z-index:3;left:50%;top:calc(env(safe-area-inset-top) + 2px);transform:translateX(-50%);font:950 9px/1 Inter,system-ui,-apple-system,sans-serif;letter-spacing:.15em;color:#fff6c8;text-shadow:0 0 6px var(--boss-glow),0 2px 5px #000;white-space:nowrap}
  .boss-progress-track{position:absolute;left:0;right:0;bottom:0;height:9px;overflow:hidden;background:linear-gradient(180deg,#03070dbf,#111208d9);border-top:1px solid #ffe5642e;border-bottom:1px solid #ffe56442;box-shadow:inset 0 1px 4px #000c,0 0 7px #000c}
  .boss-progress-fill{position:absolute;inset:0;transform:scaleX(0);transform-origin:left center;background:linear-gradient(90deg,var(--boss-from),var(--boss-to) 55%,#fff0a4);box-shadow:0 0 9px var(--boss-glow),0 0 18px color-mix(in srgb,var(--boss-glow) 58%,transparent);will-change:transform;transition:transform .09s linear}
  .boss-progress-fill:after{content:"";position:absolute;inset:0;opacity:.75;background:radial-gradient(circle at 7% 45%,var(--boss-particle) 0 1px,transparent 1.8px),radial-gradient(circle at 27% 68%,#fff 0 1px,transparent 1.7px),radial-gradient(circle at 52% 30%,var(--boss-particle) 0 .8px,transparent 1.6px),radial-gradient(circle at 76% 62%,#fff 0 .8px,transparent 1.5px),radial-gradient(circle at 94% 38%,var(--boss-particle) 0 1px,transparent 1.8px);background-size:74px 9px,91px 9px,111px 9px,131px 9px,157px 9px;animation:bossEnergyDrift 2.6s linear infinite}
  .boss-progress-edge{position:absolute;right:0;top:-3px;width:3px;height:15px;background:#fffbd8;box-shadow:0 0 5px #fff,0 0 11px var(--boss-glow),0 0 18px var(--boss-glow);opacity:.9}
  .boss-progress[data-active="true"] .boss-progress-label{color:#fff;text-shadow:0 0 7px var(--boss-glow),0 0 14px var(--boss-glow),0 2px 5px #000}
  .boss-progress[data-active="true"] .boss-progress-fill{filter:brightness(1.08)}
  @keyframes bossEnergyDrift{from{background-position:0 0,0 0,0 0,0 0,0 0}to{background-position:74px 0,-91px 0,111px 0,-131px 0,157px 0}}
  @media(max-width:390px){.boss-progress{height:calc(env(safe-area-inset-top) + 23px)}.boss-progress-track{height:8px}.boss-progress-label{font-size:8px}}
  html[data-reduced-motion="true"] .boss-progress-fill:after{animation:none!important}
  `;document.head.appendChild(style)
}
class BossProgressBar{
  constructor(){installStyle();this.el=document.createElement('div');this.el.className='boss-progress';this.el.dataset.active='false';this.el.innerHTML='<div class="boss-progress-label">BOSS LEVEL 1</div><div class="boss-progress-track"><div class="boss-progress-fill"><i class="boss-progress-edge"></i></div></div>';this.fill=this.el.querySelector('.boss-progress-fill');this.label=this.el.querySelector('.boss-progress-label');this.lastLevel=null;this.lastProgress=-1}
  mount(parent){parent?.appendChild(this.el);return this}
  update({progress=0,bossLevel=1,bossActive=false,theme=null}={}){const p=clamp(progress),level=Math.max(1,Math.floor(Number(bossLevel)||1)),t=theme||window.BossProgressHudConfig?.themeFor?.(level)||{};if(this.lastLevel!==level){this.label.textContent=`BOSS LEVEL ${level}`;this.el.style.setProperty('--boss-from',t.from||'#fff7a6');this.el.style.setProperty('--boss-to',t.to||'#ffd21f');this.el.style.setProperty('--boss-glow',t.glow||'#ffc400');this.el.style.setProperty('--boss-particle',t.particle||'#fff4a3');this.lastLevel=level}if(Math.abs(p-this.lastProgress)>.0005){this.fill.style.transform=`scaleX(${p})`;this.lastProgress=p}this.el.dataset.active=bossActive?'true':'false'}
  destroy(){this.el.remove()}
}
window.BossProgressBar=BossProgressBar;
})();