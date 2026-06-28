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
        className="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Desktop — centered modal */}
      <motion.div
        className="sheet-desktop"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{ opacity: 0, scale: 0.97,    y: 10 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <SheetContent
          profile={profile}
          content={content} setContent={setContent}
          isAnonymous={isAnonymous} setIsAnonymous={setIsAnonymous}
          loading={loading} error={error} setError={setError}
          maxChars={maxChars}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      </motion.div>

      {/* Mobile — slides up from bottom */}
      <motion.div
        className="sheet-mobile"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <SheetContent
          profile={profile}
          content={content} setContent={setContent}
          isAnonymous={isAnonymous} setIsAnonymous={setIsAnonymous}
          loading={loading} error={error} setError={setError}
          maxChars={maxChars}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      </motion.div>

    </AnimatePresence>
  );
}

/* shared content between desktop modal and mobile sheet */
function SheetContent({ profile, content, setContent, isAnonymous, setIsAnonymous, loading, error, setError, maxChars, onClose, onSubmit }) {
  return (
    <>
      {/* drag handle — mobile only */}
      <div className="sheet-handle" />

      {/* Header */}
      <div className="sheet-header">
        <div className="sheet-who">
          <div className="sheet-avatar">
            {isAnonymous ? "?" : `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`}
          </div>
          <div>
            <div className="sheet-name">
              {isAnonymous ? "Anonymous" : `${profile?.first_name} ${profile?.last_name}`}
            </div>
            <div className="sheet-sub">
              {isAnonymous ? "Your identity is hidden" : profile?.class_grade}
            </div>
          </div>
        </div>
        <button className="sheet-close" onClick={onClose}><CloseIcon /></button>
      </div>

      {/* Textarea */}
      <textarea
        className="sheet-textarea"
        placeholder="Write your confession… (English or Armenian)"
        value={content}
        onChange={e => { setContent(e.target.value); setError(""); }}
        maxLength={maxChars}
        autoFocus
      />

      {/* Error */}
      {error && <p className="sheet-error">{error}</p>}

      {/* Footer */}
      <div className="sheet-footer">
        {/* toggle */}
        <div className="sheet-toggle">
          <button
            className={`stoggle-btn ${isAnonymous ? "active" : ""}`}
            onClick={() => setIsAnonymous(true)}
          >
            <MaskIcon /> Anon
          </button>
          <button
            className={`stoggle-btn ${!isAnonymous ? "active" : ""}`}
            onClick={() => setIsAnonymous(false)}
          >
            <UserIcon /> Named
          </button>
        </div>

        {/* char count + submit */}
        <div className="sheet-footer-right">
          <span className={`sheet-chars ${content.length > maxChars * 0.9 ? "chars-warn" : ""}`}>
            {content.length}/{maxChars}
          </span>
          <button
            className="sheet-submit"
            onClick={onSubmit}
            disabled={loading || !content.trim()}
          >
            {loading ? <Spinner /> : "Post"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Icons ────────────────────────────────────────────────────────── */
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const MaskIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);
const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .8s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);