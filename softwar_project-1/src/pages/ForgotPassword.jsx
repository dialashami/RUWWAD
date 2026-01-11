import '../CSS/login.css';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Step 1: Enter email, Step 2: Enter code, Step 3: Enter new password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Step 1: Request password reset code
  const handleRequestCode = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await axios.post(API_CONFIG.AUTH.FORGOT_PASSWORD, { email });
      setSuccess("If an account with that email exists, a reset code has been sent.");
      setCooldown(60);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and move to password entry
  const handleVerifyCode = () => {
    if (!code) {
      setError("Please enter the verification code");
      return;
    }
    
    if (code.length !== 6) {
      setError("Verification code must be 6 digits");
      return;
    }

    setError("");
    setSuccess("");
    setStep(3);
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(API_CONFIG.AUTH.RESET_PASSWORD, {
        email,
        code,
        newPassword
      });
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>
          {step === 1 && "Forgot Password"}
          {step === 2 && "Enter Verification Code"}
          {step === 3 && "Create New Password"}
        </h2>

        {/* Step 1: Email Input */}
        {step === 1 && (
          <>
            <p className="forgot-description">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleRequestCode)}
            />
            <button 
              className="login-btn" 
              onClick={handleRequestCode} 
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </>
        )}

        {/* Step 2: Code Verification */}
        {step === 2 && (
          <>
            <p className="forgot-description">
              We've sent a 6-digit verification code to <strong>{email}</strong>. Please enter it below.
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={(e) => handleKeyPress(e, handleVerifyCode)}
              maxLength={6}
            />
            <button 
              className="login-btn" 
              onClick={handleVerifyCode} 
              disabled={loading}
            >
              Verify Code
            </button>
            <button 
              className="forgot-resend-btn" 
              onClick={handleRequestCode}
              disabled={loading || cooldown > 0}
            >
              {loading ? "Sending..." : cooldown > 0 ? `Resend Code (${cooldown}s)` : "Resend Code"}
            </button>
          </>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <>
            <p className="forgot-description">
              Enter your new password below.
            </p>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleResetPassword)}
            />
            <button 
              className="login-btn" 
              onClick={handleResetPassword} 
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}

        <div className="signup-section">
          <p>
            Remember your password?{" "}
            <span className="signup-link" onClick={() => navigate("/login")}>
              Back to Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
