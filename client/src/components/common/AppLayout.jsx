import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>JWT Studio — Secure token development tools</p>
      </footer>
    </div>
  );
}