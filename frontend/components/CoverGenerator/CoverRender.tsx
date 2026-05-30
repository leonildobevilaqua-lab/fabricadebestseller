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
  premium: {
    name: "Premium Dourado",
    note: "Modelado em best-sellers de negócios/marketing (mainstream).",
    vars: {
      bg: "#080806",
      bgGrad: "radial-gradient(ellipse 80% 110% at 50% 60%, rgba(184,134,12,0.45), transparent 55%), radial-gradient(ellipse at 20% 20%, rgba(212,160,23,0.18), transparent 50%), #050505",
      ink: "#F5F0E5",
      accent: "#F0C040",
      accent2: "#D4A017",
      flapBg: "#000",
      flapInk: "#E8E4DC",
      titleFamily: "'Outfit', system-ui, sans-serif",
      titleWeight: 900,
      titleCase: "uppercase",
      bodyFamily: "'Outfit', system-ui, sans-serif",
    },
  },
  editorial: {
    name: "Editorial Autoridade",
    note: "Modelado em livros técnicos/acadêmicos com cor sólida e serifa.",
    vars: {
      bg: "#0E2A57",
      bgGrad: "radial-gradient(ellipse 90% 80% at 80% 20%, rgba(255,255,255,0.10), transparent 60%), linear-gradient(180deg, #143063 0%, #0A1F45 100%)",
      ink: "#FFFFFF",
      accent: "#F2B400",
      accent2: "#FFFFFF",
      flapBg: "#0A1F45",
      flapInk: "#E6E9F2",
      titleFamily: "'Playfair Display', Georgia, serif",
      titleWeight: 700,
      titleCase: "none",
      bodyFamily: "'Outfit', system-ui, sans-serif",
    },
  },
  vibrant: {
    name: "Vibrante Aspiracional",
    note: "Modelado em capas warm/sunset com forte hierarquia tipográfica.",
    vars: {
      bg: "#3B1A06",
      bgGrad: "radial-gradient(ellipse at 50% 85%, #F09B2C 0%, #B85A12 25%, #4A1B06 70%, #1E0A03 100%)",
      ink: "#FFF7E8",
      accent: "#FFC34D",
      accent2: "#FFFFFF",
      flapBg: "#1E0A03",
      flapInk: "#F0E6D0",
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

export const QRBox: React.FC<{ label?: string }> = ({ label = "" }) => {
  const cells = useMemo(() => Array.from({ length: 23 * 23 }, () => Math.random() > 0.5 ? 1 : 0), []);
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

// Helper: Titlestacked
function TitleStacked({ title, accent, ink, family, weight, case: caseT }: {
  title: string;
  accent: string;
  ink: string;
  family: string;
  weight: number;
  case: string;
}) {
  const lines = splitTitleLines(title);
  return (
    <div style={{ fontFamily: family, fontWeight: weight, lineHeight: 0.95, textTransform: caseT as any, letterSpacing: "-0.01em" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: l.length > 10 ? "11em" : l.length > 6 ? "13em" : "16em", color: i === 1 ? accent : ink }}>
          {l}
        </div>
      ))}
    </div>
  );
}

function splitTitleLines(t: string): string[] {
  const words = (t || "").split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [words.join(" ")];
  if (words.length === 3) return [words.slice(0, 1).join(" "), words.slice(1, 2).join(" "), words.slice(2).join(" ")];
  if (words.length === 4) return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
  return [words.slice(0, 2).join(" "), words.slice(2, 4).join(" "), words.slice(4).join(" ")];
}

function splitTitleWords(t: string) {
  const w = (t || "").split(/\s+/);
  if (w.length <= 1) return { pre: t, hi: "" };
  const cut = Math.floor(w.length / 2);
  return { pre: w.slice(0, cut).join(" "), hi: w.slice(cut).join(" ") };
}

// ============================================================
// PANELS RENDER
// ============================================================

const FrontPane: React.FC<{ s: CoverStyleConfig; book: CoverBookData }> = ({ s, book }) => {
  const safe = 10;
  const inSafe = { padding: `${safe + 4}em ${safe}em` };
  const styleId = s.name;

  const baseLayout = (bgContent: React.ReactNode, titleSection: React.ReactNode, subtitleSection: React.ReactNode, mainMiddleElement?: React.ReactNode) => {
    return (
      <div className="cc-pane" style={{ background: s.vars.bgImg ? `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%), url(${s.vars.bgImg}) center/cover no-repeat` : s.vars.bgGrad, color: s.vars.ink, ...inSafe, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {bgContent}
        
        {/* Top Left diagonal ribbon 'BEST SELLER' */}
        <DiagonalRibbon color={s.vars.accent} />
        
        {/* Top Right '100% AUTHENTIC' badge */}
        <div style={{ position: "absolute", top: "4em", right: "4.5em", zIndex: 10 }}>
          <SealAuthentic color={s.vars.accent} />
        </div>

        {/* Author Name */}
        <div style={{ position: "relative", textAlign: "center", zIndex: 5, marginBottom: "4em" }}>
          <div style={{ fontFamily: s.vars.bodyFamily, fontWeight: 700, letterSpacing: "0.32em", fontSize: "4.4em", color: s.vars.ink, textTransform: "uppercase" }}>
            {book.author}
          </div>
        </div>

        {/* Title Area */}
        {titleSection}

        {/* Main graphics/logo area in middle */}
        {mainMiddleElement}

        {/* Subtitle Area */}
        {subtitleSection}

        {/* Golden Bottom Row (Original Product, Editora Logo, Logo IPFPC) */}
        <div style={{ position: "relative", marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", zIndex: 5, padding: "0 1em" }}>
          <div style={{ transform: "scale(0.82)", transformOrigin: "left bottom" }}>
            <SealOriginalProduct color={s.vars.accent} />
          </div>
          <div style={{ transform: "scale(0.85)" }}>
            <EditoraLogo color={s.vars.ink} />
          </div>
          <div style={{ transform: "scale(0.88)", transformOrigin: "right bottom" }}>
            <LogoIPFPC color={s.vars.accent} textColor={s.vars.ink} />
          </div>
        </div>
      </div>
    );
  };

  if (styleId === STYLES.premium.name) {
    return baseLayout(
      <MazePattern />,
      <div style={{ position: "relative", textAlign: "center", lineHeight: 0.92, zIndex: 5, marginTop: "2em" }}>
        <TitleStacked title={book.title} accent={s.vars.accent} ink={s.vars.ink} family={s.vars.titleFamily} weight={s.vars.titleWeight} case={s.vars.titleCase} />
      </div>,
      <div style={{ position: "relative", textAlign: "center", marginTop: "3em", zIndex: 5 }}>
        <div style={{ fontFamily: s.vars.bodyFamily, fontWeight: 700, fontSize: "4.2em", color: s.vars.ink, lineHeight: 1.25, letterSpacing: "0.02em", textTransform: "uppercase" }}>
          {book.subtitle.split(" ").map((w, i) => (
            /vendas|sucesso|impacto|lucro|riqueza|melhor|excelente/i.test(w)
              ? <span key={i} style={{ color: s.vars.accent }}>{w} </span>
              : <span key={i}>{w} </span>
          ))}
        </div>
      </div>,
      <div style={{ flex: 1, display: "grid", placeItems: "center", margin: "2em 0" }}>
        <div style={{ width: "54em", height: "54em", borderRadius: "50%", background: "radial-gradient(circle at 50% 35%, rgba(240,192,64,0.22), transparent 65%)", display: "grid", placeItems: "center", position: "relative" }}>
          <div style={{ width: "30em", height: "40em", borderRadius: "1em", background: "linear-gradient(180deg, #1a1a1a, #050505)", border: `max(1px,0.4em) solid rgba(240,192,64,0.65)`, display: "grid", placeItems: "center", boxShadow: "0 0 10em rgba(240,192,64,0.3)" }}>
            <SealBestseller accent={s.vars.accent} />
          </div>
        </div>
      </div>
    );
  }

  if (styleId === STYLES.editorial.name) {
    return baseLayout(
      <BlueprintPattern />,
      <div style={{ position: "relative", textAlign: "center", zIndex: 5, marginTop: "2em" }}>
        <div style={{ fontFamily: s.vars.titleFamily, fontWeight: 700, fontSize: "12em", lineHeight: 1.0, letterSpacing: "-0.01em" }}>
          <span style={{ color: s.vars.ink }}>{splitTitleWords(book.title).pre}</span>{" "}
          <span style={{ color: s.vars.accent, fontStyle: "italic" }}>{splitTitleWords(book.title).hi}</span>
        </div>
      </div>,
      <div style={{ position: "relative", marginTop: "3em", textAlign: "center", zIndex: 5 }}>
        <div style={{ fontFamily: s.vars.titleFamily, fontStyle: "italic", fontSize: "4.5em", lineHeight: 1.3, color: s.vars.ink, opacity: 0.95 }}>
          {book.subtitle}
        </div>
      </div>,
      <div style={{ flex: 1, display: "grid", placeItems: "center", margin: "2em 0" }}>
        <BestAwardSeal />
      </div>
    );
  }

  // vibrant
  return baseLayout(
    null,
    <div style={{ position: "relative", textAlign: "center", zIndex: 5, marginTop: "2em" }}>
      <TitleStacked title={book.title} accent={s.vars.accent} ink={s.vars.ink} family={s.vars.titleFamily} weight={s.vars.titleWeight} case={s.vars.titleCase} />
    </div>,
    <div style={{ position: "relative", textAlign: "center", marginTop: "3em", zIndex: 5 }}>
      <div style={{ fontFamily: s.vars.bodyFamily, fontWeight: 600, fontSize: "4.2em", lineHeight: 1.35, opacity: 0.95 }}>
        {book.subtitle}
      </div>
    </div>,
    <div style={{ flex: 1, display: "grid", placeItems: "center", margin: "2em 0" }}>
      {!s.vars.bgImg && (
        <div style={{ width: "75%", height: "46em", borderRadius: "2em", background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 2em, transparent 2em 6em), rgba(0,0,0,0.18)", border: `max(1px,0.3em) solid rgba(255,255,255,0.18)`, display: "grid", placeItems: "center", color: "rgba(255,255,255,0.45)", fontFamily: "monospace", fontSize: "3em", letterSpacing: "0.16em", textTransform: "uppercase" }}>
          imagem central — gerada por IA
        </div>
      )}
    </div>
  );
};

const BackPane: React.FC<{ s: CoverStyleConfig; book: CoverBookData; assets: CoverAssets; hasFlap: boolean }> = ({ s, book, assets, hasFlap }) => {
  const safe = 10;
  const inSafe = { padding: `${safe + 4}em ${safe}em` };
  const headlineColor = s.vars.accent;
  const isPremium = s.name === STYLES.premium.name;
  return (
    <div className="cc-pane" style={{ background: s.vars.bgGrad, color: s.vars.ink, ...inSafe, display: "flex", flexDirection: "column", position: "relative" }}>
      {isPremium && <MazePattern />}
      {s.name === STYLES.editorial.name && <BlueprintPattern />}
      
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

      {/* Base Contracapa com Logos e Visitas */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", zIndex: 5, padding: "0 1em", marginTop: "3em" }}>
        <div style={{ transform: "scale(0.85)", transformOrigin: "left center" }}>
          <EditoraLogo color={s.vars.ink} />
        </div>
        <div style={{ textAlign: "center", color: s.vars.ink, fontFamily: s.vars.bodyFamily, fontSize: "2.3em", opacity: 0.9, lineHeight: 1.2 }}>
          <strong>Visite-nos:</strong><br />
          <span style={{ color: s.vars.accent, fontWeight: 700 }}>www.ipfpc.com.br</span><br />
          @ipfpc | @leonildobevilaqua
        </div>
        <div style={{ transform: "scale(0.88)", transformOrigin: "right center" }}>
          <LogoIPFPC color={s.vars.accent} textColor={s.vars.ink} />
        </div>
      </div>

      {/* Rodapé Absoluto dos Códigos de Barras e QR */}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "4em", marginTop: "2em", borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: "2em" }}>
        {assets.barcode ? (
          <img src={assets.barcode} style={{ height: "11em", objectFit: "contain", background: "#fff", padding: "1.2em", borderRadius: "0.5em" }} alt="Barcode" />
        ) : (
          <Barcode isbn={book.isbn} />
        )}
        {assets.qrcode ? (
          <img src={assets.qrcode} style={{ height: "13em", width: "13em", objectFit: "contain", background: "#fff", padding: "1.2em", borderRadius: "0.5em" }} alt="QR Code" />
        ) : (
          <QRBox label="" />
        )}
      </div>
    </div>
  );
};

const SpinePane: React.FC<{ s: CoverStyleConfig; book: CoverBookData; spineMM: number }> = ({ s, book, spineMM }) => {
  const showFull = spineMM >= 7;
  return (
    <div className="cc-pane" style={{ background: s.vars.bgGrad, color: s.vars.ink, padding: "10em 1em", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
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
    <div className="cc-pane" style={{ background: s.vars.bgGrad, color: s.vars.flapInk, padding: `${safe + 2}em ${safe}em`, display: "flex", flexDirection: "column", gap: "2.5em", position: "relative" }}>
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
          <div style={{ position: "relative", fontSize: "2.8em", lineHeight: 1.45, color: s.vars.flapInk, opacity: 0.92 }}>
            {book.authorBio}
          </div>
          
          <div style={{ flex: 1 }} />
          
          {/* Orelha Esquerda Base: Selo Redondo Dourado + Logo IPFPC */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: "auto", padding: "0 0.5em" }}>
            <div style={{ transform: "scale(0.85)", transformOrigin: "left bottom" }}>
              <SealOriginalProduct color={s.vars.accent} />
            </div>
            <div style={{ transform: "scale(0.72)", transformOrigin: "right bottom" }}>
              <LogoIPFPC color={s.vars.accent} textColor={s.vars.flapInk} />
            </div>
          </div>
        </>
      )}
      {kind === "front-flap" && (
        <>
          <div style={{ position: "relative", fontFamily: s.vars.titleFamily, fontWeight: 700, fontSize: "4.2em", lineHeight: 1.2, color: s.vars.accent, textTransform: s.vars.titleCase === "uppercase" ? "uppercase" : "none" } as any}>
            {book.flapHook}
          </div>
          <div style={{ position: "relative", fontSize: "2.8em", lineHeight: 1.5, color: s.vars.flapInk, opacity: 0.92 }}>
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
  const baseS = STYLES[styleKey] || STYLES.premium;
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

    if (styleKey === "premium") {
      s = {
        ...s,
        vars: {
          ...s.vars,
          accent: primary.toUpperCase() !== "#000000" && primary.toUpperCase() !== "#FFFFFF" ? primary : s.vars.accent,
          accent2: secondary.toUpperCase() !== "#000000" && secondary.toUpperCase() !== "#FFFFFF" ? secondary : s.vars.accent2,
          bgGrad: customBgImg ? s.vars.bgGrad : `radial-gradient(ellipse 80% 110% at 50% 60%, rgba(${toRgbStr(primary)},0.45), transparent 55%), radial-gradient(ellipse at 20% 20%, rgba(${toRgbStr(secondary)},0.18), transparent 50%), #050505`,
        }
      };
    } else if (styleKey === "editorial") {
      s = {
        ...s,
        vars: {
          ...s.vars,
          bgGrad: customBgImg ? s.vars.bgGrad : `radial-gradient(ellipse 90% 80% at 80% 20%, rgba(255,255,255,0.10), transparent 60%), linear-gradient(180deg, ${primary} 0%, ${secondary} 100%)`,
          accent: tertiary,
        }
      };
    } else if (styleKey === "vibrant") {
      s = {
        ...s,
        vars: {
          ...s.vars,
          bgGrad: customBgImg ? s.vars.bgGrad : `radial-gradient(ellipse at 50% 85%, ${primary} 0%, ${secondary} 40%, ${tertiary} 100%)`,
        }
      };
    }
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

  const wPx = totalW * pxPerMM;
  const hPx = totalH * pxPerMM;

  return (
    <div
      className={`cover-canvas relative border border-slate-700/50 bg-[#0e0e0e] shadow-2xl rounded overflow-hidden select-none ${showGuides ? "" : "cv-clean"}`}
      style={{
        width: `${wPx}px`,
        height: `${hPx}px`,
        display: "grid",
        gridTemplateColumns: cols.map(c => `${c.w * pxPerMM}px`).join(" "),
        gridTemplateRows: `${hPx}px`,
        fontSize: `${pxPerMM}px`,
        lineHeight: 1.2,
      }}
    >
      {cols.map((c, i) => {
        if (c.kind === "bleed-l" || c.kind === "bleed-r") {
          return <div key={i} className="cc-pane h-full" style={{ background: s.vars.bg }} />;
        }
        if (c.kind === "back-flap") return <FlapPane key={i} s={s} book={book} assets={assets} kind="back-flap" transition="left" />;
        if (c.kind === "front-flap") return <FlapPane key={i} s={s} book={book} assets={assets} kind="front-flap" transition="right" />;
        if (c.kind === "back") return <BackPane key={i} s={s} book={book} assets={assets} hasFlap={hasFlap} />;
        if (c.kind === "spine") return <SpinePane key={i} s={s} book={book} spineMM={spine} />;
        if (c.kind === "front") return <FrontPane key={i} s={s} book={book} />;
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
