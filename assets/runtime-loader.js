'use strict';
(function(){
  const A=window.JF_ART={chars:new Image(),props:new Image(),bg:new Image(),ready:false,charsReady:false,propsReady:false,bgReady:false};
  async function join(parts){const out=[];for(const p of parts){const r=await fetch(p+'?v=12',{cache:'no-store'});if(!r.ok)throw new Error('asset '+p+' '+r.status);out.push((await r.text()).trim())}return out.join('')}
  function wait(img,key){return new Promise((res,rej)=>{img.onload=()=>{A[key]=true;res()};img.onerror=rej})}
  (async()=>{
    try{
      const [c,p,b]=await Promise.all([
        join(['assets/runtime/chars.0.b64','assets/runtime/chars.1.b64']),
        join(['assets/runtime/props.0.b64','assets/runtime/props.1.b64']),
        join(['assets/runtime/bg.0.b64','assets/runtime/bg.1.b64'])
      ]);
      const wc=wait(A.chars,'charsReady'),wp=wait(A.props,'propsReady'),wb=wait(A.bg,'bgReady');
      A.chars.src='data:image/webp;base64,'+c;
      A.props.src='data:image/webp;base64,'+p;
      A.bg.src='data:image/webp;base64,'+b;
      await Promise.all([wc,wp,wb]);A.ready=true;
    }catch(e){console.error('JF art load failed',e)}
  })();
})();
