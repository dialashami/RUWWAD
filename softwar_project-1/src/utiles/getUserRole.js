import { jwtDecode } from "jwt-decode";

export function getUserRole(token) {
  try {
    if (!token) return null;

    const decoded = jwtDecode(token);
    return decoded.role || null; // assuming your token payload includes a 'role' field
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}