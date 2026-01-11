import '../CSS/welcome.css';
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { API_CONFIG } from '../config/api.config';

// Default testimonials to show when no feedback is available
const defaultTestimonials = [
  {
    comment: "RUWWAD has transformed how I manage my classroom and communicate with parents",
    author: { firstName: "Sarah", lastName: "Hamad", role: "teacher" }
  },
  {
    comment: "As a parent, I can easily track my child's progress and stay connected with teachers",
    author: { firstName: "Hamza", lastName: "Suleiman", role: "parent" }
  },
  {
    comment: "The platform makes learning fun and accessible. I love the interactive lessons",
    author: { firstName: "Rand", lastName: "Qasem", role: "student" }
  }
];

export default function Welcome() {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState(defaultTestimonials);

  // Fetch random feedback from database
  const fetchFeedback = async () => {
    try {
      const res = await fetch(API_CONFIG.FEEDBACK.RANDOM + '?limit=3');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setTestimonials(data);
        }
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      // Keep default testimonials on error
    }
  };

  useEffect(() => {
    // Fetch feedback on mount
    fetchFeedback();

    // Refresh feedback every 5 minutes (300000ms)
    const interval = setInterval(fetchFeedback, 300000);

    return () => clearInterval(interval);
  }, []);

  const userTypes = [
    {
      id: 1,
      title: "Student",
      description: "Access lessons and learning materials",
      icon: "👨‍🎓",
      role: "student",

    },
    {
      id: 2,
      title: "Teacher",
      description: "Manage classrooms and deliver lessons",
      icon: "👨‍🏫",
      role: "teacher",
      
    },
    {
      id: 3,
      title: "Parent",
      description: "Track your children's academic progress",
      icon: "👨‍👩‍👧‍👦",
      role: "parent",
    
    } 
  ];
 

  const handleUserSelect = (user) => {
    navigate(`/signup?role=${user.role}`);
  };

  return (
    <div className="welcome-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-logo">
  <img 
    src="/logoRUWWAD3.png" 
    alt="RUWWAD Logo" 
    className="logo-img"
    onClick={() => {
      navigate("/");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }}
    style={{cursor: 'pointer'}}
  />
</div>

          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#about-us">About</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="nav-auth">
            <button 
              className="nav-login"
              onClick={() => navigate("/login")}
            >
              Log In
            </button>
            <button 
              className="nav-signup"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </button>
          </div>
          
        </div>
      </nav>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-container">
       <div className="hero-title">
    <h1 className="animated-ruwwad">
      <span className="ruwwad-letter">D</span>
      <span className="ruwwad-letter">A</span>
      <span className="ruwwad-letter">A</span>
      <span className="ruwwad-letter">W</span>
      <span className="ruwwad-letter">U</span>
      <span className="ruwwad-letter">R</span>
    </h1>

  </div>
          <h2 className="features-title"> Where education is a shared journey  </h2>
          <p className="features-subtitle">
            Ruwwad is the one platform that unites students, educators, and families to help learners succeed at every stage
          </p>

          {/* Get Started Section within Features */}
          <div  className="get-started-section">
            <h3 className="get-started-title">Get started as</h3>
            <div className="user-cards">
              {userTypes.map(user => (
                <div 
                  key={user.id}
                  className="user-card"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="user-icon">{user.icon}</div>
                  <div className="user-content">
                    <h4 className="user-role">{user.title}</h4>
                    <p className="user-desc">{user.description}</p>
                  </div>
                  <span className="arrow">→</span>
                </div>
              ))}
            </div>
          </div>

 
{/* Stay Connected Section */}
<div className="stay-connected-section">
  <div className="chat-visual">
    <div className="chat-bubble">
      <div className="message sender animate-message" style={{animationDelay: '0.2s'}}>
        <span className="sender-name">Ali - Mohammed’s Parent</span>
        <p>Mohammed was so proud of the A he got on his science test! Thanks for all your help.</p>
        
      </div>
      <div className="message receiver animate-message" style={{animationDelay: '0.5s'}}>
        <p>We're so proud! She practiced a ton.</p>
        <span className="read-time">Read 10:20AM</span>
      </div>
      <div className="message sender animate-message" style={{animationDelay: '0.8s'}}>
        <span className="sender-name">Rana - Layan's Parent</span>
        <p>Elena finally solved that tough math problem she's been stuck on. She said her teacher's example made it click!</p>
      </div>
    </div>
  </div>

  <div className="chat-info animate-fade-in" style={{animationDelay: '1s'}}>
    <div className="chat-icon">💬</div>
    <h2>Stay connected—instantly</h2>
    <p>
      Messages make it easy to communicate with teachers, families and staff anytime 🌍
    </p>
  </div>
</div>

{/* Build the Best Classroom Section */}
<section className="toolkit-section">
  <div className="toolkit-visual">
    <motion.div 
      className="monster"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      
    </motion.div>

    <div className="tool-icons">
      {[
        { name: "Assignments", color: "#FF5C5C", delay: 0.2 },
        { name: "Zoom", color: "#6C63FF", delay: 0.4 },
        { name: "Schedule", color: "#4B9EFF", delay: 0.6 },
        { name: "Chattings", color: "#55D88A", delay: 0.8 },
        { name: "Videos", color: "#00CFFF", delay: 1.0 },
        { name: "Notes", color: "#FFB347", delay: 1.2 },
        { name: "Chart", color: "#A066FF", delay: 1.4 },
        { name: "Lectures", color: "#FFDC60", delay: 1.6 },
      ].map((tool, index) => (
        <motion.div
          key={index}
          className="tool-icon"
          style={{ backgroundColor: tool.color }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: tool.delay, type: "spring", stiffness: 150 }}
        >
          {tool.name}
        </motion.div>
      ))}
    </div>
  </div>

  <motion.div 
    className="toolkit-info"
    initial={{ x: 100, opacity: 0 }}
    whileInView={{ x: 0, opacity: 1 }}
    transition={{ duration: 0.8 }}
  >
    <div className="paint-icon">🎨</div>
    <h2>Build the best classroom </h2>
    <p>
      From attendance sheets to timers and everything in between, 
      the <strong>Teacher Toolkit</strong> will save time and energy for what really matters
    </p>
  </motion.div>
</section>


          <div className='about-section' id="about-us">
  
  <div className="about-content">
    <h1>?What's Ruwwad</h1>
    <p>
      Ruwwad is a comprehensive educational platform that supports learners, educators, and parents at every stage of the educational journey. We provide a unified digital environment that brings together interactive lessons, progress tracking, and communication tools. For students, we offer personalized, flexible learning paths. For teachers, we provide powerful tools to create content and monitor performance. For parents, we ensure transparency and collaboration. By connecting all stakeholders in one adaptive ecosystem, Ruwwad empowers entire learning communities to achieve academic and professional success
    </p>
  </div>

 
</div>
          
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <h2 className="testimonials-title">What Our Users Say</h2>
          <div className="testimonials-grid">
            {testimonials.map((feedback, index) => (
              <div key={feedback._id || index} className="testimonial-card">
                <div className="testimonial-text">
                  {feedback.comment}
                </div>
                <div className="testimonial-author">
                  <div className="author-name">
                    {feedback.author?.firstName || 'Anonymous'} {feedback.author?.lastName || ''}
                  </div>
                  <div className="author-role">
                    {feedback.author?.role ? feedback.author.role.charAt(0).toUpperCase() + feedback.author.role.slice(1) : 'User'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id='contact' className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-logo">RUWWAD</h3>
              <p className="footer-description">
                Empowering education through technology and innovation
              </p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <a href="#features">Features</a>
              <a href="#about">About Us</a>
              <a href="#contact">Contact</a>
              <a href="#privacy">Privacy Policy</a>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#faq">FAQ</a>
              <a href="#community">Community</a>
            </div>
            <div className="footer-section">
              <h4>Connect</h4>
              <a href="https://www.facebook.com/share/14QRZEy9etj/?mibextid=wwXIfr" target="_blank">Facebook</a>
              <a href="https://x.com/abdalrhmanjyas?s=21" target="_blank"> Twitter</a>
              <a href="https://www.linkedin.com/in/abdalrhman-yaseen-809202172?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" target="_blank">LinkedIn</a>
              <a href="https://www.instagram.com/abdalrhmanjyaseen?igsh=NmFkeW00ajNja3h0&utm_source=qr" target="_blank">Instagram</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; RUWWAD All rights reserved.2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}