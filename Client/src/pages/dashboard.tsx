import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { useSocket } from "@/Components/SocketContext";
import { DashboardLayout } from "@/Layouts/DashboardLayout";
import { ProcessView } from "@/Components/Dashboard/Process";
import { ApplicationView } from "@/Components/Dashboard/Application";
import { ScreenshotView } from "@/Components/Dashboard/Screenshot";
import { WebcamView } from "@/Components/Dashboard/Webcam";
import { KeyloggerView } from "@/Components/Dashboard/KeyLogger";
import { ControllerView } from "@/Components/Dashboard/Controller";

export default function DashboardPages() {
  const { IsGatewayConnected, IsServerConnected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!IsGatewayConnected || !IsServerConnected) {
      navigate("/");
    }
  }, [IsGatewayConnected, IsServerConnected, navigate]);

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate replace to="process" />} />
        <Route element={<ProcessView />} path="process" />
        <Route element={<ApplicationView />} path="application" />
        <Route element={<KeyloggerView />} path="keylogger" />
        <Route element={<ScreenshotView />} path="screenshot" />
        <Route element={<WebcamView />} path="webcam" />
        <Route element={<ControllerView />} path="controller" />
      </Route>
    </Routes>
  );
}
