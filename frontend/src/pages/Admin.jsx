import { useEffect, useState } from "react";
import * as adminApi from "../api/admin";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import "./Admin.css";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function loadUsers() {
    setLoading(true);
    adminApi
      .getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message || "Failed to load users."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleToggleSuspend(targetUser) {
    setError("");
    setBusyId(targetUser.id);
    try {
      const updated = await adminApi.setSuspended(targetUser.id, targetUser.suspended ? 0 : 1);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setError("");
    setBusyId(deleteTarget.id);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container admin-page">
      <div className="admin-header">
        <h1>Admin</h1>
        <p>Manage user accounts — suspend access or permanently delete an account and its data.</p>
      </div>

      {error && <p className="form-error admin-error">{error}</p>}

      {loading ? (
        <div className="route-loading">Loading users...</div>
      ) : (
        <div className="admin-table card-anim">
          <div className="admin-table-header">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span className="align-right">Expenses</span>
            <span>Joined</span>
            <span className="align-right">Actions</span>
          </div>
          {users.map((u) => {
            const isSelf = u.id === currentUser.id;
            const isBusy = busyId === u.id;
            return (
              <div className="admin-row" key={u.id}>
                <span>{u.name}</span>
                <span className="admin-email">{u.email}</span>
                <span>
                  <span className={`role-pill ${u.role === "admin" ? "role-admin" : ""}`}>{u.role}</span>
                </span>
                <span>
                  <span className={`status-pill ${u.suspended ? "status-suspended" : "status-active"}`}>
                    {u.suspended ? "Suspended" : "Active"}
                  </span>
                </span>
                <span className="align-right">{u.expenseCount}</span>
                <span className="admin-date">{formatDate(u.created_at)}</span>
                <div className="admin-actions align-right">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleToggleSuspend(u)}
                    disabled={isSelf || isBusy}
                    title={isSelf ? "You cannot suspend your own account." : undefined}
                  >
                    {u.suspended ? "Unsuspend" : "Suspend"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setDeleteTarget(u)}
                    disabled={isSelf || isBusy}
                    title={isSelf ? "You cannot delete your own account." : undefined}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this account?"
          message={`This permanently deletes ${deleteTarget.name} (${deleteTarget.email}) and all of their expenses and budgets. This cannot be undone.`}
          confirmLabel="Delete Account"
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
