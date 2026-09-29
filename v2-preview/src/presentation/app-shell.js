(()=>{let root=null,garageTab='ship',garageMode='categories',garageSelectedId=null,garageConfirmId=null,garageRevealId=null,board='global_score',leaderRows=null,leaderLoading=false,homeLaunching=false;
const tabNames={ship:'SHIPS',color:'PAINT',decal:'LIVERIES / COATINGS',shot:'WEAPON STYLES',background:'BACKGROUNDS'};
function money(){return`<div class="ns-wallet"><span class="coin">◉ ${EconomySystem.balance('coins')}</span><span class="gem">◆ ${EconomySystem.balance('gems')}</span></div>`}
function button(label,action,cls=''){return`<button class="ns-btn ${cls}" data-action="${action}">${label}</button>`}
function itemName(id=''){return id.split('.').slice(1).join(' ').replaceAll('_',' ').toUpperCase()||'UNKNOWN'}
function playerProgress(){const p=window.PlayerProgressionSystem?.snapshot?.()||{};const level=Number(p.playerLevel??p.level??1)||1;const current=Number(p.currentLevelXP??p.levelXP??0)||0;const needed=Math.max(1,Number(p.nextLevelXP??p.levelXPNeeded??900)||900);return{level,current,needed,pct:Math.max(0,Math.min(100,current/needed*100))}}
function rankText(){const r=RankSystem.snapshot?.()||{};if(r.label)return String(r.label).toUpperCase();if(r.name)return String(r.name).toUpperCase();return`RANK ${r.rank||1}`}function equippedShipAsset(){const loadout=CustomizationSystem.loadout?.()||{},shipKey=String(loadout.ship||'ship.nova').split('.').pop();const content=GameConfig.get('content')||{},ship=content.ships?.[shipKey]||content.ships?.starter,asset=content.assets?.[ship?.assetId];return asset?.src||'assets/ships/nova-normal.webp'}function icon(kind){const paths={garage:'M5 19V9l7-5 7 5v10h-5v-6h-4v6H5zm-2 2h18',objectives:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',profile:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8c.5-4 3.1-6 7-6s6.5 2 7 6H5z',leaderboard:'M6 4h3v4H6V4zm9 0h3v7h-3V4zm-4 0h3v10h-3V4zM4 16h16v4H4v-4z'};return`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[kind]||paths.profile}"/></svg>`}
function shell(title,body,back='home'){return`<section class="ns-screen"><header><button class="ns-back" data-action="${back}">‹</button><h2>${title}</h2>${money()}</header>${body}</section>`}
function home(){
 const p=ProfileSystem.snapshot(),progress=playerProgress(),run=RunCommands.snapshot(),continuing=!!run?.active,shipSrc=equippedShipAsset();
 return`<section class="ns-screen ns-home">
   <div class="ns-home-art" aria-hidden="true"><span class="ns-home-nebula"></span><span class="ns-home-planet"></span><span class="ns-home-asteroids"></span><span class="ns-home-stars"></span></div>
   <header class="ns-home-top">
     <button class="ns-settings" aria-label="Settings" data-action="settings"><span>⚙</span></button>
     <button class="ns-player-status" data-action="profile" aria-label="Open player profile">
       <span class="ns-avatar-mini">◈</span>
       <span class="ns-player-copy"><strong>${p.displayName||'PILOT'}</strong><b>LV ${progress.level}</b><small>${rankText()}</small></span>
       <span class="ns-player-xp"><i style="width:${progress.pct}%"></i></span>
     </button>
     ${money()}
   </header>
   <div class="ns-brand" aria-label="Neon Survivor"><strong>NEON</strong><span>SURVIVOR</span></div>
   <div class="ns-hero">
      <div class="ns-orbit ns-orbit-a"></div><div class="ns-orbit ns-orbit-b"></div>
      <div class="ns-hero-glow"></div>
      <img class="ns-hero-ship" src="${shipSrc}" alt="Equipped ship">
      <div class="ns-engine engine-left"></div><div class="ns-engine engine-right"></div>
   </div>
   <div class="ns-primary">${button(continuing?'CONTINUE':'PLAY',continuing?'continue':'play','accent home-play')}</div>
   <nav class="ns-home-nav" aria-label="Main menu">
      <button data-action="garage"><span class="nav-icon">${icon('garage')}</span><b>GARAGE</b></button>
      <button data-action="objectives"><span class="nav-icon">${icon('objectives')}</span><b>OBJECTIVES</b></button>
      <button data-action="profile"><span class="nav-icon">${icon('profile')}</span><b>PROFILE</b></button>
      <button data-action="leaderboard"><span class="nav-icon">${icon('leaderboard')}</span><b>LEADERBOARD</b></button>
   </nav>
 </section>`
}
function garageCategories(){return (GameConfig.get('garage')?.ui?.categories||[]).filter(x=>['ship','color','decal','shot','background'].includes(x.id))}
function garageItems(type){const rarity=GameConfig.get('garage')?.rarityOrder||{};return CustomizationSystem.catalog(type).sort((a,b)=>{const state=v=>v.owned?0:v.eligibility?.met?1:2;return state(a)-state(b)||(rarity[a.rarity]??9)-(rarity[b.rarity]??9)||a.id.localeCompare(b.id)})}
function selectGarageDefault(type){const items=garageItems(type),equipped=items.find(x=>x.equipped);garageSelectedId=(equipped||items[0]||{}).id||null}
function garageRequirement(v){const r=v?.acquisition?.requirement;if(!r)return v?.acquisition?.type==='reward'?'REWARD ITEM':'';if(r.type==='rank')return`REQUIRES RANK ${r.rank}`;if(r.type==='owns')return`REQUIRES ${itemName(r.itemId)}`;return v?.eligibility?.met?'AVAILABLE':'REQUIREMENT LOCKED'}
function garageShipKey(itemId){return ShipUpgradeSystem.shipKeyFromItem(itemId)}
function garageShipMeta(itemId){return GameConfig.get('garage')?.ships?.[garageShipKey(itemId)]||null}
function garageAsset(v){if(v?.type!=='ship')return null;const key=garageShipKey(v.id),content=GameConfig.get('content')||{},asset=content.assets?.[content.ships?.[key]?.assetId];return asset?.src||'assets/ships/nova-normal.webp'}
function garageMainAction(v){if(!v)return'';if(v.equipped)return'<span class="garage-state equipped">EQUIPPED</span>';if(v.owned)return button('EQUIP',`equip:${v.id}`,'garage-action');const p=v.acquisition?.price;if(v.acquisition?.type==='purchase'&&p){if(!v.eligibility?.met)return`<span class="garage-state locked">LOCKED<small>${garageRequirement(v)}</small></span>`;return button(`BUY · ${p.currency==='gems'?'◆':'◉'} ${p.amount}`,`confirm-buy:${v.id}`,v.affordable?'garage-action':'garage-action disabled')}return`<span class="garage-state locked">${v.eligibility?.met?'REWARD':'LOCKED'}<small>${garageRequirement(v)}</small></span>`}
function garageProductCard(v){const art=garageAsset(v);return`<button class="garage-product ${garageSelectedId===v.id?'active':''} ${!v.owned&&!v.eligibility?.met?'is-locked':''}" data-action="garage-select:${v.id}"><span class="garage-product-art">${art?`<img src="${art}" alt="">`:`<i>${v.type==='color'?'●':v.type==='decal'?'✦':v.type==='shot'?'⌁':'▧'}</i>`}</span><b>${itemName(v.id)}</b><small class="rarity ${v.rarity||'common'}">${String(v.rarity||'common').toUpperCase()}</small>${!v.owned&&!v.eligibility?.met?`<em>⌁ ${garageRequirement(v)}</em>`:v.equipped?'<em>EQUIPPED</em>':v.owned?'<em>OWNED</em>':''}</button>`}
function garageUpgradeCard(shipKey,stat,label,values){const levels=values.levels,current=levels[stat],cost=ShipUpgradeSystem.cost(shipKey,stat),display=stat==='mobility'?Math.round(values.mobility*100)+'%':values[stat];if(current>=5)return`<article class="garage-upgrade max"><small>${label}</small><b>${display}</b><span>LV 5 · MAX</span></article>`;return`<article class="garage-upgrade"><small>${label}</small><b>${display}</b><span>LV ${current} → ${current+1}</span><div><button data-action="ship-upgrade:${shipKey}:${stat}:coins">◉ ${cost?.coins??'—'}</button><button data-action="ship-upgrade:${shipKey}:${stat}:gems">◆ ${cost?.gems??'—'}</button></div></article>`}
function garage(){
 const cats=garageCategories();if(garageMode==='products'&&!garageSelectedId)selectGarageDefault(garageTab);
 const items=garageItems(garageTab),selected=CustomizationSystem.item(garageSelectedId)||items[0]||null;if(selected&&!garageSelectedId)garageSelectedId=selected.id;
 const isShip=selected?.type==='ship',shipKey=isShip?garageShipKey(selected.id):null,meta=isShip?garageShipMeta(selected.id):null,values=isShip?ShipUpgradeSystem.values(shipKey):null,art=garageAsset(selected);
 const progress=playerProgress(),profile=ProfileSystem.snapshot(),showManufacturer=GameConfig.get('garage')?.ui?.showManufacturer!==false;
 const categoryStrip=garageMode==='categories'?cats.map(cat=>`<button class="garage-category" data-action="garage-cat:${cat.id}"><span>${cat.id==='ship'?'▲':cat.id==='color'?'●':cat.id==='decal'?'✦':cat.id==='shot'?'⌁':'▧'}</span><b>${cat.label}</b></button>`).join(''):`<button class="garage-category-back" data-action="garage-categories">‹ CATEGORIES</button>`+items.map(garageProductCard).join('');
 const info=isShip?`<div class="garage-title">${showManufacturer&&meta?`<small>${meta.manufacturer}</small>`:''}<h1>${meta?`${meta.model} ${meta.displayName}`:itemName(selected.id)}</h1>${!selected.owned&&!selected.eligibility?.met?`<span>${garageRequirement(selected)}</span>`:''}</div>
 <div class="garage-stats"><div><small>HULL</small><b>${values.hull}</b></div><div><small>SHIELD</small><b>${values.shield}</b></div><div><small>MOBILITY</small><b>${Math.round(values.mobility*100)}%</b></div><div><small>SIZE</small><b>${meta?.size||'—'}</b></div></div>
 ${selected.owned?`<div class="garage-upgrades">${garageUpgradeCard(shipKey,'hull','HULL',values)}${garageUpgradeCard(shipKey,'shield','SHIELD',values)}${garageUpgradeCard(shipKey,'mobility','MOBILITY',values)}</div>${values.mastered?'<div class="garage-mastery">✦ MASTERY COMPLETE</div>':''}`:''}`:`<div class="garage-title"><small>${tabNames[garageTab]}</small><h1>${selected?itemName(selected.id):tabNames[garageTab]}</h1><span>${String(selected?.rarity||'').toUpperCase()}</span></div>`;
 const modal=garageConfirmId?(()=>{const v=CustomizationSystem.item(garageConfirmId),p=v?.acquisition?.price;return`<div class="garage-modal"><div><small>CONFIRM PURCHASE</small><h2>${itemName(garageConfirmId)}</h2><p>Purchase for ${p?.currency==='gems'?'◆':'◉'} ${p?.amount||0}?</p><button data-action="buy-confirmed:${garageConfirmId}">PURCHASE</button><button class="ghost" data-action="buy-cancel">CANCEL</button></div></div>`})():'';
 const reveal=garageRevealId?(()=>{const v=CustomizationSystem.item(garageRevealId),a=garageAsset(v);return`<div class="garage-reveal"><div class="garage-reveal-glow"></div>${a?`<img src="${a}" alt="">`:''}<small>UNLOCKED</small><h2>${itemName(garageRevealId)}</h2><button data-action="reveal-equip:${garageRevealId}">EQUIP NOW</button><button class="ghost" data-action="reveal-close">CONTINUE</button></div>`})():'';
 return`<section class="ns-screen ns-garage-screen">
 <header class="garage-top"><button class="ns-back" data-action="home">‹</button><button class="garage-player-chip" data-action="profile"><span>◈</span><b>${profile.displayName||'PILOT'}</b><small>LV ${progress.level} · ${rankText()}</small></button>${money()}</header>
 <div class="garage-showroom"><div class="garage-hangar-lines"></div><div class="garage-platform"></div><div class="garage-aura"></div>${art?`<img class="garage-hero-ship" src="${art}" alt="">`:`<div class="garage-cosmetic-preview">${garageTab==='color'?'●':garageTab==='decal'?'✦':garageTab==='shot'?'⌁':'▧'}</div>`}</div>
 ${selected?info:'<div class="ns-empty"><b>NO ITEMS</b></div>'}
 <div class="garage-main-action">${garageMainAction(selected)}</div>
 <div class="garage-slider ${garageMode}">${categoryStrip}</div>
 ${modal}${reveal}
 </section>`}
function modes(){return shell('SELECT MODE',`<div class="ns-mode-card"><b>SOLO RUN</b><p>Survive, upgrade your ship and climb the ranks.</p>${button('DEPLOY','solo','accent')}</div><div class="ns-mode-card locked"><b>CO-OP</b><p>Fight and progress together with friends.</p><span>ONLINE MODE — NEXT PHASE</span></div>`)}
function shop(){const offers=ShopSystem.offers();return shell('SHOP',`<div class="ns-section-title"><div><small>LIVE STORE</small><h3>FEATURED OFFERS</h3></div></div><div class="ns-offers">${offers.length?offers.map(o=>`<article class="ns-offer"><div class="ns-offer-art">${o.item?.type==='ability'?'⚡':'✦'}</div><div><b>${itemName(o.itemId)}</b><small>${String(o.item?.rarity||'special').toUpperCase()}</small></div>${o.item?.owned?'<span class="ns-equipped">OWNED</span>':button(`${o.price?.currency==='gems'?'◆':'◉'} ${o.price?.amount??'—'}`,`offer:${o.id}`,o.affordable&&o.eligible?'mini':'mini disabled')}</article>`).join(''):'<div class="ns-empty"><b>NO LIVE OFFERS</b><p>The store is ready for remotely configured offers.</p></div>'}</div>`)}
function stats(){const s=StatisticsSystem.snapshot(),cards=[['RUNS',s.runs],['KILLS',s.kills],['ELITES',s.eliteKills],['BOSSES',s.bossKills],['BEST SCORE',s.bestScore],['BEST LEVEL',s.bestLevel],['BEST DISTANCE',Math.round(s.bestDistance)],['PLAY TIME',`${Math.floor(s.totalPlaySeconds/60)}m`]];return shell('STATISTICS',`<div class="ns-stat-hero"><small>CAREER RANK</small><strong>${RankSystem.snapshot().rank||1}</strong></div><div class="ns-stat-grid">${cards.map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>`)}
function results(){const a=AppFlowSystem.snapshot().results||{},r=a.run||RunCommands.snapshot()||{};return shell('RUN COMPLETE',`<div class="ns-results-hero"><small>FINAL SCORE</small><strong>${Math.round(r.score||0)}</strong><span>LEVEL ${r.level||1}</span></div><div class="ns-result-row"><div><small>TIME</small><b>${Math.floor((r.time||0)/60)}:${String(Math.floor((r.time||0)%60)).padStart(2,'0')}</b></div><div><small>DISTANCE</small><b>${Math.round(r.distance||0)}</b></div></div><div class="ns-results-actions">${button('PLAY AGAIN','replay','accent')}${button('GARAGE','garage')}${button('HOME','home')}</div>`)}
function profile(){
 const p=ProfileSystem.snapshot(),a=AccountSystem.snapshot(),pr=PlayerProgressionSystem.snapshot(),s=StatisticsSystem.snapshot(),loadout=CustomizationSystem.loadout(),shipId=loadout.ship||'ship.nova',shipKey=ShipUpgradeSystem.shipKeyFromItem(shipId),meta=GameConfig.get('garage')?.ships?.[shipKey],ship=CustomizationSystem.item(shipId),shipArt=garageAsset(ship),joined=p.createdAt?new Date(p.createdAt).toLocaleDateString(undefined,{year:'numeric',month:'short'}):'—';
 const xpPct=Math.max(0,Math.min(100,(pr.progress||0)*100)),playH=Math.floor((s.totalPlaySeconds||0)/3600),playM=Math.floor(((s.totalPlaySeconds||0)%3600)/60);
 return`<section class="ns-screen ns-profile-screen">
 <header class="profile-top"><button class="ns-back" data-action="home">‹</button><h2>PROFILE</h2>${money()}</header>
 <div class="profile-hero">
   <div class="profile-avatar-ring"><div class="profile-avatar">◈</div></div>
   <div class="profile-identity"><small>PILOT</small><h1>${p.displayName||'PILOT'}</h1><span>${rankText()}</span></div>
   <button class="profile-edit" data-action="profile-edit">EDIT</button>
 </div>
 <div class="profile-level-card">
   <div><small>PLAYER LEVEL</small><b>LV ${pr.playerLevel}</b></div>
   <div class="profile-xp-copy"><span>${pr.currentLevelXP.toLocaleString()} / ${pr.nextLevelXP.toLocaleString()} XP</span><strong>${Math.floor(xpPct)}%</strong></div>
   <div class="profile-xp-track"><i style="width:${xpPct}%"></i></div>
 </div>
 <div class="profile-ship-card">
   <div class="profile-ship-art">${shipArt?`<img src="${shipArt}" alt="">`:'▲'}</div>
   <div><small>EQUIPPED SHIP</small><b>${meta?`${meta.model} ${meta.displayName}`:itemName(shipId)}</b><span>${meta?.manufacturer||''}</span></div>
   <button data-action="garage">GARAGE</button>
 </div>
 <div class="profile-section-title"><small>CAREER STATISTICS</small></div>
 <div class="profile-stat-grid">
   <article><small>RUNS</small><b>${s.runs}</b></article>
   <article><small>ENEMIES</small><b>${s.kills.toLocaleString()}</b></article>
   <article><small>BEST SCORE</small><b>${Math.round(s.bestScore).toLocaleString()}</b></article>
   <article><small>BEST DISTANCE</small><b>${Math.round(s.bestDistance).toLocaleString()} m</b></article>
   <article><small>TOTAL DISTANCE</small><b>${Math.round(s.totalDistance).toLocaleString()} m</b></article>
   <article><small>BEST EVOLUTION</small><b>${s.bestLevel||1}</b></article>
   <article><small>BOSSES</small><b>${s.bossKills}</b></article>
   <article><small>PLAY TIME</small><b>${playH?playH+'h ':''}${playM}m</b></article>
 </div>
 <div class="profile-meta">
   <div><small>ACCOUNT</small><b>${a.authenticated?String(a.provider).toUpperCase():'GUEST'}</b></div>
   <div><small>JOINED</small><b>${joined}</b></div>
 </div>
 <div class="profile-edit-panel" hidden>
   <label>PILOT NAME</label>
   <div class="ns-name-row"><input id="pilot-name" maxlength="18" value="${String(p.displayName).replaceAll('"','&quot;')}">${button('SAVE','save-name','mini')}</div>
   <small>PLAYER ID</small><code>${a.playerId}</code>
 </div>
 </section>`}
function objectiveCard(o,xp){const pct=Math.max(0,Math.min(100,(o.target?o.value/o.target:0)*100));return`<article class="objective-card ${o.complete?'complete':''}"><div class="objective-icon">${o.icon||'◎'}</div><div class="objective-copy"><b>${o.label}</b><small>${Math.floor(o.value).toLocaleString()} / ${Math.floor(o.target).toLocaleString()}</small><div class="objective-track"><i style="width:${pct}%"></i></div></div><div class="objective-reward"><span>+${xp}</span><small>PLAYER XP</small></div></article>`}
function achievementCard(a){const hidden=a.hidden&&!a.complete;if(hidden)return`<article class="achievement-card hidden"><div class="achievement-icon">?</div><div><b>HIDDEN ACHIEVEMENT</b><small>Complete the secret condition to reveal it.</small></div><span>LOCKED</span></article>`;const pct=Math.max(0,Math.min(100,(a.target?a.value/a.target:0)*100)),parts=[];if(a.reward?.coins)parts.push('◉ '+a.reward.coins);if(a.reward?.gems)parts.push('◆ '+a.reward.gems);if(a.reward?.ap)parts.push('AP '+a.reward.ap);return`<article class="achievement-card ${a.complete?'complete':''}"><div class="achievement-icon">${a.icon||'✦'}</div><div class="achievement-copy"><b>${a.label}</b><small>${a.description||''}</small><div class="achievement-progress"><i style="width:${pct}%"></i></div><em>${Math.floor(a.value).toLocaleString()} / ${Math.floor(a.target).toLocaleString()}</em></div><span>${a.complete?'UNLOCKED':parts.join(' · ')}</span></article>`}
function objectivesScreen(){const board=ObjectiveBoardSystem.snapshot(),ach=AchievementSystem.snapshot(),pr=PlayerProgressionSystem.snapshot();const section=(title,key,subtitle)=>`<section class="objective-group"><div class="objective-group-head"><div><small>${subtitle}</small><h3>${title}</h3></div><span>+${board[key].xpReward} XP EACH</span></div><div class="objective-list">${board[key].objectives.map(o=>objectiveCard(o,board[key].xpReward)).join('')}</div></section>`;return`<section class="ns-screen ns-objectives-screen"><header class="objectives-top"><button class="ns-back" data-action="home">‹</button><div><small>PROGRESSION</small><h2>OBJECTIVES</h2></div>${money()}</header><div class="objectives-player-level"><div><small>PLAYER LEVEL</small><b>LV ${pr.playerLevel}</b></div><div><span>${pr.currentLevelXP.toLocaleString()} / ${pr.nextLevelXP.toLocaleString()} XP</span><div><i style="width:${Math.round((pr.progress||0)*100)}%"></i></div></div></div>${section('DAILY','daily','RESETS DAILY')}${section('WEEKLY','weekly','RESETS WEEKLY')}${section('PLAYER','player','PERSONAL OBJECTIVES')}<section class="achievement-section"><div class="achievement-head"><div><small>LIFETIME MILESTONES</small><h3>ACHIEVEMENTS</h3></div><span>${ach.ap} AP</span></div><div class="achievement-list">${ach.achievements.map(achievementCard).join('')}</div></section></section>`}
function boardLabel(id){return({global_score:'GLOBAL SCORE',best_distance:'BEST DISTANCE',survival_time:'SURVIVAL TIME',weekly_score:'WEEKLY',friends:'FRIENDS'})[id]||id.replaceAll('_',' ').toUpperCase()}
function boardMetric(id,value){const n=Math.max(0,Number(value)||0);if(id==='best_distance')return Math.round(n).toLocaleString()+' m';if(id==='survival_time'){const sec=Math.round(n);return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}return Math.round(n).toLocaleString()}
function localBoardValue(id){const s=StatisticsSystem.snapshot();if(id==='best_distance')return s.bestDistance||0;if(id==='survival_time')return s.totalPlaySeconds||0;if(id==='weekly_score')return s.bestScore||0;if(id==='friends')return s.bestScore||0;return s.bestScore||0}
function leaderboardRow(e,i){const profile=e.profile||e.metadata?.profile||{},name=e.displayName||profile.displayName||'PILOT',rank=e.playerRank||profile.rank||e.rankTier||'—',pos=e.rank||i+1;return`<div class="leader-row ${e.isSelf?'self':''}"><span class="leader-pos">#${pos}</span><div class="leader-pilot"><b>${name}</b><small>RANK ${rank}</small></div><strong>${boardMetric(board,e.score??e.value??0)}</strong></div>`}
function leaderboard(){
 const boards=Object.values(LeaderboardSystem.boards()),online=LeaderboardSystem.available(),p=ProfileSystem.snapshot(),r=RankSystem.snapshot(),localValue=localBoardValue(board);
 let body='';
 if(leaderLoading)body='<div class="leader-status"><b>LOADING…</b></div>';
 else if(online)body=`<div class="leader-list">${(leaderRows||[]).map(leaderboardRow).join('')||'<div class="leader-status"><b>NO SCORES YET</b><p>Be the first pilot on this board.</p></div>'}</div>`;
 else body=`<div class="leader-offline-card"><div class="leader-offline-icon">⌁</div><div><b>GLOBAL RANKINGS NOT CONNECTED YET</b><p>This V2 build is running locally. Real worldwide positions will appear here once the leaderboard backend is connected.</p></div></div>`;
 return`<section class="ns-screen ns-leaderboard-screen">
   <header class="leader-top"><button class="ns-back" data-action="home">‹</button><div><small>COMPETE WORLDWIDE</small><h2>LEADERBOARD</h2></div>${money()}</header>
   <nav class="leader-tabs">${boards.map(b=>`<button data-action="board:${b}" class="${b===board?'active':''}">${boardLabel(b)}</button>`).join('')}</nav>
   <div class="leader-self-card">
     <span class="leader-self-pos">${online?'#—':'LOCAL'}</span>
     <div class="leader-self-avatar">◈</div>
     <div class="leader-self-copy"><small>YOUR POSITION</small><b>${p.displayName||'PILOT'}</b><span>RANK ${r.rank||1}</span></div>
     <strong>${boardMetric(board,localValue)}</strong>
   </div>
   <div class="leader-column-head"><span>POSITION</span><span>PILOT</span><span>${boardLabel(board)}</span></div>
   ${body}
 </section>`}
async function loadBoard(){if(!LeaderboardSystem.available()){leaderRows=[];render();return}leaderLoading=true;render();const r=await LeaderboardSystem.top(board,50);leaderRows=r.entries||[];leaderLoading=false;render()}
function launch(resume=false){if(homeLaunching)return;homeLaunching=true;const el=root.querySelector('.ns-home');el?.classList.add('is-launching');setTimeout(()=>{homeLaunching=false;if(resume&&AppFlowSystem.resume)AppFlowSystem.resume();else AppFlowSystem.play('solo')},760)}
function render(){if(!root)return;const state=AppFlowSystem.snapshot().state;if(state==='home')root.innerHTML=home();else if(state==='mode-select')root.innerHTML=modes();else if(state==='garage')root.innerHTML=garage();else if(state==='shop')root.innerHTML=shop();else if(state==='stats')root.innerHTML=stats();else if(state==='results')root.innerHTML=results();else if(state==='profile')root.innerHTML=profile();else if(state==='objectives')root.innerHTML=objectivesScreen();else if(state==='leaderboard')root.innerHTML=leaderboard();else if(state==='playing'){root.style.display='none';return}root.style.display='block'}
async function act(a){if(a==='home')AppFlowSystem.home();else if(a==='garage'){garageMode='categories';garageSelectedId=null;garageConfirmId=null;garageRevealId=null;AppFlowSystem.garage();}else if(a==='shop')AppFlowSystem.shop();else if(a==='stats')AppFlowSystem.stats();else if(a==='objectives')AppFlowSystem.objectives();else if(a==='profile')AppFlowSystem.profile();else if(a==='profile-edit'){const panel=root.querySelector('.profile-edit-panel');if(panel)panel.hidden=!panel.hidden}else if(a==='play')launch(false);else if(a==='continue')launch(true);else if(a==='solo')AppFlowSystem.play('solo');else if(a==='replay')AppFlowSystem.replay();else if(a==='settings')GameEvents.emit('ui:settings-requested',{source:'home'});else if(a==='leaderboard'){AppFlowSystem.leaderboard();loadBoard()}else if(a==='save-name'){const v=root.querySelector('#pilot-name')?.value.trim();if(v)await ProfileSystem.update({displayName:v.slice(0,18)})}else if(a==='signout')await AccountSystem.signOut();else if(a.startsWith('board:')){board=a.slice(6);leaderRows=null;loadBoard()}else if(a.startsWith('garage-cat:')){garageTab=a.slice(11);garageMode='products';selectGarageDefault(garageTab)}else if(a==='garage-categories'){garageMode='categories';garageSelectedId=null}else if(a.startsWith('garage-select:'))garageSelectedId=a.slice(14);else if(a.startsWith('tab:'))garageTab=a.slice(4);else if(a.startsWith('equip:'))CustomizationSystem.equip(a.slice(6));else if(a.startsWith('confirm-buy:'))garageConfirmId=a.slice(12);else if(a==='buy-cancel')garageConfirmId=null;else if(a.startsWith('buy-confirmed:')){const id=a.slice(14),r=CustomizationSystem.purchase(id);garageConfirmId=null;if(r.purchased)garageRevealId=id}else if(a.startsWith('reveal-equip:')){const id=a.slice(13);CustomizationSystem.equip(id);garageRevealId=null;garageSelectedId=id}else if(a==='reveal-close')garageRevealId=null;else if(a.startsWith('ship-upgrade:')){const [,key,stat,currency]=a.split(':');ShipUpgradeSystem.upgrade(key,stat,currency)}else if(a.startsWith('buy:')){const id=a.slice(4),r=CustomizationSystem.purchase(id);if(r.purchased)CustomizationSystem.equip(id)}else if(a.startsWith('offer:'))ShopSystem.purchase(a.slice(6));render()}
const system={id:'app-shell',dependsOn:['app-flow','profile','account','economy','rank','player-progression','objective-board','achievements','customization','shop','ship-upgrades','statistics','leaderboards'],start(){root=document.createElement('div');root.id='app-shell';document.body.appendChild(root);root.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.classList.contains('disabled'))act(b.dataset.action)});['app-flow:changed','economy:balance-changed','ship-upgrade:changed','profile:updated','customization:changed','customization:purchased','shop:purchased','statistics:changed','account:signed-out','account:signed-in','progression:rank-progress','progression:rank-up','player-progression:xp-changed','player-progression:level-up','objectives:changed','objective:rewarded','achievements:changed','achievement:unlocked'].forEach(n=>GameEvents.on(n,render));render()},render};
GameSystems.register(system);window.AppShell=system})();
