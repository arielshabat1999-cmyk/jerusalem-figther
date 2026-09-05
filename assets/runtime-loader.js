'use strict';
(function(){
  const A=window.JF_ART={chars:new Image(),props:new Image(),bg:new Image(),ready:false,charsReady:false,propsReady:false,bgReady:false};
  const V='15';
  async function join(parts){const out=[];for(const p of parts){const r=await fetch(p+'?v='+V,{cache:'no-store'});if(!r.ok)throw new Error('asset '+p+' '+r.status);out.push((await r.text()).trim())}return out.join('')}
  function loadUrl(img,key,url){return new Promise((res)=>{img.onload=()=>{A[key]=true;res(true)};img.onerror=(e)=>{console.error('JF art image failed',key,url,e);res(false)};img.src=url+'?v='+V})}
  function loadData(img,key,data){return new Promise((res)=>{img.onload=()=>{A[key]=true;res(true)};img.onerror=(e)=>{console.error('JF art data failed',key,e);res(false)};img.src='data:image/webp;base64,'+data})}
  (async()=>{
    const charJob=loadUrl(A.chars,'charsReady','assets/characters_atlas.png');
    const propJob=(async()=>{try{return await loadData(A.props,'propsReady',await join(['assets/runtime/props.0.b64','assets/runtime/props.1.b64']))}catch(e){console.error('props load failed',e);return false}})();
    const bgJob=(async()=>{try{return await loadData(A.bg,'bgReady',await join(['assets/runtime/bg.0.b64','assets/runtime/bg.1.b64']))}catch(e){console.error('bg load failed',e);return false}})();
    await Promise.all([charJob,propJob,bgJob]);
    A.ready=A.charsReady||A.propsReady||A.bgReady;
  })();
})();