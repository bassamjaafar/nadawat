/**
 * Central place for Nadawat's social accounts. Add/remove a platform or
 * change a URL here only — the footer (and anywhere else) picks it up
 * automatically and only renders an icon once a real `url` is set.
 */

export type SocialPlatform =
  | "twitter"
  | "facebook"
  | "instagram"
  | "youtube"
  | "telegram"
  | "linkedin"
  | "whatsapp";

export type SocialLink = {
  platform: SocialPlatform;
  /** Accessible label, e.g. for screen readers — not shown visually. */
  label: string;
  url: string | null;
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: "twitter",
    label: "ندوات على إكس (تويتر)",
    url: "https://x.com/Nadawatdorg",
  },
  {
    platform: "facebook",
    label: "ندوات على فيسبوك",
    url: "https://www.facebook.com/nadawatorg",
  },
  {
    platform: "instagram",
    label: "ندوات على إنستغرام",
    url: "https://www.instagram.com/nadawatorg/",
  },
  {
    platform: "youtube",
    label: "ندوات على يوتيوب",
    url: "https://www.youtube.com/@nadawatorg",
  },
  { platform: "telegram", label: "ندوات على تيليغرام", url: null },
  { platform: "linkedin", label: "ندوات على لينكدإن", url: null },
  {
    platform: "whatsapp",
    label: "قناة ندوات على واتساب",
    url: "https://whatsapp.com/channel/0029Vb8tsGFIN9iwbLvHwN2X",
  },
];
