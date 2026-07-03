import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AvatarSetup.css";

export default function AvatarSetup() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const userName = localStorage.getItem("userName") || "User";
  const firstLetter = userName.charAt(0).toUpperCase();

  const [image, setImage] = useState(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
    setPosition({ x: 50, y: 50 });
    setScale(1);
  }

  function handleMouseDown(event) {
    if (!image) return;
    setDragging(true);
    setLastMouse({ x: event.clientX, y: event.clientY });
  }

  function handleMouseMove(event) {
    if (!dragging) return;

    const deltaX = event.clientX - lastMouse.x;
    const deltaY = event.clientY - lastMouse.y;

    setPosition((prev) => ({
      x: prev.x + deltaX / 2,
      y: prev.y + deltaY / 2,
    }));

    setLastMouse({ x: event.clientX, y: event.clientY });
  }

  function handleMouseUp() {
    setDragging(false);
  }

  function handleSelectAvatar() {
    if (image) {
      localStorage.setItem(
        "userAvatar",
        JSON.stringify({
          image,
          position,
          scale,
        })
      );
    }

    navigate("/feed");
  }

  function handleSkip() {
    localStorage.removeItem("userAvatar");
    navigate("/feed");
  }

  return (
    <main className="avatar-page">
      <section className="avatar-card">
        <div
          className="avatar-circle"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {image ? (
            <img
              src={image}
              alt="Selected avatar"
              className="avatar-image"
              style={{
                transform: `translate(-50%, -50%) scale(${scale})`,
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
              draggable="false"
            />
          ) : (
            <span className="avatar-letter">{firstLetter}</span>
          )}

          <button
            className="avatar-add-button"
            type="button"
            onClick={() => fileInputRef.current.click()}
          >
            +
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />

        <p className="avatar-text">Select the avatar for your profile</p>

        {image && (
          <div className="avatar-controls">
            <label>
              Zoom
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
              />
            </label>

            <button className="select-button" type="button" onClick={handleSelectAvatar}>
              Select
            </button>
          </div>
        )}

        <button className="skip-button" type="button" onClick={handleSkip}>
          Skip for now
        </button>
      </section>
    </main>
  );
}