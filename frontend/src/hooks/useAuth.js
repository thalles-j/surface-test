import { useAuth as useAuthContext } from "../context/AuthContext.jsx";

export default function useAuth() {
  return useAuthContext();
}
