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
  const [commentError, setCommentError] = useState("");
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
      setLikesCount((c) => Math.max(0, c - 1));
    } else {
      setLiked(true);
      setLikesCount((c) => c + 1);
    }

    if (onLike) onLike(confession.id, likesCount);
  };

  const loadComments = async () => {
    if (commentsLoaded) return;

    const { data, error } = await supabase
      .from("comments")
      .select(`*, users ( first_name, last_name, class_grade )`)
      .eq("confession_id", confession.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Load comments error:", error);
      setCommentError(error.message);
      return;
    }

    setComments(data || []);
    setCommentsLoaded(true);
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments((s) => !s);
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    setPostingComment(true);
    setCommentError("");

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setCommentError("You must be logged in to comment.");
      setPostingComment(false);
      return;
    }

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

    if (error) {
      console.error("Post comment error:", error);
      setCommentError(error.message);
    } else {
      setComments((prev) => [...prev, data]);
      setCommentText("");
      setCommentsLoaded(true);
    }

    setPostingComment(false);
  };

  const handleDeleteComment = async (commentId) => {
    setCommentError("");

    const previousComments = comments;
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Delete comment error:", error);
      setComments(previousComments);
      setCommentError(error.message);
    }
  };

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
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
          <button className="card-delete" onClick={() => onDelete?.(confession.id)} type="button">
            Delete
          </button>
        )}
      </div>

      {confession.content && confession.content.trim() !== "" && (
        <p className="card-content">{confession.content}</p>
      )}

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

      <div className="card-actions">
        <button
          className={`card-action-btn like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
          type="button"
          aria-label="Like"
        >
          <HeartIcon filled={liked} />
          <span>{likesCount}</span>
        </button>

        <button
          className={`card-action-btn ${showComments ? "active" : ""}`}
          onClick={toggleComments}
          type="button"
          aria-label="Comments"
        >
          <CommentIcon />
          <span>{comments.length}</span>
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            className="comments-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28 }}
          >
            {commentError && <p className="composer-error">{commentError}</p>}

            {comments.length === 0 ? (
              <div className="comments-empty">No comments yet.</div>
            ) : (
              <div className="comments-list">
                {comments.map((comment) => {
                  const commentName = comment.is_anonymous
                    ? "Anonymous"
                    : comment.users
                      ? `${comment.users.first_name} ${comment.users.last_name}`
                      : "Unknown";

                  const commentInitials = comment.is_anonymous
                    ? "?"
                    : `${comment.users?.first_name?.[0] || ""}${comment.users?.last_name?.[0] || ""}`;

                  const canDeleteComment = comment.author_id === currentUserId;

                  return (
                    <div className="comment" key={comment.id}>
                      <div className="comment-avatar">{commentInitials}</div>

                      <div className="comment-body">
                        <div className="comment-author">
                          {commentName}
                          <span className="comment-time">{timeAgo(comment.created_at)}</span>
                          {canDeleteComment && (
                            <button
                              className="comment-delete"
                              onClick={() => handleDeleteComment(comment.id)}
                              type="button"
                              aria-label="Delete comment"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>

                        <div className="comment-text">{comment.content}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="comment-input-wrap">
              <div className="comment-input-row">
                <input
                  className="comment-input"
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    setCommentError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePostComment();
                  }}
                  placeholder="Write a comment..."
                />

                <button
                  className="comment-submit"
                  onClick={handlePostComment}
                  disabled={postingComment || !commentText.trim()}
                  type="button"
                  aria-label="Send comment"
                >
                  {postingComment ? "..." : <ArrowUpIcon />}
                </button>
              </div>

              <button
                className={`comment-anon-toggle ${commentAnon ? "active" : ""}`}
                onClick={() => setCommentAnon((v) => !v)}
                type="button"
              >
                {commentAnon ? "Anonymous comment" : "Named comment"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const HeartIcon = ({ filled }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6c-1.7-1.7-4.5-1.7-6.2 0L12 7.2 9.4 4.6c-1.7-1.7-4.5-1.7-6.2 0s-1.7 4.5 0 6.2L12 19.6l8.8-8.8c1.7-1.7 1.7-4.5 0-6.2z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </svg>
);