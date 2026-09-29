/* Central tuning only. No balances live here: EconomySystem is the sole Coins/Diamonds authority; APSystem is the sole AP authority. */
(()=>{const config={schemaVersion:3,
playerLevelReward:{coins:1000,gems:2},
prestige:{milestones:[50,75,100,150,200],reward:{coins:30000,gems:100}},
shipPurchase:{
'ship.viper':{currency:'coins',amount:15000},'ship.bastion':{currency:'coins',amount:30000},'ship.raptor':{currency:'coins',amount:30000},'ship.vector':{currency:'coins',amount:50000},'ship.wraith':{currency:'coins',amount:75000},'ship.arrow':{currency:'coins',amount:100000},'ship.eclipse':{currency:'gems',amount:250},'ship.mantis':{currency:'coins',amount:140000},'ship.odyssey':{currency:'coins',amount:180000},'ship.paradox':{currency:'coins',amount:225000},'ship.spectre':{currency:'coins',amount:275000}},
customizationPurchase:{
'color.black':{currency:'coins',amount:1500},'color.red':{currency:'coins',amount:1800},'color.blue':{currency:'coins',amount:1800},'color.green':{currency:'coins',amount:1800},'color.purple':{currency:'coins',amount:3000},'color.orange':{currency:'coins',amount:3000},'color.gold':{currency:'coins',amount:6500},'color.chrome':{currency:'coins',amount:7500},
'decal.racing':{currency:'coins',amount:2000},'decal.hazard':{currency:'coins',amount:3500},'decal.carbon':{currency:'coins',amount:4000},'decal.cyber':{currency:'coins',amount:7000},'decal.geometry':{currency:'coins',amount:7000},
'engine.cyan':{currency:'coins',amount:1800},'engine.violet':{currency:'coins',amount:3000},'engine.pink':{currency:'coins',amount:3000},'engine.green':{currency:'coins',amount:3500},'engine.orange':{currency:'coins',amount:5000},'engine.red':{currency:'coins',amount:5500},'engine.white':{currency:'coins',amount:9000},
'aura.electric':{currency:'coins',amount:4500},'aura.plasma':{currency:'coins',amount:5000},'aura.fire':{currency:'coins',amount:7000},'aura.frost':{currency:'coins',amount:7000},'aura.void':{currency:'coins',amount:10000},'aura.gold':{currency:'coins',amount:12000},
'shot.green':{currency:'coins',amount:1800},'shot.violet':{currency:'coins',amount:3000},'shot.red':{currency:'coins',amount:3000},'shot.gold':{currency:'coins',amount:6000},'shot.white':{currency:'coins',amount:8500}},
shipUpgrade:{2:{coins:2500,gems:1},3:{coins:8000,gems:2},4:{coins:25000,gems:5},5:{coins:75000,gems:10}},
railgunUpgrade:{2:{coins:1500},3:{coins:3500},4:{coins:7000},5:{coins:12000}},
objectiveXP:{dailyDefault:120,weeklyDefault:350,playerDefault:180,player:{'p.kills.75':140,'p.distance.3000':150,'p.survive.300':180,'p.score.15000':190,'p.elites.3':220,'p.upgrades.10':180,'p.nodamage.60':260,'p.boss.1':300}},
achievementAP:{'a.kills.100':10,'a.kills.500':20,'a.kills.1000':30,'a.kills.5000':45,'a.kills.10000':65,'a.distance.5000':10,'a.distance.25000':25,'a.distance.100000':45,'a.elites.5':15,'a.elites.25':35,'a.elites.100':60,'a.boss.1':20,'a.boss.10':50,'a.boss.50':75,'a.nodamage.180':40,...Object.fromEntries(Array.from({length:14},(_,i)=>['a.mastery.'+(i+1),15+i*5]))}
};window.EconomyTuning=config;GameConfig?.register('economyTuning',config)})();