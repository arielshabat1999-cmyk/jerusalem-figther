'use strict';
(function(){
  const A=window.JF_ART={chars:new Image(),props:new Image(),bg:new Image(),ready:false,charsReady:false,propsReady:false,bgReady:false};
  async function join(parts){const out=[];for(const p of parts){const r=await fetch(p+'?v=14',{cache:'no-store'});if(!r.ok)throw new Error('asset '+p+' '+r.status);out.push((await r.text()).trim())}return out.join('')}
  function setImage(img,key,data){return new Promise((res)=>{img.onload=()=>{A[key]=true;res(true)};img.onerror=()=>{console.error('JF art image failed',key);res(false)};img.src='data:image/webp;base64,'+data})}
  (async()=>{
    const jobs=[
      ['chars',['assets/runtime/chars.0.b64','assets/runtime/chars.1.b64'],A.chars,'charsReady'],
      ['props',['assets/runtime/props.0.b64','assets/runtime/props.1.b64'],A.props,'propsReady'],
      ['bg',['assets/runtime/bg.0.b64','assets/runtime/bg.1.b64'],A.bg,'bgReady']
    ];
    await Promise.all(jobs.map(async([name,parts,img,key])=>{try{const data=await join(parts);await setImage(img,key,data)}catch(e){console.error('JF art load failed',name,e)}}));
    A.ready=A.charsReady||A.propsReady||A.bgReady;
  })();
})();
