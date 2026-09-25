import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      colors: {
        // Core VittaOS Brand & Semantic Tokens
        brand: {
          DEFAULT: "#13294B", // Deep navy for nav, headers, primary actions
          hover: "#0E1F38",
          subtle: "#F0F4F8",
          foreground: "#FFFFFF",
        },
        financial: {
          // Positive green: ONLY for positive financial states (money in, reconciled, filed)
          positive: "#2E6F40",
          "positive-bg": "#F0FDF4",
          "positive-border": "#BBF7D0",
          "positive-text": "#1E5830",
          // Warning amber: for pending, unallocated, review needed
          warning: "#D97706",
          "warning-bg": "#FFFBEB",
          "warning-border": "#FDE68A",
          "warning-text": "#B45309",
          // Destructive red: for overdue, mismatched, voided
          destructive: "#DC2626",
          "destructive-bg": "#FEF2F2",
          "destructive-border": "#FECACA",
          "destructive-text": "#B91C1C",
        },
        // 7-step Slate/Gray scale
        neutral: {
          50: "#FAFAFA", // Off-white app background
          100: "#F1F5F9", // Table headers, secondary hover
          200: "#E2E8F0", // Standard card & divider borders
          300: "#CBD5E1", // Input borders, active separators
          400: "#94A3B8", // Subtle icons, placeholder text
          500: "#64748B", // Secondary text, column labels
          600: "#475569", // Body text
          900: "#0F172A", // Headings, dense values
        },
        // CSS Variable mapped tokens for shadcn/ui compatibility
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "#13294B", // Navy
          2: "#2E6F40", // Green
          3: "#64748B", // Slate
          4: "#D97706", // Amber
          5: "#DC2626", // Red
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
