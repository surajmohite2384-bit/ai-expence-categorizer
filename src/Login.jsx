import { useState } from "react";
import "./Login.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

function formatFullName(value, preserveTrailingSpace = false) {
  const endsWithSpace = /\s$/.test(value);
  const formattedName = value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return preserveTrailingSpace && endsWithSpace && formattedName
    ? `${formattedName} `
    : formattedName;
}

async function readResponseBody(response) {
  const body = await response.text();
  if (!body) return { data: {}, text: "" };

  try {
    return { data: JSON.parse(body), text: "" };
  } catch {
    return { data: {}, text: body };
  }
}

function authFailureMessage({ data, text, status, action }) {
  const detail = typeof data?.detail === "string" ? data.detail : "";
  const serverText = `${detail} ${text}`.slice(0, 500);

  if (/ECONNREFUSED|ECONNRESET|failed to proxy|proxy error|could not connect/i.test(serverText)) {
    return "SpendAI couldn't reach the backend. Start the FastAPI server and try again.";
  }

  if (/database (is )?unavailable/i.test(detail) || status === 503) {
    return "SpendAI's database is unavailable right now. Check the backend database connection and try again.";
  }

  if (/already exists|duplicate/i.test(detail) || status === 409) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (Array.isArray(data?.detail) && status === 422) {
    const fields = [...new Set(data.detail
      .map((issue) => issue?.loc?.at(-1))
      .filter((field) => ["name", "email", "password"].includes(field)))];
    if (fields.length) {
      return `Please check your ${fields.map((field) => (
        field === "name" ? "full name" : field
      )).join(", ")} and try again.`;
    }
    return "Some of the submitted details are invalid. Please review the form and try again.";
  }

  if (/full name is required/i.test(detail)) {
    return "Please enter your full name.";
  }
  if (/valid email address is required/i.test(detail)) {
    return "Please enter a valid email address.";
  }
  if (/password must be at least 6 characters/i.test(detail)) {
    return "Your password must be at least 6 characters.";
  }
  if (/password is required/i.test(detail)) {
    return "Please enter your password.";
  }

  if (status === 401) {
    return "We couldn't sign you in. Check your email and password, then try again.";
  }
  if (status >= 500) {
    return `The backend couldn't complete the ${action} request (HTTP ${status}). Check that its database is configured and available, then try again.`;
  }

  return action === "create your account"
    ? "We couldn't create your account. Please check your details and try again."
    : "We couldn't sign you in. Check your email and password, then try again.";
}

export default function Login({ onLogin }) {
  const [authMode, setAuthMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [transitionUser, setTransitionUser] = useState(null);

  function enterDashboard(account) {
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
    const formattedName = formatFullName(name);

    try {
      if (authMode === "create") {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: formattedName,
            email: normalizedEmail,
            password,
          }),
        });

        const { data, text } = await readResponseBody(response);

        if (!response.ok) {
          setIsLoading(false);
          setErrors({});
          setAuthMessage(authFailureMessage({
            data,
            text,
            status: response.status,
            action: "create your account",
          }));
          return;
        }

        const createdAccount = {
          id: data.id,
          name: data.name || formattedName,
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

      const { data, text } = await readResponseBody(response);

      if (!response.ok) {
        setIsLoading(false);
        setErrors({});
        setAuthMessage(authFailureMessage({
          data,
          text,
          status: response.status,
          action: "sign in",
        }));
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
                Make sense of every expense, automatically.
              </h2>

              <p className="showcase-subheading">
                Categorize transactions with AI, track spending patterns, and explore
                clear reports from one simple workspace.
              </p>

              {/* Floating Feature Cards Preview */}
              <div className="feature-cards-preview">
                <div className="feature-card preview-card-1">
                  <div className="feature-card-icon">⚡</div>
                  <div className="feature-card-text">
                    <strong>AI-Powered Categorization</strong>
                    <span>Organize transactions as you add them</span>
                  </div>
                </div>

                <div className="feature-card preview-card-2">
                  <div className="feature-card-icon">🔒</div>
                  <div className="feature-card-text">
                    <strong>Privacy &amp; Security</strong>
                    <span>Email and password protected access</span>
                  </div>
                </div>
              </div>
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
                aria-pressed={authMode === "signin"}
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
                aria-pressed={authMode === "create"}
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
              ? "Sign in to access your expense workspace."
              : "Create an account to get started."}
              </p>
            </div>

            {authMessage && (
              <div className="auth-alert-message" role="alert" aria-live="polite">
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
                        const inputValue = e.target.value;
                        const cursorPosition = e.target.selectionStart ?? inputValue.length;
                        const formattedValue = formatFullName(inputValue, true);
                        const formattedCursor = formatFullName(
                          inputValue.slice(0, cursorPosition),
                          true
                        ).length;
                        setName(formattedValue);
                        if (formattedValue !== inputValue) {
                          requestAnimationFrame(() => {
                            e.target.setSelectionRange(formattedCursor, formattedCursor);
                          });
                        }
                        if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      onBlur={() => setName(formatFullName(name))}
                      autoComplete="name"
                      autoFocus
                      required
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                  </div>
                  {errors.name && <span id="name-error" className="field-error-text">{errors.name}</span>}
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
                    required
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && <span id="email-error" className="field-error-text">{errors.email}</span>}
              </div>

              {/* Password Input */}
              <div className="login-field-group">
                <label htmlFor="password">Password</label>
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
                    required
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                {errors.password && <span id="password-error" className="field-error-text">{errors.password}</span>}
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
                      required
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span id="confirm-password-error" className="field-error-text">{errors.confirmPassword}</span>
                  )}
                </div>
              )}

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

          </div>
        </div>
      </div>
    </div>
  );
}
