// /controller/ui.js
// Hamburguesa + activar item URL 
const go = (p) => (location.href = new URL(p, location.href).toString());

document.addEventListener('DOMContentLoaded', () => {
  const role = sessionStorage.getItem('dfr:role') || 'revisor';

  // ===== MENÚ HAMBURGUESA =====
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');

  function openMenu() {
    sidebar?.classList.add('is-open');
    backdrop?.classList.add('show');
    hamburger?.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    sidebar?.classList.remove('is-open');
    backdrop?.classList.remove('show');
    hamburger?.setAttribute('aria-expanded', 'false');
  }

  // Event listeners menú móvil
  hamburger?.addEventListener('click', openMenu);
  backdrop?.addEventListener('click', closeMenu);

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Insertar "Registrar" SOLO si editor
  const menu = document.querySelector('.menu');
  if (menu && role === 'editor') {
    const a = document.createElement('a');
    a.href = '/views/register.html';
    a.className = 'menu_item';
    a.innerHTML = `<i class="fa-solid fa-user-plus"></i><span class="label">Registrar</span>`;
    menu.appendChild(a);
  }

  // Bloquear items excepto /inicio y /register
  const here = location.pathname;
  const isInicio   = /\/views\/inicio\.html$/.test(here);
  const isRegister = /\/views\/register\.html$/.test(here);
  const selectedSN = localStorage.getItem('dfr:selectedDroneSN');

  const blockable = Array.from(document.querySelectorAll('.menu a')).filter(a=>{
    const href = a.getAttribute('href') || '';
    return !href.endsWith('/views/inicio.html') && !href.endsWith('/views/register.html') &&
           !href.endsWith('./views/inicio.html') && !href.endsWith('./views/register.html');
  });

  if(!selectedSN && !isInicio && !isRegister){
    go('./views/inicio.html');
  }

  if(!selectedSN){
    blockable.forEach(a=> a.classList.add('disabled'));
  } else {
    blockable.forEach(a=> a.classList.remove('disabled'));
  }
});
