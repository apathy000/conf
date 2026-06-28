import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export default function ConfessionCard({ confession, currentUserId, onLike, onDelete }) {
  const [liked,           setLiked          ] = useState(false);
  const [showComments,    setShowComments   ] = useState(false);
  const [comments,        setComments       ] = useState([]);
  const [commentsLoaded,  setCommentsLoaded ] = useState(false);
  const [commentText,     setCommentText    ] = useState("");
  const [commentAnon,     setCommentAnon    ] = useState(false);
  const [postingComment,  setPostingComment ] = useState(false);
  const [likesCount,      setLikesCount     ] = useState(confession.likes_count);

  const isOwner = confession.author_id === currentUserId;

  const authorName = confession.is_anonymous
    ? "Anonymous"
    : confession.users
      ? `${confession.users.first_name} ${confession.users.last_name}`
      : "Unknown";

  const authorClass = !confession.is_anonymous && confession.users?.class_grade;

  const initials = confession.is_anonymous
    ? "?"
    : `${confession.users?.first_name?.[0] || ""}${confession.users?.last_name?.[0] || ""}`;

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  };


  const handleLike = async () => {
    if (liked) {

      setLiked(false);
      setLikesCount(c => c - 1);
      await supabase
        .from("confessions")
        .update({ likes_count: likesCount - 1 })
        .eq("id", confession.id);
    } else {

      setLiked(true);
      setLikesCount(c => c + 1);
      await supabase
        .from("confessions")
        .update({ likes_count: likesCount + 1 })
        .eq("id", confession.id);
    }
  };


  const loadComments = async () => {
    if (commentsLoaded) return;
    const { data } = await supabase
      .from("comments")
      .select(`*, users ( first_name, last_name, class_grade )`)
      .eq("confession_id", confession.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setCommentsLoaded(true);
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(s => !s);
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);

    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from("comments")
      .insert({
        confession_id: confession.id,
        author_id:     session.user.id,
        content:       commentText.trim(),
        is_anonymous:  commentAnon,
      })
      .select(`*, users ( first_name, last_name, class_grade )`)
      .single();

    if (!error) {
      setComments(prev => [...prev, data]);
      setCommentText("");
    }
    setPostingComment(false);
  };

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {}
      <div className="card-header">
        <div className={`card-avatar ${confession.is_anonymous ? "anon" : ""}`}>
          {initials}
        </div>
        <div className="card-meta">
          <div className="card-author">
            {authorName}
            {confession.is_anonymous && <span className="anon-badge">anonymous</span>}
          </div>
          {authorClass && <div className="card-class">{authorClass}</div>}
          <div className="card-time">{timeAgo(confession.created_at)}</div>
        </div>
        {isOwner && (
          <button className="card-delete" onClick={() => onDelete(confession.id)}>
            <TrashIcon />
          </button>
        )}
      </div>

      {}
      <p className="card-content">{confession.content}</p>

      {}
      {confession.image_url && (
        <img
          src={confession.image_url}
          alt="confession"
          className="card-image"
        />
      )}

      {}
      <div className="card-actions">
        <button
          className={`card-action-btn like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
        >
          <HeartIcon filled={liked} />
          <span>{likesCount}</span>
        </button>

        <button
          className={`card-action-btn ${showComments ? "active" : ""}`}
          onClick={toggleComments}
        >
          <CommentIcon />
          <span>{comments.length > 0 ? comments.length : "Comment"}</span>
        </button>
      </div>

      {}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="comments-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {}
            {comments.length === 0 ? (
              <p className="comments-empty">No comments yet. Be first!</p>
            ) : (
              <div className="comments-list">
                {comments.map(c => (
                  <div key={c.id} className="comment">
                    <div className="comment-avatar">
                      {c.is_anonymous ? "?" : `${c.users?.first_name?.[0] || ""}${c.users?.last_name?.[0] || ""}`}
                    </div>
                    <div className="comment-body">
                      <div className="comment-author">
                        {c.is_anonymous ? "Anonymous" : `${c.users?.first_name} ${c.users?.last_name}`}
                        <span className="comment-time">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="comment-text">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {}
            <div className="comment-input-wrap">
              <div className="comment-input-row">
                <input
                  className="comment-input"
                  type="text"
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePostComment()}
                  maxLength={300}
                />
                <button
                  className="comment-submit"
                  onClick={handlePostComment}
                  disabled={postingComment || !commentText.trim()}
                >
                  {postingComment ? <Spinner /> : <SendIcon />}
                </button>
              </div>
              {}
              <button
                className={`comment-anon-toggle ${commentAnon ? "active" : ""}`}
                onClick={() => setCommentAnon(a => !a)}
                type="button"
              >
                {commentAnon ? "🤫 Anonymous" : "👤 As myself"}
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .8s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);