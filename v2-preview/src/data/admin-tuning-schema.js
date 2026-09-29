window.AdminTuningSchema=Object.freeze({
  schemaVersion:1,
  groups:[{id:'economy',label:'ECONOMY',fields:[{id:'economy.playerLevelReward.coins',namespace:'economyTuning',path:['playerLevelReward','coins'],label:'Coins per Player Level',type:'number',min:0,max:100000,step:100},{id:'economy.playerLevelReward.gems',namespace:'economyTuning',path:['playerLevelReward','gems'],label:'Diamonds per Player Level',type:'number',min:0,max:1000,step:1},{id:'economy.railgun.lv2',namespace:'economyTuning',path:['railgunUpgrade','2','coins'],label:'Railgun LV2 price',type:'number',min:0,max:1000000,step:100},{id:'economy.railgun.lv3',namespace:'economyTuning',path:['railgunUpgrade','3','coins'],label:'Railgun LV3 price',type:'number',min:0,max:1000000,step:100},{id:'economy.railgun.lv4',namespace:'economyTuning',path:['railgunUpgrade','4','coins'],label:'Railgun LV4 price',type:'number',min:0,max:1000000,step:100},{id:'economy.railgun.lv5',namespace:'economyTuning',path:['railgunUpgrade','5','coins'],label:'Railgun LV5 price',type:'number',min:0,max:1000000,step:100}]},{
    id:'player-movement',
    label:'PLAYER MOVEMENT',
    fields:[
      {id:'flight.player.baseMoveSpeed',namespace:'flight',path:['player','baseMoveSpeed'],label:'Initial movement speed',type:'number',min:250,max:1600,step:25,unit:'px/s'},
      {id:'flight.player.relativeDragSensitivityX',namespace:'flight',path:['player','relativeDragSensitivityX'],label:'Horizontal drag sensitivity',type:'number',min:.5,max:2,step:.02,unit:'x'},
      {id:'flight.player.relativeDragSensitivityY',namespace:'flight',path:['player','relativeDragSensitivityY'],label:'Vertical drag sensitivity',type:'number',min:.5,max:2,step:.02,unit:'x'},
      {id:'flight.player.followResponse',namespace:'flight',path:['player','followResponse'],label:'Follow response',type:'number',min:5,max:50,step:1,unit:'response'}
    ]
  }]
});