import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { useSocket } from "@/components/SocketContext";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { ProcessView } from "@/components/dashboard/process-view";
import { ApplicationView } from "@/components/dashboard/application-view";
import { ScreenshotView } from "@/components/dashboard/screenshot-view";
import { WebcamView } from "@/components/dashboard/webcam-view";
import { KeyloggerView } from "@/components/dashboard/keylogger-view";
import { MaintenanceView } from "@/components/dashboard/maintenance-view";

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
        <Route
          element={<MaintenanceView feature="Controller" />}
          path="controller"
        />
      </Route>
    </Routes>
  );
}
