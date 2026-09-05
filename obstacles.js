'use strict';
let stageObstacles=[];
(function(){
  function rebuildObstacles(){
    stageObstacles=[];
    const start=(stageEntryDoor?stageEntryDoor.x:80)+620,end=(stageExitDoor?stageExitDoor.x:stageEndX)-380;
    if(end<=start)return;
    const spacing=Math.max(520,760-stage*22);let i=0;
    for(let x=start;x<end;x+=spacing+(i%3)*95,i++){
      const kind=i%5===1?'barrel':i%5===3?'stone':'crate';
      const w=kind==='crate'?48:kind==='barrel'?36:58,h=kind==='crate'?43:kind==='barrel'?46:34;
      stageObstacles.push({x:x+(i%2)*70,y:ground-h,w,h,kind,hp:kind==='crate'?2:kind==='barrel'?3:999,dead:false});
      if(stage>=4&&i%4===2&&x+180<end)stageObstacles.push({x:x+145,y:ground-31,w:45,h:31,kind:'smallcrate',hp:1,dead:false});
    }
  }
  const prevBuild=buildWorld,prevReset=resetStage,prevPlayer=updatePlayer,prevProjectiles=updateProjectiles;
  buildWorld=function(){prevBuild();rebuildObstacles()};
  resetStage=function(full){prevReset(full);rebuildObstacles()};
  updatePlayer=function(d){
    const oldX=p.x;prevPlayer(d);
    for(const o of stageObstacles){if(o.dead)continue;const highEnough=(p.y+p.h)<=o.y+8;if(highEnough)continue;const overlap=p.x+p.w>o.x&&p.x<o.x+o.w&&p.y+p.h>o.y+5;if(!overlap)continue;
      if(p.x>oldX)p.x=o.x-p.w-1;else if(p.x<oldX)p.x=o.x+o.w+1;
      p.vx=0;
    }
  };
  function breakObstacle(o,b){
    if(o.hp>=999)return false;o.hp-=b.rpg?99:1;if(o.hp>0)return true;o.dead=true;
    fx.push({kind:'spark',x:o.x+o.w/2,y:o.y+o.h/2,t:.28});
    for(let n=0;n<5;n++)fx.push({kind:'debris',x:o.x+o.w/2+rand(-12,12),y:o.y+rand(4,o.h-4),t:.42,vx:rand(-80,80),vy:rand(-150,-55)});
    if(Math.random()<.45)drops.push({x:o.x+o.w/2,y:o.y,vy:-105,value:5,t:7});return true;
  }
  updateProjectiles=function(d){
    prevProjectiles(d);
    for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];for(const o of stageObstacles){if(o.dead||o.hp>=999)continue;if(b.x>o.x&&b.x<o.x+o.w&&b.y>o.y&&b.y<o.y+o.h){breakObstacle(o,b);bullets.splice(i,1);break}}}
  };
  const prevFx=updateFx;
  updateFx=function(d){for(const f of fx){if(f.kind==='debris'){f.vy=(f.vy||0)+480*d;f.x+=(f.vx||0)*d;f.y+=(f.vy||0)*d}}prevFx(d)};
  rebuildObstacles();
})();