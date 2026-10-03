import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Login from "./Login.jsx";
import { predictCategory } from "./aiCategorizer.js";

const API_BASE_URL = "http://127.0.0.1:8000";

const categories = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health Care",
  "Other",
];

const categoryColors = {
  "Food & Dining": "#7c5cff",
  Transport: "#19b5fe",
  Shopping: "#ff8a65",
  "Bills & Utilities": "#f7b731",
  Entertainment: "#ef5da8",
  "Health Care": "#20c997",
  Other: "#9aa4b2",
};

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    grid: (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    receipt: (
      <svg {...common}>
        <path d="M5 3h14v18l-2-1.5L15 21l-3-1.5L9 21l-2-1.5L5 21V3Z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
    chart: (
      <svg {...common}>
        <path d="M4 19V5M4 19h17" />
        <path d="m7 15 4-5 3 3 5-7" />
      </svg>
    ),
    tag: (
      <svg {...common}>
        <path d="m20 13-7 7-10-10V4h6l11 9Z" />
        <circle cx="8" cy="8" r="1.2" />
      </svg>
    ),
    settings: (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6.4v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </svg>
    ),
    plus: (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    ),
    filter: (
      <svg {...common}>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </svg>
    ),
    arrowUp: (
      <svg {...common}>
        <path d="m5 12 7-7 7 7M12 5v14" />
      </svg>
    ),
    arrowDown: (
      <svg {...common}>
        <path d="m5 12 7 7 7-7M12 19V5" />
      </svg>
    ),
    wallet: (
      <svg {...common}>
        <path d="M4 6h15a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" />
        <path d="M16 13h4" />
      </svg>
    ),
    sparkles: (
      <svg {...common}>
        <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
        <path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    ),
    logout: (
      <svg {...common}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCategoryIcon(category) {
  const icons = {
    "Food & Dining": "🍔",
    Transport: "🚕",
    Shopping: "🛍️",
    "Bills & Utilities": "💡",
    Entertainment: "🎬",
    "Health Care": "💊",
    Other: "📦",
  };

  return icons[category] || "📦";
}

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("spendai_theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("spendai_theme", theme);
  }, [theme]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("spendai_authenticated") === "true";
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("spendai_user");
    try {
      return saved ? JSON.parse(saved) : { name: "Alex Kumar", email: "alex.kumar@spendai.io" };
    } catch {
      return { name: "Alex Kumar", email: "alex.kumar@spendai.io" };
    }
  });

  const [expenses, setExpenses] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [dashboardRange, setDashboardRange] = useState("1");
  const [analyticsRange, setAnalyticsRange] = useState("monthly");

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.email) {
      setExpenses([]);
      return undefined;
    }

    const controller = new AbortController();
    setExpenses([]);

    async function loadExpenses() {
      try {
        const response = await fetch(`${API_BASE_URL}/expenses`, {
          headers: { "X-User-Email": currentUser.email.trim().toLowerCase() },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to load expenses");
        const data = await response.json();
        if (Array.isArray(data)) {
          setExpenses(
            data.map((expense) => ({
              ...expense,
              amount: Number(expense.amount),
              confidence: Number(expense.confidence || 0),
            }))
          );
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Could not load expenses for this account:", error);
        }
      }
    }

    loadExpenses();

    return () => controller.abort();
  }, [isAuthenticated, currentUser?.email]);

  const emptyForm = {
    merchant: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    payment: "UPI",
  };

  const [form, setForm] = useState(emptyForm);

  function openAddExpenseModal() {
    setIsEditMode(false);
    setEditingExpenseId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditExpenseModal(expense) {
    setIsEditMode(true);
    setEditingExpenseId(expense.id);
    setForm({
      merchant: expense.merchant,
      amount: String(expense.amount),
      date: expense.date,
      payment: expense.payment || "UPI",
    });
    setShowModal(true);
  }

  const aiPrediction = useMemo(() => {
    return predictCategory({
      merchant: form.merchant,
      amount: form.amount,
    });
  }, [form.merchant, form.amount]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const transactionCount = expenses.length;

  const averageExpense =
    transactionCount > 0 ? totalSpent / transactionCount : 0;

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.merchant.toLowerCase().includes(search.toLowerCase()) ||
        expense.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || expense.category === categoryFilter;

      const matchesPayment =
        paymentFilter === "All" || expense.payment === paymentFilter;

      return matchesSearch && matchesCategory && matchesPayment;
    });
  }, [expenses, search, categoryFilter, paymentFilter]);

  const categoryData = useMemo(() => {
    return categories
      .map((category) => {
        const total = expenses
          .filter((expense) => expense.category === category)
          .reduce((sum, expense) => sum + expense.amount, 0);

        return {
          category,
          total,
          percentage: totalSpent ? (total / totalSpent) * 100 : 0,
        };
      })
      .filter((item) => item.total > 0);
  }, [expenses, totalSpent]);

  const monthlyData = useMemo(() => {
    const baseMonthlyValues = [
      { month: "Apr", value: 4800 },
      { month: "May", value: 6100 },
      { month: "Jun", value: 5400 },
      { month: "Jul", value: 7200 },
      { month: "Aug", value: 6800 },
      { month: "Sep", value: totalSpent },
    ];

    if (dashboardRange === "1") {
      return [
        { month: "W1", value: Math.max(1200, totalSpent * 0.22) },
        { month: "W2", value: Math.max(1400, totalSpent * 0.28) },
        { month: "W3", value: Math.max(1300, totalSpent * 0.25) },
        { month: "W4", value: Math.max(1500, totalSpent * 0.3) },
      ];
    }

    if (dashboardRange === "2") {
      return [
        { month: "W1", value: Math.max(1500, totalSpent * 0.2) },
        { month: "W2", value: Math.max(1900, totalSpent * 0.28) },
        { month: "W3", value: Math.max(1700, totalSpent * 0.26) },
        { month: "W4", value: Math.max(2100, totalSpent * 0.32) },
      ];
    }

    if (dashboardRange === "12") {
      return [
        { month: "Jan", value: 3400 },
        { month: "Feb", value: 4200 },
        { month: "Mar", value: 3900 },
        { month: "Apr", value: 4800 },
        { month: "May", value: 6100 },
        { month: "Jun", value: 5400 },
        { month: "Jul", value: 7200 },
        { month: "Aug", value: 6800 },
        { month: "Sep", value: totalSpent },
      ];
    }

    return baseMonthlyValues;
  }, [dashboardRange, totalSpent]);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveExpense(event) {
    event.preventDefault();

    if (!form.merchant.trim() || !form.amount) return;

    const prediction = predictCategory({
      merchant: form.merchant,
      amount: form.amount,
    });

    const payload = {
      merchant: form.merchant.trim(),
      amount: Number(form.amount),
      date: form.date,
      category: prediction.category,
      payment: form.payment,
      confidence: prediction.confidence,
      notes: "Added via SpendAI app",
    };

    const endpoint = isEditMode && editingExpenseId
      ? `${API_BASE_URL}/expenses/${editingExpenseId}`
      : `${API_BASE_URL}/expenses`;
    const method = isEditMode && editingExpenseId ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": currentUser.email.trim().toLowerCase(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save expense");
      }

      const savedExpense = await response.json();
      const normalizedExpense = {
        ...savedExpense,
        amount: Number(savedExpense.amount),
        confidence: Number(savedExpense.confidence || 0),
      };

      setExpenses((previous) => {
        if (isEditMode && editingExpenseId) {
          return previous.map((expense) =>
            expense.id === editingExpenseId ? normalizedExpense : expense
          );
        }

        return [normalizedExpense, ...previous];
      });
    } catch (error) {
      console.warn("Could not save to backend. Saving locally instead.", error);
      const localExpense = {
        id: isEditMode && editingExpenseId ? editingExpenseId : Date.now(),
        ...payload,
      };

      setExpenses((previous) => {
        if (isEditMode && editingExpenseId) {
          return previous.map((expense) =>
            expense.id === editingExpenseId ? localExpense : expense
          );
        }
        return [localExpense, ...previous];
      });
    }

    setForm(emptyForm);
    setIsEditMode(false);
    setEditingExpenseId(null);
    setShowModal(false);
    setActivePage("expenses");
  }

  async function deleteExpense(expenseId) {
    if (!window.confirm("Delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
        method: "DELETE",
        headers: {
          "X-User-Email": currentUser.email.trim().toLowerCase(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      setExpenses((previous) => previous.filter((expense) => expense.id !== expenseId));
    } catch (error) {
      console.warn("Could not delete from backend. Removing locally instead.", error);
      setExpenses((previous) => previous.filter((expense) => expense.id !== expenseId));
    }
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("All");
    setPaymentFilter("All");
  }

  function handleLogin(userData) {
    const account = {
      ...userData,
      email: userData.email.trim().toLowerCase(),
    };
    setExpenses([]);
    setIsAuthenticated(true);
    setCurrentUser(account);
    localStorage.setItem("spendai_authenticated", "true");
    localStorage.setItem("spendai_user", JSON.stringify(account));
  }

  function handleLogout() {
    setExpenses([]);
    setIsAuthenticated(false);
    localStorage.removeItem("spendai_authenticated");
    localStorage.removeItem("spendai_user");
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <Icon name="sparkles" size={22} />
          </div>

          <div>
            <h1>SpendAI</h1>
            <span>Expense Intelligence</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MAIN MENU</p>

          <button
            className={`nav-item ${activePage === "dashboard" ? "active" : ""
              }`}
            onClick={() => setActivePage("dashboard")}
          >
            <Icon name="grid" />
            Dashboard
          </button>

          <button
            className={`nav-item ${activePage === "expenses" ? "active" : ""
              }`}
            onClick={() => setActivePage("expenses")}
          >
            <Icon name="receipt" />
            Expenses
            <span className="nav-count">{expenses.length}</span>
          </button>

          <button
            className={`nav-item ${activePage === "analytics" ? "active" : ""
              }`}
            onClick={() => setActivePage("analytics")}
          >
            <Icon name="chart" />
            Analytics
          </button>

          <button
            className={`nav-item ${activePage === "categories" ? "active" : ""
              }`}
            onClick={() => setActivePage("categories")}
          >
            <Icon name="tag" />
            Categories
          </button>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">SYSTEM</p>

          <button
            className={`nav-item ${activePage === "settings" ? "active" : ""
              }`}
            onClick={() => setActivePage("settings")}
          >
            <Icon name="settings" />
            Settings
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="ai-card">
            <div className="ai-icon">
              <Icon name="sparkles" size={18} />
            </div>

            <div>
              <strong>AI Categorizer</strong>
              <p>Smart categorization is active</p>
            </div>

            <span className="status-dot"></span>
          </div>

          <div className="profile">
            <div className="avatar">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="profile-info">
              <strong>{currentUser?.name || "Alex Kumar"}</strong>
              <span>{currentUser?.email || "Personal Account"}</span>
            </div>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
              title="Sign out to Login screen"
              aria-label="Sign out"
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / {activePage}</p>
            <h2>
              {activePage === "dashboard"
                ? `Good morning, ${currentUser?.name ? currentUser.name.split(" ")[0] : "Alex"} 👋`
                : activePage.charAt(0).toUpperCase() + activePage.slice(1)}
            </h2>
          </div>

          <div className="topbar-actions">
            <div className="date-chip">
              <Icon name="calendar" size={17} />
              September 2026
            </div>

            <button className="add-btn" onClick={openAddExpenseModal}>
              <Icon name="plus" size={18} />
              Add Expense
            </button>
          </div>
        </header>

        {activePage === "dashboard" && (
          <>
            <section className="welcome-banner">
              <div>
                <div className="eyebrow">
                  <span className="pulse"></span>
                  AI EXPENSE INSIGHTS
                </div>

                <h3>Your spending, intelligently organized.</h3>

                <p>
                  Track your expenses and let AI automatically categorize every
                  transaction.
                </p>
              </div>

              <button
                className="banner-button"
                onClick={openAddExpenseModal}
              >
                <Icon name="plus" size={17} />
                Add new expense
              </button>
            </section>

            <section className="stats-grid">
              <StatCard
                title="Total Spending"
                value={formatCurrency(totalSpent)}
                subtitle="This month"
                trend="+12.5%"
                positive={false}
                icon="wallet"
                color="purple"
              />

              <StatCard
                title="Transactions"
                value={transactionCount}
                subtitle="This month"
                trend="+8.2%"
                positive
                icon="receipt"
                color="blue"
              />

              <StatCard
                title="Avg. Expense"
                value={formatCurrency(averageExpense)}
                subtitle="Per transaction"
                trend="-3.4%"
                positive
                icon="chart"
                color="orange"
              />

              <StatCard
                title="AI Accuracy"
                value="95.4%"
                subtitle="Categorization"
                trend="+2.1%"
                positive
                icon="sparkles"
                color="green"
              />
            </section>

            <section className="dashboard-grid">
              <div className="panel spending-panel">
                <div className="panel-header">
                  <div>
                    <h3>Spending Overview</h3>
                    <p>Monthly spending trend</p>
                  </div>

                  <select
                    className="small-select"
                    value={dashboardRange}
                    onChange={(event) => setDashboardRange(event.target.value)}
                  >
                    <option value="1">Last 1 week</option>
                    <option value="2">Last 1 month</option>
                    <option value="6">Last 6 months</option>
                    <option value="12">Last 12 months</option>
                  </select>
                </div>

                <div className="chart">
                  <div className="y-axis">
                    <span>₹8k</span>
                    <span>₹6k</span>
                    <span>₹4k</span>
                    <span>₹2k</span>
                    <span>₹0</span>
                  </div>

                  <div className="chart-area">
                    <div className="grid-lines">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                    <div className="bars">
                      {monthlyData.map((item) => (
                        <div className="bar-column" key={item.month}>
                          <div
                            className="bar"
                            style={{
                              height: `${Math.max(
                                12,
                                (item.value / Math.max(...monthlyData.map((entry) => entry.value), 1)) * 100
                              )}%`,
                            }}
                            title={`${item.month}: ${formatCurrency(
                              item.value
                            )}`}
                          >
                            {(item.month === "Sep" || item.month === "W4" || item.month === "Dec") && (
                              <span className="bar-tooltip">
                                {formatCurrency(item.value)}
                              </span>
                            )}
                          </div>

                          <span>{item.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel category-panel">
                <div className="panel-header">
                  <div>
                    <h3>Spending by Category</h3>
                    <p>Where your money goes</p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActivePage("categories")}
                  >
                    View all
                  </button>
                </div>

                <div className="donut-wrapper">
                  <div
                    className="donut"
                    style={{
                      background: `conic-gradient(
                        ${categoryData
                          .map((item, index) => {
                            const previous = categoryData
                              .slice(0, index)
                              .reduce(
                                (sum, category) => sum + category.percentage,
                                0
                              );

                            return `${categoryColors[item.category]} ${previous}% ${previous + item.percentage
                              }%`;
                          })
                          .join(", ")}
                      )`,
                    }}
                  >
                    <div className="donut-center">
                      <strong>{formatCurrency(totalSpent)}</strong>
                      <span>Total spend</span>
                    </div>
                  </div>

                  <div className="legend">
                    {categoryData.slice(0, 5).map((item) => (
                      <div className="legend-item" key={item.category}>
                        <div className="legend-name">
                          <span
                            className="legend-dot"
                            style={{
                              background: categoryColors[item.category],
                            }}
                          ></span>

                          {item.category}
                        </div>

                        <strong>{Math.round(item.percentage)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="panel transactions-panel">
              <div className="panel-header">
                <div>
                  <h3>Recent Expenses</h3>
                  <p>Your latest transactions</p>
                </div>

                <button
                  className="text-button"
                  onClick={() => setActivePage("expenses")}
                >
                  View all expenses →
                </button>
              </div>

              <ExpenseTable expenses={expenses.slice(0, 5)} onEdit={openEditExpenseModal} onDelete={deleteExpense} />
            </section>
          </>
        )}

        {activePage === "expenses" && (
          <section>
            <div className="page-heading">
              <div>
                <h3>All Expenses</h3>
                <p>Search, filter and manage your transactions.</p>
              </div>

              <button className="add-btn" onClick={openAddExpenseModal}>
                <Icon name="plus" size={18} />
                Add Expense
              </button>
            </div>

            <div className="panel">
              <div className="toolbar">
                <div className="search-box">
                  <Icon name="search" size={18} />
                  <input
                    type="text"
                    placeholder="Search merchant or category..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <button
                  className={`filter-button ${showFilters ? "filter-active" : ""
                    }`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Icon name="filter" size={17} />
                  Filters
                </button>

                {(search ||
                  categoryFilter !== "All" ||
                  paymentFilter !== "All") && (
                    <button className="clear-button" onClick={resetFilters}>
                      Clear
                    </button>
                  )}
              </div>

              {showFilters && (
                <div className="filter-row">
                  <div>
                    <label>Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(event) =>
                        setCategoryFilter(event.target.value)
                      }
                    >
                      <option>All</option>
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Payment Method</label>
                    <select
                      value={paymentFilter}
                      onChange={(event) =>
                        setPaymentFilter(event.target.value)
                      }
                    >
                      <option>All</option>
                      <option>UPI</option>
                      <option>Credit Card</option>
                      <option>Debit Card</option>
                      <option>Cash</option>
                    </select>
                  </div>
                </div>
              )}

              <ExpenseTable expenses={filteredExpenses} onEdit={openEditExpenseModal} onDelete={deleteExpense} />
            </div>
          </section>
        )}

        {activePage === "analytics" && (
          <Analytics
            totalSpent={totalSpent}
            expenses={expenses}
            categoryData={categoryData}
            monthlyData={monthlyData}
            analyticsRange={analyticsRange}
            setAnalyticsRange={setAnalyticsRange}
          />
        )}

        {activePage === "categories" && (
          <Categories
            categoryData={categoryData}
            totalSpent={totalSpent}
            expenses={expenses}
          />
        )}

        {activePage === "settings" && <Settings theme={theme} setTheme={setTheme} />}
      </main>

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title-icon">
                  <Icon name="sparkles" size={21} />
                </div>

                <h3>{isEditMode ? "Edit Expense" : "Add Expense"}</h3>
                <p>AI will automatically categorize your expense.</p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveExpense}>
              <div className="form-group">
                <label>Merchant / Expense Name</label>
                <input
                  name="merchant"
                  value={form.merchant}
                  onChange={handleInputChange}
                  placeholder="e.g. Starbucks, Uber, Amazon"
                  autoFocus
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>

                  <div className="amount-input">
                    <span>₹</span>
                    <input
                      type="number"
                      name="amount"
                      min="1"
                      value={form.amount}
                      onChange={handleInputChange}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  name="payment"
                  value={form.payment}
                  onChange={handleInputChange}
                >
                  <option>UPI</option>
                  <option>Credit Card</option>
                  <option>Debit Card</option>
                  <option>Cash</option>
                </select>
              </div>

              {/* AI Category Prediction Display */}
              <div
                className={`ai-prediction-card ${aiPrediction.isPending ? "is-pending" : "is-active"
                  }`}
              >
                <div className="ai-prediction-header">
                  <div className="ai-prediction-badge">
                    <Icon name="sparkles" size={15} />
                    <span>AI PREDICTED CATEGORY</span>
                  </div>

                  {!aiPrediction.isPending && (
                    <span
                      className={`ai-confidence-pill ${aiPrediction.confidence >= 85
                          ? "high"
                          : aiPrediction.confidence >= 70
                            ? "medium"
                            : "low"
                        }`}
                    >
                      Confidence: {aiPrediction.confidence}%
                    </span>
                  )}
                </div>

                {aiPrediction.isPending ? (
                  <div className="ai-prediction-empty">
                    <div className="ai-empty-sparkle">
                      <Icon name="sparkles" size={20} />
                    </div>
                    <p>
                      Enter expense merchant/description and amount to predict category automatically with AI.
                    </p>
                  </div>
                ) : (
                  <div className="ai-prediction-details">
                    <div className="ai-prediction-headline">
                      <div className="ai-category-hero">
                        <span className="ai-category-icon-box">
                          {aiPrediction.icon}
                        </span>
                        <div>
                          <span className="ai-prediction-label">
                            AI Predicted Category:
                          </span>
                          <h4 className="ai-prediction-name">
                            {aiPrediction.icon} {aiPrediction.category}
                          </h4>
                        </div>
                      </div>

                      <div className="ai-confidence-numeric">
                        <span className="ai-confidence-label">Confidence:</span>
                        <strong className="ai-confidence-value">
                          {aiPrediction.confidence}%
                        </strong>
                      </div>
                    </div>

                    <div className="ai-confidence-meter">
                      <div className="ai-meter-track">
                        <div
                          className={`ai-meter-fill ${aiPrediction.confidence >= 85
                              ? "high"
                              : aiPrediction.confidence >= 70
                                ? "medium"
                                : "low"
                            }`}
                          style={{ width: `${aiPrediction.confidence}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="ai-prediction-footnote">
                      <span className="ai-reason-pill">
                        <Icon name="sparkles" size={13} />
                        {aiPrediction.reasoning}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="save-button add-expense-submit">
                  <Icon name="sparkles" size={15} />
                  {isEditMode ? "Save Changes" : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
  positive,
  icon,
  color,
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${color}`}>
          <Icon name={icon} size={20} />
        </div>

        <span className={`trend ${positive ? "trend-positive" : ""}`}>
          {positive ? (
            <Icon name="arrowDown" size={13} />
          ) : (
            <Icon name="arrowUp" size={13} />
          )}
          {trend}
        </span>
      </div>

      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </div>
  );
}

function ExpenseTable({ expenses, onEdit, onDelete }) {
  if (!expenses.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔎</div>
        <h4>No expenses found</h4>
        <p>Try changing your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="expense-table">
        <thead>
          <tr>
            <th>MERCHANT</th>
            <th>DATE</th>
            <th>CATEGORY</th>
            <th>PAYMENT</th>
            <th>AI CONFIDENCE</th>
            <th className="amount-column">AMOUNT</th>
            <th className="action-column">ACTIONS</th>
          </tr>
        </thead>

        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>
                <div className="merchant-cell">
                  <div
                    className="merchant-icon"
                    style={{
                      background: `${categoryColors[expense.category]}18`,
                    }}
                  >
                    {getCategoryIcon(expense.category)}
                  </div>

                  <strong>{expense.merchant}</strong>
                </div>
              </td>

              <td className="muted-cell">{formatDate(expense.date)}</td>

              <td>
                <span
                  className="category-badge"
                  style={{
                    color: categoryColors[expense.category],
                    background: `${categoryColors[expense.category]}14`,
                  }}
                >
                  {expense.category}
                </span>
              </td>

              <td className="muted-cell">{expense.payment}</td>

              <td>
                <div className="confidence">
                  <div className="confidence-bar">
                    <span
                      style={{
                        width: `${expense.confidence}%`,
                      }}
                    ></span>
                  </div>

                  <strong>{expense.confidence}%</strong>
                </div>
              </td>

              <td className="amount-column">
                <strong>{formatCurrency(expense.amount)}</strong>
              </td>

              <td className="action-column">
                <div className="row-actions">
                  <button type="button" className="row-action edit" onClick={() => onEdit(expense)}>
                    Edit
                  </button>
                  <button type="button" className="row-action delete" onClick={() => onDelete(expense.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Analytics({ totalSpent, expenses, categoryData, monthlyData, analyticsRange, setAnalyticsRange }) {
  const highestCategory = [...categoryData].sort(
    (a, b) => b.total - a.total
  )[0];

  const largestExpense = [...expenses].sort(
    (a, b) => b.amount - a.amount
  )[0];

  const chartData =
    analyticsRange === "weekly"
      ? [
          { label: "W1", value: 1800 },
          { label: "W2", value: 2600 },
          { label: "W3", value: 2100 },
          { label: "W4", value: 3200 },
        ]
      : analyticsRange === "yearly"
        ? [
            { label: "2021", value: 32000 },
            { label: "2022", value: 48000 },
            { label: "2023", value: 42000 },
            { label: "2024", value: 56000 },
            { label: "2025", value: 61000 },
          ]
        : monthlyData;

  const rangeLabel =
    analyticsRange === "weekly"
      ? "This month"
      : analyticsRange === "yearly"
        ? "Last 5 years"
        : "Last 6 months";

  return (
    <section>
      <div className="page-heading">
        <div>
          <h3>Analytics</h3>
          <p>Understand your spending patterns and financial behavior.</p>
        </div>
      </div>

      <div className="analytics-highlight-grid">
        <div className="analytics-highlight">
          <span>{analyticsRange === "weekly" ? "Weekly spending" : analyticsRange === "yearly" ? "Yearly spending" : "Monthly spending"}</span>
          <strong>{formatCurrency(totalSpent)}</strong>
          <small>
            {analyticsRange === "weekly"
              ? "Current week"
              : analyticsRange === "yearly"
                ? "2025"
                : "September 2026"}
          </small>
        </div>

        <div className="analytics-highlight">
          <span>Top category</span>
          <strong>{highestCategory?.category || "—"}</strong>
          <small>
            {highestCategory
              ? formatCurrency(highestCategory.total)
              : "No data"}
          </small>
        </div>

        <div className="analytics-highlight">
          <span>Largest expense</span>
          <strong>
            {largestExpense ? formatCurrency(largestExpense.amount) : "—"}
          </strong>
          <small>{largestExpense?.merchant || "No data"}</small>
        </div>
      </div>

      <div className="analytics-toolbar">
        <div className="chip-group">
          {[
            { key: "monthly", label: "Monthly" },
            { key: "weekly", label: "Weekly" },
            { key: "yearly", label: "Yearly" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              className={`range-chip ${analyticsRange === option.key ? "active" : ""}`}
              onClick={() => setAnalyticsRange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>{analyticsRange === "weekly" ? "Weekly Spending Trend" : analyticsRange === "yearly" ? "Yearly Spending Trend" : "Monthly Spending Trend"}</h3>
              <p>{rangeLabel}</p>
            </div>
          </div>

          <div className="large-chart">
            {chartData.map((item) => (
              <div className="large-bar-column" key={item.label || item.month}>
                <span className="large-value">
                  {analyticsRange === "yearly"
                    ? `₹${Math.round(item.value / 1000)}k`
                    : `₹${Math.round(item.value / 100) / 10}k`}
                </span>

                <div
                  className="large-bar"
                  style={{
                    height: `${Math.max(15, (item.value / (analyticsRange === "yearly" ? 70000 : 8000)) * 100)}%`,
                  }}
                ></div>

                <span>{item.label || item.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Category Breakdown</h3>
              <p>Percentage of total spending</p>
            </div>
          </div>

          <div className="analytics-category-list">
            {categoryData.map((item) => (
              <div className="analytics-category" key={item.category}>
                <div className="analytics-category-top">
                  <span>
                    <i
                      style={{
                        background: categoryColors[item.category],
                      }}
                    ></i>
                    {item.category}
                  </span>

                  <strong>{formatCurrency(item.total)}</strong>
                </div>

                <div className="progress-track">
                  <span
                    style={{
                      width: `${item.percentage}%`,
                      background: categoryColors[item.category],
                    }}
                  ></span>
                </div>

                <small>{Math.round(item.percentage)}% of spending</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories({ categoryData, totalSpent, expenses }) {
  return (
    <section>
      <div className="page-heading">
        <div>
          <h3>Expense Categories</h3>
          <p>AI-generated classification of your expenses.</p>
        </div>
      </div>

      <div className="category-cards">
        {categories.map((category) => {
          const data = categoryData.find(
            (item) => item.category === category
          );

          const total = data?.total || 0;
          const count = expenses.filter(
            (expense) => expense.category === category
          ).length;

          const percentage = totalSpent
            ? Math.round((total / totalSpent) * 100)
            : 0;

          return (
            <div className="category-card" key={category}>
              <div
                className="category-large-icon"
                style={{
                  background: `${categoryColors[category]}18`,
                }}
              >
                {getCategoryIcon(category)}
              </div>

              <h4>{category}</h4>

              <strong>{formatCurrency(total)}</strong>

              <div className="category-card-footer">
                <span>{count} transactions</span>
                <span>{percentage}%</span>
              </div>

              <div className="progress-track">
                <span
                  style={{
                    width: `${percentage}%`,
                    background: categoryColors[category],
                  }}
                ></span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Settings({ theme, setTheme }) {
  return (
    <section>
      <div className="page-heading">
        <div>
          <h3>Settings</h3>
          <p>Configure your expense categorizer.</p>
        </div>
      </div>

      <div className="panel settings-panel">
        <div className="settings-row">
          <div>
            <h4>Theme</h4>
            <p>Switch between light and dark mode.</p>
          </div>

          <div className="theme-control">
            <span className={`theme-mode ${theme === "light" ? "active" : ""}`}>
              Light
            </span>

            <label className="switch" aria-label="Toggle theme">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={(event) =>
                  setTheme(event.target.checked ? "dark" : "light")
                }
              />
              <span></span>
            </label>

            <span className={`theme-mode ${theme === "dark" ? "active" : ""}`}>
              Dark
            </span>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <h4>AI Categorization</h4>
            <p>
              Automatically classify transactions using your AI model.
            </p>
          </div>

          <label className="switch">
            <input type="checkbox" defaultChecked />
            <span></span>
          </label>
        </div>

        <div className="settings-row">
          <div>
            <h4>Confidence indicators</h4>
            <p>Show AI confidence scores in your expense table.</p>
          </div>

          <label className="switch">
            <input type="checkbox" defaultChecked />
            <span></span>
          </label>
        </div>

        <div className="settings-row">
          <div>
            <h4>Currency</h4>
            <p>Default currency for your expenses.</p>
          </div>

          <select className="settings-select">
            <option>Indian Rupee (₹)</option>
            <option>US Dollar ($)</option>
            <option>Euro (€)</option>
          </select>
        </div>
      </div>
    </section>
  );
}

export default App;
