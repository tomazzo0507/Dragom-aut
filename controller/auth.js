// /controller/auth.js
import { auth } from './firebase.js'
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js"

const go = (p) => (location.href = new URL(p, location.href).toString());

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm')
  const email = document.getElementById('email')
  const password = document.getElementById('password')
  const toggle = document.getElementById('togglePassword')

  if (toggle && password) {
    toggle.addEventListener('click', () => {
      const type = password.type === 'password' ? 'text' : 'password'
      password.type = type
      toggle.classList.toggle('fa-eye')
      toggle.classList.toggle('fa-eye-slash')
    })
  }

  if (!form) return
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
      go('./views/inicio.html')
    } catch (err) {
      console.error(err)
      alert("No fue posible iniciar sesión.")
    }
  })
})
