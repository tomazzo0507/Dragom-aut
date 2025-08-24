import { adminCreateUser } from './firebase.js';

try{
  const uid = await adminCreateUser({
    name: 'Editor Inicial',
    email: 'vargasgiraldotomas@gmail.com',
    password: '123_456_789',
    role: 'editor',
  });
  console.log('✔ Usuario editor inicial creado:', uid);
}catch(err){
  console.error('Seed error:', err);
  alert(err.message || err);
}