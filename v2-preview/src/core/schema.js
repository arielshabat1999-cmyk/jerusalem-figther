/* Minimal runtime schema validation for remote/local content. No external dependency. */
window.GameSchemaValidator=Object.freeze({
  requireObject(value,name='value'){if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(name+' must be an object');return value},
  requireString(value,name='value'){if(typeof value!=='string'||!value.trim())throw new Error(name+' must be a non-empty string');return value},
  requireNumber(value,name='value',{min=-Infinity,max=Infinity}={}){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error(name+' must be a finite number in range');return value},
  requireArray(value,name='value'){if(!Array.isArray(value))throw new Error(name+' must be an array');return value},
  objective(o,name='objective'){this.requireObject(o,name);this.requireString(o.id,name+'.id');this.requireString(o.metric,name+'.metric');this.requireNumber(o.target,name+'.target',{min:0});if(!['career','run'].includes(o.scope))throw new Error(name+'.scope invalid');return o},
  rankCatalog(c){this.requireObject(c,'rankCatalog');this.requireNumber(c.schemaVersion,'rankCatalog.schemaVersion',{min:1});this.requireObject(c.ranks,'rankCatalog.ranks');for(const [rank,d] of Object.entries(c.ranks)){this.requireObject(d,'rank '+rank);this.requireArray(d.objectives,'rank '+rank+'.objectives');d.objectives.forEach((o,i)=>this.objective(o,`rank ${rank}.objectives[${i}]`))}return c}
});
