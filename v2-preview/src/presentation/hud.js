(()=>{
let hud=null,toastTimer=null,pauseOverlay=null;
const q=s=>hud?.querySelector(s);const setText=(s,v)=>{const el=q(s);if(el)el.textContent=v};const setScale=(s,v)=>{const el=q(s);if(el)el.style.transform=`scaleX(${v})`};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
function playerLevelFromLifetimeXP(xp=0){
  xp=Math.max(0,+xp||0);
  let lo=1,hi=2;
  const total=L=>900*(L-1)+(50/3)*(L-1)*L*(L+1);
  while(total(hi)<=xp&&hi<10000)hi*=2;
  while(lo+1<hi){const m=Math.floor((lo+hi)/2);if(total(m)<=xp)lo=m;else hi=m}
  return lo;
}
function fmtTime(seconds=0){seconds=Math.max(0,Math.floor(seconds));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}
function player(){
  const id=window.GameplayLifecycle?.playerId?.();
  return id?WorldSystem.get(id):WorldSystem.listByType?.('player')?.[0]||null;
}
function permanentLevel(){
  const p=GameState.get().progression||{};
  if(Number.isFinite(p.lifetimeXP))return playerLevelFromLifetimeXP(p.lifetimeXP);
  return Number.isFinite(p.playerLevel)?p.playerLevel:1;
}
function railgunState(){return window.RailgunSystem?.snapshot?.().state||'READY'}
function render(){
  if(!hud)return;
  const r=RunCommands.snapshot()||{},eco=EconomySystem.snapshot?.()||{balances:{}},p=player();
  const hp=p?.health,shield=p?.data?.shield;
  setText('[data-v="player-level"]',permanentLevel());
  setText('[data-v="evolution"]',r.level||1);
  setText('[data-v="time"]',fmtTime(r.time||0));
  setText('[data-v="distance"]',Math.round(r.distance||0));
  setText('[data-v="coins"]',eco.balances?.coins||0);
  setText('[data-v="gems"]',eco.balances?.gems||0);
  const hpRatio=hp?.max?clamp(hp.current/hp.max):1;
  setScale('.run-hull-fill',hpRatio);
  setText('[data-v="hull"]',hp?`${Math.ceil(hp.current)} / ${Math.ceil(hp.max)}`:'—');
  const shieldCurrent=typeof shield==='object'?shield.current:null,shieldMax=typeof shield==='object'?shield.max:null;
  setScale('.run-shield-fill',shieldMax?clamp(shieldCurrent/shieldMax):0);
  setText('[data-v="shield"]',shieldMax?`${Math.ceil(shieldCurrent)} / ${Math.ceil(shieldMax)}`:'—');
  const state=railgunState(),btn=q('.run-railgun');
  if(btn){btn.dataset.state=state;btn.className=`run-railgun state-${state.toLowerCase()}`;}
  setText('.run-railgun-state',state);
  const cd=window.RailgunSystem?.snapshot?.().cooldownLeft;
  setText('.run-railgun-cd',state==='COOLDOWN'&&Number.isFinite(cd)?Math.ceil(cd):'');
}
function pauseRun(){if(!runIsActive())return;GameClock.pause('pause-menu');if(pauseOverlay)pauseOverlay.classList.add('show')}
function resumeRun(){GameClock.resume('pause-menu');if(pauseOverlay)pauseOverlay.classList.remove('show')}
function restartRun(){if(pauseOverlay)pauseOverlay.classList.remove('show');GameClock.resume('pause-menu');RunCommands.end({reason:'restart'});AppFlowSystem.replay()}
function quitRun(){if(pauseOverlay)pauseOverlay.classList.remove('show');GameClock.resume('pause-menu');RunCommands.end({reason:'quit'});AppFlowSystem.home()}
function toast(text){
  const t=q('.run-toast');if(!t)return;t.textContent=text;t.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2200);
}
function runIsActive(){try{return !!RunCommands.snapshot()?.active}catch{return false}}function syncVisibility(){setVisible(runIsActive()||AppFlowSystem?.snapshot?.().state==='playing')}function setVisible(on){if(hud)hud.classList.toggle('run-hud-visible',!!on)}
const system={id:'hud',dependsOn:['run','economy','world'],start(){
  const style=document.createElement('style');style.textContent=`
  #run-hud{position:fixed;inset:0;z-index:20;pointer-events:none;color:#fff;font-family:Inter,system-ui,-apple-system,sans-serif;opacity:0;visibility:hidden;transition:opacity .18s ease;text-shadow:0 2px 8px #000}
  #run-hud.run-hud-visible{opacity:1;visibility:visible}
  #run-hud *{box-sizing:border-box}
  .run-top{position:absolute;top:calc(env(safe-area-inset-top) + 22px);left:24px;right:24px;height:118px}
  .run-actions{position:absolute;left:0;top:0;display:flex;gap:22px;align-items:center}
  .run-icon-btn{pointer-events:auto;width:48px;height:48px;padding:0;border:0;background:transparent;color:#fff;display:grid;place-items:center;filter:drop-shadow(0 3px 8px #000);font-size:30px;font-weight:900}
  .run-objectives{font-size:28px}
  .run-center-stats{position:absolute;left:50%;top:0;transform:translateX(-50%);text-align:center;min-width:92px}
  .run-center-stats .time{display:block;font-size:26px;line-height:1;font-weight:900;letter-spacing:-.03em}
  .run-center-stats .distance{display:block;margin-top:8px;font-size:17px;line-height:1;font-weight:800;color:#d8e6ef}
  .run-right{position:absolute;right:0;top:0;width:126px}
  .run-vitals{display:flex;flex-direction:column;gap:10px}
  .run-vital{display:block}
  
  .run-bar{height:12px;background:#102434b8;border-radius:999px;overflow:hidden;box-shadow:0 2px 8px #0008}
  .run-bar i{display:block;width:100%;height:100%;transform-origin:left center;transition:transform .12s linear;border-radius:inherit}
  .run-hull-fill{background:linear-gradient(90deg,#ff4058,#ff7181);box-shadow:0 0 10px #ff405899}
  .run-shield-fill{background:linear-gradient(90deg,#11bdf4,#4de6ff);box-shadow:0 0 10px #22d3ee99}
  .run-wallet{margin:13px 0 0 0;display:flex;flex-direction:column;gap:7px;align-items:flex-end}
  .run-wallet span{display:flex;align-items:center;justify-content:flex-end;gap:8px;font-size:16px;line-height:1;font-weight:900;white-space:nowrap}
  .run-wallet .coin-icon{color:#ffd34e;font-size:17px}.run-wallet .gem-icon{color:#50dcff;font-size:17px}
  .run-railgun{pointer-events:auto;position:absolute;right:26px;bottom:calc(env(safe-area-inset-bottom) + 34px);width:104px;height:104px;border-radius:50%;border:3px solid #58eaff;background:radial-gradient(circle at 50% 42%,#123f58dd,#03111ddd 70%);color:#fff;box-shadow:0 0 24px #22d3ee88,inset 0 0 22px #22d3ee55;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;text-shadow:0 2px 8px #000}
  .run-railgun-icon{font-size:34px;line-height:1}.run-railgun-name{font-size:10px;letter-spacing:.12em;margin-top:4px}.run-railgun-state{font-size:8px;color:#67e8f9;margin-top:3px}.run-railgun-cd{position:absolute;font-size:28px}
  .run-railgun.state-deploy{transform:scale(.96);box-shadow:0 0 34px #67e8f9aa,inset 0 0 28px #67e8f977}
  .run-railgun.state-active{background:radial-gradient(circle,#eaffff,#0891b2 45%,#06111b 75%);box-shadow:0 0 44px #67e8f9cc}
  .run-railgun.state-cooldown{filter:saturate(.25);opacity:.62;border-color:#526878;box-shadow:none}
  .run-toast{position:absolute;left:50%;top:16%;transform:translate(-50%,-6px);padding:9px 13px;border-radius:12px;background:#06101add;font-size:10px;font-weight:900;letter-spacing:.08em;opacity:0;transition:.18s}
  .run-toast.show{opacity:1;transform:translate(-50%,0)}
  #run-pause-overlay{position:fixed;inset:0;z-index:80;display:none;place-items:center;padding:24px;background:#020711b8;backdrop-filter:blur(12px);pointer-events:auto;color:#fff;font-family:Inter,system-ui,-apple-system,sans-serif}
  #run-pause-overlay.show{display:grid}
  .pause-panel{width:min(360px,100%);text-align:center;padding:30px 24px;border:1px solid #ffffff1f;border-radius:24px;background:#07111ee8;box-shadow:0 24px 70px #000a}
  .pause-panel small{font-size:11px;letter-spacing:.22em;color:#7ddfff}.pause-panel h2{margin:8px 0 24px;font-size:34px;letter-spacing:.08em}
  .pause-actions{display:grid;gap:11px}.pause-actions button{height:54px;border-radius:15px;border:1px solid #ffffff20;background:#101d2b;color:#fff;font:800 14px Inter,system-ui;letter-spacing:.08em}.pause-actions .resume{background:#d6a83d;color:#080b10;border-color:#f2cd68}.pause-actions .quit{color:#ff8896}
  @media(max-width:380px){.run-top{left:18px;right:18px}.run-actions{gap:14px}.run-icon-btn{width:42px;height:42px;font-size:27px}.run-right{width:116px}.run-bar{height:10px}.run-wallet{margin-left:29px}.run-wallet span{font-size:14px}.run-center-stats .time{font-size:23px}.run-center-stats .distance{font-size:15px}.run-railgun{right:20px;width:94px;height:94px}}
`;document.head.appendChild(style);
  hud=document.createElement('div');hud.id='run-hud';hud.innerHTML=`
    <div class="run-top">
      <div class="run-actions">
        <button class="run-icon-btn run-pause" aria-label="Pause">Ⅱ</button>
        <button class="run-icon-btn run-objectives" aria-label="Objectives"><span class="checklist-icon">☷</span></button>
      </div>
      <div class="run-center-stats">
        <b class="time" data-v="time">0:00</b>
        <b class="distance" data-v="distance">0</b>
      </div>
      <div class="run-right">
        <div class="run-vitals">
          <div class="run-vital"><div class="run-bar"><i class="run-hull-fill"></i></div></div>
          <div class="run-vital"><div class="run-bar"><i class="run-shield-fill"></i></div></div>
        </div>
        <div class="run-wallet">
          <span><i class="coin-icon">●</i><b data-v="coins">0</b></span>
          <span><i class="gem-icon">◆</i><b data-v="gems">0</b></span>
        </div>
      </div>
    </div>
    <span data-v="player-level" hidden>1</span><span data-v="evolution" hidden>1</span><span data-v="hull" hidden>—</span><span data-v="shield" hidden>—</span>
    <button class="run-railgun state-ready" aria-label="Railgun"><span class="run-railgun-icon">ϟ</span><span class="run-railgun-name">RAILGUN</span><span class="run-railgun-state">READY</span><span class="run-railgun-cd"></span></button>
    <div class="run-toast"></div>`;
  document.body.appendChild(hud);
  pauseOverlay=document.createElement('div');pauseOverlay.id='run-pause-overlay';pauseOverlay.innerHTML='<section class="pause-panel"><small>RUN PAUSED</small><h2>PAUSE</h2><div class="pause-actions"><button class="resume" data-pause-action="resume">RESUME</button><button data-pause-action="restart">RESTART RUN</button><button class="quit" data-pause-action="quit">QUIT TO HOME</button></div></section>';document.body.appendChild(pauseOverlay);
  pauseOverlay.addEventListener('click',e=>{const a=e.target.closest('[data-pause-action]')?.dataset.pauseAction;if(a==='resume')resumeRun();else if(a==='restart')restartRun();else if(a==='quit')quitRun()});
  q('.run-pause').onclick=pauseRun;
  q('.run-objectives').onclick=()=>{GameClock.pause('objectives');AppFlowSystem.objectives()};
  q('.run-railgun').onclick=()=>{window.RailgunSystem?.activate?.()};
  ['run:started','run:time-changed','run:distance-changed','run:level-changed','run:score-changed','economy:balance-changed','combat:damage-applied','combat:entity-healed','railgun:state','state:changed'].forEach(n=>GameEvents.on(n,render));
  GameEvents.on('run:started',()=>{setVisible(true);render();requestAnimationFrame(syncVisibility)});
  GameEvents.on('run:ended',()=>{setVisible(false);pauseOverlay?.classList.remove('show')});
  GameEvents.on('app-flow:changed',()=>{syncVisibility();render()});
  render();syncVisibility();setInterval(()=>{if(runIsActive()){syncVisibility();render()}},500);
},render,toast};
GameSystems.register(system);window.HUDSystem=system;
})();