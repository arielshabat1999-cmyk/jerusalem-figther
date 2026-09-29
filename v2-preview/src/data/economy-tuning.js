/* Central economy tuning. Prices/rewards belong here or in data catalogs, never in gameplay logic. */
(()=>{const config={schemaVersion:1,
playerLevelReward:{coins:1000,gems:2},
prestige:{milestones:[50,75,100,150,200],reward:{coins:30000,gems:100}},
shipUpgrade:{2:{coins:2500,gems:1},3:{coins:8000,gems:2},4:{coins:25000,gems:5},5:{coins:75000,gems:10}},
railgunUpgrade:{2:{coins:1500},3:{coins:3500},4:{coins:7000},5:{coins:12000}}
};window.EconomyTuning=config;GameConfig?.register('economyTuning',config)})();