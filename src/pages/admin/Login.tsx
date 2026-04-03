import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_AUTH_KEY = "adminAuth";
const ADMIN_AUTH_AT_KEY = "adminAuthAt";
const ADMIN_EMAIL_KEY = "adminEmail";
const ADMIN_AUTH_TOKEN_KEY = "adminAuthToken";

export default function Login() {
  const [mode, setMode] = useState<"login" | "change-password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oldEmail, setOldEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/verify-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success || typeof result?.authToken !== "string") {
        sessionStorage.removeItem(ADMIN_AUTH_KEY);
        sessionStorage.removeItem(ADMIN_AUTH_AT_KEY);
        sessionStorage.removeItem(ADMIN_EMAIL_KEY);
        sessionStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
        setSubmitting(false);
        alert("Invalid admin email or password.");
        return;
      }

      sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
      sessionStorage.setItem(ADMIN_AUTH_AT_KEY, String(Date.now()));
      sessionStorage.setItem(ADMIN_EMAIL_KEY, email);
      sessionStorage.setItem(ADMIN_AUTH_TOKEN_KEY, result.authToken);

      setSubmitting(false);
      navigate("/admin/dashboard");
    } catch {
      setSubmitting(false);
      alert("Login failed. Please try again.");
      return;
    }

  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!oldEmail || !oldPassword || !newPassword || !confirmNewPassword) {
      alert("Please fill old email, old password and new password fields.");
      return;
    }

    if (newPassword.length < 4) {
      alert("New password must be at least 4 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/change-admin-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: oldEmail,
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        setSubmitting(false);
        alert(result?.error || "Unable to change admin password.");
        return;
      }

      setSubmitting(false);
      setEmail(oldEmail);
      setPassword("");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setMode("login");
      alert("Admin password changed successfully. Please login with the new password.");
    } catch {
      setSubmitting(false);
      alert("Password change failed. Please try again.");
      return;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={mode === "login" ? handleSubmit : handleChangePassword}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <h1 className="text-xl font-semibold text-slate-900">Admin Login</h1>

        <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              mode === "login" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("change-password")}
            className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              mode === "change-password" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Change Password
          </button>
        </div>

        {mode === "login" ? (
          <>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                required
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="old-email" className="mb-1 block text-sm text-slate-700">
                Old Email
              </label>
              <input
                id="old-email"
                type="email"
                value={oldEmail}
                onChange={(event) => setOldEmail(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                required
              />
            </div>

            <div>
              <label htmlFor="old-password" className="mb-1 block text-sm text-slate-700">
                Old Password
              </label>
              <input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                required
              />
            </div>

            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm text-slate-700">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="mb-1 block text-sm text-slate-700">
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                required
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mode === "login"
            ? (submitting ? "Logging in..." : "Login")
            : (submitting ? "Changing..." : "Change Password")}
        </button>
      </form>
    </div>
  );
}
