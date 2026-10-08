/**
 * seedContentDefaults.js
 * Auto-seeds TeamMembers, WhyCards, HowSteps, and Categories if collections are empty.
 * Safe to call on every server startup — only inserts when count === 0.
 */
import TeamMember from "../models/TeamMember.js";
import WhyCard from "../models/WhyCard.js";
import HowStep from "../models/HowStep.js";
import Category from "../models/Category.js";

const DEFAULT_TEAM = [
  { name: "Aarav Sharma", role: "Founder & Full-Stack", bio: "Builds learning tools so students don't waste time searching.", initials: "AS", color: "oklch(0.55 0.22 285)", displayOrder: 0 },
  { name: "Priya Patel", role: "Product Designer", bio: "Designs friendly, accessible experiences for self-learners.", initials: "PP", color: "oklch(0.68 0.19 340)", displayOrder: 1 },
  { name: "Rohit Verma", role: "Community & Content", bio: "Curates the best free resources from across the web.", initials: "RV", color: "oklch(0.7 0.18 155)", displayOrder: 2 },
  { name: "Sneha Iyer", role: "Backend Engineer", bio: "Keeps the platform fast, reliable and free for everyone.", initials: "SI", color: "oklch(0.65 0.15 230)", displayOrder: 3 },
];

const DEFAULT_WHY_CARDS = [
  { icon: "search", title: "Discover Resources", description: "Find free videos, tutorials, and courses from trusted platforms — all in one search.", displayOrder: 0 },
  { icon: "play", title: "Video Learning", description: "Access curated YouTube, freeCodeCamp, and educational videos organized by topic.", displayOrder: 1 },
  { icon: "book-open", title: "Organized by Topic", description: "Browse structured learning paths across web development, data science, design, and more.", displayOrder: 2 },
  { icon: "share2", title: "Share Knowledge", description: "Contribute resources you find useful and help the community grow.", displayOrder: 3 },
  { icon: "message-square", title: "Community Feedback", description: "Read real learner reviews and share your own experience to help others.", displayOrder: 4 },
  { icon: "zap", title: "Always Free", description: "No paywalls, no subscriptions. Just free learning resources, forever.", displayOrder: 5 },
];

const DEFAULT_HOW_STEPS = [
  { number: "01", title: "Search or Browse", description: "Find what you want to learn by searching or exploring categories.", displayOrder: 0 },
  { number: "02", title: "Choose a Resource", description: "Pick from curated free videos, tutorials, and courses.", displayOrder: 1 },
  { number: "03", title: "Start Learning", description: "Open the resource directly on the original platform — no login required.", displayOrder: 2 },
  { number: "04", title: "Save & Share", description: "Bookmark resources and share great finds with the community.", displayOrder: 3 },
];

const DEFAULT_CATEGORIES = [
  { name: "Web Development", slug: "web-development", description: "HTML, CSS, React, Next.js and full-stack frameworks.", icon: "laptop-code", color: "oklch(0.55 0.22 285)", type: "main", displayOrder: 0, featured: true, courseCount: 120 },
  { name: "Programming", slug: "programming", description: "Core programming concepts, algorithms and data structures.", icon: "code", color: "oklch(0.7 0.18 155)", type: "main", displayOrder: 1, featured: true, courseCount: 95 },
  { name: "Data Science", slug: "data-science", description: "Pandas, NumPy, visualization and analytics.", icon: "chart-simple", color: "oklch(0.6 0.2 240)", type: "main", displayOrder: 2, featured: true, courseCount: 80 },
  { name: "Artificial Intelligence", slug: "ai", description: "Build with LLMs, agents and modern AI tools.", icon: "brain", color: "oklch(0.55 0.22 300)", type: "main", displayOrder: 3, featured: true, courseCount: 75 },
  { name: "Cloud Computing", slug: "cloud", description: "AWS, GCP, Azure and serverless.", icon: "cloud", color: "oklch(0.65 0.15 230)", type: "main", displayOrder: 4, courseCount: 60 },
  { name: "Cybersecurity", slug: "cybersecurity", description: "Ethical hacking, defense and security fundamentals.", icon: "shield-halved", color: "oklch(0.5 0.2 25)", type: "main", displayOrder: 5, courseCount: 45 },
  { name: "UI/UX Design", slug: "ui-ux", description: "Figma, design systems and product thinking.", icon: "pen-ruler", color: "oklch(0.68 0.19 340)", type: "main", displayOrder: 6, courseCount: 55 },
  { name: "Digital Marketing", slug: "digital-marketing", description: "SEO, ads, content and growth.", icon: "bullhorn", color: "oklch(0.68 0.18 60)", type: "main", displayOrder: 7, courseCount: 40 },
  { name: "Business & Finance", slug: "business", description: "Soft skills, leadership, finance and career growth.", icon: "briefcase", color: "oklch(0.55 0.12 250)", type: "main", displayOrder: 8, courseCount: 50 },
  { name: "Career Development", slug: "career-development", description: "Interview prep, resume writing and job search strategies.", icon: "user-tie", color: "oklch(0.7 0.18 100)", type: "main", displayOrder: 9, courseCount: 35 },
  { name: "Graphic Design", slug: "graphic-design", description: "Visual design, typography and branding.", icon: "palette", color: "oklch(0.7 0.18 20)", type: "main", displayOrder: 10, courseCount: 42 },
  { name: "Soft Skills", slug: "soft-skills", description: "Communication, leadership and personal development.", icon: "users", color: "oklch(0.62 0.14 310)", type: "main", displayOrder: 11, courseCount: 30 },
];

export async function seedContentDefaults() {
  try {
    const [teamCount, whyCount, howCount, catCount] = await Promise.all([
      TeamMember.countDocuments(),
      WhyCard.countDocuments(),
      HowStep.countDocuments(),
      Category.countDocuments(),
    ]);

    const ops = [];

    if (teamCount === 0) {
      ops.push(TeamMember.insertMany(DEFAULT_TEAM).then(() => console.log("[Seed] Team members seeded")));
    }
    if (whyCount === 0) {
      ops.push(WhyCard.insertMany(DEFAULT_WHY_CARDS).then(() => console.log("[Seed] Why cards seeded")));
    }
    if (howCount === 0) {
      ops.push(HowStep.insertMany(DEFAULT_HOW_STEPS).then(() => console.log("[Seed] How steps seeded")));
    }
    if (catCount === 0) {
      ops.push(Category.insertMany(DEFAULT_CATEGORIES).then(() => console.log("[Seed] Categories seeded")));
    }

    if (ops.length > 0) await Promise.all(ops);
  } catch (err) {
    // Non-fatal — log but don't crash server
    console.error("[Seed] Content defaults seed error:", err.message);
  }
}
