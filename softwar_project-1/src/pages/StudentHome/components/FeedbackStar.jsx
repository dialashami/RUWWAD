// src/components/FeedbackStar.jsx
import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

export default function FeedbackStar() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);         // 1–5
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const openForm = () => {
    setIsOpen(true);
    setSent(false);
  };

  const closeForm = () => {
    setIsOpen(false);
    setRating(0);
    setHoverRating(0);
    setMessage('');
    setIsSending(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating && !message.trim()) return;

    try {
      setIsSending(true);
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const authorId = user?._id || user?.id || null;

      if (!token || !authorId) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          author: authorId,
          rating,
          comment: message.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to save feedback');
      }

      await res.json();

      setSent(true);
      setIsSending(false);
    } catch (err) {
      console.error('Error sending feedback', err);
      setIsSending(false);
    }
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <>
      {/* ⭐ زر الفيدباك العائم */}
      <button
        className="feedback-star-button"
        onClick={openForm}
        aria-label="Send feedback"
      >
        <Star className="feedback-star-icon" />
      </button>

      {/* 🧩 مودال الفيدباك */}
      {isOpen && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal">
            <div className="feedback-modal-header">
              <h3>Share your feedback</h3>
              <button
                className="feedback-close-btn"
                onClick={closeForm}
                aria-label="Close feedback"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!sent ? (
              <form onSubmit={handleSubmit} className="feedback-form">
                <label className="feedback-label">
                  Overall experience
                </label>
                <div className="feedback-stars-row">
                  {stars.map((s) => {
                    const isFilled = (hoverRating || rating) >= s;
                    return (
                      <button
                        key={s}
                        type="button"
                        className="feedback-star-select"
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                      >
                        <Star
                          className="w-6 h-6"
                          style={{
                            fill: isFilled ? '#facc15' : 'transparent',
                            color: isFilled ? '#eab308' : '#9ca3af',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>

                <label className="feedback-label" style={{ marginTop: 12 }}>
                  Tell us more
                </label>
                <textarea
                  className="feedback-textarea"
                  placeholder="What do you like? What can we improve?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                <button
                  type="submit"
                  className="feedback-submit-btn"
                  disabled={isSending || (!rating && !message.trim())}
                >
                  {isSending ? 'Sending...' : 'Send feedback'}
                </button>
              </form>
            ) : (
              <div className="feedback-thankyou">
                <p>Thank you for your feedback! 💛</p>
                <button
                  className="feedback-submit-btn"
                  onClick={closeForm}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
