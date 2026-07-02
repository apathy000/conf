import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export default function ConfessionCard({ confession, currentUserId, onLike, onDelete }) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentAnon, setCommentAnon] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [likesCount, setLikesCount] = useState(confession.likes_count || 0);

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
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  };

  const handleLike = async () => {
    if (liked) {
      setLiked(false);
      setLikesCount(c => c - 1);
    } else {
      setLiked(true);
      setLikesCount(c => c + 1);
    }
    // Optional: update in database
    if (onLike) onLike(confession.id, likesCount);
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
        author_id: session.user.id,
        content: commentText.trim(),
        is_anonymous: commentAnon,
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
      {/* Header */}
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
          <button className="card-delete" onClick={() => onDelete?.(confession.id)}>
            Delete
          </button>
        )}
      </div>

      {/* Content Text */}
      {confession.content && confession.content.trim() !== "" && (
        <p className="card-content">{confession.content}</p>
      )}

      {/* IMAGE - FIXED */}
      {confession.image_url && (
        <div className="card-image-container">
          <img
            src={confession.image_url}
            alt="confession attachment"
            className="card-image"
            loading="lazy"
            onError={(e) => {
              console.warn("Failed to load image:", confession.image_url);
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="card-actions">
        <button
          className={`card-action-btn like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
        >
          ❤️ <span>{likesCount}</span>
        </button>

        <button
          className={`card-action-btn ${showComments ? "active" : ""}`}
          onClick={toggleComments}
        >
          💬 <span>{comments.length}</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="comments-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28 }}
          >
            {/* Comments list + input here (you can keep your existing comment logic) */}
            {/* ... your comment UI ... */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}