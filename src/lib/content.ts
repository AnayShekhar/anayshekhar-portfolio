export const HERO = {
  title: "hi, i'm anay",
} as const;

export type MenuSection = "about" | "projects" | "future" | "contact";

// editorial title shown above each section's content
export const SECTION_TITLES: Record<MenuSection, string> = {
  about:    "who am i?",
  projects: "projects",
  future:   "future",
  contact:  "connection",
};

export const MENU_SECTIONS: { id: MenuSection; label: string }[] = [
  { id: "about", label: "about" },
  { id: "projects", label: "projects" },
  { id: "future", label: "future" },
  { id: "contact", label: "contact" },
];

export const ABOUT_CONTENT = {
  paragraphs: [
    "i really enjoy working on the underlying infrastructure of software and figuring out how to make systems run faster and cleaner. my curiosity about how computers handle massive workloads eventually led me straight into machine learning. instead of just using existing models, i like to look under the hood to focus on building things that are efficient, predictable, and stable from the ground up.",
    "right now, i am focusing on architectural efficiency and trying to understand exactly how data flows through deep neural networks.",
  ],
  exploringLabel: "currently exploring",
  exploring:
    "subquadratic attention scaling, optimizing tensor math, and finding hardware bottlenecks.",
};

export const PROJECTS = [
  {
    name: "fern.ai",
    description:
      "built a mobile app that acts as an ai powered hospital bill auditor, which won best mobile hack at hacktj. the system let you take a photo or pdf upload of a bill, extracts the medical codes and pricing, validates them against a cms database using rag, flags any incorrect or fraudulent charges, and then writes up a formal dispute letter.",
  },
  {
    name: "pokepy",
    description:
      "wrote a language model from scratch that generates names based on pokémon data. i built the underlying math entirely using numpy so i could get a deep understanding of weight initialization, activation stability, and how gradients flow through a network without relying on deep learning frameworks.",
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
    "if you are working on something similar or just want to talk about systems software and optimization, feel free to reach out.",
  note: "i usually respond within a couple of days.",
  links: [
    {
      label: "email",
      value: "anay.shekhar10@gmail.com",
      href: "mailto:anay.shekhar10@gmail.com",
    },
    {
      label: "code",
      value: "github.com/AnayShekhar",
      href: "https://github.com/AnayShekhar",
    },
    {
      label: "network",
      value: "linkedin.com/in/AnayShekhar",
      href: "https://linkedin.com/in/AnayShekhar",
    },
    {
      label: "instagram",
      value: "@aiwithanay",
      href: "https://www.instagram.com/aiwithanay/",
    },
  ],
};

export const FOOTER_LINKS = CONTACT_CONTENT.links;
