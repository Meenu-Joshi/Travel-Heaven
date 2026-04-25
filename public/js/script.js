// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
  
        form.classList.add('was-validated')
      }, false)
    })
  })()

document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById('chat-toggle');
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    // Toggle Chat Visibility
    if (chatToggle) {
        chatToggle.addEventListener('click', () => {
            chatBox.classList.toggle('d-none');
        });
    }

    // Handle Sending Messages
    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const messageValue = userInput.value.trim();
            if (!messageValue) return;

            // 1. Show User Message in UI
            chatMessages.innerHTML += `<div class="user-msg text-end mb-2"><span class="bg-primary text-white p-2 rounded">${messageValue}</span></div>`;
            userInput.value = '';

            try {
                // 2. Fetch AI Response
                const response = await fetch('/chatbot/chat', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json' // CRITICAL for express.json()
                    },
                    body: JSON.stringify({ message: messageValue }) // KEY MUST BE "message"
                });

                const data = await response.json();
                
                // 3. Show AI Response in UI
                chatMessages.innerHTML += `<div class="ai-msg mb-2"><span class="bg-light p-2 rounded border d-inline-block">${data.reply}</span></div>`;
                chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll

            } catch (error) {
                console.error("Chat Error:", error);
                chatMessages.innerHTML += `<div class="text-danger mb-2 small">Error connecting to AI.</div>`;
            }
        });
    }
});