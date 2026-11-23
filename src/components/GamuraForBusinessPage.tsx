import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Check,
  Download,
  ExternalLink,
  Moon,
  Play,
  Plus,
  Search,
  Share2,
  Sun,
  UserCheck,
  X,
} from "lucide-react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";
import {
  BUILTIN_STORE_APPS,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  readStoreJson,
  removeAppFromUniverse,
  type StoreAppItem,
} from "../utils/gamuraStoreApps";

interface GamuraForBusinessPageProps {
  onBackHome: () => void;
}

interface LessonItem {
  t: string;
  b: string;
}

interface BusinessCourse {
  id: number;
  t: string;
  cat: string;
  ic: string;
  d: string;
  c: string;
  L: LessonItem[];
  term: string;
  task: string;
}

interface BusinessUserSession {
  name: string;
  email: string;
  provider: "google" | "email" | "guest";
}

interface BusinessProgressState {
  done: Record<string, boolean>;
  vid: Record<string, string>;
  notes: Record<number, string>;
  name: string;
  dates: Record<number, string>;
}

const COLORS = [
  "#D97757",
  "#6A9B7F",
  "#8A80C4",
  "#5B9BD5",
  "#C9A227",
  "#D4627A",
  "#4FA3A5",
];

const RAW_COURSES: [string, string, string, string, string[], string][] = [
  [
    "Business Fundamentals",
    "Foundations",
    "🏛️",
    "How businesses create, deliver and capture value.",
    [
      "What a business is|A business solves a problem for customers in exchange for money. Every company does three jobs: create value, deliver it, and capture part of it as revenue.",
      "Business models|A model explains who you serve, what you offer and how you earn: subscription, commission, retail margin or advertising. Choose one clear model before you try to scale.",
      "Revenue, cost and profit|Profit is revenue minus costs. Separate fixed costs such as rent from variable costs such as materials, and calculate your break-even point.",
      "Your one-page plan|Write the customer, problem, offer, price, channel and 90-day goal on one page. Then test it with five real customers before building more.",
    ],
    "Value proposition|Describe a local shop's customer, problem and offer in three sentences.",
  ],
  [
    "Entrepreneurship",
    "Startups",
    "🚀",
    "Turn an idea into a business people pay for.",
    [
      "Finding a real problem|Strong startups begin with a painful, frequent problem. Interview ten people who have it and listen for the words they use to describe it.",
      "Validating your idea|Before building, test demand: a landing page, a pre-order or a manual service. Ten paying customers teach more than a hundred compliments.",
      "Building the MVP|A minimum viable product has only the features needed to solve the core problem. Ship in weeks, not months, and learn from real use.",
      "Launch and iterate|Launch to a small group, measure what they do, and improve weekly. Growth follows a product that people keep using.",
    ],
    "Minimum viable product|Sketch the smallest version of your idea and list the one feature it must have.",
  ],
  [
    "Startup Funding",
    "Finance",
    "💰",
    "Bootstrapping, angels, VCs and pitching.",
    [
      "Bootstrapping|Funding yourself keeps full ownership and forces discipline. Start with customer revenue, low fixed costs and a clear monthly cash target.",
      "Angels and venture capital|Angels invest early with personal money; VCs invest funds for large returns. Raise only when extra capital clearly speeds up proven growth.",
      "Valuation and equity|Equity is a share of ownership. Giving 20% for a seed round means your valuation is five times the cheque. Protect founder shares with vesting.",
      "Pitching investors|A good pitch covers problem, solution, market, traction, team and ask in about ten slides. Lead with your best proof, such as revenue or users.",
    ],
    "Runway|Calculate how many months your cash lasts at current monthly spending.",
  ],
  [
    "Digital Marketing",
    "Marketing",
    "📣",
    "SEO, social, email and paid growth.",
    [
      "Know your audience|Define who you serve, where they spend time and what they search for. One precise audience beats a broad one.",
      "SEO and content|Search engines reward helpful pages that match a query. Choose keywords with clear intent, answer them fully and earn links over time.",
      "Social and email|Social builds attention; email builds a relationship you own. Post consistently, collect addresses and send one useful message each week.",
      "Ads and analytics|Test small paid campaigns and track cost per customer against lifetime value. Stop what loses money and scale what pays back.",
    ],
    "Conversion rate|Pick a page you own and write one change that could raise sign-ups.",
  ],
  [
    "Sales Mastery",
    "Sales",
    "🤝",
    "Prospecting, pitching and closing deals.",
    [
      "The sales process|Selling is a sequence: find leads, qualify them, present, handle objections and close. Track every deal through each stage.",
      "Prospecting|Build a list of people who match your ideal customer and reach out with a short, specific message about their problem, not your product.",
      "Discovery and pitch|Ask questions first. Learn goals, budget and decision makers, then explain how your offer solves their stated problem.",
      "Objections and closing|Treat objections as requests for information. Confirm the concern, answer it, and ask directly for the next step or the order.",
    ],
    "Qualified lead|Write three questions that tell you if a prospect can really buy.",
  ],
  [
    "Finance Basics",
    "Finance",
    "📊",
    "Cash flow, margins, budgets and ratios.",
    [
      "Cash vs profit|A profitable business can still run out of cash if customers pay late. Watch cash flow weekly and keep a buffer for three months of costs.",
      "Margins and pricing|Gross margin is price minus direct cost, divided by price. Set prices from value and margin, not by copying competitors.",
      "Budgeting|A budget plans income and spending by month. Compare actual numbers with the plan and investigate any large gap.",
      "Key ratios|Track gross margin, net margin, current ratio and return on investment. A few ratios, reviewed regularly, reveal problems early.",
    ],
    "Gross margin|Pick a product, list its direct costs and compute its gross margin.",
  ],
  [
    "Accounting Essentials",
    "Finance",
    "🧾",
    "Books, statements and tax awareness.",
    [
      "The accounting equation|Assets equal liabilities plus equity. Every transaction changes at least two accounts, which keeps the books balanced.",
      "Bookkeeping habits|Record every sale and expense, keep receipts and reconcile your bank account monthly. Clean books make tax time simple.",
      "Financial statements|The income statement shows profit over a period, the balance sheet shows position on a date, and the cash flow statement shows money movement.",
      "Tax awareness|Know your local tax registration, filing dates and deductible expenses. Set aside a share of income for tax and ask an accountant when unsure.",
    ],
    "Double-entry bookkeeping|Record five imaginary transactions as debit and credit pairs.",
  ],
  [
    "Leadership",
    "People",
    "🧭",
    "Lead teams with clarity and trust.",
    [
      "Leader vs manager|Managers organise work; leaders set direction and inspire people. Strong teams need both clear systems and a clear purpose.",
      "Vision and goals|State where the team is going and why it matters. Turn the vision into measurable goals reviewed every quarter.",
      "Feedback and coaching|Give specific, timely feedback on behaviour and results. Ask questions that help people solve problems themselves.",
      "Building trust|Trust grows when you keep promises, admit mistakes and credit others. Consistency matters more than charisma.",
    ],
    "Servant leadership|Ask a teammate what blocks them this week and remove one thing.",
  ],
  [
    "Project Management",
    "Operations",
    "🗂️",
    "Plan, track and deliver on time.",
    [
      "Scope and goals|Define what is in and out of the project, the deliverables and the success measure. Unclear scope is the top cause of delay.",
      "Planning and timelines|Break work into tasks, estimate time, find dependencies and set milestones. Add a buffer for the unexpected.",
      "Agile and Kanban|Agile delivers in short cycles with regular review; Kanban visualises work in To Do, Doing and Done columns with limits on work in progress.",
      "Risks and delivery|List risks early, assign owners and review weekly. Report progress honestly and close with a short lessons-learned meeting.",
    ],
    "Critical path|List a project's tasks and mark the chain that sets its end date.",
  ],
  [
    "Business Strategy",
    "Strategy",
    "♟️",
    "Positioning, moats and competitive analysis.",
    [
      "What strategy is|Strategy is choosing what you will do and, just as important, what you will not do, to win in a defined market.",
      "Competitive analysis|List your competitors, their customers, prices and weaknesses. Look for needs that nobody serves well.",
      "SWOT and positioning|Map strengths, weaknesses, opportunities and threats. Position your brand around one clear promise that customers remember.",
      "Building a moat|A moat protects profit: brand, network effects, switching costs, cost advantage or special expertise. Invest in one that fits you.",
    ],
    "Competitive advantage|Name one thing you do better than rivals and how you could prove it.",
  ],
  [
    "Negotiation",
    "People",
    "⚖️",
    "Win-win deals and hard conversations.",
    [
      "Prepare first|Know your goal, your walk-away point and your best alternative. The side with better alternatives has more power.",
      "Interests, not positions|Ask why the other side wants something. Underlying interests often allow solutions that satisfy both parties.",
      "Tactics and anchoring|The first number often anchors the talk. Make reasoned offers, trade concessions rather than give them, and stay calm under pressure.",
      "Closing the deal|Summarise terms aloud, confirm in writing and set next steps. A fair deal that both sides honour beats a hard win.",
    ],
    "BATNA|Write your best alternative to a deal you are negotiating.",
  ],
  [
    "Business Communication",
    "People",
    "✉️",
    "Emails, meetings and presentations.",
    [
      "Clear writing|Lead with the point, use short sentences and state the action you need. Cut every word that does no work.",
      "Professional email|Use a specific subject line, greet politely, keep to one topic and end with a clear request and date.",
      "Running meetings|Share an agenda, invite only needed people, keep time and finish with owners and deadlines for each decision.",
      "Presenting|Tell a story: situation, problem, solution, result. Use few words per slide, practise aloud and welcome questions.",
    ],
    "Active voice|Rewrite three sentences from an old email in active voice.",
  ],
  [
    "E-commerce",
    "Marketing",
    "🛒",
    "Launch and scale an online store.",
    [
      "Choosing products|Pick products with steady demand, healthy margin and manageable shipping. Check competitors and customer reviews first.",
      "Setting up the store|Use a trusted platform, clear photos, honest descriptions, simple checkout and visible policies for returns and delivery.",
      "Traffic and conversion|Bring visitors through search, social and email, then improve the conversion rate with faster pages and trust signals.",
      "Fulfilment and service|Ship reliably, track orders and answer messages quickly. Happy customers return and refer others.",
    ],
    "Average order value|Suggest one bundle that would raise average order value.",
  ],
  [
    "Product Management",
    "Strategy",
    "🧩",
    "Roadmaps, users and shipping the right thing.",
    [
      "The PM role|A product manager decides what to build and why, balancing user needs, business goals and technical limits.",
      "User research|Talk to users regularly. Look for repeated pain points and watch what they do rather than only what they say.",
      "Prioritising|Score ideas by impact and effort, or use RICE: reach, impact, confidence and effort. Say no to most requests.",
      "Roadmap and metrics|A roadmap shows outcomes by quarter, not fixed dates. Measure adoption, retention and satisfaction after each release.",
    ],
    "Product-market fit|Ask five users how disappointed they would be if your product vanished.",
  ],
  [
    "Data for Business",
    "Analytics",
    "📈",
    "Dashboards, KPIs and decisions from data.",
    [
      "Why data matters|Decisions based on evidence beat guesses. Start with a question, then collect only the data that helps answer it.",
      "Choosing KPIs|A KPI links to a goal: revenue, conversion rate, churn or customer acquisition cost. Fewer, clearer KPIs drive better focus.",
      "Spreadsheets and dashboards|Clean data, use pivot tables and build one dashboard that shows trends over time with clear charts.",
      "Making decisions|Check sample size and bias, run small experiments and record what you learned so the team improves each cycle.",
    ],
    "Cohort analysis|Group customers by sign-up month and compare their retention.",
  ],
  [
    "AI for Business",
    "Analytics",
    "🤖",
    "Use AI tools to save time and grow.",
    [
      "What AI can do|AI drafts text, summarises documents, analyses data and answers questions. It speeds up routine work but needs human review.",
      "Good prompting|Give context, a clear task, the format you want and examples. Refine the result with follow-up instructions.",
      "Use cases|Apply AI to customer support replies, marketing drafts, research, meeting notes and spreadsheet analysis. Start with one repeated task.",
      "Safety and ethics|Never paste private customer data into tools you do not trust. Check facts, disclose AI use where needed and keep humans responsible.",
    ],
    "Prompt|Write a prompt with role, task, context and format for a weekly report.",
  ],
  [
    "Customer Success",
    "Sales",
    "💬",
    "Retention, support and loyalty.",
    [
      "Why retention wins|Keeping a customer costs far less than finding a new one. Small gains in retention grow profit strongly.",
      "Onboarding|Help new customers reach their first success quickly with a short guide, a welcome message and a check-in within a week.",
      "Support that solves|Reply fast, own the problem and follow up until it is fixed. Record common issues and fix the cause.",
      "Feedback and loyalty|Ask for feedback with simple surveys such as NPS, act on it and reward loyal customers with referrals and recognition.",
    ],
    "Net Promoter Score|Ask ten customers how likely they are to recommend you, from 0 to 10.",
  ],
  [
    "Operations & Logistics",
    "Operations",
    "🚚",
    "Supply chains, inventory and delivery.",
    [
      "Operations basics|Operations turn inputs into products or services efficiently. Map each step, find the slowest one and improve it.",
      "Supply chain|Choose reliable suppliers, keep backups and agree on quality, price and delivery terms in writing.",
      "Inventory|Too much stock ties up cash; too little loses sales. Use reorder points and review fast and slow sellers monthly.",
      "Delivery and quality|Pick carriers by speed, cost and tracking. Measure on-time delivery and defect rates, and fix root causes.",
    ],
    "Lead time|Time one process from order to delivery and find its slowest step.",
  ],
  [
    "HR & Team Building",
    "People",
    "👥",
    "Hiring, culture and performance.",
    [
      "Hiring well|Write a clear role, use structured interviews with the same questions and check references. Hire for skills and values.",
      "Onboarding and culture|A good first month explains goals, tools and expectations. Culture is what you reward and tolerate every day.",
      "Performance reviews|Set clear goals, review progress often and discuss growth, not only mistakes. Document decisions fairly.",
      "Retention and teamwork|People stay for growth, respect and fair pay. Encourage collaboration, recognise results and handle conflict early.",
    ],
    "Onboarding|Draft a 5-step first-week plan for a new hire.",
  ],
  [
    "Business Law Basics",
    "Foundations",
    "📜",
    "Contracts, IP and compliance basics.",
    [
      "Business structures|Sole proprietorship, partnership and company forms differ in liability, tax and paperwork. Choose with professional advice.",
      "Contracts|A valid contract needs offer, acceptance, consideration and intent. Put terms in writing: scope, price, dates and how to end it.",
      "Intellectual property|Trademarks protect names and logos, copyright protects creative work and patents protect inventions. Register what matters early.",
      "Compliance and privacy|Follow licences, tax, labour and data-protection rules in your country. This course is educational, not legal advice.",
    ],
    "Intellectual property|List the names, logos and content your business should protect.",
  ],
  [
    "Personal Branding",
    "Marketing",
    "🌟",
    "Build a reputation that opens doors.",
    [
      "Your brand|Your brand is what people say about you when you are not there. Decide the three qualities you want to be known for.",
      "Online presence|Keep a clear profile photo, headline and portfolio. Show real projects and results on LinkedIn and your own site.",
      "Content and networking|Share what you learn, comment thoughtfully and reach out to people with a specific, polite message.",
      "Reputation|Deliver on time, be honest and ask for recommendations. Consistency over years builds opportunity.",
    ],
    "Personal brand|Write a 20-word statement of who you help and how.",
  ],
];

const COURSES: BusinessCourse[] = RAW_COURSES.map((c, i) => {
  const [term, task] = c[5].split("|");
  return {
    id: i,
    t: c[0],
    cat: c[1],
    ic: c[2],
    d: c[3],
    c: COLORS[i % 7],
    L: c[4].map((x) => {
      const [lt, ...rest] = x.split("|");
      return { t: lt, b: rest.join("|") };
    }),
    term,
    task,
  };
});

const CATEGORIES = ["All", ...Array.from(new Set(COURSES.map((c) => c.cat)))];

interface BadgeDef {
  icon: string;
  title: string;
  desc: string;
  check: (s: { lessons: number; courses: number }) => boolean;
}

const BADGES: BadgeDef[] = [
  { icon: "🌱", title: "First Step", desc: "Complete 1 lesson", check: (s) => s.lessons >= 1 },
  { icon: "🎓", title: "Finisher", desc: "Finish 1 course", check: (s) => s.courses >= 1 },
  { icon: "🔥", title: "On a Roll", desc: "Finish 3 courses", check: (s) => s.courses >= 3 },
  { icon: "📘", title: "Scholar", desc: "Finish 5 courses", check: (s) => s.courses >= 5 },
  { icon: "🏆", title: "Master", desc: "Finish 10 courses", check: (s) => s.courses >= 10 },
  { icon: "👑", title: "Gamura Legend", desc: "Finish all 21", check: (s) => s.courses >= 21 },
];

const SESSION_KEY = "gbz_sess";
const USERS_KEY = "gbz_users";
const THEME_KEY = "gbz_theme_v1";

function extractYoutubeId(url: string): string | null {
  const m = (url || "").match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function certHash(s: string): string {
  let h = 7;
  for (let idx = 0; idx < s.length; idx++) {
    h = (h * 31 + s.charCodeAt(idx)) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function GamuraArcMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" strokeWidth="4" strokeLinecap="round">
      <path d="M13 3A10 10 0 0 0 3 13" stroke="#D93025" />
      <path d="M3 13A10 10 0 0 0 13 23" stroke="#1E8E3E" />
      <path d="M13 23A10 10 0 0 0 23 13H14" stroke="#F2B600" />
      <path d="M13 3A10 10 0 0 1 22 8" stroke="#1A5FB4" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

export default function GamuraForBusinessPage({
  onBackHome,
}: GamuraForBusinessPageProps) {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark") return true;
      if (saved === "light") return false;
      return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches || false;
    } catch {
      return false;
    }
  });

  const [session, setSession] = useState<BusinessUserSession | null>(() => {
    const saved = readStoreJson<BusinessUserSession | null>(SESSION_KEY, null);
    if (saved) return saved;
    if (auth.currentUser) {
      return {
        name: auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "Learner",
        email: (auth.currentUser.email || `${auth.currentUser.uid}@gamura.app`).toLowerCase(),
        provider: "google",
      };
    }
    return null;
  });

  const [progress, setProgress] = useState<BusinessProgressState>(() => {
    if (!session) return { done: {}, vid: {}, notes: {}, name: "", dates: {} };
    const stored = readStoreJson<Partial<BusinessProgressState>>(`gbz_p_${session.email}`, {});
    return {
      done: stored.done || {},
      vid: stored.vid || {},
      notes: stored.notes || {},
      name: stored.name || session.name,
      dates: stored.dates || {},
    };
  });

  // Auth form state
  const [authMode, setAuthMode] = useState<"in" | "up">("in");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authConfirm, setAuthConfirm] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // Store installation state
  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-for-business",
    ),
  );

  // Navigation & Course Workspace state
  const [tab, setTab] = useState<"Courses" | "My learning" | "Badges" | "Certificates">("Courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [openCourseId, setOpenCourseId] = useState<number | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [videoInput, setVideoInput] = useState("");

  // Modals & Toasts
  const [accountOpen, setAccountOpen] = useState(false);
  const [certCourseId, setCertCourseId] = useState<number | null>(null);
  const [certDataUrl, setCertDataUrl] = useState("");
  const certCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Gamura for Business";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      // ignore storage errors
    }
  }, [dark]);

  // Keep synced with Store uninstall/install events
  useEffect(() => {
    const syncStore = () => {
      setInstalledInUniverse(
        readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
          (a) => a.id === "gamura-for-business",
        ),
      );
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, syncStore);
    window.addEventListener("storage", syncStore);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, syncStore);
      window.removeEventListener("storage", syncStore);
    };
  }, []);

  // Automatically adopt Firebase sign-in if session isn't set yet
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && !readStoreJson<BusinessUserSession | null>(SESSION_KEY, null)) {
        const nextUser: BusinessUserSession = {
          name: fbUser.displayName || fbUser.email?.split("@")[0] || "Learner",
          email: (fbUser.email || `${fbUser.uid}@gamura.app`).toLowerCase(),
          provider: "google",
        };
        setSession(nextUser);
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        } catch {
          // ignore
        }
      }
    });
    return () => unsub();
  }, []);

  // Load & persist progress whenever session changes
  useEffect(() => {
    if (!session) return;
    const stored = readStoreJson<Partial<BusinessProgressState>>(`gbz_p_${session.email}`, {});
    setProgress({
      done: stored.done || {},
      vid: stored.vid || {},
      notes: stored.notes || {},
      name: stored.name || session.name,
      dates: stored.dates || {},
    });
  }, [session]);

  const persistProgress = useCallback(
    (next: BusinessProgressState) => {
      setProgress(next);
      if (!session) return;
      try {
        localStorage.setItem(`gbz_p_${session.email}`, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
    },
    [session],
  );

  // Sync video URL field when navigating courses/lessons
  useEffect(() => {
    if (openCourseId === null) {
      setVideoInput("");
      return;
    }
    setVideoInput(progress.vid[`${openCourseId}:${lessonIndex}`] || "");
  }, [openCourseId, lessonIndex, progress.vid]);

  const getCourseProgress = useCallback(
    (courseId: number) =>
      COURSES[courseId].L.filter((_, lIdx) => Boolean(progress.done[`${courseId}:${lIdx}`])).length,
    [progress.done],
  );

  const stats = useMemo(() => {
    const lessons = Object.values(progress.done).filter(Boolean).length;
    const courses = COURSES.filter((c) => getCourseProgress(c.id) === 4).length;
    const badges = BADGES.filter((b) => b.check({ lessons, courses })).length;
    return { lessons, courses, badges };
  }, [progress.done, getCourseProgress]);

  const inProgressCourse = useMemo(
    () =>
      COURSES.find((c) => {
        const p = getCourseProgress(c.id);
        return p > 0 && p < 4;
      }) || null,
    [getCourseProgress],
  );

  const visibleCourses = useMemo(() => {
    if (tab === "Courses") {
      const q = searchQuery.trim().toLowerCase();
      return COURSES.filter(
        (c) =>
          (categoryFilter === "All" || c.cat === categoryFilter) &&
          (!q || `${c.t} ${c.cat} ${c.d}`.toLowerCase().includes(q)),
      );
    }
    if (tab === "My learning") {
      return COURSES.filter((c) => {
        const p = getCourseProgress(c.id);
        return p > 0 && p < 4;
      });
    }
    if (tab === "Certificates") {
      return COURSES.filter((c) => getCourseProgress(c.id) === 4);
    }
    return [];
  }, [tab, searchQuery, categoryFilter, getCourseProgress]);

  const activateSession = (nextUser: BusinessUserSession) => {
    setSession(nextUser);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    } catch {
      // ignore
    }
    setOpenCourseId(null);
    setTab("Courses");
    setAuthError("");
    showToast(`Signed in as ${nextUser.name}`);
  };

  const handleToggleUniverse = () => {
    const storeItem = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-for-business");
    if (!storeItem) return;
    if (installedInUniverse) {
      removeAppFromUniverse(storeItem.id);
      setInstalledInUniverse(false);
      showToast("Removed from Universe Apps");
    } else {
      addAppToUniverse(storeItem);
      setInstalledInUniverse(true);
      showToast("Added to Universe Apps");
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = authEmail.trim().toLowerCase();
    const cleanName = authName.trim();
    const users = readStoreJson<
      Record<string, { name: string; salt: string; hash: string }>
    >(USERS_KEY, {});

    if (authMode === "up" && cleanName.length < 2) {
      setAuthError("Enter your full name.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      setAuthError("Enter a valid email address.");
      return;
    }
    if (authMode === "up" && authPass.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }
    if (authMode === "up" && authPass !== authConfirm) {
      setAuthError("Passwords do not match.");
      return;
    }

    setAuthBusy(true);
    setAuthError("");
    try {
      if (authMode === "up") {
        if (users[em]) {
          setAuthError("An account with this email already exists.");
          return;
        }
        const salt = crypto.getRandomValues(new Uint32Array(2)).join("-");
        const hash = await sha256Hex(salt + authPass);
        const nextUsers = { ...users, [em]: { name: cleanName, salt, hash } };
        localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
        activateSession({ name: cleanName, email: em, provider: "email" });
      } else {
        const existing = users[em];
        if (!existing || (await sha256Hex(existing.salt + authPass)) !== existing.hash) {
          setAuthError("Incorrect email or password.");
          return;
        }
        activateSession({ name: existing.name, email: em, provider: "email" });
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const res = await signInWithPopup(auth, provider);
      const email = (res.user.email || `${res.user.uid}@gamura.app`).toLowerCase();
      const name = res.user.displayName || email.split("@")[0] || "Learner";
      activateSession({ name, email, provider: "google" });
    } catch {
      setAuthError("Google popup closed or unavailable. Continue with Email or Guest below.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleContinueGuest = () => {
    activateSession({
      name: "Business Learner",
      email: "learner@gamura.local",
      provider: "guest",
    });
  };

  const handleToggleLessonDone = (courseIdx: number, lesIdx: number) => {
    const key = `${courseIdx}:${lesIdx}`;
    const wasComplete = getCourseProgress(courseIdx) === 4;
    const nextDone = { ...progress.done, [key]: !progress.done[key] };
    const nextCompletedCount = COURSES[courseIdx].L.filter((_, i) => Boolean(nextDone[`${courseIdx}:${i}`])).length;
    const nextDates = { ...progress.dates };
    if (!wasComplete && nextCompletedCount === 4) {
      nextDates[courseIdx] = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      showToast("Course complete! Certificate unlocked");
    }
    persistProgress({
      ...progress,
      done: nextDone,
      dates: nextDates,
    });
  };

  const handleSaveVideoUrl = () => {
    if (openCourseId === null) return;
    if (!extractYoutubeId(videoInput)) {
      showToast("Paste a valid YouTube link");
      return;
    }
    persistProgress({
      ...progress,
      vid: {
        ...progress.vid,
        [`${openCourseId}:${lessonIndex}`]: videoInput.trim(),
      },
    });
    showToast("Video loaded inside lesson");
  };

  const handleClearVideoUrl = () => {
    if (openCourseId === null) return;
    const nextVid = { ...progress.vid };
    delete nextVid[`${openCourseId}:${lessonIndex}`];
    setVideoInput("");
    persistProgress({ ...progress, vid: nextVid });
  };

  // High-resolution Certificate Canvas Generator (1600x1130)
  const renderCertificateCanvas = useCallback(
    (courseId: number, recipientName: string) => {
      const course = COURSES[courseId];
      const W = 1600;
      const H = 1130;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const x = canvas.getContext("2d");
      if (!x) return canvas;

      const nm = (recipientName || "Your Name").trim();
      x.fillStyle = "#ffffff";
      x.fillRect(0, 0, W, H);
      x.strokeStyle = "#111111";
      x.lineWidth = 8;
      x.strokeRect(50, 50, W - 100, H - 100);
      x.lineWidth = 2;
      x.strokeRect(74, 74, W - 148, H - 148);

      [
        [74, 74, 1, 1],
        [W - 74, 74, -1, 1],
        [74, H - 74, 1, -1],
        [W - 74, H - 74, -1, -1],
      ].forEach(([ax, ay, dx, dy]) => {
        x.lineWidth = 6;
        x.beginPath();
        x.moveTo(ax, ay + dy * 70);
        x.lineTo(ax, ay);
        x.lineTo(ax + dx * 70, ay);
        x.stroke();
      });

      const drawCentered = (
        text: string,
        y: number,
        font: string,
        color: string,
        letterSpacing = 0,
      ) => {
        x.font = font;
        x.fillStyle = color;
        x.textAlign = "center";
        if ("letterSpacing" in x) {
          (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
            `${letterSpacing}px`;
        }
        x.fillText(text, W / 2 + letterSpacing / 2, y);
      };

      const cx = W / 2;
      const cy = 185;
      const r = 52;
      x.lineWidth = 18;
      x.lineCap = "round";
      (
        [
          ["#D93025", Math.PI, 1.55 * Math.PI],
          ["#1A5FB4", 1.55 * Math.PI, 1.9 * Math.PI],
          ["#F2B600", 0, 0.5 * Math.PI],
          ["#1E8E3E", 0.5 * Math.PI, Math.PI],
        ] as [string, number, number][]
      ).forEach(([col, start, end]) => {
        x.strokeStyle = col;
        x.beginPath();
        x.arc(cx, cy, r, start, end);
        x.stroke();
      });
      x.strokeStyle = "#F2B600";
      x.beginPath();
      x.moveTo(cx + r, cy);
      x.lineTo(cx + 8, cy);
      x.stroke();

      drawCentered("GAMURA", 290, '700 38px Georgia, "Times New Roman", serif', "#111111", 10);
      drawCentered("FOR BUSINESS  ·  GAMURA ACADEMY", 326, "500 18px sans-serif", "#777777", 5);
      drawCentered(
        "CERTIFICATE OF COMPLETION",
        430,
        '700 58px Georgia, "Times New Roman", serif',
        "#111111",
        6,
      );

      x.strokeStyle = "#111111";
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(cx - 260, 462);
      x.lineTo(cx + 260, 462);
      x.stroke();

      drawCentered(
        "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
        530,
        "500 22px sans-serif",
        "#444444",
        5,
      );

      let fs = 96;
      x.font = `italic ${fs}px Georgia, "Times New Roman", serif`;
      while (x.measureText(nm).width > 1000 && fs > 40) {
        fs -= 4;
        x.font = `italic ${fs}px Georgia, "Times New Roman", serif`;
      }
      drawCentered(nm, 640, `italic ${fs}px Georgia, "Times New Roman", serif`, "#111111", 0);

      x.strokeStyle = "#999999";
      x.lineWidth = 1.5;
      x.beginPath();
      x.moveTo(cx - 460, 668);
      x.lineTo(cx + 460, 668);
      x.stroke();

      drawCentered(
        "for successfully completing all lessons of the course",
        730,
        '26px Georgia, "Times New Roman", serif',
        "#333333",
        0,
      );

      let f2 = 54;
      x.font = `700 ${f2}px Georgia, "Times New Roman", serif`;
      while (x.measureText(course.t).width > 1100 && f2 > 30) {
        f2 -= 2;
        x.font = `700 ${f2}px Georgia, "Times New Roman", serif`;
      }
      drawCentered(course.t, 805, `700 ${f2}px Georgia, "Times New Roman", serif`, "#111111", 0);
      drawCentered(
        `4 lessons  ·  ${course.cat}  ·  gamura.vercel.app`,
        850,
        "20px sans-serif",
        "#777777",
        1,
      );

      x.strokeStyle = "#111111";
      x.lineWidth = 1.5;
      x.beginPath();
      x.moveTo(200, 990);
      x.lineTo(520, 990);
      x.moveTo(W - 520, 990);
      x.lineTo(W - 200, 990);
      x.stroke();

      x.textAlign = "center";
      x.font = 'italic 40px Georgia, "Times New Roman", serif';
      x.fillStyle = "#1d3a73";
      x.fillText("Selvaranjan G.", 360, 970);
      x.font = "20px sans-serif";
      x.fillStyle = "#444444";
      x.fillText("Founder & CEO, Gamura", 360, 1025);

      const dateStr =
        progress.dates[courseId] ||
        new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      x.font = '30px Georgia, "Times New Roman", serif';
      x.fillStyle = "#111111";
      x.fillText(dateStr, W - 360, 970);
      x.font = "20px sans-serif";
      x.fillStyle = "#444444";
      x.fillText("Date of completion", W - 360, 1025);

      x.fillText(
        `Certificate ID: GB-${certHash(nm + course.t)}-${String(courseId + 1).padStart(2, "0")}`,
        cx,
        1075,
      );

      // Serrated Navy Certification Seal
      x.save();
      x.translate(cx, 930);
      x.fillStyle = "#1d3a73";
      x.beginPath();
      for (let a = 0; a < 48; a++) {
        const R = a % 2 ? 70 : 80;
        const theta = (a * Math.PI) / 24;
        x.lineTo(R * Math.cos(theta), R * Math.sin(theta));
      }
      x.closePath();
      x.fill();
      x.fillStyle = "#ffffff";
      x.beginPath();
      x.arc(0, 0, 62, 0, Math.PI * 2);
      x.fill();
      x.strokeStyle = "#1d3a73";
      x.lineWidth = 3;
      x.beginPath();
      x.arc(0, 0, 56, 0, Math.PI * 2);
      x.stroke();
      x.fillStyle = "#1d3a73";
      x.textAlign = "center";
      x.font = "700 17px sans-serif";
      x.fillText("GAMURA", 0, -10);
      x.font = "700 15px sans-serif";
      x.fillText("CERTIFIED", 0, 14);
      x.font = "22px sans-serif";
      x.fillText("★", 0, 40);
      x.restore();

      certCanvasRef.current = canvas;
      return canvas;
    },
    [progress.dates],
  );

  useEffect(() => {
    if (certCourseId === null) {
      setCertDataUrl("");
      return;
    }
    const canvas = renderCertificateCanvas(certCourseId, progress.name);
    try {
      setCertDataUrl(canvas.toDataURL("image/png"));
    } catch {
      setCertDataUrl("");
    }
  }, [certCourseId, progress.name, renderCertificateCanvas]);

  const handleDownloadCertificate = () => {
    if (certCourseId === null) return;
    if (!progress.name.trim()) {
      showToast("Enter your full name first");
      return;
    }
    const canvas = certCanvasRef.current || renderCertificateCanvas(certCourseId, progress.name);
    const course = COURSES[certCourseId];
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `Gamura-Certificate-${course.t.replace(/\W+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("Downloading high-res PNG certificate");
  };

  const handleShareCertificate = async () => {
    if (certCourseId === null) return;
    if (!progress.name.trim()) {
      showToast("Enter your full name first");
      return;
    }
    const course = COURSES[certCourseId];
    const msg = `I completed ${course.t} on Gamura for Business!`;
    const canvas = certCanvasRef.current || renderCertificateCanvas(certCourseId, progress.name);
    canvas.toBlob(async (blob) => {
      try {
        if (blob) {
          const file = new File([blob], "gamura-certificate.png", { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "Gamura certificate", text: msg });
            return;
          }
        }
        if (navigator.share) {
          await navigator.share({
            title: "Gamura for Business",
            text: msg,
            url: window.location.href,
          });
          return;
        }
        await navigator.clipboard.writeText(`${msg} ${window.location.href}`);
        showToast("Share text copied");
      } catch {
        // User cancelled share sheet
      }
    });
  };

  // Warm editorial tokens synced cleanly across light and dark mode
  const surfaceBg = dark ? "bg-[#1C1B19] text-[#F3F1EA]" : "bg-[#F5F4EE] text-[#141413]";
  const cardBg = dark ? "bg-[#262522] border-[#3A3935]" : "bg-white border-[#E6E3D8]";
  const mutedTxt = dark ? "text-[#A5A299]" : "text-[#6B6A63]";
  const chipTrack = dark ? "bg-[#33322E]" : "bg-[#ECE9DE]";
  const borderCol = dark ? "border-[#3A3935]" : "border-[#E6E3D8]";

  const activeCourse = openCourseId !== null ? COURSES[openCourseId] : null;
  const activeLesson = activeCourse ? activeCourse.L[lessonIndex] : null;
  const activeVideoId =
    openCourseId !== null ? extractYoutubeId(progress.vid[`${openCourseId}:${lessonIndex}`] || "") : null;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${surfaceBg} flex flex-col selection:bg-[#D97757]/20`}
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Top Sticky Editorial Navigation */}
      <header
        className={`sticky top-0 z-30 border-b ${borderCol} ${
          dark ? "bg-[#1C1B19]/95" : "bg-[#F5F4EE]/95"
        } backdrop-blur-xl`}
      >
        <div className="max-w-[1040px] mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-xl border ${cardBg} text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-85 transition-opacity cursor-pointer shrink-0`}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Gamura</span>
            </button>

            <div className="flex items-center gap-2 font-extrabold tracking-wide text-sm sm:text-base whitespace-nowrap truncate">
              <GamuraArcMark size={24} />
              <span>
                GAMURA <span className="text-[#D97757]">\</span> BUSINESS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleUniverse}
              className={`hidden sm:inline-flex min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold items-center gap-1.5 cursor-pointer transition-colors ${
                installedInUniverse
                  ? "bg-[#D97757] border-[#D97757] text-white"
                  : `${cardBg} hover:opacity-85`
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span>{installedInUniverse ? "In Universe" : "Add App"}</span>
            </button>

            {session && (
              <button
                type="button"
                onClick={() => setAccountOpen(true)}
                aria-label="Account"
                className={`min-h-[36px] min-w-[36px] px-2.5 rounded-xl border ${cardBg} text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity`}
              >
                <span className="w-5 h-5 rounded-full bg-[#D97757]/20 text-[#D97757] flex items-center justify-center font-serif">
                  {session.name.trim().charAt(0).toUpperCase() || "G"}
                </span>
                <span className="hidden md:inline max-w-[100px] truncate">{session.name}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle theme"
              className={`min-h-[36px] w-9 rounded-xl border ${cardBg} flex items-center justify-center cursor-pointer hover:opacity-85 transition-opacity`}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1040px] mx-auto px-4 sm:px-5 pt-6 pb-24">
        {!session ? (
          /* Sign In / Create Account / Quick Guest Entry */
          <div className="max-w-[400px] mx-auto py-6 text-center space-y-5">
            <div className="flex justify-center">
              <GamuraArcMark size={64} />
            </div>

            <div className="space-y-1.5">
              <h1
                className="text-3xl sm:text-[34px] font-medium tracking-tight"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {authMode === "up" ? "Create your Gamura ID" : "Sign in to Gamura"}
              </h1>
              <p className={`text-sm ${mutedTxt}`}>
                {authMode === "up"
                  ? "Join Gamura for Business to track progress and earn certificates."
                  : "Welcome back. Pick up your 21 business courses where you left off."}
              </p>
            </div>

            <button
              type="button"
              disabled={authBusy}
              onClick={handleGoogleSignIn}
              className={`w-full h-[50px] rounded-[14px] border ${cardBg} font-semibold text-[15px] flex items-center justify-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60`}
            >
              <GoogleMark />
              <span>Continue with Google</span>
            </button>

            <div className={`flex items-center gap-3 text-xs ${mutedTxt}`}>
              <div className={`flex-1 h-px ${dark ? "bg-[#3A3935]" : "bg-[#E6E3D8]"}`} />
              <span>or</span>
              <div className={`flex-1 h-px ${dark ? "bg-[#3A3935]" : "bg-[#E6E3D8]"}`} />
            </div>

            <form onSubmit={handleEmailAuthSubmit} noValidate className="space-y-2.5 text-left">
              {authMode === "up" && (
                <input
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className={`w-full h-[50px] px-3.5 rounded-[14px] border ${cardBg} text-[15px] outline-none focus:ring-2 focus:ring-[#D97757]/50`}
                />
              )}
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                className={`w-full h-[50px] px-3.5 rounded-[14px] border ${cardBg} text-[15px] outline-none focus:ring-2 focus:ring-[#D97757]/50`}
              />
              <input
                type="password"
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
                placeholder={authMode === "up" ? "Password (8+ characters)" : "Password"}
                autoComplete={authMode === "up" ? "new-password" : "current-password"}
                className={`w-full h-[50px] px-3.5 rounded-[14px] border ${cardBg} text-[15px] outline-none focus:ring-2 focus:ring-[#D97757]/50`}
              />
              {authMode === "up" && (
                <input
                  type="password"
                  value={authConfirm}
                  onChange={(e) => setAuthConfirm(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className={`w-full h-[50px] px-3.5 rounded-[14px] border ${cardBg} text-[15px] outline-none focus:ring-2 focus:ring-[#D97757]/50`}
                />
              )}

              {authError && <div className="text-xs font-medium text-[#c0392b] px-1">{authError}</div>}

              <button
                type="submit"
                disabled={authBusy}
                className={`w-full h-[50px] rounded-[14px] font-semibold text-[15px] cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60 ${
                  dark ? "bg-[#F3F1EA] text-[#1C1B19]" : "bg-[#141413] text-[#F5F4EE]"
                }`}
              >
                {authMode === "up" ? "Create account" : "Sign in"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleContinueGuest}
              className="w-full h-[46px] rounded-[14px] bg-[#D97757] hover:bg-[#c86747] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <BookOpen size={16} />
              <span>Start Learning Instantly (Guest Session)</span>
            </button>

            <p className="text-sm">
              {authMode === "up" ? "Already have an account? " : "New to Gamura? "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "up" ? "in" : "up");
                  setAuthError("");
                }}
                className="text-[#D97757] font-semibold hover:underline cursor-pointer"
              >
                {authMode === "up" ? "Sign in" : "Create account"}
              </button>
            </p>

            <p className={`text-xs leading-relaxed ${mutedTxt}`}>
              Accounts and progress persist right on your device. Passwords use salted SHA-256 digests and are never stored as plain text.
            </p>
          </div>
        ) : activeCourse && activeLesson ? (
          /* Course & Lesson Interactive Workspace */
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setOpenCourseId(null);
                setLessonIndex(0);
              }}
              className={`text-sm font-semibold ${mutedTxt} hover:text-[#D97757] inline-flex items-center gap-1 cursor-pointer transition-colors`}
            >
              <ArrowLeft size={15} />
              <span>All courses</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)] gap-5 items-start">
              {/* Left Stage: Video Player + Lesson Text + Key Term & Practice */}
              <div className="space-y-4">
                <div className="aspect-video bg-[#161513] rounded-2xl overflow-hidden flex items-center justify-center text-[#d8d5ca] text-center">
                  {activeVideoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${activeVideoId}`}
                      title={activeLesson.t}
                      allow="encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div className="p-6 space-y-2 max-w-sm">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-white">
                        <Play size={22} className="ml-0.5" />
                      </div>
                      <p className="text-sm font-medium">
                        Add a YouTube link for this lesson below to play it inside Gamura.
                      </p>
                    </div>
                  )}
                </div>

                {/* Video URL Bar */}
                <div className="flex flex-wrap gap-2">
                  <input
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="Paste YouTube link (e.g. youtube.com/watch?v=...)"
                    className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl border ${cardBg} text-sm outline-none focus:ring-2 focus:ring-[#D97757]/50`}
                  />
                  <button
                    type="button"
                    onClick={handleSaveVideoUrl}
                    className={`px-4 py-2.5 rounded-xl border ${cardBg} text-sm font-semibold hover:opacity-85 cursor-pointer`}
                  >
                    Play video
                  </button>
                  {activeVideoId && (
                    <button
                      type="button"
                      onClick={handleClearVideoUrl}
                      className={`px-3 py-2.5 rounded-xl border ${cardBg} text-sm font-semibold hover:opacity-85 cursor-pointer`}
                      aria-label="Remove video"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                      `${activeCourse.t} ${activeLesson.t}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2.5 rounded-xl border ${cardBg} text-sm font-semibold inline-flex items-center gap-1.5 hover:opacity-85`}
                  >
                    <span>Find on YouTube</span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                {/* Lesson Copy & Completion Toggle */}
                <div className={`rounded-[18px] border ${cardBg} p-5 space-y-3`}>
                  <div className={`text-xs font-medium ${mutedTxt}`}>
                    Lesson {lessonIndex + 1} of 4 · {activeCourse.t}
                  </div>
                  <h2
                    className="text-2xl sm:text-[26px] font-medium leading-tight"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {activeLesson.t}
                  </h2>
                  <p className="text-[15.5px] leading-relaxed">{activeLesson.b}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {(() => {
                      const isDone = Boolean(progress.done[`${activeCourse.id}:${lessonIndex}`]);
                      return (
                        <button
                          type="button"
                          onClick={() => handleToggleLessonDone(activeCourse.id, lessonIndex)}
                          className={`px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-colors ${
                            isDone
                              ? `border ${cardBg}`
                              : "bg-[#D97757] hover:bg-[#c86747] text-white border border-[#D97757]"
                          }`}
                        >
                          {isDone ? "Mark as not done" : "Mark lesson complete"}
                        </button>
                      );
                    })()}
                    {lessonIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setLessonIndex((l) => l - 1)}
                        className={`px-4 py-2.5 rounded-xl border ${cardBg} text-sm font-semibold cursor-pointer hover:opacity-85`}
                      >
                        Previous
                      </button>
                    )}
                    {lessonIndex < 3 && (
                      <button
                        type="button"
                        onClick={() => setLessonIndex((l) => l + 1)}
                        className={`px-4 py-2.5 rounded-xl border ${cardBg} text-sm font-semibold cursor-pointer hover:opacity-85`}
                      >
                        Next lesson
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Term, Practice Task & Learner Notes */}
                <div className={`rounded-[18px] border ${cardBg} p-5 space-y-3`}>
                  <div>
                    <div className={`text-xs font-medium ${mutedTxt}`}>Key term</div>
                    <div className="text-base font-bold mt-0.5">{activeCourse.term}</div>
                  </div>
                  <div>
                    <div className={`text-xs font-medium ${mutedTxt}`}>Practice task</div>
                    <p className="text-sm leading-relaxed mt-0.5">{activeCourse.task}</p>
                  </div>
                  <div className="pt-1">
                    <label
                      htmlFor="gb-practice-notes"
                      className={`block text-xs font-medium mb-1.5 ${mutedTxt}`}
                    >
                      Your practice workspace note (saved locally)
                    </label>
                    <textarea
                      id="gb-practice-notes"
                      rows={3}
                      value={progress.notes[activeCourse.id] || ""}
                      onChange={(e) =>
                        persistProgress({
                          ...progress,
                          notes: {
                            ...progress.notes,
                            [activeCourse.id]: e.target.value,
                          },
                        })
                      }
                      placeholder="Draft your response to the practice task here..."
                      className={`w-full rounded-xl border ${cardBg} px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D97757]/50 resize-y`}
                    />
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Course Lesson Checklist & Certificate Unlock */}
              <div className={`rounded-[18px] border ${cardBg} p-5 space-y-4`}>
                <div>
                  <h3
                    className="text-2xl font-medium leading-tight flex items-center gap-2"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    <span>{activeCourse.ic}</span>
                    <span>{activeCourse.t}</span>
                  </h3>
                  <div className={`text-xs mt-1.5 ${mutedTxt}`}>
                    {getCourseProgress(activeCourse.id)}/4 lessons complete
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden mt-2.5 ${chipTrack}`}>
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${getCourseProgress(activeCourse.id) * 25}%`,
                        backgroundColor: activeCourse.c,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {activeCourse.L.map((l, idx) => {
                    const isCurrent = idx === lessonIndex;
                    const isCompleted = Boolean(progress.done[`${activeCourse.id}:${idx}`]);
                    return (
                      <button
                        key={l.t}
                        type="button"
                        onClick={() => setLessonIndex(idx)}
                        className={`w-full flex items-center gap-3 p-3 rounded-[14px] border text-left transition-all cursor-pointer ${
                          isCurrent
                            ? "border-[#D97757] ring-1 ring-[#D97757]"
                            : borderCol
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCompleted
                              ? "bg-[#D97757] border-[#D97757] text-white"
                              : borderCol
                          }`}
                        >
                          {isCompleted ? "✓" : idx + 1}
                        </span>
                        <span className="text-sm font-medium flex-1 leading-snug">{l.t}</span>
                      </button>
                    );
                  })}
                </div>

                {getCourseProgress(activeCourse.id) === 4 ? (
                  <button
                    type="button"
                    onClick={() => setCertCourseId(activeCourse.id)}
                    className="w-full py-3 rounded-xl bg-[#D97757] hover:bg-[#c86747] text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Award size={16} />
                    <span>Get your certificate</span>
                  </button>
                ) : (
                  <div className={`text-xs ${mutedTxt}`}>
                    Complete all 4 lessons to unlock your certificate.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Home Courses / My learning / Badges / Certificates Hub */
          <div className="space-y-5">
            <div className="text-center pt-3 pb-1 space-y-2">
              <h1
                className="text-3xl sm:text-5xl font-medium tracking-tight"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Let&apos;s get to work, {session.name.split(" ")[0]}.
              </h1>
              <p className={`text-sm sm:text-base max-w-[520px] mx-auto ${mutedTxt}`}>
                21 business courses with video lessons, badges and certificates you can share.
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className={`rounded-2xl border ${cardBg} p-3 sm:p-4 text-center`}>
                <b
                  className="block text-2xl sm:text-[28px] font-medium"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {stats.courses}
                </b>
                <span className={`text-xs sm:text-[13px] ${mutedTxt}`}>Courses done</span>
              </div>
              <div className={`rounded-2xl border ${cardBg} p-3 sm:p-4 text-center`}>
                <b
                  className="block text-2xl sm:text-[28px] font-medium"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {stats.lessons}
                </b>
                <span className={`text-xs sm:text-[13px] ${mutedTxt}`}>Lessons done</span>
              </div>
              <div className={`rounded-2xl border ${cardBg} p-3 sm:p-4 text-center`}>
                <b
                  className="block text-2xl sm:text-[28px] font-medium"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {stats.badges}
                </b>
                <span className={`text-xs sm:text-[13px] ${mutedTxt}`}>Badges</span>
              </div>
            </div>

            {/* Resume Banner */}
            {inProgressCourse && (
              <button
                type="button"
                onClick={() => {
                  setOpenCourseId(inProgressCourse.id);
                  const nextLesson = inProgressCourse.L.findIndex(
                    (_, i) => !progress.done[`${inProgressCourse.id}:${i}`],
                  );
                  setLessonIndex(nextLesson >= 0 ? nextLesson : 0);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-full rounded-2xl border ${cardBg} px-4 py-3 text-left text-sm font-semibold hover:opacity-90 cursor-pointer flex items-center justify-between gap-2`}
              >
                <span>
                  Continue: {inProgressCourse.t} ({getCourseProgress(inProgressCourse.id)}/4)
                </span>
                <span className="text-[#D97757]">Resume →</span>
              </button>
            )}

            {/* Pill Tab Selector */}
            <div className="flex justify-center">
              <div className={`inline-flex p-1 rounded-full gap-0.5 max-w-full overflow-x-auto ${chipTrack}`}>
                {(["Courses", "My learning", "Badges", "Certificates"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      tab === t
                        ? `${dark ? "bg-[#262522] text-[#F3F1EA]" : "bg-white text-[#141413]"} shadow-xs`
                        : `${mutedTxt}`
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Category Chips inside Courses tab */}
            {tab === "Courses" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    size={16}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedTxt}`}
                  />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses"
                    aria-label="Search courses"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-[14px] border ${cardBg} text-[15px] outline-none focus:ring-2 focus:ring-[#D97757]/50`}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {CATEGORIES.map((k) => {
                    const active = categoryFilter === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCategoryFilter(k)}
                        className={`px-3.5 py-1.5 rounded-full text-xs sm:text-[13.5px] font-medium whitespace-nowrap cursor-pointer border transition-colors ${
                          active
                            ? dark
                              ? "bg-[#F3F1EA] text-[#1C1B19] border-[#F3F1EA]"
                              : "bg-[#141413] text-[#F5F4EE] border-[#141413]"
                            : `${cardBg}`
                        }`}
                      >
                        {k}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab Content */}
            {tab === "Badges" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {BADGES.map((b) => {
                  const unlocked = b.check(stats);
                  return (
                    <div
                      key={b.title}
                      className={`rounded-[18px] border ${cardBg} p-4 text-center space-y-1.5`}
                    >
                      <div
                        className={`text-[40px] leading-none transition-all ${
                          unlocked ? "opacity-100" : "grayscale opacity-30"
                        }`}
                      >
                        {b.icon}
                      </div>
                      <b
                        className="block text-base font-medium"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {b.title}
                      </b>
                      <div className={`text-xs ${mutedTxt}`}>{b.desc}</div>
                    </div>
                  );
                })}
              </div>
            ) : visibleCourses.length > 0 ? (
              tab === "Certificates" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {visibleCourses.map((c) => (
                    <div
                      key={c.id}
                      style={{ borderTopColor: c.c }}
                      className={`rounded-[18px] border ${cardBg} border-t-[6px] p-4 min-h-[200px] flex flex-col gap-2`}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${c.c}26` }}
                      >
                        {c.ic}
                      </div>
                      <h3
                        className="text-xl font-medium"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {c.t}
                      </h3>
                      <div className={`text-xs ${mutedTxt}`}>
                        Completed {progress.dates[c.id] || "Recently"}
                      </div>
                      <div className="mt-auto pt-2">
                        <button
                          type="button"
                          onClick={() => setCertCourseId(c.id)}
                          className="px-4 py-2 rounded-xl bg-[#D97757] hover:bg-[#c86747] text-white text-xs font-semibold cursor-pointer transition-colors"
                        >
                          View certificate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {visibleCourses.map((c) => {
                    const p = getCourseProgress(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setOpenCourseId(c.id);
                          setLessonIndex(0);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        style={{ borderTopColor: c.c }}
                        className={`rounded-[18px] border ${cardBg} border-t-[6px] p-4 min-h-[218px] flex flex-col gap-1.5 text-left cursor-pointer hover:shadow-md transition-shadow`}
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px]"
                          style={{ backgroundColor: `${c.c}26` }}
                        >
                          {c.ic}
                        </div>
                        <h3
                          className="text-[21px] font-medium mt-1 leading-snug"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                          {c.t}
                        </h3>
                        <p className={`text-[14px] leading-snug ${mutedTxt}`}>{c.d}</p>
                        <div className={`text-xs mt-1 ${mutedTxt}`}>
                          {c.cat} · 4 lessons · ~20 min
                          {p === 4 ? " · Completed ✓" : p > 0 ? ` · ${p}/4 done` : ""}
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden mt-auto ${chipTrack}`}>
                          <div
                            className="h-full transition-all duration-300"
                            style={{ width: `${p * 25}%`, backgroundColor: c.c }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <div className={`py-12 text-center text-sm ${mutedTxt}`}>
                {tab === "Courses"
                  ? "No courses match. Try another word or category."
                  : tab === "My learning"
                    ? "Nothing in progress. Start a course from the Courses tab."
                    : "Finish all 4 lessons of a course to earn your first certificate."}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Account Modal */}
      {accountOpen && session && (
        <div
          onClick={() => setAccountOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-[20px] border ${cardBg} p-6 text-center space-y-3 shadow-2xl`}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl text-[#D97757]"
              style={{
                backgroundColor: "#D9775724",
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              {session.name.trim().charAt(0).toUpperCase() || "G"}
            </div>
            <div>
              <h2
                className="text-2xl font-medium"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {session.name}
              </h2>
              <p className={`text-xs mt-0.5 ${mutedTxt}`}>
                {session.email} · {session.provider === "google" ? "Google" : session.provider === "guest" ? "Guest" : "Email"}
              </p>
              <p className={`text-xs mt-1 ${mutedTxt}`}>
                {stats.courses} courses · {stats.lessons} lessons complete
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSession(null);
                try {
                  localStorage.removeItem(SESSION_KEY);
                } catch {
                  // ignore
                }
                setAccountOpen(false);
                setAuthMode("in");
              }}
              className={`w-full h-11 rounded-xl font-semibold text-sm cursor-pointer ${
                dark ? "bg-[#F3F1EA] text-[#1C1B19]" : "bg-[#141413] text-[#F5F4EE]"
              }`}
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => setAccountOpen(false)}
              className={`w-full h-11 rounded-xl border ${cardBg} font-semibold text-sm cursor-pointer`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* High-Resolution Certificate Modal */}
      {certCourseId !== null && (
        <div
          onClick={() => setCertCourseId(null)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[800px] max-h-[94vh] overflow-y-auto rounded-[20px] border ${cardBg} p-4 sm:p-5 space-y-3 shadow-2xl`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserCheck size={16} className="text-[#D97757]" />
                <span>Certificate of Completion</span>
              </div>
              <button
                type="button"
                onClick={() => setCertCourseId(null)}
                className="p-1.5 rounded-lg hover:bg-black/5 cursor-pointer"
                aria-label="Close certificate preview"
              >
                <X size={16} />
              </button>
            </div>

            <input
              value={progress.name}
              onChange={(e) =>
                persistProgress({
                  ...progress,
                  name: e.target.value,
                })
              }
              placeholder="Type your full name for the certificate"
              className={`w-full px-3.5 py-2.5 rounded-xl border ${cardBg} text-sm outline-none focus:ring-2 focus:ring-[#D97757]/50`}
            />

            {certDataUrl && (
              <img
                src={certDataUrl}
                alt={`Certificate for ${COURSES[certCourseId].t}`}
                className={`w-full rounded-xl border ${borderCol} block`}
              />
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadCertificate}
                className="px-4 py-2.5 rounded-xl bg-[#D97757] hover:bg-[#c86747] text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={15} />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                onClick={handleShareCertificate}
                className={`px-4 py-2.5 rounded-xl border ${cardBg} text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer`}
              >
                <Share2 size={15} />
                <span>Share</span>
              </button>
              <button
                type="button"
                onClick={() => setCertCourseId(null)}
                className={`px-4 py-2.5 rounded-xl border ${cardBg} text-sm font-semibold cursor-pointer ml-auto`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-50 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium shadow-lg ${
            dark ? "bg-[#F3F1EA] text-[#1C1B19]" : "bg-[#141413] text-[#F5F4EE]"
          }`}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
