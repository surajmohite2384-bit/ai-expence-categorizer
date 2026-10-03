import { predictCategory } from "./src/aiCategorizer.js";

const testCases = [
  { merchant: "Swiggy", amount: 850, expectedCategory: "Food & Dining", minConf: 90 },
  { merchant: "Zomato delivery", amount: 560, expectedCategory: "Food & Dining", minConf: 90 },
  { merchant: "Starbucks Coffee", amount: 350, expectedCategory: "Food & Dining", minConf: 90 },
  { merchant: "Uber", amount: 420, expectedCategory: "Transport", minConf: 90 },
  { merchant: "Ola Cabs", amount: 280, expectedCategory: "Transport", minConf: 90 },
  { merchant: "Amazon", amount: 1890, expectedCategory: "Shopping", minConf: 90 },
  { merchant: "Myntra clothes", amount: 2200, expectedCategory: "Shopping", minConf: 90 },
  { merchant: "Netflix", amount: 649, expectedCategory: "Entertainment", minConf: 90 },
  { merchant: "Spotify subscription", amount: 119, expectedCategory: "Entertainment", minConf: 90 },
  { merchant: "Reliance Fresh groceries", amount: 1250, expectedCategory: "Bills & Utilities", minConf: 90 },
  { merchant: "Airtel recharge bill", amount: 479, expectedCategory: "Bills & Utilities", minConf: 90 },
  { merchant: "Apollo Pharmacy tablets", amount: 780, expectedCategory: "Health Care", minConf: 90 },
  { merchant: "Random Unknown Merchant XYZ 999", amount: 300, expectedCategory: "Other", expectedConf: 52 },
];

console.log("=== Testing AI Categorizer ===");
let passed = 0;
for (const tc of testCases) {
  const result = predictCategory({ merchant: tc.merchant, amount: tc.amount });
  const categoryOk = result.category === tc.expectedCategory;
  const confOk = tc.expectedConf ? result.confidence === tc.expectedConf : result.confidence >= tc.minConf;

  if (categoryOk && confOk) {
    console.log(`✅ PASS: "${tc.merchant}" -> ${result.icon} ${result.category} (${result.confidence}%) [${result.reasoning}]`);
    passed++;
  } else {
    console.error(`❌ FAIL: "${tc.merchant}" -> got ${result.category} (${result.confidence}%), expected ${tc.expectedCategory}`);
  }
}

console.log(`\nTest results: ${passed}/${testCases.length} passed.`);
if (passed === testCases.length) {
  console.log("ALL TESTS PASSED SUCCESSFULLY! ✨");
} else {
  process.exit(1);
}
