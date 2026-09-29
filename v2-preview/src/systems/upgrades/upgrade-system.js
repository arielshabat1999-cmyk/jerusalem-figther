(()=>{const defs=new Map(),chosen=[];
const catalog=[
['calibrated_core','CALIBRATED CORE','Weapon','Improves main weapon damage.','calibrated-core.webp','common',100],
['turbo_cycler','TURBO CYCLER','Weapon','Increases main weapon fire rate.','turbo-cycler.webp','common',100],
['extra_cannon','EXTRA CANNON','Weapon','Adds an additional forward cannon.','extra-cannon.webp','rare',65],
['heavy_caliber','HEAVY CALIBER','Weapon','Heavier rounds with greater impact.','heavy-caliber.webp','rare',75],
['piercing_rounds','PIERCING ROUNDS','Weapon','Shots can penetrate additional targets.','piercing-rounds.webp','rare',70],
['explosive_rounds','EXPLOSIVE ROUNDS','Weapon','Rounds create an explosion on impact.','explosive-rounds.webp','epic',35],
['homing_projectiles','HOMING PROJECTILES','Weapon','Projectiles gain target guidance.','homing-projectiles.webp','epic',30],
['ion_velocity','ION VELOCITY','Weapon','Increases projectile travel speed.','ion-velocity.webp','common',100],
['missile_clock','MISSILE CLOCK','Special','Reduces missile cycle time.','missile-clock.webp','rare',60],
['chain_lightning','CHAIN LIGHTNING','Special','Energy can arc between nearby enemies.','chain-lightning.webp','epic',28],
['nova_pulse','NOVA PULSE','Special','Adds a powerful radial energy pulse effect.','nova-pulse.webp','legendary',10],
['shield_capacitor','SHIELD CAPACITOR','Defense','Increases temporary run shield capacity.','shield-capacitor.webp','common',90],
['shield_regeneration','SHIELD REGENERATION','Defense','Improves shield recovery during the run.','shield-regeneration.webp','rare',65],
['thruster_tuning','THRUSTER TUNING','Mobility','Improves temporary ship movement speed.','thruster-tuning.webp','common',90],
['evasion_matrix','EVASION MATRIX','Mobility','Improves evasive movement capability.','evasion-matrix.webp','epic',25]
];
const apply={
calibrated_core:e=>e.data.damageMultiplier=(e.data.damageMultiplier||1)*1.12,
turbo_cycler:e=>e.data.fireRateMultiplier=(e.data.fireRateMultiplier||1)*1.10,
ion_velocity:e=>e.data.projectileSpeedMultiplier=(e.data.projectileSpeedMultiplier||1)*1.15,
shield_capacitor:e=>{if(e.shield){e.shield.max*=1.15;e.shield.current=Math.min(e.shield.max,e.shield.current+e.shield.max*.15)}},
shield_regeneration:e=>{e.data.shieldRechargeMultiplier=(e.data.shieldRechargeMultiplier||1)*1.15},
thruster_tuning:e=>e.data.runSpeedMultiplier=(e.data.runSpeedMultiplier||1)*1.08,
extra_cannon:e=>e.data.extraCannons=(e.data.extraCannons||0)+1,
heavy_caliber:e=>{e.data.damageMultiplier=(e.data.damageMultiplier||1)*1.15;e.data.projectileRadiusMultiplier=(e.data.projectileRadiusMultiplier||1)*1.08},
piercing_rounds:e=>e.data.pierceCount=(e.data.pierceCount||0)+1,
explosive_rounds:e=>{e.data.explosionRadius=(e.data.explosionRadius||0)+54;e.data.explosionDamageRatio=Math.max(e.data.explosionDamageRatio||0,.45)},
homing_projectiles:e=>e.data.homingStrength=(e.data.homingStrength||0)+1,
missile_clock:e=>e.data.missileCooldownMultiplier=(e.data.missileCooldownMultiplier||1)*.88,
chain_lightning:e=>{e.data.chainCount=(e.data.chainCount||0)+1;e.data.chainDamageRatio=Math.max(e.data.chainDamageRatio||0,.5)},
nova_pulse:e=>{e.data.novaPulse=(e.data.novaPulse||0)+1;e.data.novaRadius=120},
evasion_matrix:e=>e.data.evasionChance=Math.min(.35,(e.data.evasionChance||0)+.06)
};
const system={id:'upgrades',dependsOn:['world'],start(){for(const [id,name,category,description,icon,rarity,offerWeight] of catalog)system.register({id,name,category,description,icon:'assets/upgrade-icons-v102/'+icon,rarity,offerWeight,apply:apply[id]||((e)=>{e.data.evolutionTraits=e.data.evolutionTraits||{};e.data.evolutionTraits[id]=(e.data.evolutionTraits[id]||0)+1})});GameEvents.on('run:started',()=>chosen.length=0)},register(def){if(!def?.id||typeof def.apply!=='function')throw new Error('Invalid upgrade');defs.set(def.id,def)},get:id=>defs.get(id)||null,select(id,entityId){const d=defs.get(id),e=WorldSystem.get(entityId);if(!d||!e)return false;d.apply(e);chosen.push(id);GameEvents.emit('upgrade:selected',{upgradeId:id,entityId,count:chosen.length,definition:{id:d.id,name:d.name,rarity:d.rarity}});return true},available:()=>[...defs.keys()],definitions:()=>[...defs.values()].map(d=>({id:d.id,name:d.name,category:d.category,description:d.description,icon:d.icon,rarity:d.rarity,offerWeight:d.offerWeight??100})),snapshot:()=>({chosen:[...chosen]})};GameSystems.register(system);window.UpgradeSystem=system})();