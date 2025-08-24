// /controller/vuelo.js
import { setFlightStart, setFlightEnd, addMinutes } from './firebase.js';

const go = (p) => (location.href = new URL(p, location.href).toString());

const sn = localStorage.getItem('dfr:selectedDroneSN');
const flightId = localStorage.getItem('dfr:currentFlightId');
if(!sn || !flightId) go('./prevuelo.html');

let segundos = 0;
let intervalo = null;
let running = false;
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
}

function setBtnToStop(){
  btn.classList.add('terminar');
  btn.classList.remove('modo-iniciar');
  btn.innerHTML = `<i class="ph ph-stop"></i> <span>Terminar</span>`;
  btn.setAttribute('aria-pressed','true');
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

  const pct = Math.min(100, (segundos / Math.max(1, segundos)) * 100);
  el.style.left = pct + '%';
}

async function startFlight(){
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
  statusEl.textContent = "vuelo finalizado";
  setBtnToStart();

  const durationMin = Math.round(segundos / 60);
  await setFlightEnd(sn, flightId, new Date().toISOString(), durationMin, timeline);
  if (durationMin > 0) await addMinutes(sn, durationMin);
}

btn?.addEventListener('click', async ()=>{
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
    statusEl.textContent = `Fase: ${label}`;
    addMarker(label);
  });
}

setBtnToStart();
