(()=>{const defs=new Map(),chosen=[],levels=new Map(),MAX_LEVEL=5;
const catalog=[
['calibrated_core','CALIBRATED CORE','Weapon','+10% weapon damage per level.','calibrated-core.webp','common',100],
['turbo_cycler','TURBO CYCLER','Weapon','+10% fire rate per level.','turbo-cycler.webp','common',100],
['extra_cannon','EXTRA CANNON','Weapon','Adds shots each level; LV5 becomes an 8-shot wide fan.','extra-cannon.webp','rare',65],
['heavy_caliber','HEAVY CALIBER','Weapon','Adds +5 flat damage per level.','heavy-caliber.webp','rare',75],
['piercing_rounds','PIERCING ROUNDS','Weapon','Adds one penetrated enemy per level.','piercing-rounds.webp','rare',70],
['explosive_rounds','EXPLOSIVE ROUNDS','Weapon','Increases explosion radius; enemies inside also take damage.','explosive-rounds.webp','epic',35],
['homing_projectiles','TARGET GUIDANCE','Weapon','More shots aim at enemies when fired; shots do not track afterward.','homing-projectiles.webp','epic',30],
['ion_velocity','ION VELOCITY','Weapon','+10% projectile speed per level.','ion-velocity.webp','common',100],
['missile_clock','MISSILE SYSTEM','Special','Automatic missiles fire faster each level; LV4 fires 2 and LV5 fires 3.','missile-clock.webp','rare',60],
['chain_lightning','CHAIN LIGHTNING','Special','Adds one additional lightning jump per level.','chain-lightning.webp','epic',28],
['nova_pulse','NOVA FIELD','Special','Permanent close-range electric field; each level expands its radius.','nova-pulse.webp','legendary',10],
['shield_capacitor','SHIELD CAPACITOR','Defense','+15% shield capacity per level.','shield-capacitor.webp','common',90],
['shield_regeneration','SHIELD REGENERATION','Defense','Improves shield recharge speed only.','shield-regeneration.webp','rare',65],
['thruster_tuning','THRUSTER TUNING','Mobility','+8% movement speed per level.','thruster-tuning.webp','common',90]
];
const apply={
calibrated_core:(e,l)=>e.data.damageMultiplier=1+.10*l,
turbo_cycler:(e,l)=>e.data.fireRateMultiplier=1+.10*l,
extra_cannon:(e,l)=>{e.data.shotCount=l>=5?8:1+l;e.data.wideFan=l>=5},
heavy_caliber:(e,l)=>e.data.flatDamageBonus=5*l,
piercing_rounds:(e,l)=>e.data.pierceCount=l,
explosive_rounds:(e,l)=>{e.data.explosionRadius=32+18*l;e.data.explosionDamageRatio=.45},
homing_projectiles:(e,l)=>e.data.guidedShotCount=l,
ion_velocity:(e,l)=>e.data.projectileSpeedMultiplier=1+.10*l,
missile_clock:(e,l)=>{e.data.missileLevel=l;e.data.missileInterval=[0,5.5,4.7,3.9,3.2,2.5][l];e.data.missileCount=l>=5?3:l>=4?2:1},
chain_lightning:(e,l)=>{e.data.chainCount=l;e.data.chainDamageRatio=.5},
nova_pulse:(e,l)=>{e.data.novaPulse=l;e.data.novaRadius=70+(l-1)*22;e.data.novaDamagePerSecond=18},
shield_capacitor:(e,l)=>{if(!e.shield)return;if(!e.data.evolutionBaseShield)e.data.evolutionBaseShield=e.shield.max;const old=e.shield.max;e.shield.max=e.data.evolutionBaseShield*(1+.15*l);e.shield.current=Math.min(e.shield.max,e.shield.current+(e.shield.max-old))},
shield_regeneration:(e,l)=>e.data.shieldRechargeMultiplier=1+.15*l,
thruster_tuning:(e,l)=>e.data.runSpeedMultiplier=1+.08*l
};
const system={id:'upgrades',dependsOn:['world'],start(){for(const [id,name,category,description,icon,rarity,offerWeight] of catalog)system.register({id,name,category,description,icon:'assets/upgrade-icons-v102/'+icon,rarity,offerWeight,apply:apply[id]});GameEvents.on('run:started',()=>{chosen.length=0;levels.clear()})},register(def){if(!def?.id||typeof def.apply!=='function')throw new Error('Invalid upgrade');defs.set(def.id,def)},get:id=>defs.get(id)||null,select(id,entityId){const d=defs.get(id),e=WorldSystem.get(entityId),before=levels.get(id)||0;if(!d||!e||before>=MAX_LEVEL)return false;const level=before+1;d.apply(e,level);levels.set(id,level);chosen.push(id);GameEvents.emit('upgrade:selected',{upgradeId:id,entityId,level,maxLevel:MAX_LEVEL,completed:level>=MAX_LEVEL,count:chosen.length,definition:{id:d.id,name:d.name,rarity:d.rarity}});return true},available:()=>[...defs.keys()].filter(id=>(levels.get(id)||0)<MAX_LEVEL),definitions:()=>[...defs.values()].filter(d=>(levels.get(d.id)||0)<MAX_LEVEL).map(d=>({id:d.id,name:d.name,category:d.category,description:d.description,icon:d.icon,rarity:d.rarity,offerWeight:d.offerWeight??100,level:levels.get(d.id)||0,nextLevel:(levels.get(d.id)||0)+1,maxLevel:MAX_LEVEL,isNew:!levels.get(d.id)})),snapshot:()=>({chosen:[...chosen],levels:Object.fromEntries(levels),maxLevel:MAX_LEVEL,branchCount:defs.size})};GameSystems.register(system);window.UpgradeSystem=system})();