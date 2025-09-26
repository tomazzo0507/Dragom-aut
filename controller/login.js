// /controller/login.js
import { auth, signInWithEmailAndPassword, onAuthStateChanged, resetPassword } from './firebase.js';

const form       = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const toggleIcon = document.getElementById('togglePassword');
const resetLink  = document.getElementById('reset-pass');

if (toggleIcon && passInput) {
  toggleIcon.addEventListener('click', () => {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    toggleIcon.classList.toggle('fa-eye', isPass);
    toggleIcon.classList.toggle('fa-eye-slash', !isPass);
  });
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = (emailInput?.value || '').trim();
  const pass  = passInput?.value || '';
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    location.href = '/views/inicio.html';
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    alert(`Error al iniciar sesión: ${err.code || err.message}`);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) location.href = '/views/inicio.html';
});

resetLink?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = prompt('Ingresa tu correo para recuperar la contraseña:');
  if (!email) return;
  try {
    await resetPassword(email);
    alert('Se envió un correo de recuperación.');
  } catch (err) {
    console.error(err);
    alert('No se pudo enviar el correo.');
  }
});
