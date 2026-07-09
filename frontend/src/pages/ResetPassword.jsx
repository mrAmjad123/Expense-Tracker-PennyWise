import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as authApi from "../api/auth";
import "./Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) return setError("This reset link is missing its token.");
    if (form.newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (form.newPassword !== form.confirmPassword) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword: form.newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card-anim">
        <h1 className="auth-title">Reset your password</h1>
        <p className="auth-subtitle">Choose a new password for your account.</p>

        {success ? (
          <p className="form-success">Password reset. Redirecting you to login...</p>
        ) : !token ? (
          <p className="form-error">
            This link is missing a reset token. Request a new one from the{" "}
            <Link to="/forgot-password">forgot password</Link> page.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="form-field">
              <span>New Password</span>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => updateField("newPassword", e.target.value)}
                placeholder="At least 8 characters"
                autoFocus
              />
            </label>

            <label className="form-field">
              <span>Confirm New Password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                placeholder="Re-enter your new password"
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
