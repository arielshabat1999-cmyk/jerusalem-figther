/* Data-driven knobs for exact legacy gameplay. Null values preserve original behavior. */
window.LegacyGameplayConfig={schemaVersion:5,
/* Global difficulty 1..10. Level 5 is the legacy/reference density. The runtime keeps its original stage/time ramp, so every level starts lighter and grows during the run. */
difficulty:{level:5,min:1,max:10,referenceLevel:5,enemyDensity:{1:.52,2:.63,3:.75,4:.88,5:1,6:1.14,7:1.30,8:1.48,9:1.68,10:1.90},spawnRate:{1:.72,2:.79,3:.86,4:.93,5:1,6:1.08,7:1.17,8:1.27,9:1.38,10:1.50},enemyCap:{1:.62,2:.70,3:.79,4:.89,5:1,6:1.12,7:1.24,8:1.37,9:1.51,10:1.66},threat:{1:.82,2:.87,3:.91,4:.96,5:1,6:1.05,7:1.10,8:1.16,9:1.22,10:1.29}},
waves:{enabled:true,defaults:{groupSize:null,enemyCap:null,spawnDelay:null,retryDelay:null,enemyPool:null,enemySequence:null,formation:{xPadding:38,minSpacing:42,yMin:-225,yMax:-68,targetYMin:.17,targetYMax:.48}},stages:{}},
player:{defaults:{hp:null,speed:null,fireRate:null,damage:null,projectileSpeed:null,cannons:null,spread:null,shield:null,maxShield:null,resist:null,miningDamage:null,scoreMultiplier:null,invulnerabilityAfterHit:null,dragX:null,dragY:null,followSpeed:null,yMin:null,yMax:null},ships:{}},
enemies:{defaults:{hpMultiplier:null,damageMultiplier:null,speedMultiplier:null,fireRateMultiplier:null,shotDamageMultiplier:null,rewardMultiplier:null},overrides:{}},
asteroids:{defaults:{enabled:true,weightMultiplier:null,hpMultiplier:null,speedMultiplier:null,sizeMultiplier:null,damageMultiplier:null,rewardMultiplier:null,aimChanceMultiplier:null},overrides:{}},
bosses:{defaults:{hpMultiplier:null,damageMultiplier:null,speedMultiplier:null,fireRateMultiplier:null,shotDamageMultiplier:null,rewardMultiplier:null,sizeMultiplier:null},overrides:{},stages:{}}};
/* Difficulty changes global pressure, not the game's identity: original stage progression remains authoritative.
   waves.enemyPool example: {striker:4,sweeper:2,mortar:1}; enemySequence: ['striker','striker','sweeper'].
   player.ships.falcon overrides only Falcon. enemies.overrides.striker overrides one enemy family.
   asteroids.overrides.hunter / colossus can tune individual hazards. bosses.overrides.dread / ravager / wraith / hive / siege tunes a boss family. */
