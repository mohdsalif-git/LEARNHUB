import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Resource from "../models/Resource.js";
import Feedback from "../models/Feedback.js";

const seedCategories = [
  { name: "Web Development", slug: "web-development", description: "HTML, CSS, React, Next.js and full-stack frameworks.", icon: "laptop-code", color: "oklch(0.55 0.22 285)", type: "main", displayOrder: 1, featured: true },
  { name: "Python", slug: "python", description: "Learn Python from beginner basics to advanced projects.", icon: "code", color: "oklch(0.7 0.18 155)", type: "main", displayOrder: 2, featured: true },
  { name: "JavaScript", slug: "javascript", description: "Master the language that powers the web.", icon: "file-code", color: "oklch(0.82 0.17 85)", type: "main", displayOrder: 3, featured: true },
  { name: "Java", slug: "java", description: "OOP, Spring Boot, and enterprise Java.", icon: "mug-saucer", color: "oklch(0.6 0.18 40)", type: "main", displayOrder: 4 },
  { name: "Data Science", slug: "data-science", description: "Pandas, NumPy, visualization and analytics.", icon: "chart-simple", color: "oklch(0.6 0.2 240)", type: "main", displayOrder: 5, featured: true },
  { name: "Artificial Intelligence", slug: "ai", description: "Build with LLMs, agents and modern AI tools.", icon: "brain", color: "oklch(0.55 0.22 300)", type: "main", displayOrder: 6, featured: true },
  { name: "Machine Learning", slug: "machine-learning", description: "Models, training, and real-world ML pipelines.", icon: "microchip", color: "oklch(0.6 0.2 320)", type: "main", displayOrder: 7 },
  { name: "Cloud Computing", slug: "cloud", description: "AWS, GCP, Azure and serverless.", icon: "cloud", color: "oklch(0.65 0.15 230)", type: "main", displayOrder: 8 },
  { name: "Cybersecurity", slug: "cybersecurity", description: "Ethical hacking, defense and security fundamentals.", icon: "shield-halved", color: "oklch(0.5 0.2 25)", type: "main", displayOrder: 9 },
  { name: "UI/UX Design", slug: "ui-ux", description: "Figma, design systems and product thinking.", icon: "pen-ruler", color: "oklch(0.68 0.19 340)", type: "main", displayOrder: 10 },
  { name: "Graphic Design", slug: "graphic-design", description: "Visual design, typography and branding.", icon: "palette", color: "oklch(0.7 0.18 20)", type: "main", displayOrder: 11 },
  { name: "Digital Marketing", slug: "digital-marketing", description: "SEO, ads, content and growth.", icon: "bullhorn", color: "oklch(0.68 0.18 60)", type: "main", displayOrder: 12 },
  { name: "Business & Career", slug: "business", description: "Soft skills, leadership and career growth.", icon: "briefcase", color: "oklch(0.55 0.12 250)", type: "main", displayOrder: 13 },
  { name: "School & Academic", slug: "academic", description: "Math, science and school subjects.", icon: "graduation-cap", color: "oklch(0.6 0.18 180)", type: "main", displayOrder: 14 },
  { name: "Interview Preparation", slug: "interview-prep", description: "DSA, system design and mock interviews.", icon: "user-tie", color: "oklch(0.7 0.18 100)", type: "main", displayOrder: 15 },
  { name: "Certification Prep", slug: "certifications", description: "AWS, GCP, PMP and other certifications.", icon: "certificate", color: "oklch(0.7 0.17 70)", type: "main", displayOrder: 16 },
];

const seedResources = [
  { title: "React Course – Beginner's Tutorial for React JavaScript Library", description: "A complete free React course covering hooks, components, and state management.", url: "https://www.youtube.com/watch?v=bMknfKXIFA8", platform: "freeCodeCamp", category: "web-development", level: "Beginner", duration: "12h", tags: ["react", "javascript", "frontend"], rating: 4.9, verified: true, featured: true },
  { title: "Python for Everybody – Full University Course", description: "Dr. Chuck's iconic free Python course used by millions of learners.", url: "https://www.youtube.com/watch?v=8DvywoWv6fI", platform: "freeCodeCamp", category: "python", level: "Beginner", duration: "14h", tags: ["python", "basics"], rating: 4.9, verified: true, featured: true },
  { title: "JavaScript Crash Course For Beginners", description: "Quick and clear intro to modern JavaScript in one sitting.", url: "https://www.youtube.com/watch?v=hdI2bqOjy3c", platform: "YouTube", category: "javascript", level: "Beginner", duration: "1h 40m", tags: ["javascript", "es6"], rating: 4.7, verified: true, featured: false },
  { title: "Machine Learning Specialization Notes", description: "Open notes and resources from Andrew Ng's classic ML course.", url: "https://www.coursera.org/specializations/machine-learning-introduction", platform: "Coursera", category: "machine-learning", level: "Intermediate", duration: "60h", tags: ["ml", "andrew-ng"], rating: 4.8, verified: true, featured: true },
  { title: "Google Cloud Skills Boost – Free Labs", description: "Hands-on cloud labs across GCP services, free tier.", url: "https://www.cloudskillsboost.google/", platform: "Google", category: "cloud", level: "Intermediate", duration: "Varies", tags: ["gcp", "cloud"], rating: 4.6, verified: true, featured: false },
  { title: "The Complete 2024 Web Development Bootcamp Notes", description: "Open companion notes covering HTML, CSS, JS, Node and React.", url: "https://github.com/jonasschmedtmann/complete-javascript-course", platform: "GitHub", category: "web-development", level: "Beginner", duration: "Self-paced", tags: ["html", "css", "node"], rating: 4.8, verified: true, featured: true },
  { title: "MDN Web Docs – Learn Web Development", description: "The official, free, comprehensive guide to learning the web.", url: "https://developer.mozilla.org/en-US/docs/Learn", platform: "MDN", category: "web-development", level: "Beginner", duration: "Self-paced", tags: ["html", "css", "javascript"], rating: 5.0, verified: true, featured: true },
  { title: "Data Science with Python – Edureka Free Sessions", description: "Free Edureka tutorial covering Pandas, NumPy and viz.", url: "https://www.youtube.com/watch?v=N6BghzuFLIg", platform: "Edureka", category: "data-science", level: "Beginner", duration: "10h", tags: ["pandas", "numpy"], rating: 4.5, verified: true, featured: false },
  { title: "Cybersecurity for Beginners – Full Course", description: "Intro to security concepts, attacks and defenses.", url: "https://www.youtube.com/watch?v=U_P23SqJaDc", platform: "freeCodeCamp", category: "cybersecurity", level: "Beginner", duration: "5h", tags: ["security", "hacking"], rating: 4.6, verified: true, featured: false },
  { title: "Figma UI/UX Design Essentials", description: "Free hands-on Figma course for product designers.", url: "https://www.youtube.com/watch?v=jwCmIBJ8Jtc", platform: "YouTube", category: "ui-ux", level: "Beginner", duration: "3h", tags: ["figma", "design"], rating: 4.7, verified: true, featured: true },
  { title: "Khan Academy – Algebra Basics", description: "Free, world-class algebra lessons for any learner.", url: "https://www.khanacademy.org/math/algebra-basics", platform: "Khan Academy", category: "academic", level: "Beginner", duration: "Self-paced", tags: ["math", "algebra"], rating: 4.9, verified: true, featured: false },
  { title: "System Design Primer", description: "Top GitHub resource for learning system design for interviews.", url: "https://github.com/donnemartin/system-design-primer", platform: "GitHub", category: "interview-prep", level: "Advanced", duration: "Self-paced", tags: ["system-design", "interview"], rating: 5.0, verified: true, featured: true },
  { title: "Java Programming for Beginners", description: "Full Java tutorial covering OOP fundamentals.", url: "https://www.youtube.com/watch?v=A74TOX803D0", platform: "freeCodeCamp", category: "java", level: "Beginner", duration: "2h 30m", tags: ["java", "oop"], rating: 4.6, verified: true, featured: false },
  { title: "AI for Everyone", description: "Non-technical intro to AI concepts and impact.", url: "https://www.coursera.org/learn/ai-for-everyone", platform: "Coursera", category: "ai", level: "Beginner", duration: "10h", tags: ["ai", "fundamentals"], rating: 4.8, verified: true, featured: true },
  { title: "Google Digital Garage – Fundamentals of Digital Marketing", description: "Free certification course in digital marketing.", url: "https://learndigital.withgoogle.com/digitalgarage", platform: "Google", category: "digital-marketing", level: "Beginner", duration: "40h", tags: ["seo", "ads"], rating: 4.7, verified: true, featured: false },
];

const seedFeedbackData = [
  { name: "Ananya R.", rating: 5, message: "Saved me hours of searching. Finally a clean place for free learning!" },
  { name: "Marcus L.", rating: 5, message: "Love the categories and how everything links straight to the source." },
  { name: "Devansh K.", rating: 4, message: "Great curation. Would love to see more cybersecurity content." },
];

async function seed() {
  try {
    await connectDB();
    console.log("Connected to MongoDB. Seeding...");

    const adminExists = await User.findOne({ email: "admin@learnhub.com" });
    if (!adminExists) {
      await User.create({
        name: "Admin",
        email: "admin@learnhub.com",
        password: "Admin@12345",
        role: "admin",
      });
      console.log("Admin user created: admin@learnhub.com / Admin@12345");
    }

    const userExists = await User.findOne({ email: "user@demo.com" });
    if (!userExists) {
      await User.create({
        name: "Demo User",
        email: "user@demo.com",
        password: "User@12345",
        role: "user",
      });
      console.log("Demo user created: user@demo.com / User@12345");
    }

    const existingCategories = await Category.countDocuments();
    if (existingCategories === 0) {
      await Category.insertMany(seedCategories);
      console.log(`${seedCategories.length} categories seeded`);
    } else {
      console.log(`Categories already exist (${existingCategories}), skipping`);
    }

    const existingResources = await Resource.countDocuments();
    if (existingResources === 0) {
      await Resource.insertMany(seedResources);
      console.log(`${seedResources.length} resources seeded`);
    } else {
      console.log(`Resources already exist (${existingResources}), skipping`);
    }

    const existingFeedback = await Feedback.countDocuments();
    if (existingFeedback === 0) {
      await Feedback.insertMany(seedFeedbackData);
      console.log(`${seedFeedbackData.length} feedback entries seeded`);
    } else {
      console.log(`Feedback already exists (${existingFeedback}), skipping`);
    }

    console.log("Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
