(()=>{
let bar=null,offs=[];
function stateFromAuthority(){
  const b=window.SpawnDirector?.bossProgressSnapshot?.()||{progress:0,bossLevel:1,bossActive:false};
  return Object.freeze({
    progress:Math.max(0,Math.min(1,Number(b.progress)||0)),
    bossLevel:Math.max(1,Math.floor(Number(b.bossLevel)||1)),
    bossActive:!!b.bossActive,
    theme:window.BossProgressHudConfig?.themeFor?.(b.bossLevel)||null
  });
}
function visible(){try{return !!RunCommands.snapshot()?.active||AppFlowSystem?.snapshot?.().state==='playing'}catch{return false}}
function render(){if(!bar)return;bar.el.style.display=visible()?'block':'none';if(visible())bar.update(stateFromAuthority())}
const system={
  id:'boss-progress-hud',
  dependsOn:['spawn-director','run'],
  start(){
    bar=new BossProgressBar().mount(document.body);
    bar.el.style.display='none';
    offs.push(GameEvents.on('presentation:frame',render));
    ['run:started','run:ended','spawn:boss-wave','boss:phase-started','boss:phase-ended','boss:progress-reset','app-flow:changed'].forEach(name=>offs.push(GameEvents.on(name,render)));
    render();
  },
  stop(){offs.splice(0).forEach(off=>off?.());bar?.destroy();bar=null},
  snapshot:stateFromAuthority,
  render
};
GameSystems.register(system);
window.BossProgressHudSystem=system;
})();