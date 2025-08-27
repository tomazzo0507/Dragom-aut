// /controller/inicio.js
import { getDrone, createDrone } from './firebase.js';

document.addEventListener('DOMContentLoaded', function() {
  const formSearch = document.getElementById('search-form');
  const inputSN    = document.getElementById('search-sn');

  const modal      = document.getElementById('modal-drone');
  const closeModal = document.getElementById('close-modal');
  const formDrone  = document.getElementById('form-drone');
  const btnAdd     = document.getElementById('btn-add-drone');

  // ===== Helpers modal =====
  function openModal(){ 
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }
  
  function hideModal(){ 
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  // ===== MODAL CLOSE FUNCTIONALITY =====
  // Close button click is handled by onclick attribute in HTML

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideModal();
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
      e.stopPropagation(); // Prevent ui.js from handling this
      hideModal();
    }
  });

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
  if (btnAdd) {
    btnAdd.addEventListener('click', (e)=>{
      e.preventDefault();
      if (formDrone) formDrone.reset();
      const sn = (inputSN?.value || '').trim();
      if (sn && formDrone?.sn) formDrone.sn.value = sn;
      openModal();
    });
  }

  // ===== Buscar por S/N =====
  if (formSearch) {
    formSearch.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const sn = inputSN.value.trim();
      if(!sn){ return; }

      try{
        const exists = await getDrone(sn);
        if(exists){
          localStorage.setItem('dfr:selectedDroneSN', sn);
          location.href = '/views/prevuelo.html';
        }else{
          if (formDrone) formDrone.reset();
          if(formDrone?.sn) formDrone.sn.value = sn;
          openModal();
        }
      }catch(err){
        console.error(err);
        alert('Ocurrió un error al buscar. Intenta nuevamente.');
      }
    });
  }

  // Crear aeronave desde el modal
  if (formDrone) {
    formDrone.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const sn = formDrone.sn.value.trim();
      const pn = formDrone.pn.value.trim();

      const m1 = (formDrone.m1?.value || '').trim();
      const m2 = (formDrone.m2?.value || '').trim();
      const m3 = (formDrone.m3?.value || '').trim();
      const m4 = (formDrone.m4?.value || '').trim();

      const h1 = parseFloat(formDrone.m1h?.value || '0') || 0;
      const h2 = parseFloat(formDrone.m2h?.value || '0') || 0;
      const h3 = parseFloat(formDrone.m3h?.value || '0') || 0;
      const h4 = parseFloat(formDrone.m4h?.value || '0') || 0;

      const b1 = (formDrone.b1?.value || '').trim();
      const b2 = (formDrone.b2?.value || '').trim();

      const b1c = parseInt(formDrone.b1c?.value || '0', 10) || 0;
      const b2c = parseInt(formDrone.b2c?.value || '0', 10) || 0;

      // Validar que todos los campos estén diligenciados
      if (
        !sn || !pn ||
        !m1 || !m2 || !m3 || !m4 ||
        !formDrone.m1h.value || !formDrone.m2h.value || !formDrone.m3h.value || !formDrone.m4h.value ||
        !b1 || !b2 ||
        !formDrone.b1c.value || !formDrone.b2c.value
      ) {
        alert('Debes diligenciar todos los datos');
        return;
      }

      const m1min = Math.round(h1 * 60);
      const m2min = Math.round(h2 * 60);
      const m3min = Math.round(h3 * 60);
      const m4min = Math.round(h4 * 60);

      try{
        await createDrone({
          sn, pn,
          minutes_total: 0,
          motors: [
            {pos:1, sn:m1, minutes:m1min},
            {pos:2, sn:m2, minutes:m2min},
            {pos:3, sn:m3, minutes:m3min},
            {pos:4, sn:m4, minutes:m4min},
          ],
          batteries: [
            {n:1, sn:b1, minutes:0, cycles:b1c},
            {n:2, sn:b2, minutes:0, cycles:b2c},
          ],
        });

        localStorage.setItem('dfr:selectedDroneSN', sn);
        hideModal();
        location.href = '/views/prevuelo.html';
      }catch(err){
        console.error(err);
        alert('No se pudo crear la aeronave. Revisa los datos e intenta de nuevo.');
      }
    });
  }

  // Inicializa el gate de navegación
  gateSidebarUntilSelected();
});
