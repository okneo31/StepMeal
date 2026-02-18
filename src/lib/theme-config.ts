export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  price: number; // MC
  previewColors: {
    primary: string;
    bg: string;
    surface: string;
  };
}

export const THEMES: ThemeConfig[] = [
  {
    id: "default",
    name: "네온 그린",
    description: "기본 다크 테마. 네온 그린 액센트.",
    price: 0,
    previewColors: {
      primary: "#22C55E",
      bg: "#0B0E14",
      surface: "#1A1F2E",
    },
  },
  {
    id: "midnight-gold",
    name: "미드나잇 골드",
    description: "럭셔리한 골드와 블랙의 조합.",
    price: 300,
    previewColors: {
      primary: "#FFD700",
      bg: "#0D0B06",
      surface: "#1C1810",
    },
  },
  {
    id: "rose-quartz",
    name: "로즈 쿼츠",
    description: "우아하고 부드러운 핑크 로즈.",
    price: 300,
    previewColors: {
      primary: "#F472B6",
      bg: "#120B0F",
      surface: "#1E141A",
    },
  },
  {
    id: "ocean-abyss",
    name: "오션 어비스",
    description: "깊은 심해의 시안 블루.",
    price: 400,
    previewColors: {
      primary: "#06B6D4",
      bg: "#060D10",
      surface: "#0C1A1E",
    },
  },
  {
    id: "aurora",
    name: "오로라 보레알리스",
    description: "몽환적인 바이올렛 오로라.",
    price: 400,
    previewColors: {
      primary: "#A78BFA",
      bg: "#0B0810",
      surface: "#151020",
    },
  },
  {
    id: "crimson-obsidian",
    name: "크림슨 옵시디언",
    description: "강렬한 레드와 옵시디언 블랙.",
    price: 500,
    previewColors: {
      primary: "#EF4444",
      bg: "#100808",
      surface: "#1A1010",
    },
  },
];

export function getThemeById(id: string): ThemeConfig | undefined {
  return THEMES.find((t) => t.id === id);
}
