import "../styles/feed.css";
import Navbar from "../components/feed/Navbar";
import ConfessionCard from "../components/feed/ConfessionCard";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function FeedPage() {
  const navigate = useNavigate();
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // desktop composer
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [posting, setPosting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // mobile write panel
  const [writeOpen, setWriteOpen] = useState(false);
  const [wpContent, setWpContent] = useState("");
  const [wpAnon, setWpAnon] = useState(true);
  const [wpPosting, setWpPosting] = useState(false);
  const [wpError, setWpError] = useState("");
  const [wpImage, setWpImage] = useState(null);
  const [wpImagePreview, setWpImagePreview] = useState(null);

  const fileRef = useRef(null);
  const wpFileRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => setProfile(data));
    });
  }, [navigate]);

  useEffect(() => {
    fetchConfessions();
    const channel = supabase
      .channel("confessions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "confessions" },
        (payload) => {
          setConfessions((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchConfessions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("confessions")
      .select(`
        *,
        users (first_name, last_name, username, class_grade),
        image_url
      `)
      .order("created_at", { ascending: false });
    setConfessions(data || []);
    setLoading(false);
  };

  const uploadImage = async (file, session) => {
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const path = `confessions/${session.user.id}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("confession-images")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("confession-images")
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (e) {
      console.error("Image upload failed", e);
      return null;
    }
  };

  const handleDesktopSubmit = async () => {
    if (!content.trim() && !image) {
      setError("Write something or add a photo.");
      return;
    }
    if (content.length > 500) {
      setError("Max 500 characters.");
      return;
    }

    setPosting(true);
    const { data: { session } } = await supabase.auth.getSession();
    let image_url = null;
    if (image) image_url = await uploadImage(image, session);

    const { data, error: insertError } = await supabase
      .from("confessions")
      .insert({
        author_id: session.user.id,
        content: content.trim(),
        is_anonymous: isAnonymous,
        likes_count: 0,
        image_url,
      })
      .select(`
        *,
        users (first_name, last_name, username, class_grade)
      `)
      .single();

    if (insertError) {
      setError("Failed to post.");
    } else {
      setConfessions((prev) => [data, ...prev]);
    }

    // reset
    setContent("");
    setFocused(false);
    setError("");
    setImage(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setPosting(false);
  };

  const handleMobileSubmit = async () => {
    if (!wpContent.trim() && !wpImage) {
      setWpError("Write something or add a photo.");
      return;
    }

    setWpPosting(true);
    const { data: { session } } = await supabase.auth.getSession();
    let image_url = null;
    if (wpImage) image_url = await uploadImage(wpImage, session);

    const { data, error: insertError } = await supabase
      .from("confessions")
      .insert({
        author_id: session.user.id,
        content: wpContent.trim(),
        is_anonymous: wpAnon,
        likes_count: 0,
        image_url,
      })
      .select(`
        *,
        users (first_name, last_name, username, class_grade)
      `)
      .single();

    if (!insertError) {
      setConfessions((prev) => [data, ...prev]);
      setWpContent("");
      setWpAnon(true);
      setWpError("");
      setWpImage(null);
      setWpImagePreview(null);
      if (wpFileRef.current) wpFileRef.current.value = "";
      setWriteOpen(false);
    } else {
      setWpError("Failed to post.");
    }
    setWpPosting(false);
  };

  const handleImagePick = (e, isMobile) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      (isMobile ? setWpError : setError)("Max 5MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    if (isMobile) {
      setWpImage(file);
      setWpImagePreview(url);
    } else {
      setImage(file);
      setImagePreview(url);
      setFocused(true);
    }
  };

  const initials = profile ? `${profile.first_name?.[0]}${profile.last_name?.[0]}` : "";

  return (
    <div className="feed-page">
      <Navbar profile={profile} />

      {/* Mobile topbar */}
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
        {/* Desktop composer */}
        <div className={`composer ${focused ? "composer-focused" : ""}`}>
          <div className="composer-avatar">{initials}</div>
          <div className="composer-body">
            <textarea
              className="composer-textarea"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => { setContent(e.target.value); setError(""); }}
              onFocus={() => setFocused(true)}
              rows={focused ? 3 : 1}
              maxLength={500}
            />
            {imagePreview && (
              <div className="composer-image-preview">
                <img src={imagePreview} alt="preview" />
                <button className="composer-image-remove" onClick={() => { setImage(null); setImagePreview(null); }}>
                  ✕
                </button>
              </div>
            )}
            {(focused || imagePreview) && (
              <div className="composer-actions">
                <div className="composer-toggles">
                  <button className={`ctoggle ${isAnonymous ? "active" : ""}`} onClick={() => setIsAnonymous(true)}>
                    Anon
                  </button>
                  <button className={`ctoggle ${!isAnonymous ? "active" : ""}`} onClick={() => setIsAnonymous(false)}>
                    Named
                  </button>
                  <button className="ctoggle" onClick={() => fileRef.current?.click()}>
                    Photo
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImagePick(e, false)} />
                </div>
                <div className="composer-right-actions">
                  <button className="composer-cancel" onClick={() => { setFocused(false); setContent(""); setError(""); setImage(null); setImagePreview(null); }}>
                    Cancel
                  </button>
                  <button className="composer-submit" onClick={handleDesktopSubmit} disabled={posting || (!content.trim() && !image)}>
                    {posting ? "..." : "Confess"}
                  </button>
                </div>
              </div>
            )}
            {error && <p className="composer-error">{error}</p>}
          </div>
        </div>

        <div className="feed-divider" />

        {loading ? (
          <div className="feed-loading">Loading…</div>
        ) : confessions.length === 0 ? (
          <div className="feed-empty">No confessions yet. Be the first!</div>
        ) : (
          <div className="feed-list">
            {confessions.map((c) => (
              <ConfessionCard
                key={c.id}
                confession={c}
                currentUserId={user?.id}
                onLike={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </main>

      {/* Mobile FAB + Write Panel */}
      <button className="mobile-fab" onClick={() => setWriteOpen(true)}>+</button>

      {writeOpen && (
        <div className="write-panel">
          {/* ... your existing mobile panel code ... */}
          {/* (keep your mobile panel, just make sure it calls handleMobileSubmit) */}
        </div>
      )}
    </div>
  );
}