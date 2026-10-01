(()=>{
'use strict';
const rankFamily=level=>{const names=['Recruit','Cadet','Pilot','Striker','Vanguard','Hunter','Ace','Elite','Commander','Legend'];const i=Math.max(0,Math.min(9,Math.floor((level-1)/5)));const roman=['I','II','III','IV','V'][Math.max(0,Math.min(4,(level-1)%5))];return`${names[i]} ${roman}`.toUpperCase()};
function snapshot(){
 const profile=window.ProfileSystem?.snapshot?.()||{};
 const progression=window.PlayerProgressionSystem?.snapshot?.()||{};
 const rank=window.RankSystem?.snapshot?.()||{};
 const level=Math.max(1,Number(progression.playerLevel??progression.level??1)||1);
 const currentXP=Math.max(0,Number(progression.currentLevelXP??progression.levelXP??0)||0);
 const nextLevelXP=Math.max(1,Number(progression.nextLevelXP??progression.levelXPNeeded??900)||900);
 const rankNo=Math.max(1,Number(rank.rank||level)||1);
 return Object.freeze({
  displayName:profile.displayName||'PILOT',
  level,
  currentXP,
  nextLevelXP,
  xpPercent:Math.max(0,Math.min(100,currentXP/nextLevelXP*100)),
  rankLabel:String(rank.label||rank.name||rankFamily(level)).toUpperCase(),
  rankNo,
  rankAsset:`assets/icons/ranks/rank_${String(rankNo).padStart(2,'0')}.png`
 });
}
window.PlayerIdentityAdapter=Object.freeze({snapshot});
})();