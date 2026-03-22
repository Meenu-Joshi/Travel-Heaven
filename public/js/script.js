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

const chatToggle = document.getElementById('chat-toggle');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

chatToggle.addEventListener('click', () => chatBox.classList.toggle('d-none'));

sendBtn.addEventListener('click', async () => {
    const message = userInput.value;
    if (!message) return;

    // Display user message
    chatMessages.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
    userInput.value = '';

    // Fetch AI response
    const response = await fetch('/chatbot/chat', { // Full path: prefix + route
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userInput.value })
});
    const data = await response.json();

    // Display AI reply
    chatMessages.innerHTML += `<p><strong>AI:</strong> ${data.reply}</p>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
});