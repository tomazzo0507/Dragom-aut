**DRAGOM Flight Report System** - Sistema integral para gestión de reportes de vuelos UAV

# DRAGOM Flight Report System

Sistema completo de registro de vuelos UAV-DRAGOM con integración de Firebase y Firestore. Aplicación web SPA para gestión integral de aeronaves, vuelos y reportes.

## 🚀 Características Implementadas

- 🔐 **Autenticación robusta** con Firebase Auth y roles (editor/revisor)
- 📊 **Base de datos en tiempo real** con Firestore
- 🚁 **Gestión completa de aeronaves** DRAGOM con componentes
- ✈️ **Sistema de vuelos completo** (pre-vuelo → vuelo → post-vuelo)
- 📋 **Reportes automáticos** con datos consolidados
- 🎨 **Interfaz moderna y responsive** con diseño coherente
- 📱 **Optimizado para móvil** con menú hamburguesa
- 🖊️ **Captura de firmas digitales** en canvas
- ⏱️ **Cronómetro de vuelo** con fases y timeline
- 🌤️ **Integración meteorológica** automática (Open-Meteo + NOAA)

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: HTML5 + CSS3 + JavaScript ES6+ (Vanilla)
- **Backend**: Firebase (Auth + Firestore)
- **APIs Externas**: Open-Meteo (clima), NOAA (índice Kp)
- **Deployment**: Estático (Live Server / hosting)

### Estructura del Proyecto
```
DRAGOM/
├── assets/                 # Imágenes y recursos
├── controller/            # Lógica de aplicación
│   ├── firebase.js       # Configuración y servicios Firebase
│   ├── auth-guard.js     # Protección de rutas
│   ├── login.js          # Autenticación
│   ├── register.js       # Registro de usuarios
│   ├── inicio.js         # Dashboard y búsqueda aeronaves
│   ├── aeronave.js       # Gestión de aeronaves
│   ├── prevuelo.js       # Formulario pre-vuelo
│   ├── vuelo.js          # Cronómetro y fases de vuelo
│   ├── postvuelo.js      # Formulario post-vuelo
│   ├── report.js         # Generación de reportes
│   └── ui.js             # Componentes UI
├── styles/               # Estilos CSS
├── views/                # Páginas HTML
└── index.html           # Página de login
```

## 🔥 Configuración Firebase

El proyecto está configurado con Firebase v12. Configuración en `controller/firebase.js`:

## 📊 Estructura de Base de Datos (Firestore)

### Colecciones Principales

#### 1. **users** - Usuarios del sistema
```javascript
{
  uid: "string",           // Firebase Auth UID
  fullName: "string",      // Nombre completo
  email: "string",         // Email (lowercase)
  role: "editor|revisor",  // Rol de usuario
  isActive: boolean,       // Estado activo
  createdAt: timestamp     // Fecha de creación
}
```

#### 2. **aircraft** - Aeronaves DRAGOM
```javascript
{
  sn: "string",            // S/N (ej: DGM-2024-001234)
  pn: "string",            // P/N
  minutes_total: number,   // Minutos totales de vuelo
  status: "active|maintenance|inactive",
  lastFlightDate: timestamp,
  createdAt: timestamp,
  // Componentes
  motors: [                // Array de motores
    {
      pos: 1-4,            // Posición (1-4)
      sn: "string",        // S/N del motor
      minutes: number      // Minutos acumulados
    }
  ],
  batteries: [             // Array de baterías
    {
      n: 1-2,              // Número (1-2)
      sn: "string",        // S/N de la batería
      minutes: number,     // Minutos acumulados
      cycles: number       // Ciclos de carga
    }
  ],
  // Máximos (nuevos campos)
  batteries_max_cycles: [number, number],  // Máx ciclos por batería
  motors_max_hours: [number, number, number, number]  // Máx horas por motor
}
```

#### 3. **aircraft/{sn}/flights** - Vuelos por aeronave
```javascript
{
  aircraftSN: "string",    // S/N de la aeronave
  status: "preflight|inflight|completed",
  createdAt: timestamp,
  startTime: "ISO string", // Hora de inicio
  endTime: "ISO string",   // Hora de finalización
  durationMin: number,     // Duración en minutos
  timeline: [              // Fases del vuelo
    {
      t: number,           // Tiempo en segundos
      phase: "string"      // Nombre de la fase
    }
  ],
  preflight: {             // Datos del pre-vuelo
    general: { fecha, hora, lugar, matricula, tiempo_estimado, proposito },
    meteo: { viento_ms, rafagas_ms, dir_viento, kp, precipitacion_pct, vis_km, temp_c, humedad_pct, sat_bloqueados },
    tripulacion: { lider, piloto_ext, piloto_int, ing_vuelo, ing_soporte, lanzador },
    site_survey: { e_aereo, e_terrest, clima, personas, puntuacion, riesgo },
    tareas: { tarea1-9: "SI|NO|NA" },
    "Describir Aeronave - (Fisuras, Golpes, Delaminaciones)": "string"
  },
  postflight: {            // Datos del post-vuelo
    "Hora despegue": "string",
    "Hora aterrizaje": "string", 
    "Tiempo de vuelo": "string",
    "Describir Aeronave (Fisuras, Golpes, Delaminaciones)": "string",
    "Notas (incidentes, observaciones, etc.)": "string",
    firma_lider: "dataURL",
    firma_piloto_interno: "dataURL",
    firma_piloto_externo: "dataURL", 
    firma_ing_vuelo: "dataURL",
    nombre_lider: "string",
    nombre_piloto_interno: "string",
    nombre_piloto_externo: "string",
    nombre_ing_vuelo: "string"
  }
}
```

## 🎯 Funcionalidades por Módulo

### 🔐 Autenticación y Usuarios
- **Login**: Email/password con Firebase Auth
- **Registro**: Formulario directo de registro de usuarios
- **Roles**: Editor (completo) / Revisor (solo lectura)
- **Protección**: Guard de rutas automático
- **Sesión**: Persistencia con sessionStorage

### 🚁 Gestión de Aeronaves
- **Búsqueda**: Por S/N con validación
- **Creación**: Modal con todos los componentes (motores, baterías)
- **Edición**: Actualización completa de datos y máximos
- **Visualización**: Card centrada con información detallada
- **Ciclos**: Botones "+ Ciclo" para baterías (solo editores)
- **Máximos**: Configuración de límites por componente

### ✈️ Sistema de Vuelos

#### Pre-vuelo (`/views/prevuelo.html`)
- **Autocompletado**: Fecha, hora, geolocalización
- **Meteorología**: Integración automática con Open-Meteo + NOAA Kp
- **Formularios**: Info general, condiciones atmosféricas, tripulación, site survey
- **Checklist**: 9 tareas pre-vuelo (SI/NO/NA)
- **Estado**: Descripción de aeronave pre-vuelo
- **Nuevo**: Campo "Propósito de vuelo"

#### Vuelo (`/views/vuelo.html`)
- **Cronómetro**: Timer preciso con formato HH:MM:SS
- **Fases**: 6 fases de vuelo con marcadores visuales
- **Timeline**: Registro automático de transiciones
- **Persistencia**: Datos guardados en localStorage + Firestore
- **Estados**: preflight → inflight → completed

#### Post-vuelo (`/views/postvuelo.html`)
- **Autocompletado**: Resumen de vuelo desde cronómetro
- **Notas**: Autocompletado con rangos de fases del timeline
- **Equipos**: Minutos acumulados automáticos
- **Firmas**: Captura digital en canvas (desktop + móvil)
- **Validación**: Campos requeridos y validaciones

### 📋 Reportes (`/views/report.html`)
- **Consolidación**: Pre-vuelo + vuelo + post-vuelo
- **Formato**: Tabla profesional tipo PDF
- **Firmas**: Renderizado de firmas digitales
- **Impresión**: Botón para imprimir/guardar PDF
- **Limpieza**: Limpieza automática de datos temporales

## 🎨 Sistema de Diseño

### Variables CSS (`:root`)
```css
--bg: #f6f9fc;           /* Fondo principal */
--panel: #ffffff;        /* Paneles */
--muted: #6b7280;        /* Texto secundario */
--text: #0f172a;         /* Texto principal */
--brand: #3b82f6;        /* Color principal */
--brand-10: rgba(59, 130, 246, .12);  /* Brand con transparencia */
--hover: #c2c2c2;        /* Hover states */
--radius: 16px;          /* Border radius */
```

### Componentes
- **Botones**: Variantes `.btn`, `.btn-main`, `.btn-cycle`
- **Cards**: Sistema de tarjetas con `.card`, `.card__head`, `.card__body`
- **Modales**: Sistema de modales responsive
- **Formularios**: Grids adaptativos y validaciones
- **Sidebar**: Navegación con estados activos

## 🔧 Controladores Principales

### `controller/firebase.js`
- Configuración Firebase v12
- Servicios de autenticación
- CRUD de aeronaves y vuelos
- Helpers de utilidad

### `controller/auth-guard.js`
- Protección de rutas
- Redirecciones automáticas
- Control de roles

### `controller/prevuelo.js`
- Autocompletado geolocalización
- Integración APIs meteorológicas
- Validación y envío de formularios

### `controller/vuelo.js`
- Cronómetro con fases
- Timeline y marcadores
- Persistencia de datos

### `controller/postvuelo.js`
- Autocompletado desde vuelo
- Captura de firmas
- Validación y envío

### `controller/aeronave.js`
- Gestión completa de aeronaves
- Edición con máximos
- Botones de ciclo

### `controller/report.js`
- Consolidación de datos
- Renderizado de reporte
- Limpieza de estado

## 🚀 Flujo de Uso

1. **Login** (`/index.html`) → Autenticación
2. **Dashboard** (`/views/inicio.html`) → Buscar/crear aeronave
3. **Pre-vuelo** (`/views/prevuelo.html`) → Completar formulario
4. **Vuelo** (`/views/vuelo.html`) → Cronómetro y fases
5. **Post-vuelo** (`/views/postvuelo.html`) → Firmas y notas
6. **Reporte** (`/views/report.html`) → Ver e imprimir

## 🔒 Seguridad

- **Autenticación**: Firebase Auth con email/password
- **Autorización**: Roles editor/revisor con permisos granulares
- **Validación**: Validación cliente y servidor
- **Datos**: Reglas de seguridad Firestore recomendadas
- **Sesión**: Manejo seguro de tokens

## 📱 Responsive Design

- **Desktop**: Layout completo con sidebar fijo
- **Tablet**: Sidebar colapsable
- **Móvil**: Menú hamburguesa + modales para firmas
- **Breakpoints**: 992px, 640px, 560px

## 🛠️ Desarrollo

### Instalación
```bash
# Clonar repositorio
git clone [url]

# Instalar dependencias (solo Firebase)
npm install

# Ejecutar con Live Server
# Abrir index.html en navegador
```

### Estructura de Datos
- **localStorage**: Estado temporal (`dfr:*`)
- **sessionStorage**: Rol de usuario (`dfr:role`)
- **Firestore**: Datos persistentes

### APIs Externas
- **Open-Meteo**: Condiciones meteorológicas
- **NOAA**: Índice Kp (actividad geomagnética)
- **Geolocalización**: Navegador (GPS)

## 📄 Licencia

Proyecto desarrollado para CIAC (Corporación de la Industria Aeronáutica Colombiana).

---


