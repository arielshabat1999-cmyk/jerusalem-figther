'use strict';
(function(){
  const CELL=128;
  const HERO_ROW={male:0,female:1};
  const ENEMY_ROW={normal:2,fast:2,heavy:3,skilled:4};
  const HERO_COL={idle:0,walk:1,run:2,jump:3,shoot:4,hurt:5};
  const ENEMY_COL={idle:0,run:1,shoot:2,hurt:3,dead:4};
  function ready(){return !!(window.JF_ART&&JF_ART.ready&&JF_ART.chars)}
  function frame(row,col,cx,feet,dir,dw,dh){
    const im=JF_ART.chars;ctx.save();ctx.translate(cx,feet);ctx.scale(dir,1);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(im,col*CELL,row*CELL,CELL,CELL,-dw/2,-dh,dw,dh);ctx.restore();
  }
  const fallbackPlayer=drawPlayer,fallbackEnemy=drawEnemy;
  drawPlayer=function(){
    if(!ready()){fallbackPlayer();return}
    const firing=clock-p.lastShot<.16;
    const pose=p.hit>0?'hurt':firing?'shoot':!p.grounded?'jump':Math.abs(p.vx)>150?'run':Math.abs(p.vx)>1?'walk':'idle';
    const row=HERO_ROW[save.gender==='female'?'female':'male'],col=HERO_COL[pose]??0;
    const h=p.crouch?74:91,w=h*1.02;
    ctx.save();if(p.hit>0&&Math.floor(p.hit*35)%2===0)ctx.globalAlpha=.48;frame(row,col,p.x+p.w/2,p.y+p.h,p.facing,w,h);ctx.restore();
    drawHealth(p.x-4,p.y-13,p.w+8,5,p.hp,p.maxHp)
  };
  drawEnemy=function(e){
    if(e.state==='gone')return;if(!ready()){fallbackEnemy(e);return}
    const row=ENEMY_ROW[e.type]??2;
    const pose=(e.state==='down'||e.state==='fall')?'dead':(e.hit>0||e.state==='hit')?'hurt':e.state==='tele'?'shoot':Math.abs(e.x-p.x)>185?'run':'idle';
    const col=ENEMY_COL[pose]??0,h=e.type==='heavy'?87:78,w=h*1.02;
    ctx.save();if(e.hit>0)ctx.globalAlpha=.52;frame(row,col,e.x+e.w/2,e.y+e.h,e.dir,w,h);ctx.restore();
    if(e.state!=='down'&&e.state!=='fall')drawHealth(e.x,e.y-9,e.w,5,e.hp,e.maxHp)
  };
})();