// /controller/firebase.js
// SDK modular v10+ (Firebase 12). Solo funcionalidades del lado cliente.
// NOTA: para "crear usuarios" desde /views/register.html usamos invitaciones por email link,
// sin cerrar la sesión del editor (no existe createUser admin desde cliente).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
  getFirestore,
  doc, getDoc, setDoc, updateDoc, addDoc, getDocs, query,
  serverTimestamp, collection, orderBy, limit, where, increment, writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ---------- Config ----------
const firebaseConfig = {
  apiKey: "AIzaSyDlwBfZY0sAmRI_SdxfBKzDgO8G6nZmpdU",
  authDomain: "uav-dragom.firebaseapp.com",
  projectId: "uav-dragom",
  storageBucket: "uav-dragom.firebasestorage.app",
  messagingSenderId: "281047925009",
  appId: "1:281047925009:web:947e5efeba90c596828cb0",
  measurementId: "G-RJMX0M24GL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);

// ========== Auth guard util ==========
export function watchAuth(cb) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { cb(null, null); return; }
    try {
      const uref = doc(db, 'users', user.uid);
      const snap = await getDoc(uref);
      cb(user, snap.exists() ? snap.data() : null);
    } catch (e) {
      console.error('watchAuth error', e);
      cb(user, null);
    }
  });
}

// ========== Invitaciones (sustituye "adminCreateUser") ==========
// Crea un "usuario invitado": guarda su rol en Firestore y envía magic link por correo.
// NO cierra la sesión del editor.
export async function adminCreateUser({ name, email, password, role }) {
  // 1) Guarda invitación/rol (si el usuario termina creando la cuenta, este doc se actualizará luego)
  const invitesRef = doc(db, 'invites', email.toLowerCase());
  await setDoc(invitesRef, {
    fullName: name,
    email: email.toLowerCase(),
    role,
    invitedAt: serverTimestamp(),
    invitedBy: auth.currentUser?.uid || null
  });

  // 2) Envía email-link de acceso
  const actionCodeSettings = {
    url: `${location.origin}/index.html?email=${encodeURIComponent(email)}`,
    handleCodeInApp: true
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  // La contraseña no se usa en email-link; queda a criterio cambiar a flujo "set password" si luego agregas Cloud Functions
  return true;
}

// Si el usuario llega por email-link a /index.html se puede completar el sign in:
export async function completeEmailLinkSignInIfNeeded() {
  try {
    if (isSignInWithEmailLink(auth, location.href)) {
      const url = new URL(location.href);
      let email = url.searchParams.get('email') || window.localStorage.getItem('dfr:pendingEmail');
      if (!email) {
        // como último recurso pedirlo
        email = prompt('Confirma tu correo para iniciar sesión:');
      }
      await signInWithEmailLink(auth, email, location.href);

      // si existe invitación, crear/actualizar users/{uid}
      const u = auth.currentUser;
      if (u) {
        const invSnap = await getDoc(doc(db, 'invites', email.toLowerCase()));
        const role = invSnap.exists() ? (invSnap.data().role || 'revisor') : 'revisor';
        await setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          fullName: u.displayName || email.split('@')[0],
          email: email.toLowerCase(),
          role,
          isActive: true,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
      window.localStorage.removeItem('dfr:pendingEmail');
      // redirige al dashboard
      location.href = '/views/inicio.html';
    }
  } catch (e) {
    console.error('Email link sign-in error:', e);
  }
}

export async function logout() { await signOut(auth); }

// ========== Aeronaves ==========
export async function getDrone(sn) {
  const ref = doc(db, 'aircraft', sn);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function createDrone(data) {
  const {
    sn, pn,
    minutes_total = 0,
    motors = [],
    batteries = []
  } = data;

  const ref = doc(db, 'aircraft', sn);
  const exists = await getDoc(ref);
  if (exists.exists()) throw new Error('already_exists');

  await setDoc(ref, {
    sn, pn,
    minutes_total,
    motors,         // [{pos, sn, minutes}]
    batteries,      // [{n, sn, minutes, cycles}]
    status: 'active',
    createdAt: serverTimestamp()
  });
}

// ========== Flights ==========
function flightsCol(sn) {
  return collection(db, 'aircraft', sn, 'flights');
}

export async function ensureFlight(sn, preflight) {
  // Crea SIEMPRE un vuelo nuevo (flujo: un preflight -> un vuelo)
  const ref = await addDoc(flightsCol(sn), {
    aircraftSN: sn,
    status: 'preflight',
    createdAt: serverTimestamp(),
    preflight
  });
  return ref.id;
}

export async function setFlightStart(sn, flightId, iso) {
  const ref = doc(db, 'aircraft', sn, 'flights', flightId);
  await updateDoc(ref, {
    startTime: iso,
    status: 'inflight'
  });
}

export async function setFlightEnd(sn, flightId, iso, durationMin, timeline) {
  const ref = doc(db, 'aircraft', sn, 'flights', flightId);
  await updateDoc(ref, {
    endTime: iso,
    durationMin,
    timeline: timeline || [],
    status: 'completed'
  });
}

// Suma minutos a aeronave + a TODOS los componentes (simple: 1:1 con el vuelo)
export async function addMinutes(sn, minutes) {
  const ref = doc(db, 'aircraft', sn);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const ac = snap.data();
  const batch = writeBatch(db);

  // aircraft total
  batch.update(ref, { minutes_total: increment(minutes), lastFlightDate: serverTimestamp() });

  // actualiza arrays (si existen)
  const motors = (ac.motors || []).map(m => ({ ...m, minutes: (m.minutes || 0) + minutes }));
  const batteries = (ac.batteries || []).map(b => ({ ...b, minutes: (b.minutes || 0) + minutes }));
  batch.update(ref, { motors, batteries });

  await batch.commit();
}

// Guarda postvuelo dentro del mismo vuelo
export async function savePostflight(sn, flightId, post) {
  const ref = doc(db, 'aircraft', sn, 'flights', flightId);
  await updateDoc(ref, {
    postflight: post,
    updatedAt: serverTimestamp()
  });
}

// Último vuelo COMPLETADO
export async function getLastCompletedFlight(sn) {
  const q = query(
    flightsCol(sn),
    where('status', '==', 'completed'),
    orderBy('endTime', 'desc'),
    limit(1)
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  const d = snaps.docs[0];
  return { id: d.id, ...d.data() };
}

// Obtener vuelo específico por ID
export async function getFlightById(sn, flightId) {
  const ref = doc(db, 'aircraft', sn, 'flights', flightId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ===== Re-export para que login/logout importen desde ./firebase.js (solución 1)
export { onAuthStateChanged, signInWithEmailAndPassword, signOut };
