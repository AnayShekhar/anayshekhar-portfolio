export const LOADER_TEXT = "hi, i'm anay";

export const HERO = {
  title: "hi, i'm anay",
  subtitle: "systems · ml · optimization",
} as const;

export const SYSTEM_MESSAGES = {
  stabilized: "system stabilized.",
  awaiting: "awaiting interaction.",
} as const;

export type MenuSection = "about" | "projects" | "future" | "contact";

export const MENU_SECTIONS: { id: MenuSection; label: string }[] = [
  { id: "about", label: "works / about" },
  { id: "projects", label: "projects" },
  { id: "future", label: "future" },
  { id: "contact", label: "contact" },
];

export const ABOUT_CONTENT = {
  paragraphs: [
    "i really enjoy working on the underlying infrastructure of software and figuring out how to make systems run faster and cleaner. my curiosity about how computers handle massive workloads eventually led me straight into machine learning. instead of just using existing models, i like to look under the hood to focus on building things that are efficient, predictable, and stable from the ground up.",
    "right now, i am focusing on architectural efficiency and trying to understand exactly how data flows through deep neural networks.",
    "currently exploring: subquadratic attention scaling, optimizing tensor math, and finding hardware bottlenecks.",
  ],
};

export const PROJECTS = [
  {
    name: "fern.ai",
    description:
      "built a mobile app that acts as an ai powered hospital bill auditor. extracts medical codes from bills, validates them with cms data using rag, flags incorrect charges, and generates dispute letters.",
  },
  {
    name: "pokepy",
    description:
      "built a language model from scratch using numpy to understand weight initialization, activation stability, and gradient flow without frameworks.",
  },
] as const;

export const FUTURE_CONTENT = {
  intro:
    "looking ahead, i want to keep exploring how machine learning can serve as a collaborative tool that we can actually understand and trust. my goal is to focus on building deep technical expertise around reliable systems rather than just chasing the latest trends.",
  items: [
    {
      title: "algorithmic efficiency",
      description:
        "implementing and benchmarking a fixed window sparse attention mechanism from scratch in pytorch to study subquadratic scaling up to 2048 tokens.",
    },
    {
      title: "hardware profiling",
      description:
        "profiling custom masking layers to analyze whether naive software masking achieves true hardware flops reduction or solely vram savings.",
    },
    {
      title: "mechanistic interpretability",
      description:
        "writing custom extraction hooks to extract and map internal matrix activation states as comparative heatmaps during inference.",
    },
  ],
} as const;

export const CONTACT_CONTENT = {
  intro:
    "if you are working on something similar or want to talk about systems and optimization, feel free to reach out.",
  links: [
    {
      label: "email",
      value: "anay.shekhar10@gmail.com",
      href: "mailto:anay.shekhar10@gmail.com",
    },
    {
      label: "github",
      value: "github.com/AnayShekhar",
      href: "https://github.com/AnayShekhar",
    },
    {
      label: "linkedin",
      value: "linkedin.com/in/AnayShekhar",
      href: "https://linkedin.com/in/AnayShekhar",
    },
  ],
};

export const FOOTER_LINKS = CONTACT_CONTENT.links;
