# 🤖 Mary Bot — Asistente Virtual de Voz para Salones de Belleza

> Bot de voz profesional que atiende llamadas telefónicas 24/7, responde preguntas sobre servicios y precios, agenda citas automáticamente, y más. Potenciado por Gemini AI + Twilio + Firebase.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-Free-orange)
![Gemini](https://img.shields.io/badge/Gemini-Free-green)
![Twilio](https://img.shields.io/badge/Twilio-~%241%2Fmo-yellow)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Costos](#-costos)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Despliegue](#-despliegue)
- [Panel de Administración](#-panel-de-administración)
- [Personalización para otros Negocios](#-personalización-para-otros-negocios)
- [Sistema de Licencias](#-sistema-de-licencias)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Características

### 🤖 Bot de Voz
- **Atiende llamadas 24/7** — nunca pierde una clienta
- **Voz profesional en español** (Polly Lucía — acento latino)
- **IA conversacional** con Gemini (entiende contexto natural)
- **Respuestas inteligentes** — no es un menú de opciones, es una conversación real
- **Detección de intenciones**: servicios, precios, horarios, agendar, despedida, hablar con dueña
- **Historial completo** de cada conversación almacenada en Firebase

### 💅 Conocimiento del Salón
- **32 servicios** con precios y duraciones precargados
- **15 extras/decoraciones** disponibles
- **Políticas** del salón configurables
- **Horarios** de atención personalizables
- **Tono de voz** ajustable (formal, amigable, cariñoso)

### 📅 Agenda Automática
- Detecta cuando una clienta quiere agendar
- Registra la cita con nombre, servicio, fecha y hora
- La cita queda **pendiente de confirmación** en el panel
- La dueña confirma o cancela con un clic

### 📊 Panel de Administración
- **Dashboard** con estadísticas en tiempo real
- **Historial de llamadas** (fecha, número, duración, estado)
- **Citas pendientes** con botones confirmar/cancelar
- **Conversaciones completas** (Mary habla / Clienta habla)
- **Configuración** del salón desde el panel
- **Un solo archivo HTML** — portable en pendrive

### 🔐 Sistema de Licencias
- Licencias **mensuales** con código de activación
- Panel de administración para gestionar licencias
- Vencimiento automático si no se renueva
- Control total desde tu panel

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTA                               │
│                     (Llama por teléfono)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      TWILIO                                 │
│            (Recibe la llamada entrante)                      │
│            Genera TwiML → Voz de Mary                        │
│            Convierte voz a texto (STT)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  FIREBASE FUNCTIONS                          │
│                   (Servidor en la nube)                      │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ incomingCall│  │  conversar   │  │   Gemini AI       │   │
│  │  (saludo)   │──│ (responder)  │──│   (cerebro)       │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ callStatus  │  │  getCitas    │  │   getConfig       │   │
│  │  (tracking) │  │  (API REST)  │  │   (configuración) │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  FIREBASE FIRESTORE                          │
│                  (Base de datos)                              │
│                                                              │
│  Colecciones:                                                │
│  • llamadas      → Historial de llamadas                     │
│  • citas_bot      → Citas agendadas por Mary                 │
│  • conversaciones → Chat completo de cada llamada            │
│  • config         → Configuración del salón                  │
│  • licencias      → Licencias activas                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PANEL DE ADMINISTRACIÓN                         │
│           (mary-bot-admin.html)                              │
│                                                              │
│  • Dashboard     • Llamadas     • Citas                     │
│  • Conversaciones • Configuración • Licencias                │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 Costos

| Componente | Plan Gratis | Costo Real |
|---|---|---|
| **Firebase Functions** | 2M invocaciones/mes, 40GB-Hrs CPU | **$0** |
| **Firebase Firestore** | 50K lecturas, 20K escrituras/día | **$0** |
| **Gemini AI** | 15 rpm, 1M tokens/día | **$0** |
| **Twilio** | $15 crédito al registrarse | **~$1/mes** (número) |
| **Polly (Voz)** | Incluido con Twilio | **$0 extra** |

### 💡 Total estimado: $0 - $1/mes

Para un salón con ~50-100 llamadas al mes, todo entra en el plan gratuito de Firebase y Gemini. Solo pagás el número de Twilio (~$1/mes).

---

## 📦 Requisitos Previos

1. **Cuenta de Google** (para Firebase y Gemini)
2. **Node.js 18+** instalado (para desplegar)
3. **Firebase CLI**: `npm install -g firebase-tools`
4. **Cuenta de Twilio** (necesita tarjeta de crédito, da $15 gratis)
5. **API Key de Gemini**: [aistudio.google.com](https://aistudio.google.com)

---

## 🚀 Instalación y Configuración

### Paso 1: Crear Proyecto en Firebase

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Click en **"Crear un proyecto"**
3. Nombre: `nail-bot-mary` (o el nombre del cliente)
4. Desactivar Google Analytics (no lo necesitamos)
5. Click en **Crear proyecto**

### Paso 2: Configurar Firebase

1. En el proyecto, ir a **Configuración → General**
2. Click en el ícono de web `</>` para registrar una app
3. Nombre: `mary-bot-admin`
4. Copiar el objeto `firebaseConfig`
5. Anotar el **Project ID**

### Paso 3: Crear API Key de Gemini

1. Ir a [aistudio.google.com](https://aistudio.google.com)
2. Click en **"Get API Key"**
3. Crear API Key en Google AI Studio
4. Copiar la key (empieza con `AIzaSy...`)

### Paso 4: Crear Cuenta en Twilio

1. Ir a [twilio.com](https://www.twilio.com) y crear cuenta
2. Verificar email y número de teléfono
3. Ir a **Phone Numbers → Buy a Number**
4. Buscar un número disponible
5. Comprar el número (~$1/mes)

### Paso 5: Clonar y Configurar

```bash
# Clonar el repositorio
git clone https://github.com/tiendadigitalaipro/nail-bot-mary.git
cd nail-bot-mary

# Instalar dependencias
cd functions && npm install && cd ..

# Iniciar sesión en Firebase
firebase login

# Conectar al proyecto (reemplazar PROJECT_ID)
firebase use PROJECT_ID

# Configurar Gemini API Key como variable de entorno
firebase functions:secrets:set GEMINI_API_KEY
# Pegar la API Key de Gemini cuando la pida
```

### Paso 6: Configurar Reglas de Firestore

1. En Firebase Console → Firestore Database → Crear base de datos
2. Elegir **"Modo de prueba"** (luego puedes ajustar)
3. Ir a **Reglas** y pegar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Paso 7: Personalizar para el Cliente

Editar `functions/index.js` y cambiar:

```javascript
const SALON_CONFIG = {
  nombre: 'NOMBRE DEL SALÓN',        // ← Cambiar
  asistente: 'Mary',                   // ← Cambiar si querés
  horarios: 'Lunes a Domingo, 8:00 AM a 8:00 PM',  // ← Cambiar
  tono: 'cálida, profesional, amigable y servicial',  // ← Cambiar
};
```

Y la lista de `SERVICIOS` con los servicios reales del cliente.

---

## 🌐 Despliegue

```bash
# Desplegar a Firebase
firebase deploy --only functions

# Ver logs en tiempo real
firebase functions:log
```

### Conectar Twilio al Bot

1. En Twilio Console → Phone Numbers → Tu número
2. En **"Voice Configuration"**:
   - **A CALL COMES IN**: Webhook
   - **URL**: `https://us-central1-PROJECT_ID.cloudfunctions.net/incomingCall`
   - **HTTP**: POST
3. Guardar cambios

### Probar

1. Llama al número de Twilio
2. Mary debería saludar y empezar la conversación
3. Ver los logs: `firebase functions:log`

---

## 📱 Panel de Administración

### Instalación

El panel es **un solo archivo HTML** (`admin/mary-bot-admin.html`).

**Opción A: En pendrive**
1. Copiar el archivo `mary-bot-admin.html` al pendrive
2. La clienta lo abre en su navegador (Chrome/Firefox)
3. Al primer uso, le pide los datos de Firebase (Project ID, API Key, etc.)

**Opción B: Hosting Firebase**
1. Poner el archivo en la carpeta `public/`
2. `firebase deploy --only hosting`
3. Compartir el link: `https://tu-proyecto.web.app/mary-bot-admin.html`

### Secciones del Panel

| Sección | Descripción |
|---|---|
| 📊 **Dashboard** | Llamadas hoy, citas agendadas, pendientes, duración promedio |
| 📞 **Llamadas** | Historial completo con fecha, número, estado, duración |
| 📅 **Citas** | Citas agendadas por Mary con botones confirmar/cancelar |
| 💬 **Conversaciones** | Chat completo de cada llamada (Mary / Clienta) |
| ⚙️ **Configuración** | Nombre, tono, horarios, instrucciones especiales |
| 🔑 **API Keys** | Gemini key y Firebase config |

---

## 🔄 Personalización para otros Negocios

Mary Bot fue diseñado como **plantilla reutilizable**. Para adaptarlo a otro negocio:

### 1. Cambiar Servicios (`functions/index.js`)
```javascript
const SERVICIOS = [
  { nombre: 'Corte de Cabello', precio: 15, duracion: 45, desc: '...' },
  { nombre: 'Tinte', precio: 30, duracion: 90, desc: '...' },
  // ... etc
];
```

### 2. Cambiar Configuración
```javascript
const SALON_CONFIG = {
  nombre: 'Barbería El Capo',
  asistente: 'Carlos',
  tono: 'amigable y masculino',
  horarios: 'Martes a Sábado, 9:00 AM a 7:00 PM',
};
```

### 3. Ajustar el Prompt
Modificar `buildSystemPrompt()` con políticas específicas del negocio.

### 4. Desplegar y Listo
```bash
firebase deploy --only functions
```

### Negocios Compatibles

| Tipo | Ejemplo de Configuración |
|---|---|
| 💇 Barbería | Cortes, afeitados, tintes, barbas |
| 🍽️ Restaurante | Reservas, menú, horarios, delivery |
| 🏋️ Gimnasio | Membresías, horarios, clases |
| 🏥 Consultorio | Citas, especialidades, horarios |
| 🐶 Veterinaria | Consultas, vacunas, urgencias |
| 🧹 Limpieza | Servicios, zonas, precios |
| 👗 Modista | Encargos, medidas, entregas |

---

## 🔐 Sistema de Licencias

El sistema de licencias permite cobrar **mensualmente** por el bot.

### Cómo funciona

1. **Tú** creas una licencia para el cliente desde tu panel
2. La licencia tiene una **duración** (1 mes, 3 meses, 1 año)
3. El bot verifica la licencia en cada llamada
4. Si la licencia **venció**, Mary responde: *"Lo sentimos, la licencia ha expirado. Contacta al administrador."*
5. Si la licencia está **activa**, Mary funciona normalmente

### Tipos de Licencia

| Tipo | Duración | Código |
|---|---|---|
| **DEMO** | 7 días gratis | `NS-DEMO-XXXXXX-XXXX` |
| **PRO Mensual** | 30 días | Se genera desde el panel |
| **PRO Trimestral** | 90 días | 15% descuento |
| **PRO Anual** | 365 días | 25% descuento |

---

## 📁 Estructura del Proyecto

```
nail-bot-mary/
├── 📄 README.md                    ← Esta documentación
├── 📄 package.json                 ← Dependencias raíz
├── 📄 firebase.json                ← Configuración de Firebase
│
├── 📁 functions/                   ← Backend (Firebase Functions)
│   ├── 📄 index.js                 ← Cerebro del bot (Twilio + Gemini)
│   └── 📄 package.json             ← Dependencias del backend
│
├── 📁 admin/                       ← Panel de administración
│   └── 📄 mary-bot-admin.html      ← Panel completo (UN archivo)
│
└── 📁 public/                      ← Hosting estático (opcional)
    └── 📄 index.html               ← Landing page (opcional)
```

### Tamaño total: ~100 KB de código

---

## 🛠️ Troubleshooting

### Mary no responde / Se cuelga la llamada
- Verificar que la URL del webhook en Twilio sea correcta
- Revisar logs: `firebase functions:log`
- Verificar que Gemini API Key esté configurada: `firebase functions:secrets:display GEMINI_API_KEY`

### Error "Account SID / Auth Token invalid"
- Verificar credenciales de Twilio en el archivo `.env`

### La voz suena rara o no habla
- Verificar que Twilio tenga habilitado **Polly** para la voz
- Cambiar la voz en la configuración (intentar `Polly.Conchita` o `Polly.Mia`)

### Firebase functions: quota exceeded
- Estás superando el plan gratis. Verificar uso en Firebase Console → Usage

### El panel no conecta a Firebase
- Verificar que los datos de Firebase config sean correctos
- Abrir consola del navegador (F12) para ver errores

---

## 📄 Licencia

Este proyecto es propiedad de **tiendadigitalaipro**. Uso comercial permitido solo con licencia activa.

---

## 🤝 Soporte

Para soporte técnico, contactar al administrador del sistema.

---

> **Hecho con ❤️ para Nail Beautiful** — *Porque cada clienta merece ser atendida como una reina*
