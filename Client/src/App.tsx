import { Route, Routes } from "react-router-dom";
import { ToastProvider } from "@heroui/toast";

import IndexPage from "@/pages/index";
import DashboardPages from "@/pages/dashboard";

function App() {
  return (
    <>
      <ToastProvider placement="bottom-center" />
      <Routes>
        <Route element={<IndexPage />} path="/" />
        <Route element={<DashboardPages />} path="/dashboard/*" />
      </Routes>
    </>
  );
}

export default App;
