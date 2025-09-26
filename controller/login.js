// /controller/login.js
import { auth, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from './firebase.js';

const form        = document.getElementById('login-form');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const toggleIcon  = document.getElementById('togglePassword');
const forgotLink  = document.getElementById('forgot-pass');
const msgBox      = document.getElementById('msg');

function showMessage(text, type = '') {
  if (!msgBox) return;
  msgBox.textContent = text;
  msgBox.className = type ? `status ${type}` : 'status';
}

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
    showMessage(`Error al iniciar sesión: ${err.code || err.message}`, 'error');
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) location.href = '/views/inicio.html';
});

forgotLink?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = (emailInput?.value || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMessage('Ingresa un correo válido', 'error');
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage('Se envió un correo para restablecer la contraseña', 'success');
  } catch (err) {
    console.error('Error al restablecer contraseña:', err);
    showMessage(`Error: ${err.code || err.message}`, 'error');
  }
});

