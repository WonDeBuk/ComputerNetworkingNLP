import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useCallback,
    ReactNode,
} from "react";
import { io as IO, Socket } from "socket.io-client";
import { addToast } from "@heroui/toast";

export interface Process {
    PID: number;
    Name: string;
    Memory: string;
}

export interface Application {
    PID: number;
    Name: string;
    Title: string;
    Memory: string;
}

export interface Screenshot {
    id: string;
    filename: string;
    timestamp: number;
    size: number;
    url: string;
}

export interface Webcam {
    TimeStamp: number;
    Size: number;
    URL: string;
}

interface SocketContextType {
    IsGatewayConnected: boolean;
    IsServerConnected: boolean;
    GatewayConnectError: string | null;
    ServerConnectError: string | null;
    ConnectToGateway: (IP: string, Port: string) => void;
    ConnectToServer: (IP: string, Port: string) => void;
    DisconnectFromServer: () => void;
    ProcessList: Process[];
    ApplicationList: Application[];
    KillProcess: (PID: number) => void;
    SubscribeToProcesses: () => void;
    UnsubscribeFromProcesses: () => void;
    SubscribeToApplications: () => void;
    UnsubscribeFromApplications: () => void;
    CaptureScreenshot: () => void;
    RecordWebcam: (Duration: number) => void;
    IsWebcamOn: boolean;
    Screenshots: Screenshot[];
    WebcamRecordings: Webcam[];
    ShutDown: () => void;
    Reboot: () => void;
    Hibernate: () => void;
    Sleep: () => void;
    Lock: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);

    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }

    return context;
};

export const SocketProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [IsGatewayConnected, SetIsGatewayConnected] = useState<boolean>(false);
    const [IsServerConnected, SetIsServerConnected] = useState<boolean>(false);
    const [GatewayConnectError, SetGatewayConnectError] = useState<string | null>(null)
    const [ServerConnectError, SetServerConnectError] = useState<string | null>(null);
    const [ProcessList, SetProcessList] = useState<Process[]>([]);
    const [ApplicationList, SetApplicationList] = useState<Application[]>([]);
    const [Screenshots, SetScreenshots] = useState<Screenshot[]>([]);
    const [WebcamRecordings, SetWebcamRecordings] = useState<Webcam[]>([]);
    const [IsWebcamOn, SetIsWebcamOn] = useState<boolean>(false);

    const SocketRef = useRef<Socket | null>(null);

    const SetupSocketListeners = useCallback((NewSocket: Socket) => {
        NewSocket.on("connect", () => {
            console.log("Connected to Gateway");
            NewSocket.emit("Client:Register", { IP: "127.0.0.1", Port: "3000" });
            SetIsGatewayConnected(true);
            addToast({
                title: "Connected",
                description: "Successfully connected to Gateway",
            });
        });

        NewSocket.on("disconnect", () => {
            console.log("Disconnected from Gateway");
            SetIsGatewayConnected(false);
            SetIsServerConnected(false);
            SocketRef.current?.disconnect();
            addToast({
                title: "Disconnected",
                description: "Disconnected from Gateway",
            });
        });

        NewSocket.on("connect_error", (Error) => {
            SetIsGatewayConnected(false);
            SetGatewayConnectError(Error.message);
            addToast({
                title: "Connection Error",
                description: Error.message,
            });
        });

        NewSocket.on("Client:Register:Success", () => {
            console.log("Client Registered with Gateway");
        });

        NewSocket.on("Client:Connect:Success", () => {
            console.log("Connected to Server via Gateway");
            SetIsServerConnected(true);
            addToast({
                title: "Connected",
                description: "Successfully connected to Server",
            });
        });

        NewSocket.on("Client:Connect:Error:NotRegistered", () => {
            SetServerConnectError("Client:Connect:Error:NotRegistered");
            addToast({
                title: "Connection Error",
                description: "Client not registered",
            });
        });

        NewSocket.on("Client:Connect:Error:ServerNotFound", () => {
            SetServerConnectError("Client:Connect:Error:ServerNotFound")
            addToast({
                title: "Connection Error",
                description: "Server not found",
            });
        });

        NewSocket.on("Client:Connect:Error:AlreadyConnected", () => {
            SetServerConnectError("Client:Connect:Error:AlreadyConnected");
            addToast({
                title: "Connection Error",
                description: "Already connected to a server",
            });
        });

        NewSocket.on("Client:Connect:Error:ServerDisconnected", () => {
            SetServerConnectError("Client:Connect:Error:ServerDisconnected");
            SetIsServerConnected(false);
            addToast({
                title: "Connection Error",
                description: "Server disconnected",
            });
        });

        NewSocket.on("Server:Disconnect", () => {
            SetIsServerConnected(false);
            addToast({
                title: "Disconnected",
                description: "Server Disconnected",
            });
        });

        NewSocket.on("Process:List", (Data: Process[]) => {
            SetProcessList(Data);
        });

        NewSocket.on("Application:List", (Data: Application[]) => {
            SetApplicationList(Data);
        });

        NewSocket.on(
            "Screenshot:Final",
            (Data: { TimeStamp: number; Size: number; URL: string }) => {
                const NewScreenshot: Screenshot = {
                    id: Data.TimeStamp.toString(),
                    filename: `Screenshot_${Data.TimeStamp}.jpg`,
                    timestamp: Data.TimeStamp,
                    size: Data.Size,
                    url: `data:image/jpeg;base64,${Data.URL}`,
                };

                SetScreenshots((prev) => [NewScreenshot, ...prev]);
                addToast({
                    title: "Screenshot Captured",
                    description: "New screenshot available",
                });
            },
        );

        NewSocket.on(
            "Webcam:Final",
            (Data: { TimeStamp: number; Size: number; URL: string }) => {
                const NewWebcam: Webcam = {
                    TimeStamp: Data.TimeStamp,
                    Size: Data.Size,
                    URL: `data:video/mp4;base64,${Data.URL}`,
                };

                SetWebcamRecordings((prev) => [NewWebcam, ...prev]);
                SetIsWebcamOn(false);
                addToast({
                    title: "Webcam Recorded",
                    description: "New webcam recording available",
                });
            },
        );
    }, []);

    const ConnectToGateway = useCallback(
        (IP: string, Port: string) => {
            if (SocketRef.current) {
                SocketRef.current.disconnect();
            }

            const NewSocket = IO(`http://${IP}:${Port}`, {
                reconnection: false,
                reconnectionAttempts: 0,
                timeout: 10000,
                transports: ["websocket"],
            });

            SocketRef.current = NewSocket;

            SetupSocketListeners(NewSocket);
        },
        [SetupSocketListeners],
    );

    const ConnectToServer = useCallback(
        (IP: string, Port: string) => {
            if (SocketRef.current && IsGatewayConnected) {
                SocketRef.current.emit("Client:Connect", { IP, Port });
            } else {
                addToast({
                    title: "Error",
                    description: "Not connected to Gateway",
                });
            }
        },
        [IsGatewayConnected],
    );

    const DisconnectFromServer = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Client:Disconnect");
            SetIsServerConnected(false);
        }
    }, []);

    const KillProcess = useCallback((PID: number) => {
        if (SocketRef.current) {
            SocketRef.current.emit("Process:Kill", PID);
        }
    }, []);

    const SubscribeToProcesses = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Process:Subscribe");
        }
    }, []);

    const UnsubscribeFromProcesses = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Process:Unsubscribe");
        }
    }, []);

    const SubscribeToApplications = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Application:Subscribe");
        }
    }, []);

    const UnsubscribeFromApplications = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Application:Unsubscribe");
        }
    }, []);

    const CaptureScreenshot = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Screenshot:Take");
        }
    }, []);

    const RecordWebcam = useCallback((Duration: number) => {
        if (SocketRef.current) {
            SetIsWebcamOn(true);
            SocketRef.current.emit("Webcam:Record", Duration);
        }
    }, []);

    const ShutDown = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Controller:ShutDown");
        }
    }, []);

    const Reboot = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Controller:Reboot");
        }
    }, []);

    const Hibernate = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Controller:Hibernate");
        }
    }, []);

    const Sleep = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Controller:Sleep");
        }
    }, []);

    const Lock = useCallback(() => {
        if (SocketRef.current) {
            SocketRef.current.emit("Controller:Lock");
        }
    }, []);

    const value: SocketContextType = {
        IsGatewayConnected,
        IsServerConnected,
        GatewayConnectError,
        ServerConnectError,
        ConnectToGateway,
        ConnectToServer,
        DisconnectFromServer,
        ProcessList,
        ApplicationList,
        KillProcess,
        SubscribeToProcesses,
        UnsubscribeFromProcesses,
        SubscribeToApplications,
        UnsubscribeFromApplications,
        CaptureScreenshot,
        RecordWebcam,
        IsWebcamOn,
        Screenshots,
        WebcamRecordings,
        ShutDown,
        Reboot,
        Hibernate,
        Sleep,
        Lock,
    };

    return (
        <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
    );
};
