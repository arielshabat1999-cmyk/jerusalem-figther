'use strict';
(function(){
  function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
  function limb(x1,y1,x2,y2,w,col){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  function drawFighter(cx,feet,dir,kind,pose,scale=1){
    const run=pose==='run', crouch=pose==='crouch', jump=pose==='jump';
    const bob=run?Math.sin(clock*12)*2:0, stride=run?Math.sin(clock*12)*9:0;
    const pal=kind==='playerF'?{shirt:'#2d6fa5',vest:'#173b59',pants:'#26313a',skin:'#d7a476',head:'#c8d1d7',accent:'#f0b74e'}:
      kind==='playerM'?{shirt:'#2d6fa5',vest:'#173b59',pants:'#26313a',skin:'#c99369',head:'#e5e7e6',accent:'#f0b74e'}:
      kind==='heavy'?{shirt:'#6a4f4b',vest:'#2d2525',pants:'#2c2d2e',skin:'#b98663',head:'#554a45',accent:'#b94f3e'}:
      kind==='fast'?{shirt:'#466c54',vest:'#253a2c',pants:'#25312a',skin:'#b98561',head:'#3a5545',accent:'#d3a84b'}:
      kind==='skilled'?{shirt:'#405a76',vest:'#24364a',pants:'#252d35',skin:'#bd8b67',head:'#394b5c',accent:'#d0b05a'}:
      {shirt:'#5b6048',vest:'#303528',pants:'#2d3028',skin:'#bd8a66',head:'#4a4c3b',accent:'#c8a858'};
    ctx.save();ctx.translate(cx,feet);ctx.scale(dir*scale,scale);
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,4,18,4,0,0,Math.PI*2);ctx.fill();
    const hipY=crouch?-29:-37+bob, shoulderY=crouch?-54:-72+bob, headY=crouch?-69:-90+bob;
    limb(-5,hipY,-8-stride*.45,-5,10,pal.pants);limb(6,hipY,9+stride*.45,-5,10,pal.pants);
    ctx.fillStyle=pal.shirt;rr(-16,shoulderY,32,crouch?28:36,7);ctx.fill();
    ctx.fillStyle=pal.vest;rr(-13,shoulderY+5,26,crouch?22:30,5);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(-10,shoulderY+9,20,3);
    limb(-12,shoulderY+11,-25,shoulderY+25,8,pal.shirt);limb(11,shoulderY+10,25,shoulderY+22,8,pal.shirt);
    ctx.fillStyle=pal.skin;ctx.beginPath();ctx.arc(0,headY,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=pal.head;ctx.beginPath();ctx.arc(0,headY-4,12,Math.PI,0);ctx.lineTo(11,headY);ctx.lineTo(-11,headY);ctx.closePath();ctx.fill();
    if(kind==='playerF'){ctx.fillStyle='#3b2f29';ctx.fillRect(-9,headY-2,18,7)}
    ctx.fillStyle='#20252a';ctx.fillRect(24,shoulderY+18,29,5);ctx.fillRect(43,shoulderY+16,9,9);ctx.fillStyle=pal.accent;ctx.fillRect(29,shoulderY+19,5,2);
    if(jump){ctx.rotate(-.05)}
    ctx.restore();
  }

  drawBackground=function(){
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#78b8dc');g.addColorStop(.5,'#cfe5e7');g.addColorStop(1,'#e6cda0');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,229,151,.72)';ctx.beginPath();ctx.arc(W*.80,H*.16,34,0,Math.PI*2);ctx.fill();
    const far=(cam*.10)%180;for(let i=-2;i<8;i++){const x=i*180-far;ctx.fillStyle=i%2?'rgba(154,139,113,.26)':'rgba(182,163,128,.30)';ctx.fillRect(x,ground-250-(i%3)*28,150,190+(i%3)*28)}
    const mid=(cam*.22)%250;for(let i=-2;i<7;i++){const x=i*250-mid;ctx.fillStyle='#cfb783';ctx.fillRect(x,ground-180,210,180);ctx.fillStyle='#8ea0a3';for(let k=0;k<3;k++)ctx.fillRect(x+28+k*58,ground-145,22,35);ctx.fillStyle='#b59a69';ctx.fillRect(x+75,ground-75,54,75)}
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,ground-110,W,110);
  };

  drawBuilding=function(b){
    ctx.fillStyle='#d8bd83';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle='#a98d5d';ctx.lineWidth=1;
    for(let yy=b.y;yy<b.y+b.h;yy+=24){const off=((yy-b.y)/24)%2?28:0;for(let xx=b.x-off;xx<b.x+b.w;xx+=56)ctx.strokeRect(xx,yy,56,24)}
    ctx.fillStyle='#b49664';ctx.fillRect(b.x,b.y,b.w,8);
    for(let xx=b.x;xx<b.x+b.w;xx+=50){ctx.fillStyle='#d4b779';ctx.fillRect(xx,b.y-18,44,18)}
    const cols=Math.max(2,Math.floor(b.w/90));for(let i=0;i<cols;i++){const wx=b.x+28+i*(b.w-56)/cols;ctx.fillStyle='#4f473e';rr(wx,b.y+42,34,52,3);ctx.fill();ctx.fillStyle='#8bb0bd';ctx.fillRect(wx+5,b.y+48,24,37);ctx.strokeStyle='#3e3934';ctx.beginPath();ctx.moveTo(wx+17,b.y+48);ctx.lineTo(wx+17,b.y+85);ctx.stroke()}
    if(b.variant===1){ctx.fillStyle='#69452e';ctx.fillRect(b.x+b.w*.33,b.y+118,82,10);ctx.fillStyle='#b76338';ctx.beginPath();ctx.moveTo(b.x+b.w*.31,b.y+128);ctx.lineTo(b.x+b.w*.67,b.y+128);ctx.lineTo(b.x+b.w*.61,b.y+148);ctx.lineTo(b.x+b.w*.37,b.y+148);ctx.closePath();ctx.fill()}
    if(b.variant===2){ctx.fillStyle='#5e7d43';for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(b.x+b.w-26-i*6,b.y+20+i*9,7,0,Math.PI*2);ctx.fill()}}
    ctx.fillStyle='rgba(63,45,28,.16)';ctx.fillRect(b.x+b.w-7,b.y,7,b.h);
  };

  drawStairs=function(s){
    const n=10,sw=s.w/n,r=(s.y1-s.y0)/n;ctx.save();ctx.fillStyle='#c9aa72';ctx.beginPath();ctx.moveTo(s.x,s.y0+4);ctx.lineTo(s.x+s.w,s.y1+4);ctx.lineTo(s.x+s.w,ground);ctx.lineTo(s.x,ground);ctx.closePath();ctx.fill();
    for(let i=0;i<n;i++){const sy=s.y0+r*i,sx=s.x+sw*i;ctx.fillStyle=i%2?'#d5b980':'#c9ab73';ctx.fillRect(sx,Math.min(sy,sy+r)-5,sw+2,Math.abs(r)+9);ctx.strokeStyle='rgba(92,67,41,.35)';ctx.strokeRect(sx,Math.min(sy,sy+r)-5,sw+2,Math.abs(r)+9)}
    ctx.strokeStyle='#7c6547';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.x,s.y0-13);ctx.lineTo(s.x+s.w,s.y1-13);ctx.stroke();ctx.restore();
  };

  drawPlayer=function(){const crouch=p.crouch&&p.grounded,jump=!p.grounded,run=Math.abs(p.vx)>1&&p.grounded;const pose=crouch?'crouch':jump?'jump':run?'run':'idle';ctx.save();if(p.hit>0&&Math.floor(p.hit*35)%2===0)ctx.globalAlpha=.45;drawFighter(p.x+p.w/2,p.y+p.h,p.facing,save.gender==='female'?'playerF':'playerM',pose,1);ctx.restore();drawHealth(p.x-5,p.y-15,p.w+10,6,p.hp,p.maxHp)};
  drawEnemy=function(e){if(e.state==='gone')return;const down=e.state==='down',fall=e.state==='fall';ctx.save();const cx=e.x+e.w/2,feet=e.y+e.h;ctx.translate(cx,feet);if(fall)ctx.rotate(-e.dir*.75);if(down)ctx.rotate(-e.dir*1.35);ctx.translate(-cx,-feet);if(e.hit>0)ctx.globalAlpha=.5;drawFighter(cx,feet,e.dir,e.type,'idle',e.type==='heavy'?1.08:.92);ctx.restore();if(!down)drawHealth(e.x,e.y-10,e.w,5,e.hp,e.maxHp)};
})();
