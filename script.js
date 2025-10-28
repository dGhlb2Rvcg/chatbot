const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const micBtn = document.getElementById('mic-btn');
const micIcon = document.getElementById('mic-icon');
const statusDiv = document.getElementById('status');

let recognition;
let listening = false;

// Display a message in the chat window
function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message ' + (sender === 'user' ? 'user' : 'bot');
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Send user text to Hugging Face's Blenderbot-400M-distill API
async function fetchBotReply(userText) {
  statusDiv.textContent = 'Thinking...';
  try {
    const res = await fetch('https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: userText })
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const reply = data.generated_text || "Sorry, I didn't understand.";
    addMessage(reply, 'bot');
    statusDiv.textContent = '';
  } catch (err) {
    addMessage('Error: Unable to reach AI model.', 'bot');
    statusDiv.textContent = '';
  }
}

// Text submit handler
chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  userInput.value = '';
  fetchBotReply(text);
});

// Voice-to-text handler
micBtn.addEventListener('click', () => {
  if (listening) {
    recognition.stop();
    return;
  }
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    alert('Sorry, your browser does not support Speech Recognition.');
    return;
  }
  micBtn.classList.add('active');
  statusDiv.textContent = 'Listening...';
  micIcon.textContent = '🎤';

  // Use browser's built-in SpeechRecognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  listening = true;

  recognition.onresult = event => {
    const speechText = event.results[0][0].transcript;
    userInput.value = speechText;
    statusDiv.textContent = 'You said: ' + speechText;
    micBtn.classList.remove('active');
    micIcon.textContent = '🎙️';
    listening = false;
  };
  recognition.onerror = event => {
    statusDiv.textContent = 'Mic error: ' + event.error;
    micBtn.classList.remove('active');
    micIcon.textContent = '🎙️';
    listening = false;
  };
  recognition.onend = () => {
    micBtn.classList.remove('active');
    micIcon.textContent = '🎙️';
    listening = false;
  };
  recognition.start();
});