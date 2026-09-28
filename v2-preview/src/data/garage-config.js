(()=>{const config={schemaVersion:1,ui:{
categories:[
{id:'ship',label:'SHIPS',icon:'ship'},
{id:'color',label:'PAINT',icon:'paint'},
{id:'decal',label:'LIVERIES / COATINGS',icon:'livery'},
{id:'shot',label:'WEAPON STYLES',icon:'weapon'},
{id:'background',label:'BACKGROUNDS',icon:'background'}
],
showManufacturer:true
},ships:{
'starter':{itemId:'ship.nova',displayName:'FALCON',model:'AD-01',manufacturer:'ARES DYNAMICS',size:'MEDIUM',shield:60,baseHull:100,baseMobility:1,upgradeCosts:{2:{coins:2500,gems:1},3:{coins:8000,gems:2},4:{coins:25000,gems:5},5:{coins:75000,gems:10}}},
'viper':{itemId:'ship.viper',displayName:'VIPER',model:'VA-05',manufacturer:'VANTAGE AEROSPACE',size:'SMALL',shield:65,baseHull:90,baseMobility:1.12,upgradeCosts:{2:{coins:3500,gems:1},3:{coins:10000,gems:3},4:{coins:30000,gems:6},5:{coins:85000,gems:12}}},
'titan':{itemId:'ship.titan',displayName:'BASTION',model:'AD-10',manufacturer:'ARES DYNAMICS',size:'LARGE',shield:100,baseHull:140,baseMobility:.88,upgradeCosts:{2:{coins:5000,gems:2},3:{coins:14000,gems:4},4:{coins:40000,gems:8},5:{coins:110000,gems:15}}}
},upgradeMultipliers:{
hull:[1,1.12,1.28,1.4,1.52],
shield:[1,1.15,1.35,1.55,1.75],
mobility:[1,1.04,1.08,1.12,1.16]
},shield:{rechargeDelay:5,rechargePerSecondRatio:.12},rarityOrder:{common:0,rare:1,epic:2,legendary:3}};window.GarageConfig=config;GameConfig?.register('garage',config)})();