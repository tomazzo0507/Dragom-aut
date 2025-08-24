// /controller/logout.js
import { signOut, auth } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        // Clear any stored data
        sessionStorage.clear();
        localStorage.removeItem('dfr:selectedDroneSN');
        // Redirect to login page
        location.href = '/index.html';
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Inténtalo de nuevo.');
      }
    });
  }
});
