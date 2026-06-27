import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Navbar({ profile }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <div className="navbar-logo">
          <img src="/images.jpg" alt="LPFA" className="navbar-logo-img" />
          <span className="navbar-title">conf</span>
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {profile && (
            <div className="navbar-profile">
              <div className="navbar-avatar">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </div>
              <div className="navbar-info">
                <span className="navbar-name">{profile.first_name} {profile.last_name}</span>
                <span className="navbar-class">{profile.class_grade}</span>
              </div>
            </div>
          )}
          <button className="navbar-logout" onClick={handleLogout} title="Sign out">
            <LogoutIcon />
          </button>
        </div>

      </div>
    </nav>
  );
}

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);