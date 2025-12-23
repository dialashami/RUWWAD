// pages/Home.jsx
/* 
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import '../CSS/Home.css';

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/"); // redirect to login after logout
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Welcome!</h1>
        <p>Your User ID: <span className="userid">{userId}</span></p>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
*/
// pages/Home.jsx
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import '../CSS/Home.css';

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId, userName } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  // بيانات افتراضية
  const classes = [
    { id: 1, subject: "الرياضيات - الوحدة الثالثة", files: "10 ملفات", teacher: "أحمد محمد" },
    { id: 2, subject: "العلوم - الوحدة الثانية", files: "12 ملف", teacher: "سارة عبدالله" },
    { id: 3, subject: "اللغة العربية - الوحدة الأولى", files: "16 ملف", teacher: "محمد علي" }
  ];

  const lessons = [
    { id: 1, level: "المستوى الأول", teacher: "أحمد محمد", date: "12.07.2023", payment: "مكتمل" },
    { id: 2, level: "المستوى الأول", teacher: "سارة عبدالله", date: "17.07.2023", payment: "معلق" },
    { id: 3, level: "المستوى الأول", teacher: "محمد علي", date: "22.07.2023", payment: "مكتمل" }
  ];

  const reminders = [
    { id: 1, subject: "الرياضيات - اختبار", date: "15 ديسمبر 2023, الجمعة" },
    { id: 2, subject: "العلوم - واجب", date: "16 ديسمبر 2023, السبت" },
    { id: 3, subject: "اللغة العربية - حصة محادثة", date: "17 ديسمبر 2023, الأحد" }
  ];

  const calendarDays = [
    [27, 28, 29, 30, 1, 2, 3],
    [4, 5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16, 17],
    [18, 19, 20, 21, 22, 23, 24],
    [25, 26, 27, 28, 29, 30, 31]
  ];

  return (
    <div className="ruwwad-container">
      {/* الشريط الجانبي */}
      <aside className="sidebar">
        <div className="logo-section">
          <h1 className="platform-name">Ruwwad</h1>
          <p className="platform-subtitle">منصة التعليم التفاعلية</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3>لوحة التحكم</h3>
            <ul>
              <li className="nav-item active">
                <span>📊</span>
                <span>الصفوف</span>
              </li>
              <li className="nav-item">
                <span>🎥</span>
                <span>الدروس المباشرة</span>
              </li>
              <li className="nav-item">
                <span>📹</span>
                <span>الدروس المسجلة</span>
              </li>
              <li className="nav-item">
                <span>📚</span>
                <span>مكتبة الفيديوهات</span>
              </li>
            </ul>
          </div>
        </nav>

        <div className="help-section">
          <h3>تحتاج مساعدة؟</h3>
          <p>هل تواجه أي مشكلة أثناء استخدام المنصة؟</p>
          <button className="help-btn">اتصل بالدعم</button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="main-content">
        <header className="content-header">
          <div className="search-section">
            <div className="search-bar">
              <input type="text" placeholder="ابحث..." />
              <span>🔍</span>
            </div>
            <div className="date-display">
              <span>15 ديسمبر 2023, الجمعة</span>
            </div>
          </div>

          <div className="user-section">
            <div className="user-info">
              <span className="welcome-text">مرحباً بعودتك، {userName || "الطالب"}!</span>
              <p className="announcement">
                دروس جديدة للغة الإنجليزية متاحة الآن، "English for Beginners" للمستويات A1 و A2.
              </p>
              <button className="buy-lesson-btn">شراء الدروس</button>
            </div>
          </div>
        </header>

        <div className="content-grid">
          {/* قسم الصفوف */}
          <section className="classes-section">
            <div className="section-header">
              <h2>الصفوف</h2>
              <button className="view-all-btn">عرض الكل</button>
            </div>
            <div className="classes-list">
              {classes.map(classItem => (
                <div key={classItem.id} className="class-card">
                  <div className="class-info">
                    <h4>{classItem.subject}</h4>
                    <span className="files-count">{classItem.files}</span>
                    <p className="teacher-name">المعلم: {classItem.teacher}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* قسم الملف الشخصي */}
          <section className="profile-section">
            <div className="profile-card">
              <div className="profile-header">
                <div className="avatar">👤</div>
                <div className="profile-info">
                  <h3>{userName || "الطالب"}</h3>
                  <p>طالب</p>
                </div>
              </div>
              <button className="profile-btn">الملف الشخصي</button>
            </div>

            {/* التقويم */}
            <div className="calendar-section">
              <div className="calendar-header">
                <h4>ديسمبر 2023</h4>
              </div>
              <div className="calendar">
                <div className="week-days">
                  {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                {calendarDays.map((week, weekIndex) => (
                  <div key={weekIndex} className="week">
                    {week.map((day, dayIndex) => (
                      <span 
                        key={dayIndex} 
                        className={`day ${day === 15 ? 'current-day' : ''}`}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* قسم الدروس */}
          <section className="lessons-section">
            <div className="section-header">
              <h2>الدروس</h2>
            </div>
            <div className="lessons-table">
              <div className="table-header">
                <span>الصف</span>
                <span>اسم المعلم</span>
                <span>تاريخ البدء</span>
                <span>المواد</span>
                <span>الحالة</span>
              </div>
              {lessons.map(lesson => (
                <div key={lesson.id} className="table-row">
                  <span>{lesson.level}</span>
                  <span>{lesson.teacher}</span>
                  <span>{lesson.date}</span>
                  <button className="download-btn">تحميل</button>
                  <span className={`payment-status ${lesson.payment === 'مكتمل' ? 'completed' : 'pending'}`}>
                    {lesson.payment}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* قسم التذكيرات */}
          <section className="reminders-section">
            <div className="section-header">
              <h2>التذكيرات</h2>
            </div>
            <div className="reminders-list">
              {reminders.map(reminder => (
                <div key={reminder.id} className="reminder-item">
                  <div className="reminder-dot"></div>
                  <div className="reminder-content">
                    <h4>{reminder.subject}</h4>
                    <span>{reminder.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* زر تسجيل الخروج */}
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            تسجيل الخروج
          </button>
        </div>
      </main>
    </div>
  );
}