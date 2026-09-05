'use strict';
(function(){
  let clean=null,cleanFor=null;
  function source(){
    if(!window.JF_ART||!JF_ART.ready||!JF_ART.chars)return null;
    if(cleanFor===JF_ART.chars&&clean)return clean;
    const im=JF_ART.chars,cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const q=cv.getContext('2d',{willReadFrequently:true});q.drawImage(im,0,0);
    try{const data=q.getImageData(0,0,cv.width,cv.height),d=data.data;for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(r<48&&g<58&&b<75&&Math.max(r,g,b)-Math.min(r,g,b)<34)d[i+3]=0}q.putImageData(data,0,0)}catch(_){ }
    clean=cv;cleanFor=im;return clean;
  }
  function cropNorm(nx,ny,nw,nh){const im=source();if(!im)return null;return{x:nx*im.width,y:ny*im.height,w:nw*im.width,h:nh*im.height}}
  const heroFrames={idle:[.004,.055,.105,.185],run:[.165,.055,.105,.185],jump:[.245,.055,.105,.185],shoot:[.326,.055,.105,.185],hurt:[.405,.055,.105,.185]};
  const femaleFrames={idle:[.508,.055,.105,.185],run:[.670,.055,.105,.185],jump:[.750,.055,.105,.185],shoot:[.830,.055,.105,.185],hurt:[.900,.055,.095,.185]};
  const enemyBase={normal:.00,heavy:.337,skilled:.674,fast:.00};
  const enemyOffsets={idle:.018,run:.085,shoot:.153,hurt:.220,dead:.270};
  function drawFrame(frame,cx,feet,dir,dw,dh){const im=source();if(!im||!frame)return false;const s=cropNorm(...frame);ctx.save();ctx.translate(cx,feet);ctx.scale(dir,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(im,s.x,s.y,s.w,s.h,-dw/2,-dh,dw,dh);ctx.restore();return true}
  const fallbackPlayer=drawPlayer,fallbackEnemy=drawEnemy;
  drawPlayer=function(){
    if(!window.JF_ART||!JF_ART.ready){fallbackPlayer();return}
    const firing=clock-p.lastShot<.17,pose=p.hit>0?'hurt':firing?'shoot':!p.grounded?'jump':Math.abs(p.vx)>1?'run':'idle';const set=save.gender==='female'?femaleFrames:heroFrames;const h=p.crouch?72:92,w=h*.92;
    ctx.save();if(p.hit>0&&Math.floor(p.hit*35)%2===0)ctx.globalAlpha=.5;drawFrame(set[pose]||set.idle,p.x+p.w/2,p.y+p.h,p.facing,w,h);ctx.restore();drawHealth(p.x-4,p.y-14,p.w+8,5,p.hp,p.maxHp)
  };
  drawEnemy=function(e){
    if(e.state==='gone')return;if(!window.JF_ART||!JF_ART.ready){fallbackEnemy(e);return}
    const type=e.type in enemyBase?e.type:'normal',base=enemyBase[type];let pose=e.state==='down'||e.state==='fall'?'dead':e.hit>0||e.state==='hit'?'hurt':e.state==='tele'?'shoot':Math.abs(e.x-p.x)>185?'run':'idle';
    const nx=base+enemyOffsets[pose],frame=[nx,.62,.066,.15],h=e.type==='heavy'?88:79,w=h*.9;ctx.save();if(e.hit>0)ctx.globalAlpha=.55;drawFrame(frame,e.x+e.w/2,e.y+e.h,e.dir,w,h);ctx.restore();if(e.state!=='down'&&e.state!=='fall')drawHealth(e.x,e.y-10,e.w,5,e.hp,e.maxHp)
  };
})();