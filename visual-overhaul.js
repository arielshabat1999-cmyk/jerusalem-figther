'use strict';
(function(){
  function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  function line(x1,y1,x2,y2,w,col){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  function stoneFill(x,y,w,h,base,edge){ctx.fillStyle=base;ctx.fillRect(x,y,w,h);ctx.strokeStyle=edge;ctx.lineWidth=1;const bh=22,bw=52;for(let row=0,yy=y;yy<y+h;row++,yy+=bh){const off=row%2?-bw/2:0;for(let xx=x+off;xx<x+w;xx+=bw){ctx.strokeRect(xx+.5,yy+.5,bw,bh);ctx.fillStyle='rgba(255,255,255,.055)';ctx.fillRect(xx+4,yy+3,Math.max(0,bw-9),2)}}}
  function dome(cx,baseY,r,col){ctx.fillStyle=col;ctx.beginPath();ctx.arc(cx,baseY,r,Math.PI,0);ctx.fill();ctx.fillRect(cx-r,baseY,r*2,7);ctx.strokeStyle='rgba(83,61,30,.35)';ctx.lineWidth=1;for(let a=-.75;a<=.75;a+=.25){ctx.beginPath();ctx.moveTo(cx,baseY-r);ctx.quadraticCurveTo(cx+r*a,baseY-r*.45,cx+r*a*1.2,baseY);ctx.stroke()}ctx.fillStyle='#705734';ctx.fillRect(cx-2,baseY-r-11,4,11);ctx.beginPath();ctx.arc(cx,baseY-r-12,3,0,Math.PI*2);ctx.fill()}
  function cypress(x,y,h){ctx.fillStyle='#3e563a';ctx.beginPath();ctx.moveTo(x,y-h);ctx.quadraticCurveTo(x-15,y-h*.65,x-9,y);ctx.lineTo(x+9,y);ctx.quadraticCurveTo(x+15,y-h*.65,x,y-h);ctx.fill();ctx.fillStyle='#6f5938';ctx.fillRect(x-2,y,4,9)}

  function palette(kind){if(kind==='playerF')return{shirt:'#355e73',vest:'#263844',pants:'#313638',skin:'#d5a177',head:'#49362d',gear:'#a69a73',accent:'#d4b35f'};if(kind==='playerM')return{shirt:'#425d4c',vest:'#2d3931',pants:'#313536',skin:'#c99369',head:'#40352f',gear:'#a89d78',accent:'#d4b35f'};if(kind==='heavy')return{shirt:'#594440',vest:'#332d2a',pants:'#292c2c',skin:'#b98562',head:'#2d2b28',gear:'#796b57',accent:'#b25442'};if(kind==='fast')return{shirt:'#45634d',vest:'#2a392f',pants:'#29322c',skin:'#b88461',head:'#304537',gear:'#7c805c',accent:'#d2a64b'};if(kind==='skilled')return{shirt:'#40576b',vest:'#293642',pants:'#293035',skin:'#bd8a67',head:'#33434e',gear:'#737e84',accent:'#c9ad5c'};return{shirt:'#555a43',vest:'#30342a',pants:'#2b302a',skin:'#bd8965',head:'#424535',gear:'#77745d',accent:'#c7a253'}}
  function drawFighter(cx,feet,dir,kind,pose,scale){
    scale=scale||1;const pal=palette(kind),run=pose==='run',crouch=pose==='crouch',jump=pose==='jump';const phase=Math.sin(clock*13),bob=run?phase*1.4:0,stride=run?phase*7:0;
    ctx.save();ctx.translate(cx,feet);ctx.scale(dir*scale,scale);
    ctx.fillStyle='rgba(15,17,16,.22)';ctx.beginPath();ctx.ellipse(0,4,18,4,0,0,Math.PI*2);ctx.fill();
    const hip=crouch?-28:-35+bob,shoulder=crouch?-51:-65+bob,head=crouch?-67:-84+bob;
    line(-5,hip,-10-stride,-6,8,pal.pants);line(6,hip,10+stride,-6,8,pal.pants);ctx.fillStyle='#181b1a';rr(-16-stride,-9,15,7,2);ctx.fill();rr(2+stride,-9,15,7,2);ctx.fill();
    ctx.fillStyle=pal.shirt;rr(-16,shoulder,32,crouch?28:34,7);ctx.fill();ctx.fillStyle=pal.vest;rr(-13,shoulder+4,26,crouch?22:29,4);ctx.fill();ctx.fillStyle=pal.gear;ctx.fillRect(-11,shoulder+9,7,9);ctx.fillRect(4,shoulder+9,7,9);ctx.fillStyle='rgba(255,255,255,.13)';ctx.fillRect(-10,shoulder+5,20,2);
    line(-12,shoulder+10,-24,shoulder+22,7,pal.shirt);line(10,shoulder+10,22,shoulder+20,7,pal.shirt);line(20,shoulder+20,31,shoulder+18,5,pal.skin);
    ctx.fillStyle=pal.skin;ctx.beginPath();ctx.arc(0,head,11,0,Math.PI*2);ctx.fill();ctx.fillStyle=pal.head;ctx.beginPath();ctx.arc(0,head-4,11,Math.PI,0);ctx.lineTo(10,head-1);ctx.lineTo(-10,head-1);ctx.closePath();ctx.fill();
    if(kind==='playerM'||kind==='playerF'){ctx.strokeStyle=pal.head;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,head+2,8,.1,Math.PI-.1);ctx.stroke()}ctx.fillStyle='#1c2325';ctx.fillRect(4,head-1,2,2);
    ctx.fillStyle='#202527';rr(27,shoulder+15,31,6,2);ctx.fill();ctx.fillStyle='#121718';ctx.fillRect(52,shoulder+13,10,10);ctx.fillStyle=pal.accent;ctx.fillRect(33,shoulder+17,6,2);ctx.fillStyle='#15191a';ctx.fillRect(37,shoulder+20,8,7);
    if(jump){ctx.rotate(-.03)}ctx.restore();
  }

  drawBackground=function(){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#75b8df');sky.addColorStop(.55,'#cae0e0');sky.addColorStop(1,'#e4cda0');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,225,142,.72)';ctx.beginPath();ctx.arc(W*.80,H*.16,34,0,Math.PI*2);ctx.fill();
    const far=(cam*.06)%170;ctx.fillStyle='rgba(113,125,119,.16)';for(let i=-2;i<9;i++){const x=i*170-far,h=50+(i%4)*18;ctx.fillRect(x,ground-315-h,145,h+120)}
    const mid=(cam*.14)%245;for(let i=-2;i<7;i++){const x=i*245-mid,base=ground-110,h=105+(i%3)*28;ctx.fillStyle=i%2?'#bba678':'#c8b383';ctx.fillRect(x,base-h,205,h);ctx.fillStyle='#665a49';for(let k=0;k<3;k++){ctx.fillRect(x+28+k*55,base-h+38,18,28)}if(i%3===0)dome(x+145,base-h,27,'#c8a33d');cypress(x+18,base,72+(i%2)*18)}
    ctx.fillStyle='rgba(244,229,194,.18)';ctx.fillRect(0,ground-115,W,115);
  };

  drawBuilding=function(b){
    stoneFill(b.x,b.y,b.w,b.h,'#cfb277','rgba(115,88,50,.28)');ctx.fillStyle='#ad8d59';ctx.fillRect(b.x,b.y,b.w,7);ctx.fillStyle='rgba(255,255,255,.11)';ctx.fillRect(b.x,b.y+7,b.w,3);
    for(let xx=b.x;xx<b.x+b.w;xx+=48){ctx.fillStyle='#d6bb82';ctx.fillRect(xx,b.y-17,41,17);ctx.strokeStyle='rgba(99,75,44,.27)';ctx.strokeRect(xx+.5,b.y-16.5,40,16)}
    const count=Math.max(2,Math.floor(b.w/92));for(let i=0;i<count;i++){const wx=b.x+25+i*(b.w-54)/count;ctx.fillStyle='#51483c';rr(wx,b.y+40,36,54,4);ctx.fill();ctx.fillStyle='#82a8b6';ctx.fillRect(wx+5,b.y+46,26,40);ctx.fillStyle='rgba(215,239,244,.28)';ctx.fillRect(wx+7,b.y+48,8,36);ctx.strokeStyle='#3d3831';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(wx+18,b.y+46);ctx.lineTo(wx+18,b.y+86);ctx.stroke()}
    if(b.variant===1){ctx.fillStyle='#5b402b';ctx.fillRect(b.x+b.w*.34,b.y+114,82,9);ctx.fillStyle='#b55f37';ctx.beginPath();ctx.moveTo(b.x+b.w*.31,b.y+123);ctx.lineTo(b.x+b.w*.67,b.y+123);ctx.lineTo(b.x+b.w*.61,b.y+145);ctx.lineTo(b.x+b.w*.37,b.y+145);ctx.closePath();ctx.fill();ctx.fillStyle='#7b8b4e';ctx.fillRect(b.x+b.w*.39,b.y+145,5,18)}
    if(b.variant===2){ctx.fillStyle='#536f3e';for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(b.x+b.w-25-i*5,b.y+16+i*8,7,0,Math.PI*2);ctx.fill()}}
    if(b.variant===3){ctx.fillStyle='#775d3d';ctx.fillRect(b.x+18,b.y+b.h-62,48,62);ctx.fillStyle='#2a251f';ctx.beginPath();ctx.arc(b.x+42,b.y+b.h-62,24,Math.PI,0);ctx.fill();ctx.fillRect(b.x+18,b.y+b.h-62,48,62)}
    ctx.fillStyle='rgba(64,46,29,.14)';ctx.fillRect(b.x+b.w-8,b.y,8,b.h);
  };

  drawStairs=function(s){const n=10,sw=s.w/n,r=(s.y1-s.y0)/n;ctx.save();ctx.fillStyle='#b99a64';ctx.beginPath();ctx.moveTo(s.x,s.y0+5);ctx.lineTo(s.x+s.w,s.y1+5);ctx.lineTo(s.x+s.w,ground);ctx.lineTo(s.x,ground);ctx.closePath();ctx.fill();for(let i=0;i<n;i++){const sy=s.y0+r*i,sx=s.x+sw*i,top=Math.min(sy,sy+r)-6;ctx.fillStyle=i%2?'#c9aa71':'#d0b57c';ctx.fillRect(sx,top,sw+2,Math.abs(r)+10);ctx.strokeStyle='rgba(92,68,42,.34)';ctx.strokeRect(sx+.5,top+.5,sw+1,Math.abs(r)+9)}ctx.strokeStyle='#6f5a3e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.x,s.y0-14);ctx.lineTo(s.x+s.w,s.y1-14);ctx.stroke();for(let i=0;i<=4;i++){const t=i/4,x=s.x+s.w*t,y=s.y0+(s.y1-s.y0)*t;line(x,y-15,x,y+5,2,'#6f5a3e')}ctx.restore()};

  drawPlayer=function(){const crouch=p.crouch&&p.grounded,jump=!p.grounded,run=Math.abs(p.vx)>1&&p.grounded,pose=crouch?'crouch':jump?'jump':run?'run':'idle';ctx.save();if(p.hit>0&&Math.floor(p.hit*35)%2===0)ctx.globalAlpha=.45;drawFighter(p.x+p.w/2,p.y+p.h,p.facing,save.gender==='female'?'playerF':'playerM',pose,.92);ctx.restore();drawHealth(p.x-4,p.y-13,p.w+8,5,p.hp,p.maxHp)};
  drawEnemy=function(e){if(e.state==='gone')return;const down=e.state==='down',fall=e.state==='fall';ctx.save();const cx=e.x+e.w/2,feet=e.y+e.h;ctx.translate(cx,feet);if(fall)ctx.rotate(-e.dir*.72);if(down)ctx.rotate(-e.dir*1.35);ctx.translate(-cx,-feet);if(e.hit>0)ctx.globalAlpha=.5;drawFighter(cx,feet,e.dir,e.type,'idle',e.type==='heavy'?1.0:.86);ctx.restore();if(!down)drawHealth(e.x,e.y-9,e.w,5,e.hp,e.maxHp)};
})();
