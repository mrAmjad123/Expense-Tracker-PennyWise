import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const loggedInUser = await authApi.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const signup = useCallback((details) => {
    // Doesn't create the account yet — just starts the OTP flow.
    return authApi.signup(details);
  }, []);

  const verifyOtp = useCallback(async ({ email, otp }) => {
    const newUser = await authApi.verifyOtp({ email, otp });
    setUser(newUser);
    return newUser;
  }, []);

  const resendOtp = useCallback((email) => authApi.resendOtp({ email }), []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async ({ currentPassword }) => {
    await authApi.deleteAccount({ currentPassword });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, verifyOtp, resendOtp, logout, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider.");
  return ctx;
}
