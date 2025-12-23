import { jwtDecode } from "jwt-decode";

export function getIdFromToken(token) {
    try {
        if (!token) return null;
        const decoded = jwtDecode(token);
        return decoded.userId || null;
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
}