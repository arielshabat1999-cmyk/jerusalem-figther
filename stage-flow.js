'use strict';
let stageEntryDoor=null,stageExitDoor=null,stageEndX=2600,exitUnlocked=false,entryT=0,exitT=0;
const STAGE_LENGTHS=[0,2300,2900,3550,4250,5000,5850,6750,7700,8750,9900];
(function(){
  const coreBuildWorld=buildWorld,coreResetStage=resetStage,coreUpdatePlayer=updatePlayer,coreChooseSpawn=chooseSpawn,coreDrawDoor=drawDoor,coreUpdateDoors=updateDoors;
  function configureStageDoors(){
    stageEndX=Math.min(WORLD-500,STAGE_LENGTHS[stage]||9900);stageEntryDoor=doors[0]||null;let best=null,bestD=Infinity;
    for(const d of doors){const dd=Math.abs(d.x-stageEndX);if(dd<bestD){bestD=dd;best=d}}stageExitDoor=best;
    if(stageEntryDoor){stageEntryDoor.role='entry';stageEntryDoor.state='opening';stageEntryDoor.t=.55}
    if(stageExitDoor){stageExitDoor.role='exit';stageExitDoor.state='closed';stageExitDoor.t=0;stageEndX=stageExitDoor.x+stageExitDoor.w/2}
    exitUnlocked=false;entryT=.95;exitT=0;
  }
  buildWorld=function(){coreBuildWorld();configureStageDoors()};
  resetStage=function(full){coreResetStage(full);configureStageDoors();if(stageEntryDoor){p.x=stageEntryDoor.x+stageEntryDoor.w*.42;p.y=ground-p.h;p.vx=p.vy=0;p.facing=1;cam=0}toast('STAGE '+stage+' • צא מהדלת והתקדם')};
  chooseSpawn=function(){
    const minX=(stageEntryDoor?stageEntryDoor.x:0)+420,maxX=(stageExitDoor?stageExitDoor.x:stageEndX)-260;
    const visible=spawnPoints.filter(sp=>sp.x>=minX&&sp.x<=maxX&&sp.x>cam+W*.68&&sp.x<cam+W+470&&Math.abs(sp.x-p.x)>190),ahead=spawnPoints.filter(sp=>sp.x>=Math.max(minX,p.x+210)&&sp.x<=Math.min(maxX,p.x+900));
    const all=visible.length?visible:ahead;if(!all.length)return coreChooseSpawn();const sd=stages[stage];let pool=all.filter(sp=>sp.type==='roof'?(Math.random()<sd.roof):true);if(!pool.length)pool=all;return pool[Math.floor(Math.random()*pool.length)]
  };
  stageClear=function(){if(stageChanging||exitUnlocked)return;exitUnlocked=true;enemyBullets.length=0;if(stageExitDoor){stageExitDoor.state='open';stageExitDoor.t=999}toast('הדרך נקייה • הגע לדלת היציאה')};
  updateDoors=function(d){coreUpdateDoors(d);if(exitUnlocked&&stageExitDoor){stageExitDoor.state='open';stageExitDoor.t=999}};
  function finishThroughDoor(){
    if(stageChanging)return;stageChanging=true;paused=true;exitT=.65;if(stageExitDoor){stageExitDoor.state='open';stageExitDoor.t=999}
    setTimeout(()=>{if(stage>=10){save.highScore=Math.max(save.highScore,score);persist();$('winScore').textContent=score;ui.win.classList.add('show');return}stage++;ui.stageTitle.textContent='STAGE '+stage;ui.stageSub.textContent=stages[stage].sub+' • מסלול ארוך יותר';ui.stageCard.classList.add('show');setTimeout(()=>{ui.stageCard.classList.remove('show');resetStage(false);paused=false;stageChanging=false},1450)},650)
  }
  updatePlayer=function(d){
    if(entryT>0){entryT-=d;p.vx=95;p.facing=1;p.x+=p.vx*d;p.y=ground-p.h;p.vy=0;p.grounded=true;const target=clamp(p.x-W*.30,0,Math.max(0,stageEndX-W));cam+=(target-cam)*Math.min(1,d*7);return}
    coreUpdatePlayer(d);p.x=clamp(p.x,(stageEntryDoor?stageEntryDoor.x+18:0),stageEndX+75);const maxCam=Math.max(0,stageEndX-W*.72);if(cam>maxCam)cam=maxCam;if(exitUnlocked&&stageExitDoor&&Math.abs((p.x+p.w/2)-(stageExitDoor.x+stageExitDoor.w/2))<48&&p.grounded)finishThroughDoor()
  };
  drawDoor=function(d){
    coreDrawDoor(d);if(d!==stageEntryDoor&&d!==stageExitDoor)return;const isExit=d===stageExitDoor;ctx.save();ctx.fillStyle='rgba(15,18,18,.82)';ctx.fillRect(d.x-5,d.y-30,d.w+10,22);ctx.strokeStyle=isExit?(exitUnlocked?'#e9c75b':'#6e6b60'):'#d8c18a';ctx.lineWidth=2;ctx.strokeRect(d.x-4,d.y-29,d.w+8,20);ctx.fillStyle=isExit?(exitUnlocked?'#fff0a3':'#aaa89f'):'#f1dfb0';ctx.font='700 10px -apple-system,Arial';ctx.textAlign='center';ctx.fillText(isExit?(exitUnlocked?'יציאה':'נעול'):'התחלה',d.x+d.w/2,d.y-15);if(isExit&&exitUnlocked){const g=ctx.createRadialGradient(d.x+d.w/2,d.y+d.h*.55,4,d.x+d.w/2,d.y+d.h*.55,70);g.addColorStop(0,'rgba(255,220,100,.22)');g.addColorStop(1,'rgba(255,220,100,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(d.x+d.w/2,d.y+d.h*.55,70,0,Math.PI*2);ctx.fill()}ctx.restore()
  };
  configureStageDoors();
})();