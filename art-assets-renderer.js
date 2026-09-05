'use strict';
// Clean asset-driven rendering layer. The approved atlases are 128px cells,
// but character cells include a little presentation ground at the bottom.
// Crop that material out and render only the actual character artwork.
(function(){
  const A=()=>window.JF_ART;
  const CELL=128;
  const heroCols={idle:0,walk:1,run:2,jump:3,shoot:4,hurt:5};
  const enemyCols={idle:0,walk:1,attack:2,hurt:3,dead:4};

  const obstacles=[];
  const obstacleCells=[0,2,3,5]; // clean crate / red barrel / wood barrel / rocks only
  for(let i=0;i<20;i++){
    const base=i*630;
    obstacles.push({x:base+185,y:0,w:46,h:42,cell:obstacleCells[i%obstacleCells.length]});
    if(i%3===1)obstacles.push({x:base+405,y:0,w:42,h:40,cell:obstacleCells[(i+1)%obstacleCells.length]});
  }
  window.JF_OBSTACLES=obstacles;

  function drawCell(img,col,row,x,y,w,h,flip=false,crop=null){
    if(!img||!img.complete||!img.naturalWidth)return false;
    let sx=col*CELL,sy=row*CELL,sw=CELL,sh=CELL;
    if(crop){sx+=crop.l||0;sy+=crop.t||0;sw-=((crop.l||0)+(crop.r||0));sh-=((crop.t||0)+(crop.b||0));}
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(img,sx,sy,sw,sh,0,0,w,h)}
    else ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
    ctx.restore();return true;
  }

  function posePlayer(){
    if(p.hit>0)return'hurt';
    if(clock-p.lastShot<.14)return'shoot';
    if(!p.grounded)return'jump';
    if(Math.abs(p.vx)>8)return Math.floor(clock*8)%2?'run':'walk';
    return'idle';
  }
  function poseEnemy(e){
    if(e.state==='down'||e.state==='fall')return'dead';
    if(e.hit>0||e.state==='hit')return'hurt';
    if(e.state==='tele')return'attack';
    if(Math.abs(e.x-p.x)>150)return'walk';
    return'idle';
  }

  // No old placeholder skyline underneath the approved background.
  drawBackground=function(){
    const art=A();
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#55ace0');sky.addColorStop(.55,'#bcdde4');sky.addColorStop(1,'#e6cf9e');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    if(art&&art.bgReady){
      // Use only the bright day portion of the wide approved Jerusalem panorama.
      const srcW=Math.floor(art.bg.naturalWidth*.67),srcH=art.bg.naturalHeight;
      const dh=Math.max(390,H*.57),dw=dh*(srcW/srcH),y=Math.max(120,ground-dh+25);
      const shift=(cam*.055)%dw;
      ctx.save();ctx.imageSmoothingEnabled=true;
      for(let x=-shift-dw;x<W+dw;x+=dw)ctx.drawImage(art.bg,0,0,srcW,srcH,x,y,dw,dh);
      const haze=ctx.createLinearGradient(0,y,0,ground);haze.addColorStop(0,'rgba(255,255,255,.02)');haze.addColorStop(1,'rgba(235,215,175,.18)');ctx.fillStyle=haze;ctx.fillRect(0,y,W,dh);ctx.restore();
    }else{
      // Clean fallback only; deliberately no blocky placeholder buildings.
      ctx.fillStyle='rgba(255,237,181,.62)';ctx.beginPath();ctx.arc(W*.82,H*.20,36,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(93,119,109,.22)';for(let i=0;i<7;i++){const x=i*95-(cam*.04)%95;ctx.beginPath();ctx.moveTo(x,ground-120);ctx.lineTo(x+12,ground-235-(i%2)*40);ctx.lineTo(x+24,ground-120);ctx.fill();}
    }
  };

  function stoneWall(x,y,w,h){
    ctx.fillStyle='#c7a76c';ctx.fillRect(x,y,w,h);
    const bw=54,bh=25;ctx.strokeStyle='rgba(75,54,31,.34)';ctx.lineWidth=1;
    for(let r=0,yy=y;yy<y+h;r++,yy+=bh){for(let xx=x-(r%2?bw/2:0);xx<x+w;xx+=bw){ctx.strokeRect(xx+.5,yy+.5,bw,bh);ctx.fillStyle='rgba(255,241,203,.11)';ctx.fillRect(xx+3,yy+3,bw-7,2)}}
    ctx.fillStyle='rgba(50,34,20,.13)';ctx.fillRect(x+w-8,y,8,h);
  }
  function cleanBuilding(b){
    stoneWall(b.x,b.y,b.w,b.h);
    ctx.fillStyle='#9b7949';ctx.fillRect(b.x,b.y,b.w,7);
    for(let xx=b.x;xx<b.x+b.w;xx+=50){ctx.fillStyle='#d3b679';ctx.fillRect(xx,b.y-17,42,17)}
    const count=Math.max(2,Math.floor(b.w/100));
    for(let i=0;i<count;i++){
      const wx=b.x+25+i*((b.w-65)/count),wy=b.y+48+(i%2)*8;
      ctx.fillStyle='#3f3931';ctx.beginPath();ctx.roundRect(wx,wy,37,55,5);ctx.fill();
      ctx.fillStyle='#79a9bd';ctx.fillRect(wx+5,wy+7,27,40);ctx.fillStyle='rgba(239,250,250,.22)';ctx.fillRect(wx+7,wy+9,8,36);
    }
    // Warm wall lamp every other facade.
    if(b.variant%2===0){const lx=b.x+b.w-34,ly=b.y+112;const g=ctx.createRadialGradient(lx,ly,2,lx,ly,34);g.addColorStop(0,'rgba(255,216,105,.42)');g.addColorStop(1,'rgba(255,190,55,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(lx,ly,34,0,Math.PI*2);ctx.fill();ctx.fillStyle='#302a23';ctx.fillRect(lx-7,ly-12,14,20);ctx.fillStyle='#ffd66d';ctx.fillRect(lx-4,ly-8,8,11)}
  }

  // Build a single coherent foreground instead of drawing old + new layers together.
  drawWorld=function(){
    stoneWall(0,ground,WORLD,125);
    for(const b of buildings)cleanBuilding(b);
    for(const d of doors)drawDoor(d);
    for(const s of stairs)drawStairs(s);
    const art=A();if(!(art&&art.propsReady))return;
    for(const o of obstacles){
      o.y=ground-o.h;const col=o.cell%5,row=Math.floor(o.cell/5);
      drawCell(art.props,col,row,o.x,o.y,o.w,o.h,false,{l:3,r:3,t:4,b:4});
    }
    // Decorative plants are intentionally behind gameplay objects and use only clean cells.
    const deco=[11,12,13,14];
    for(let i=0;i<20;i++){
      const cell=deco[i%deco.length],col=cell%5,row=Math.floor(cell/5),x=i*630+72;
      const tall=cell>=13;drawCell(art.props,col,row,x,ground-(tall?92:64),tall?55:58,tall?92:64,false,{l:2,r:2,t:2,b:2});
    }
  };

  const fallbackPlayer=drawPlayer;
  drawPlayer=function(){
    const art=A();if(!(art&&art.charsReady))return fallbackPlayer();
    const pose=posePlayer(),row=save.gender==='female'?1:0,col=heroCols[pose]??0;
    // Crop away transparent margins and the green display strip baked into each presentation cell.
    const crop={l:7,r:7,t:5,b:19};
    const feet=p.y+p.h,h=p.crouch?72:88,w=h*.92,x=p.x+p.w/2-w/2,y=feet-h;
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(p.x+p.w/2,feet+2,16,3.5,0,0,Math.PI*2);ctx.fill();
    ctx.save();if(p.hit>0&&Math.floor(p.hit*35)%2===0)ctx.globalAlpha=.5;drawCell(art.chars,col,row,x,y,w,h,p.facing<0,crop);ctx.restore();
    drawHealth(p.x-4,p.y-12,p.w+8,5,p.hp,p.maxHp);
  };

  const fallbackEnemy=drawEnemy;
  drawEnemy=function(e){
    if(e.state==='gone')return;const art=A();if(!(art&&art.charsReady))return fallbackEnemy(e);
    const row=e.type==='heavy'?3:e.type==='skilled'?4:2,col=enemyCols[poseEnemy(e)]??0;
    const scale=e.type==='heavy'?1.08:1,h=78*scale,w=h*.92,feet=e.y+e.h,x=e.x+e.w/2-w/2,y=feet-h;
    ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.ellipse(e.x+e.w/2,feet+2,14*scale,3,0,0,Math.PI*2);ctx.fill();
    ctx.save();if(e.hit>0)ctx.globalAlpha=.55;drawCell(art.chars,col,row,x,y,w,h,e.dir<0,{l:6,r:6,t:5,b:18});ctx.restore();
    if(e.state!=='down'&&e.state!=='fall')drawHealth(e.x,e.y-8,e.w,5,e.hp,e.maxHp);
  };

  // Real collision against the visible obstacle bounds. A proper jump clears them.
  const baseUpdatePlayer=updatePlayer;
  updatePlayer=function(d){
    const oldX=p.x;baseUpdatePlayer(d);const bottom=p.y+p.h;
    for(const o of obstacles){o.y=ground-o.h;const overlap=p.x+p.w>o.x+8&&p.x<o.x+o.w-8;const blocked=overlap&&bottom>o.y+10&&p.y<ground-8;if(blocked){p.x=oldX;p.vx=0;break}}
  };
})();
