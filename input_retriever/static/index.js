// Connect to the WebSocket server
const socket = new WebSocket('ws://localhost:8080');

// Log when the connection is open
socket.addEventListener('open', () => {
  console.log('Connected to the WebSocket server!');
});

// Handle incoming messages from the server
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML += `<p>${message.message}</p>`;
});

// Send a message to the WebSocket server
const sendMessageButton = document.getElementById('sendMessageBtn');
const messageInput = document.getElementById('messageInput');

sendMessageButton.addEventListener('click', () => {
  const message = messageInput.value;
  if (message) {
    socket.send(message); // Send the message to the server
    messageInput.value = ''; // Clear the input field
  }
});
