// /controller/vuelo.js
import { setFlightStart, setFlightEnd, addMinutes, getFlightById } from './firebase.js';

const go = (p) => (location.href = new URL(p, location.href).toString());

const sn = localStorage.getItem('dfr:selectedDroneSN');
const flightId = localStorage.getItem('dfr:currentFlightId');
if(!sn || !flightId) go('./prevuelo.html');

let segundos = 0;
let intervalo = null;
let running = false;
let finished = false; // Nueva variable para controlar si el vuelo ya terminó
let startMs = null;
let timeline = [];

const cronometro = document.getElementById('cronometro');
const btn        = document.getElementById('btn-cronometro');
const statusEl   = document.getElementById('status');
const timeLine   = document.getElementById('timeLine');
const markersEl  = document.getElementById('markers');

function fmt(seg){
  const s = String(seg % 60).padStart(2,"0");
  const m = String(Math.floor((seg % 3600) / 60)).padStart(2,"0");
  const h = String(Math.floor(seg / 3600)).padStart(2,"0");
  return `${h}:${m}:${s}`;
}

function setBtnToStart(){
  btn.classList.remove('terminar');
  btn.classList.add('modo-iniciar');
  btn.innerHTML = `<i class="ph ph-play"></i> <span>Iniciar</span>`;
  btn.setAttribute('aria-pressed','false');
  btn.disabled = false;
}

function setBtnToStop(){
  btn.classList.add('terminar');
  btn.classList.remove('modo-iniciar');
  btn.innerHTML = `<i class="ph ph-stop"></i> <span>Terminar</span>`;
  btn.setAttribute('aria-pressed','true');
  btn.disabled = false;
}

function setBtnToFinished(){
  btn.classList.remove('terminar', 'modo-iniciar');
  btn.classList.add('finished');
  btn.innerHTML = `<i class="ph ph-check-circle"></i> <span>Vuelo Finalizado</span>`;
  btn.setAttribute('aria-pressed','false');
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.style.cursor = 'not-allowed';
}

function layoutMarkers(elapsed){
  const total = Math.max(1, elapsed);
  const nodes = markersEl.querySelectorAll('.marker');
  nodes.forEach((node, i) => {
    const t = timeline[i]?.t ?? 0;
    const pct = Math.min(100, (t / total) * 100);
    node.style.left = pct + '%';
  });
}

function addMarker(phase){
  if(!running) return;

  const el = document.createElement('div');
  el.className = 'marker';
  el.innerText = `${fmt(segundos)}\n${phase}`;
  markersEl.appendChild(el);

  timeline.push({ t: segundos, phase });

  layoutMarkers(segundos || 1);
}

async function startFlight(){
  if (finished) return; // No permitir reiniciar si ya terminó
  
  running = true;
  startMs = Date.now();
  segundos = 0;
  timeline = [];
  markersEl.innerHTML = '';
  cronometro.textContent = fmt(0);
  statusEl.textContent = "vuelo iniciado";
  setBtnToStop();

  timeLine.style.width = '100%';

  await setFlightStart(sn, flightId, new Date().toISOString());

  intervalo = setInterval(()=>{
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    segundos = elapsed;
    cronometro.textContent = fmt(segundos);
    layoutMarkers(elapsed);
  }, 1000);
}

async function stopFlight(){
  clearInterval(intervalo);
  running = false;
  finished = true; // Marcar como terminado
  statusEl.textContent = "vuelo finalizado";
  setBtnToFinished();

  const durationMin = Math.round(segundos / 60);
  const endTime = new Date().toISOString();
  
  // Guardar datos del vuelo en localStorage para el postvuelo
  const flightData = {
    flightId,
    startTime: new Date(startMs).toISOString(),
    endTime,
    durationMin,
    timeline,
    finished: true
  };
  localStorage.setItem('dfr:lastFlightData', JSON.stringify(flightData));
  
  await setFlightEnd(sn, flightId, endTime, durationMin, timeline);
  if (durationMin > 0) await addMinutes(sn, durationMin);
}

btn?.addEventListener('click', async ()=>{
  if (finished) {
    alert('El vuelo ya ha sido finalizado. No se puede reiniciar.');
    return;
  }
  
  if(!running){
    await startFlight();
  }else{
    await stopFlight();
  }
});

const phases = [
  ['btn-hover',"Hover"], ['btn-despla',"Desplazamiento"], ['btn-acen',"Ascenso"],
  ['btn-dece',"Descenso"], ['btn-acen-despla',"Ascenso+Desplazo"], ['btn-dece-despla',"Descenso+Desplazo"]
];
for(const [id,label] of phases){
  const el = document.getElementById(id);
  el?.addEventListener('click', ()=>{
    if(!running){ alert("Inicia el cronómetro primero"); return; }
    if(finished){ alert("El vuelo ya ha sido finalizado"); return; }
    statusEl.textContent = `Fase: ${label}`;
    addMarker(label);
  });
}

// Verificar si ya hay un vuelo terminado al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  const lastFlightData = localStorage.getItem('dfr:lastFlightData');
  if (lastFlightData) {
    let data;
    try {
      data = JSON.parse(lastFlightData);
    } catch (err) {
      console.warn('No se pudo interpretar lastFlightData:', err);
      return;
    }
    if (!data.flightId && flightId) {
      data.flightId = flightId;
      localStorage.setItem('dfr:lastFlightData', JSON.stringify(data));
    }

    if (!data.finished) return;

    let shouldRestore = !flightId || data.flightId === flightId;

    if (shouldRestore && data.flightId) {
      try {
        const serverFlight = await getFlightById(sn, data.flightId);
        if (!serverFlight || serverFlight.status !== 'completed') {
          shouldRestore = false;
        }
      } catch (err) {
        console.warn('No se pudo verificar el estado del vuelo en Firestore:', err);
      }
    }

    if (shouldRestore) {
      finished = true;
      segundos = data.durationMin * 60;
      timeline = data.timeline || [];
      cronometro.textContent = fmt(segundos);
      statusEl.textContent = "vuelo finalizado";
      setBtnToFinished();
      
      // Recrear marcadores si existen
      markersEl.innerHTML = '';
      timeline.forEach(item => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.innerText = `${fmt(item.t)}\n${item.phase}`;
        markersEl.appendChild(el);
        const pct = Math.min(100, (item.t / Math.max(1, segundos)) * 100);
        el.style.left = pct + '%';
      });
    }
  }
});

setBtnToStart();
