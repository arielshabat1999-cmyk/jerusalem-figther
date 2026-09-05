'use strict';
// Asset-driven art layer. Uses the approved character sheet + environment artwork
// reconstructed by assets/runtime-loader.js. All old canvas art remains fallback only.
(function(){
  const A=()=>window.JF_ART;
  const heroCols={idle:0,walk:1,run:2,jump:3,shoot:4,hurt:5};
  const enemyCols={idle:0,walk:1,attack:2,hurt:3,dead:4};
  const CHAR_COLS=6,CHAR_ROWS=5;
  const PROP_COLS=5,PROP_ROWS=3;
  const obstacles=[];
  for(let i=0;i<20;i++){
    const base=i*630;
    obstacles.push({x:base+165,y:0,w:48,h:46,cell:(i*2)%14});
    if(i%3===1) obstacles.push({x:base+365,y:0,w:42,h:42,cell:1});
    if(i%4===2) obstacles.push({x:base+510,y:0,w:54,h:44,cell:3});
  }
  window.JF_OBSTACLES=obstacles;

  function drawAtlas(img,cols,rows,col,row,x,y,w,h,flip){
    if(!img||!img.complete||!img.naturalWidth)return false;
    const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(img,col*sw,row*sh,sw,sh,0,0,w,h)}
    else ctx.drawImage(img,col*sw,row*sh,sw,sh,x,y,w,h);
    ctx.restore();return true;
  }
  function posePlayer(){
    if(p.hit>0)return'hurt';
    if(!p.grounded)return'jump';
    if(p.crouch)return'idle';
    if(Math.abs(p.vx)>5)return(Math.floor(clock*9)%2)?'run':'walk';
    if(clock-p.lastShot<.12)return'shoot';
    return'idle';
  }
  function poseEnemy(e){
    if(e.state==='down'||e.state==='fall')return'dead';
    if(e.hit>0)return'hurt';
    if(e.state==='tele'||Math.abs((e.fireT||9))<.16)return'attack';
    if(Math.abs(e.x-p.x)>135)return'walk';
    return'idle';
  }

  const fallbackBackground=drawBackground;
  drawBackground=function(){
    const art=A();
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#5aaee2');sky.addColorStop(.62,'#c9e0dc');sky.addColorStop(1,'#e9cf99');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    if(art&&art.bgReady){
      const h=Math.max(250,H*.42),w=h*(art.bg.naturalWidth/art.bg.naturalHeight),y=ground-h+12;
      const shift=(cam*.075)%w;
      ctx.save();ctx.globalAlpha=.95;ctx.imageSmoothingEnabled=true;
      for(let x=-shift-w;x<W+w;x+=w)ctx.drawImage(art.bg,x,y,w,h);
      const haze=ctx.createLinearGradient(0,y,0,ground);haze.addColorStop(0,'rgba(255,255,255,.04)');haze.addColorStop(1,'rgba(231,210,169,.2)');ctx.fillStyle=haze;ctx.fillRect(0,y,W,h);ctx.restore();
    }else fallbackBackground();
  };

  const fallbackPlayer=drawPlayer;
  drawPlayer=function(){
    const art=A(),pose=posePlayer();
    if(!(art&&art.charsReady))return fallbackPlayer();
    const row=save.gender==='female'?1:0,col=heroCols[pose]??0;
    const feet=p.y+p.h,h=96,w=96,x=p.x+p.w/2-w/2,y=feet-h;
    ctx.fillStyle='rgba(0,0,0,.20)';ctx.beginPath();ctx.ellipse(p.x+p.w/2,feet+3,18,4,0,0,Math.PI*2);ctx.fill();
    drawAtlas(art.chars,CHAR_COLS,CHAR_ROWS,col,row,x,y,w,h,p.facing<0);
    drawHealth(p.x-4,p.y-13,p.w+8,5,p.hp,p.maxHp);
  };

  const fallbackEnemy=drawEnemy;
  drawEnemy=function(e){
    if(e.state==='gone')return;const art=A();if(!(art&&art.charsReady))return fallbackEnemy(e);
    const row=e.type==='heavy'?3:e.type==='skilled'?4:2,pose=poseEnemy(e),col=enemyCols[pose]??0;
    const scale=e.type==='heavy'?1.1:1,h=82*scale,w=82*scale,feet=e.y+e.h,x=e.x+e.w/2-w/2,y=feet-h;
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(e.x+e.w/2,feet+2,15*scale,3,0,0,Math.PI*2);ctx.fill();
    drawAtlas(art.chars,CHAR_COLS,CHAR_ROWS,col,row,x,y,w,h,e.dir<0);
    if(e.state!=='down'&&e.state!=='fall')drawHealth(e.x,e.y-9,e.w,5,e.hp,e.maxHp);
  };

  const baseWorld=drawWorld;
  drawWorld=function(){
    baseWorld();const art=A();if(!(art&&art.propsReady))return;
    for(const o of obstacles){o.y=ground-o.h;const cell=o.cell%(PROP_COLS*PROP_ROWS),col=cell%PROP_COLS,row=Math.floor(cell/PROP_COLS);drawAtlas(art.props,PROP_COLS,PROP_ROWS,col,row,o.x,o.y,o.w,o.h,false)}
    // Extra non-colliding environment props for visual richness.
    for(let i=0;i<20;i++){const b=i*630;const deco=[7,10,11,12,13][i%5],col=deco%PROP_COLS,row=Math.floor(deco/PROP_COLS);drawAtlas(art.props,PROP_COLS,PROP_ROWS,col,row,b+70,ground-70,58,68,false)}
  };

  // Make the approved crates/barriers real gameplay obstacles: horizontal movement
  // stops against them on the ground, while a jump clears them normally.
  const baseUpdatePlayer=updatePlayer;
  updatePlayer=function(d){
    const oldX=p.x;baseUpdatePlayer(d);
    const bottom=p.y+p.h;
    for(const o of obstacles){o.y=ground-o.h;const overlap=p.x+p.w>o.x+5&&p.x<o.x+o.w-5;const tooLow=bottom>o.y+8&&p.y<ground-5;if(overlap&&tooLow){p.x=oldX;p.vx=0;break}}
  };
})();
