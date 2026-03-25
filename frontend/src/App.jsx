import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </ToastProvider>
  );
}
