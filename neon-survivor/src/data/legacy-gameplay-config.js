/* Data-driven knobs for exact legacy gameplay. Null values preserve original behavior. */
window.LegacyGameplayConfig={schemaVersion:3,
waves:{enabled:true,defaults:{groupSize:null,enemyCap:null,spawnDelay:null,retryDelay:null,enemyPool:null,enemySequence:null,formation:{xPadding:38,minSpacing:42,yMin:-225,yMax:-68,targetYMin:.17,targetYMax:.48}},stages:{}},
player:{defaults:{hp:null,speed:null,fireRate:null,damage:null,projectileSpeed:null,cannons:null,spread:null,shield:null,maxShield:null,resist:null,miningDamage:null,scoreMultiplier:null,invulnerabilityAfterHit:null,dragX:null,dragY:null,followSpeed:null,yMin:null,yMax:null},ships:{}},
enemies:{defaults:{hpMultiplier:null,damageMultiplier:null,speedMultiplier:null,fireRateMultiplier:null,shotDamageMultiplier:null,rewardMultiplier:null},overrides:{}},
asteroids:{overrides:{}},bosses:{overrides:{}}};
/* waves.enemyPool example: {striker:4,sweeper:2,mortar:1}; enemySequence: ['striker','striker','sweeper'].
   player.ships.falcon can override only Falcon while player.defaults affects every ship.
   enemies.overrides.striker can override one enemy family. Null means exact legacy value. */
