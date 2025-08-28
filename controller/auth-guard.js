
// /controller/auth-guard.js
import { watchAuth } from './firebase.js';

const go = (p) => (location.href = new URL(p, location.href).toString());

const path       = location.pathname;
// también considerar raíz "/" como login (Live Server sirve index.html ahí)
const isLogin    = /(^|\/)index\.html$/.test(path) || /\/$/.test(path);
const isRegister = /\/register\.html$/.test(path);
const isSeed     = /\/seed\.html$/.test(path) || /\/create-admin\.html$/.test(path);

watchAuth(async (user, udoc)=>{
  if(!user){
    if(!isLogin && !isSeed) go('./index.html');
    return;
  }
  if(isLogin){ go('./views/inicio.html'); return; }
  if(isRegister && (!udoc || udoc.role!=='editor')) go('./views/inicio.html');
  if(udoc) sessionStorage.setItem('dfr:role', udoc.role);
});
