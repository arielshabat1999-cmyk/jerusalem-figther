'use strict';
window.JF_ART={ready:false,chars:null,props:null};
(function(){
  async function loadB64(parts,mime){
    const chunks=await Promise.all(parts.map(p=>fetch(p,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('asset '+p);return r.text()})));
    const img=new Image();
    const ready=new Promise((resolve,reject)=>{img.onload=()=>resolve(img);img.onerror=reject});
    img.src='data:'+mime+';base64,'+chunks.join('').replace(/\s+/g,'');
    return ready;
  }
  Promise.all([
    loadB64(['assets/runtime/chars.0.b64','assets/runtime/chars.1.b64'],'image/png'),
    loadB64(['assets/runtime/props.0.b64','assets/runtime/props.1.b64'],'image/png')
  ]).then(([chars,props])=>{
    JF_ART.chars=chars;JF_ART.props=props;JF_ART.ready=true;
    window.dispatchEvent(new Event('jf-art-ready'));
  }).catch(err=>{console.warn('JF art pack fallback active',err)});
})();