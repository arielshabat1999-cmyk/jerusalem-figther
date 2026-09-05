'use strict';
(function(){
  function ready(){return !!(window.JF_ART&&JF_ART.ready&&JF_ART.props)}
  function prop(sx,sy,sw,sh,x,y,dw,dh){if(!ready())return;const im=JF_ART.props,kx=im.naturalWidth/640,ky=im.naturalHeight/384;ctx.imageSmoothingEnabled=true;ctx.drawImage(im,sx*kx,sy*ky,sw*kx,sh*ky,x,y,dw,dh)}
  function drawObstacleAsset(o){
    if(o.dead)return;
    if(o.kind==='crate')prop(0,0,125,110,o.x-7,o.y-8,o.w+14,o.h+12);
    else if(o.kind==='smallcrate')prop(128,15,112,95,o.x-5,o.y-6,o.w+10,o.h+9);
    else if(o.kind==='barrel')prop(282,8,78,112,o.x-8,o.y-8,o.w+16,o.h+12);
    else if(o.kind==='stone')prop(62,125,96,92,o.x-10,o.y-20,o.w+20,o.h+22);
  }
  const prevWorld=drawWorld;
  drawWorld=function(){
    prevWorld();
    if(ready()){
      for(const o of stageObstacles)drawObstacleAsset(o);
      const start=Math.max(0,Math.floor(cam/630)-1),end=Math.min(20,start+5);
      for(let i=start;i<end;i++){
        const base=i*630;
        if(i%3===0)prop(125,265,100,112,base+330,ground-80,64,76);
        if(i%4===1)prop(385,254,92,130,base+470,ground-108,58,105);
        if(i%5===2)prop(540,255,58,129,base+235,ground-118,40,116);
      }
    }
  };
  const prevFxDraw=drawFx;
  drawFx=function(){
    prevFxDraw();
    for(const f of fx){if(f.kind!=='debris')continue;ctx.save();ctx.translate(f.x,f.y);ctx.rotate((f.x+f.y)*.03);ctx.fillStyle='#76502e';ctx.fillRect(-4,-2,8,4);ctx.fillStyle='#a67b48';ctx.fillRect(-2,-1,4,2);ctx.restore()}
  };
})();