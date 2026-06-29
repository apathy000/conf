import "../styles/feed.css";
import Navbar from "../components/feed/Navbar";
import ConfessionCard from "../components/feed/ConfessionCard";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function FeedPage() {
  const navigate = useNavigate();
  const [confessions, setConfessions] = useState([]);
  const [loading,     setLoading    ] = useState(true);
  const [user,        setUser       ] = useState(null);
  const [profile,     setProfile    ] = useState(null);
  const [activeTab,   setActiveTab  ] = useState("confessions");

  // desktop composer
  const [content,     setContent    ] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [posting,     setPosting    ] = useState(false);
  const [focused,     setFocused    ] = useState(false);
  const [error,       setError      ] = useState("");
  const [image,       setImage      ] = useState(null);
  const [imagePreview,setImagePreview] = useState(null);

  // mobile write panel
  const [writeOpen,   setWriteOpen  ] = useState(false);
  const [wpContent,   setWpContent  ] = useState("");
  const [wpAnon,      setWpAnon     ] = useState(true);
  const [wpPosting,   setWpPosting  ] = useState(false);
  const [wpError,     setWpError    ] = useState("");
  const [wpImage,     setWpImage    ] = useState(null);
  const [wpImagePreview,setWpImagePreview] = useState(null);

  const fileRef   = useRef(null);
  const wpFileRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      supabase
        .from("users").select("*").eq("id", session.user.id).single()
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
      ).subscribe();
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
    await supabase.from("confessions").update({ likes_count: currentLikes + 1 }).eq("id", confessionId);
  };

  const handleDelete = async (confessionId) => {
    setConfessions(prev => prev.filter(c => c.id !== confessionId));
    await supabase.from("confessions").delete().eq("id", confessionId);
  };

  // upload image helper
  const uploadImage = async (file, session) => {
    const ext  = file.name.split(".").pop();
    const path = `confessions/${session.user.id}_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("confession-images").upload(path, file);
    if (uploadError) return null;
    const { data } = supabase.storage.from("confession-images").getPublicUrl(path);
    return data.publicUrl;
  };

  // desktop submit
  const handleDesktopSubmit = async () => {
    if (!content.trim() && !image) { setError("Write something or add a photo."); return; }
    if (content.length > 500) { setError("Max 500 characters."); return; }
    setPosting(true);
    const { data: { session } } = await supabase.auth.getSession();
    let image_url = null;
    if (image) { image_url = await uploadImage(image, session); }
    const { data, error: insertError } = await supabase
      .from("confessions")
      .insert({ author_id: session.user.id, content: content.trim(), is_anonymous: isAnonymous, likes_count: 0, image_url })
      .select(`*, users ( first_name, last_name, username, class_grade )`).single();
    if (insertError) { setError("Failed to post."); setPosting(false); return; }
    setConfessions(prev => [data, ...prev]);
    setContent(""); setFocused(false); setError(""); setImage(null); setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setPosting(false);
  };

  // mobile submit
  const handleMobileSubmit = async () => {
    if (!wpContent.trim() && !wpImage) { setWpError("Write something or add a photo."); return; }
    setWpPosting(true);
    const { data: { session } } = await supabase.auth.getSession();
    let image_url = null;
    if (wpImage) { image_url = await uploadImage(wpImage, session); }
    const { data, error: insertError } = await supabase
      .from("confessions")
      .insert({ author_id: session.user.id, content: wpContent.trim(), is_anonymous: wpAnon, likes_count: 0, image_url })
      .select(`*, users ( first_name, last_name, username, class_grade )`).single();
    if (insertError) { setWpError("Failed to post."); setWpPosting(false); return; }
    setConfessions(prev => [data, ...prev]);
    setWpContent(""); setWpAnon(true); setWpError(""); setWpImage(null); setWpImagePreview(null);
    if (wpFileRef.current) wpFileRef.current.value = "";
    setWpPosting(false);
    setWriteOpen(false);
  };

  const handleImagePick = (e, isMobile) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      isMobile ? setWpError("Max 5MB.") : setError("Max 5MB."); return;
    }
    const url = URL.createObjectURL(file);
    if (isMobile) { setWpImage(file); setWpImagePreview(url); }
    else          { setImage(file);   setImagePreview(url);   setFocused(true); }
  };

  const initials = profile ? `${profile.first_name?.[0]}${profile.last_name?.[0]}` : "";

  return (
    <div className="feed-page">

      {/* ── DESKTOP navbar ── */}
      <Navbar profile={profile} />

      {/* ── MOBILE topbar ── */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <span className="brand-lp">LP</span>
          <span className="brand-fa">FA</span>
          <span className="brand-conf">conf</span>
        </div>
        {profile && (
          <div className="mobile-topbar-right">
            <div>
              <div className="mobile-topbar-name">{profile.first_name} {profile.last_name}</div>
              <div className="mobile-topbar-class">{profile.class_grade}</div>
            </div>
            <div className="mobile-topbar-avatar">{initials}</div>
          </div>
        )}
      </div>

      <main className="feed-main">

        {/* ── DESKTOP composer ── */}
        <div className={`composer ${focused ? "composer-focused" : ""}`}>
          <div className="composer-avatar">{initials}</div>
          <div className="composer-body">
            <textarea
              className="composer-textarea"
              placeholder="What's on your mind?"
              value={content}
              onChange={e => { setContent(e.target.value); setError(""); }}
              onFocus={() => setFocused(true)}
              rows={focused ? 3 : 1}
              maxLength={500}
            />
            {imagePreview && (
              <div className="composer-image-preview">
                <img src={imagePreview} alt="preview" />
                <button className="composer-image-remove" onClick={() => { setImage(null); setImagePreview(null); }} type="button">
                  <CloseIcon />
                </button>
              </div>
            )}
            {(focused || imagePreview) && (
              <div className="composer-actions">
                <div className="composer-toggles">
                  <button className={`ctoggle ${isAnonymous ? "active" : ""}`} onClick={() => setIsAnonymous(true)} type="button">
                    <MaskIcon /> Anonymous
                  </button>
                  <button className={`ctoggle ${!isAnonymous ? "active" : ""}`} onClick={() => setIsAnonymous(false)} type="button">
                    <UserIcon /> {profile?.first_name}
                  </button>
                  <button className="ctoggle" onClick={() => fileRef.current?.click()} type="button">
                    <PhotoIcon /> Photo
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleImagePick(e, false)} />
                </div>
                <div className="composer-right-actions">
                  {content.length > 0 && (
                    <span className={`composer-chars ${content.length > 450 ? "chars-warn" : ""}`}>
                      {content.length}/500
                    </span>
                  )}
                  <button className="composer-cancel" onClick={() => { setFocused(false); setContent(""); setError(""); setImage(null); setImagePreview(null); }} type="button">Cancel</button>
                  <button className="composer-submit" onClick={handleDesktopSubmit} disabled={posting || (!content.trim() && !image)} type="button">
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
          <div className="feed-loading"><Spinner /><span>Loading…</span></div>
        ) : confessions.length === 0 ? (
          <div className="feed-empty">
            <span className="feed-empty-icon">🤫</span>
            <p>No confessions yet. Be the first!</p>
          </div>
        ) : (
          <div className="feed-list">
            {confessions.map(c => (
              <ConfessionCard
                key={c.id} confession={c}
                currentUserId={user?.id}
                onLike={handleLike} onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════
          MOBILE ONLY ELEMENTS
      ══════════════════════════════════════ */}

      {/* + FAB */}
      <button className="mobile-fab" onClick={() => setWriteOpen(true)}>+</button>

      {/* iOS26 glass bottom nav */}
      <nav className="mobile-nav">
        <button
          className={`mobile-nav-btn ${activeTab === "confessions" ? "active" : ""}`}
          onClick={() => setActiveTab("confessions")}
        >
          <ConfIcon />
          Confessions
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <ChatIcon />
          Chat
        </button>
      </nav>

      {/* Write panel */}
      {writeOpen && (
        <>
          <div className="write-panel-backdrop" onClick={() => setWriteOpen(false)} />
          <div className="write-panel">
            <div className="write-panel-header">
              <span className="write-panel-title">New confession</span>
              <button className="write-panel-close" onClick={() => setWriteOpen(false)}>
                <CloseIcon />
              </button>
            </div>

            <div className="write-panel-who">
              <div className="write-panel-avatar">{wpAnon ? "?" : initials}</div>
              <div>
                <div className="write-panel-name">{wpAnon ? "Anonymous" : `${profile?.first_name} ${profile?.last_name}`}</div>
                <div className="write-panel-sub">{wpAnon ? "Your identity is hidden" : profile?.class_grade}</div>
              </div>
            </div>

            <textarea
              className="write-panel-textarea"
              placeholder="Write your confession…"
              value={wpContent}
              onChange={e => { setWpContent(e.target.value); setWpError(""); }}
              maxLength={500}
              autoFocus
            />

            {wpImagePreview && (
              <div className="write-panel-image-preview">
                <img src={wpImagePreview} alt="preview" />
                <button className="write-panel-image-remove" onClick={() => { setWpImage(null); setWpImagePreview(null); }}>
                  <CloseIcon />
                </button>
              </div>
            )}

            {wpError && <p className="write-panel-error">{wpError}</p>}

            <div className="write-panel-footer">
              <div className="write-panel-left">
                <button className={`wp-toggle ${wpAnon ? "active" : ""}`} onClick={() => setWpAnon(true)} type="button">
                  <MaskIcon /> Anon
                </button>
                <button className={`wp-toggle ${!wpAnon ? "active" : ""}`} onClick={() => setWpAnon(false)} type="button">
                  <UserIcon /> Named
                </button>
                <button className="wp-photo-btn" onClick={() => wpFileRef.current?.click()} type="button">
                  <PhotoIcon />
                </button>
                <input ref={wpFileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleImagePick(e, true)} />
              </div>
              <div className="write-panel-right">
                <span className={`wp-chars ${wpContent.length > 450 ? "chars-warn" : ""}`}>
                  {wpContent.length}/500
                </span>
                <button className="wp-submit" onClick={handleMobileSubmit} disabled={wpPosting || (!wpContent.trim() && !wpImage)}>
                  {wpPosting ? <Spinner /> : "Post"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────── */
const MaskIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);
const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const PhotoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ConfIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);
function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:"spin .8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
