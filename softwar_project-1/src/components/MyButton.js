import React from "react";
import { useNavigate } from "react-router-dom";
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import "./logout.css"; // CSS الخاص بزر تسجيل الخروج

export default function MyButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login"); // يرجع المستخدم لصفحة تسجيل الدخول
  };

  return (
    <Stack spacing={2} direction="row" className='buttons'>
      <Button variant="text">Text</Button>
      <Button variant="text">Text</Button>
      <button className="logout-btn" onClick={handleLogout}>
        تسجيل الخروج
      </button>
    </Stack>
  );
}
