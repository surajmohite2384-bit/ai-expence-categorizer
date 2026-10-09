import React, { useState } from "react";
import "./Login.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

export default function Login({ onLogin }) {
  const [authMode, setAuthMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [transitionUser, setTransitionUser] = useState(null);

  function enterDashboard(account) {
    if (account?.token) {
      localStorage.setItem("spendai_token", account.token);
    }
    setIsLoading(false);
    setTransitionUser(account);
    window.setTimeout(() => onLogin(account), 3000);
  }

  function validate() {
    const newErrors = {};

    if (authMode === "create" && !name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address (e.g. name@domain.com)";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (authMode === "create") {
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setAuthMessage("");

    if (!validate()) return;

    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (authMode === "create") {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            email: normalizedEmail,
            password,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setIsLoading(false);
          const errorDetail =
            data.detail ||
            data.message ||
            `Unable to create account (HTTP ${response.status}). Please check the backend server logs.`;
          setErrors({ email: errorDetail });
          setAuthMessage(errorDetail);
          return;
        }

        const createdAccount = {
          id: data.id,
          name: data.name || name.trim(),
          email: data.email || normalizedEmail,
          role: data.role || "Personal Account",
          token: data.token,
        };

        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setErrors({});
        setAuthMessage("");
        enterDashboard(createdAccount);
        return;
      }

      // authMode === "signin"
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setIsLoading(false);
        const errorDetail =
          data.detail ||
          data.message ||
          `Sign-in failed (HTTP ${response.status}). Please check the backend server logs.`;
        setErrors({
          email: errorDetail,
          password: "Please check your password.",
        });
        setAuthMessage(errorDetail);
        return;
      }

      const loggedAccount = {
        id: data.id,
        name: data.name || normalizedEmail.split("@", 1)[0],
        email: data.email || normalizedEmail,
        role: data.role || "Personal Account",
        token: data.token,
      };

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setErrors({});
      setAuthMessage("");
      enterDashboard(loggedAccount);
    } catch (networkError) {
      console.warn("Could not reach the authentication server:", networkError);
      setIsLoading(false);
      setAuthMessage("Could not connect to the backend. Check that the FastAPI server is running and try again.");
    }
  }

  function handleDemoFill() {
    setAuthMode("signin");
    setName("");
    setEmail("alex.kumar@spendai.io");
    setPassword("password123");
    setConfirmPassword("password123");
    setErrors({});
    setAuthMessage("✨ Demo credentials loaded! Click Sign In to continue.");
  }

  function explainSocialLoginUnavailable(provider) {
    setAuthMessage(`${provider} sign-in is not configured yet. Use email and password instead.`);
  }

  if (transitionUser) {
    const firstName = transitionUser.name.trim().split(/\s+/)[0];

    return (
      <div className="login-transition" role="status" aria-live="polite">
        <div className="transition-glow transition-glow-one"></div>
        <div className="transition-glow transition-glow-two"></div>
        <div className="transition-content">
          <div className="transition-logo">
            <span className="transition-orbit"></span>
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
              <path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" />
            </svg>
          </div>
          <p className="transition-brand">SPENDAI</p>
          <h2>Welcome, {firstName}</h2>
          <p className="transition-message">Getting your expense dashboard ready</p>
          <div className="transition-progress" aria-hidden="true">
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-root">
      <div className="login-container">
        {/* Left Side: Brand Showcase & Value Proposition */}
        <div className="login-showcase">
          <div className="showcase-glow-1"></div>
          <div className="showcase-glow-2"></div>

          <div className="showcase-content">
            <div className="brand-header">
              <div className="brand-logo-pill">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
                  <path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" />
                </svg>
              </div>
              <div className="brand-title-wrap">
                <h1 className="brand-title">SpendAI</h1>
                <span className="brand-tagline">Expense Intelligence</span>
              </div>
            </div>

            <div className="showcase-body">
              <div className="showcase-badge">
                <span className="pulse-dot"></span>
                Next-Gen Expense Intelligence
              </div>

              <h2 className="showcase-heading">
                Take control of your finances with automated AI classification.
              </h2>

              <p className="showcase-subheading">
                Automatically categorize receipts, visualize spending trends, and receive
                monthly insights with AI-powered expense categorization.
              </p>

              {/* Floating Feature Cards Preview */}
              <div className="feature-cards-preview">
                <div className="feature-card preview-card-1">
                  <div className="feature-card-icon">⚡</div>
                  <div className="feature-card-text">
                    <strong>AI-Powered Categorization</strong>
                    <span>Gemini AI with rule-based fallback</span>
                  </div>
                </div>

                <div className="feature-card preview-card-2">
                  <div className="feature-card-icon">🔒</div>
                  <div className="feature-card-text">
                    <strong>Bank-Grade Privacy</strong>
                    <span>256-bit encrypted data isolation</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="showcase-footer">
              <div className="user-avatars-group">
                <div className="mini-avatar">AK</div>
                <div className="mini-avatar">JD</div>
                <div className="mini-avatar">SP</div>
              </div>
              <span>Trusted by 10,000+ smart professionals</span>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Login Card */}
        <div className="login-form-area">
          <div className="login-card">
            {/* Mobile Header (Shown on small screens) */}
            <div className="mobile-brand-header">
              <div className="brand-logo-pill">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
                  <path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" />
                </svg>
              </div>
              <div>
                <h2>SpendAI</h2>
                <span>Expense Intelligence</span>
              </div>
            </div>

            <div className="auth-mode-toggle">
              <button
                type="button"
                className={authMode === "signin" ? "mode-btn active" : "mode-btn"}
                onClick={() => {
                  setAuthMode("signin");
                  setErrors({});
                  setAuthMessage("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={authMode === "create" ? "mode-btn active" : "mode-btn"}
                onClick={() => {
                  setAuthMode("create");
                  setErrors({});
                  setAuthMessage("");
                }}
              >
                Create Account
              </button>
            </div>

            <div className="card-header">
              <h3>{authMode === "signin" ? "Welcome back" : "Create your account"}</h3>
              <p>
                {authMode === "signin"
                  ? "Sign in to access your AI expense workspace"
                  : "Create an account and start categorizing your spending"}
              </p>
            </div>

            {import.meta.env.DEV && (
              <div className="demo-credentials-banner">
                <div className="demo-icon">💡</div>
                <div className="demo-content">
                  <strong>Looking for a quick demo?</strong>
                  <span>Try one-click login with prefilled credentials.</span>
                </div>
                <button
                  type="button"
                  className="demo-action-btn"
                  onClick={handleDemoFill}
                >
                  Autofill Demo
                </button>
              </div>
            )}

            {authMessage && (
              <div className="auth-alert-message">
                <span>{authMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="login-form">
              {authMode === "create" && (
                <div className="login-field-group">
                  <label htmlFor="name">Full name</label>
                  <div className={`input-wrapper ${errors.name ? "input-error" : ""}`}>
                    <span className="input-icon">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21a8 8 0 0 0-16 0" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="name"
                      type="text"
                      placeholder="Alex Kumar"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                  {errors.name && <span className="field-error-text">{errors.name}</span>}
                </div>
              )}

              {/* Email Input */}
              <div className="login-field-group">
                <label htmlFor="email">Email address</label>
                <div className={`input-wrapper ${errors.email ? "input-error" : ""}`}>
                  <span className="input-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="alex.kumar@spendai.io"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="field-error-text">{errors.email}</span>}
              </div>

              {/* Password Input */}
              <div className="login-field-group">
                <div className="label-with-link">
                  <label htmlFor="password">Password</label>
                  <a
                    href="#forgot"
                    className="forgot-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setAuthMessage("🔒 For this demo, please use the Autofill Demo button above.");
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className={`input-wrapper ${errors.password ? "input-error" : ""}`}>
                  <span className="input-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    autoComplete={authMode === "create" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="field-error-text">{errors.password}</span>}
              </div>

              {authMode === "create" && (
                <div className="login-field-group">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <div className={`input-wrapper ${errors.confirmPassword ? "input-error" : ""}`}>
                    <span className="input-icon">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) {
                          setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                        }
                      }}
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="field-error-text">{errors.confirmPassword}</span>
                  )}
                </div>
              )}

              {/* Remember Me */}
              <div className="login-options-row">
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  <span>Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`login-submit-btn ${isLoading ? "btn-loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    <span>{authMode === "create" ? "Creating account..." : "Signing in..."}</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === "create" ? "Create Account" : "Sign In to SpendAI"}</span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <span>or sign in with</span>
            </div>

            {/* Social Logins */}
            <div className="social-buttons-grid">
              <button
                type="button"
                className="social-btn"
                onClick={() => explainSocialLoginUnavailable("Google")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="social-btn"
                onClick={() => explainSocialLoginUnavailable("GitHub")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                GitHub
              </button>
            </div>

            <div className="login-card-footer">
              <p>
                Don&apos;t have an account? Use the Create Account option above.
              </p>
              <div className="secure-badge">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Bank-grade 256-bit encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
