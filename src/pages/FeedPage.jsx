import "../styles/feed.css";
import Navbar from "../components/feed/Navbar";
import ConfessionCard from "../components/feed/ConfessionCard";
import NewPostModal from "../components/feed/NewPostModal";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function FeedPage() {
  const navigate = useNavigate();
  const [confessions, setConfessions] = useState([]);
  const [loading,     setLoading    ] = useState(true);
  const [modalOpen,   setModalOpen  ] = useState(false);
  const [user,        setUser       ] = useState(null);
  const [profile,     setProfile    ] = useState(null);

  // get current session + profile
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

  // fetch confessions
  useEffect(() => {
    fetchConfessions();

    // realtime — new confession appears instantly without refresh
    const channel = supabase
      .channel("confessions")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "confessions" },
        (payload) => {
          setConfessions(prev => [payload.new, ...prev]);
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
        users ( first_name, last_name, username, class_grade )
      `)
      .order("created_at", { ascending: false });
    setConfessions(data || []);
    setLoading(false);
  };

  const handleLike = async (confessionId, currentLikes) => {
    // optimistic update — update UI instantly
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

  return (
    <div className="feed-page">
      <Navbar profile={profile} />

      <main className="feed-main">

        {/* Write post bar */}
        <div className="post-bar" onClick={() => setModalOpen(true)}>
          <div className="post-bar-avatar">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div className="post-bar-input">
            What's on your mind?
          </div>
          <button className="post-bar-btn">Confess</button>
        </div>

        {/* Feed */}
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

      {/* New post modal */}
      {modalOpen && (
        <NewPostModal
          profile={profile}
          onClose={() => setModalOpen(false)}
          onPosted={(newPost) => {
            setConfessions(prev => [newPost, ...prev]);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}