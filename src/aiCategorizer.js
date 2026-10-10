const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL ||
  (typeof window === "undefined" ? "http://127.0.0.1:8000" : "/api")
).replace(/\/+$/, "");

const CATEGORY_PRESENTATION = {
  Food: { icon: "🍔", color: "#7c5cff" },
  Groceries: { icon: "🛒", color: "#20c997" },
  Shopping: { icon: "🛍️", color: "#ff8a65" },
  Transportation: { icon: "🚕", color: "#19b5fe" },
  Entertainment: { icon: "🎬", color: "#ef5da8" },
  "Bills & Utilities": { icon: "💡", color: "#f7b731" },
  Healthcare: { icon: "💊", color: "#20c997" },
  Education: { icon: "📚", color: "#7057e8" },
  Travel: { icon: "✈️", color: "#19b5fe" },
  Other: { icon: "📦", color: "#9aa4b2" },
};

export async function predictCategory({
  merchant = "",
  amount = 0,
  payment_method = "",
  token = null,
}) {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${API_BASE_URL}/predictCategory`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ merchant, amount: Number(amount), payment_method }),
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) {
      throw new Error(result.error || result.detail || "AI categorization unavailable");
    }

    if (result.source !== "gemini" && result.source !== "heuristic") {
      throw new Error("Categorization source missing or invalid");
    }
    if (!CATEGORY_PRESENTATION[result.category]) {
      throw new Error("Categorization returned an unsupported category");
    }
    if (
      typeof result.confidence !== "number" ||
      !Number.isFinite(result.confidence) ||
      result.confidence < 0 ||
      result.confidence > 100
    ) {
      throw new Error("Categorization returned an invalid confidence score");
    }

    const category = result.category;
    const presentation = CATEGORY_PRESENTATION[category];

    return {
      category,
      confidence: result.confidence,
      source: result.source,
      reasoning: result.reason || `Categorized as ${category}`,
      isPending: false,
      error: "",
      ...presentation,
    };
  } catch (error) {
    const defaultPresentation = CATEGORY_PRESENTATION.Other;
    return {
      category: "Other",
      confidence: 0,
      source: "unavailable",
      reasoning: "Categorization service is unavailable",
      isPending: false,
      error: "Could not get a categorization result. Check the backend connection and try again.",
      ...defaultPresentation,
    };
  }
}
