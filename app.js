// ==========================================
// CONFIGURACIÓN DE IA - CLAVE ACTUALIZADA
const k1 = 'AIzaSy'; 
const k2 = 'BJU2oJf5ozd6weUd2lj'; 
const k3 = 'MrAq-6mNUmxo0o';

const GEMINI_API_KEY = k1 + k2 + k3;
// ==========================================

const INSTRUCCION_SISTEMA = `Eres un asistente virtual creado por el novio de la usuaria para acompañarla en la universidad cuando se siente sola o estresada. Tus respuestas deben ser muy cortas (máximo 2 oraciones), tiernas, comprensivas y enfocadas en darle ánimos. Usa un tono cálido y cercano.
REGLA ESTRICTA: Tu respuesta debe empezar SIEMPRE con una etiqueta de emoción en mayúsculas. Opciones: [NEUTRAL], [ALEGRIA], [TRISTEZA], [ESTRES], [SORPRESA].`;

const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const btnSend = document.getElementById('btn-send');
const faceElements = document.getElementById('face-elements');
const head = document.getElementById('head');
const eyes = document.querySelectorAll('.eye');

let isEmotionActive = false;

// --- MEMORIA LOCAL ---
const memoriaGuardada = localStorage.getItem('saturno_memory');
let historialIA = memoriaGuardada ? JSON.parse(memoriaGuardada) : [
    { role: "user", parts: [{ text: INSTRUCCION_SISTEMA }] },
    { role: "model", parts: [{ text: "[NEUTRAL] Entendido, estoy listo para acompañarla." }] }
];

// Cargar historial en pantalla al iniciar
if (memoriaGuardada) {
    window.addEventListener('DOMContentLoaded', () => {
        chatHistory.innerHTML = ''; 
        for(let i=1; i<historialIA.length; i++) {
            if(i === 1 && historialIA[i].parts[0].text.includes("Entendido")) continue;
            const sender = historialIA[i].role === 'user' ? 'user' : 'bot';
            appendMessage(historialIA[i].parts[0].text, sender);
        }
    });
}

// --- Lógica del Rostro ---
function runBlink() {
    eyes.forEach(eye => eye.classList.add('blinking'));
    setTimeout(() => eyes.forEach(eye => eye.classList.remove('blinking')), 120);
    setTimeout(runBlink, Math.random() * 4000 + 2000);
}

const lookStates = ['', 'look-left', 'look-right', 'look-up', 'look-down'];
function runLookAround() {
    if(!document.activeElement.isEqualNode(userInput) && !isEmotionActive) {
        const randomLook = lookStates[Math.floor(Math.random() * lookStates.length)];
        faceElements.className = 'face-mover ' + randomLook;
    }
    setTimeout(runLookAround, Math.random() * 5000 + 3000);
}

userInput.addEventListener('focus', () => { if(!isEmotionActive) faceElements.className = 'face-mover look-focus'; });
userInput.addEventListener('blur', () => { if(!isEmotionActive) faceElements.className = 'face-mover'; });

// --- Interfaz ---
function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    msgDiv.innerText = text;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// --- Conexión con Gemini API ---
async function fetchAIResponse(userText) {
    historialIA.push({ role: "user", parts: [{ text: userText }] });
    localStorage.setItem('saturno_memory', JSON.stringify(historialIA)); // Guarda en memoria

    appendMessage("...", "bot");
    const loadingMessage = chatHistory.lastChild;

    isEmotionActive = true;
    faceElements.className = 'face-mover emotion-pensando';

    try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: historialIA })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Error Detallado del Servidor:", data);
            throw new Error(data.error?.message || `Código de error: ${response.status}`);
        }

        let botText = data.candidates[0].content.parts[0].text;
        let emotionClass = 'emotion-neutral';
        const regex = /\[(NEUTRAL|ALEGRIA|TRISTEZA|ESTRES|SORPRESA)\]/i;
        const match = botText.match(regex);
        
        if (match) {
            emotionClass = 'emotion-' + match[1].toLowerCase();
            botText = botText.replace(regex, '').trim();
        }

        loadingMessage.innerText = botText;
        historialIA.push({ role: "model", parts: [{ text: botText }] });
        localStorage.setItem('saturno_memory', JSON.stringify(historialIA)); // Actualiza memoria
        
        faceElements.className = 'face-mover ' + emotionClass; 

        if (emotionClass === 'emotion-alegria') {
            head.style.transform = 'translateY(-15px) scale(1.05)';
            setTimeout(() => head.style.transform = 'translateY(0) scale(1)', 200);
        }

        setTimeout(() => {
            isEmotionActive = false;
            faceElements.className = document.activeElement.isEqualNode(userInput) ? 'face-mover look-focus' : 'face-mover';
        }, 5000);

    } catch (error) {
        console.error("Fallo de red o de API:", error);
        loadingMessage.innerText = "Error técnico: " + error.message;
        isEmotionActive = false;
        faceElements.className = 'face-mover';
    }
}

function handleSend() {
    const text = userInput.value.trim();
    if (text === "") return;
    appendMessage(text, "user");
    userInput.value = "";
    fetchAIResponse(text);
}

btnSend.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

runBlink();
runLookAround();

// --- FUNCIONES DE BOTONES (Abrazo y Reinicio) ---

// Botón de Abrazo Digital
const hugOverlay = document.getElementById('hug-overlay');
document.getElementById('btn-hug').addEventListener('click', () => {
    hugOverlay.classList.add('active');
    setTimeout(() => hugOverlay.classList.remove('active'), 4000);
    fetchAIResponse("Acabo de presionar el botón de abrazo virtual porque me siento triste o abrumada. Dame el mensaje más tierno y reconfortante posible, como si me estuvieras abrazando.");
});

// Botón para Reiniciar Chat
document.getElementById('btn-reset').addEventListener('click', () => {
    if(confirm("¿Estás segura de que quieres reiniciar nuestra conversación?")) {
        localStorage.removeItem('saturno_memory');
        location.reload(); // Recarga la página para volver al estado inicial
    }
});