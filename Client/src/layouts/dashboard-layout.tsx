import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Card, CardBody } from "@heroui/card";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useEffect } from "react";

import { useSocket } from "@/components/SocketContext";
import { Background } from "@/components/background";

export const DashboardLayout = () => {
  const { IsServerConnected, DisconnectFromServer } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDisconnect = () => {
    DisconnectFromServer();
    navigate("/");
  };

  const navItems = [
    {
      label: "Process",
      path: "/dashboard/process",
      active: location.pathname.includes("/process"),
    },
    {
      label: "Application",
      path: "/dashboard/application",
      active: location.pathname.includes("/application"),
    },
    {
      label: "KeyLogger",
      path: "/dashboard/keylogger",
      active: location.pathname.includes("/keylogger"),
    },
    {
      label: "Screenshot",
      path: "/dashboard/screenshot",
      active: location.pathname.includes("/screenshot"),
    },
    {
      label: "WebCam",
      path: "/dashboard/webcam",
      active: location.pathname.includes("/webcam"),
    },
    {
      label: "Controller",
      path: "/dashboard/controller",
      active: location.pathname.includes("/controller"),
    },
  ];

  return (
    <>
      <div className="h-screen flex justify-center items-center">
        <Background />
        <Card
          isBlurred
          className="flex h-full w-full max-w-3/4 max-h-5/6 bg-white/10 backdrop-blur-sm z-50"
        >
          <CardBody className="flex-row">
            {/* Sidebar */}
            <div className="w-64 min-w-[16rem] flex flex-col border-r border-divider min-h-full p-4 gap-4">
              {/* Connection Info */}
              <Card className="bg-content1 shadow-sm">
                <CardBody className="gap-2">
                  <h3 className="font-bold text-lg">Connection Info</h3>
                  <Divider />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-default-500">Status:</span>
                    <Chip
                      color={IsServerConnected ? "success" : "danger"}
                      size="sm"
                      variant="flat"
                    >
                      {IsServerConnected ? "Connected" : "Disconnected"}
                    </Chip>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-default-500">Ping:</span>
                    <span className="font-mono">{0} ms</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-default-500">Uptime:</span>
                    <span className="font-mono">{0}s</span>
                  </div>
                </CardBody>
              </Card>

              {/* Navigation */}
              <div className="flex flex-col gap-2 flex-grow">
                <h3 className="font-bold text-lg px-2">Features</h3>
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    className="justify-start"
                    color={item.active ? "primary" : "default"}
                    variant={item.active ? "flat" : "light"}
                    onPress={() => navigate(item.path)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              {/* Disconnect */}
              <Button
                className="mt-auto"
                color="danger"
                variant="flat"
                onPress={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>

            {/* Main Content */}
            <div className="grow h-full overflow-hidden flex flex-col">
              <main className="grow p-6 overflow-auto">
                <Outlet />
              </main>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};
