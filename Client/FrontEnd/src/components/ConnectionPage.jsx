// Import React hooks for managing state and side effects
import { useState, useEffect } from 'react';
// Import the socket.io-client library to connect to the Gateway
import io from 'socket.io-client';

// Initialize the socket connection to the Gateway server running on localhost:3001
const socket = io('http://localhost:3001');

// Define the ConnectionPage functional component
const ConnectionPage = () => {
    // State variable to store the server IP address, initialized to '127.0.0.1'
    const [ip, setIp] = useState('127.0.0.1');
    // State variable to store the server port, initialized to '8080'
    const [port, setPort] = useState('8080');
    // State variable to store the connection status message
    const [status, setStatus] = useState('Disconnected');
    // State variable to store the list of messages received from the server
    const [messages, setMessages] = useState([]);
    // State variable to store the current input message
    const [inputMessage, setInputMessage] = useState('');
    // State variable to store the connection state (connected/disconnected) for styling
    const [isConnected, setIsConnected] = useState(false);

    // useEffect hook to set up socket event listeners when the component mounts
    useEffect(() => {
        // Listener for 'connect' event (standard Socket.IO event)
        socket.on('connect', () => {
            console.log('Connected to Gateway');
            // Optionally, you could emit an event to request status, 
            // but our Gateway implementation now auto-sends status on connect if TCP is active.
        });

        // Listener for 'connection_status' event from the Gateway
        socket.on('connection_status', (data) => {
            // Update the status message with the received message
            setStatus(data.message);
            // Update the isConnected state based on the status received
            setIsConnected(data.status === 'connected');
        });

        // Listener for 'server_message' event from the Gateway
        socket.on('server_message', (message) => {
            // Add the new message to the messages list
            setMessages((prev) => [...prev, { type: 'received', text: message }]);
        });

        // Cleanup function to remove event listeners when the component unmounts
        return () => {
            socket.off('connect');
            // Remove the 'connection_status' listener
            socket.off('connection_status');
            // Remove the 'server_message' listener
            socket.off('server_message');
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Function to handle the connect button click
    const handleConnect = () => {
        // Emit 'connect_to_server' event to the Gateway with the IP and Port
        socket.emit('connect_to_server', { ip, port });
        // Update the status to indicate a connection is being attempted
        setStatus(`Connecting to ${ip}:${port}...`);
    };

    // Function to handle sending messages
    const handleSendMessage = () => {
        if (inputMessage.trim()) {
            socket.emit('client_message', inputMessage);
            setMessages((prev) => [...prev, { type: 'sent', text: inputMessage }]);
            setInputMessage('');
        }
    };

    // Render the component UI
    return (
        // Main container with full height, flexbox centering, and dark background
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            // Card container for the connection form
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                // Title of the page
                <h1 className="text-2xl font-bold mb-6 text-center text-blue-400">Server Connection</h1>

                // Input group for IP Address
                <div className="mb-4">
                    // Label for the IP input
                    <label className="block text-sm font-medium mb-2">Server IP</label>
                    // Input field for IP address
                    <input
                        type="text"
                        value={ip}
                        // Update ip state on change
                        onChange={(e) => setIp(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
                        placeholder="127.0.0.1"
                    />
                </div>

                // Input group for Port
                <div className="mb-6">
                    // Label for the Port input
                    <label className="block text-sm font-medium mb-2">Port</label>
                    // Input field for Port
                    <input
                        type="text"
                        value={port}
                        // Update port state on change
                        onChange={(e) => setPort(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
                        placeholder="8080"
                    />
                </div>

                // Connect button
                <button
                    // Call handleConnect on click
                    onClick={handleConnect}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                    Connect
                </button>

                // Status display area
                <div className={`mt-6 p-3 rounded text-center ${isConnected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                    // Display the current status
                    Status: {status}
                </div>
            </div>

            // Chat Interface
            {isConnected && (
                <div className="mt-8 w-full max-w-md bg-gray-800 p-4 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Chat</h2>

                    // Messages Display
                    <div className="h-64 overflow-y-auto space-y-2 mb-4 bg-gray-900 p-3 rounded">
                        {messages.map((msg, index) => (
                            <div key={index} className={`p-2 rounded text-sm max-w-[80%] ${msg.type === 'sent' ? 'bg-blue-600 ml-auto' : 'bg-gray-700 mr-auto'}`}>
                                <span className="block text-xs text-gray-400 mb-1">{msg.type === 'sent' ? 'You' : 'Server'}</span>
                                {msg.text}
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <div className="text-gray-500 text-center italic mt-20">Start chatting...</div>
                        )}
                    </div>

                    // Input Area
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
                            placeholder="Type a message..."
                        />
                        <button
                            onClick={handleSendMessage}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
};

// Export the ConnectionPage component as default
export default ConnectionPage;
