/* Provider-neutral contracts for the future live-service backend.
   Game code depends on these capabilities, never directly on Firebase/Supabase/PlayFab/etc. */
window.ServiceContracts=Object.freeze({
 auth:['signIn','signOut','session'],profile:['get','update'],cloudSave:['pull','push'],remoteConfig:['fetch'],catalog:['fetch'],economy:['balances','grant','spend'],inventory:['list','equip'],leaderboards:['submit','top','aroundPlayer'],social:['friends','invite'],matchmaking:['join','cancel'],multiplayer:['connect','send','disconnect'],purchases:['products','purchase','restore'],telemetry:['event']
});
window.GameServices=(()=>{const providers=new Map();return Object.freeze({provide(name,impl){const required=window.ServiceContracts[name];if(!required)throw new Error('Unknown service '+name);for(const method of required)if(typeof impl?.[method]!=='function')throw new Error(name+' missing '+method);providers.set(name,impl);window.GameEvents?.emit('service:ready',{name})},has:name=>providers.has(name),get(name){const p=providers.get(name);if(!p)throw new Error('Service unavailable: '+name);return p}})})();
