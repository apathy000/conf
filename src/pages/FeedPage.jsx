import "../styles/feed.css";
import Navbar from "../components/feed/Navbar";
import ConfessionCard from "../components/feed/ConfessionCard";
import NewPostModal from "../components/feed/NewPostModal";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function FeedPage() {
  const navigate = useNavigate();
  const [confessions, setConfessions] = useState([]);
  const [loading,     setLoading    ] = useState(true);
  const [mobileModal, setMobileModal] = useState(false);
  const [user,        setUser       ] = useState(null);
  const [profile,     setProfile    ] = useState(null);

  // desktop composer state
  const [content,     setContent    ] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [posting,     setPosting    ] = useState(false);
  const [focused,     setFocused    ] = useState(false);
  const [error,       setError      ] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  useEffect(() => {
    fetchConfessions();
    const channel = supabase
      .channel("confessions")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "confessions" },
        (payload) => setConfessions(prev => [payload.new, ...prev])
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchConfessions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("confessions")
      .select(`*, users ( first_name, last_name, username, class_grade )`)
      .order("created_at", { ascending: false });
    setConfessions(data || []);
    setLoading(false);
  };

  const handleLike = async (confessionId, currentLikes) => {
    setConfessions(prev =>
      prev.map(c => c.id === confessionId ? { ...c, likes_count: c.likes_count + 1 } : c)
    );
    await supabase
      .from("confessions")
      .update({ likes_count: currentLikes + 1 })
      .eq("id", confessionId);
  };

  const handleDelete = async (confessionId) => {
    setConfessions(prev => prev.filter(c => c.id !== confessionId));
    await supabase.from("confessions").delete().eq("id", confessionId);
  };

  const handlePosted = (newPost) => {
    setConfessions(prev => [newPost, ...prev]);
    setMobileModal(false);
    // reset desktop composer
    setContent("");
    setFocused(false);
    setError("");
  };

  // desktop post submit
  const handleDesktopSubmit = async () => {
    if (!content.trim()) { setError("Write something first."); return; }
    if (content.length > 500) { setError("Max 500 characters."); return; }

    setPosting(true);
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
      setPosting(false);
      return;
    }

    handlePosted(data);
    setPosting(false);
  };

  return (
    <div className="feed-page">
      <Navbar profile={profile} />

      <main className="feed-main">

        {/* ══ DESKTOP COMPOSER — type directly here ══════════════ */}
        <div className={`composer ${focused ? "composer-focused" : ""}`}>

          <div className="composer-avatar">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>

          <div className="composer-body">
            <textarea
              ref={textareaRef}
              className="composer-textarea"
              placeholder="What's on your mind?"
              value={content}
              onChange={e => { setContent(e.target.value); setError(""); }}
              onFocus={() => setFocused(true)}
              rows={focused ? 3 : 1}
              maxLength={500}
            />

            {/* expanded actions — only show when focused */}
            {focused && (
              <div className="composer-actions">
                <div className="composer-toggles">
                  <button
                    className={`ctoggle ${isAnonymous ? "active" : ""}`}
                    onClick={() => setIsAnonymous(true)}
                    type="button"
                  >
                    <MaskIcon /> Anonymous
                  </button>
                  <button
                    className={`ctoggle ${!isAnonymous ? "active" : ""}`}
                    onClick={() => setIsAnonymous(false)}
                    type="button"
                  >
                    <UserIcon /> {profile?.first_name} {profile?.last_name}
                  </button>
                </div>

                <div className="composer-right-actions">
                  {content.length > 0 && (
                    <span className={`composer-chars ${content.length > 450 ? "chars-warn" : ""}`}>
                      {content.length}/500
                    </span>
                  )}
                  <button
                    className="composer-cancel"
                    onClick={() => { setFocused(false); setContent(""); setError(""); }}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="composer-submit"
                    onClick={handleDesktopSubmit}
                    disabled={posting || !content.trim()}
                    type="button"
                  >
                    {posting ? <Spinner /> : "Confess"}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="composer-error">{error}</p>}
          </div>

        </div>

        <div className="feed-divider" />

        {/* ── Feed ── */}
        {loading ? (
          <div className="feed-loading">
            <Spinner />
            <span>Loading confessions…</span>
          </div>
        ) : confessions.length === 0 ? (
          <div className="feed-empty">
            <span className="feed-empty-icon">🤫</span>
            <p>No confessions yet. Be the first!</p>
          </div>
        ) : (
          <div className="feed-list">
            {confessions.map(c => (
              <ConfessionCard
                key={c.id}
                confession={c}
                currentUserId={user?.id}
                onLike={handleLike}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── MOBILE floating button ── */}
      <button className="mobile-fab" onClick={() => setMobileModal(true)}>
        <PenIcon />
      </button>

      {/* ── MOBILE bottom sheet ── */}
      {mobileModal && (
        <NewPostModal
          profile={profile}
          onClose={() => setMobileModal(false)}
          onPosted={handlePosted}
        />
      )}
    </div>
  );
}

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
const PenIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}