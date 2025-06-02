import express from 'express';
// Requires 'amqplib' package. Install with: npm install amqplib
import amqp from 'amqplib';
import dotenv from 'dotenv';
import WebSocket from 'ws';
import http from 'http';

dotenv.config(); // Load .env variables


const AMQP_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE = process.env.QUEUE;
const DEQUEUE = process.env.DEQUEUE;
let connection = null;
let channel = null;
let channe2 = null;


async function connect_to_rabbitmmq() {
  try {
    connection = await amqp.connect(AMQP_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });

    channe2 = await connection.createChannel();
    await channe2.assertQueue(DEQUEUE, { durable: true });

  } catch (err) {
    console.error('Failed to publish message to RabbitMQ:', err);
  } finally {

  }
}

connect_to_rabbitmmq();

async function enqueue(msg) {

  try {
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(msg)));
    console.log(`Published message ${msg}: ${Buffer.from(JSON.stringify(msg))} to RabbitMQ queue "${QUEUE}"`);
  } catch (err) {
    console.error('Failed to publish message to RabbitMQ:', err);
  } finally {
  }
}

// Function to connect to RabbitMQ and start consuming messages
const dequeue = async (ws) => {
  try {
   // Declare a queue (make sure it exists)
    console.log(`Waiting for messages in ${DEQUEUE}...`);

    // Consume messages from the queue
    channe2.consume(DEQUEUE, (msg) => {
      if (msg) {
        const message = msg.content.toString();
        console.log(`Received: ${message}`);
        ws.send(message);

        // Acknowledge the message (remove it from the queue)
        channe2.ack(msg);
      }
    }, { noAck: false });
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
  }
};
// dequeue();


const app = express();
// Create an HTTP server using Express
const server = http.createServer(app);
// Create a WebSocket server that uses the Express HTTP server
const wss = new WebSocket.Server({ server });
// Handle WebSocket connections
wss.on('connection', async(ws) => {
  console.log('A new WebSocket connection has been established.');

  // Send a welcome message to the client
  ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));

  // Handle incoming messages from the client
  ws.on('message', async (message) => {
    console.log(`Received message: ${message}`);
    // Send a response back to the client
    await enqueue(message)
    // ws.send(JSON.stringify({ message: `You said: ${message}` }));
  });

  // Handle WebSocket close event
  ws.on('close', () => {
    console.log('WebSocket connection closed.');
  });

  dequeue(ws);
});



const port = process.env.PORT;
const dir = `${__dirname}/../static/`;

app.use(express.json());
app.use(express.static(__dirname + '/../static'));




// POST / expects { "msg": "...", "time-stamp": "..." }
app.post('/', async (req, res) => {
  const { msg, "time-stamp": timeStamp } = req.body;
  console.log('Received msg:', msg);
  console.log('Received time-stamp:', timeStamp);

  await enqueue(req.body);
  res.json({ status: 'ok', received: { msg, "time-stamp": timeStamp } });
});

app.get('/', (req, res) => {
  res.sendFile(dir + "/index.html");
});



// Start the server and listen on port 8080
server.listen(8080, () => {
  console.log('Express server is running on http://localhost:8080');
});