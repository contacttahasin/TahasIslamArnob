/**
 * Content for the Vlog page. VlogGrid/VlogCard render purely from this
 * array — no post copy should live in the component files.
 *
 * PLACEHOLDER entries below — swap `title`, `excerpt`, `date`, `readTime`
 * for real posts as they're written. The shape (`VlogPost`) is what matters.
 */

export type VlogCategory =
  | "development"
  | "nextjs"
  | "react"
  | "full-stack"
  | "animation"
  | "design"
  | "portfolio"
  | "learning"
  | "journey";

export type VlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: VlogCategory;
  date: string; // ISO
  readTime: string;
  featured?: boolean;
};

export const vlogCategories: { value: VlogCategory; label: string }[] = [
  { value: "development", label: "Development" },
  { value: "nextjs", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "full-stack", label: "Full Stack" },
  { value: "animation", label: "Animation" },
  { value: "design", label: "Design" },
  { value: "portfolio", label: "Portfolio" },
  { value: "learning", label: "Learning" },
  { value: "journey", label: "Journey" },
];

export const vlogPosts: VlogPost[] = [
  {
    slug: "shipping-the-noir-redesign",
  title: "Building My Premium Portfolio",
  excerpt:
    "How I redesigned my portfolio from scratch using Next.js, Tailwind CSS, GSAP, and Framer Motion to create a modern, interactive, and award-inspired user experience.",
  category: "portfolio",
  date: "2026-06-18",
  readTime: "6 min",
  featured: true,
  },
  {
    slug: "learning-react-three-fiber",
  title: "My Journey Learning React Three Fiber",
  excerpt:
    "Exploring React Three Fiber wasn't easy. From blank canvases to interactive 3D scenes, this article shares the challenges I faced and the lessons I learned while building immersive web experiences.",
  category: "learning",
  date: "2026-05-22",
  readTime: "5 min",
  },
  {
  slug: "lessons-from-bug-fixing",
  title: "What Debugging Has Taught Me",
  excerpt:
    "Every bug is an opportunity to learn. Here are the debugging habits that have helped me become a better developer.",
  category: "learning",
  date: "2025-10-29",
  readTime: "5 min",
  },
  {
     slug: "road-to-fullstack",
  title: "My Road to Becoming a Full Stack Developer",
  excerpt:
    "From writing my first HTML page to building modern web applications, this is the journey, challenges, and goals that continue to shape my career.",
  category: "journey",
  date: "2025-10-12",
  readTime: "7 min",
  },
  {
    slug: "designing-with-constraints",
    title: "Designing With Constraints",
    excerpt:
      "Why picking one accent color and one type scale early made every later decision faster, not slower.",
    category: "design",
    date: "2026-03-27",
    readTime: "5 min",
  },
  {
    slug: "what-im-learning-next",
    title: "What I'm Learning Next",
    excerpt:
      "A running list of the tools and concepts on deck — shaders, edge functions, and a proper design token pipeline.",
    category: "learning",
    date: "2026-03-09",
    readTime: "3 min",
  },
  {
  slug: "modern-web-development-workflow",
  title: "My Modern Web Development Workflow",
  excerpt:
    "A look at the tools, techniques, and habits I use to plan, build, and deploy modern web applications efficiently.",
  category: "development",
  date: "2026-07-05",
  readTime: "6 min",
},
{
  slug: "why-i-love-nextjs",
  title: "Why Next.js Became My Favorite Framework",
  excerpt:
    "From App Router to server rendering and performance optimization, here's why Next.js transformed the way I build web applications.",
  category: "nextjs",
  date: "2026-06-28",
  readTime: "7 min",
},
{
  slug: "react-best-practices",
  title: "React Practices That Improved My Code",
  excerpt:
    "The React patterns and component architecture that helped me write cleaner, reusable, and easier-to-maintain applications.",
  category: "react",
  date: "2026-06-14",
  readTime: "5 min",
},
{
  slug: "my-fullstack-learning-journey",
  title: "My Journey Toward Full Stack Development",
  excerpt:
    "Learning backend technologies opened a new perspective on web development. Here's how I'm growing beyond the frontend.",
  category: "full-stack",
  date: "2026-05-30",
  readTime: "8 min",
},
{
  slug: "bringing-websites-to-life",
  title: "Bringing Websites to Life with Animation",
  excerpt:
    "How I use GSAP, Framer Motion, and subtle interactions to create engaging user experiences without sacrificing performance.",
  category: "animation",
  date: "2026-05-18",
  readTime: "6 min",
},
{
  slug: "designing-better-user-experiences",
  title: "Designing Interfaces People Enjoy Using",
  excerpt:
    "Good design is more than aesthetics. Here's how I approach spacing, typography, colors, and usability in every project.",
  category: "design",
  date: "2026-05-04",
  readTime: "5 min",
},
{
  slug: "building-my-personal-portfolio",
  title: "Building My Premium Portfolio",
  excerpt:
    "The complete story behind designing and developing my portfolio using Next.js, Tailwind CSS, GSAP, and modern UI principles.",
  category: "portfolio",
  date: "2026-04-20",
  readTime: "7 min",
  featured: true,
},
{
  slug: "what-i-learned-this-month",
  title: "What I Learned This Month",
  excerpt:
    "A monthly reflection on the technologies, challenges, and new concepts I explored while improving my development skills.",
  category: "learning",
  date: "2026-04-08",
  readTime: "4 min",
},
{
  slug: "from-curiosity-to-developer",
  title: "From Curiosity to Developer",
  excerpt:
    "Looking back at my journey from writing my first HTML page to building modern full-stack applications and chasing bigger goals.",
  category: "journey",
  date: "2026-03-25",
  readTime: "6 min",
},

];
