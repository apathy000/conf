import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const ALLOWED_IPS = ["5.77.194.211",
    
];

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

export default function LoginForm() {
  const navigate = useNavigate();

  const [ipStatus, setIpStatus] = useState("checking");
  const [userIP,   setUserIP  ] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });
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
    if (!form.username || !form.password) {
      setError("Please fill in all fields."); return;
    }
    setLoading(true);

    const fakeEmail = `${form.username.toLowerCase().trim()}@lpfaconf.internal`;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    fakeEmail,
      password: form.password,
    });

    if (signInError) {
      setError("Wrong username or password.");
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate("/feed");
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
            Your confessions, your classmates, your stories — all waiting for you.
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
              Your confessions, your classmates, your stories — all waiting for you.
            </p>
          </div>

          {/* desktop header */}
          <motion.div className="eyebrow" {...up(0.08)}>
            <div className="ey-bar" /><span className="ey-txt">Student login</span>
          </motion.div>
          <motion.h2 className="form-title" {...up(0.15)}>Sign in</motion.h2>
          <motion.p  className="form-sub"   {...up(0.21)}>Good to see you again</motion.p>

          <div className="mobile-form-body">
            <form onSubmit={handleSubmit} noValidate>

              {/* Username */}
              <motion.div className="field" {...up(0.27)}>
                <label htmlFor="username">Username</label>
                <div className="in-wrap">
                  <span className="in-ico"><AtIcon /></span>
                  <input id="username" name="username" type="text"
                    placeholder="armen_p" autoComplete="username"
                    value={form.username} onChange={handleChange} />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div className="field" {...up(0.33)}>
                <label htmlFor="password">Password</label>
                <div className="in-wrap">
                  <span className="in-ico"><LockIcon /></span>
                  <input id="password" name="password" type="password"
                    placeholder="Your password" autoComplete="current-password"
                    value={form.password} onChange={handleChange} />
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
                {...up(0.39)} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                {loading ? <Spinner size={18} /> : <>Sign in <ArrowIcon /></>}
              </motion.button>

            </form>

            <motion.p className="form-foot" {...up(0.45)}>
              Don't have an account? <Link to="/register">Register</Link>
            </motion.p>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────── */
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