/* V143 — Player Rank progression CONFIG ONLY.
   Edit this file to rebalance objectives without touching HUD/gameplay code.

   Objective fields:
   id       = stable unique id (do not reuse)
   type     = tracker type
   target   = required amount
   scope    = 'career' | 'single_run'
   label    = text shown in UI
   icon     = UI symbol for now
   enabled  = switch individual objective on/off
*/
window.PLAYER_RANK_CONFIG = {
  version: 143,
  maxRank: 50,
  objectivesRequired: 4,
  ranks: {
    1: { nextRank: 2, objectives: [
      {id:'r1_kills',type:'kills',target:50,scope:'career',label:'DESTROY 50 ENEMIES',icon:'✦',enabled:true},
      {id:'r1_survive',type:'survival_seconds',target:120,scope:'single_run',label:'SURVIVE FOR 2 MINUTES',icon:'◷',enabled:true},
      {id:'r1_level',type:'run_level',target:5,scope:'single_run',label:'REACH LEVEL 5',icon:'⌃',enabled:true},
      {id:'r1_distance',type:'distance',target:500,scope:'career',label:'TRAVEL 500 m',icon:'➤',enabled:true}
    ]},
    2: { nextRank: 3, objectives: [
      {id:'r2_kills',type:'kills',target:100,scope:'career',label:'DESTROY 100 ENEMIES',icon:'✦',enabled:true},
      {id:'r2_survive',type:'survival_seconds',target:180,scope:'single_run',label:'SURVIVE FOR 3 MINUTES',icon:'◷',enabled:true},
      {id:'r2_score',type:'score',target:5000,scope:'single_run',label:'SCORE 5,000',icon:'◆',enabled:true},
      {id:'r2_level',type:'run_level',target:7,scope:'single_run',label:'REACH LEVEL 7',icon:'⌃',enabled:true}
    ]},
    3: { nextRank: 4, objectives: [
      {id:'r3_kills_run',type:'kills',target:150,scope:'single_run',label:'DESTROY 150 ENEMIES IN ONE RUN',icon:'✦',enabled:true},
      {id:'r3_survive',type:'survival_seconds',target:240,scope:'single_run',label:'SURVIVE FOR 4 MINUTES',icon:'◷',enabled:true},
      {id:'r3_distance',type:'distance',target:1000,scope:'career',label:'TRAVEL 1,000 m',icon:'➤',enabled:true},
      {id:'r3_upgrades',type:'upgrades',target:8,scope:'single_run',label:'COLLECT 8 UPGRADES',icon:'⚡',enabled:true}
    ]},
    4: { nextRank: 5, objectives: [
      {id:'r4_kills',type:'kills',target:250,scope:'career',label:'DESTROY 250 ENEMIES',icon:'✦',enabled:true},
      {id:'r4_survive',type:'survival_seconds',target:300,scope:'single_run',label:'SURVIVE FOR 5 MINUTES',icon:'◷',enabled:true},
      {id:'r4_score',type:'score',target:10000,scope:'single_run',label:'SCORE 10,000',icon:'◆',enabled:true},
      {id:'r4_level',type:'run_level',target:10,scope:'single_run',label:'REACH LEVEL 10',icon:'⌃',enabled:true}
    ]},
    5: { nextRank: 6, objectives: [
      {id:'r5_elites',type:'elite_kills',target:1,scope:'career',label:'DESTROY 1 ELITE',icon:'☠',enabled:true},
      {id:'r5_kills_run',type:'kills',target:300,scope:'single_run',label:'DESTROY 300 ENEMIES IN ONE RUN',icon:'✦',enabled:true},
      {id:'r5_distance',type:'distance',target:1500,scope:'career',label:'TRAVEL 1,500 m',icon:'➤',enabled:true},
      {id:'r5_upgrades',type:'upgrades',target:12,scope:'single_run',label:'COLLECT 12 UPGRADES',icon:'⚡',enabled:true}
    ]},
    6: { nextRank: 7, objectives: [
      {id:'r6_survive',type:'survival_seconds',target:420,scope:'single_run',label:'SURVIVE FOR 7 MINUTES',icon:'◷',enabled:true},
      {id:'r6_kills',type:'kills',target:500,scope:'career',label:'DESTROY 500 ENEMIES',icon:'✦',enabled:true},
      {id:'r6_score',type:'score',target:20000,scope:'single_run',label:'SCORE 20,000',icon:'◆',enabled:true},
      {id:'r6_level',type:'run_level',target:15,scope:'single_run',label:'REACH LEVEL 15',icon:'⌃',enabled:true}
    ]},
    7: { nextRank: 8, objectives: [
      {id:'r7_elites',type:'elite_kills',target:3,scope:'career',label:'DESTROY 3 ELITES',icon:'☠',enabled:true},
      {id:'r7_distance',type:'distance',target:2500,scope:'career',label:'TRAVEL 2,500 m',icon:'➤',enabled:true},
      {id:'r7_kills_run',type:'kills',target:400,scope:'single_run',label:'DESTROY 400 ENEMIES IN ONE RUN',icon:'✦',enabled:true},
      {id:'r7_no_damage',type:'no_damage_seconds',target:60,scope:'single_run',label:'SURVIVE 60 SEC WITHOUT DAMAGE',icon:'♥',enabled:true}
    ]},
    8: { nextRank: 9, objectives: [
      {id:'r8_survive',type:'survival_seconds',target:600,scope:'single_run',label:'SURVIVE FOR 10 MINUTES',icon:'◷',enabled:true},
      {id:'r8_score',type:'score',target:35000,scope:'single_run',label:'SCORE 35,000',icon:'◆',enabled:true},
      {id:'r8_level',type:'run_level',target:20,scope:'single_run',label:'REACH LEVEL 20',icon:'⌃',enabled:true},
      {id:'r8_elites',type:'elite_kills',target:5,scope:'career',label:'DESTROY 5 ELITES',icon:'☠',enabled:true}
    ]},
    9: { nextRank: 10, objectives: [
      {id:'r9_boss',type:'boss_kills',target:1,scope:'career',label:'DEFEAT 1 BOSS',icon:'♛',enabled:true},
      {id:'r9_kills_run',type:'kills',target:750,scope:'single_run',label:'DESTROY 750 ENEMIES IN ONE RUN',icon:'✦',enabled:true},
      {id:'r9_distance_run',type:'distance',target:4000,scope:'single_run',label:'TRAVEL 4,000 m IN ONE RUN',icon:'➤',enabled:true},
      {id:'r9_score_run',type:'score',target:50000,scope:'single_run',label:'SCORE 50,000 IN ONE RUN',icon:'◆',enabled:true}
    ]},
    10: { nextRank: null, objectives: [] }
  }
};
