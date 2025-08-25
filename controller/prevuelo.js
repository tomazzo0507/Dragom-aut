// /controller/prevuelo.js
import { ensureFlight } from './firebase.js';

const go = (p) => (location.href = new URL(p, location.href).toString());

// ===== Helpers DOM por placeholder (no cambiamos tu HTML) =====
const $  = (ph) => document.querySelector(`input[placeholder="${ph}"]`);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// INFO GENERAL
const inpFecha   = $('Fecha');
const inpHora    = $('Hora');
const inpLugar   = $('Lugar');
const inpMatric  = $('Matrícula');
const inpTiempo  = $('Tiempo estimado de vuelo');

// METEO
const inpViento    = $('Velocidad del viento');
const inpRafagas   = $('Ráfagas de viento m/s');
const inpDirViento = $('Dirección del viento');
const inpKp        = $('Valor KP');
const inpPp        = $('Precipitación %');
const inpVisKm     = $('Visibilidad km');
const inpTemp      = $('Temperatura °C');
const inpHumedad   = $('Humedad');
const inpSatBloq   = $('Sat. Bloqueados');

// TRIPULACIÓN
const inpLider      = $('Líder de misión');
const inpPilotoExt  = $('Piloto externo');
const inpPilotoInt  = $('Piloto interno');
const inpIngVuelo   = $('Ing. de vuelo');
const inpIngSoporte = $('Ing. Soporte');
const inpLanzador   = $('Lanzador');

// SITE SURVEY
const inpEAereo   = $('E. Aéreo');
const inpETerrest = $('E. Terrestre');
const inpClima    = $('Clima');
const inpPersonas = $('Personas');
const inpPunt     = $('Puntuación');
const inpRiesgo   = $('Riesgo de operación');

// FORM
const form = document.getElementById('pv-form');

// ===== Verificación: hay aeronave seleccionada? =====
const selectedSN = localStorage.getItem('dfr:selectedDroneSN');
if (!selectedSN) {
  alert('Primero selecciona o crea una aeronave.');
  go('./inicio.html');
}

// ===== Autocompletar INFO GENERAL (excepto Matrícula) =====
function pad2(n){ return String(n).padStart(2,'0'); }

function fillGeneralInfo(){
  try{
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm   = pad2(now.getMonth()+1);
    const dd   = pad2(now.getDate());
    const hh   = pad2(now.getHours());
    const mi   = pad2(now.getMinutes());

    if (inpFecha)  inpFecha.value = `${yyyy}-${mm}-${dd}`;
    if (inpHora)   inpHora.value  = `${hh}:${mi}`;
    if (inpLugar)  inpLugar.value = 'Obteniendo ubicación…';
    if (inpTiempo) inpTiempo.value= '30 min';
  }catch{}
}

// ===== Geolocalización + Meteo =====
async function getCoords(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){
      return reject(new Error('Geolocalización no disponible'));
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy
      }),
      err => reject(err),
      { enableHighAccuracy:true, timeout:10000, maximumAge:30000 }
    );
  });
}

function degToCardinal(deg){
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
  return dirs[Math.round(deg/22.5) % 16];
}

async function fetchWeather(lat, lon){
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude',  String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('windspeed_unit', 'ms');
  url.searchParams.set('current', [
    'temperature_2m',
    'relative_humidity_2m',
    'wind_speed_10m',
    'wind_gusts_10m',
    'wind_direction_10m',
    'precipitation'
  ].join(','));
  url.searchParams.set('hourly', [
    'precipitation_probability',
    'visibility'
  ].join(','));

  const res = await fetch(url.toString());
  if(!res.ok) throw new Error('No se pudo obtener el clima');
  return res.json();
}

async function fetchKp(){
  const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
  if(!res.ok) throw new Error('No se pudo obtener el Kp');
  const arr = await res.json();
  const last = arr[arr.length-1];
  return Number(last?.[1]) || null;
}

async function autoFillWeather(lat, lon){
  try{
    if (inpLugar) inpLugar.value = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

    const [meteo, kp] = await Promise.all([
      fetchWeather(lat, lon),
      fetchKp().catch(()=>null)
    ]);

    const cur = meteo.current || {};

    let precipProb = null;
    if (meteo?.hourly?.time && meteo.hourly.precipitation_probability) {
      const idx = meteo.hourly.time.indexOf(cur.time);
      precipProb = idx >= 0 ? meteo.hourly.precipitation_probability[idx] : null;
    }

    let visKmStr = null;
    if (meteo?.hourly?.time && meteo.hourly.visibility) {
      const idx = meteo.hourly.time.indexOf(cur.time);
      const visM = idx >= 0 ? meteo.hourly.visibility[idx] : null;
      if (visM != null) visKmStr = `${(visM/1000).toFixed(1)} km`;
    }

    if (inpViento && cur.wind_speed_10m != null)  inpViento.value = `${cur.wind_speed_10m} m/s`;
    if (inpRafagas && cur.wind_gusts_10m != null) inpRafagas.value = `${cur.wind_gusts_10m} m/s`;
    if (inpDirViento && cur.wind_direction_10m != null)
      inpDirViento.value = `${cur.wind_direction_10m}° (${degToCardinal(cur.wind_direction_10m)})`;
    if (inpTemp && cur.temperature_2m != null)     inpTemp.value = `${cur.temperature_2m} °C`;
    if (inpHumedad && cur.relative_humidity_2m != null) inpHumedad.value = `${cur.relative_humidity_2m} %`;
    if (inpVisKm && visKmStr != null)              inpVisKm.value = visKmStr;
    if (inpPp && precipProb != null)               inpPp.value = `${precipProb} %`;
    if (inpKp && kp != null)                       inpKp.value = String(kp);
    if (inpSatBloq && !inpSatBloq.value)           inpSatBloq.value = '—';
  }catch(err){
    console.error('Auto meteo error:', err);
    if (inpLugar && inpLugar.value.startsWith('Obteniendo')) inpLugar.value = '';
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  fillGeneralInfo();
  try{
    const {lat, lon, acc} = await getCoords();
    await autoFillWeather(lat, lon);
    if (inpLugar && !inpLugar.value.includes('±') && Number.isFinite(acc)) {
      inpLugar.value += ` (±${Math.round(acc)} m)`;
    }
  }catch(e){
    console.warn('Sin geolocalización:', e);
    if (inpLugar && inpLugar.value.startsWith('Obteniendo')) inpLugar.value = '';
  }
});

function readTask(name){
  const si = document.getElementById(`${name}_si`)?.checked;
  const no = document.getElementById(`${name}_no`)?.checked;
  const na = document.getElementById(`${name}_na`)?.checked;
  if (si) return 'SI';
  if (no) return 'NO';
  if (na) return 'NA';
  return '';
}

form?.addEventListener('submit', async (e)=>{
  e.preventDefault();

  const preflight = {
    general: {
      fecha:   inpFecha?.value || null,
      hora:    inpHora?.value || null,
      lugar:   inpLugar?.value || null,
      matricula: inpMatric?.value || null,
      tiempo_estimado: inpTiempo?.value || null,
    },
    meteo: {
      viento_ms:         inpViento?.value || null,
      rafagas_ms:        inpRafagas?.value || null,
      dir_viento:        inpDirViento?.value || null,
      kp:                inpKp?.value || null,
      precipitacion_pct: inpPp?.value || null,
      vis_km:            inpVisKm?.value || null,
      temp_c:            inpTemp?.value || null,
      humedad_pct:       inpHumedad?.value || null,
      sat_bloqueados:    inpSatBloq?.value || null,
    },
    tripulacion: {
      lider:      inpLider?.value || null,
      piloto_ext: inpPilotoExt?.value || null,
      piloto_int: inpPilotoInt?.value || null,
      ing_vuelo:  inpIngVuelo?.value || null,
      ing_soporte:inpIngSoporte?.value || null,
      lanzador:   inpLanzador?.value || null,
    },
    site_survey: {
      e_aereo:   inpEAereo?.value || null,
      e_terrest: inpETerrest?.value || null,
      clima:     inpClima?.value || null,
      personas:  inpPersonas?.value || null,
      puntuacion:inpPunt?.value || null,
      riesgo:    inpRiesgo?.value || null,
    },
    tareas: {
      tarea1: readTask('tarea1'),
      tarea2: readTask('tarea2'),
      tarea3: readTask('tarea3'),
      tarea4: readTask('tarea4'),
      tarea5: readTask('tarea5'),
      tarea6: readTask('tarea6'),
      tarea7: readTask('tarea7'),
      tarea8: readTask('tarea8'),
      tarea9: readTask('tarea9'),
    },
    // Agregar el campo de estado de la aeronave
    'Describir Aeronave - (Fisuras, Golpes, Delaminaciones)': document.querySelector('textarea[placeholder="Describir Aeronave - (Fisuras, Golpes, Delaminaciones)"]')?.value || null
  };

  try{
    const flightId = await ensureFlight(selectedSN, preflight);
    localStorage.setItem('dfr:currentFlightId', flightId);
    
    // Guardar datos del prevuelo en localStorage para el reporte
    localStorage.setItem('dfr:preflightData', JSON.stringify(preflight));
    
    alert('Pre-vuelo guardado. Dirígete a "Iniciar vuelo".');
    go('./vuelo.html');
  }catch(err){
    console.error(err);
    alert('No se pudo guardar el pre-vuelo. Intenta nuevamente.');
  }
});
