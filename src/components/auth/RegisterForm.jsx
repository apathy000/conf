import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────
//  🔒  YOUR SCHOOL WI-FI IP
//  How to find it: connect to school Wi-Fi → open the site
//  → press F12 → Console tab → look for "Your public IP: ..."
// ─────────────────────────────────────────────────────────────────────
const ALLOWED_IPS = [
  "5.77.194.211",
];
// ─────────────────────────────────────────────────────────────────────

const CLASSES = [
  "10th grade — A", "10th grade — B",
  "11th grade — A", "11th grade — B",
  "12th grade — A", "12th grade — B",
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
        <div className="screen-icon blue">
          <WifiIcon size={26} />
        </div>
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
        <div className="screen-icon red">
          <ShieldIcon />
        </div>
        <h2 className="screen-title">Access Restricted</h2>
        <p className="screen-sub">
          This platform is only available to students on the{" "}
          <strong style={{ color: "rgba(255,255,255,.7)" }}>LPFA school Wi-Fi</strong>.
          Connect to the school network and refresh.
        </p>
        <div className="screen-pill">
          <WifiOffIcon />
          Not on school network
        </div>
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

  const [ipStatus, setIpStatus] = useState("checking");
  const [userIP,   setUserIP  ] = useState("");
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", classGrade:"", password:"" });
  const [loading,  setLoading ] = useState(false);
  const [error,    setError   ] = useState("");

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
    if (!form.firstName || !form.lastName || !form.email || !form.classGrade || !form.password) {
      setError("Please fill in all fields."); return;
    }
    if (!form.email.endsWith("@lpfa.am")) {
      setError("Only @lpfa.am school emails are allowed."); return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters."); return;
    }
    setLoading(true);
    // TODO: replace with Supabase:
    // const { error } = await supabase.auth.signUp({
    //   email: form.email, password: form.password,
    //   options: { data: { firstName: form.firstName, lastName: form.lastName, classGrade: form.classGrade } }
    // })
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    navigate("/login");
  };

  if (ipStatus === "checking") return <LoadingScreen />;
  if (ipStatus === "blocked")  return <BlockedScreen ip={userIP} />;

  return (
    <div className="page">

      {/* ══ LEFT PANEL ═══════════════════════════════════════════ */}
      <div className="left">
        <div className="l-grid" aria-hidden="true" />
        <div className="orb orb-r" aria-hidden="true" />
        <div className="orb orb-b" aria-hidden="true" />

        <div className="l-top">
          <div className="chip">
            <span className="c-lp">LP</span>
            <span className="c-fa">FA</span>
            <span className="c-n">n</span>
            <span className="c-1">1</span>
          </div>
          <h1 className="headline">
            Your school,<br /><em>your space.</em>
          </h1>
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
          <div className="wifi-pill">
            <WifiIcon size={13} />
            School network only
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══════════════════════════════════════════ */}
      <div className="right">
        <div className="form-wrap">

          <motion.div className="eyebrow" {...up(0.08)}>
            <div className="ey-bar" />
            <span className="ey-txt">Student registration</span>
          </motion.div>

          <motion.h2 className="form-title" {...up(0.15)}>Create account</motion.h2>
          <motion.p  className="form-sub"   {...up(0.21)}>Join the LPFA student network</motion.p>

          <form onSubmit={handleSubmit} noValidate>

            <motion.div className="f-row" {...up(0.27)}>
              <div className="field" style={{ marginBottom:0 }}>
                <label htmlFor="firstName">First name</label>
                <div className="in-wrap">
                  <span className="in-ico"><UserIcon /></span>
                  <input id="firstName" name="firstName" type="text"
                    placeholder="Armen" autoComplete="given-name"
                    value={form.firstName} onChange={handleChange} />
                </div>
              </div>
              <div className="field" style={{ marginBottom:0 }}>
                <label htmlFor="lastName">Last name</label>
                <div className="in-wrap">
                  <span className="in-ico"><UserIcon /></span>
                  <input id="lastName" name="lastName" type="text"
                    placeholder="Petrosyan" autoComplete="family-name"
                    value={form.lastName} onChange={handleChange} />
                </div>
              </div>
            </motion.div>

            <motion.div className="field" {...up(0.33)}>
              <label htmlFor="email">School email</label>
              <div className="in-wrap">
                <span className="in-ico"><MailIcon /></span>
                <input id="email" name="email" type="email"
                  placeholder="name@lpfa.am" autoComplete="email"
                  value={form.email} onChange={handleChange} />
              </div>
            </motion.div>

            <motion.div className="field" {...up(0.39)}>
              <label htmlFor="classGrade">Class / Grade</label>
              <div className="in-wrap">
                <span className="in-ico"><SchoolIcon /></span>
                <select id="classGrade" name="classGrade"
                  value={form.classGrade} onChange={handleChange}>
                  <option value="">Select your class…</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </motion.div>

            <motion.div className="field" {...up(0.45)}>
              <label htmlFor="password">Password</label>
              <div className="in-wrap">
                <span className="in-ico"><LockIcon /></span>
                <input id="password" name="password" type="password"
                  placeholder="Min. 8 characters" autoComplete="new-password"
                  value={form.password} onChange={handleChange} />
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.p className="err-msg"
                  initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button className="btn-submit" type="submit" disabled={loading}
              {...up(0.51)}
              whileHover={{ y:-2, scale:1.01 }}
              whileTap={{ scale:0.98 }}>
              {loading ? <Spinner size={18} /> : <>Create account <ArrowIcon /></>}
            </motion.button>

          </form>

          <motion.p className="form-foot" {...up(0.57)}>
            Already have an account? <Link to="/login">Sign in</Link>
          </motion.p>

        </div>
      </div>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────── */
const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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