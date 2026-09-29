(()=>{
let hud=null,toastTimer=null;
const q=s=>hud?.querySelector(s);
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
function railgunState(){
  const ui=GameState.get().ui||{},s=ui.railgunState||'READY';
  return ['READY','DEPLOY','ACTIVE','COOLDOWN'].includes(s)?s:'READY';
}
function render(){
  if(!hud)return;
  const r=RunCommands.snapshot()||{},eco=EconomySystem.snapshot?.()||{balances:{}},p=player();
  const hp=p?.health,shield=p?.data?.shield;
  q('[data-v="player-level"]').textContent=permanentLevel();
  q('[data-v="evolution"]').textContent=r.level||1;
  q('[data-v="time"]').textContent=fmtTime(r.time||0);
  q('[data-v="distance"]').textContent=Math.round(r.distance||0);
  q('[data-v="coins"]').textContent=eco.balances?.coins||0;
  q('[data-v="gems"]').textContent=eco.balances?.gems||0;
  const hpRatio=hp?.max?clamp(hp.current/hp.max):1;
  q('.run-hull-fill').style.transform=`scaleX(${hpRatio})`;
  q('[data-v="hull"]').textContent=hp?`${Math.ceil(hp.current)} / ${Math.ceil(hp.max)}`:'—';
  const shieldCurrent=typeof shield==='object'?shield.current:null,shieldMax=typeof shield==='object'?shield.max:null;
  q('.run-shield-fill').style.transform=`scaleX(${shieldMax?clamp(shieldCurrent/shieldMax):0})`;
  q('[data-v="shield"]').textContent=shieldMax?`${Math.ceil(shieldCurrent)} / ${Math.ceil(shieldMax)}`:'—';
  const state=railgunState(),btn=q('.run-railgun');
  btn.dataset.state=state;btn.className=`run-railgun state-${state.toLowerCase()}`;
  q('.run-railgun-state').textContent=state;
  const cd=GameState.get().ui?.railgunCooldownRemaining;
  q('.run-railgun-cd').textContent=state==='COOLDOWN'&&Number.isFinite(cd)?Math.ceil(cd):'';
}
function toast(text){
  const t=q('.run-toast');if(!t)return;t.textContent=text;t.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2200);
}
function setVisible(on){if(hud)hud.classList.toggle('run-hud-visible',!!on)}
const system={id:'hud',dependsOn:['run','economy','world'],start(){
  const style=document.createElement('style');style.textContent=`
  #run-hud{position:fixed;inset:0;z-index:20;pointer-events:none;color:#effcff;font-family:Inter,system-ui,-apple-system,sans-serif;opacity:0;visibility:hidden;transition:opacity .18s ease}
  #run-hud.run-hud-visible{opacity:1;visibility:visible}
  #run-hud *{box-sizing:border-box}
  .run-top{position:absolute;top:max(10px,env(safe-area-inset-top));left:12px;right:12px;display:grid;grid-template-columns:1fr auto 1fr;align-items:start;gap:8px}
  .run-pill{background:#05111bcc;border:1px solid #28516a;border-radius:12px;backdrop-filter:blur(8px);box-shadow:0 8px 24px #0005,inset 0 1px #ffffff0d}
  .run-progression{justify-self:start;display:flex;overflow:hidden}
  .run-progression>div{min-width:64px;padding:7px 9px;text-align:center}
  .run-progression>div+div{border-left:1px solid #28516a}
  .run-label{display:block;font-size:7px;line-height:1.1;letter-spacing:.14em;font-weight:900;color:#83a8bb}
  .run-progression b{display:block;margin-top:3px;font-size:18px;line-height:1}
  .run-progression .evolution{color:#67e8f9}
  .run-center-stats{justify-self:center;display:flex;gap:12px;padding:7px 11px;text-align:center}
  .run-center-stats b{display:block;font-size:12px;margin-top:2px}
  .run-wallet{justify-self:end;display:flex;gap:5px}
  .run-wallet span{padding:7px 8px;font-size:10px;font-weight:900;white-space:nowrap}
  .run-pause{pointer-events:auto;position:absolute;right:12px;top:calc(max(10px,env(safe-area-inset-top)) + 46px);width:38px;height:38px;border:1px solid #31566d;border-radius:11px;background:#06131dcc;color:#eaffff;font-size:15px;font-weight:900;backdrop-filter:blur(8px)}
  .run-vitals{position:absolute;left:12px;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 4px);width:min(48vw,190px);display:flex;flex-direction:column;gap:7px}
  .run-vital{display:grid;grid-template-columns:42px 1fr;align-items:center;gap:7px}
  .run-vital-head{font-size:7px;font-weight:900;letter-spacing:.12em;color:#b9d3df}
  .run-vital-head b{display:block;margin-top:2px;font-size:8px;color:#fff;letter-spacing:0}
  .run-bar{height:8px;border:1px solid #2b485a;background:#02070cbb;border-radius:999px;overflow:hidden}
  .run-bar i{display:block;width:100%;height:100%;transform-origin:left center;transition:transform .12s linear}
  .run-hull-fill{background:linear-gradient(90deg,#ef4444,#fb7185)}
  .run-shield-fill{background:linear-gradient(90deg,#0ea5e9,#67e8f9)}
  .run-railgun{pointer-events:auto;position:absolute;right:15px;bottom:calc(max(16px,env(safe-area-inset-bottom)) + 2px);width:76px;height:76px;border-radius:50%;border:2px solid #67e8f9;background:radial-gradient(circle at 50% 38%,#164e63,#06111b 70%);color:#eaffff;box-shadow:0 0 20px #22d3ee55,inset 0 0 18px #22d3ee33;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900}
  .run-railgun-icon{font-size:22px;line-height:1}.run-railgun-name{font-size:8px;letter-spacing:.08em;margin-top:2px}.run-railgun-state{font-size:6px;color:#67e8f9;margin-top:2px}.run-railgun-cd{position:absolute;font-size:22px}
  .run-railgun.state-deploy{transform:scale(.96);box-shadow:0 0 28px #67e8f988,inset 0 0 24px #67e8f955}
  .run-railgun.state-active{background:radial-gradient(circle,#eaffff,#0891b2 45%,#06111b 75%);box-shadow:0 0 38px #67e8f9aa}
  .run-railgun.state-cooldown{filter:saturate(.25);opacity:.62;border-color:#526878;box-shadow:none}
  .run-toast{position:absolute;left:50%;top:16%;transform:translate(-50%,-6px);padding:9px 13px;border:1px solid #67e8f966;border-radius:12px;background:#06101aee;font-size:10px;font-weight:900;letter-spacing:.08em;opacity:0;transition:.18s}
  .run-toast.show{opacity:1;transform:translate(-50%,0)}
  @media(max-width:360px){.run-top{left:8px;right:8px;gap:5px}.run-progression>div{min-width:54px;padding:6px}.run-center-stats{gap:7px;padding:6px}.run-wallet{gap:3px}.run-wallet span{padding:6px;font-size:9px}.run-vitals{left:9px}.run-railgun{right:10px;width:70px;height:70px}}
  `;document.head.appendChild(style);
  hud=document.createElement('div');hud.id='run-hud';hud.innerHTML=`
    <div class="run-top">
      <div class="run-pill run-progression">
        <div><span class="run-label">PLAYER LV</span><b data-v="player-level">1</b></div>
        <div class="evolution"><span class="run-label">EVOLUTION</span><b data-v="evolution">1</b></div>
      </div>
      <div class="run-pill run-center-stats">
        <div><span class="run-label">TIME</span><b data-v="time">0:00</b></div>
        <div><span class="run-label">DISTANCE</span><b data-v="distance">0</b></div>
      </div>
      <div class="run-wallet"><span class="run-pill">◉ <b data-v="coins">0</b></span><span class="run-pill">◆ <b data-v="gems">0</b></span></div>
    </div>
    <button class="run-pause" aria-label="Pause">Ⅱ</button>
    <div class="run-vitals">
      <div class="run-vital"><div class="run-vital-head">HULL<b data-v="hull">—</b></div><div class="run-bar"><i class="run-hull-fill"></i></div></div>
      <div class="run-vital"><div class="run-vital-head">SHIELD<b data-v="shield">—</b></div><div class="run-bar"><i class="run-shield-fill"></i></div></div>
    </div>
    <button class="run-railgun state-ready" aria-label="Railgun"><span class="run-railgun-icon">⌁</span><span class="run-railgun-name">RAILGUN</span><span class="run-railgun-state">READY</span><span class="run-railgun-cd"></span></button>
    <div class="run-toast"></div>`;
  document.body.appendChild(hud);
  q('.run-pause').onclick=()=>GameEvents.emit('ui:pause-requested',{source:'run-hud'});
  q('.run-railgun').onclick=()=>{if(railgunState()==='READY')GameEvents.emit('railgun:activate-requested',{source:'run-hud'})};
  ['run:started','run:time-changed','run:distance-changed','run:level-changed','run:score-changed','economy:balance-changed','combat:damage-applied','combat:entity-healed','railgun:state-changed','state:changed'].forEach(n=>GameEvents.on(n,render));
  GameEvents.on('run:started',()=>{setVisible(true);render()});
  GameEvents.on('run:ended',()=>setVisible(false));
  GameEvents.on('app-flow:changed',e=>{const s=e?.state||AppFlowSystem?.snapshot?.().state;setVisible(s==='playing');render()});
  render();setVisible(AppFlowSystem?.snapshot?.().state==='playing');
},render,toast};
GameSystems.register(system);window.HUDSystem=system;
})();