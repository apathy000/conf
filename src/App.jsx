import { BrowserRouter, Routes, Route } from "react-router-dom";
import AvatarSetup from "./pages/AvatarSetup";
import Feed from "./pages/Feed";
import Register from "./pages/Register";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/avatar" element={<AvatarSetup />} />
        <Route path="/feed" element={<Feed />} />
      </Routes>
    </BrowserRouter>
  );
}