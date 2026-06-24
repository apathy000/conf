import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {useEffect, useState} from "react";

import { useEffect, useState } from "react";

export default function IPGuard({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    async function checkIP() {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();

        const allowedIPs = [
          "5.77.194.211" 
        ];

        setAllowed(allowedIPs.includes(data.ip));
      } catch {
        setAllowed(false);
      }
    }

    checkIP();
  }, []);

  if (allowed === null) {
    return <h1>Checking access...</h1>;
  }

  if (!allowed) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px"
        }}
      >
        Access Denied
      </div>
    );
  }

  return children;
}

const cardVariants = {
  hidden:  { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.55, ease: [0.22,1,0.36,1] } },
};

const fieldVariants = {
  hidden:  { opacity: 0, x: -14 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: 0.1 + i * 0.08, duration: 0.45, ease: [0.22,1,0.36,1] },
  }),
};

const barVariants = {
  hidden:  { width: 0 },
  visible: { width: 40, transition: { delay: 0.5, duration: 0.7, ease: [0.22,1,0.36,1] } },
};

const CLASSES = [
  "10th grade — A", "10th grade — B",
  "11th grade — A", "11th grade — B",
  "12th grade — A", "12th grade — B",
];

export default function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", classGrade: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
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
    // TODO: replace with your Supabase call:
    // const { error } = await supabase.auth.signUp({ email: form.email, password: form.password, ... })
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    navigate("/login");
  };

  return (
    <div className="lpfa-page">
      <motion.div className="lpfa-card" variants={cardVariants} initial="hidden" animate="visible">

        {/* ── Header ── */}
        <div className="lpfa-header">
          <div className="lpfa-logo-row">
            <div className="lpfa-logo-badge">
              <span className="lp">LP</span>
              <span className="fa">FA</span>
              <span className="n">n</span>
              <span className="one">1</span>
            </div>
            <span className="lpfa-school-name">Lycée LPFA</span>
          </div>
          <h1>Create your account</h1>
          <p>Join the LPFA student network</p>
          <motion.div className="lpfa-accent-bar" variants={barVariants} initial="hidden" animate="visible" />
        </div>

        {/* ── Body ── */}
        <div className="lpfa-body">

          {/* Wi-Fi notice */}
          <motion.div className="lpfa-notice" custom={0} variants={fieldVariants} initial="hidden" animate="visible">
            <WifiIcon />
            <span>Available only on the LPFA school network</span>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Name row */}
            <div className="lpfa-row">
              <motion.div className="lpfa-field" style={{marginBottom:0}} custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                <label htmlFor="firstName">First name</label>
                <div className="lpfa-input-wrap">
                  <UserIcon />
                  <input id="firstName" name="firstName" type="text" placeholder="Armen"
                    autoComplete="given-name" value={form.firstName} onChange={handleChange} />
                </div>
              </motion.div>

              <motion.div className="lpfa-field" style={{marginBottom:0}} custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                <label htmlFor="lastName">Last name</label>
                <div className="lpfa-input-wrap">
                  <UserIcon />
                  <input id="lastName" name="lastName" type="text" placeholder="Petrosyan"
                    autoComplete="family-name" value={form.lastName} onChange={handleChange} />
                </div>
              </motion.div>
            </div>

            {/* Email */}
            <motion.div className="lpfa-field" custom={3} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="email">School email</label>
              <div className="lpfa-input-wrap">
                <MailIcon />
                <input id="email" name="email" type="email" placeholder="name@lpfa.am"
                  autoComplete="email" value={form.email} onChange={handleChange} />
              </div>
            </motion.div>

            {/* Class */}
            <motion.div className="lpfa-field" custom={4} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="classGrade">Class / Grade</label>
              <div className="lpfa-input-wrap">
                <SchoolIcon />
                <select id="classGrade" name="classGrade" value={form.classGrade} onChange={handleChange}>
                  <option value="">Select your class...</option>
                  {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </motion.div>

            {/* Password */}
            <motion.div className="lpfa-field" custom={5} variants={FieldVariants} initial="hidden" animate="visible">
              <label htmlFor="password">Password</label>
              <div className="lpfa-input-wrap">
                <LockIcon />
                <input id="password" name="password" type="password" placeholder="Min. 8 characters"
                  autoComplete="new-password" value={form.password} onChange={handleChange} />
              </div>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.p className="lpfa-error" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}>
                {error}
              </motion.p>
            )}

            {/* Button */}
            <motion.button className="lpfa-btn" type="submit" disabled={loading}
              custom={6} variants={fieldVariants} initial="hidden" animate="visible"
              whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              {loading ? <Spinner /> : <> Create account <ArrowIcon /> </>}
            </motion.button>

          </form>

          <motion.p className="lpfa-footer-text" custom={7} variants={fieldVariants} initial="hidden" animate="visible">
            Already have an account? <Link to="/login">Sign in</Link>
          </motion.p>

        </div>
      </motion.div>
    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────── */
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function SchoolIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}
function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-label="Loading"
      style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
