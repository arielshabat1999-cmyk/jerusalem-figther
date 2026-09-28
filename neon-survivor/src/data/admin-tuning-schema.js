window.AdminTuningSchema=Object.freeze({
  schemaVersion:1,
  groups:[{
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