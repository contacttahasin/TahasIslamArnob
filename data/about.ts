/**
 * Content for the About page. Every About section renders from this file —
 * no copy should ever be hardcoded in the section components themselves.
 *
 * Fields marked "PLACEHOLDER" below are generic scaffolding (not fabricated
 * specific facts) meant to be swapped for the real thing. `name`, `title`,
 * `location`, `bio` and `socials` already reflect what's live on the site.
 */

export type JourneyMilestone = {
  year: string;
  title: string;
  description: string;
};

export type ExperienceEntry = {
  role: string;
  organization: string;
  period: string;
  description: string;
  tech: string[];
};

export type SkillBadge = {
  name: string;
  level: number; // 0-100, drives size/emphasis of the floating badge
};

export type StatEntry = {
  label: string;
  value: number;
  suffix?: string;
};

export type PhilosophyPrinciple = {
  title: string;
  description: string;
};

export type SocialLink = {
  label: string;
  href: string | null;
  icon: "github" | "linkedin" | "twitter" | "instagram" | "facebook" | "whatsapp" | "email";
};

export type AvailabilityStatus = "available" | "limited" | "unavailable";

export type AboutData = {
  name: string;
  title: string;
  location: string;
  bio: string;
  longBio: string;
  journey: JourneyMilestone[];
  experience: ExperienceEntry[];
  skills: SkillBadge[];
  techStack: string[];
  stats: StatEntry[];
  philosophy: {
    statement: string;
    principles: PhilosophyPrinciple[];
  };
  availability: {
    status: AvailabilityStatus;
    message: string;
    responseTime: string;
  };
  socials: SocialLink[];
  contactEmail: string;
  resumeUrl: string;
};

export const about: AboutData = {
  name: "Tahasin Islam",
  title: "Full Stack Developer & UI/UX Designer",
  location: "Khulna, Bangladesh",
  bio: "I'm a passionate Full Stack Developer & UI/UX Designer who loves turning ideas into beautiful, functional and user-friendly digital experiences.",
  longBio:
    "PLACEHOLDER — replace with a longer, first-person story: how you got into development/design, what drives you, and what kind of work you want to be doing more of. This block is meant to anchor the editorial hero section, so it should read like you, not like a template.",

  journey: [
    {
      year: "Started learning UI/UX Design",
      title: "🌱 Where it started (2023)",
      description:
        "I wrote my first lines of HTML and CSS out of curiosity. What started as simple web pages quickly turned into a passion for creating interactive and visually appealing digital experiences.",
    },
    {
      year: "🌐 Built my first portfolio",
      title: "🚀 First real project (2024)",
      description:
        "I built my first complete responsive website and published it online. Seeing people use something I created inspired me to take web development more seriously.",
    },
    {
      year: "🏆 Learning Three.js & Creative Development",
      title: "⚡ Leveling up (2025)",
      description:
        "I expanded my skills by learning JavaScript, React, Next.js, Tailwind CSS, GSAP, and Framer Motion. I began focusing on premium UI, smooth animations, and modern user experiences.",
    },
    {
      year: "💼 Started building client-ready projects",
      title: "💻 Today (2026)",
      description:
        "'m a Computer Science student at Northern University Bangladesh, building modern full-stack web applications while continuously improving my frontend craftsmanship. My goal is to create award-winning digital experiences and grow into a professional Full-Stack Developer.",
    },
  ],

  experience: [
    {
      role: "Front-End Developer",
      organization: "Personal Portfolio & Web Projects",
      period: "2024 – Present",
      description:
        "Building responsive and modern web applications using React, Next.js, TypeScript, and Tailwind CSS. Focused on creating premium user interfaces, smooth animations, and high-performance web experiences inspired by modern design standards.",
      tech: ["Next.js", "TypeScript", "Tailwind CSS","GSAP","Framer Motion"],
    },
    {
      role: "UI/UX Designer",
      organization: "Personal Design Projects",
      period: "2023 – Present",
      description:
        "Designing clean, intuitive, and user-friendly interfaces with Figma. Continuously improving visual hierarchy, typography, responsive layouts, and design systems to create engaging digital experiences.",
      tech: ["UI Design", "Prototyping", "Design System","Wireframing"],
    },
    {
      role: "Full Stack Developer (Learning)",
      organization: "Self-Learning & Personal Projects",
      period: "2025 – Present",
      description:
        "Expanding my skills into backend development with Node.js, Express.js, MongoDB, and REST APIs while building full-stack applications and improving software architecture and problem-solving abilities.",
      tech: ["Node.js", "Express.js", "MongoDB","REST API","JavaScript"],
    },
  ],

  skills: [
    { name: "React.js", level: 95 },
    { name: "Next.js", level: 98 },
    { name: "TypeScript", level: 85 },
    { name: "Tailwind CSS", level: 95 },
    { name: "GSAP", level: 85 },
    { name: "Framer Motion", level: 78 },
    { name: "Three.js", level: 65 },
    { name: "UI / UX Design", level: 98 },
    { name: "Figma", level: 78 },
    { name: "SEO", level: 82 },
    { name: "JavaScript", level: 94 },
  ],

  techStack: [
    "React",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "GSAP",
    "Framer Motion",
    "Three.js",
    "Node.js",
    "Git",
  ],

  stats: [
    { label: "Years of experience", value: 3, suffix: "+" },
    { label: "Projects completed", value: 30, suffix: "+" },
    { label: "Happy clients", value: 15, suffix: "+" },
    { label: "Cups of coffee", value: 500, suffix: "+" },
  ],

  philosophy: {
    statement:
      "I believe great digital experiences are created by combining thoughtful design, clean code, and continuous learning. Every project is an opportunity to solve real problems and create something meaningful.",
    principles: [
      {
        title: "Design with Purpose",
        description:
          "Every interface should solve a real problem while remaining simple, intuitive, and visually engaging. I focus on creating experiences that users enjoy and remember.",
      },
      {
        title: "Performance Matters",
        description:
          "A fast, responsive website is just as important as its appearance. I optimize every project to deliver smooth interactions and excellent performance across all devices.",
      },
      {
        title: "Keep Learning & Improving",
        description:
          "Technology evolves every day, and so do I. I continuously explore new frameworks, tools, and best practices to build better products and grow as a developer.",
      },
    ],
  },

  availability: {
    status: "available",
    message: "Currently open to new projects and collaborations.",
    responseTime: "Typically responds within 24 hours",
  },

  socials: [
    { label: "Facebook", href: "https://www.facebook.com/tahasin.islam.arnob0", icon: "facebook" },
    { label: "Instagram", href: "https://www.instagram.com/tahasin.islam.arnob0/", icon: "instagram" },
    { label: "WhatsApp", href: "https://wa.me/8801568842688", icon: "whatsapp" },
    { label: "GitHub", href: null, icon: "github" },
    { label: "LinkedIn", href: null, icon: "linkedin" },
    { label: "X (Twitter)", href: null, icon: "twitter" },
  ],

  contactEmail: "contact.tahasin@gmail.com",
  resumeUrl: "https://drive.google.com/file/d/18fRvTjp9gbe95LtAcKsl3KNfoNXOgG14/view?usp=sharing",
};
