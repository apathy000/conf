import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import FeedPage from "./pages/FeedPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/feed"     element={<FeedPage />} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}