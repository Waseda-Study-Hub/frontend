import { useNavigate } from "react-router";
import { Lock, Mail } from "lucide-react";

export function Login() {
  const navigate = useNavigate();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-waseda-bg)] items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-waseda p-8 w-full max-w-md border border-[var(--color-waseda-border)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-waseda flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-black/5">
            W
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-waseda-text)]">Waseda Study Hub</h1>
          <p className="text-gray-500 mt-2 text-sm">Study Smarter, Together.</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waseda Student Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="student@fuji.waseda.jp"
                className="w-full pl-10 pr-4 py-2 border border-[var(--color-waseda-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 border border-[var(--color-waseda-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                required
              />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="w-full bg-[var(--color-waseda-text)] text-white font-medium py-2.5 rounded-xl hover:bg-black/90 transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              className="w-full bg-white text-[var(--color-waseda-text)] border border-[var(--color-waseda-border)] font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Sign Up with Waseda ID
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
          Securely authenticated via Firebase. Restricted to verified Waseda University students.
        </div>
      </div>
    </div>
  );
}
