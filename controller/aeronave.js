// /controller/aeronave.js
import { getDrone } from './firebase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ===== Roles =====
  const role = sessionStorage.getItem('dfr:role') || 'revisor';
  document.body.dataset.role = role;
  if (role !== 'editor') {
    document.querySelectorAll('.only-editor').forEach(el => el.remove());
  }

  // ===== DOM =====
  const listEl = document.getElementById('aircraft-list');

  // Modal
  const modal = document.getElementById('aircraft-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const form = document.getElementById('aircraft-form');

  // Form fields
  const $ = (id) => document.getElementById(id);
  const F = {
    ac_sn: $('ac_sn'),
    ac_total: $('ac_total'),
    ac_max_h: $('ac_max_h'),
    bat1_sn: $('bat1_sn'),
    bat1_total: $('bat1_total'),
    bat1_ciclos: $('bat1_ciclos'),
    bat2_sn: $('bat2_sn'),
    bat2_total: $('bat2_total'),
    bat2_ciclos: $('bat2_ciclos'),
    mot1_sn: $('mot1_sn'),
    mot2_sn: $('mot2_sn'),
    mot3_sn: $('mot3_sn'),
    mot4_sn: $('mot4_sn'),
  };

  let currentAircraft = null;

  // ===== Cargar aeronave seleccionada =====
  async function loadSelectedAircraft() {
    const selectedSN = localStorage.getItem('dfr:selectedDroneSN');
    if (!selectedSN) {
      showNoAircraftMessage();
      return;
    }

    try {
      const aircraft = await getDrone(selectedSN);
      if (aircraft) {
        currentAircraft = aircraft;
        renderAircraft(aircraft);
      } else {
        showNoAircraftMessage();
      }
    } catch (error) {
      console.error('Error loading aircraft:', error);
      showNoAircraftMessage();
    }
  }

  // ===== Mostrar mensaje cuando no hay aeronave =====
  function showNoAircraftMessage() {
    if (!listEl) return;
    listEl.innerHTML = `
      <div class="card" style="grid-column: 1/-1; text-align: center; align-items: center;">
        <div class="meta">
          <i class="ph ph-airplane-tilt" style="font-size: 48px; color: var(--muted); margin-bottom: 16px;"></i>
          <h3>No hay aeronave seleccionada</h3>
          <p>Ve a <strong>Inicio</strong> y selecciona o crea una aeronave para ver sus detalles aquí.</p>
        </div>
      </div>`;
  }

  // ===== Render aeronave =====
  function renderAircraft(aircraft) {
    if (!listEl) return;

    const sn = aircraft.sn || '';
    const pn = aircraft.pn || '';
    const minutes_total = aircraft.minutes_total || 0;
    const motors = aircraft.motors || [];
    const batteries = aircraft.batteries || [];

    // Convertir minutos totales a horas y minutos
    const hours = Math.floor(minutes_total / 60);
    const minutes = minutes_total % 60;
    const timeDisplay = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

    listEl.innerHTML = `
      <article class="card">
        <div class="card__head">
          <div>
            <div class="sn">${sn}</div>
            <div class="meta">P/N: ${pn || 'No especificado'}</div>
          </div>
          <span class="badge"><i class="ph ph-airplane-tilt"></i> DRAGOM</span>
        </div>

        <div class="card__body">
          <div class="block">
            <h4>Aeronave</h4>
            <div class="kv">S/N: ${sn}</div>
            <div class="kv">P/N: ${pn || '-'}</div>
            <div class="kv">Tiempo total: ${timeDisplay}</div>
          </div>

          <div class="block">
            <h4>Batería 1</h4>
            <div class="kv">S/N: ${batteries[0]?.sn || '-'}</div>
            <div class="kv">Tiempo: ${batteries[0]?.minutes || 0} min</div>
            <div class="kv">Ciclos: ${batteries[0]?.cycles || 0}</div>
          </div>

          <div class="block">
            <h4>Batería 2</h4>
            <div class="kv">S/N: ${batteries[1]?.sn || '-'}</div>
            <div class="kv">Tiempo: ${batteries[1]?.minutes || 0} min</div>
            <div class="kv">Ciclos: ${batteries[1]?.cycles || 0}</div>
          </div>

          <div class="block">
            <h4>Motores</h4>
            <div class="kv">1: ${motors[0]?.sn || '-'} (${Math.floor((motors[0]?.minutes || 0) / 60)}h ${(motors[0]?.minutes || 0) % 60}min)</div>
            <div class="kv">2: ${motors[1]?.sn || '-'} (${Math.floor((motors[1]?.minutes || 0) / 60)}h ${(motors[1]?.minutes || 0) % 60}min)</div>
            <div class="kv">3: ${motors[2]?.sn || '-'} (${Math.floor((motors[2]?.minutes || 0) / 60)}h ${(motors[2]?.minutes || 0) % 60}min)</div>
            <div class="kv">4: ${motors[3]?.sn || '-'} (${Math.floor((motors[3]?.minutes || 0) / 60)}h ${(motors[3]?.minutes || 0) % 60}min)</div>
          </div>
        </div>

        <div class="card__foot">
          <button class="btn only-editor" data-action="edit"><i class="ph ph-pencil-simple-line"></i> Editar</button>
        </div>
      </article>`;
  }

  // ===== Modal helpers =====
  function openModal(mode = 'edit', data = null) {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    modalTitle.textContent = 'Editar aeronave';
    
    if (data) {
      // Llenar formulario con datos actuales
      F.ac_sn.value = data.sn || '';
      F.ac_total.value = data.minutes_total || '';
      F.ac_max_h.value = '';
      
      // Baterías
      const batteries = data.batteries || [];
      F.bat1_sn.value = batteries[0]?.sn || '';
      F.bat1_total.value = batteries[0]?.minutes || '';
      F.bat1_ciclos.value = batteries[0]?.cycles || '';
      F.bat2_sn.value = batteries[1]?.sn || '';
      F.bat2_total.value = batteries[1]?.minutes || '';
      F.bat2_ciclos.value = batteries[1]?.cycles || '';
      
      // Motores
      const motors = data.motors || [];
      F.mot1_sn.value = motors[0]?.sn || '';
      F.mot2_sn.value = motors[1]?.sn || '';
      F.mot3_sn.value = motors[2]?.sn || '';
      F.mot4_sn.value = motors[3]?.sn || '';
    }
  }

  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    form.reset();
  }

  // ===== Eventos =====
  modalClose?.addEventListener('click', closeModal);
  modalCancel?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('show')) closeModal(); });

  // Submit editar
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (role !== 'editor') return alert('Esta acción requiere rol Editor.');

    // Aquí iría la lógica para actualizar la aeronave en Firebase
    alert('Función de edición en desarrollo. Los cambios se guardarán próximamente.');
    closeModal();
  });

  // Delegación: Editar
  listEl?.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;

    const actionBtn = e.target.closest('button[data-action]');
    if (!actionBtn) return;

    if (role !== 'editor') return alert('Esta acción requiere rol Editor.');

    const action = actionBtn.getAttribute('data-action');
    if (action === 'edit' && currentAircraft) {
      openModal('edit', currentAircraft);
    }
  });

  // Cargar aeronave al inicio
  loadSelectedAircraft();
});
