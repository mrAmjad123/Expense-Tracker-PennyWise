import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { signup, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("details"); // "details" | "otp"
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleDetailsSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Please enter your name.");
    if (!EMAIL_RE.test(form.email.trim())) return setError("Please enter a valid email.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (!recaptchaToken) return setError("Please complete the reCAPTCHA.");

    setSubmitting(true);
    try {
      const res = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        recaptchaToken,
      });
      setDevOtp(res.otp || null);
      setStep("otp");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError("");

    if (!otp.trim()) return setError("Please enter the code we sent you.");

    setSubmitting(true);
    try {
      await verifyOtp({ email: form.email.trim(), otp: otp.trim() });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    try {
      const res = await resendOtp(form.email.trim());
      setDevOtp(res.otp || null);
      setInfo(res.message);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  }

  if (step === "otp") {
    return (
      <div className="auth-page">
        <div className="auth-card card-anim">
          <h1 className="auth-title">Verify your email</h1>
          <p className="auth-subtitle">Enter the 6-digit code we sent to {form.email}.</p>

          <form onSubmit={handleOtpSubmit} className="auth-form">
            <label className="form-field">
              <span>Verification Code</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                autoFocus
              />
            </label>

            {error && <p className="form-error">{error}</p>}
            {info && <p className="form-success">{info}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? "Verifying..." : "Verify & Create Account"}
            </button>
          </form>

          {devOtp && (
            <p className="auth-dev-note">
              Dev mode (no email service configured yet) — your code is <strong>{devOtp}</strong>
            </p>
          )}

          <p className="auth-footer">
            Didn't get a code?{" "}
            <button type="button" className="auth-link-button" onClick={handleResend}>
              Resend
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card card-anim">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start tracking your expenses in under a minute.</p>

        <form onSubmit={handleDetailsSubmit} className="auth-form">
          <label className="form-field">
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Your name"
              autoFocus
            />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          <label className="form-field">
            <span>Confirm Password</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              placeholder="Re-enter your password"
            />
          </label>

          <div className="auth-recaptcha">
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={setRecaptchaToken}
              onExpired={() => setRecaptchaToken(null)}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? "Sending code..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
