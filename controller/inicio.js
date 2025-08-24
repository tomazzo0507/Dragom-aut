// /controller/inicio.js
import { getDrone, createDrone } from './firebase.js';

const go = (p) => (location.href = new URL(p, location.href).toString());

const formSearch = document.getElementById('search-form');
const inputSN    = document.getElementById('search-sn');
const results    = document.getElementById('search-results');

const modal      = document.getElementById('modal-drone');
const closeModal = document.getElementById('close-modal');
const formDrone  = document.getElementById('form-drone');
const btnAdd     = document.getElementById('btn-add-drone');

// ===== Helpers modal =====
function openModal(){ modal?.classList.add('show'); }
function hideModal(){ modal?.classList.remove('show'); }
closeModal?.addEventListener('click', hideModal);

// ===== Gate de sidebar hasta elegir aeronave =====
function gateSidebarUntilSelected() {
  const links = Array.from(document.querySelectorAll('.menu .gate'));
  const allow = !!localStorage.getItem('dfr:selectedDroneSN');

  links.forEach(a => {
    a.addEventListener('click', (e)=>{
      if (!localStorage.getItem('dfr:selectedDroneSN')) {
        e.preventDefault();
        alert('Primero selecciona o crea una aeronave por S/N.');
      }
    }, { capture:true });
  });

  return allow;
}

// ===== Mostrar/ocultar botón "Agregar aeronave" según rol =====
(function toggleAddButtonByRole(){
  const role = sessionStorage.getItem('dfr:role');
  if (role !== 'editor') {
    btnAdd?.remove();
  }
})();

// ===== Abrir modal manualmente (solo editores lo ven) =====
btnAdd?.addEventListener('click', (e)=>{
  e.preventDefault();
  formDrone?.reset();
  const sn = (inputSN?.value || '').trim();
  if (sn && formDrone?.sn) formDrone.sn.value = sn;
  openModal();
});

// ===== Buscar por S/N =====
formSearch?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const sn = inputSN.value.trim();
  if(!sn){ return; }

  try{
    if(results) results.innerHTML = '<p class="loading">Buscando…</p>';

    const exists = await getDrone(sn);
    if(exists){
      localStorage.setItem('dfr:selectedDroneSN', sn);
      go('./views/prevuelo.html');
    }else{
      formDrone?.reset();
      if(formDrone?.sn) formDrone.sn.value = sn;
      openModal();
      if(results) results.innerHTML = `
        <div class="no-results">
          <p>No se encontró ningún DRAGOM con S/N <strong>${sn}</strong>.</p>
          <p>Puedes crearlo con el botón del modal.</p>
        </div>`;
    }
  }catch(err){
    console.error(err);
    if(results) results.innerHTML = `
      <div class="error">
        <p>Ocurrió un error al buscar. Intenta nuevamente.</p>
      </div>`;
  }
});

// Crear aeronave desde el modal
formDrone?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const sn = formDrone.sn.value.trim();
  const pn = formDrone.pn.value.trim();

  const h1 = parseFloat(formDrone.m1h?.value || '0') || 0;
  const h2 = parseFloat(formDrone.m2h?.value || '0') || 0;
  const h3 = parseFloat(formDrone.m3h?.value || '0') || 0;
  const h4 = parseFloat(formDrone.m4h?.value || '0') || 0;

  const m1min = Math.round(h1 * 60);
  const m2min = Math.round(h2 * 60);
  const m3min = Math.round(h3 * 60);
  const m4min = Math.round(h4 * 60);

  const b1c = parseInt(formDrone.b1c?.value || '0', 10) || 0;
  const b2c = parseInt(formDrone.b2c?.value || '0', 10) || 0;

  try{
    await createDrone({
      sn, pn,
      minutes_total: 0,
      motors: [
        {pos:1, sn:(formDrone.m1?.value||'').trim(), minutes:m1min},
        {pos:2, sn:(formDrone.m2?.value||'').trim(), minutes:m2min},
        {pos:3, sn:(formDrone.m3?.value||'').trim(), minutes:m3min},
        {pos:4, sn:(formDrone.m4?.value||'').trim(), minutes:m4min},
      ],
      batteries: [
        {n:1, sn:(formDrone.b1?.value||'').trim(), minutes:0, cycles:b1c},
        {n:2, sn:(formDrone.b2?.value||'').trim(), minutes:0, cycles:b2c},
      ],
    });

    localStorage.setItem('dfr:selectedDroneSN', sn);
    hideModal();
    go('./views/prevuelo.html');
  }catch(err){
    console.error(err);
    alert('No se pudo crear la aeronave. Revisa los datos e intenta de nuevo.');
  }
});

// Inicializa el gate de navegación
gateSidebarUntilSelected();
