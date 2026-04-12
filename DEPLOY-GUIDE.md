# ════════════════════════════════════════════════════════
# MARY BOT — Guía de Despliegue
# ════════════════════════════════════════════════════════

## PASO 1: Instalar Node.js
Descargar de https://nodejs.org — versión 18 LTS
Instalar con opciones por defecto (Next > Next > Install > Finish)

## PASO 2: Instalar Firebase CLI
Abrir CMD como Administrador y ejecutar:
  npm install -g firebase-tools

## PASO 3: Iniciar sesión en Firebase
  firebase login
Se abre el navegador → seleccionar tu cuenta de Google → Allow

## PASO 4: Clonar el repositorio
  git clone https://github.com/tiendadigitalaipro/nail-bot-mary.git
  cd nail-bot-mary

## PASO 5: Instalar dependencias
  cd functions
  npm install
  cd ..

## PASO 6: Configurar secrets (API Keys)
  firebase functions:secrets:set GEMINI_API_KEY
  (Pegar la API Key de Google Gemini)

  firebase functions:secrets:set TWILIO_ACCOUNT_SID
  (Pegar el Account SID de Twilio — lo encontrás en Twilio Console > Account Info)

  firebase functions:secrets:set TWILIO_AUTH_TOKEN
  (Pegar el Auth Token de Twilio — click "Show" al lado de Auth Token en Twilio Console)

## PASO 7: Desplegar a Firebase
  firebase deploy --only functions

## PASO 8: Comprar número en Twilio
1. En Twilio Console → Phone Numbers → Buy a Number
2. Buscar número disponible → Buy
3. Configurar el número:
   - "A CALL COMES IN" → Webhook / Function
   - URL: https://us-central1-nail-bot-mary.cloudfunctions.net/incomingCall
   - HTTP Method: POST

## PASO 9: Probar
Llamar al número comprado → Mary debería responder

## PANEL DE ADMINISTRACIÓN
Abrir admin/mary-bot-admin.html en el navegador
(Se conecta automáticamente a Firebase)

## VER LOGS EN VIVO
  firebase functions:log
