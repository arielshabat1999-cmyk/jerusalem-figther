(()=>{
const defaults={
  schemaVersion:1,
  label:'BOSS LEVEL',
  themes:[
    {from:'#fff7a6',to:'#ffd21f',glow:'#ffc400',particle:'#fff4a3'},
    {from:'#ffe78a',to:'#ffad16',glow:'#ffb000',particle:'#fff1ba'},
    {from:'#fff3b0',to:'#f6c23e',glow:'#f5b800',particle:'#ffffff'},
    {from:'#ffe66b',to:'#ff8f1f',glow:'#ff9d00',particle:'#fff2a6'}
  ]
};
GameConfig.register('bossProgressHud',defaults);
window.BossProgressHudConfig=Object.freeze({
  defaults,
  themeFor(level=1){
    const cfg=GameConfig.get('bossProgressHud')||defaults;
    const themes=Array.isArray(cfg.themes)&&cfg.themes.length?cfg.themes:defaults.themes;
    return themes[(Math.max(1,Math.floor(level))-1)%themes.length];
  }
});
})();