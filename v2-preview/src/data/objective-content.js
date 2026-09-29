(()=>{const catalog={schemaVersion:1,objectiveXP:{daily:120,weekly:350,player:180},daily:[
{id:'d.kills.25',metric:'kills',target:25,scope:'career',label:'DESTROY 25 ENEMIES',icon:'✦'},
{id:'d.distance.1200',metric:'distance',target:1200,scope:'career',label:'TRAVEL 1,200 m',icon:'➤'},
{id:'d.survive.180',metric:'survival_seconds',target:180,scope:'run',label:'SURVIVE 3 MINUTES',icon:'◷'},
{id:'d.upgrades.5',metric:'upgrades',target:5,scope:'run',label:'COLLECT 5 UPGRADES',icon:'⚡'},
{id:'d.score.8000',metric:'score',target:8000,scope:'run',label:'SCORE 8,000 IN ONE RUN',icon:'◆'},
{id:'d.elite.1',metric:'elite_kills',target:1,scope:'career',label:'DESTROY 1 ELITE',icon:'☠'}
],weekly:[
{id:'w.kills.250',metric:'kills',target:250,scope:'career',label:'DESTROY 250 ENEMIES',icon:'✦'},
{id:'w.distance.10000',metric:'distance',target:10000,scope:'career',label:'TRAVEL 10,000 m',icon:'➤'},
{id:'w.boss.1',metric:'boss_kills',target:1,scope:'career',label:'DEFEAT 1 BOSS',icon:'♛'},
{id:'w.score.30000',metric:'score',target:30000,scope:'run',label:'SCORE 30,000 IN ONE RUN',icon:'◆'},
{id:'w.survive.600',metric:'survival_seconds',target:600,scope:'run',label:'SURVIVE 10 MINUTES',icon:'◷'},
{id:'w.upgrades.20',metric:'upgrades',target:20,scope:'run',label:'COLLECT 20 UPGRADES IN ONE RUN',icon:'⚡'}
],player:[
{id:'p.kills.75',metric:'kills',target:75,scope:'career',label:'DESTROY 75 ENEMIES',icon:'✦',minLevel:1},
{id:'p.distance.3000',metric:'distance',target:3000,scope:'career',label:'TRAVEL 3,000 m',icon:'➤',minLevel:1},
{id:'p.survive.300',metric:'survival_seconds',target:300,scope:'run',label:'SURVIVE 5 MINUTES',icon:'◷',minLevel:1},
{id:'p.score.15000',metric:'score',target:15000,scope:'run',label:'SCORE 15,000 IN ONE RUN',icon:'◆',minLevel:2},
{id:'p.elites.3',metric:'elite_kills',target:3,scope:'career',label:'DESTROY 3 ELITES',icon:'☠',minLevel:3},
{id:'p.upgrades.10',metric:'upgrades',target:10,scope:'run',label:'COLLECT 10 UPGRADES',icon:'⚡',minLevel:2},
{id:'p.nodamage.60',metric:'no_damage_seconds',target:60,scope:'run',label:'SURVIVE 60 SEC WITHOUT DAMAGE',icon:'♥',minLevel:4},
{id:'p.boss.1',metric:'boss_kills',target:1,scope:'career',label:'DEFEAT A BOSS',icon:'♛',minLevel:5}
],achievements:[
{id:'a.kills.100',metric:'kills',target:100,scope:'career',label:'FIRST HUNDRED',description:'Destroy 100 enemies.',icon:'✦',reward:{coins:500,ap:10}},
{id:'a.kills.1000',metric:'kills',target:1000,scope:'career',label:'ACE HUNTER',description:'Destroy 1,000 enemies.',icon:'✦',reward:{coins:2500,ap:30}},
{id:'a.distance.25000',metric:'distance',target:25000,scope:'career',label:'DEEP SPACE',description:'Travel 25,000 meters.',icon:'➤',reward:{coins:2000,ap:25}},
{id:'a.elites.25',metric:'elite_kills',target:25,scope:'career',label:'ELITE BREAKER',description:'Destroy 25 elite enemies.',icon:'☠',reward:{gems:5,ap:35}},
{id:'a.boss.10',metric:'boss_kills',target:10,scope:'career',label:'TITAN SLAYER',description:'Defeat 10 bosses.',icon:'♛',reward:{gems:10,ap:50}},
{id:'a.secret.nodamage',metric:'no_damage_seconds',target:180,scope:'run',label:'UNTOUCHABLE',description:'Survive 3 minutes without taking damage.',icon:'?',hidden:true,reward:{gems:8,ap:40}}
]};window.ObjectiveContent=catalog;GameConfig?.register('objectiveContent',catalog)})();