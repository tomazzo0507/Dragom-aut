// /controller/register.js
import { adminCreateUser, logout } from './firebase.js';

const go = (p) => (location.href = new URL(p, location.href).toString());

const form     = document.getElementById('register-form');
const fullName = document.getElementById('fullName');
const email    = document.getElementById('email');
const password = document.getElementById('password');
const roleSel  = document.getElementById('role');
const toggleIcon = document.getElementById('togglePassword');

const currentRole = sessionStorage.getItem('dfr:role');
if (currentRole !== 'editor') go('./inicio.html');

// Funcionalidad del botón de mostrar/ocultar contraseña
if (toggleIcon && password) {
  toggleIcon.addEventListener('click', () => {
    const isPassword = password.type === 'password';
    password.type = isPassword ? 'text' : 'password';
    toggleIcon.classList.toggle('fa-eye', isPassword);
    toggleIcon.classList.toggle('fa-eye-slash', !isPassword);
  });
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name    = fullName.value.trim();
  const correo  = email.value.trim();
  const pass    = password.value;
  const newRole = roleSel.value;

  if (!name || !correo || !pass || !newRole) {
    alert('Completa todos los campos.');
    return;
  }

  try {
    await adminCreateUser({ name, email: correo, password: pass, role: newRole });
    alert('Usuario creado correctamente. Serás redirigido al login.');
    
    // Cerrar sesión del administrador para redirigir al login
    await logout();
    
    // Redirigir al index.html principal
    go('../index.html');
  } catch (err) {
    console.error(err);
    alert(`No se pudo crear el usuario: ${err.code || err.message || err}`);
  }
});
