import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, AlertCircle } from "lucide-react";
import Avatar from "../components/Avatar";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Phase 6: If the user was redirected here from a protected deep link,
    // returnTo holds that original path so we can redirect back after login.
    const returnTo = (location.state as { returnTo?: string })?.returnTo;

    const roleDefaultRoute = (role: string) => {
        if (role === "admin") return "/admin";
        if (role === "hr") return "/hr";
        return "/interviewer";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const user = await login(email, password);

            // If there is a saved deep-link destination, validate it belongs
            // to the logged-in user role before redirecting there.
            if (returnTo) {
                const isInterviewerPath = returnTo.startsWith("/interviewer");
                const isHrPath = returnTo.startsWith("/hr");
                const isAdminPath = returnTo.startsWith("/admin");

                const canAccess =
                    (isInterviewerPath && user.role === "interviewer") ||
                    (isHrPath && (user.role === "hr" || user.role === "admin")) ||
                    (isAdminPath && user.role === "admin");

                if (canAccess) {
                    navigate(returnTo, { replace: true });
                    return;
                }
            }

            navigate(roleDefaultRoute(user.role), { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || "Login failed. Please verify your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans text-gray-900">
            <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">

                {/* Header */}
                <div className="text-center mb-8">
                    <Avatar size="lg" className="mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Time Capsule</h2>
                    <p className="text-sm text-gray-500 mt-2">Sign in to access secure digital assets</p>
                    {returnTo && (
                        <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2 mt-3">
                            ?? Sign in to continue to your destination
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                id="password"
                                type="password"
                                placeholder="��������"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
