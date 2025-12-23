import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/Signup.css"; // نستخدم نفس التنسيق

const VerifyEmail = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // استخراج الإيميل من الرابط
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get("email");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:3000/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setSuccess("Email verified successfully!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-header">
          <h2>Email Verification</h2>
          <p className="signup-subtitle">
            We sent a 6-digit verification code to <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && <div className="error-text">{error}</div>}
          {success && <div className="success-text">{success}</div>}

          <div className="form-group">
            <label htmlFor="code">Verification Code *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your 6-digit code"
              maxLength="6"
              className={error ? "error" : ""}
            />
          </div>

          <button
            type="submit"
            className="signup-btn"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Didn’t receive the code?{" "}
            <button
              type="button"
              className="resend-link"
              onClick={() => alert("Resend feature coming soon")}
            >
              Resend Code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
