import React, { useMemo } from 'react';

// ---- Dims structure ----
export interface TrimSize {
  w: number; // in mm (e.g. 152.4 for 6x9")
  h: number; // in mm (e.g. 228.6 for 6x9")
}

export interface CoverDims {
  spineMM: number;
  spineIn: number;
  trim: TrimSize;
  paper: string;
  pages: number;
  flap: number;
  bleed: number;
  totalH: number;
  totalW: number;
  totalW_noFlap: number;
}

// ---- KDP-style spine width calculator ----
export function calcDims({
  pages = 200,
  trim = { w: 152.4, h: 228.6 },
  paper = "bw-cream",
  flap = 70,
  bleed = 3.175
}: {
  pages?: number;
  trim?: TrimSize;
  paper?: string;
  flap?: number;
  bleed?: number;
}): CoverDims {
  const coef: Record<string, number> = {
    "bw-cream": 0.0025,
    "bw-white": 0.00226,
    "color": 0.0025,
    "premium": 0.002347
  };
  const c = coef[paper] || 0.0025;
  const spineIn = Math.max(0.06, pages * c);
  const spineMM = spineIn * 25.4;
  const totalH = trim.h + bleed * 2;
  const totalW = bleed + flap + trim.w + spineMM + trim.w + flap + bleed;
  const totalW_noFlap = bleed + trim.w + spineMM + trim.w + bleed;

  const round = (n: number, p = 2) => {
    const f = Math.pow(10, p);
    return Math.round(n * f) / f;
  };

  return {
    spineMM: round(spineMM, 2),
    spineIn: round(spineIn, 3),
    trim,
    paper,
    pages,
    flap,
    bleed,
    totalH: round(totalH, 2),
    totalW: round(totalW, 2),
    totalW_noFlap: round(totalW_noFlap, 2),
  };
}

// ---- Book representation ----
export interface CoverBookData {
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  niche: string;
  isbn?: string;
  backHook?: string;
  backBody?: string;
  backBullets?: string[];
  backCTA?: string;
  flapHook?: string;
  flapBody?: string;
  flapBackBody?: string;
  authorBio?: string;
  bgImage?: string;
}

export interface CoverAssets {
  authorPhoto?: string;
  barcode?: string;
  qrcode?: string;
  brandLogo?: string;
  isbn?: string;
}

// ---- Styles definition ----
export interface StyleVars {
  bg: string;
  bgGrad: string;
  ink: string;
  accent: string;
  accent2: string;
  flapBg: string;
  flapInk: string;
  titleFamily: string;
  titleWeight: number;
  titleCase: string;
  bodyFamily: string;
  bgImg?: string;
}

export interface CoverStyleConfig {
  name: string;
  note: string;
  vars: StyleVars;
}

export const STYLES: Record<string, CoverStyleConfig> = {
  minimalist: {
    name: "Minimalista Elegante",
    note: "Focado em 'menos é mais'. Cores sólidas, linhas limpas, muito espaço e tipografia elegante.",
    vars: {
      bg: "#F5F0E5",
      bgGrad: "linear-gradient(180deg, #F5F0E5 0%, #E8E2D5 100%)",
      ink: "#1A1A1A",
      accent: "#9E7E38",
      accent2: "#5C4708",
      flapBg: "#F0EADF",
      flapInk: "#2B2B2B",
      titleFamily: "'Playfair Display', Georgia, serif",
      titleWeight: 600,
      titleCase: "none",
      bodyFamily: "'Outfit', system-ui, sans-serif",
    },
  },
  illustrated: {
    name: "Ilustrado Vetorial",
    note: "Estilo flat design moderno com ilustrações bidimensionais expressivas e cores vibrantes.",
    vars: {
      bg: "#1A2E40",
      bgGrad: "radial-gradient(circle at 50% 50%, #2A4560 0%, #112130 100%)",
      ink: "#FFFFFF",
      accent: "#E05D5D",
      accent2: "#F2D388",
      flapBg: "#112130",
      flapInk: "#E2E8F0",
      titleFamily: "'Outfit', system-ui, sans-serif",
      titleWeight: 800,
      titleCase: "uppercase",
      bodyFamily: "'Outfit', system-ui, sans-serif",
    },
  },
  realist: {
    name: "Fotográfico Realista",
    note: "Utiliza fotografias realistas de alta qualidade, paisagens dramáticas ou retratos autorais integrados.",
    vars: {
      bg: "#0A0D10",
      bgGrad: "linear-gradient(180deg, #161A1D 0%, #0A0D10 100%)",
      ink: "#FFFFFF",
      accent: "#E67E22",
      accent2: "#BDC3C7",
      flapBg: "#0C0F12",
      flapInk: "#E5E7EB",
      titleFamily: "'Playfair Display', Georgia, serif",
      titleWeight: 700,
      titleCase: "none",
      bodyFamily: "'Outfit', system-ui, sans-serif",
    },
  },
  typographic: {
    name: "Tipográfico Expressivo",
    note: "O texto é o protagonista absoluto. Letras massivas, estilizadas e com grande impacto visual.",
    vars: {
      bg: "#080808",
      bgGrad: "radial-gradient(ellipse at 50% 50%, #1C1C1C 0%, #000000 100%)",
      ink: "#FFFFFF",
      accent: "#F1C40F",
      accent2: "#E67E22",
      flapBg: "#050505",
      flapInk: "#ECEFF1",
      titleFamily: "'Outfit', system-ui, sans-serif",
      titleWeight: 900,
      titleCase: "uppercase",
      bodyFamily: "'Outfit', system-ui, sans-serif",
    },
  },
  abstract: {
    name: "Abstrato Conceitual",
    note: "Focado em texturas artísticas, formas geométricas tridimensionais e cores evocativas.",
    vars: {
      bg: "#1B0F2A",
      bgGrad: "radial-gradient(ellipse at 50% 80%, #341F47 0%, #0E071A 100%)",
      ink: "#FFFDF9",
      accent: "#00E5FF",
      accent2: "#FFD54F",
      flapBg: "#0B0514",
      flapInk: "#E9D5FF",
      titleFamily: "'Outfit', system-ui, sans-serif",
      titleWeight: 800,
      titleCase: "uppercase",
      bodyFamily: "'Outfit', system-ui, sans-serif",
    },
  },
};

// ============================================================
// COMPONENT PARTS
// ============================================================

export const EditoraLogo: React.FC<{ color?: string }> = ({ color = "#fff" }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5em" }}>
      <svg viewBox="0 0 64 64" style={{ width: "8em", height: "8em" }}>
        <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="2.5" opacity="0.7" />
        <path d="M12 28 L32 18 L52 28 L52 48 L32 42 L12 48 Z" fill={color} opacity="0.95" />
        <path d="M32 18 L32 42" stroke={color} strokeWidth="1" opacity="0.4" />
        <path d="M28 12 L32 22 L36 12 M22 14 L32 22 L42 14" stroke={color} strokeWidth="1.3" fill="none" opacity="0.7" />
      </svg>
      <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 700, fontSize: "3.2em", lineHeight: 1, color }}>
        Editora<br />
        <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 400, fontSize: "0.8em", color }}>360°Express</span>
      </div>
    </div>
  );
};

export const EditoraLogoMini: React.FC<{ color?: string }> = ({ color = "#fff" }) => {
  return (
    <svg viewBox="0 0 64 64" style={{ width: "100%", height: "100%" }}>
      <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="3" opacity="0.7" />
      <path d="M12 28 L32 18 L52 28 L52 48 L32 42 L12 48 Z" fill={color} />
    </svg>
  );
};

export const SealBestseller: React.FC<{ accent?: string }> = ({ accent = "#F0C040" }) => {
  return (
    <div style={{
      width: "22em",
      height: "22em",
      borderRadius: "50%",
      border: `max(1px,0.4em) solid ${accent}`,
      display: "grid",
      placeItems: "center",
      color: accent,
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700,
      textAlign: "center",
      lineHeight: 1,
      fontSize: "3em",
      padding: "2em"
    }}>
      BEST<br />SELLER
    </div>
  );
};

export const BestAwardSeal: React.FC = () => {
  return (
    <div style={{
      width: "16em",
      height: "16em",
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 30%, #F0C040, #8B6914 80%)",
      border: "max(1px,0.4em) solid #5C4708",
      display: "grid",
      placeItems: "center",
      color: "#3A2A04",
      fontFamily: "'Outfit', system-ui, sans-serif",
      fontWeight: 900,
      fontSize: "2.4em",
      textAlign: "center",
      lineHeight: 1
    }}>
      BEST<br />AWARD
    </div>
  );
};

export const LogoIPFPC: React.FC<{ color?: string; textColor?: string }> = ({ color = "#D4A017", textColor = "#fff" }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8em", fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <svg viewBox="0 0 64 64" style={{ width: "6em", height: "6em", flexShrink: 0 }}>
        {/* Lâmpada e Cérebro estilizados */}
        <path d="M32 8 C22 8 16 15 16 24 C16 30 20 35 24 38 L24 48 C24 50 26 52 28 52 L36 52 C38 52 40 50 40 48 L40 38 C44 35 48 30 48 24 C48 15 42 8 32 8 Z" fill="none" stroke={color} strokeWidth="2.5" />
        <path d="M26 52 L38 52 M28 56 L36 56" stroke={color} strokeWidth="3" strokeLinecap="round" />
        {/* Linhas internas do cérebro/PNL */}
        <path d="M32 14 L32 34 M24 20 C28 20 28 28 32 28 M40 20 C36 20 36 28 32 28" stroke={color} strokeWidth="1.5" fill="none" opacity="0.8" />
        <circle cx="32" cy="28" r="2.5" fill={color} />
        <circle cx="24" cy="20" r="2" fill={color} />
        <circle cx="40" cy="20" r="2" fill={color} />
      </svg>
      <div style={{ textTransform: "uppercase", lineHeight: 0.9, textAlign: "left" }}>
        <div style={{ fontWeight: 900, fontSize: "2.8em", color: textColor, letterSpacing: "0.05em" }}>IPFPC</div>
        <div style={{ fontWeight: 600, fontSize: "0.85em", color: color, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
          Instituto Profissional<br/>de Finanças, PNL e Coaching
        </div>
      </div>
    </div>
  );
};

export const SealOriginalProduct: React.FC<{ color?: string }> = ({ color = "#D4A017" }) => {
  return (
    <div style={{
      width: "18em",
      height: "18em",
      borderRadius: "50%",
      border: `max(1px,0.3em) solid ${color}`,
      background: "rgba(0, 0, 0, 0.4)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: color,
      fontFamily: "'Outfit', system-ui, sans-serif",
      textAlign: "center",
      lineHeight: 1,
      padding: "1.5em",
      position: "relative",
      boxShadow: "0 0 2em rgba(212,160,23,0.15)"
    }}>
      <span style={{ fontSize: "1.4em", fontWeight: 800 }}>★ ★ ★</span>
      <span style={{ fontSize: "2.4em", fontWeight: 900, margin: "0.2em 0", letterSpacing: "0.05em" }}>100%</span>
      <span style={{ fontSize: "1.6em", fontWeight: 800, letterSpacing: "0.1em" }}>ORIGINAL</span>
      <span style={{ fontSize: "1.1em", fontWeight: 600, opacity: 0.8, marginTop: "0.3em" }}>BEST PRODUCT</span>
    </div>
  );
};

export const SealAuthentic: React.FC<{ color?: string }> = ({ color = "#D4A017" }) => {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5em",
      background: "rgba(0, 0, 0, 0.65)",
      border: `max(1px, 0.15em) solid ${color}`,
      borderRadius: "2em",
      padding: "0.4em 1em",
      fontFamily: "'Outfit', system-ui, sans-serif",
      color: color,
      fontSize: "1.8em",
      fontWeight: 800,
      boxShadow: "0 0 1.5em rgba(0,0,0,0.5)"
    }}>
      <svg viewBox="0 0 24 24" style={{ width: "1.5em", height: "1.5em", fill: "none", stroke: color, strokeWidth: "4" }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span style={{ fontSize: "0.85em", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>100% AUTHENTIC</span>
    </div>
  );
};

export const DiagonalRibbon: React.FC<{ color?: string; textColor?: string }> = ({ color = "#D4A017", textColor = "#000" }) => {
  return (
    <div style={{
      position: "absolute",
      top: "4em",
      left: "-3em",
      transform: "rotate(-45deg)",
      background: `linear-gradient(135deg, ${color}, #B8860C)`,
      color: textColor,
      fontFamily: "'Outfit', system-ui, sans-serif",
      fontWeight: 900,
      fontSize: "2.8em",
      padding: "0.4em 3em",
      boxShadow: "0 0.2em 1em rgba(0,0,0,0.4)",
      letterSpacing: "0.08em",
      whiteSpace: "nowrap",
      zIndex: 10,
      textTransform: "uppercase"
    }}>
      Best Seller
    </div>
  );
};

export const Barcode: React.FC<{ isbn?: string }> = ({ isbn = "978-65-00-00000-0" }) => {
  const bars = useMemo(() => Array.from({ length: 45 }, () => Math.random() > 0.6 ? 2 : 1), []);
  return (
    <div style={{ background: "#fff", padding: "1.5em 2em", borderRadius: "0.5em", display: "flex", flexDirection: "column", gap: "0.6em", width: "30em" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.2em", height: "7em" }}>
        {bars.map((b, i) => <div key={i} style={{ width: `${b * 0.25}em`, background: "#000", height: "100%" }} />)}
      </div>
      <div style={{ fontFamily: "monospace, monospace", fontSize: "1.7em", color: "#000", textAlign: "center" }}>{isbn}</div>
    </div>
  );
};

export const QRBox: React.FC<{ label?: string; src?: string }> = ({ label = "", src }) => {
  const cells = useMemo(() => Array.from({ length: 23 * 23 }, () => Math.random() > 0.5 ? 1 : 0), []);
  if (src) {
    return (
      <div style={{ background: "#fff", padding: "1em", borderRadius: "0.5em", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <img src={src} style={{ width: "18em", height: "18em", objectFit: "contain" }} alt="QR Code" />
        {label ? <div style={{ fontFamily: "monospace, monospace", fontSize: "1.6em", color: "#000" }}>{label}</div> : null}
      </div>
    );
  }
  return (
    <div style={{ background: "#fff", padding: "1em", borderRadius: "0.5em", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5em" }}>
      <div style={{ width: "18em", height: "18em", display: "grid", gridTemplateColumns: "repeat(23, 1fr)", gridTemplateRows: "repeat(23, 1fr)" }}>
        {cells.map((c, i) => <div key={i} style={{ background: c ? "#000" : "#fff" }} />)}
      </div>
      {label ? <div style={{ fontFamily: "monospace, monospace", fontSize: "1.6em", color: "#000" }}>{label}</div> : null}
    </div>
  );
};

export const MazePattern: React.FC = () => {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      opacity: 0.18,
      pointerEvents: "none",
      zIndex: 0,
      backgroundImage: `
        linear-gradient(0deg, transparent 49%, rgba(212,160,23,0.4) 49%, rgba(212,160,23,0.4) 51%, transparent 51%),
        linear-gradient(90deg, transparent 49%, rgba(212,160,23,0.4) 49%, rgba(212,160,23,0.4) 51%, transparent 51%)
      `,
      backgroundSize: "14em 14em",
      mask: "radial-gradient(ellipse 100% 100% at 50% 60%, #000 30%, transparent 80%)",
      WebkitMask: "radial-gradient(ellipse 100% 100% at 50% 60%, #000 30%, transparent 80%)",
    }} />
  );
};

export const BlueprintPattern: React.FC = () => {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      opacity: 0.16,
      pointerEvents: "none",
      zIndex: 0,
      backgroundImage: `
        linear-gradient(0deg, transparent 49%, rgba(255,255,255,0.35) 49%, rgba(255,255,255,0.35) 50%, transparent 50%),
        linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.35) 49%, rgba(255,255,255,0.35) 50%, transparent 50%)
      `,
      backgroundSize: "10em 10em",
    }} />
  );
};

// Helper: Dynamic stacked title with premium typography hierarchy
interface TitleLine {
  text: string;
  type: 'connector' | 'highlight' | 'normal';
}

function parseTitleToLines(title: string): TitleLine[] {
  const words = (title || "").split(/\s+/).filter(Boolean);
  const connectors = ["a", "o", "de", "da", "do", "dos", "das", "em", "com", "para", "por", "um", "uma", "na", "no", "nas", "nos", "se", "que", "da", "da,", "de,", "do,"];
  
  let lines: TitleLine[] = [];
  let currentLine: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const wLower = w.toLowerCase().replace(/[,.:;—-]/g, "");
    
    if (connectors.includes(wLower)) {
      if (currentLine.length > 0) {
        lines.push({ text: currentLine.join(" "), type: "normal" });
        currentLine = [];
      }
      lines.push({ text: w.toUpperCase(), type: "connector" });
    } else {
      if (w.includes("-")) {
        if (currentLine.length > 0) {
          lines.push({ text: currentLine.join(" "), type: "normal" });
          currentLine = [];
        }
        const parts = w.split("-");
        lines.push({ text: parts[0].toUpperCase() + "-", type: "highlight" });
        lines.push({ text: parts[1].toUpperCase(), type: "highlight" });
      } else {
        currentLine.push(w.toUpperCase());
      }
    }
  }
  
  if (currentLine.length > 0) {
    lines.push({ text: currentLine.join(" "), type: "normal" });
  }
  
  // Merge consecutive connectors
  let mergedLines: TitleLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i];
    if (cur.type === "connector") {
      if (i + 1 < lines.length && lines[i+1].type === "connector") {
        mergedLines.push({ text: cur.text + " " + lines[i+1].text, type: "connector" });
        i++;
      } else {
        mergedLines.push(cur);
      }
    } else {
      mergedLines.push(cur);
    }
  }
  
  if (mergedLines.length === 0) {
    mergedLines = [{ text: (title || "").toUpperCase(), type: "normal" }];
  }
  
  // Highlight the longest word line if none already highlighted
  let hasHighlight = mergedLines.some(l => l.type === "highlight");
  if (!hasHighlight) {
    let longestIdx = -1;
    let maxLen = 0;
    mergedLines.forEach((l, idx) => {
      if (l.type === "normal" && l.text.length > maxLen) {
        maxLen = l.text.length;
        longestIdx = idx;
      }
    });
    if (longestIdx !== -1) {
      mergedLines[longestIdx].type = "highlight";
    }
  }
  
  return mergedLines;
}

function TitleStacked({ 
  title, 
  accent, 
  ink, 
  styleName,
  hasBgImage
}: {
  title: string;
  accent: string;
  ink: string;
  styleName: string;
  hasBgImage: boolean;
}) {
  const lines = parseTitleToLines(title);
  
  // Adaptive colors based on background
  const baseColor = hasBgImage ? "#F5F0E5" : ink;
  const accentColor = accent;
  const isMinimal = styleName === "Minimalista Elegante";
  
  // Dynamic font choices
  const displayFont = isMinimal
    ? "'Cinzel', 'Playfair Display', Georgia, serif"
    : "'Bebas Neue', 'Outfit', 'Montserrat', sans-serif";
    
  const bodyFont = isMinimal
    ? "'Cinzel', 'Playfair Display', Georgia, serif"
    : "'Montserrat', 'Outfit', sans-serif";

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      gap: "0.2em",
      width: "100%",
      filter: "drop-shadow(0px 3px 6px rgba(0,0,0,0.85)) drop-shadow(0px 8px 18px rgba(0,0,0,0.95))"
    }}>
      {lines.map((l, i) => {
        if (l.type === "connector") {
          return (
            <div key={i} style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              width: "100%", 
              gap: "1.5em", 
              margin: "0.15em 0" 
            }}>
              <div style={{ flex: 1, height: "1.5px", background: `linear-gradient(90deg, transparent, ${accentColor})`, opacity: 0.6 }} />
              <span style={{ 
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", 
                fontStyle: "italic", 
                fontSize: "4em", 
                fontWeight: 700,
                color: accentColor,
                textTransform: "lowercase",
                letterSpacing: "0.08em"
              }}>
                {l.text}
              </span>
              <div style={{ flex: 1, height: "1.5px", background: `linear-gradient(270deg, transparent, ${accentColor})`, opacity: 0.6 }} />
            </div>
          );
        }
        
        const isHighlight = l.type === "highlight";
        const textLen = l.text.length;
        
        // Dynamic font size based on length
        const fontSize = isHighlight 
          ? (textLen <= 5 ? "15.5em" : textLen <= 8 ? "13.5em" : textLen <= 12 ? "10.5em" : "8.5em")
          : (textLen <= 5 ? "13.5em" : textLen <= 8 ? "11.5em" : textLen <= 12 ? "9.2em" : "7.5em");
          
        const gradient = isHighlight
          ? `linear-gradient(to bottom, #FFE8A3 0%, #F0C040 35%, #D4A017 65%, #8B6914 100%)` // liquid gold 3D
          : hasBgImage 
            ? `linear-gradient(to bottom, #FFFFFF 0%, #E8E4DC 50%, #B0AAA2 100%)` // metallic silver
            : isMinimal
              ? `linear-gradient(to bottom, #303030 0%, #0A0A0A 100%)`
              : `linear-gradient(to bottom, #FFFFFF 0%, #ECEFF1 100%)`;

        return (
          <div 
            key={i} 
            style={{ 
              fontSize: fontSize,
              fontFamily: isHighlight ? displayFont : bodyFont,
              fontWeight: isMinimal ? (isHighlight ? 800 : 600) : (isHighlight ? 900 : 700),
              letterSpacing: isMinimal ? "0.02em" : (isHighlight ? "-0.01em" : "0.02em"),
              lineHeight: 0.9,
              background: gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textAlign: "center",
              textTransform: isMinimal ? "uppercase" : "uppercase",
            }}
          >
            {l.text}
          </div>
        );
      })}
    </div>
  );
}

const FrontPane: React.FC<{ s: CoverStyleConfig; book: CoverBookData; assets: CoverAssets }> = ({ s, book, assets }) => {
  const safe = 10;
  const inSafe = { padding: `${safe + 4}em ${safe}em` };
  const styleId = s.name;
  
  // Detect if a custom AI background image is present
  const hasBgImage = !!book.bgImage;

  return (
    <div className="cc-pane" style={{ background: "transparent", color: hasBgImage ? "#F5F0E5" : s.vars.ink, ...inSafe, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Moldura clássica dupla de ouro (Luxury border for minimalist bestseller) */}
      {s.name === "Minimalista Elegante" && (
        <div style={{
          position: "absolute",
          inset: "2.5em",
          border: "2px solid rgba(158,126,56,0.35)",
          pointerEvents: "none",
          zIndex: 5
        }}>
          <div style={{ position: "absolute", inset: "0.4em", border: "1px solid rgba(158,126,56,0.18)" }} />
          {/* Corner ornaments */}
          <div style={{ position: "absolute", top: "-0.5em", left: "-0.5em", width: "1.5em", height: "1.5em", borderTop: "3.5px solid #9E7E38", borderLeft: "3.5px solid #9E7E38" }} />
          <div style={{ position: "absolute", top: "-0.5em", right: "-0.5em", width: "1.5em", height: "1.5em", borderTop: "3.5px solid #9E7E38", borderRight: "3.5px solid #9E7E38" }} />
          <div style={{ position: "absolute", bottom: "-0.5em", left: "-0.5em", width: "1.5em", height: "1.5em", borderBottom: "3.5px solid #9E7E38", borderLeft: "3.5px solid #9E7E38" }} />
          <div style={{ position: "absolute", bottom: "-0.5em", right: "-0.5em", width: "1.5em", height: "1.5em", borderBottom: "3.5px solid #9E7E38", borderRight: "3.5px solid #9E7E38" }} />
        </div>
      )}
      
      {/* Pattern overlays (Only drawn if NO AI background image is loaded to prevent visual clutter) */}
      {!hasBgImage && (
        <>
          {s.name === "Ilustrado Vetorial" && <BlueprintPattern />}
          {s.name === "Tipográfico Expressivo" && <MazePattern />}
          {s.name === "Abstrato Conceitual" && <MazePattern />}
        </>
      )}
      
      {/* Top Left diagonal ribbon 'BEST SELLER' (skip for minimalist and when having background artwork) */}
      {s.name !== "Minimalista Elegante" && !hasBgImage && <DiagonalRibbon color={s.vars.accent} />}
      
      {/* Top Right '100% AUTHENTIC' badge (skip for minimalist) */}
      {s.name !== "Minimalista Elegante" && (
        <div style={{ position: "absolute", top: "4em", right: "4.5em", zIndex: 10 }}>
          <SealAuthentic color={s.vars.accent} />
        </div>
      )}

      {/* Author Name */}
      <div style={{ position: "relative", textAlign: "center", zIndex: 5, marginBottom: "3em" }}>
        <div style={{ 
          fontFamily: s.name === "Minimalista Elegante" ? "'Cinzel', serif" : s.vars.bodyFamily, 
          fontWeight: 700, 
          letterSpacing: "0.42em", 
          fontSize: "4.4em", 
          color: hasBgImage ? "#FFEFA6" : s.vars.accent, 
          textTransform: "uppercase",
          filter: hasBgImage ? "drop-shadow(0px 2px 4px rgba(0,0,0,0.8))" : "none"
        }}>
          {book.author}
        </div>
      </div>

      {/* Title Area */}
      <div style={{ position: "relative", textAlign: "center", zIndex: 5, marginTop: "1em", width: "100%" }}>
        <TitleStacked title={book.title} accent={s.vars.accent} ink={s.vars.ink} styleName={s.name} hasBgImage={hasBgImage} />
      </div>

      {/* Middle Graphic Elements: HIDE COMPLETELY if an AI artwork background image is active to let the art shine! */}
      {!hasBgImage ? (
        <div style={{ flex: 1, display: "grid", placeItems: "center", margin: "2em 0", position: "relative", zIndex: 4 }}>
          {s.name === "Minimalista Elegante" && (
            <div style={{ width: "22em", height: "0.2em", background: `linear-gradient(90deg, transparent, ${s.vars.accent}, transparent)` }} />
          )}

          {s.name === "Ilustrado Vetorial" && (
            <div style={{ width: "50em", height: "35em", display: "grid", placeItems: "center", position: "relative" }}>
              <svg viewBox="0 0 100 70" style={{ width: "100%", height: "100%" }}>
                <circle cx="50" cy="35" r="25" fill="none" stroke={s.vars.accent} strokeWidth="1.5" opacity="0.6" />
                <polygon points="50,15 65,48 35,48" fill={s.vars.accent2} opacity="0.85" />
                <circle cx="50" cy="32" r="6.5" fill={s.vars.ink} />
              </svg>
            </div>
          )}

          {s.name === "Fotográfico Realista" && (
            <div style={{ width: "70%", height: "38em" }} />
          )}

          {s.name === "Tipográfico Expressivo" && (
            <div style={{ fontFamily: s.vars.titleFamily, fontWeight: 900, fontSize: "4.2em", color: s.vars.accent, opacity: 0.85, letterSpacing: "0.15em" }}>
              ★★★ BRAND ★★★
            </div>
          )}

          {s.name === "Abstrato Conceitual" && (
            <div style={{ width: "54em", height: "54em", borderRadius: "50%", background: `radial-gradient(circle at 50% 35%, rgba(${s.vars.accent === '#00E5FF' ? '0,229,255' : '240,192,64'},0.25), transparent 65%)`, display: "grid", placeItems: "center", position: "relative" }}>
              <div style={{ width: "28em", height: "28em", borderRadius: "50%", background: `linear-gradient(135deg, ${s.vars.accent}, ${s.vars.accent2})`, boxShadow: `0 0 8em ${s.vars.accent}`, opacity: 0.9 }} />
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1 }} /> /* Pure space for AI Art */
      )}

      {/* Subtitle Area */}
      <div style={{ 
        position: "relative", 
        textAlign: "center", 
        zIndex: 5, 
        marginBottom: "3.5em",
        padding: "0 1em",
        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.95))"
      }}>
        <div style={{ 
          fontFamily: s.name === "Minimalista Elegante" ? "'Cormorant Garamond', 'Playfair Display', serif" : "'Montserrat', 'Outfit', sans-serif", 
          fontWeight: s.name === "Minimalista Elegante" ? 600 : 700, 
          fontSize: s.name === "Minimalista Elegante" ? "4.8em" : "4.0em", 
          color: hasBgImage ? "#E8E4DC" : s.vars.ink, 
          lineHeight: 1.35, 
          letterSpacing: s.name === "Minimalista Elegante" ? "0.02em" : "0.03em",
          textTransform: s.name === "Minimalista Elegante" ? "none" : "uppercase"
        }}>
          {book.subtitle.split(" ").map((w, i) => {
            const cleanWord = w.toLowerCase().replace(/[,.:;—-]/g, "");
            const isHighlight = /vendas|sucesso|impacto|lucro|riqueza|melhor|excelente|universal|crenças|chave|neuro|influência|escutar|líder|liderança|fé|segredo|poder/i.test(cleanWord);
            
            return (
              <span key={i} style={{ 
                color: isHighlight ? (hasBgImage ? "#F0C040" : s.vars.accent) : "inherit",
                fontWeight: isHighlight ? 800 : "inherit",
                fontStyle: s.name === "Minimalista Elegante" && !isHighlight ? "italic" : "normal"
              }}>
                {w}{" "}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Row for Front Cover (Rendered directly on beautiful dark background, centered) */}
      <div style={{
        marginTop: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2em",
        zIndex: 10,
        width: "100%",
        boxSizing: "border-box",
        marginBottom: "2em"
      }}>
        {/* Bottom-left of Front Cover: Best Award Seal */}
        <div style={{ transform: "scale(0.85)", transformOrigin: "left bottom" }}>
          <BestAwardSeal />
        </div>

        {/* Bottom-center of Front Cover: Editora 360 Express Logo (Perfect Center!) */}
        <div style={{ display: "flex", justifyContent: "center", transform: "scale(1.0)" }}>
          <EditoraLogo color={hasBgImage ? "#F5F0E5" : s.vars.ink} />
        </div>

        {/* Bottom-right of Front Cover: QR Code (Larger Size!) */}
        <div style={{ transform: "scale(1.2)", transformOrigin: "right bottom" }}>
          <QRBox src={assets.qrcode} />
        </div>
      </div>
    </div>
  );
};

const BackPane: React.FC<{ s: CoverStyleConfig; book: CoverBookData; assets: CoverAssets; hasFlap: boolean }> = ({ s, book, assets, hasFlap }) => {
  const safe = 10;
  const inSafe = { padding: `${safe + 4}em ${safe}em` };
  const headlineColor = s.vars.accent;
  const isMinimal = s.name === "Minimalista Elegante";

  return (
    <div className="cc-pane" style={{ background: "transparent", color: s.vars.ink, ...inSafe, display: "flex", flexDirection: "column", position: "relative" }}>
      {!isMinimal && s.name === "Ilustrado Vetorial" && <MazePattern />}
      {s.name === "Fotográfico Realista" && <BlueprintPattern />}
      
      {!hasFlap && (
        <div style={{ position: "relative", display: "flex", gap: "5em", alignItems: "flex-start", marginBottom: "3em" }}>
          <div style={{ width: "24em", height: "30em", borderRadius: "1.5em", background: "#222", border: `max(1px,0.4em) solid ${s.vars.accent}`, overflow: "hidden", flexShrink: 0 }}>
            {assets.authorPhoto
              ? <img src={assets.authorPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#3a3a3a,#1a1a1a)", display: "grid", placeItems: "center", color: "#888", fontFamily: "sans-serif", fontSize: "2.8em" }}>foto do autor</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: s.vars.bodyFamily, fontWeight: 700, fontSize: "4em", color: s.vars.accent, letterSpacing: "0.12em", textTransform: "uppercase" }}>{book.author}</div>
            <div style={{ fontSize: "3em", lineHeight: 1.4, color: s.vars.ink, opacity: 0.85, marginTop: "2em" }}>
              {book.authorBio?.slice(0, 240) || ""}
            </div>
          </div>
        </div>
      )}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "2.5em" }}>
        <h2 style={{ fontFamily: s.vars.titleFamily, fontWeight: 700, fontSize: "5.4em", lineHeight: 1.15, color: headlineColor, textTransform: s.vars.titleCase === "uppercase" ? "uppercase" : "none", marginBottom: "1em", textWrap: "balance" } as any}>
          {book.backHook}
        </h2>
        <div style={{ fontSize: "3.2em", lineHeight: 1.55, color: s.vars.ink, opacity: 0.92 }}>
          {book.backBody}
        </div>
        {book.backBullets && book.backBullets.length > 0 && (
          <ul style={{ marginTop: "1em", paddingLeft: "4em", display: "flex", flexDirection: "column", gap: "1.6em" }}>
            {book.backBullets.map((b, i) => (
              <li key={i} style={{ fontSize: "3em", lineHeight: 1.45, listStyle: "none", position: "relative" }}>
                <span style={{ color: s.vars.accent, fontWeight: 800, position: "absolute", left: "-4em" }}>{i + 1}.</span>
                {b}
              </li>
            ))}
          </ul>
        )}
        <p style={{ marginTop: "2.5em", fontSize: "3.2em", fontWeight: 700, color: s.vars.accent, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.3 }}>
          {book.backCTA}
        </p>
      </div>

      <div style={{ flex: 1 }} />

      {/* Bottom Footer Row for Back Cover (Rendered directly on beautiful dark background, centered) */}
      <div style={{
        marginTop: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2em",
        zIndex: 10,
        width: "100%",
        boxSizing: "border-box",
        marginBottom: "2em"
      }}>
        {/* Bottom-left of Back Cover: IPFPC Logo */}
        <div style={{ transform: "scale(0.85)", transformOrigin: "left bottom" }}>
          <LogoIPFPC color={s.vars.accent} textColor={s.vars.ink} />
        </div>

        {/* Bottom-center of Back Cover: Editora 360 Express Logo (Perfect Center!) */}
        <div style={{ display: "flex", justifyContent: "center", transform: "scale(1.0)" }}>
          <EditoraLogo color={s.vars.ink} />
        </div>

        {/* Bottom-right of Back Cover: Website URL */}
        <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 700, fontSize: "2.8em", color: s.vars.accent, letterSpacing: "0.05em" }}>
          www.ipfpc.com.br
        </div>
      </div>
    </div>
  );
};

const SpinePane: React.FC<{ s: CoverStyleConfig; book: CoverBookData; spineMM: number }> = ({ s, book, spineMM }) => {
  const showFull = spineMM >= 7;
  return (
    <div className="cc-pane" style={{ background: "transparent", color: s.vars.ink, padding: "10em 1em", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
      {showFull && (
        <>
          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: s.vars.titleFamily, fontWeight: 700, fontSize: spineMM > 12 ? "4em" : "3.2em", textTransform: s.vars.titleCase === "uppercase" ? "uppercase" : "none", color: s.vars.ink, letterSpacing: "0.06em", whiteSpace: "nowrap" } as any}>
            {book.title}
          </div>
          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: s.vars.bodyFamily, fontWeight: 600, fontSize: "2.8em", color: s.vars.accent, letterSpacing: "0.18em", textTransform: "uppercase", whiteSpace: "nowrap" } as any}>
            {book.author}
          </div>
          <div style={{ width: "6em", height: "6em" }}>
            <EditoraLogoMini color={s.vars.ink} />
          </div>
        </>
      )}
    </div>
  );
};

const FlapPane: React.FC<{ s: CoverStyleConfig; book: CoverBookData; assets: CoverAssets; kind: "back-flap" | "front-flap"; transition: "left" | "right" }> = ({ s, book, assets, kind, transition }) => {
  const safe = 8;
  const fadeFrom = transition === "left" ? "right" : "left";
  return (
    <div className="cc-pane" style={{ background: "transparent", color: s.vars.flapInk, padding: `${safe + 2}em ${safe}em`, display: "flex", flexDirection: "column", gap: "2.5em", position: "relative" }}>
      {/* fold gradient shadow */}
      <div style={{
        position: "absolute", top: 0, bottom: 0,
        [fadeFrom]: 0, width: "16em",
        background: `linear-gradient(${fadeFrom === 'right' ? '90deg' : '-90deg'}, transparent, rgba(0,0,0,0.55))`,
        pointerEvents: "none", zIndex: 2,
      } as any} />
      {kind === "back-flap" && (
        <>
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: s.vars.bodyFamily, fontWeight: 700, fontSize: "3.6em", color: s.vars.accent, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "0.5em" }}>
              {book.author}
            </div>
          </div>
          <div style={{ position: "relative", fontSize: "2.8em", lineHeight: 1.45, color: s.vars.flapInk, opacity: 0.92, flex: 1 }}>
            {book.authorBio}
          </div>
          
          {/* Código de barras na orelha da contracapa na parte inferior */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "auto", position: "relative", zIndex: 10 }}>
            {assets.barcode ? (
              <img src={assets.barcode} style={{ height: "11em", objectFit: "contain", background: "#fff", padding: "1.2em", borderRadius: "0.5em" }} alt="Barcode" />
            ) : (
              <Barcode isbn={book.isbn} />
            )}
          </div>
        </>
      )}
      {kind === "front-flap" && (
        <>
          <div style={{ position: "relative", fontFamily: s.vars.titleFamily, fontWeight: 700, fontSize: "4.2em", lineHeight: 1.2, color: s.vars.accent, textTransform: s.vars.titleCase === "uppercase" ? "uppercase" : "none" } as any}>
            {book.flapHook}
          </div>
          <div style={{ position: "relative", fontSize: "2.8em", lineHeight: 1.5, color: s.vars.flapInk, opacity: 0.92, flex: 1 }}>
            {book.flapBody}
          </div>
          
          <div style={{ flex: 1 }} />
          
          {/* Orelha Direita Base: Foto do Autor + Logo IPFPC */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "2em", marginTop: "auto" }}>
            <div style={{ width: "16em", height: "21em", borderRadius: "1em", background: "#222", border: `max(1px,0.3em) solid ${s.vars.accent}`, overflow: "hidden", boxShadow: "0 0.5em 2em rgba(0,0,0,0.5)" }}>
              {assets.authorPhoto
                ? <img src={assets.authorPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#3a3a3a,#1a1a1a)", display: "grid", placeItems: "center", color: "#888", fontFamily: "sans-serif", fontSize: "2em" }}>foto do autor</div>
              }
            </div>
            <div style={{ transform: "scale(0.85)", transformOrigin: "bottom center" }}>
              <LogoIPFPC color={s.vars.accent} textColor={s.vars.flapInk} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT — CoverRender
// ============================================================

export interface CoverRenderProps {
  book: CoverBookData;
  dims: CoverDims;
  styleKey?: string;
  mode?: "full" | "no-flaps" | "ebook";
  pxPerMM?: number;
  showGuides?: boolean;
  assets?: CoverAssets;
  customBgImg?: string;
  colors?: string[];
}

export const CoverRender: React.FC<CoverRenderProps> = ({
  book,
  dims,
  styleKey = "premium",
  mode = "full",
  pxPerMM = 1.4,
  showGuides = false,
  assets = {},
  customBgImg,
  colors
}) => {
  const baseS = STYLES[styleKey] || STYLES.minimalist;
  let s = customBgImg ? { ...baseS, vars: { ...baseS.vars, bgImg: customBgImg } } : baseS;

  if (colors && colors.length > 0) {
    const primary = colors[0];
    const secondary = colors[1] || primary;
    const tertiary = colors[2] || secondary;

    // Helper to convert hex to rgb string for modern gradients
    const toRgbStr = (hex: string) => {
      const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
      if (!res) return "0,0,0";
      return `${parseInt(res[1], 16)},${parseInt(res[2], 16)},${parseInt(res[3], 16)}`;
    };

    s = {
      ...s,
      vars: {
        ...s.vars,
        accent: tertiary !== "#000000" && tertiary !== "#FFFFFF" ? tertiary : s.vars.accent,
        accent2: secondary !== "#000000" && secondary !== "#FFFFFF" ? secondary : s.vars.accent2,
        bgGrad: customBgImg ? s.vars.bgGrad : `radial-gradient(ellipse 90% 90% at 50% 50%, rgba(${toRgbStr(primary)},0.35), transparent 75%), linear-gradient(180deg, ${primary} 0%, ${secondary} 100%)`,
      }
    };
  }

  const safe = 10;
  const bleed = dims.bleed;
  const flap = dims.flap;
  const trim = dims.trim;
  const spine = dims.spineMM;

  interface Col {
    kind: "bleed-l" | "back-flap" | "back" | "spine" | "front" | "front-flap" | "bleed-r";
    w: number;
  }

  let cols: Col[];
  if (mode === "full") {
    cols = [
      { kind: "bleed-l", w: bleed },
      { kind: "back-flap", w: flap },
      { kind: "back", w: trim.w },
      { kind: "spine", w: spine },
      { kind: "front", w: trim.w },
      { kind: "front-flap", w: flap },
      { kind: "bleed-r", w: bleed },
    ];
  } else if (mode === "no-flaps") {
    cols = [
      { kind: "bleed-l", w: bleed },
      { kind: "back", w: trim.w },
      { kind: "spine", w: spine },
      { kind: "front", w: trim.w },
      { kind: "bleed-r", w: bleed },
    ];
  } else {
    cols = [{ kind: "front", w: trim.w }];
  }

  const totalW = cols.reduce((a, c) => a + c.w, 0);
  const totalH = mode === "ebook" ? trim.h : (trim.h + bleed * 2);
  const hasFlap = mode === "full";

  // Set continuous background
  const bgStyle = s.vars.bgImg 
    ? `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%), url(${s.vars.bgImg})` 
    : (s.vars.bgGrad || s.vars.bg);

  const wPx = totalW * pxPerMM;
  const hPx = totalH * pxPerMM;

  return (
    <div
      className={`cover-canvas relative border border-slate-700/50 shadow-2xl rounded overflow-hidden select-none ${showGuides ? "" : "cv-clean"}`}
      style={{
        width: `${wPx}px`,
        height: `${hPx}px`,
        display: "grid",
        gridTemplateColumns: cols.map(c => `${c.w * pxPerMM}px`).join(" "),
        gridTemplateRows: `${hPx}px`,
        fontSize: `${pxPerMM}px`,
        lineHeight: 1.2,
        background: bgStyle,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {cols.map((c, i) => {
        if (c.kind === "bleed-l" || c.kind === "bleed-r") {
          return <div key={i} className="cc-pane h-full" style={{ background: "transparent" }} />;
        }
        if (c.kind === "back-flap") return <FlapPane key={i} s={s} book={book} assets={assets} kind="back-flap" transition="left" />;
        if (c.kind === "front-flap") return <FlapPane key={i} s={s} book={book} assets={assets} kind="front-flap" transition="right" />;
        if (c.kind === "back") return <BackPane key={i} s={s} book={book} assets={assets} hasFlap={hasFlap} />;
        if (c.kind === "spine") return <SpinePane key={i} s={s} book={book} spineMM={spine} />;
        if (c.kind === "front") return <FrontPane key={i} s={s} book={book} assets={assets} />;
        return null;
      })}

      {showGuides && <div className="cc-bleed absolute inset-0 pointer-events-none border-[3.175em] border-dashed border-red-500/25 z-40" />}
      
      {showGuides && cols.map((c, i) => {
        if (!["back", "front"].includes(c.kind)) return null;
        const left = cols.slice(0, i).reduce((a, cc) => a + cc.w, 0);
        return (
          <div
            key={`safe-${i}`}
            className="cc-safe absolute pointer-events-none border border-dashed border-green-500/35 z-40"
            style={{
              left: `${(left + safe) * pxPerMM}px`,
              top: `${(bleed + safe) * pxPerMM}px`,
              width: `${(c.w - safe * 2) * pxPerMM}px`,
              height: `${(trim.h - safe * 2) * pxPerMM}px`,
            }}
          />
        );
      })}

      {showGuides && (() => {
        const lefts: { x: number; type: string }[] = [];
        let acc = 0;
        cols.forEach((c, i) => {
          if (i > 0) lefts.push({ x: acc, type: cols[i - 1].kind + "→" + c.kind });
          acc += c.w;
        });
        return lefts.filter(l => /flap|spine/.test(l.type)).map((l, i) => (
          <div
            key={`fm-${i}`}
            className="cc-fold-marker absolute top-0 bottom-0 border-l border-dashed border-blue-400/40 z-40 pointer-events-none"
            style={{ left: `${l.x * pxPerMM}px` }}
          />
        ));
      })()}
    </div>
  );
};
