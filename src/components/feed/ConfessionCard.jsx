import { useState } from "react";
import { motion } from "framer-motion";

export default function ConfessionCard({ confession, currentUserId, onLike, onDelete }) {
  const [liked, setLiked] = useState(false);

  const isOwner = confession.author_id === currentUserId;

  const authorName = confession.is_anonymous
    ? "Anonymous"
    : confession.users
      ? `${confession.users.first_name} ${confession.users.last_name}`
      : "Unknown";

  const authorClass = confession.is_anonymous
    ? null
    : confession.users?.class_grade;

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

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    onLike(confession.id, confession.likes_count);
  };

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Card header */}
      <div className="card-header">
        <div className={`card-avatar ${confession.is_anonymous ? "anon" : ""}`}>
          {initials}
        </div>
        <div className="card-meta">
          <div className="card-author">
            {authorName}
            {confession.is_anonymous && (
              <span className="anon-badge">anonymous</span>
            )}
          </div>
          {authorClass && <div className="card-class">{authorClass}</div>}
          <div className="card-time">{timeAgo(confession.created_at)}</div>
        </div>
        {isOwner && (
          <button className="card-delete" onClick={() => onDelete(confession.id)} title="Delete">
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="card-content">{confession.content}</p>

      {/* Actions */}
      <div className="card-actions">
        <button
          className={`card-action-btn like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
        >
          <HeartIcon filled={liked} />
          <span>{confession.likes_count + (liked ? 1 : 0)}</span>
        </button>

        <button className="card-action-btn">
          <CommentIcon />
          <span>Comment</span>
        </button>
      </div>
    </motion.div>
  );
}

const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);