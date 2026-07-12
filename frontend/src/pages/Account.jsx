import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/auth";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Account() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount({ currentPassword: deletePassword });
      navigate("/");
    } catch (err) {
      setDeleteError(err.message || "Something went wrong.");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.currentPassword) return setError("Please enter your current password.");
    if (form.newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (form.newPassword !== form.confirmPassword) return setError("New passwords do not match.");

    setSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card-anim">
        <h1 className="auth-title">Account</h1>
        <p className="auth-subtitle">
          Signed in as {user.name} ({user.email})
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-field">
            <span>Current Password</span>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => updateField("currentPassword", e.target.value)}
              placeholder="Your current password"
              autoFocus
            />
          </label>

          <label className="form-field">
            <span>New Password</span>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => updateField("newPassword", e.target.value)}
              placeholder="At least 8 characters"
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
          {success && <p className="form-success">Password updated successfully.</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      <div className="auth-card card-anim">
        <h1 className="auth-title">Danger Zone</h1>
        <p className="auth-subtitle">
          Permanently delete your account. This removes your expenses, budgets, and profile data. This cannot
          be undone.
        </p>

        <div className="auth-form">
          <label className="form-field">
            <span>Current Password</span>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Confirm your password to continue"
            />
          </label>

          {deleteError && <p className="form-error">{deleteError}</p>}

          <button
            type="button"
            className="btn btn-danger auth-submit"
            disabled={!deletePassword || deleting}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete My Account
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete your account?"
          message="This permanently deletes your account and all of your expenses and budgets. This cannot be undone."
          confirmLabel="Delete Account"
          busy={deleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
}
