const { Server } = require("socket.io");

const IO = new Server(5000, {
    cors: {
        origin: "*",
    },
    maxHttpBufferSize: 50 * 1024 * 1024
});

console.log("Gateway > Gateway is running on port 5000");

const ServerList = new Map();
const ClientList = new Map();
const ClientToServerMap = new Map();
const ServerToClientMap = new Map();

IO.on("connection", (Socket) => {
    console.log(`Gateway > New connection: ${Socket.id}`);

    Socket.on("Server:Register", (Data) => {
        console.log(`Gateway > Server registered: ${Socket.id} -> ${Data.IP}:${Data.Port}`);
        ServerList.set(Socket.id, Data);
        Socket.emit("Server:Register:Success", { Role: "Server", ID: Socket.id });
    });

    Socket.on("Client:Register", (Data) => {
        console.log(`Gateway > Client registered: ${Socket.id}`);
        ClientList.set(Socket.id, Data);
        Socket.emit("Client:Register:Success", { Role: "Client", ID: Socket.id });
    });

    Socket.on("Client:Connect", (Data) => {
        if (!ClientList.has(Socket.id)) {
            Socket.emit("Client:Connect:Error:NotRegistered");
            return;
        }

        const { IP, Port } = Data;
        let TargetServerSocketID = null;

        for (const [ServerID, ServerData] of ServerList.entries()) {
            if (ServerData.IP === IP && ServerData.Port == Port) {
                TargetServerSocketID = ServerID;
                break;
            }
        }

        if (TargetServerSocketID) {
            if (ServerToClientMap.has(TargetServerSocketID)) {
                Socket.emit("Client:Connect:Error:AlreadyConnected");
                return;
            }

            ClientToServerMap.set(Socket.id, TargetServerSocketID);
            ServerToClientMap.set(TargetServerSocketID, Socket.id);

            console.log(`Gateway > Client ${Socket.id} connected to Server ${TargetServerSocketID}`);
            Socket.emit("Client:Connect:Success", { ServerID: TargetServerSocketID });
            IO.to(TargetServerSocketID).emit("Server:Connect:Success", { ClientID: Socket.id });
        } else {
            Socket.emit("Client:Connect:Error:ServerNotFound");
        }
    });

    Socket.on("Client:Disconnect", () => {
        if (ClientToServerMap.has(Socket.id)) {
            const ServerID = ClientToServerMap.get(Socket.id);
            IO.to(ServerID).emit("Server:Disconnect", { clientId: Socket.id });
            ClientToServerMap.delete(Socket.id);
            ServerToClientMap.delete(ServerID);
        }
    })

    Socket.onAny((EventName, ...Args) => {
        if (ClientToServerMap.has(Socket.id)) {
            const ServerID = ClientToServerMap.get(Socket.id);
            IO.to(ServerID).emit(EventName, ...Args);
        }
        else if (ServerToClientMap.has(Socket.id)) {
            const ClientID = ServerToClientMap.get(Socket.id);
            IO.to(ClientID).emit(EventName, ...Args);
        }
    });

    Socket.on("disconnect", () => {
        console.log(`Gateway > Disconnected: ${Socket.id}`);

        if (ServerList.has(Socket.id)) {
            ServerList.delete(Socket.id);
            if (ServerToClientMap.has(Socket.id)) {
                const ClientID = ServerToClientMap.get(Socket.id);
                ServerToClientMap.delete(Socket.id);
                ClientToServerMap.delete(ClientID);
                IO.to(ClientID).emit("Client:Connect:Error:ServerDisconnected");
            }
        }

        if (ClientList.has(Socket.id)) {
            ClientList.delete(Socket.id);
            if (ClientToServerMap.has(Socket.id)) {
                const ServerID = ClientToServerMap.get(Socket.id);
                ClientToServerMap.delete(Socket.id);
                ServerToClientMap.delete(ServerID);
                IO.to(ServerID).emit("Server:Connect:Error:ClientDisconnected");
            }
        }
    });
});
