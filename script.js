const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const micBtn = document.getElementById('mic-btn');
const micIcon = document.getElementById('mic-icon');
const statusDiv = document.getElementById('status');

let recognition;
let listening = false;

function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message ' + (sender === 'user' ? 'user' : 'bot');
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function fetchBotReply(userText) {
  statusDiv.textContent = 'Thinking...';
  try {
    const res = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        inputs: {
          text: userText,
          max_length: 100
        }
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    // Handle the DialoGPT response format
    const reply = Array.isArray(data) && data.length > 0 ? 
                 data[0].generated_text : 
                 "I'm sorry, I couldn't generate a response.";
    
    addMessage(reply, 'bot');
    statusDiv.textContent = '';
  } catch (err) {
    console.error('API Error:', err);
    addMessage('Error: Unable to reach AI model. Please try again in a moment.', 'bot');
    statusDiv.textContent = '';
  }
}

// Add a simple retry mechanism
async function fetchWithRetry(userText, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetchBotReply(userText);
      return;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  userInput.value = '';
  try {
    await fetchWithRetry(text);
  } catch (err) {
    console.error('Final error after retries:', err);
  }
});

micBtn.addEventListener('click', () => {
  if (listening) {
    recognition?.stop();
    return;
  }
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    alert('Sorry, your browser does not support Speech Recognition.');
    return;
  }
  micBtn.classList.add('active');
  statusDiv.textContent = 'Listening...';
  micIcon.textContent = '🎤';

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

// Add initial welcome message
window.addEventListener('load', () => {
  addMessage('Hello! How can I help you today?', 'bot');
});