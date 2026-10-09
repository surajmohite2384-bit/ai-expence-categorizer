import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Login from "./Login.jsx";
import { predictCategory } from "./aiCategorizer.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

const categories = [
  "Food",
  "Groceries",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Other",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const categoryColors = {
  Food: "#7c5cff",
  Groceries: "#20c997",
  Shopping: "#ff8a65",
  Transportation: "#19b5fe",
  "Bills & Utilities": "#f7b731",
  Entertainment: "#ef5da8",
  Healthcare: "#20c997",
  Education: "#7057e8",
  Travel: "#19b5fe",
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
    download: (
      <svg {...common}>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
        <path d="M5 17v3h14v-3" />
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

const CURRENCY_CONFIG = {
  INR: { code: "INR", symbol: "\u20B9", locale: "en-IN", name: "Indian Rupee (\u20B9)" },
};

function formatCurrency(value, currency = "INR") {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatChartAxisValue(value, currency = "INR") {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR;
  const symbol = config.symbol;
  if (value >= 1000) {
    return `${symbol}${Number((value / 1000).toFixed(1))}k`;
  }

  return `${symbol}${Math.round(value || 0)}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseLocalDateOnly(value) {
  const match = String(value || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
    ? date
    : null;
}

function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCategoryIcon(category) {
  const icons = {
    "Food & Dining": "\u{1F354}",
    Transport: "\u{1F695}",
    Shopping: "\u{1F6CD}\uFE0F",
    "Bills & Utilities": "\u{1F4A1}",
    Entertainment: "\u{1F3AC}",
    "Health Care": "\u{1F48A}",
    Other: "\u{1F4E6}",
  };

  return icons[category] || "\u{1F4E6}";
}

function exportExpensesToCSV(expenses, currency = "INR") {
  if (!expenses || expenses.length === 0) {
    alert("No expenses recorded to export.");
    return;
  }

  const headers = [
    "ID",
    "Merchant",
    "Amount",
    "Currency",
    "Date",
    "Category",
    "Payment Method",
    "AI Confidence",
    "Notes",
  ];

  const rows = expenses.map((e) => [
    e.id,
    `"${String(e.merchant || "").replace(/"/g, '""')}"`,
    e.amount,
    currency,
    e.date,
    `"${String(e.category || "").replace(/"/g, '""')}"`,
    `"${String(e.payment || "").replace(/"/g, '""')}"`,
    `${e.confidence || 0}%`,
    `"${String(e.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `spendai_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function computeAnalyticsData(expenses, range) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const parseExpenseDate = (exp) => {
    if (!exp.date) return null;
    const d = new Date(String(exp.date).slice(0, 10) + "T00:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  };

  if (range === "weekly") {
    // Last 4 weekly buckets ending at today
    const buckets = [];
    for (let i = 3; i >= 0; i--) {
      const end = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);

      const label = `W${4 - i}`;
      const dateRangeLabel = `${start.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })}`;

      const bucketExpenses = expenses.filter((e) => {
        const d = parseExpenseDate(e);
        return d && d >= start && d <= end;
      });

      const value = bucketExpenses.reduce((sum, e) => sum + e.amount, 0);
      buckets.push({
        label,
        dateRangeLabel,
        value,
        expenses: bucketExpenses,
        start,
        end,
      });
    }

    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;
    const rangeExpenses = expenses.filter((e) => {
      const d = parseExpenseDate(e);
      return d && d >= rangeStart && d <= rangeEnd;
    });

    const total = buckets.reduce((sum, b) => sum + b.value, 0);
    return {
      chartData: buckets,
      rangeExpenses,
      rangeTotal: total,
      rangeLabel: `Last 4 weeks (${buckets[0].dateRangeLabel.split("-")[0].trim()} - Today)`,
      periodSubtitle: "Past 4 weeks",
    };
  }

  if (range === "yearly") {
    const currentYear = today.getFullYear();
    const buckets = [];
    for (let y = currentYear - 4; y <= currentYear; y++) {
      const start = new Date(y, 0, 1, 0, 0, 0);
      const end = new Date(y, 11, 31, 23, 59, 59);
      const label = String(y);

      const bucketExpenses = expenses.filter((e) => {
        const d = parseExpenseDate(e);
        return d && d >= start && d <= end;
      });

      const value = bucketExpenses.reduce((sum, e) => sum + e.amount, 0);
      buckets.push({
        label,
        dateRangeLabel: String(y),
        value,
        expenses: bucketExpenses,
        start,
        end,
      });
    }

    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;
    const rangeExpenses = expenses.filter((e) => {
      const d = parseExpenseDate(e);
      return d && d >= rangeStart && d <= rangeEnd;
    });

    const total = buckets.reduce((sum, b) => sum + b.value, 0);
    return {
      chartData: buckets,
      rangeExpenses,
      rangeTotal: total,
      rangeLabel: `Last 5 years (${currentYear - 4} - ${currentYear})`,
      periodSubtitle: `${currentYear - 4} - ${currentYear}`,
    };
  }

  // Monthly: Last 6 calendar months
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(today.getFullYear(), today.getMonth() - i, 1, 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59);
    const label = start.toLocaleDateString("en-IN", { month: "short" });
    const dateRangeLabel = start.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });

    const bucketExpenses = expenses.filter((e) => {
      const d = parseExpenseDate(e);
      return d && d >= start && d <= end;
    });

    const value = bucketExpenses.reduce((sum, e) => sum + e.amount, 0);
    buckets.push({
      label,
      dateRangeLabel,
      value,
      expenses: bucketExpenses,
      start,
      end,
    });
  }

  const rangeStart = buckets[0].start;
  const rangeEnd = buckets[buckets.length - 1].end;
  const rangeExpenses = expenses.filter((e) => {
    const d = parseExpenseDate(e);
    return d && d >= rangeStart && d <= rangeEnd;
  });

  const total = buckets.reduce((sum, b) => sum + b.value, 0);
  return {
    chartData: buckets,
    rangeExpenses,
    rangeTotal: total,
    rangeLabel: "Last 6 months",
    periodSubtitle: buckets[buckets.length - 1].dateRangeLabel,
  };
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

  // Clean token handling on session changes

  const [currency, setCurrency] = useState(() => {
    return "INR";
  });

  const [showConfidence, setShowConfidence] = useState(() => {
    return localStorage.getItem("spendai_show_confidence") !== "false";
  });

  useEffect(() => {
    localStorage.setItem("spendai_currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("spendai_show_confidence", String(showConfidence));
  }, [showConfidence]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.email) {
      setExpenses([]);
      return undefined;
    }

    const controller = new AbortController();
    setExpenses([]);

    async function loadExpenses() {
      try {
        const token = localStorage.getItem("spendai_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/expenses`, {
          headers,
          credentials: "include",
          signal: controller.signal,
        });
        if (response.status === 401) {
          handleLogout();
          return;
        }
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

    return () => {
      controller.abort();
    };
  }, [currentUser?.email, isAuthenticated]);

  const emptyForm = {
    merchant: "",
    amount: "",
    date: localDateInputValue(),
    category: "Other",
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
      category: expense.category || "Other",
      payment: expense.payment || "UPI",
    });
    setShowModal(true);
  }

  const [aiPrediction, setAiPrediction] = useState({
    category: "Other",
    confidence: 0,
    source: "unavailable",
    reasoning: "",
    isPending: true,
    icon: "✨",
    color: "#9aa4b2",
    error: "",
  });

  useEffect(() => {
    if (!showModal || !form.merchant.trim() || form.merchant.trim().length < 2) {
      setAiPrediction((previous) => ({
        ...previous,
        isPending: true,
        error: "",
      }));
      return undefined;
    }

    let active = true;
    setAiPrediction((previous) => ({ ...previous, isPending: true, error: "" }));
    const timeout = setTimeout(() => {
      predictCategory({
        merchant: form.merchant.trim(),
        amount: form.amount || 0,
        payment_method: form.payment,
      }).then((prediction) => {
        if (active && prediction) {
          setAiPrediction(prediction);
          // Auto-select category if form category is currently default "Other"
          setForm((current) => (current.category === "Other" && prediction.category ? { ...current, category: prediction.category } : current));
        }
      }).catch((error) => {
        if (active) {
          setAiPrediction((previous) => ({
            ...previous,
            isPending: false,
            error: error.message,
          }));
        }
      });
    }, 750);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [showModal, form.merchant, form.amount, form.payment]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthExpenses = expenses.filter((expense) => {
      const date = parseLocalDateOnly(expense.date);
      return date && date >= currentMonthStart && date < nextMonthStart;
    });
    const previousMonthExpenses = expenses.filter((expense) => {
      const date = parseLocalDateOnly(expense.date);
      return date && date >= previousMonthStart && date < currentMonthStart;
    });
    const summarize = (periodExpenses) => {
      const total = periodExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      return {
        total,
        count: periodExpenses.length,
        average: periodExpenses.length ? total / periodExpenses.length : 0,
      };
    };
    const current = summarize(currentMonthExpenses);
    const previous = summarize(previousMonthExpenses);
    const getTrend = (currentValue, previousValue, lowerIsBetter = false) => {
      if (previousValue === 0) {
        return { label: "No prior data", positive: undefined };
      }
      const percentageChange =
        ((currentValue - previousValue) / previousValue) * 100;
      const sign = percentageChange > 0 ? "+" : "";
      return {
        label: `${sign}${percentageChange.toFixed(1)}%`,
        positive:
          percentageChange === 0 ||
          (lowerIsBetter ? percentageChange < 0 : percentageChange > 0),
      };
    };
    const scoredExpenses = expenses.filter(
      (expense) =>
        typeof expense.confidence === "number" && expense.confidence > 0
    );
    const ruleBasedAverage = scoredExpenses.length
      ? scoredExpenses.reduce(
          (sum, expense) => sum + expense.confidence,
          0
        ) / scoredExpenses.length
      : null;

    return {
      current,
      totalTrend: getTrend(current.total, previous.total, true),
      transactionTrend: getTrend(current.count, previous.count),
      averageTrend: getTrend(current.average, previous.average, true),
      ruleBasedScore:
        ruleBasedAverage === null ? "N/A" : `${ruleBasedAverage.toFixed(1)}%`,
      scoredExpenseCount: scoredExpenses.length,
      currentMonthLabel: now.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [expenses]);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sumExpensesBetween = (start, end) =>
      expenses.reduce((sum, expense) => {
        const date = parseLocalDateOnly(expense.date);
        return date && date >= start && date < end
          ? sum + expense.amount
          : sum;
      }, 0);

    if (dashboardRange === "1") {
      return Array.from({ length: 7 }, (_, index) => {
        const start = new Date(today);
        start.setDate(today.getDate() - 6 + index);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);

        return {
          month: start.toLocaleDateString("en-IN", { weekday: "short" }),
          value: sumExpensesBetween(start, end),
        };
      });
    }

    if (dashboardRange === "2") {
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - 27);

      return Array.from({ length: 4 }, (_, index) => {
        const start = new Date(firstDay);
        start.setDate(firstDay.getDate() + index * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        return {
          month: `W${index + 1}`,
          value: sumExpensesBetween(start, end),
        };
      });
    }

    const monthCount = dashboardRange === "6" ? 6 : 12;
    const firstMonth = new Date(
      today.getFullYear(),
      today.getMonth() - monthCount + 1,
      1
    );

    return Array.from({ length: monthCount }, (_, index) => {
      const start = new Date(
        firstMonth.getFullYear(),
        firstMonth.getMonth() + index,
        1
      );
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

      return {
        month: start.toLocaleDateString("en-IN", { month: "short" }),
        value: sumExpensesBetween(start, end),
      };
    });
  }, [dashboardRange, expenses]);
  const maxChartValue = Math.max(
    ...monthlyData.map((item) => item.value),
    0
  );
  const chartScaleStep = 10 ** Math.floor(Math.log10(maxChartValue || 1));
  const chartScaleMax = maxChartValue
    ? Math.ceil(maxChartValue / chartScaleStep) * chartScaleStep
    : 0;

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

    // Use current AI prediction if valid, or fall back to form category
    let categoryToSave = form.category;
    let confidenceToSave = 0;

    if (aiPrediction && !aiPrediction.isPending && aiPrediction.category && !aiPrediction.error) {
      if (!categoryToSave || categoryToSave === "Other") {
        categoryToSave = aiPrediction.category;
      }
      confidenceToSave = aiPrediction.confidence;
    } else if (!categoryToSave || categoryToSave === "Other") {
      try {
        const fallback = await predictCategory({
          merchant: form.merchant.trim(),
          amount: form.amount,
          payment_method: form.payment,
        });
        if (fallback?.category) {
          categoryToSave = fallback.category;
          confidenceToSave = fallback.confidence;
        }
      } catch (e) {
        console.warn("Using default category on save:", e);
      }
    }

    const payload = {
      merchant: form.merchant.trim(),
      amount: Number(form.amount),
      date: form.date,
      category: categoryToSave || "Other",
      payment: form.payment,
      confidence: confidenceToSave,
    };

    const endpoint = isEditMode && editingExpenseId
      ? `${API_BASE_URL}/expenses/${editingExpenseId}`
      : `${API_BASE_URL}/expenses`;
    const method = isEditMode && editingExpenseId ? "PUT" : "POST";

    try {
      const token = localStorage.getItem("spendai_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const response = await fetch(endpoint, {
        method,
        headers,
        credentials: "include",
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
      console.error("Could not save expense to the backend:", error);
      window.alert("Could not save this expense. Check your connection and try again.");
      return;
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
      const token = localStorage.getItem("spendai_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      setExpenses((previous) => previous.filter((expense) => expense.id !== expenseId));
    } catch (error) {
      console.error("Could not delete expense from the backend:", error);
      window.alert("Could not delete this expense. Check your connection and try again.");
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
    if (userData?.token) {
      localStorage.setItem("spendai_token", userData.token);
    }
  }

  function handleLogout() {
    setExpenses([]);
    setIsAuthenticated(false);
    localStorage.removeItem("spendai_authenticated");
    localStorage.removeItem("spendai_user");
    localStorage.removeItem("spendai_token");

    fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).then((response) => {
      if (!response.ok) {
        console.warn("The server could not clear the authentication cookie.");
      }
    }).catch((error) => {
      console.warn("Could not reach the server to clear the authentication cookie:", error);
    });
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
                ? `Good morning, ${currentUser?.name ? currentUser.name.split(" ")[0] : "Alex"} \u{1F44B}`
                : activePage.charAt(0).toUpperCase() + activePage.slice(1)}
            </h2>
          </div>

          <div className="topbar-actions">
            <div className="date-chip">
              <Icon name="calendar" size={17} />
              {dashboardMetrics.currentMonthLabel}
            </div>

            <button className="add-btn" onClick={openAddExpenseModal}>
              <Icon name="plus" size={18} />
              Add Expense
            </button>
          </div>
        </header>

        {activePage === "dashboard" && (
          <>
            <section className="stats-grid">
              <StatCard
                title="Total Spending"
                value={formatCurrency(dashboardMetrics.current.total, currency)}
                subtitle="This month"
                trend={dashboardMetrics.totalTrend.label}
                positive={dashboardMetrics.totalTrend.positive}
                icon="wallet"
                color="purple"
              />

              <StatCard
                title="Transactions"
                value={dashboardMetrics.current.count}
                subtitle="This month"
                trend={dashboardMetrics.transactionTrend.label}
                positive={dashboardMetrics.transactionTrend.positive}
                icon="receipt"
                color="blue"
              />

              <StatCard
                title="Avg. Expense"
                value={formatCurrency(dashboardMetrics.current.average, currency)}
                subtitle="This month"
                trend={dashboardMetrics.averageTrend.label}
                positive={dashboardMetrics.averageTrend.positive}
                icon="chart"
                color="orange"
              />

              <StatCard
                title="Categorization confidence"
                value={dashboardMetrics.ruleBasedScore}
                subtitle={
                  dashboardMetrics.scoredExpenseCount
                    ? "Average score · not measured accuracy"
                    : "No scored expenses"
                }
                icon="sparkles"
                color="green"
              />
            </section>

            <section className="dashboard-grid">
              <div className="panel spending-panel">
                <div className="panel-header">
                  <div>
                    <h3>Spending Overview</h3>
                    <p>
                      {dashboardRange === "1"
                        ? "Daily spending over the last week"
                        : dashboardRange === "2"
                          ? "Weekly spending over the last month"
                          : `Monthly spending over the last ${dashboardRange} months`}
                    </p>
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
                    {[4, 3, 2, 1, 0].map((tick) => (
                      <span key={tick}>
                        {formatChartAxisValue(
                          (chartScaleMax * tick) / 4,
                          currency
                        )}
                      </span>
                    ))}
                  </div>

                  <div className="chart-area">
                    <div className="grid-lines">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                    {!maxChartValue && (
                      <p className="chart-empty-state">
                        Add expenses to see your spending trend
                      </p>
                    )}

                    <div className="bars">
                      {monthlyData.map((item) => (
                        <div className="bar-column" key={item.month}>
                          <div
                            className="bar"
                            style={{
                              height: `${
                                chartScaleMax
                                  ? (item.value / chartScaleMax) * 100
                                  : 0
                              }%`,
                            }}
                            title={`${item.month}: ${formatCurrency(
                              item.value,
                              currency
                            )}`}
                          >
                            <span className="bar-tooltip">
                              {formatCurrency(item.value, currency)}
                            </span>
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
                      <strong>{formatCurrency(totalSpent, currency)}</strong>
                      <span>All time</span>
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

                          <span className="legend-category">
                            {item.category}
                          </span>
                        </div>

                        <div className="legend-details">
                          <span>{formatCurrency(item.total, currency)}</span>
                          <strong>{Math.round(item.percentage)}%</strong>
                        </div>
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
                  View all expenses {"\u2192"}
                </button>
              </div>

              <ExpenseTable
                expenses={expenses.slice(0, 5)}
                currency={currency}
                showConfidence={showConfidence}
                onEdit={openEditExpenseModal}
                onDelete={deleteExpense}
              />
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

              <ExpenseTable
                expenses={filteredExpenses}
                currency={currency}
                showConfidence={showConfidence}
                onEdit={openEditExpenseModal}
                onDelete={deleteExpense}
              />
            </div>
          </section>
        )}

        {activePage === "analytics" && (
          <Analytics
            expenses={expenses}
            currency={currency}
            analyticsRange={analyticsRange}
            setAnalyticsRange={setAnalyticsRange}
          />
        )}

        {activePage === "categories" && (
          <Categories
            categoryData={categoryData}
            totalSpent={totalSpent}
            expenses={expenses}
            currency={currency}
          />
        )}

        {activePage === "settings" && (
          <Settings
            theme={theme}
            setTheme={setTheme}
            showConfidence={showConfidence}
            setShowConfidence={setShowConfidence}
            currency={currency}
            setCurrency={setCurrency}
          />
        )}
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
                {"\u00D7"}
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
                    <span>{CURRENCY_CONFIG[currency]?.symbol || CURRENCY_CONFIG.INR.symbol}</span>
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
                    <span>
                      {aiPrediction.isPending
                        ? "AI PREDICTED CATEGORY"
                        : aiPrediction.source === "gemini"
                          ? "Gemini AI"
                          : aiPrediction.source === "heuristic"
                            ? "Rule-based fallback"
                            : "Categorization unavailable"}
                    </span>
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

                {aiPrediction.error ? (
                  <div className="ai-prediction-empty" role="alert">
                    <p>{aiPrediction.error}</p>
                  </div>
                ) : aiPrediction.isPending ? (
                  <div className="ai-prediction-empty">
                    <div className="ai-empty-sparkle">
                      <Icon name="sparkles" size={20} />
                    </div>
                    <p>
                      Enter an expense name and amount to predict category automatically with AI.
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
                            Category:
                          </span>
                          <h4 className="ai-prediction-name">
                            {aiPrediction.category}
                          </h4>
                        </div>
                      </div>

                      <div className="ai-confidence-numeric">
                        <span className="ai-confidence-label">Confidence:</span>
                        <strong className="ai-confidence-value">
                          {aiPrediction.confidence}%
                        </strong>
                        <span className="ai-confidence-label">
                          Not measured classification accuracy
                        </span>
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

        {trend && (
          <span
            className={`trend ${positive ? "trend-positive" : ""}`}
            title="Compared with the previous calendar month"
          >
            {positive !== undefined &&
              (positive ? (
                <Icon name="arrowDown" size={13} />
              ) : (
                <Icon name="arrowUp" size={13} />
              ))}
            {trend}
          </span>
        )}
      </div>

      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </div>
  );
}

function ExpenseTable({
  expenses,
  currency = "INR",
  showConfidence = true,
  onEdit,
  onDelete,
}) {
  if (!expenses.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">{"\u{1F50D}"}</div>
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
            {showConfidence && (
              <th title="Confidence score is not measured classification accuracy">
                CATEGORIZATION CONFIDENCE
              </th>
            )}
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

              {showConfidence && (
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
              )}

              <td className="amount-column">
                <strong>{formatCurrency(expense.amount, currency)}</strong>
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

function Analytics({ expenses, currency, analyticsRange, setAnalyticsRange }) {
  const currentYear = new Date().getFullYear();
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(currentYear);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportError, setReportError] = useState("");

  const reportYears = useMemo(() => {
    const years = new Set([currentYear]);
    expenses.forEach((expense) => {
      const dateValue = String(expense.date || "").slice(0, 10);
      const date = new Date(`${dateValue}T00:00:00`);
      if (dateValue && !Number.isNaN(date.getTime())) {
        years.add(date.getFullYear());
      }
    });
    return [...years].sort((a, b) => b - a);
  }, [expenses, currentYear]);

  const selectedPeriodExpenses = expenses.filter((expense) => {
    const dateValue = String(expense.date || "").slice(0, 10);
    const date = new Date(`${dateValue}T00:00:00`);
    return (
      dateValue &&
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === reportYear &&
      date.getMonth() === reportMonth
    );
  });
  const selectedPeriodTotal = selectedPeriodExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const selectedCategoryData = categories
    .map((category) => {
      const total = selectedPeriodExpenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);
      return {
        category,
        total,
        percentage: selectedPeriodTotal ? (total / selectedPeriodTotal) * 100 : 0,
      };
    })
    .filter((item) => item.total > 0);
  const highestCategory = [...selectedCategoryData].sort(
    (a, b) => b.total - a.total
  )[0];
  const largestExpense = [...selectedPeriodExpenses].sort(
    (a, b) => b.amount - a.amount
  )[0];

  const expenseDate = (expense) => {
    const dateValue = String(expense.date || "").slice(0, 10);
    const date = new Date(`${dateValue}T00:00:00`);
    return dateValue && !Number.isNaN(date.getTime()) ? date : null;
  };
  const sumBetween = (start, end) =>
    expenses.reduce((sum, expense) => {
      const date = expenseDate(expense);
      return date && date >= start && date < end ? sum + expense.amount : sum;
    }, 0);

  let chartData;
  if (analyticsRange === "weekly") {
    const daysInMonth = new Date(reportYear, reportMonth + 1, 0).getDate();
    chartData = Array.from({ length: Math.ceil(daysInMonth / 7) }, (_, index) => {
      const start = new Date(reportYear, reportMonth, index * 7 + 1);
      const end = new Date(
        reportYear,
        reportMonth,
        Math.min((index + 1) * 7 + 1, daysInMonth + 1)
      );
      return { label: `W${index + 1}`, value: sumBetween(start, end) };
    });
  } else if (analyticsRange === "yearly") {
    chartData = Array.from({ length: 5 }, (_, index) => {
      const year = reportYear - 4 + index;
      return {
        label: String(year),
        value: sumBetween(new Date(year, 0, 1), new Date(year + 1, 0, 1)),
      };
    });
  } else {
    chartData = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(reportYear, reportMonth - 5 + index, 1);
      return {
        label: MONTH_NAMES[date.getMonth()].slice(0, 3),
        value: sumBetween(
          date,
          new Date(date.getFullYear(), date.getMonth() + 1, 1)
        ),
      };
    });
  }
  const chartMaximum = Math.max(...chartData.map((item) => item.value), 0);
  const rangeLabel =
    analyticsRange === "weekly"
      ? `${MONTH_NAMES[reportMonth]} ${reportYear}`
      : analyticsRange === "yearly"
        ? `${reportYear - 4}-${reportYear}`
        : `6 months through ${MONTH_NAMES[reportMonth]} ${reportYear}`;

  async function downloadReport() {
    setReportMessage("");
    setReportError("");
    if (!selectedPeriodExpenses.length) {
      setReportMessage("No expenses found for this month.");
      return;
    }

    setIsGeneratingReport(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      const { default: ExcelJS } = await import("exceljs");
      const rupeeNumberFormat = "\u20B9#,##0.00";
      const topCategory = [...selectedCategoryData].sort(
        (a, b) => b.total - a.total
      )[0];
      const largest = [...selectedPeriodExpenses].sort(
        (a, b) => b.amount - a.amount
      )[0];
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AI Expense Categorizer";
      workbook.subject = `${MONTH_NAMES[reportMonth]} ${reportYear} expense report`;
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Monthly Expense Report", {
        views: [{ state: "frozen", ySplit: 12, topLeftCell: "A13", showGridLines: false }],
        properties: { defaultRowHeight: 20 },
      });
      const contentWidth = (values, min, max) =>
        Math.min(
          max,
          Math.max(
            min,
            ...values.map((value) => String(value ?? "").length + 3)
          )
        );
      worksheet.columns = [
        {
          key: "date",
          width: contentWidth(["Date", "DD-MM-YYYY"], 12, 14),
        },
        {
          key: "merchant",
          width: contentWidth(
            ["Merchant", ...selectedPeriodExpenses.map((expense) => expense.merchant)],
            15,
            23
          ),
        },
        {
          key: "amount",
          width: contentWidth(
            [
              "Amount",
              ...selectedPeriodExpenses.map((expense) =>
                formatCurrency(Number(expense.amount) || 0, currency)
              ),
            ],
            14,
            17
          ),
        },
        {
          key: "category",
          width: contentWidth(
            ["Category", ...selectedPeriodExpenses.map((expense) => expense.category)],
            15,
            20
          ),
        },
        {
          key: "payment",
          width: contentWidth(
            ["Payment Method", ...selectedPeriodExpenses.map((expense) => expense.payment)],
            16,
            19
          ),
        },
        {
          key: "confidence",
          width: contentWidth(
            ["Confidence (not measured accuracy)", "100%"],
            15,
            25
          ),
        },
      ];

      const borderColor = "FFD9DEEA";
      const thinBorder = {
        top: { style: "thin", color: { argb: borderColor } },
        left: { style: "thin", color: { argb: borderColor } },
        bottom: { style: "thin", color: { argb: borderColor } },
        right: { style: "thin", color: { argb: borderColor } },
      };
      const styleMergedRow = (rowNumber, fill, font) => {
        const row = worksheet.getRow(rowNumber);
        for (let column = 1; column <= 6; column += 1) {
          const cell = row.getCell(column);
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
          cell.font = font;
          cell.border = thinBorder;
        }
      };

      worksheet.mergeCells("A1:F1");
      worksheet.getCell("A1").value = "AI Expense Categorizer";
      worksheet.getRow(1).height = 32;
      styleMergedRow(1, "211A42", {
        bold: true,
        size: 18,
        color: { argb: "FFFFFFFF" },
      });
      worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };

      worksheet.mergeCells("A2:F2");
      worksheet.getCell("A2").value = "Monthly Expense Report";
      worksheet.getRow(2).height = 26;
      styleMergedRow(2, "342A66", {
        bold: true,
        size: 13,
        color: { argb: "FFE8E3FF" },
      });
      worksheet.getCell("A2").alignment = { vertical: "middle", horizontal: "center" };

      worksheet.mergeCells("A4:F4");
      worksheet.getCell("A4").value = "Summary";
      styleMergedRow(4, "7057E8", {
        bold: true,
        size: 11,
        color: { argb: "FFFFFFFF" },
      });
      worksheet.getCell("A4").alignment = { vertical: "middle", horizontal: "left" };

      const summary = [
        ["Report Period", `${MONTH_NAMES[reportMonth]} ${reportYear}`],
        ["Total Spending", selectedPeriodTotal],
        ["Number of Expenses", selectedPeriodExpenses.length],
        [
          "Top Category",
          topCategory
            ? `${topCategory.category} - ${formatCurrency(topCategory.total, currency)}`
            : "No data",
        ],
        [
          "Largest Expense",
          largest
            ? `${largest.merchant} - ${formatCurrency(largest.amount, currency)}`
            : "No data",
        ],
      ];

      summary.forEach(([label, value], index) => {
        const rowNumber = index + 5;
        worksheet.mergeCells(`A${rowNumber}:C${rowNumber}`);
        worksheet.mergeCells(`D${rowNumber}:F${rowNumber}`);
        worksheet.getCell(`A${rowNumber}`).value = label;
        worksheet.getCell(`D${rowNumber}`).value = value;
        for (let column = 1; column <= 6; column += 1) {
          const cell = worksheet.getRow(rowNumber).getCell(column);
          cell.border = thinBorder;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: index % 2 ? "FFF4F2FC" : "FFFFFFFF" },
          };
        }
        worksheet.getCell(`A${rowNumber}`).font = { bold: true, color: { argb: "FF344054" } };
        worksheet.getCell(`D${rowNumber}`).font = { color: { argb: "FF344054" } };
        worksheet.getCell(`A${rowNumber}`).alignment = {
          vertical: "middle",
          horizontal: "left",
          indent: 1,
        };
        worksheet.getCell(`D${rowNumber}`).alignment = {
          vertical: "middle",
          horizontal: "left",
          indent: 1,
        };
        if (label === "Total Spending") {
          worksheet.getCell(`D${rowNumber}`).numFmt = rupeeNumberFormat;
        }
      });

      worksheet.mergeCells("A11:F11");
      worksheet.getCell("A11").value = "Expense Details";
      styleMergedRow(11, "7057E8", {
        bold: true,
        size: 11,
        color: { argb: "FFFFFFFF" },
      });
      worksheet.getCell("A11").alignment = { vertical: "middle", horizontal: "left" };

      const headers = [
        "Date",
        "Merchant",
        "Amount",
        "Category",
        "Payment Method",
        "Confidence (not measured accuracy)",
      ];
      const headerRow = worksheet.getRow(12);
      headerRow.values = headers;
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF43358C" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = thinBorder;
      });
      headerRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
      headerRow.getCell(3).alignment = { vertical: "middle", horizontal: "right" };
      headerRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" };

      selectedPeriodExpenses.forEach((expense, index) => {
        const dateValue = String(expense.date || "").slice(0, 10);
        const date = new Date(`${dateValue}T00:00:00`);
        const row = worksheet.addRow([
          date,
          expense.merchant || "",
          Number(expense.amount) || 0,
          expense.category || "",
          expense.payment || "",
          (Number(expense.confidence) || 0) / 100,
        ]);
        row.height = 22;
        row.eachCell((cell) => {
          cell.border = thinBorder;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: index % 2 ? "FFF7F8FC" : "FFFFFFFF" },
          };
          cell.alignment = { vertical: "middle" };
        });
        row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(3).alignment = { vertical: "middle", horizontal: "right" };
        row.getCell(6).alignment = { vertical: "middle", horizontal: "right" };
        row.getCell(1).numFmt = "dd-mm-yyyy";
        row.getCell(3).numFmt = rupeeNumberFormat;
        row.getCell(6).numFmt = "0%";
      });

      const lastExpenseRow = 12 + selectedPeriodExpenses.length;
      worksheet.autoFilter = {
        from: { row: 12, column: 1 },
        to: { row: lastExpenseRow, column: 6 },
      };

      const categoryTitleRow = lastExpenseRow + 2;
      worksheet.mergeCells(`A${categoryTitleRow}:F${categoryTitleRow}`);
      worksheet.getCell(`A${categoryTitleRow}`).value = "Category Summary";
      for (let column = 1; column <= 6; column += 1) {
        const cell = worksheet.getRow(categoryTitleRow).getCell(column);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7057E8" } };
        cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
        cell.border = thinBorder;
      }

      const categoryHeaderRow = categoryTitleRow + 1;
      const categoryHeaders = ["Category", "Total Amount", "Percentage"];
      const categoryRow = worksheet.getRow(categoryHeaderRow);
      worksheet.mergeCells(`A${categoryHeaderRow}:B${categoryHeaderRow}`);
      worksheet.mergeCells(`C${categoryHeaderRow}:D${categoryHeaderRow}`);
      worksheet.mergeCells(`E${categoryHeaderRow}:F${categoryHeaderRow}`);
      categoryHeaders.forEach((header, index) => {
        categoryRow.getCell(index * 2 + 1).value = header;
      });
      categoryRow.height = 23;
      for (let column = 1; column <= 6; column += 1) {
        const cell = categoryRow.getCell(column);
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF43358C" } };
        cell.border = thinBorder;
      }
      categoryRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
      categoryRow.getCell(3).alignment = { vertical: "middle", horizontal: "right" };
      categoryRow.getCell(5).alignment = { vertical: "middle", horizontal: "right" };

      selectedCategoryData.forEach((item, index) => {
        const row = worksheet.addRow([]);
        const rowNumber = row.number;
        worksheet.mergeCells(`A${rowNumber}:B${rowNumber}`);
        worksheet.mergeCells(`C${rowNumber}:D${rowNumber}`);
        worksheet.mergeCells(`E${rowNumber}:F${rowNumber}`);
        row.getCell(1).value = item.category;
        row.getCell(3).value = item.total;
        row.getCell(5).value = item.percentage / 100;
        for (let column = 1; column <= 6; column += 1) {
          const cell = row.getCell(column);
          cell.border = thinBorder;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: index % 2 ? "FFF7F8FC" : "FFFFFFFF" },
          };
        }
        row.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        row.getCell(3).alignment = { vertical: "middle", horizontal: "right" };
        row.getCell(5).alignment = { vertical: "middle", horizontal: "right" };
        row.getCell(3).numFmt = rupeeNumberFormat;
        row.getCell(5).numFmt = "0.0%";
      });

      const generatedRow = categoryHeaderRow + selectedCategoryData.length + 2;
      worksheet.mergeCells(`A${generatedRow}:F${generatedRow}`);
      worksheet.getCell(`A${generatedRow}`).value =
        `Report Generated: ${new Date().toLocaleString("en-IN")}`;
      worksheet.getCell(`A${generatedRow}`).font = {
        italic: true,
        size: 9,
        color: { argb: "FF667085" },
      };
      worksheet.getCell(`A${generatedRow}`).alignment = {
        vertical: "middle",
        horizontal: "right",
        indent: 1,
      };
      worksheet.getRow(generatedRow).height = 22;
      worksheet.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        printArea: `A1:F${generatedRow}`,
        margins: {
          left: 0.25,
          right: 0.25,
          top: 0.5,
          bottom: 0.5,
          header: 0.2,
          footer: 0.2,
        },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `Expense_Report_${MONTH_NAMES[reportMonth]}_${reportYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setReportMessage("Excel report downloaded.");
    } catch (error) {
      console.error("Could not generate the expense report:", error);
      setReportError("Could not generate the report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  }

  return (
    <section>
      <div className="page-heading analytics-page-heading">
        <div>
          <h3>Analytics</h3>
          <p>Understand your spending patterns and financial behavior.</p>
        </div>
        <div className="analytics-report-controls">
          <select
            className="analytics-report-select"
            aria-label="Select report month"
            value={reportMonth}
            onChange={(event) => {
              setReportMonth(Number(event.target.value));
              setReportMessage("");
              setReportError("");
            }}
          >
            {MONTH_NAMES.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
          <select
            className="analytics-report-select analytics-year-select"
            aria-label="Select report year"
            value={reportYear}
            onChange={(event) => {
              setReportYear(Number(event.target.value));
              setReportMessage("");
              setReportError("");
            }}
          >
            {reportYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            className="analytics-report-button"
            type="button"
            onClick={downloadReport}
            disabled={isGeneratingReport}
          >
            <Icon name="download" size={15} />
            {isGeneratingReport ? "Preparing..." : "Download Report"}
          </button>
          {(reportMessage || reportError) && (
            <p
              className={`analytics-report-status ${reportError ? "error" : ""}`}
              role={reportError ? "alert" : "status"}
            >
              {reportError || reportMessage}
            </p>
          )}
          {!reportMessage && !reportError && !selectedPeriodExpenses.length && (
            <p className="analytics-report-status" role="status">
              No expenses found for this month.
            </p>
          )}
        </div>
      </div>

      <div className="analytics-highlight-grid">
        <div className="analytics-highlight">
          <span>Monthly spending</span>
          <strong>{formatCurrency(selectedPeriodTotal, currency)}</strong>
          <small>{MONTH_NAMES[reportMonth]} {reportYear}</small>
        </div>

        <div className="analytics-highlight">
          <span>Top category</span>
          <strong>{highestCategory?.category || "\u2014"}</strong>
          <small>
            {highestCategory
              ? formatCurrency(highestCategory.total, currency)
              : "No data"}
          </small>
        </div>

        <div className="analytics-highlight">
          <span>Largest expense</span>
          <strong>
            {largestExpense ? formatCurrency(largestExpense.amount, currency) : "\u2014"}
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
                  {formatChartAxisValue(item.value, currency)}
                </span>

                <div
                  className="large-bar"
                  style={{
                    height: `${chartMaximum ? Math.max(8, (item.value / chartMaximum) * 100) : 0}%`,
                    minHeight: chartMaximum && item.value ? 14 : 0,
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
            {selectedCategoryData.map((item) => (
              <div className="analytics-category" key={item.category}>
                <div className="analytics-category-top">
                  <span>
                    <i style={{ background: categoryColors[item.category] }}></i>
                    {item.category}
                  </span>
                  <strong>{formatCurrency(item.total, currency)}</strong>
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

function Categories({ categoryData, totalSpent, expenses, currency }) {
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

              <strong>{formatCurrency(total, currency)}</strong>

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

function Settings({
  theme,
  setTheme,
  showConfidence,
  setShowConfidence,
  currency,
  setCurrency,
}) {
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
            <h4>Gemini AI Categorization</h4>
            <p>Gemini AI is used when available; otherwise rule-based categorization is used.</p>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <h4>Confidence indicators</h4>
            <p>Show categorization confidence scores; they are not measured classification accuracy.</p>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={showConfidence}
              onChange={(event) => setShowConfidence(event.target.checked)}
            />
            <span></span>
          </label>
        </div>

        <div className="settings-row">
          <div>
            <h4>Currency</h4>
            <p>Expenses are stored and displayed in INR; currency conversion is not supported.</p>
          </div>

          <select
            className="settings-select"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {Object.values(CURRENCY_CONFIG).map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

export default App;
