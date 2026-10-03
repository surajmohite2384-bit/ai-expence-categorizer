/**
 * AI Expense Categorizer Engine
 * Predicts expense categories and confidence scores using merchant recognition,
 * semantic keyword matching, transaction amount heuristics, and smart fallbacks.
 */

export const CATEGORY_DEFINITIONS = [
  {
    name: "Food & Dining",
    icon: "🍔",
    color: "#7c5cff",
    merchants: [
      "swiggy", "zomato", "starbucks", "mcdonalds", "mcdonald's", "kfc",
      "dominos", "domino's", "subway", "burger king", "pizza hut", "taco bell",
      "haldirams", "haldiram's", "chai point", "blue tokai", "dunkin",
      "baskin robbins", "barbeque nation", "behrouz", "faasos", "cafe coffee day",
      "ccd", "chaayos", "ovenstory", "freshmenu", "eatclub", "sweet truth",
      "theobroma", "costa coffee", "wendys", "wendy's", "krispy kreme"
    ],
    keywords: [
      "food", "dining", "restaurant", "cafe", "coffee", "burger", "pizza",
      "lunch", "dinner", "breakfast", "snacks", "bakery", "bar", "pub",
      "meal", "tea", "biryani", "kitchen", "catering", "bistro", "eatery",
      "dessert", "ice cream", "diner", "takeout", "pastry", "drinks", "juice"
    ],
    amountRanges: { typicalMin: 40, typicalMax: 4000 }
  },
  {
    name: "Transport",
    icon: "🚕",
    color: "#19b5fe",
    merchants: [
      "uber", "ola", "rapido", "blusmart", "irctc", "makemytrip", "yatra",
      "goibibo", "cleartrip", "indigo", "air india", "spicejet", "vistara",
      "indian railways", "shell", "hpcl", "bpcl", "indian oil", "fastag",
      "delhi metro", "dmrc", "bmrc", "mmrcl", "redbus", "abhibus",
      "zoomcar", "revv", "chalo", "bounce"
    ],
    keywords: [
      "transport", "cab", "taxi", "ride", "auto", "flight", "airline", "train",
      "railway", "metro", "bus", "petrol", "diesel", "fuel", "cng", "toll",
      "parking", "transit", "ticket", "commute", "fare", "travel", "rickshaw"
    ],
    amountRanges: { typicalMin: 30, typicalMax: 12000 }
  },
  {
    name: "Shopping",
    icon: "🛍️",
    color: "#ff8a65",
    merchants: [
      "amazon", "flipkart", "myntra", "ajio", "zara", "h&m", "nykaa", "purplle",
      "tata cliq", "meesho", "nike", "adidas", "puma", "uniqlo", "marks & spencer",
      "croma", "vijay sales", "reliance digital", "apple store", "lifestyle",
      "shoppers stop", "westside", "h&m", "decathlon", "ikea", "lenskart",
      "boat", "noise", "urbanic", "snitch", "bewakoof"
    ],
    keywords: [
      "shopping", "clothes", "apparel", "fashion", "shoes", "sneakers", "electronics",
      "mobile", "laptop", "gadget", "accessories", "cosmetics", "makeup",
      "skincare", "retail", "store", "order", "cart", "boutique", "watch",
      "headphones", "jewelry", "bag", "dress", "shirt", "tshirt", "jeans"
    ],
    amountRanges: { typicalMin: 150, typicalMax: 50000 }
  },
  {
    name: "Bills & Utilities",
    icon: "💡",
    color: "#f7b731",
    merchants: [
      "reliance fresh", "dmart", "bigbasket", "nature's basket", "zepto",
      "blinkit", "instamart", "bbnow", "bescom", "tata power", "adani electricity",
      "airtel", "jio", "vi", "vodafone", "act fibernet", "hathway",
      "indane", "bharat gas", "hp gas", "mahanagar gas", "igl",
      "tata play", "dish tv", "sun direct", "lic", "cred"
    ],
    keywords: [
      "bill", "utility", "utilities", "recharge", "electricity", "power", "wifi",
      "broadband", "mobile bill", "dth", "cylinder", "gas", "water bill",
      "maintenance", "grocery", "groceries", "supermarket", "mart", "supplies",
      "milk", "vegetables", "fruits", "provision", "broadband", "postpaid", "prepaid"
    ],
    amountRanges: { typicalMin: 50, typicalMax: 15000 }
  },
  {
    name: "Entertainment",
    icon: "🎬",
    color: "#ef5da8",
    merchants: [
      "netflix", "spotify", "amazon prime", "prime video", "disney+ hotstar",
      "hotstar", "youtube", "youtube premium", "bookmyshow", "pvr", "inox",
      "cinepolis", "sonyliv", "zee5", "steam", "playstation", "ps store",
      "xbox", "apple music", "gaana", "wynk", "crunchyroll", "audible",
      "twitch", "nintendo"
    ],
    keywords: [
      "entertainment", "movie", "cinema", "theatre", "theater", "music",
      "streaming", "subscription", "game", "gaming", "concert", "event",
      "show", "ott", "film", "multiplex", "ticket", "festival", "amusement",
      "arcade", "bowling", "club"
    ],
    amountRanges: { typicalMin: 99, typicalMax: 4000 }
  },
  {
    name: "Health Care",
    icon: "💊",
    color: "#20c997",
    merchants: [
      "apollo pharmacy", "apollo", "netmeds", "1mg", "tata 1mg", "pharmeasy",
      "medplus", "practo", "max healthcare", "fortis", "cult.fit", "cultfit",
      "anytime fitness", "gold gym", "dr lal pathlabs", "metropolis", "srl diagnostics",
      "manipal hospital", "care hospital", "lenskart clinic"
    ],
    keywords: [
      "health", "healthcare", "pharmacy", "chemist", "medicine", "medical",
      "doctor", "hospital", "clinic", "dental", "dentist", "lab", "diagnostic",
      "test", "blood test", "fitness", "gym", "workout", "wellness", "vitamins",
      "tablets", "pills", "consultation", "therapy", "physiotherapy", "optician"
    ],
    amountRanges: { typicalMin: 50, typicalMax: 25000 }
  },
];

/**
 * Normalizes input text for resilient token and phrase matching
 */
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'&+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Predicts the most appropriate expense category and confidence score.
 *
 * @param {Object} params
 * @param {string} params.merchant - Merchant or expense description entered by the user
 * @param {number|string} [params.amount] - Optional transaction amount for heuristic validation
 * @returns {Object} Result containing category, confidence, icon, color, and reasoning
 */
export function predictCategory({ merchant = "", amount = 0 }) {
  const cleanMerchant = normalizeText(merchant);
  const numAmount = Number(amount) || 0;

  // If no merchant description provided yet
  if (!cleanMerchant) {
    return {
      category: "Other",
      confidence: 50,
      icon: "📦",
      color: "#9aa4b2",
      isPending: true,
      reasoning: "Awaiting expense details to predict category.",
    };
  }

  let bestMatch = null;
  let highestScore = 0;
  let matchReason = "";
  let matchType = ""; // 'exact-merchant', 'partial-merchant', 'keyword', 'fallback'

  for (const def of CATEGORY_DEFINITIONS) {
    // 1. Exact or highly specific merchant match
    for (const m of def.merchants) {
      const normalizedM = normalizeText(m);
      if (cleanMerchant === normalizedM) {
        const score = 97;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = def;
          matchType = "exact-merchant";
          matchReason = `Identified trusted merchant "${m}"`;
        }
      } else if (
        cleanMerchant.startsWith(normalizedM + " ") ||
        cleanMerchant.endsWith(" " + normalizedM) ||
        cleanMerchant.includes(" " + normalizedM + " ")
      ) {
        const score = 95;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = def;
          matchType = "partial-merchant";
          matchReason = `Matched merchant pattern "${m}"`;
        }
      } else if (cleanMerchant.includes(normalizedM) && normalizedM.length >= 4) {
        const score = 92;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = def;
          matchType = "partial-merchant";
          matchReason = `Matched brand name "${m}"`;
        }
      }
    }

    // 2. Keyword and domain semantic match
    for (const kw of def.keywords) {
      const normalizedKw = normalizeText(kw);
      const regex = new RegExp(`\\b${normalizedKw}\\b`, "i");
      if (regex.test(cleanMerchant)) {
        // Longer keywords indicate higher specificity
        const kwScore = 88 + Math.min(5, normalizedKw.length - 3);
        if (kwScore > highestScore) {
          highestScore = kwScore;
          bestMatch = def;
          matchType = "keyword";
          matchReason = `Matched category keyword "${kw}"`;
        }
      }
    }
  }

  // If a strong or moderate category was identified
  if (bestMatch && highestScore >= 70) {
    let finalConfidence = highestScore;

    // Apply slight amount sanity checks to tune confidence
    if (numAmount > 0 && bestMatch.amountRanges) {
      const { typicalMin, typicalMax } = bestMatch.amountRanges;
      if (numAmount >= typicalMin && numAmount <= typicalMax) {
        // Boost slightly if within typical range for that category
        finalConfidence = Math.min(98, finalConfidence + 1);
      } else if (numAmount > typicalMax * 3 || numAmount < typicalMin / 5) {
        // Small confidence deduction if anomalous amount for this category
        finalConfidence = Math.max(78, finalConfidence - 4);
      }
    }

    return {
      category: bestMatch.name,
      confidence: finalConfidence,
      icon: bestMatch.icon,
      color: bestMatch.color,
      isPending: false,
      reasoning: matchReason || `Predicted as ${bestMatch.name}`,
    };
  }

  // 3. Fallback when AI cannot confidently determine a category
  // As required: display "AI Predicted Category: Other" with confidence around 52%
  return {
    category: "Other",
    confidence: 52,
    icon: "📦",
    color: "#9aa4b2",
    isPending: false,
    reasoning: "No definitive category pattern matched — categorized as Other.",
  };
}
