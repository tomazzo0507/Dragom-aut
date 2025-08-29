// /controller/firebase.js
// SDK modular v10+ (Firebase 12). Solo funcionalidades del lado cliente.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
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

export async function logout() { await signOut(auth); }

// ========== Crear usuarios (Admin) ==========
export async function adminCreateUser({ name, email, password, role }) {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Crear documento del usuario en Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      name,
      email,
      role,
      createdAt: serverTimestamp(),
      uid: user.uid
    });

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

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

// Actualizar datos de aeronave (mergea campos)
export async function updateDrone(sn, partial) {
  const ref = doc(db, 'aircraft', sn);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('not_found');
  await setDoc(ref, partial, { merge: true });
}

// Incrementar en +1 los ciclos de una batería (n = 1 | 2)
export async function addBatteryCycle(sn, batteryNumber) {
  const ref = doc(db, 'aircraft', sn);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('not_found');
  const data = snap.data();
  const idx = batteryNumber === 2 ? 1 : 0;
  const batteries = Array.isArray(data.batteries) ? [...data.batteries] : [];
  const current = batteries[idx] || { n: batteryNumber, sn: '', minutes: 0, cycles: 0 };
  const updated = { ...current, cycles: (current.cycles || 0) + 1 };
  batteries[idx] = updated;
  await updateDoc(ref, { batteries });
  return updated.cycles;
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
