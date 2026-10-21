import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        JWT Studio
      </NavLink>

      <nav aria-label="Main navigation" className="nav-links">
        <NavLink to="/">Generator</NavLink>
        <NavLink to="/decode">Decoder</NavLink>
        <NavLink to="/verify">Verifier</NavLink>
      </nav>
    </header>
  );
}