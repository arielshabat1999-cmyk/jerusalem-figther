/* Stable domain vocabulary for content, progression, economy and multiplayer. */
window.GameSchema=Object.freeze({
 currencies:{COINS:'coins',DIAMONDS:'diamonds'},
 itemTypes:['ship','skin','color','decal','projectile_fx','background','aura','ability','equipment'],
 progressionTypes:['rank','achievement','daily','weekly','challenge','season','prestige','stage'],
 rewardTypes:['currency','item','unlock','xp'],
 entityTypes:['player','enemy','elite','boss','projectile','pickup'],
 gameModes:['solo','coop','pvp','team_pvp','challenge','boss_run'],
 network:{authorities:['local','client','server'],sessionFields:['sessionId','matchId','playerId','teamId','gameMode','authority']}
});
