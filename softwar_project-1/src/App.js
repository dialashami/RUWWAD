import './App.css'; 
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; 
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Welcome from './pages/Welcome';
import VerifyEmail from './pages/verifemail'; 
import PrivateRoute from './components/PrivateRoute';

import StudentHome from './pages/StudentHome/StudentHome';
import ParentHome from './pages/ParentHome/ParentHome';
import TeacherHome from './pages/TeacherHome/TeacherHome';
import { Admin } from './pages/Admin/Admin';


import './index.css';

function App() { 
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return ( 
    <BrowserRouter> 
      <Routes> 

        {/* الصفحة الرئيسية */}
        <Route path="/" element={<Welcome />} />
        <Route path="/welcome" element={<Welcome />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* ================= DASHBOARDS ================= */}
        {/* طالب */}
        <Route
          path="/home/student"
          element={
            <PrivateRoute role="student">
              <StudentHome />
            </PrivateRoute>
          }
        />

        {/* ولي أمر */}
        <Route
          path="/home/parent"
          element={
            <PrivateRoute role="parent">
              <ParentHome />
            </PrivateRoute>
          }
        />

        {/* معلم */}
        <Route
          path="/home/teacher"
          element={
            <PrivateRoute role="teacher">
              <TeacherHome />
            </PrivateRoute>
          }
        />

        {/* ✅✅✅ الأدمن */}
        <Route
          path="/home/admin"
          element={
            <PrivateRoute role="admin">
              <Admin />
            </PrivateRoute>
          }
        />

        {/* أي رابط غلط */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes> 
    </BrowserRouter> 
  ); 
} 

export default App;
