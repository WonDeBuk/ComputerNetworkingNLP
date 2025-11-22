// Import the express module to create the web server
const express = require('express');
// Import the http module to create an HTTP server
const http = require('http');
// Import the socket.io module to enable real-time, bidirectional communication
const { Server } = require('socket.io');
// Import the cors module to allow Cross-Origin Resource Sharing
const cors = require('cors');
// Import the net module to create TCP clients and servers
const net = require('net');

// Create an instance of the express application
const app = express();
// Define the port number for the Gateway server to listen on
const PORT = 3001;

// Use the CORS middleware to allow requests from different origins
app.use(cors());
// Use the express.json middleware to parse JSON request bodies
app.use(express.json());

// Create an HTTP server using the express application
const server = http.createServer(app);

// Initialize a new instance of the Socket.IO server
const io = new Server(server, {
    // Configure CORS for Socket.IO
    cors: {
        // Allow requests from the React Frontend running on port 5173 (Vite default)
        origin: "http://localhost:5173",
        // Allow GET and POST methods
        methods: ["GET", "POST"]
    }
});

// Variable to store the TCP client socket connection
let tcpClient = null;
// Variable to store the currently active Socket.IO client
let activeSocket = null;

// Event listener for when a client connects to the Socket.IO server
io.on('connection', (socket) => {
    // Log a message when a user connects
    console.log('A user connected to the Gateway via Socket.IO');

    // Update the active socket to the new connection
    activeSocket = socket;

    // If there is already an active TCP connection, notify the new client
    if (tcpClient && !tcpClient.destroyed) {
        console.log('Syncing existing TCP connection state to new client');
        socket.emit('connection_status', { status: 'connected', message: 'Restored connection to C++ Server' });
    }

    // Event listener for 'connect_to_server' event from the Frontend
    socket.on('connect_to_server', (data) => {
        // Destructure the ip and port from the received data
        const { ip, port } = data;
        // Log the connection attempt details
        console.log(`Attempting to connect to C++ Server at ${ip}:${port}`);

        // If there is an existing TCP connection, destroy it before creating a new one
        if (tcpClient) {
            // Destroy the existing connection
            tcpClient.destroy();
            // Log that the previous connection was closed
            console.log('Closed previous TCP connection');
        }

        // Create a new TCP socket
        tcpClient = new net.Socket();

        // Attempt to connect to the C++ Server using the provided port and IP
        tcpClient.connect(port, ip, () => {
            // Log a message upon successful connection
            console.log('Connected to C++ Server');
            // Emit a 'connection_status' event to the active Frontend with success status
            if (activeSocket) {
                activeSocket.emit('connection_status', { status: 'connected', message: 'Successfully connected to C++ Server' });
            }
        });

        // Event listener for data received from the C++ Server
        tcpClient.on('data', (data) => {
            // Log the received data as a string
            console.log('Received: ' + data);
            // Emit a 'server_message' event to the active Frontend with the received data
            if (activeSocket) {
                activeSocket.emit('server_message', data.toString());
            }
        });

        // Event listener for when the TCP connection is closed
        tcpClient.on('close', () => {
            // Log that the connection was closed
            console.log('Connection to C++ Server closed');
            // Emit a 'connection_status' event to the active Frontend with disconnected status
            if (activeSocket) {
                activeSocket.emit('connection_status', { status: 'disconnected', message: 'Connection to C++ Server closed' });
            }
        });

        // Event listener for TCP connection errors
        tcpClient.on('error', (err) => {
            // Log the error message
            console.error('TCP Connection Error: ' + err.message);
            // Emit a 'connection_status' event to the active Frontend with error status and message
            if (activeSocket) {
                activeSocket.emit('connection_status', { status: 'error', message: 'Failed to connect: ' + err.message });
            }
        });
    });

    // Event listener for 'client_message' event from the Frontend
    socket.on('client_message', (message) => {
        if (tcpClient && !tcpClient.destroyed) {
            console.log(`Forwarding to Server: ${message}`);
            tcpClient.write(message);
        } else {
            console.log('Cannot send message: No active TCP connection');
        }
    });

    // Event listener for when the user disconnects from Socket.IO
    socket.on('disconnect', () => {
        // Log a message when the user disconnects
        console.log('User disconnected from Gateway');
        // If this was the active socket, clear the reference (optional, but good practice)
        if (activeSocket === socket) {
            activeSocket = null;
        }
    });
});

// Start the HTTP server and listen on the defined port
server.listen(PORT, () => {
    // Log a message indicating the server is running
    console.log(`Gateway Server running on port ${PORT}`);
});
