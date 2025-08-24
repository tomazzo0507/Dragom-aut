// /controller/report.js
import { getLastCompletedFlight, getDrone } from './firebase.js';

const sn = localStorage.getItem('dfr:selectedDroneSN');
if(!sn) location.href = '/views/inicio.html';

const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = (val ?? ''); };
const setHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html ?? ''; };

(async ()=>{
  const f = await getLastCompletedFlight(sn);
  if(!f){ return; }

  const pre  = f.preflight || {};
  const post = f.postflight || {};
  const ac   = await getDrone(sn).catch(()=>null);

  // ===== PRE-VUELO (IDs: pv_*) =====
  set('pv_fecha', pre.general?.fecha);
  set('pv_lugar', pre.general?.lugar);
  set('pv_matricula', pre.general?.matricula);
  set('pv_hora', pre.general?.hora);
  set('pv_tiempo_est', pre.general?.tiempo_estimado);
  set('pv_altitud_agl', ''); // si lo tienes en tu prevuelo, mapea aquí

  set('pv_proposito', ''); // idem
  set('pv_codigo', '');    // idem

  set('pv_viento', pre.meteo?.viento_ms);
  set('pv_rafagas', pre.meteo?.rafagas_ms);
  set('pv_dir_viento', pre.meteo?.dir_viento);
  set('pv_kp', pre.meteo?.kp);
  set('pv_precipitacion', pre.meteo?.precipitacion_pct);
  set('pv_visibilidad', pre.meteo?.vis_km);
  set('pv_temperatura', pre.meteo?.temp_c);
  set('pv_humedad', pre.meteo?.humedad_pct);
  set('pv_sat_bloqueados', pre.meteo?.sat_bloqueados);

  set('pv_lider_mision', pre.tripulacion?.lider);
  set('pv_piloto_externo', pre.tripulacion?.piloto_ext);
  set('pv_piloto_interno', pre.tripulacion?.piloto_int);
  set('pv_ing_vuelo', pre.tripulacion?.ing_vuelo);
  set('pv_ing_soporte', pre.tripulacion?.ing_soporte);
  set('pv_lanzador', pre.tripulacion?.lanzador);

  set('pv_entorno_aereo', pre.site_survey?.e_aereo);
  set('pv_entorno_terrestre', pre.site_survey?.e_terrest);
  set('pv_clima', pre.site_survey?.clima);
  set('pv_puntuacion', pre.site_survey?.puntuacion);
  set('pv_riesgo', pre.site_survey?.riesgo);
  set('pv_personas', pre.site_survey?.personas);

  set('pv_estado_aeronave', pre['Describir Aeronave - (Fisuras, Golpes, Delaminaciones)'] || '');

  // ===== RESUMEN POST-VUELO (IDs: post_*) =====
  const durMin = f.durationMin ?? null;
  set('post_hora_despegue',   post['Hora despegue']   || (f.startTime?.slice(11,16) ?? ''));
  set('post_hora_aterrizaje', post['Hora aterrizaje'] || (f.endTime?.slice(11,16) ?? ''));
  set('post_tiempo_vuelo',    post['Tiempo de vuelo'] || (durMin!=null ? `${durMin} min` : ''));

  // ===== ESTADO POST-VUELO + NOTAS =====
  set('post_estado_aeronave', post['Describir Aeronave (Fisuras, Golpes, Delaminaciones)'] || post['post_aero_descri'] || '');
  set('post_notas_vuelo', post['Notas (incidentes, observaciones, etc.)'] || post['post_notas_vuelo'] || '');

  // ===== MINUTOS Y S/N (tabla) =====
  set('ac_sn', sn);
  set('ac_mins_hoy', durMin!=null ? `${durMin}` : '');
  set('ac_mins_total', (ac?.minutes_total ?? 0).toString());

  const b1 = ac?.batteries?.[0] || {};
  const b2 = ac?.batteries?.[1] || {};
  set('b1_sn', b1.sn || '');
  set('b2_sn', b2.sn || '');
  set('b1_mins_hoy', durMin!=null ? `${durMin}` : '');
  set('b2_mins_hoy', durMin!=null ? `${durMin}` : '');
  set('b1_mins_total', (b1.minutes ?? 0).toString());
  set('b2_mins_total', (b2.minutes ?? 0).toString());

  for(let i=1;i<=4;i++){
    const m = ac?.motors?.[i-1] || {};
    set(`m${i}_sn`, m.sn || '');
    set(`m${i}_mins_hoy`, durMin!=null ? `${durMin}` : '');
    set(`m${i}_mins_total`, (m.minutes ?? 0).toString());
  }

  // ===== FIRMAS + NOMBRES =====
  // Nombre debajo de cada firma
  set('nombre_lider', post['nombre_lider'] || pre.tripulacion?.lider || '');
  set('nombre_piloto_interno', post['nombre_piloto_interno'] || pre.tripulacion?.piloto_int || '');
  set('nombre_piloto_externo', post['nombre_piloto_externo'] || pre.tripulacion?.piloto_ext || '');
  set('nombre_ing_vuelo', post['nombre_ing_vuelo'] || pre.tripulacion?.ing_vuelo || '');

  // Si hay dataURL de firma en postflight, la pintamos
  const firmas = [
    ['firma_lider','firma_lider'],
    ['firma_piloto_interno','firma_piloto_interno'],
    ['firma_piloto_externo','firma_piloto_externo'],
    ['firma_ing_vuelo','firma_ing_vuelo']
  ];
  firmas.forEach(([cellId, key])=>{
    const url = post[key];
    if(url){
      setHTML(cellId, `<img src="${url}" alt="firma" style="max-height:80px; object-fit:contain;">`);
    }
  });
})();
