/* Provider-neutral production service contracts. Game code never depends on a vendor SDK directly. */
window.ServiceContracts=Object.freeze({
 auth:['signIn','signOut','session'],
 profile:['get','update'],
 cloudSave:['pull','push'],
 remoteConfig:['fetch'],
 catalog:['fetch'],
 economy:['balances','transact'],
 inventory:['list','mutate'],
 runValidation:['submit','status'],
 leaderboards:['submit','top','aroundPlayer'],
 social:['friends','invite'],
 matchmaking:['queue','status','cancel'],
 multiplayer:['connect','send','disconnect'],
 purchases:['products','purchase','restore'],
 telemetry:['event']
});
window.ServiceRequestPolicy=Object.freeze({
 schemaVersion:1,
 mutation:{requireRequestId:true,requirePlayerId:true},
 idempotencyDomains:['economy','inventory','cloudSave','runValidation','leaderboards','purchases'],
 revisionDomains:['cloudSave','economy','inventory'],
 rateLimits:{profileUpdate:{limit:10,windowSeconds:60},cloudPush:{limit:12,windowSeconds:60},economyMutation:{limit:30,windowSeconds:60},inventoryMutation:{limit:30,windowSeconds:60},runSubmit:{limit:10,windowSeconds:60},leaderboardRead:{limit:60,windowSeconds:60},leaderboardSubmit:{limit:10,windowSeconds:60},purchase:{limit:10,windowSeconds:60}},
 retry:{maxAttempts:3,baseDelayMs:500,jitter:true},
 responses:{conflict:'revision-conflict',duplicate:'idempotent-replay',rateLimited:'rate-limited',unauthorized:'unauthorized'}
});
window.GameServices=(()=>{const providers=new Map();return Object.freeze({provide(name,impl){const required=window.ServiceContracts[name];if(!required)throw new Error('Unknown service '+name);for(const method of required)if(typeof impl?.[method]!=='function')throw new Error(name+' missing '+method);providers.set(name,impl);window.GameEvents?.emit('service:ready',{name})},has:name=>providers.has(name),get(name){const p=providers.get(name);if(!p)throw new Error('Service unavailable: '+name);return p}})})();