/* V151 — Player Rank objectives: five objectives per rank through Rank 10. */
window.PLAYER_RANK_CONFIG={version:151,maxRank:10,objectivesRequired:5,ranks:{
1:{nextRank:2,objectives:[
{id:'r1_kills',type:'kills',target:25,scope:'career',label:'DESTROY 25 ENEMIES',icon:'✦',enabled:true},
{id:'r1_survive',type:'survival_seconds',target:60,scope:'single_run',label:'SURVIVE FOR 1 MINUTE',icon:'◷',enabled:true},
{id:'r1_level',type:'run_level',target:3,scope:'single_run',label:'REACH LEVEL 3',icon:'⌃',enabled:true},
{id:'r1_distance',type:'distance',target:300,scope:'career',label:'TRAVEL 300 m',icon:'➤',enabled:true},
{id:'r1_score',type:'score',target:1500,scope:'single_run',label:'SCORE 1,500',icon:'◆',enabled:true}]},
2:{nextRank:3,objectives:[
{id:'r2_kills',type:'kills',target:60,scope:'career',label:'DESTROY 60 ENEMIES',icon:'✦',enabled:true},
{id:'r2_survive',type:'survival_seconds',target:120,scope:'single_run',label:'SURVIVE FOR 2 MINUTES',icon:'◷',enabled:true},
{id:'r2_level',type:'run_level',target:5,scope:'single_run',label:'REACH LEVEL 5',icon:'⌃',enabled:true},
{id:'r2_distance',type:'distance',target:650,scope:'career',label:'TRAVEL 650 m',icon:'➤',enabled:true},
{id:'r2_score',type:'score',target:4000,scope:'single_run',label:'SCORE 4,000',icon:'◆',enabled:true}]},
3:{nextRank:4,objectives:[
{id:'r3_kills',type:'kills',target:100,scope:'career',label:'DESTROY 100 ENEMIES',icon:'✦',enabled:true},
{id:'r3_survive',type:'survival_seconds',target:180,scope:'single_run',label:'SURVIVE FOR 3 MINUTES',icon:'◷',enabled:true},
{id:'r3_level',type:'run_level',target:7,scope:'single_run',label:'REACH LEVEL 7',icon:'⌃',enabled:true},
{id:'r3_distance',type:'distance',target:1000,scope:'career',label:'TRAVEL 1,000 m',icon:'➤',enabled:true},
{id:'r3_upgrades',type:'upgrades',target:5,scope:'single_run',label:'COLLECT 5 UPGRADES',icon:'⚡',enabled:true}]},
4:{nextRank:5,objectives:[
{id:'r4_kills',type:'kills',target:160,scope:'career',label:'DESTROY 160 ENEMIES',icon:'✦',enabled:true},
{id:'r4_survive',type:'survival_seconds',target:240,scope:'single_run',label:'SURVIVE FOR 4 MINUTES',icon:'◷',enabled:true},
{id:'r4_level',type:'run_level',target:9,scope:'single_run',label:'REACH LEVEL 9',icon:'⌃',enabled:true},
{id:'r4_score',type:'score',target:10000,scope:'single_run',label:'SCORE 10,000',icon:'◆',enabled:true},
{id:'r4_no_damage',type:'no_damage_seconds',target:30,scope:'single_run',label:'SURVIVE 30 SEC WITHOUT DAMAGE',icon:'♥',enabled:true}]},
5:{nextRank:6,objectives:[
{id:'r5_kills',type:'kills',target:250,scope:'career',label:'DESTROY 250 ENEMIES',icon:'✦',enabled:true},
{id:'r5_survive',type:'survival_seconds',target:300,scope:'single_run',label:'SURVIVE FOR 5 MINUTES',icon:'◷',enabled:true},
{id:'r5_level',type:'run_level',target:12,scope:'single_run',label:'REACH LEVEL 12',icon:'⌃',enabled:true},
{id:'r5_distance',type:'distance',target:1800,scope:'career',label:'TRAVEL 1,800 m',icon:'➤',enabled:true},
{id:'r5_upgrades',type:'upgrades',target:10,scope:'single_run',label:'COLLECT 10 UPGRADES',icon:'⚡',enabled:true}]},
6:{nextRank:7,objectives:[
{id:'r6_kills',type:'kills',target:400,scope:'career',label:'DESTROY 400 ENEMIES',icon:'✦',enabled:true},
{id:'r6_survive',type:'survival_seconds',target:420,scope:'single_run',label:'SURVIVE FOR 7 MINUTES',icon:'◷',enabled:true},
{id:'r6_level',type:'run_level',target:15,scope:'single_run',label:'REACH LEVEL 15',icon:'⌃',enabled:true},
{id:'r6_score',type:'score',target:25000,scope:'single_run',label:'SCORE 25,000',icon:'◆',enabled:true},
{id:'r6_no_damage',type:'no_damage_seconds',target:45,scope:'single_run',label:'SURVIVE 45 SEC WITHOUT DAMAGE',icon:'♥',enabled:true}]},
7:{nextRank:8,objectives:[
{id:'r7_kills',type:'kills',target:600,scope:'career',label:'DESTROY 600 ENEMIES',icon:'✦',enabled:true},
{id:'r7_survive',type:'survival_seconds',target:480,scope:'single_run',label:'SURVIVE FOR 8 MINUTES',icon:'◷',enabled:true},
{id:'r7_level',type:'run_level',target:18,scope:'single_run',label:'REACH LEVEL 18',icon:'⌃',enabled:true},
{id:'r7_distance',type:'distance',target:3000,scope:'career',label:'TRAVEL 3,000 m',icon:'➤',enabled:true},
{id:'r7_upgrades',type:'upgrades',target:14,scope:'single_run',label:'COLLECT 14 UPGRADES',icon:'⚡',enabled:true}]},
8:{nextRank:9,objectives:[
{id:'r8_kills',type:'kills',target:850,scope:'career',label:'DESTROY 850 ENEMIES',icon:'✦',enabled:true},
{id:'r8_survive',type:'survival_seconds',target:600,scope:'single_run',label:'SURVIVE FOR 10 MINUTES',icon:'◷',enabled:true},
{id:'r8_level',type:'run_level',target:22,scope:'single_run',label:'REACH LEVEL 22',icon:'⌃',enabled:true},
{id:'r8_score',type:'score',target:50000,scope:'single_run',label:'SCORE 50,000',icon:'◆',enabled:true},
{id:'r8_no_damage',type:'no_damage_seconds',target:60,scope:'single_run',label:'SURVIVE 60 SEC WITHOUT DAMAGE',icon:'♥',enabled:true}]},
9:{nextRank:10,objectives:[
{id:'r9_kills',type:'kills',target:1200,scope:'career',label:'DESTROY 1,200 ENEMIES',icon:'✦',enabled:true},
{id:'r9_survive',type:'survival_seconds',target:720,scope:'single_run',label:'SURVIVE FOR 12 MINUTES',icon:'◷',enabled:true},
{id:'r9_level',type:'run_level',target:26,scope:'single_run',label:'REACH LEVEL 26',icon:'⌃',enabled:true},
{id:'r9_distance',type:'distance',target:5000,scope:'career',label:'TRAVEL 5,000 m',icon:'➤',enabled:true},
{id:'r9_upgrades',type:'upgrades',target:18,scope:'single_run',label:'COLLECT 18 UPGRADES',icon:'⚡',enabled:true}]},
10:{nextRank:null,objectives:[
{id:'r10_kills',type:'kills',target:2000,scope:'career',label:'DESTROY 2,000 ENEMIES',icon:'✦',enabled:true},
{id:'r10_survive',type:'survival_seconds',target:900,scope:'single_run',label:'SURVIVE FOR 15 MINUTES',icon:'◷',enabled:true},
{id:'r10_level',type:'run_level',target:30,scope:'single_run',label:'REACH LEVEL 30',icon:'⌃',enabled:true},
{id:'r10_score',type:'score',target:100000,scope:'single_run',label:'SCORE 100,000',icon:'◆',enabled:true},
{id:'r10_no_damage',type:'no_damage_seconds',target:90,scope:'single_run',label:'SURVIVE 90 SEC WITHOUT DAMAGE',icon:'♥',enabled:true}]}
}};