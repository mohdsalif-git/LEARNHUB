/**
 * Verification test for the universal automation ingestion pipeline.
 * Runs directly via Node.js: `node tests/verifyAutomation.mjs`
 */
import { classifyDifficulty } from "../services/automationEngine.js";
import { scoreResource, qualityLabel } from "../services/qualityScorer.js";

console.log("==================================================");
console.log("   LEARNHUB AUTOMATION PIPELINE VERIFICATION      ");
console.log("==================================================");

const tests = [
  { text: "Quantum Mechanics and Relativistic Electrodynamics", expected: "Advanced" },
  { text: "Clinical Pharmacology and Molecular Pathology", expected: "Advanced" },
  { text: "Deep Learning Neural Network Architecture Deep Dive", expected: "Advanced" },
  { text: "FPGA Architecture and VLSI Internals", expected: "Advanced" },
  { text: "Full Stack CRUD REST API with Docker and PostgreSQL", expected: "Intermediate" },
  { text: "Financial Modeling and Investment Analysis", expected: "Intermediate" },
  { text: "Arduino Circuit Design and PCB Layout", expected: "Intermediate" },
  { text: "Calculus and Linear Algebra for Engineers", expected: "Intermediate" },
  { text: "Nutrition Science Basics for Beginners", expected: "Beginner" },
  { text: "Cooking Basics for Beginners", expected: "Beginner" },
  { text: "World History Crash Course", expected: "Beginner" },
  { text: "Yoga for Beginners Full Class Free", expected: "Beginner" },
  { text: "Stock Market Introduction for Beginners", expected: "Beginner" },
];

let passCount = 0;
tests.forEach(({ text, expected }) => {
  const got = classifyDifficulty(text);
  const ok = got === expected;
  if (ok) passCount++;
  console.log(`${ok ? "✅ PASS" : "❌ FAIL"} [${got.padEnd(12)}] (Expected: ${expected.padEnd(12)}) | "${text}"`);
});

console.log(`\nTaxonomy Results: ${passCount}/${tests.length} passed.`);

// Scorer tests
const goodResource = {
  title: "Introduction to Human Anatomy and Physiology",
  description: "A comprehensive open course examining structural organization, cardiovascular systems, and human organs.",
  thumbnail: "https://example.com/thumb.jpg",
  tags: ["anatomy", "physiology", "biology", "healthcare"],
  platform: "YouTube",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};
const goodScore = scoreResource(goodResource);
console.log(`\nGood Resource Score: ${goodScore} (${qualityLabel(goodScore)})`);

const spamResource = {
  title: "CLICK HERE TO MAKE 5000$ FAST WITH THIS ONE WEIRD TRICK",
  description: "Make money online fast no experience needed get rich easy 100% free guaranteed results.",
  thumbnail: "",
  tags: [],
  platform: "Other",
  url: "http://scammy-domain.xyz/trick",
};
const spamScore = scoreResource(spamResource);
console.log(`Spam Resource Score: ${spamScore} (${qualityLabel(spamScore)})`);

if (passCount === tests.length && goodScore >= 2.5 && spamScore <= 1.5) {
  console.log("\n🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY!");
  process.exit(0);
} else {
  console.error("\n❌ SOME CHECKS FAILED.");
  process.exit(1);
}

