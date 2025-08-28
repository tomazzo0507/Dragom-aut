// /controller/register.js

const go = (p) => (location.href = new URL(p, location.href).toString());

const form     = document.getElementById('register-form');
const fullName = document.getElementById('fullName');
const email    = document.getElementById('email');
const password = document.getElementById('password');
const roleSel  = document.getElementById('role');

const currentRole = sessionStorage.getItem('dfr:role');
if (currentRole !== 'editor') go('./inicio.html');

// Función para registrar usuario usando Cloud Function
async function registrarUsuario({ name, email, password, role }) {
  try {
    const res = await fetch('https://<TU_PROYECTO>.cloudfunctions.net/adminCreateUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (data.success) {
      alert('Usuario creado correctamente.');
      form.reset();
    } else {
      alert('No se pudo crear el usuario: ' + (data.error || 'Error desconocido'));
    }
  } catch (err) {
    alert('No se pudo crear el usuario: ' + (err.message || err));
  }
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

  await registrarUsuario({ name, email: correo, password: pass, role: newRole });
});