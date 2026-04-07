import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { getCurrentUser, login } from "@/services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const redirectIfAlreadyLoggedIn = async () => {
      try {
        const { data: { user } } = await getCurrentUser();
        if (!cancelled && user) {
          navigate("/admin/dashboard", { replace: true });
        }
      } catch {
        // Ignore here and allow manual login.
      }
    };

    void redirectIfAlreadyLoggedIn();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await login(email, password);

      if (error) {
        setSubmitting(false);
        alert(error.message || "Invalid email or password.");
        return;
      }

      if (data.session) {
        setSubmitting(false);
        navigate("/admin/dashboard", { replace: true });
      } else {
        setSubmitting(false);
        alert("Login failed. Please try again.");
      }
    } catch {
      setSubmitting(false);
      alert("Login failed. Please try again.");
    }

  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <h1 className="text-xl font-semibold text-slate-900">Admin Login</h1>

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
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-slate-900 outline-none focus:border-slate-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-500 hover:text-slate-700 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
