import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export default function NewPostModal({ profile, onClose, onPosted }) {
  const [content,     setContent    ] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading,     setLoading    ] = useState(false);
  const [error,       setError      ] = useState("");

  const maxChars = 500;

  const handleSubmit = async () => {
    if (!content.trim()) { setError("Write something first."); return; }
    if (content.length > maxChars) { setError("Too long — max 500 characters."); return; }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    const { data, error: insertError } = await supabase
      .from("confessions")
      .insert({
        author_id:    session.user.id,
        content:      content.trim(),
        is_anonymous: isAnonymous,
        likes_count:  0,
      })
      .select(`*, users ( first_name, last_name, username, class_grade )`)
      .single();

    if (insertError) {
      setError("Failed to post. Try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onPosted(data);
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal — inline style handles centering, framer only does scale+opacity */}
      <motion.div
        className="modal"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">New confession</h2>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Anonymous toggle */}
        <div className="modal-toggle-wrap">
          <button
            className={`toggle-option ${isAnonymous ? "active" : ""}`}
            onClick={() => setIsAnonymous(true)}
          >
            <MaskIcon /> Anonymous
          </button>
          <button
            className={`toggle-option ${!isAnonymous ? "active" : ""}`}
            onClick={() => setIsAnonymous(false)}
          >
            <UserIcon /> {profile ? `${profile.first_name} ${profile.last_name}` : "My name"}
          </button>
        </div>

        {/* Hint */}
        <p className="modal-hint">
          {isAnonymous
            ? "🤫 Your name will be completely hidden"
            : `👤 Will post as ${profile?.first_name} ${profile?.last_name}`}
        </p>

        {/* Textarea */}
        <textarea
          className="modal-textarea"
          placeholder="Write your confession… (English or Armenian)"
          value={content}
          onChange={e => { setContent(e.target.value); setError(""); }}
          maxLength={maxChars}
          autoFocus
        />

        {/* Char count */}
        <div className="modal-chars">
          <span className={content.length > maxChars * 0.9 ? "chars-warn" : ""}>
            {content.length}/{maxChars}
          </span>
        </div>

        {/* Error */}
        {error && <p className="modal-error">{error}</p>}

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button
            className="modal-submit"
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
          >
            {loading ? <Spinner /> : "Post confession"}
          </button>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}

/* ── Icons ────────────────────────────────────────────────────────── */
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const MaskIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);
const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .8s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);