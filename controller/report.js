// /controller/report.js
import { getDrone } from './firebase.js';

const sn = localStorage.getItem('dfr:selectedDroneSN');
if (!sn) location.href = '/views/inicio.html';

const set = (id, val) => {
  const nodes = document.querySelectorAll(`[id="${id}"]`);
  nodes.forEach(el => { el.textContent = (val ?? ''); });
};
const setHTML = (id, html) => {
  const nodes = document.querySelectorAll(`[id="${id}"]`);
  nodes.forEach(el => { el.innerHTML = html ?? ''; });
};

(async () => {
  // Obtener datos del localStorage
  const lastFlightData = localStorage.getItem('dfr:lastFlightData');
  const preflightData = localStorage.getItem('dfr:preflightData');
  const postflightData = localStorage.getItem('dfr:postflightData');
  
  if (!lastFlightData) {
    console.warn('No hay datos de vuelo en localStorage');
    return;
  }

  // Parsear datos del localStorage
  const flightData = JSON.parse(lastFlightData);
  const pre = preflightData ? JSON.parse(preflightData) : {};
  const post = postflightData ? JSON.parse(postflightData) : {};
  
  // Obtener datos de la aeronave desde Firebase
  const ac = await getDrone(sn).catch(() => null);

  // P/N y S/N en cabeceras (como el resto de pv_*)
  set('pv_partnum', ac?.pn || '');
  set('pv_serialnum', ac?.sn || sn || '');

  // ===== PRE-VUELO (IDs: pv_*) =====
  // Información General
  set('pv_fecha', pre.general?.fecha);
  set('pv_lugar', pre.general?.lugar);
  set('pv_matricula', pre.general?.matricula);
  set('pv_hora', pre.general?.hora);
  set('pv_tiempo_est', pre.general?.tiempo_estimado);
  set('pv_altitud_agl', ''); // Campo no presente en el formulario
  set('pv_proposito', ''); // Campo no presente en el formulario
  set('pv_codigo', ''); // Campo no presente en el formulario

  // Condiciones Atmosféricas
  set('pv_viento', pre.meteo?.viento_ms);
  set('pv_rafagas', pre.meteo?.rafagas_ms);
  set('pv_dir_viento', pre.meteo?.dir_viento);
  set('pv_kp', pre.meteo?.kp);
  set('pv_precipitacion', pre.meteo?.precipitacion_pct);
  set('pv_visibilidad', pre.meteo?.vis_km);
  set('pv_temperatura', pre.meteo?.temp_c);
  set('pv_humedad', pre.meteo?.humedad_pct);
  set('pv_sat_bloqueados', pre.meteo?.sat_bloqueados);

  // Tripulación
  set('pv_lider_mision', pre.tripulacion?.lider);
  set('pv_piloto_externo', pre.tripulacion?.piloto_ext);
  set('pv_piloto_interno', pre.tripulacion?.piloto_int);
  set('pv_ing_vuelo', pre.tripulacion?.ing_vuelo);
  set('pv_ing_soporte', pre.tripulacion?.ing_soporte);
  set('pv_lanzador', pre.tripulacion?.lanzador);

  // Site Survey
  set('pv_entorno_aereo', pre.site_survey?.e_aereo);
  set('pv_entorno_terrestre', pre.site_survey?.e_terrest);
  set('pv_clima', pre.site_survey?.clima);
  set('pv_puntuacion', pre.site_survey?.puntuacion);
  set('pv_riesgo', pre.site_survey?.riesgo);
  set('pv_personas', pre.site_survey?.personas);

  // Estado de la Aeronave
  set('pv_estado_aeronave', pre['Describir Aeronave - (Fisuras, Golpes, Delaminaciones)'] || '');

  // TAREAS PRE-VUELO (IDs: pv_tarea*)
  set('pv_tarea1', pre.tareas?.tarea1 || '');
  set('pv_tarea2', pre.tareas?.tarea2 || '');
  set('pv_tarea3', pre.tareas?.tarea3 || '');
  set('pv_tarea4', pre.tareas?.tarea4 || '');
  set('pv_tarea5', pre.tareas?.tarea5 || '');
  set('pv_tarea6', pre.tareas?.tarea6 || '');
  set('pv_tarea7', pre.tareas?.tarea7 || '');
  set('pv_tarea8', pre.tareas?.tarea8 || '');
  set('pv_tarea9', pre.tareas?.tarea9 || '');

  // ===== RESUMEN POST-VUELO (IDs: post_*) =====
  const durMin = flightData.durationMin ?? null;
  set('post_hora_despegue', post['Hora despegue'] || (flightData.startTime?.slice(11, 16) ?? ''));
  set('post_hora_aterrizaje', post['Hora aterrizaje'] || (flightData.endTime?.slice(11, 16) ?? ''));
  set('post_tiempo_vuelo', post['Tiempo de vuelo'] || (durMin != null ? `${durMin} min` : ''));

  // ===== ESTADO POST-VUELO + NOTAS =====
  set('post_estado_aeronave', post['Describir Aeronave (Fisuras, Golpes, Delaminaciones)'] || post['post_aero_descri'] || '');
  set('post_notas_vuelo', post['Notas (incidentes, observaciones, etc.)'] || post['post_notas_vuelo'] || '');

  // ===== MINUTOS Y S/N (tabla) =====
  set('ac_sn', sn);
  set('ac_mins_hoy', durMin != null ? `${durMin}` : '');
  set('ac_mins_total', (ac?.minutes_total ?? 0).toString());

  const b1 = ac?.batteries?.[0] || {};
  const b2 = ac?.batteries?.[1] || {};
  set('b1_sn', b1.sn || '');
  set('b2_sn', b2.sn || '');
  set('b1_mins_hoy', durMin != null ? `${durMin}` : '');
  set('b2_mins_hoy', durMin != null ? `${durMin}` : '');
  set('b1_mins_total', (b1.minutes ?? 0).toString());
  set('b2_mins_total', (b2.minutes ?? 0).toString());

  for (let i = 1; i <= 4; i++) {
    const m = ac?.motors?.[i - 1] || {};
    set(`m${i}_sn`, m.sn || '');
    set(`m${i}_mins_hoy`, durMin != null ? `${durMin}` : '');
    set(`m${i}_mins_total`, (m.minutes ?? 0).toString());
  }

  // ===== FIRMAS + NOMBRES =====
  // Nombres debajo de cada firma
  set('nombre_lider', post['nombre_lider'] || pre.tripulacion?.lider || '');
  set('nombre_piloto_interno', post['nombre_piloto_interno'] || pre.tripulacion?.piloto_int || '');
  set('nombre_piloto_externo', post['nombre_piloto_externo'] || pre.tripulacion?.piloto_ext || '');
  set('nombre_ing_vuelo', post['nombre_ing_vuelo'] || pre.tripulacion?.ing_vuelo || '');

  // Mostrar firmas (dataURL) en las celdas correspondientes
  const firmas = [
    ['firma_lider', 'firma_lider'],
    ['firma_piloto_interno', 'firma_piloto_interno'],
    ['firma_piloto_externo', 'firma_piloto_externo'],
    ['firma_ing_vuelo', 'firma_ing_vuelo']
  ];
  
  firmas.forEach(([cellId, key]) => {
    const url = post[key];
    if (url) {
      setHTML(cellId, `<img src="${url}" alt="firma" style="max-height:80px; object-fit:contain;">`);
    }
  });

  // ====== Botón imprimir ======
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnPrint');
    if (btn) {
      btn.addEventListener('click', () => {
        window.print();
      });
    }
  });

  // ====== Limpiar datos después de cargar el reporte ======
  // Limpiar los datos de localStorage después de que el reporte se haya cargado
  localStorage.removeItem('dfr:currentFlightId');
  localStorage.removeItem('dfr:lastFlightData');
  localStorage.removeItem('dfr:preflightData');
  localStorage.removeItem('dfr:postflightData');

})();
