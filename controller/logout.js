// /controller/logout.js
import { logout } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      await logout();
      sessionStorage.clear();
      localStorage.removeItem('dfr:selectedDroneSN');
      location.href = '/index.html';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión. Inténtalo de nuevo.');
    }
  });
});
