import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export default function NewPostModal({ profile, onClose, onPosted }) {
  const [content,     setContent    ] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading,     setLoading    ] = useState(false);
  const [error,       setError      ] = useState("");
  const [image,       setImage      ] = useState(null);
  const [imagePreview,setImagePreview] = useState(null);
  const fileRef = useRef(null);

  const maxChars = 500;

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image too large — max 5MB."); return; }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) { setError("Write something or add a photo."); return; }
    if (content.length > maxChars)  { setError("Too long — max 500 characters."); return; }

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    let image_url = null;


    if (image) {
      const ext  = image.name.split(".").pop();
      const path = `confessions/${session.user.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("confession-images")
        .upload(path, image);

      if (uploadError) {
        setError("Image upload failed. Try again.");
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("confession-images")
        .getPublicUrl(path);

      image_url = urlData.publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from("confessions")
      .insert({
        author_id:    session.user.id,
        content:      content.trim(),
        is_anonymous: isAnonymous,
        likes_count:  0,
        image_url,
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
      {}
      <motion.div
        className="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {}
      <motion.div
        className="sheet-mobile"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {}
        <div className="sheet-handle" />

        {}
        <div className="sheet-header">
          <div className="sheet-who">
            <div className="sheet-avatar">
              {isAnonymous
                ? "?"
                : `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`}
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

        {}
        <textarea
          className="sheet-textarea"
          placeholder="Write your confession… (English or Armenian)"
          value={content}
          onChange={e => { setContent(e.target.value); setError(""); }}
          maxLength={maxChars}
          autoFocus
        />

        {}
        {imagePreview && (
          <div className="sheet-image-preview">
            <img src={imagePreview} alt="preview" />
            <button className="sheet-image-remove" onClick={removeImage}>
              <CloseIcon />
            </button>
          </div>
        )}

        {}
        {error && <p className="sheet-error">{error}</p>}

        {}
        <div className="sheet-footer">
          <div className="sheet-toggle">
            <button
              className={`stoggle-btn ${isAnonymous ? "active" : ""}`}
              onClick={() => setIsAnonymous(true)}
              type="button"
            >
              <MaskIcon /> Anon
            </button>
            <button
              className={`stoggle-btn ${!isAnonymous ? "active" : ""}`}
              onClick={() => setIsAnonymous(false)}
              type="button"
            >
              <UserIcon /> Named
            </button>

            {}
            <button
              className="stoggle-btn"
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              <PhotoIcon /> Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImage}
            />
          </div>

          <div className="sheet-footer-right">
            <span className={`sheet-chars ${content.length > maxChars * 0.9 ? "chars-warn" : ""}`}>
              {content.length}/{maxChars}
            </span>
            <button
              className="sheet-submit"
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && !image)}
            >
              {loading ? <Spinner /> : "Post"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


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
const PhotoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .8s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);