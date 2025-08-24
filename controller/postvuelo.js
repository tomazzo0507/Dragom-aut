// /controller/postvuelo.js
import { getLastCompletedFlight, getDrone, savePostflight } from './firebase.js';

// ====== Helpers ======
const qs  = (s, r=document) => r.querySelector(s);
const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v ?? '—'; };
const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };

function pad2(n){ return String(n).padStart(2,'0'); }
function isoToHHMM(iso){
  if(!iso) return '';
  const d = new Date(iso);
  if(Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function ensureCanvasScale(canvas){
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 300;
  const cssH = canvas.clientHeight || 150;
  canvas.width  = Math.max(1, Math.floor(cssW * dpr));
  canvas.height = Math.max(1, Math.floor(cssH * dpr));
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#eaeaf0';
  ctx.fillStyle   = '#0f0f12';
  ctx.fillRect(0, 0, cssW, cssH);
  return ctx;
}

function clearCanvas(canvas){
  const ctx = canvas.getContext('2d');
  const cssW = canvas.clientWidth || 300;
  const cssH = canvas.clientHeight || 150;
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.restore();
  ensureCanvasScale(canvas); // repinta fondo
}

function setupDraw(canvas){
  ensureCanvasScale(canvas);
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let last = null;

  const getPos = (e)=>{
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  };

  const down = (e)=>{ e.preventDefault(); drawing = true; last = getPos(e); };
  const move = (e)=>{
    if(!drawing) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  };
  const up = ()=>{ drawing = false; };

  canvas.addEventListener('mousedown', down);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);

  canvas.addEventListener('touchstart', down, {passive:false});
  canvas.addEventListener('touchmove',  move, {passive:false});
  window.addEventListener('touchend',   up);
  window.addEventListener('touchcancel',up);
}

function canvasToDataURL(canvas){
  const w = canvas.clientWidth || 300;
  const h = canvas.clientHeight || 150;
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height= h;
  const ctx = tmp.getContext('2d');
  ctx.drawImage(canvas, 0, 0, w, h);
  return tmp.toDataURL('image/png');
}

// ====== Estado ======
const sn = localStorage.getItem('dfr:selectedDroneSN');
if(!sn) location.href = '/views/inicio.html';

let currentFlight = null;   // { startTime, endTime, durationMin, preflight, ... }
let durationMin   = 0;
let drone         = null;

// ====== DOM ======
const formPost     = document.getElementById('post-form');

const inpDespegue  = document.getElementById('hora_despegue');
const inpAterr     = document.getElementById('hora_aterrizaje');
const inpTiempo    = document.getElementById('tiempo_vuelo');

const nameLider    = document.getElementById('nom_lider');
const namePI       = document.getElementById('nom_piloto_int');
// quick fix to keep the code valid after a stray label above
const _noop = null;
const namePE       = document.getElementById('nom_piloto_ext');
const nameIng      = document.getElementById('nom_ingeVu');

// Equip ids (S/N y minutos)
const ids = {
  ac:  { sn:'ac_sn', hoy:'ac_mins_hoy', tot:'ac_mins_total' },
  b1:  { sn:'b1_sn', hoy:'b1_mins_hoy', tot:'b1_mins_total' },
  b2:  { sn:'b2_sn', hoy:'b2_mins_hoy', tot:'b2_mins_total' },
  m1:  { sn:'m1_sn', hoy:'m1_mins_hoy', tot:'m1_mins_total' },
  m2:  { sn:'m2_sn', hoy:'m2_mins_hoy', tot:'m2_mins_total' },
  m3:  { sn:'m3_sn', hoy:'m3_mins_hoy', tot:'m3_mins_total' },
  m4:  { sn:'m4_sn', hoy:'m4_mins_hoy', tot:'m4_mins_total' },
};

// ====== Inicialización ======
async function boot(){
  try{
    // 1) Traer último vuelo COMPLETADO del dron
    const f = await getLastCompletedFlight(sn);
    if(!f || !f.endTime){
      alert('No hay un vuelo finalizado para registrar post-vuelo. Ve a "Iniciar vuelo".');
      location.href = '/views/vuelo.html';
      return;
    }
    currentFlight = f;
    durationMin = Number(f.durationMin || Math.round((new Date(f.endTime)-new Date(f.startTime))/60000)) || 0;

    // 2) Resumen de vuelo (AUTO)
    setVal('hora_despegue', isoToHHMM(f.startTime));
    setVal('hora_aterrizaje', isoToHHMM(f.endTime));
    setVal('tiempo_vuelo', `${durationMin} min`);

    // 3) Nombres de firmas desde preflight.tripulacion (AUTO)
    const crew = f?.preflight?.tripulacion || {};
    if (nameLider) nameLider.value = crew.lider || '';
    if (namePI)    namePI.value    = crew.piloto_int || '';
    if (namePE)    namePE.value    = crew.piloto_ext || '';
    if (nameIng)   nameIng.value   = crew.ing_vuelo  || '';

    // 4) Datos de aeronave/equipos (AUTO)
    drone = await getDrone(sn).catch(()=>null);

    // Aircraft
    setTxt(ids.ac.sn, sn);
    setTxt(ids.ac.hoy, `${durationMin} min`);
    setTxt(ids.ac.tot, `${(drone?.minutes_total ?? 0)} min`);

    // Batteries
    const b1 = drone?.batteries?.[0];
    const b2 = drone?.batteries?.[1];
    setTxt(ids.b1.sn,  b1?.sn || '—');
    setTxt(ids.b2.sn,  b2?.sn || '—');
    setTxt(ids.b1.hoy, `${durationMin} min`);
    setTxt(ids.b2.hoy, `${durationMin} min`);
    setTxt(ids.b1.tot, `${b1?.minutes ?? 0} min`);
    setTxt(ids.b2.tot, `${b2?.minutes ?? 0} min`);

    // Motors
    for(let i=0;i<4;i++){
      const m = drone?.motors?.[i];
      const id = ids[`m${i+1}`];
      if(!id) continue;
      setTxt(id.sn,  m?.sn || '—');
      setTxt(id.hoy, `${durationMin} min`);
      setTxt(id.tot, `${m?.minutes ?? 0} min`);
    }

    // 5) Firmas: preparar canvases + modal
    initSignatures();

  }catch(err){
    console.error(err);
    alert('No fue posible cargar el post-vuelo.');
    location.href = '/views/inicio.html';
  }
}

// ====== Firmas ======
function initSignatures(){
  const canvases = ['firma_lider','firma_piloto_int','firma_piloto_ext','firma_ingeVu']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  canvases.forEach(c=>{
    setupDraw(c);
    // Re-escala si cambia el layout
    const ro = new ResizeObserver(()=> ensureCanvasScale(c));
    ro.observe(c);
  });

  // Limpiar firma (en card)
  qsa('.limpiar-firma').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-canvas');
      const cv = document.getElementById(id);
      if(cv) clearCanvas(cv);
    });
  });

  // Guardar firma (en card) => guarda en window.* para enviar
  qsa('.guardar-firma').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-canvas');
      const cv = document.getElementById(id);
      if(!cv) return;
      const url = canvasToDataURL(cv);
      // variables globales para submit
      if(id==='firma_lider')        window.firma_lider_dataURL = url;
      if(id==='firma_piloto_int')   window.firma_piloto_int_dataURL = url;
      if(id==='firma_piloto_ext')   window.firma_piloto_ext_dataURL = url;
      if(id==='firma_ingeVu')       window.firma_ingeVu_dataURL = url;
      alert('Firma guardada.');
    });
  });

  // ===== Modal móvil =====
  const modal = document.getElementById('firmaModal');
  const modalCanvas = document.getElementById('modalCanvas');
  const modalClose  = document.getElementById('modalClose');
  const btnsOpen    = qsa('.firma-btn-mobile');

  let targetCanvas = null;

  function openModalFor(targetId){
    targetCanvas = document.getElementById(targetId);
    if(!targetCanvas) return;
    // reset/prepare modal canvas
    ensureCanvasScale(modalCanvas);
    setupDraw(modalCanvas);
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    targetCanvas = null;
    clearCanvas(modalCanvas);
  }

  btnsOpen.forEach(b=>{
    b.addEventListener('click', ()=> openModalFor(b.dataset.canvas));
  });
  modalClose?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });

  // Acciones dentro del modal
  qs('.limpiar-firma-modal')?.addEventListener('click', ()=> clearCanvas(modalCanvas));
  qs('.guardar-firma-modal')?.addEventListener('click', ()=>{
    if(!targetCanvas) return;
    // Copiar del modal al canvas real
    const url = canvasToDataURL(modalCanvas);

    const img = new Image();
    img.onload = ()=>{
      const ctx = targetCanvas.getContext('2d');
      ensureCanvasScale(targetCanvas);
      const w = targetCanvas.clientWidth;
      const h = targetCanvas.clientHeight;
      ctx.drawImage(img, 0, 0, w, h);
      // persistir variable global
      if(targetCanvas.id==='firma_lider')        window.firma_lider_dataURL = url;
      if(targetCanvas.id==='firma_piloto_int')   window.firma_piloto_int_dataURL = url;
      if(targetCanvas.id==='firma_piloto_ext')   window.firma_piloto_ext_dataURL = url;
      if(targetCanvas.id==='firma_ingeVu')       window.firma_ingeVu_dataURL = url;
      closeModal();
    };
    img.src = url;
  });
}

// ====== Submit ======
formPost?.addEventListener('submit', async (e)=>{
  e.preventDefault();

  // Recolectar datos simples (usa el name o label/placeholder)
  const data = {};
  qsa('input, textarea', formPost).forEach(el=>{
    const key = (el.name || el.getAttribute('placeholder') || el.previousElementSibling?.textContent || '').trim();
    if(!key) return;
    data[key] = el.value;
  });

  // Forzar los del resumen (asegura llaves exactas)
  data['Hora despegue']   = inpDespegue?.value || data['Hora despegue'] || '';
  data['Hora aterrizaje'] = inpAterr?.value    || data['Hora aterrizaje'] || '';
  data['Tiempo de vuelo'] = inpTiempo?.value   || data['Tiempo de vuelo'] || `${durationMin} min`;

  // Adjuntar firmas (dataURL)
  data['firma_lider']          = window.firma_lider_dataURL || null;
  data['firma_piloto_interno'] = window.firma_piloto_int_dataURL || null;
  data['firma_piloto_externo'] = window.firma_piloto_ext_dataURL || null;
  data['firma_ing_vuelo']      = window.firma_ingeVu_dataURL || null;

  // También persistimos nombres (por claridad en reportes)
  data['nombre_lider']          = nameLider?.value || null;
  data['nombre_piloto_interno'] = namePI?.value    || null;
  data['nombre_piloto_externo'] = namePE?.value    || null;
  data['nombre_ing_vuelo']      = nameIng?.value   || null;

  try{
    const flightId = localStorage.getItem('dfr:currentFlightId') || currentFlight?.id || null;
    if(!flightId){
      console.warn('No hay flightId en LS; se usará el último vuelo terminado.');
    }

    await savePostflight(sn, flightId, data);

    // Ya quedó el vuelo completo -> limpiar estado y avanzar a reporte
    localStorage.removeItem('dfr:currentFlightId');
    location.href = '/views/report.html';
  }catch(err){
    console.error(err);
    alert('No se pudo guardar el post-vuelo. Intenta nuevamente.');
  }
});

// ====== Go! ======
document.addEventListener('DOMContentLoaded', boot);
