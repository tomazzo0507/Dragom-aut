// /controller/vuelo.js
import { setFlightStart, setFlightEnd, addMinutes, getFlightById } from './firebase.js';

const go = (p) => (location.href = new URL(p, location.href).toString());

const sn = localStorage.getItem('dfr:selectedDroneSN');
const flightId = localStorage.getItem('dfr:currentFlightId');
if (!sn || !flightId) go('./prevuelo.html');


let segundos = 0;
let intervalo = null;
let running = false;
let finished = false; // Nueva variable para controlar si el vuelo ya terminó
let startMs = null;
let timeline = [];

// ===== Operativo: estado =====
let opSegundos = 0;
let opIntervalo = null;
let opRunning = false;
let opFinished = false;
let opStartMs = null;
let opLoad = false;       // false: Sin carga, true: Lleva carga
let opEvents = [];        // { t, type: 'load_on'|'load_off'|'released', weight? }

const cronometro = document.getElementById('cronometro');
const btn = document.getElementById('btn-cronometro');
const statusEl = document.getElementById('status');
const timeLine = document.getElementById('timeLine');
const markersEl = document.getElementById('markers');

// Selector de modo y paneles
const selectorWrap = document.getElementById('flight-type-selector');
const panelTest = document.getElementById('panel-test');
const panelOp = document.getElementById('panel-op');
const timelineWrap = document.getElementById('timeline-test');
const btnModeTest = document.getElementById('btn-mode-test');
const btnModeOp = document.getElementById('btn-mode-op');
const backRowTest = document.getElementById('back-row-test');
const backRowOp = document.getElementById('back-row-op');
const btnBackTest = document.getElementById('btn-back-test');
const btnBackOp = document.getElementById('btn-back-op');

function showMode(mode) {
  localStorage.setItem('dfr:flightMode', mode);
  if (selectorWrap) selectorWrap.style.display = 'none';
  if (mode === 'test') {
    if (panelTest) panelTest.style.display = '';
    if (timelineWrap) timelineWrap.style.display = '';
    if (panelOp) panelOp.style.display = 'none';
    if (backRowTest) backRowTest.style.display = '';
    if (backRowOp) backRowOp.style.display = 'none';
  } else if (mode === 'op') {
    if (panelTest) panelTest.style.display = 'none';
    if (timelineWrap) timelineWrap.style.display = 'none';
    if (panelOp) panelOp.style.display = '';
    if (backRowTest) backRowTest.style.display = 'none';
    if (backRowOp) backRowOp.style.display = '';
  }
}

btnModeTest?.addEventListener('click', () => showMode('test'));
btnModeOp?.addEventListener('click', () => showMode('op'));
btnBackTest?.addEventListener('click', () => {
  if (running) return; // no volver si ya inició
  if (selectorWrap) selectorWrap.style.display = '';
  if (panelTest) panelTest.style.display = 'none';
  if (timelineWrap) timelineWrap.style.display = 'none';
  if (backRowTest) backRowTest.style.display = 'none';
});
btnBackOp?.addEventListener('click', () => {
  if (opRunning) return; // no volver si ya inició
  if (selectorWrap) selectorWrap.style.display = '';
  if (panelOp) panelOp.style.display = 'none';
  if (backRowOp) backRowOp.style.display = 'none';
});

function fmt(seg) {
  const s = String(seg % 60).padStart(2, "0");
  const m = String(Math.floor((seg % 3600) / 60)).padStart(2, "0");
  const h = String(Math.floor(seg / 3600)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function setBtnToStart() {
  btn.classList.remove('terminar');
  btn.classList.add('modo-iniciar');
  btn.innerHTML = `<i class="ph ph-play"></i> <span>Iniciar</span>`;
  btn.setAttribute('aria-pressed', 'false');
  btn.disabled = false;
}

function setBtnToStop() {
  btn.classList.add('terminar');
  btn.classList.remove('modo-iniciar');
  btn.innerHTML = `<i class="ph ph-stop"></i> <span>Terminar</span>`;
  btn.setAttribute('aria-pressed', 'true');
  btn.disabled = false;
}

function setBtnToFinished() {
  btn.classList.remove('terminar', 'modo-iniciar');
  btn.classList.add('finished');
  btn.innerHTML = `<i class="ph ph-check-circle"></i> <span>Vuelo Finalizado</span>`;
  btn.setAttribute('aria-pressed', 'false');
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.style.cursor = 'not-allowed';
}

function layoutMarkers(elapsed) {
  const total = Math.max(1, elapsed);
  const nodes = markersEl?.querySelectorAll?.('.marker') || [];
  nodes.forEach((node, i) => {
    const t = timeline[i]?.t ?? 0;
    const pct = Math.min(100, (t / total) * 100);
    node.style.left = pct + '%';
  });
}

function addMarker(phase) {
  if (!running) return;

  const el = document.createElement('div');
  el.className = 'marker';
  el.innerText = `${fmt(segundos)}\n${phase}`;
  markersEl.appendChild(el);

  timeline.push({ t: segundos, phase });

  layoutMarkers(segundos || 1);
}

async function startFlight() {
  if (finished) return; // No permitir reiniciar si ya terminó

  running = true;
  startMs = Date.now();
  segundos = 0;
  timeline = [];
  if (markersEl) markersEl.innerHTML = '';
  cronometro.textContent = fmt(0);
  statusEl.textContent = "vuelo iniciado";
  setBtnToStop();

  if (timeLine) timeLine.style.width = '100%';

  await setFlightStart(sn, flightId, new Date().toISOString());

  intervalo = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    segundos = elapsed;
    cronometro.textContent = fmt(segundos);
    layoutMarkers(elapsed);
  }, 1000);
}

async function stopFlight() {
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
    finished: true,
    mode: 'test'
  };
  localStorage.setItem('dfr:lastFlightData', JSON.stringify(flightData));

  await setFlightEnd(sn, flightId, endTime, durationMin, timeline);
  const minutesExact = Math.floor(segundos / 60);
  const addedKey = `dfr:addedMinutes:${flightId}`;
  const alreadyAdded = localStorage.getItem(addedKey) === '1';
  if (!alreadyAdded && minutesExact > 0) {
    await addMinutes(sn, minutesExact);
    localStorage.setItem(addedKey, '1');
  }
}

btn?.addEventListener('click', async () => {
  if (finished) {
    alert('El vuelo ya ha sido finalizado. No se puede reiniciar.');
    return;
  }

  if (!running) {
    await startFlight();
  } else {
    await stopFlight();
  }
});

// ===== Operativo: DOM =====
const opCronometro = document.getElementById('op-cronometro');
const opBtn = document.getElementById('op-btn-cronometro');
const opStatusEl = document.getElementById('op-status');
const opBtnLoad = document.getElementById('op-btn-load');
const opBtnRelease = document.getElementById('op-btn-release');
const opWeightWrap = document.getElementById('op-weight-wrap');
const opWeightInp = document.getElementById('op-weight');

function opSetBtnToStart() {
  opBtn?.classList.remove('terminar');
  opBtn?.classList.add('modo-iniciar');
  if (opBtn) opBtn.innerHTML = `<i class="ph ph-play"></i> <span>Iniciar</span>`;
  opBtn?.setAttribute('aria-pressed', 'false');
  if (opBtn) opBtn.disabled = false;
}

function opSetBtnToStop() {
  opBtn?.classList.add('terminar');
  opBtn?.classList.remove('modo-iniciar');
  if (opBtn) opBtn.innerHTML = `<i class="ph ph-stop"></i> <span>Terminar</span>`;
  opBtn?.setAttribute('aria-pressed', 'true');
  if (opBtn) opBtn.disabled = false;
}

function opSetBtnToFinished() {
  opBtn?.classList.remove('terminar', 'modo-iniciar');
  opBtn?.classList.add('finished');
  if (opBtn) opBtn.innerHTML = `<i class="ph ph-check-circle"></i> <span>Vuelo Finalizado</span>`;
  opBtn?.setAttribute('aria-pressed', 'false');
  if (opBtn) opBtn.disabled = true;
  if (opBtn) opBtn.style.opacity = '0.6';
  if (opBtn) opBtn.style.cursor = 'not-allowed';
}

function opUpdateLoadUI() {
  if (!opBtnLoad) return;
  if (opLoad) {
    opBtnLoad.setAttribute('aria-pressed', 'true');
    opBtnLoad.innerHTML = `<i class="ph ph-package"></i> <span>Lleva carga</span>`;
    opBtnLoad.classList.add('btn-positive');
    if (opWeightWrap) opWeightWrap.style.display = '';
    if (opBtnRelease) opBtnRelease.disabled = false;
  } else {
    opBtnLoad.setAttribute('aria-pressed', 'false');
    opBtnLoad.innerHTML = `<i class="ph ph-package"></i> <span>Sin carga</span>`;
    opBtnLoad.classList.remove('btn-positive');
    if (opWeightWrap) opWeightWrap.style.display = 'none';
    if (opBtnRelease) opBtnRelease.disabled = true;
  }
  if (opStatusEl) opStatusEl.textContent = opLoad ? 'Lleva carga' : 'Sin carga';
}

function opRecord(eventType) {
  const t = opRunning ? Math.floor((Date.now() - (opStartMs || Date.now())) / 1000) : opSegundos;
  const weight = Number(opWeightInp?.value || 0) || 0;
  const rec = { t, type: eventType };
  if (eventType === 'load_on' || eventType === 'released') rec.weight = weight;
  opEvents.push(rec);
}

async function opStartFlight() {
  if (opFinished) return;
  opRunning = true;
  opStartMs = Date.now();
  opSegundos = 0;
  opEvents = [];
  if (opCronometro) opCronometro.textContent = fmt(0);
  if (opStatusEl) opStatusEl.textContent = 'vuelo iniciado';
  opSetBtnToStop();
  if (opBtnLoad) opBtnLoad.disabled = true;
  if (opWeightInp) opWeightInp.disabled = true;

  await setFlightStart(sn, flightId, new Date().toISOString());

  opIntervalo = setInterval(() => {
    const elapsed = Math.floor((Date.now() - opStartMs) / 1000);
    opSegundos = elapsed;
    if (opCronometro) opCronometro.textContent = fmt(opSegundos);
  }, 1000);
}

async function opStopFlight() {
  clearInterval(opIntervalo);
  opRunning = false;
  opFinished = true;
  if (opStatusEl) opStatusEl.textContent = 'vuelo finalizado';
  opSetBtnToFinished();

  const durationMin = Math.round(opSegundos / 60);
  const endTime = new Date().toISOString();

  const flightData = {
    flightId,
    startTime: new Date(opStartMs).toISOString(),
    endTime,
    durationMin,
    timeline: [],
    finished: true,
    mode: 'op',
    opEvents
  };
  localStorage.setItem('dfr:lastFlightData', JSON.stringify(flightData));

  await setFlightEnd(sn, flightId, endTime, durationMin, []);
  const minutesExact = Math.floor(opSegundos / 60);
  const addedKey = `dfr:addedMinutes:${flightId}`;
  const alreadyAdded = localStorage.getItem(addedKey) === '1';
  if (!alreadyAdded && minutesExact > 0) {
    await addMinutes(sn, minutesExact);
    localStorage.setItem(addedKey, '1');
  }
}

// Operativo: listeners
opBtn?.addEventListener('click', async () => {
  if (opFinished) { alert('El vuelo ya ha sido finalizado. No se puede reiniciar.'); return; }
  if (!opRunning) { await opStartFlight(); } else { await opStopFlight(); }
});

opBtnLoad?.addEventListener('click', () => {
  if (opFinished) { alert('El vuelo ya ha sido finalizado'); return; }
  opLoad = !opLoad;
  opRecord(opLoad ? 'load_on' : 'load_off');
  opUpdateLoadUI();
});

opBtnRelease?.addEventListener('click', () => {
  if (!opRunning) { alert('Inicia el cronómetro primero'); return; }
  if (opFinished) { alert('El vuelo ya ha sido finalizado'); return; }
  if (!opLoad) { alert('No hay carga para liberar'); return; }
  opRecord('released');
  alert('Carga liberada registrada');
});

const phases = [
  ['btn-hover', "Hover"], ['btn-despla', "Desplazamiento"], ['btn-acen', "Ascenso"],
  ['btn-dece', "Descenso"], ['btn-acen-despla', "Ascenso+Desplazo"], ['btn-dece-despla', "Descenso+Desplazo"]
];
for (const [id, label] of phases) {
  const el = document.getElementById(id);
  el?.addEventListener('click', () => {
    if (!running) { alert("Inicia el cronómetro primero"); return; }
    if (finished) { alert("El vuelo ya ha sido finalizado"); return; }
    statusEl.textContent = `Fase: ${label}`;
    addMarker(label);
  });
}

// Verificar si ya hay un vuelo terminado al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  // Restaurar modo si existe
  const savedMode = localStorage.getItem('dfr:flightMode');
  if (savedMode === 'test' || savedMode === 'op') {
    showMode(savedMode);
  }
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
      const mode = savedMode || data.mode || 'test';
      if (mode === 'op') {
        opFinished = true;
        opSegundos = (Number(data.durationMin) || 0) * 60;
        opEvents = data.opEvents || [];
        if (opCronometro) opCronometro.textContent = fmt(opSegundos);
        if (opStatusEl) opStatusEl.textContent = 'vuelo finalizado';
        opSetBtnToFinished();
      } else {
        finished = true;
        segundos = (Number(data.durationMin) || 0) * 60;
        timeline = data.timeline || [];
        cronometro.textContent = fmt(segundos);
        statusEl.textContent = "vuelo finalizado";
        setBtnToFinished();
        // Recrear marcadores si existen
        if (markersEl) {
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
    }
  }
});

setBtnToStart();
opSetBtnToStart();
opUpdateLoadUI();

// ===== Export CSV (solo prueba) =====
const btnExport = document.getElementById('btn-export');
btnExport?.addEventListener('click', () => {
  const raw = localStorage.getItem('dfr:lastFlightData');
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { }
  if (!finished && (!data || !data.finished)) {
    alert('Finaliza el vuelo para exportar.');
    return;
  }
  const start = data?.startTime || (startMs ? new Date(startMs).toISOString() : '');
  const end = data?.endTime || new Date().toISOString();
  const dur = data?.durationMin ?? Math.round((segundos || 0) / 60);
  const rows = (data?.timeline || timeline || []).map((it, i) => [i + 1, it.t, it.phase]);
  const header = [
    ['flightId', flightId],
    ['startTime', start],
    ['endTime', end],
    ['durationMin', dur],
    [],
    ['#', 'segundos', 'fase']
  ];
  const csv = [...header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flight_${flightId}_timeline.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
