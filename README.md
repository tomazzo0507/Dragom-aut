# DRAGOM Flight Report System

Sistema de registro de vuelos UAV-DRAGOM con integración de Firebase y Firestore.

## Características

- 🔐 **Autenticación de usuarios** con Firebase Auth
- 📊 **Base de datos en tiempo real** con Firestore
- 🚁 **Gestión de aeronaves** (DRAGOM)
- ✈️ **Registro de vuelos** (pre-vuelo, vuelo, post-vuelo)
- 📋 **Reportes** y documentación
- 🎨 **Interfaz moderna** y responsive

## Configuración de Firebase

El proyecto ya está configurado con Firebase. La configuración se encuentra en `controller/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDlwBfZY0sAmRI_SdxfBKzDgO8G6nZmpdU",
  authDomain: "uav-dragom.firebaseapp.com",
  projectId: "uav-dragom",
  storageBucket: "uav-dragom.firebasestorage.app",
  messagingSenderId: "281047925009",
  appId: "1:281047925009:web:947e5efeba90c596828cb0",
  measurementId: "G-RJMX0M24GL"
};
```

## Estructura de la Base de Datos (Firestore)

### Colecciones

1. **users** - Información de usuarios
   - `uid`: ID del usuario en Firebase Auth
   - `fullName`: Nombre completo
   - `email`: Correo electrónico
   - `role`: Rol (editor, revisor)
   - `createdAt`: Fecha de creación
   - `isActive`: Estado activo

2. **aircraft** - Información de aeronaves DRAGOM
   - `serialNumber`: Número de serie (ej: DGM-2024-001234)
   - `status`: Estado (active, maintenance, inactive)
   - `lastFlightDate`: Fecha del último vuelo
   - `createdAt`: Fecha de creación
   - `isActive`: Estado activo

3. **flights** - Registro de vuelos
   - `aircraftId`: ID de la aeronave
   - `pilotId`: ID del piloto
   - `status`: Estado del vuelo
   - `createdAt`: Fecha de creación

4. **preFlights** - Checklist pre-vuelo
   - `flightId`: ID del vuelo
   - `checklist`: Datos del checklist
   - `status`: Estado completado
   - `createdAt`: Fecha de creación

5. **postFlights** - Reporte post-vuelo
   - `flightId`: ID del vuelo
   - `report`: Datos del reporte
   - `status`: Estado completado
   - `createdAt`: Fecha de creación

## Funcionalidades Implementadas

### ✅ Autenticación
- Registro de usuarios
- Inicio de sesión
- Cierre de sesión
- Protección de rutas

### ✅ Gestión de Aeronaves
- Búsqueda por número de serie
- Visualización de estado
- Historial de vuelos

### ✅ Sistema de Vuelos
- Formularios pre-vuelo
- Registro de vuelo activo
- Reportes post-vuelo

## Archivos Principales

- `controller/firebase.js` - Configuración de Firebase
- `controller/auth-guard.js` - Protección de rutas
- `controller/firestore.js` - Servicios de base de datos
- `controller/login.js` - Lógica de autenticación
- `controller/register.js` - Registro de usuarios
- `controller/inicio.js` - Búsqueda de aeronaves

## Uso

1. **Registro**: Los usuarios pueden registrarse en `/views/register.html`
2. **Login**: Acceso al sistema en `/index.html`
3. **Dashboard**: Página principal en `/views/inicio.html`
4. **Búsqueda**: Buscar aeronaves por número de serie
5. **Vuelos**: Iniciar y gestionar vuelos

## Seguridad

- Todas las páginas están protegidas por autenticación
- Los datos se validan antes de guardar en Firestore
- Manejo de errores implementado
- Roles de usuario (editor, revisor)

## Próximos Pasos

- [ ] Implementar formularios de pre-vuelo
- [ ] Implementar formularios de post-vuelo
- [ ] Generación de reportes PDF
- [ ] Dashboard con estadísticas
- [ ] Notificaciones en tiempo real
