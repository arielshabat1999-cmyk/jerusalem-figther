(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function template(s){return `<span class="ns-avatar-mini"><img src="${esc(s.rankAsset)}" alt="${esc(s.rankLabel)} emblem" onerror="this.hidden=true"></span><span class="ns-player-copy"><strong>${esc(s.displayName)}</strong><small>${esc(s.rankLabel)}</small><b>LV ${s.level}</b></span><span class="ns-player-xp" role="progressbar" aria-label="Player level progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.xpPercent.toFixed(0)}"><i style="width:${s.xpPercent.toFixed(2)}%"></i></span>`}
function render(){
 const card=document.querySelector('.ns-home .ns-player-status');
 if(!card||!window.PlayerIdentityAdapter)return;
 const s=PlayerIdentityAdapter.snapshot();
 const signature=`${s.displayName}|${s.level}|${s.rankLabel}|${s.rankNo}|${s.xpPercent.toFixed(2)}`;
 if(card.dataset.identitySignature===signature)return;
 card.dataset.identitySignature=signature;
 card.innerHTML=template(s);
}
function start(){
 if(window.__playerIdentityComponentStarted)return;
 window.__playerIdentityComponentStarted=true;
 ['app-flow:changed','profile:updated','progression:rank-progress','progression:rank-up','player-progression:xp-changed','player-progression:level-up'].forEach(name=>window.GameEvents?.on?.(name,()=>requestAnimationFrame(render)));
 render();
}
window.PlayerIdentityComponent=Object.freeze({start,render});
})();