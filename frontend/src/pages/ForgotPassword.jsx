import { useState } from "react";
import { Link } from "react-router-dom";
import * as authApi from "../api/auth";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Please enter your email.");

    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      setResult(res);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card-anim">
        <h1 className="auth-title">Forgot your password?</h1>
        <p className="auth-subtitle">Enter your email and we'll send you a link to reset it.</p>

        {result ? (
          <>
            <p className="form-success">{result.message}</p>
            {result.resetLink && (
              <p className="auth-dev-note">
                Dev mode (no email service configured yet) — reset link:
                <br />
                <a href={result.resetLink}>{result.resetLink}</a>
              </p>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Reset Link"}
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
