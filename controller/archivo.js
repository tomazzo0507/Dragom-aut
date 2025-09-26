import { getReports } from './firebase.js';

const go = (p) => (location.href = new URL(p, location.href).toString());

document.addEventListener('DOMContentLoaded', async () => {
  const role = sessionStorage.getItem('dfr:role');
  if (role !== 'editor') return go('./inicio.html');

  const list = document.getElementById('reports');
  const sn = localStorage.getItem('dfr:selectedDroneSN');
  if (!sn) {
    list.innerHTML = '<p>No hay dron seleccionado.</p>';
    return;
  }

  try {
    const reps = await getReports(sn);
    if (!reps.length) {
      list.innerHTML = '<p>No hay reportes almacenados.</p>';
      return;
    }
    reps.forEach(r => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `<div class="card-cont"><i class="ph ph-file-pdf icon-file"></i><span class="filename">${r.name}</span></div>`;
      card.addEventListener('click', () => {
        if (r.url) window.open(r.url, '_blank');
      });
      list.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p>Error cargando reportes.</p>';
  }
});
