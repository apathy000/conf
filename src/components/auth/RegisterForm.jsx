import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const ALLOWED_IPS = ["5.77.194.211"];

const PROFESSIONS = ["TT", "Management", "Marketing", "Insurance", "Finance", "Accounting"];
const GRADES      = ["1", "2", "3", "4"];

const up = (delay = 0) => ({
  initial:    { opacity: 0, y: 18 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

function LoadingScreen() {
  return (
    <div className="screen-center">
      <div className="screen-card">
        <div className="screen-icon blue"><WifiIcon size={26} /></div>
        <h2 className="screen-title">Verifying network…</h2>
        <p className="screen-sub">Checking if you're on the LPFA school network.</p>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
          <Spinner size={24} />
        </div>
      </div>
    </div>
  );
}

function BlockedScreen({ ip }) {
  return (
    <div className="screen-center">
      <div className="screen-card">
        <div className="screen-icon red"><ShieldIcon /></div>
        <h2 className="screen-title">Access Restricted</h2>
        <p className="screen-sub">
          This platform is only available to students on the{" "}
          <strong style={{ color: "rgba(255,255,255,.7)" }}>LPFA school Wi-Fi</strong>.
          Connect to the school network and refresh.
        </p>
        <div className="screen-pill"><WifiOffIcon />Not on school network</div>
        {ip && (
          <p style={{ marginTop: 14, fontSize: 11, color: "var(--muted)" }}>
            Your IP: <code style={{ color: "rgba(255,255,255,.4)" }}>{ip}</code>
          </p>
        )}
      </div>
    </div>
  );
}

export default function RegisterForm() {
  const navigate = useNavigate();

  const [ipStatus,    setIpStatus   ] = useState("checking");
  const [userIP,      setUserIP     ] = useState("");
  const [showPass,    setShowPass   ] = useState(false);
  const [form, setForm] = useState({
    firstName:  "",
    lastName:   "",
    username:   "",
    profession: "",
    grade:      "",
    password:   "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState("");

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then(({ ip }) => {
        console.log("Your public IP:", ip);
        setUserIP(ip);
        setIpStatus(ALLOWED_IPS.includes(ip) ? "allowed" : "blocked");
      })
      .catch(() => {
        console.warn("IP check failed – allowing access");
        setIpStatus("allowed");
      });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.username || !form.profession || !form.grade || !form.password) {
      setError("Please fill in all fields."); return;
    }
    if (form.username.length < 3) {
      setError("Username must be at least 3 characters."); return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters."); return;
    }

    setLoading(true);

    const fakeEmail = `${form.username.toLowerCase().trim()}@lpfaconf.com`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    fakeEmail,
      password: form.password,
    });

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "This username is already taken."
          : signUpError.message
      );
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id:          data.user.id,
        first_name:  form.firstName,
        last_name:   form.lastName,
        username:    form.username.toLowerCase().trim(),
        class_grade: `${form.profession} — Grade ${form.grade}`,
      });

    if (profileError) {
      setError("Account created but profile save failed. Contact admin.");
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate("/login");
  };

  if (ipStatus === "checking") return <LoadingScreen />;
  if (ipStatus === "blocked")  return <BlockedScreen ip={userIP} />;

  return (
    <div className="page">

      {/* ══ LEFT PANEL ════════════════════════════════════════════ */}
      <div className="left">
        <div className="l-grid" aria-hidden="true" />
        <div className="orb orb-r" aria-hidden="true" />
        <div className="orb orb-b" aria-hidden="true" />

        <div className="l-top">
          <div className="chip">
            <img src="/images.jpg" alt="LPFA" className="chip-logo" />
          </div>
          <h1 className="headline"><em>LPFA</em> conf</h1>
          <p className="sub-text">
            A private space for LPFA students — confess anonymously,
            connect with classmates, build your story.
          </p>
        </div>

        <div className="l-bot">
          <div className="stat-cards">
            <div className="stat-card">
              <div className="dot dot-r" />
              <div>
                <div className="sc-label">Confessions</div>
                <div className="sc-sub">Post anonymously or as yourself</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="dot dot-b" />
              <div>
                <div className="sc-label">Student profiles</div>
                <div className="sc-sub">Your class, your identity</div>
              </div>
            </div>
          </div>
          <div className="wifi-pill"><WifiIcon size={13} />School network only</div>
        </div>
      </div>

      {/* ══ RIGHT PANEL ═══════════════════════════════════════════ */}
      <div className="right">
        <div className="form-wrap">

          {/* mobile hero */}
          <div className="mobile-hero">
            <div className="mobile-chip">
              <img src="/images.jpg" alt="LPFA" className="chip-logo" />
            </div>
            <h1 className="mobile-headline"><em>LPFA</em> conf</h1>
            <p className="mobile-sub">
              A private space for LPFA students — confess anonymously,
              connect with classmates, build your story.
            </p>
          </div>

          {/* desktop header */}
          <motion.div className="eyebrow" {...up(0.08)}>
            <div className="ey-bar" /><span className="ey-txt">Student registration</span>
          </motion.div>
          <motion.h2 className="form-title" {...up(0.15)}>Create account</motion.h2>
          <motion.p  className="form-sub"   {...up(0.21)}>Join the LPFA student network</motion.p>

          <div className="mobile-form-body">
            <form onSubmit={handleSubmit} noValidate>

              {/* Name row */}
              <motion.div className="f-row" {...up(0.27)}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="firstName">First name</label>
                  <div className="in-wrap">
                    <span className="in-ico"><UserIcon /></span>
                    <input id="firstName" name="firstName" type="text"
                      placeholder="Armen" autoComplete="given-name"
                      value={form.firstName} onChange={handleChange} />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="lastName">Last name</label>
                  <div className="in-wrap">
                    <span className="in-ico"><UserIcon /></span>
                    <input id="lastName" name="lastName" type="text"
                      placeholder="Petrosyan" autoComplete="family-name"
                      value={form.lastName} onChange={handleChange} />
                  </div>
                </div>
              </motion.div>

              {/* Username */}
              <motion.div className="field" {...up(0.33)}>
                <label htmlFor="username">Username</label>
                <div className="in-wrap">
                  <span className="in-ico"><AtIcon /></span>
                  <input id="username" name="username" type="text"
                    placeholder="armen_p" autoComplete="username"
                    value={form.username} onChange={handleChange} />
                </div>
              </motion.div>

              {/* Profession & Grade */}
              <motion.div className="f-row" {...up(0.39)}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="profession">Faculty</label>
                  <div className="in-wrap">
                    <span className="in-ico"><SchoolIcon /></span>
                    <select id="profession" name="profession"
                      value={form.profession} onChange={handleChange}>
                      <option value="">Select…</option>
                      {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="grade">Grade</label>
                  <div className="in-wrap">
                    <span className="in-ico"><SchoolIcon /></span>
                    <select id="grade" name="grade"
                      value={form.grade} onChange={handleChange}>
                      <option value="">Year…</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Password — with eye toggle */}
              <motion.div className="field" {...up(0.45)}>
                <label htmlFor="password">Password</label>
                <div className="in-wrap">
                  <span className="in-ico"><LockIcon /></span>
                  <input
                    id="password" name="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    value={form.password} onChange={handleChange}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPass(p => !p)}
                    tabIndex={-1}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.p className="err-msg"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button className="btn-submit" type="submit" disabled={loading}
                {...up(0.51)} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                {loading ? <Spinner size={18} /> : <>Create account <ArrowIcon /></>}
              </motion.button>

            </form>

            <motion.p className="form-foot" {...up(0.57)}>
              Already have an account? <Link to="/login">Sign in</Link>
            </motion.p>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────── */
const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const AtIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
  </svg>
);
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const SchoolIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const WifiIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/>
  </svg>
);
const WifiOffIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);
const Spinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .8s linear infinite" }} aria-label="Loading">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);