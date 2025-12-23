import '../CSS/login.css';
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../slices/authSlice";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../firebase';
import { getUserRole } from "../utiles/getUserRole";
import axios from 'axios';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isLoggedIn, token } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [socialLoading, setSocialLoading] = useState({ google: false, facebook: false });

  const handelGetType = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/studentType`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.studentType;
    } catch (error) {
      console.error("Error fetching user type:", error);
      return null;
    }
  };

  // Redirect based on role
  useEffect(() => {
    if (isLoggedIn) {
      const role = getUserRole(token);

      if (role === "student") navigate("/home/student");
      else if (role === "teacher") navigate("/home/teacher");
      else if (role === "parent") navigate("/home/parent");
      else if (role === "trainee") navigate("/home/tranier");
      else navigate("/home"); // fallback
    }
  }, [isLoggedIn, navigate, token]);

  // Handle Facebook redirect result
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          navigate("/home");
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };
    handleRedirectResult();
  }, [navigate]);

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      setSocialLoading(prev => ({ ...prev, google: true }));
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('Google user:', user);
      navigate("/welcome");
    } catch (error) {
      console.error('Google login error:', error);
      if (error.code !== 'auth/cancelled-popup-request' &&
          error.code !== 'auth/popup-closed-by-user') {
        alert(`Google login failed: ${error.message}`);
      }
    } finally {
      setSocialLoading(prev => ({ ...prev, google: false }));
    }
  };

  // Facebook Login
  const handleFacebookLogin = async () => {
    try {
      setSocialLoading(prev => ({ ...prev, facebook: true }));
      facebookProvider.addScope('email');
      facebookProvider.addScope('public_profile');
      facebookProvider.setCustomParameters({ 'display': 'popup' });

      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      console.log('Facebook user:', user);
      navigate("/welcome");
    } catch (error) {
      console.error('Facebook login error:', error);
      switch (error.code) {
        case 'auth/cancelled-popup-request':
        case 'auth/popup-closed-by-user':
          console.log('User cancelled Facebook login');
          break;
        case 'auth/account-exists-with-different-credential':
          alert('هذا البريد الإلكتروني مسجل مسبقاً بطريقة تسجيل دخول أخرى');
          break;
        case 'auth/popup-blocked':
          alert('تم حظر نافذة التسجيل. الرجاء السماح بالنوافذ المنبثقة لهذا الموقع');
          break;
        case 'auth/unauthorized-domain':
          alert('هذا النطاق غير مصرح به. الرجاء التحقق من إعدادات Firebase');
          break;
        case 'auth/operation-not-allowed':
          alert('تسجيل الدخول عبر Facebook غير مفعل في إعدادات Firebase');
          break;
        default:
          if (error.message.includes('Facebook')) {
            alert(`Facebook login failed: ${error.message}`);
          }
      }
    } finally {
      setSocialLoading(prev => ({ ...prev, facebook: false }));
    }
  };

  const handleLogin = () => {
    // ✅ Fixed admin account
    if (email === "aboodjamal684@gmail.com" && password === "abood123456789") {
      localStorage.setItem("token", "admin-token");
      localStorage.setItem("role", "admin");
      navigate("/home/admin");
      return; // Don't call backend
    }

    // ✅ Other users
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Log In to your account</h2>

        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div className="forgot-password-section">
          <span className="forgot-password-link" onClick={() => navigate("/forgot-password")}>
            Forgot Password?
          </span>
        </div>

        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>

        {error && <p className="error-text">{error}</p>}

        <div className="social-login">
          <p className="social-text">or login with</p>
          <div className="social-buttons">
            <button className="social-btn facebook-btn" onClick={handleFacebookLogin} disabled={socialLoading.facebook}>
              {socialLoading.facebook ? "Loading..." : "Facebook"}
            </button>
            <button className="social-btn google-btn" onClick={handleGoogleLogin} disabled={socialLoading.google}>
              {socialLoading.google ? "Loading..." : "Google"}
            </button>
          </div>
        </div>

        <div className="signup-section">
          <p>Don't have account? <span className="signup-link" onClick={() => navigate("/signup")}>Sign Up</span></p>
        </div>
      </div>
    </div>
  );
}
