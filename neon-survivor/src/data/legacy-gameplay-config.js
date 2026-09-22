/* Data-driven knobs for exact legacy gameplay. Null values preserve original behavior. */
window.LegacyGameplayConfig={schemaVersion:4,
waves:{enabled:true,defaults:{groupSize:null,enemyCap:null,spawnDelay:null,retryDelay:null,enemyPool:null,enemySequence:null,formation:{xPadding:38,minSpacing:42,yMin:-225,yMax:-68,targetYMin:.17,targetYMax:.48}},stages:{}},
player:{defaults:{hp:null,speed:null,fireRate:null,damage:null,projectileSpeed:null,cannons:null,spread:null,shield:null,maxShield:null,resist:null,miningDamage:null,scoreMultiplier:null,invulnerabilityAfterHit:null,dragX:null,dragY:null,followSpeed:null,yMin:null,yMax:null},ships:{}},
enemies:{defaults:{hpMultiplier:null,damageMultiplier:null,speedMultiplier:null,fireRateMultiplier:null,shotDamageMultiplier:null,rewardMultiplier:null},overrides:{}},
asteroids:{defaults:{enabled:true,weightMultiplier:null,hpMultiplier:null,speedMultiplier:null,sizeMultiplier:null,damageMultiplier:null,rewardMultiplier:null,aimChanceMultiplier:null},overrides:{}},
bosses:{defaults:{hpMultiplier:null,damageMultiplier:null,speedMultiplier:null,fireRateMultiplier:null,shotDamageMultiplier:null,rewardMultiplier:null,sizeMultiplier:null},overrides:{},stages:{}}};
/* waves.enemyPool example: {striker:4,sweeper:2,mortar:1}; enemySequence: ['striker','striker','sweeper'].
   player.ships.falcon overrides only Falcon. enemies.overrides.striker overrides one enemy family.
   asteroids.overrides.hunter / colossus can tune individual hazards. bosses.overrides.dread / ravager / wraith / hive / siege tunes a boss family.
   All null values preserve exact legacy values. */
