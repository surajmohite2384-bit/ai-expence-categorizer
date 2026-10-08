import { predictCategory } from "./src/aiCategorizer.js";

try {
  const result = await predictCategory({
    merchant: "Swiggy",
    amount: 450,
    description: "Ordered dinner",
    payment_method: "UPI",
  });

  console.log("Gemini categorization result:", JSON.stringify(result, null, 2));
  if (
    !result.category ||
    !Number.isFinite(result.confidence) ||
    !result.reasoning
  ) {
    throw new Error("Prediction response is missing category, confidence, or reason.");
  }
  console.log("PASS: frontend helper received a valid Gemini API response.");
} catch (error) {
  console.error("FAIL: Gemini categorization request failed:", error.message);
  process.exitCode = 1;
}
