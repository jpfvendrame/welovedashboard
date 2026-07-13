import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  LayoutGroup,
  animate,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import {
  BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import zafraLogo from "./zafra_logo_branca.png";
import manychatLogo from "./manychat_logo_branca.png";

/* ═══════════════════════════════════════════════════════════════════════════
   1. TOKENS
   ═════════════════════════════════════════════════════════════════════════ */

// Escala de espaçamento (múltiplos de 4)
const SP = { "1":4, "2":8, "3":12, "4":16, "5":20, "6":24, "7":32, "8":40 };

// Raios
const R = { xs:6, sm:8, md:10, lg:14, xl:18, pill:999 };

// Tipografia — Space Grotesk (display/números) · Instrument Sans (corpo) · DM Mono (dados)
const F = {
  h: "'Space Grotesk', 'Helvetica Neue', sans-serif",
  b: "'Instrument Sans', 'Helvetica Neue', system-ui, sans-serif",
  m: "'DM Mono', 'Fira Mono', monospace",
};

// Escala tipográfica
const T = {
  display: { fontFamily:F.h, fontSize:30, fontWeight:700, letterSpacing:"-0.028em", lineHeight:1.12 },
  h1:      { fontFamily:F.h, fontSize:20, fontWeight:700, letterSpacing:"-0.022em", lineHeight:1.25 },
  h2:      { fontFamily:F.h, fontSize:13.5, fontWeight:600, letterSpacing:"-0.012em", lineHeight:1.35 },
  metric:  { fontFamily:F.h, fontWeight:700, letterSpacing:"-0.035em", lineHeight:1, fontVariantNumeric:"tabular-nums" },
  body:    { fontFamily:F.b, fontSize:12.5, fontWeight:400, lineHeight:1.55, letterSpacing:"-0.005em" },
  small:   { fontFamily:F.b, fontSize:11.5, fontWeight:400, lineHeight:1.5, letterSpacing:"-0.003em" },
  eyebrow: { fontFamily:F.m, fontSize:9, fontWeight:500, letterSpacing:"0.13em", textTransform:"uppercase", lineHeight:1.2 },
  mono:    { fontFamily:F.m, fontSize:11, fontWeight:500, fontVariantNumeric:"tabular-nums" },
};

/* ── Tokens de movimento ──────────────────────────────────────────────────
   Curvas e molas nomeadas. Tudo que se move no painel sai daqui — do mesmo
   jeito que toda cor sai da paleta. */
const EASE = [0.22, 0.68, 0.4, 1];

const MOVE = {
  // Elementos que trocam de lugar (pílula do cliente, marcador da sidebar)
  swap:  { type:"spring", stiffness:400, damping:34, mass:0.8 },
  // Reação ao ponteiro: precisa ser quase instantânea
  hover: { duration:0.18, ease:EASE },
  // Entrada de blocos de conteúdo
  enter: { duration:0.45, ease:EASE },
  // Troca de página
  page:  { duration:0.24, ease:EASE },
};

// Container que escalona a entrada dos filhos
const stagger = {
  hidden: {},
  show:   { transition:{ staggerChildren:0.055, delayChildren:0.04 } },
};

// Bloco de conteúdo. Ao entrar, escalona os próprios filhos (linhas de lista).
const rise = {
  hidden: { opacity:0, y:10 },
  show:   { opacity:1, y:0, transition:{ ...MOVE.enter, staggerChildren:0.045, delayChildren:0.08 } },
};

// Linha de lista: entra pela esquerda, como se o conteúdo escorresse para dentro
const slide = {
  hidden: { opacity:0, x:-8 },
  show:   { opacity:1, x:0, transition:{ duration:0.36, ease:EASE } },
};

const PALETTES = {
  dark: {
    bg:      "#09090B",
    surface: "#111114",
    surfaceAlt: "#17171B",
    elev:    "#1D1D22",
    bdr:     "rgba(255,255,255,0.065)",
    bdr2:    "rgba(255,255,255,0.115)",
    t0:      "#EDECF2",
    t1:      "#9A98A6",
    t2:      "#65636F",
    ok:      "#35C98D",
    warn:    "#D9922A",
    err:     "#E0524E",
    track:   "rgba(255,255,255,0.06)",
    sh1:     "0 1px 2px rgba(0,0,0,0.4)",
    sh2:     "0 4px 16px rgba(0,0,0,0.45)",
    sh3:     "0 12px 40px rgba(0,0,0,0.55)",
  },
  light: {
    bg:      "#F5F5F7",
    surface: "#FFFFFF",
    surfaceAlt: "#FAFAFC",
    elev:    "#FFFFFF",
    bdr:     "rgba(17,17,26,0.075)",
    bdr2:    "rgba(17,17,26,0.14)",
    t0:      "#131319",
    t1:      "#57555F",
    t2:      "#8B8994",
    ok:      "#12996A",
    warn:    "#AF6C1C",
    err:     "#C0403C",
    track:   "rgba(17,17,26,0.06)",
    sh1:     "0 1px 2px rgba(17,17,26,0.05)",
    sh2:     "0 4px 16px rgba(17,17,26,0.07)",
    sh3:     "0 12px 40px rgba(17,17,26,0.10)",
  },
};

const ThemeCtx = createContext("dark");
const useTheme = () => useContext(ThemeCtx);
const useD = () => PALETTES[useTheme()];

// hex -> rgba
const gl = (hex, op) => {
  const h = String(hex).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${op})`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. CONFIGURAÇÃO — ecossistemas, campanhas e integração (INALTERADO)
   ═════════════════════════════════════════════════════════════════════════ */

const THEMES = {
  laise: { name:"Laise Mesquita", avatar:"L", c0:"#E8527A", c1:"#C43D63", c2:"#9E2E4E", c3:"#72203A" },
  chile: { name:"We Love Chile",  avatar:"C", c0:"#CC1A1A", c1:"#A51515", c2:"#7D1010", c3:"#550B0B" },
  peru:  { name:"We Love Peru",   avatar:"P", c0:"#1A7A3A", c1:"#156130", c2:"#0F4A24", c3:"#093318" },
};

const CAMPANHAS = {
  laise: {
    "Acesso Comercial":   { icon:"ti-briefcase", cols:["Comercial (Iniciou)","Comercial (clicou em quero saber mais)","Comercial (Clicou Wpp)"], etapas:["Iniciou","Quero saber mais","Clicou no Wpp"], kpi_sub_col:"Comercial (Clicou Wpp)", kpi_sub_label:"→ Wpp" },
    "Campanha Comunidade":{ icon:"ti-users", cols:["Campanha Comunidade (Iniciou)","Campanha Comunidade (clicou em quero saber mais)","Campanha Comunidade (Clicou Wpp)"], etapas:["Iniciou","Quero saber mais","Clicou no Wpp"], kpi_sub_col:"Campanha Comunidade (Clicou Wpp)", kpi_sub_label:"→ Wpp" },
    "We Love Rental":     { icon:"ti-hanger", cols:["We Love Rental - Comunidade (Iniciou)","We Love Rental - Comunidade (Acessou site)"], etapas:["Iniciou","Acessou o site"], kpi_sub_col:"We Love Rental - Comunidade (Acessou site)", kpi_sub_label:"→ Site" },
    "Caderno Secreto":    { icon:"ti-book", cols:["Caderno Secreto (Iniciou)","Caderno Secreto (clicou em saber mais)","Caderno Secreto (Mandou wpp)","Caderno Secreto (Acessou)","Caderno Secreto (Clicou Wpp)"], etapas:["Iniciou","Saber mais","Mandou Wpp","Acessou","Clicou Wpp"], kpi_sub_col:"Caderno Secreto (Clicou Wpp)", kpi_sub_label:"→ Wpp" },
  },
  chile: {
    "Envio de PDF":          { icon:"ti-file-type-pdf", cols:["Envio de PDF - Iniciou","Envio de PDF - Interessou","Envio de PDF -  Mandou Wpp","Envio de PDF -  Acessou PDF"], etapas:["Iniciou","Interessou","Mandou Wpp","Acessou PDF"], kpi_sub_col:"Envio de PDF -  Acessou PDF", kpi_sub_label:"→ PDF" },
    "Envio de Link":         { icon:"ti-link", cols:["Envio de Link - Iniciou","Envio de Link - Interessou","Envio de Link - Mandou Wpp","Envio de Link - Acessou link"], etapas:["Iniciou","Interessou","Mandou Wpp","Acessou Link"], kpi_sub_col:"Envio de Link - Acessou link", kpi_sub_label:"→ Link" },
    "Envio WhatsApp":        { icon:"ti-brand-whatsapp", cols:["Envio WhatsApp - Iniciou","Envio WhatsApp - Interessou","Envio WhatsApp - Clicou wpp"], etapas:["Iniciou","Interessou","Clicou Wpp"], kpi_sub_col:"Envio WhatsApp - Clicou wpp", kpi_sub_label:"→ Wpp" },
    "Envio Mensagem Direct": { icon:"ti-message-circle", cols:["Envio Mensagem Direct - Iniciou","Envio Mensagem Direct - Interessou","Envio Mensagem Direct - Mandou Wpp"], etapas:["Iniciou","Interessou","Mandou Wpp"], kpi_sub_col:"Envio Mensagem Direct - Mandou Wpp", kpi_sub_label:"→ Wpp" },
  },
  peru: {
    "Acesso ao Link": { icon:"ti-link", cols:["Acesso ao Link - Iniciou","Acesso ao Link - Interessou","Acesso ao Link - Mandou Wpp","Acesso ao Link - Acessou Link"], etapas:["Iniciou","Interessou","Mandou Wpp","Acessou Link"], kpi_sub_col:"Acesso ao Link - Acessou Link", kpi_sub_label:"→ Link" },
  },
};

const SHEET_ID = "1QZ6TJhikHTwhJDsbxQpA88GPj-QUFclHfUVFQVsPtsU";
const URLS = {
  laise: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`,
  chile: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=407668234`,
  peru:  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1780246388`,
};

const TABS = [
  { label:"Laise Mesquita", short:"Laise", ecoKey:"laise" },
  { label:"We Love Chile",  short:"Chile", ecoKey:"chile" },
  { label:"We Love Peru",   short:"Peru",  ecoKey:"peru"  },
];

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

// Altura da topbar — usada também pela sidebar sticky, pela área rolável e pelo fundo
const TOPBAR_H = 68;

/* ═══════════════════════════════════════════════════════════════════════════
   3. DADOS — parsing, métricas e diagnóstico (lógica preservada)
   ═════════════════════════════════════════════════════════════════════════ */

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const fmtNum = (n) => (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR");

// Percentual seguro: nunca NaN, Infinity ou negativo
function pct(total, part) {
  if (!total || !Number.isFinite(total) || total <= 0) return null;
  const v = (Math.max(part ?? 0, 0) / total) * 100;
  return Number.isFinite(v) ? clamp(Math.round(v * 10) / 10, 0, 100) : null;
}
const safePct = (total, part) => pct(total, part) ?? 0;
const fmtPct  = (total, part) => { const v = pct(total, part); return v !== null ? `${v.toFixed(1)}%` : "—"; };
const fmtRate = (v) => (Number.isFinite(v) ? `${clamp(v, 0, 100).toFixed(1)}%` : "—");

function parseBool(raw) {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "TRUE" || s === "1") return true;
  if (s === "FALSE" || s === "0" || s === "" || s === "NAN") return false;
  return null;
}

function parseCSV(text) {
  const lines = text.trim().replace(/\r\n|\r/g, "\n").split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = []; let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    vals.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => {
      const raw = (vals[i] ?? "").replace(/^"|"$/g, "").trim();
      const b = parseBool(raw);
      obj[h] = b !== null ? b : raw;
    });
    return obj;
  });
  const boolCols = headers.filter(h => h && rows.length > 0 && rows.every(r => r[h] === true || r[h] === false));
  return { rows, boolCols };
}

function buildMetrics(rows, boolCols) {
  const M = {};
  boolCols.forEach(col => { M[col] = rows.filter(r => r[col] === true).length; });
  return M;
}

function useData(url) {
  const [st, setSt] = useState({ rows:null, boolCols:null, error:null, loading:true, lastSync:null });
  const load = useCallback(async () => {
    setSt(s => ({ ...s, loading:true, error:null }));
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { rows, boolCols } = parseCSV(await res.text());
      setSt({ rows, boolCols, error:null, loading:false, lastSync:new Date() });
    } catch (e) {
      setSt(s => ({ ...s, error:e.message, loading:false }));
    }
  }, [url]);
  useEffect(() => {
    load();
    const id = setInterval(load, SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);
  return { ...st, reload: load };
}

// Maior queda entre duas etapas consecutivas de um funil
function getBiggestDrop(info, metrics) {
  const values = info.cols.map((col) => metrics[col] ?? 0);

  let biggestDrop = null;

  for (let index = 1; index < values.length; index++) {
    const previous = values[index - 1];
    const current = values[index];

    if (!previous) continue;

    const lost = Math.max(previous - current, 0);
    const lossRate = (lost / previous) * 100;

    if (!biggestDrop || lossRate > biggestDrop.lossRate) {
      biggestDrop = {
        from: info.etapas[index - 1],
        to: info.etapas[index],
        previous,
        current,
        lost,
        lossRate,
      };
    }
  }

  return biggestDrop;
}

// Etapas do funil com % do topo, % da etapa anterior e perda absoluta
function getStages(info, metrics) {
  const values = info.cols.map((col) => metrics[col] ?? 0);
  const top = values[0] ?? 0;
  return info.etapas.map((name, i) => {
    const value = values[i] ?? 0;
    const previous = i > 0 ? (values[i - 1] ?? 0) : null;
    return {
      name,
      value,
      previous,
      lost: previous !== null ? Math.max(previous - value, 0) : 0,
      pctTop: pct(top, value),
      pctPrev: previous !== null ? pct(previous, value) : null,
    };
  });
}

// Classificação não-alarmista da maior queda
function classifyDrop(lossRate, D) {
  if (!Number.isFinite(lossRate)) return { label:"Sem volume", color:D.t2 };
  if (lossRate <= 30) return { label:"Desempenho consistente", color:D.ok };
  if (lossRate <= 60) return { label:"Atenção recomendada", color:D.warn };
  return { label:"Gargalo relevante", color:D.err };
}

// Cor semântica para taxas de conversão
const rateColor = (rate, D, accent) =>
  rate >= 70 ? D.ok : rate >= 40 ? accent : rate >= 20 ? D.warn : D.err;

/* ═══════════════════════════════════════════════════════════════════════════
   4. HOOKS DE UI
   ═════════════════════════════════════════════════════════════════════════ */

function useIsMobile() {
  const [mob, setMob] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
}

// Leitura pontual, fora do ciclo de render — só para decidir se a abertura toca.
// Dentro dos componentes usamos useReducedMotion(), que é reativo.
const reducedMotionNow = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ═══════════════════════════════════════════════════════════════════════════
   5. PRIMITIVOS DE UI
   ═════════════════════════════════════════════════════════════════════════ */

/* Contagem animada. O número vive em um motion value: a interpolação acontece
   fora do React, então a tela não re-renderiza a 60fps para contar até 4.812. */
function AnimatedNumber({ value, format = (n) => fmtNum(Math.round(n)), duration = 900, delay = 0 }) {
  const safe = Number.isFinite(value) ? value : 0;
  const reduce = useReducedMotion();
  const count = useMotionValue(reduce ? safe : 0);
  const text = useTransform(count, format);

  useEffect(() => {
    if (reduce) { count.set(safe); return; }
    const controls = animate(count, safe, {
      duration: duration / 1000,
      delay: delay / 1000,
      ease: EASE,
    });
    return () => controls.stop();
  }, [safe, duration, delay, reduce, count]);

  return <motion.span>{text}</motion.span>;
}

function Meter({ value, color, track, height = 5, delay = 0 }) {
  const D = useD();
  const reduce = useReducedMotion();
  const target = clamp(Number.isFinite(value) ? value : 0, 0, 100);
  return (
    <div style={{ height, background: track ?? D.track, borderRadius: R.pill, overflow:"hidden" }}>
      <motion.div
        initial={{ width: reduce ? `${target}%` : 0 }}
        animate={{ width: `${target}%` }}
        transition={{ duration: reduce ? 0 : 0.85, delay: reduce ? 0 : delay / 1000, ease: EASE }}
        style={{
          height:"100%", borderRadius:R.pill,
          background:`linear-gradient(90deg, ${gl(color, 0.55)}, ${color})`,
        }}
      />
    </div>
  );
}

function Divider({ style }) {
  const D = useD();
  return <div aria-hidden="true" style={{ height:1, background:D.bdr, ...style }}/>;
}

function Eyebrow({ children, color, style }) {
  const D = useD();
  return <div style={{ ...T.eyebrow, color: color ?? D.t2, ...style }}>{children}</div>;
}

function Badge({ children, color, solid = false }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      fontSize:9.5, fontWeight:600, fontFamily:F.m, letterSpacing:"0.06em",
      textTransform:"uppercase", padding:"3px 9px", borderRadius:R.pill,
      background: solid ? color : gl(color, 0.12),
      color: solid ? "#fff" : color,
      border:`1px solid ${gl(color, solid ? 0.9 : 0.26)}`,
      whiteSpace:"nowrap",
    }}>{children}</span>
  );
}

function Chip({ icon, color, children, live = false }) {
  const D = useD();
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      background:D.surface, border:`1px solid ${D.bdr}`, borderRadius:R.pill,
      padding:"5px 11px", fontSize:10.5, color:D.t1, fontFamily:F.m,
      whiteSpace:"nowrap", boxShadow:D.sh1,
    }}>
      {live
        ? <span className="zf-live" style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }}/>
        : <i className={`ti ${icon}`} style={{ fontSize:12, color }}/>}
      {children}
    </span>
  );
}

function IconBox({ icon, color, size = 34 }) {
  return (
    <span aria-hidden="true" style={{
      width:size, height:size, borderRadius:size * 0.32, flexShrink:0,
      background:`linear-gradient(150deg, ${gl(color, 0.16)}, ${gl(color, 0.05)})`,
      border:`1px solid ${gl(color, 0.2)}`,
      boxShadow:`inset 0 1px 0 ${gl(color, 0.14)}`,
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      color, fontSize:size * 0.44,
    }}>
      <i className={`ti ${icon}`}/>
    </span>
  );
}

/* Cartão. O hover deixou de ser CSS: agora é whileHover, e a borda longa
   (borderColor) é animável — por isso o border vem em longhand. */
function Surface({ color, children, style, hoverable = true, className = "", ...rest }) {
  const D = useD();
  const hover = hoverable
    ? {
        y: -1,
        borderColor: color ? gl(color, 0.26) : D.bdr2,
        boxShadow: `0 8px 24px ${color ? gl(color, 0.14) : "rgba(0,0,0,0.22)"}`,
      }
    : undefined;

  return (
    <motion.div
      className={className}
      whileHover={hover}
      transition={MOVE.hover}
      style={{
        background:D.surface,
        borderWidth:1,
        borderStyle:"solid",
        borderColor:D.bdr,
        borderRadius:R.lg,
        boxShadow:D.sh1,
        overflow:"hidden",
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ title, sub, right, accent }) {
  const D = useD();
  return (
    <header style={{
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:SP[3],
      padding:`${SP[4]}px ${SP[5]}px`, borderBottom:`1px solid ${D.bdr}`,
    }}>
      <div style={{ display:"flex", gap:SP[3], alignItems:"center", minWidth:0 }}>
        {accent && (
          <span aria-hidden="true" style={{
            width:3, height:26, borderRadius:R.pill, flexShrink:0,
            background:`linear-gradient(180deg, ${accent}, ${gl(accent, 0.15)})`,
          }}/>
        )}
        <div style={{ minWidth:0 }}>
          <h2 style={{ ...T.h2, color:D.t0, margin:0 }}>{title}</h2>
          {sub && <p style={{ ...T.small, fontSize:11, color:D.t2, margin:"3px 0 0" }}>{sub}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. GRÁFICOS
   ═════════════════════════════════════════════════════════════════════════ */

// Funil: barras horizontais por etapa. Sem eixo temporal — só redução de volume.
function FunnelBars({ campKey, info, M, color, height = 150, compact = false }) {
  const D = useD();
  const mob = useIsMobile();
  const reduce = useReducedMotion();
  const stages = useMemo(() => getStages(info, M), [info, M]);
  const id = `fnl-${campKey.replace(/\W/g, "")}`;
  const top = stages[0]?.value ?? 0;
  const hasData = top > 0;

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const s = payload[0].payload;
    return (
      <div style={{
        background:D.elev, border:`1px solid ${D.bdr2}`, borderRadius:R.md,
        padding:"10px 13px", boxShadow:D.sh3, fontFamily:F.b, minWidth:130,
      }}>
        <div style={{ fontSize:10, color:D.t1, marginBottom:4 }}>{s.name}</div>
        <div style={{ ...T.metric, fontSize:17, color:D.t0 }}>{fmtNum(s.value)}</div>
        <div style={{ ...T.mono, fontSize:9.5, color:gl(color, 0.9), marginTop:5 }}>
          {s.pctTop !== null ? `${s.pctTop.toFixed(1)}% do volume de entrada` : "—"}
        </div>
        {s.pctPrev !== null && (
          <div style={{ ...T.mono, fontSize:9.5, color:D.t2, marginTop:2 }}>
            {s.pctPrev.toFixed(1)}% da etapa anterior
          </div>
        )}
      </div>
    );
  };

  if (!hasData) {
    return (
      <div style={{
        height, display:"flex", alignItems:"center", justifyContent:"center",
        ...T.small, color:D.t2, border:`1px dashed ${D.bdr}`, borderRadius:R.md,
      }}>
        Sem volume de entrada registrado
      </div>
    );
  }

  return (
    <div style={{ width:"100%", height }}>
      <ResponsiveContainer>
        <BarChart data={stages} layout="vertical" barCategoryGap={compact ? 6 : 9}
          margin={{ top:2, right:mob ? 12 : 18, bottom:0, left:0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.35}/>
              <stop offset="100%" stopColor={color} stopOpacity={0.95}/>
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} stroke={D.bdr}/>
          <XAxis type="number" hide domain={[0, top]}/>
          <YAxis type="category" dataKey="name" width={compact ? 74 : (mob ? 78 : 96)}
            tick={{ fontSize:9.5, fill:D.t1, fontFamily:F.m }}
            axisLine={false} tickLine={false}/>
          <Tooltip content={<Tip/>} cursor={{ fill: gl(color, 0.06) }}/>
          <RBar dataKey="value" radius={[0, 5, 5, 0]} fill={`url(#${id})`}
            isAnimationActive={!reduce} animationDuration={800} animationEasing="ease-out"/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Rosca: participação de cada campanha no volume acumulado
function DonutChart({ labels, values, colors, totalLabel = "entradas" }) {
  const D = useD();
  const mob = useIsMobile();
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(null);
  const total = values.reduce((a, b) => a + b, 0);
  const data = labels.map((l, i) => ({ name:l, value:values[i] }));

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
      <div style={{
        background:D.elev, border:`1px solid ${D.bdr2}`, borderRadius:R.md,
        padding:"10px 13px", boxShadow:D.sh3, fontFamily:F.b,
      }}>
        <div style={{ fontSize:10, color:D.t1, marginBottom:3 }}>{p.name}</div>
        <div style={{ ...T.metric, fontSize:16, color:D.t0 }}>{fmtNum(p.value)}</div>
        <div style={{ ...T.mono, fontSize:9.5, color:D.t2, marginTop:3 }}>
          {fmtPct(total, p.value)} da base
        </div>
      </div>
    );
  };

  if (total === 0) {
    return <EmptyBlock icon="ti-chart-donut" text="Nenhuma entrada registrada nas campanhas."/>;
  }

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:mob ? SP[5] : SP[6],
      flexDirection: mob ? "column" : "row",
    }}>
      <div style={{ position:"relative", width:148, height:148, flexShrink:0 }}>
        <ResponsiveContainer width={148} height={148}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%"
              innerRadius="66%" outerRadius="88%" paddingAngle={2.5} strokeWidth={0} cornerRadius={4}
              isAnimationActive={!reduce} animationDuration={850}
              onMouseEnter={(_, i) => setIdx(i)} onMouseLeave={() => setIdx(null)}>
              {data.map((_, i) => (
                <Cell key={labels[i]} fill={colors[i % colors.length]}
                  opacity={idx === null || idx === i ? 1 : 0.24}
                  style={{ transition:"opacity .18s", cursor:"pointer" }}/>
              ))}
            </Pie>
            <Tooltip content={<Tip/>}/>
          </PieChart>
        </ResponsiveContainer>

        {/* Centro da rosca: troca de conteúdo quando uma fatia é apontada */}
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", pointerEvents:"none",
        }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={idx ?? "total"}
              initial={{ opacity:0, y:4 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-4 }}
              transition={{ duration:0.16, ease:EASE }}
              style={{ display:"flex", flexDirection:"column", alignItems:"center" }}
            >
              <div style={{ ...T.metric, fontSize:21, color:D.t0 }}>
                {idx !== null ? fmtNum(values[idx]) : <AnimatedNumber value={total}/>}
              </div>
              <div style={{ ...T.eyebrow, fontSize:7.5, color:D.t2, marginTop:5, maxWidth:100, textAlign:"center" }}>
                {idx !== null ? labels[idx] : totalLabel}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ul style={{ flex:1, width:"100%", listStyle:"none", margin:0, padding:0,
        display:"flex", flexDirection:"column", gap:SP[2] }}>
        {labels.map((l, i) => (
          <motion.li key={l}
            onMouseEnter={() => setIdx(i)} onMouseLeave={() => setIdx(null)}
            animate={{ opacity: idx === null || idx === i ? 1 : 0.4 }}
            transition={{ duration:0.15 }}
            style={{ display:"flex", alignItems:"center", gap:SP[2] }}>
            <span aria-hidden="true" style={{
              width:7, height:7, borderRadius:2.5, flexShrink:0,
              background:colors[i % colors.length],
              boxShadow:`0 0 5px ${gl(colors[i % colors.length], 0.3)}`,
            }}/>
            <span style={{ flex:1, ...T.small, color:D.t1, overflow:"hidden",
              textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l}</span>
            <span style={{ ...T.mono, fontWeight:600, color:D.t0 }}>{fmtNum(values[i])}</span>
            <span style={{ ...T.mono, fontSize:10, color:D.t2, width:44, textAlign:"right" }}>
              {fmtPct(total, values[i])}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. ESTADOS — vazio, erro, carregando
   ═════════════════════════════════════════════════════════════════════════ */

function EmptyBlock({ icon = "ti-database-off", text, action }) {
  const D = useD();
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      gap:SP[3], padding:`${SP[7]}px ${SP[5]}px`, textAlign:"center",
      border:`1px dashed ${D.bdr2}`, borderRadius:R.md, color:D.t2,
    }}>
      <i className={`ti ${icon}`} style={{ fontSize:22, color:D.t2 }} aria-hidden="true"/>
      <p style={{ ...T.small, color:D.t1, margin:0, maxWidth:320 }}>{text}</p>
      {action}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  const D = useD();
  return (
    <div role="alert" style={{
      display:"flex", gap:SP[3], alignItems:"flex-start",
      padding:`${SP[4]}px ${SP[5]}px`, marginBottom:SP[5],
      background:gl(D.err, 0.07), border:`1px solid ${gl(D.err, 0.2)}`,
      borderRadius:R.lg, color:D.err,
    }}>
      <i className="ti ti-alert-triangle" style={{ fontSize:17, marginTop:1, flexShrink:0 }} aria-hidden="true"/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ ...T.body, fontWeight:600, margin:0 }}>Os dados do Google Sheets não foram carregados.</p>
        <p style={{ ...T.small, color:D.t1, margin:"3px 0 0" }}>
          Verifique se a planilha continua pública e tente sincronizar novamente.
        </p>
        <p style={{ ...T.mono, fontSize:9.5, opacity:0.7, margin:"6px 0 0" }}>{message}</p>
      </div>
      <motion.button onClick={onRetry} className="zf-focus"
        whileHover={{ background: gl(D.err, 0.18) }}
        whileTap={{ scale:0.97 }}
        transition={MOVE.hover}
        style={{
          flexShrink:0, ...T.mono, fontSize:10, fontWeight:600, color:D.err,
          background:gl(D.err, 0.1), border:`1px solid ${gl(D.err, 0.28)}`,
          borderRadius:R.md, padding:"8px 14px", cursor:"pointer", minHeight:36,
        }}>
        Sincronizar
      </motion.button>
    </div>
  );
}

function Sk({ h = 14, w = "100%", r = R.sm, style }) {
  return <div className="zf-shimmer" style={{ height:h, width:w, borderRadius:r, ...style }}/>;
}

function LoadingSkeleton({ mob }) {
  const D = useD();
  const card = { background:D.surface, border:`1px solid ${D.bdr}`, borderRadius:R.lg, padding:SP[5] };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:SP[6] }} aria-busy="true" aria-live="polite">
      <div>
        <Sk h={26} w={260}/>
        <Sk h={12} w={340} style={{ marginTop:SP[3] }}/>
        <div style={{ display:"flex", gap:SP[2], marginTop:SP[4] }}>
          {[0, 1, 2].map(i => <Sk key={i} h={26} w={110} r={R.pill}/>)}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap:SP[3] }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={card}>
            <Sk h={9} w="55%"/>
            <Sk h={28} w="70%" style={{ marginTop:SP[4] }}/>
            <Sk h={5} w="100%" r={R.pill} style={{ marginTop:SP[4] }}/>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns: mob ? "1fr" : "1.6fr 1fr", gap:SP[4] }}>
        <div style={card}>{[0, 1, 2].map(i => <Sk key={i} h={48} style={{ marginBottom: i < 2 ? SP[3] : 0 }}/>)}</div>
        <div style={{ ...card, display:"flex", alignItems:"center", gap:SP[5] }}>
          <Sk h={130} w={130} r="50%"/>
          <div style={{ flex:1 }}>{[0, 1, 2].map(i => <Sk key={i} h={11} style={{ marginBottom: i < 2 ? SP[3] : 0 }}/>)}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. MÉTRICAS
   ═════════════════════════════════════════════════════════════════════════ */

function MetricCard({ label, icon, color, value, children }) {
  const D = useD();
  return (
    <Surface color={color} variants={rise} style={{ padding:`${SP[5]}px ${SP[5]}px ${SP[4]}px`, position:"relative" }}>
      <span aria-hidden="true" style={{
        position:"absolute", top:0, left:0, right:0, height:1,
        background:`linear-gradient(90deg, ${gl(color, 0.55)}, transparent 70%)`,
      }}/>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:SP[3] }}>
        <Eyebrow style={{ paddingTop:2 }}>{label}</Eyebrow>
        <i className={`ti ${icon}`} aria-hidden="true"
          style={{ fontSize:15, color:gl(color, 0.75), flexShrink:0 }}/>
      </div>
      <div style={{ ...T.metric, fontSize:32, color:D.t0, marginTop:SP[4] }}>{value}</div>
      <div style={{ marginTop:SP[4] }}>{children}</div>
    </Surface>
  );
}

function MetricFoot({ children }) {
  const D = useD();
  return <p style={{ ...T.small, fontSize:11, color:D.t1, margin:0,
    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{children}</p>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. LISTA DE CAMPANHAS
   ═════════════════════════════════════════════════════════════════════════ */

/* O hover não guarda estado: whileHover="hover" propaga o rótulo da variante
   para os filhos, então o número, a seta e a borda reagem juntos — sem um
   único re-render. */
function CampaignRow({ rank, name, info, leads, conv, convRate, color, onClick, isLast }) {
  const D = useD();
  const mob = useIsMobile();
  const clr = rateColor(convRate, D, color);
  const action = info.kpi_sub_label.replace("→", "").trim();

  const row = {
    ...slide,
    hover: {
      backgroundColor: D.surfaceAlt,
      borderLeftColor: color,
      transition: MOVE.hover,
    },
  };
  const rankVar   = { show:{ color:D.t2 },  hover:{ color:gl(color, 0.9) } };
  const chevron   = { show:{ x:0, color:D.t2 }, hover:{ x:3, color:gl(color, 0.9) } };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={row}
      whileHover="hover"
      whileTap={{ scale:0.995 }}
      className="zf-focus"
      aria-label={`Abrir desempenho do funil da campanha ${name}`}
      style={{
        display:"flex", alignItems:"center", gap: mob ? SP[3] : SP[4],
        padding: mob ? `${SP[3]}px ${SP[4]}px` : `${SP[4]}px ${SP[5]}px`,
        width:"100%", minHeight:64, cursor:"pointer", textAlign:"left",
        backgroundColor:"transparent",
        border:"none",
        borderBottom: isLast ? "none" : `1px solid ${D.bdr}`,
        borderLeft:"2px solid transparent",
        fontFamily:F.b,
      }}>
      {!mob && (
        <motion.span variants={rankVar} transition={MOVE.hover}
          style={{ ...T.mono, fontSize:10, width:16, textAlign:"center", flexShrink:0, color:D.t2 }}>
          {String(rank).padStart(2, "0")}
        </motion.span>
      )}
      <IconBox icon={info.icon} color={color} size={mob ? 30 : 34}/>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ ...T.body, fontSize:12.5, fontWeight:600, color:D.t0,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3, ...T.small, fontSize:10.5, color:D.t2 }}>
          <span style={{ ...T.mono, fontSize:9.5, color:gl(color, 0.9) }}>{action}</span>
          <span aria-hidden="true">·</span>
          <span>{fmtNum(conv)} conversões finais</span>
        </div>
      </div>

      <div style={{ textAlign:"right", flexShrink:0, minWidth:56 }}>
        <div style={{ ...T.metric, fontSize:15, color:D.t0 }}>{fmtNum(leads)}</div>
        <div style={{ ...T.eyebrow, fontSize:8, color:D.t2, marginTop:3 }}>entradas</div>
      </div>

      {!mob && (
        <div style={{ width:78, flexShrink:0 }}>
          <Meter value={convRate} color={clr} delay={rank * 110} height={4}/>
        </div>
      )}

      <div style={{ textAlign:"right", width:52, flexShrink:0 }}>
        <div style={{ ...T.mono, fontSize:13, fontWeight:600, color:clr }}>{fmtRate(convRate)}</div>
        <div style={{ ...T.eyebrow, fontSize:8, color:D.t2, marginTop:3 }}>conv.</div>
      </div>

      <motion.i className="ti ti-chevron-right" aria-hidden="true"
        variants={chevron} transition={MOVE.hover}
        style={{ fontSize:15, flexShrink:0, color:D.t2 }}/>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   10. PONTOS DE ATENÇÃO
   ═════════════════════════════════════════════════════════════════════════ */

function AttentionRow({ name, info, drop, color, onClick, isLast }) {
  const D = useD();
  const mob = useIsMobile();
  const cls = classifyDrop(drop?.lossRate, D);

  const row = {
    ...slide,
    hover: { backgroundColor: D.surfaceAlt, transition: MOVE.hover },
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={row}
      whileHover="hover"
      whileTap={{ scale:0.995 }}
      className="zf-focus"
      aria-label={`Abrir campanha ${name}`}
      style={{
        display:"flex", alignItems:"center", gap: mob ? SP[3] : SP[4], width:"100%",
        padding: mob ? `${SP[3]}px ${SP[4]}px` : `${SP[4]}px ${SP[5]}px`,
        minHeight:60, textAlign:"left", cursor:"pointer",
        backgroundColor:"transparent",
        border:"none", borderBottom: isLast ? "none" : `1px solid ${D.bdr}`,
        fontFamily:F.b,
      }}>
      <IconBox icon={info.icon} color={color} size={mob ? 28 : 30}/>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ ...T.body, fontSize:12, fontWeight:600, color:D.t0,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
        {drop ? (
          <div style={{ ...T.small, fontSize:10.5, color:D.t2, marginTop:3,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {drop.from} <span style={{ color:cls.color }}>→</span> {drop.to} ·{" "}
            <span style={{ ...T.mono, fontSize:10, color:D.t1 }}>
              {fmtNum(drop.lost)} contatos não avançaram
            </span>
          </div>
        ) : (
          <div style={{ ...T.small, fontSize:10.5, color:D.t2, marginTop:3 }}>
            Sem volume de entrada para avaliar
          </div>
        )}
      </div>

      {!mob && <Badge color={cls.color}>{cls.label}</Badge>}

      <div style={{ textAlign:"right", width:56, flexShrink:0 }}>
        <div style={{ ...T.metric, fontSize:15, color:cls.color }}>
          {drop ? fmtRate(drop.lossRate) : "—"}
        </div>
        <div style={{ ...T.eyebrow, fontSize:8, color:D.t2, marginTop:3 }}>queda</div>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   11. VISÃO GERAL
   ═════════════════════════════════════════════════════════════════════════ */

function Overview({ ecoKey, M, theme, onSelect, timeStr }) {
  const D = useD();
  const mob = useIsMobile();
  const colors = useMemo(() => [theme.c0, theme.c1, theme.c2, theme.c3], [theme]);

  const camps = useMemo(() => {
    return Object.entries(CAMPANHAS[ecoKey]).map(([key, info], i) => {
      const leads = M[info.cols[0]] ?? 0;
      const conv = M[info.kpi_sub_col] ?? 0;
      return {
        key, info, leads, conv,
        rate: safePct(leads, conv),
        drop: getBiggestDrop(info, M),
        color: colors[i % colors.length],
      };
    });
  }, [ecoKey, M, colors]);

  const total = camps.reduce((a, c) => a + c.leads, 0);
  const totalConv = camps.reduce((a, c) => a + c.conv, 0);
  const globalRate = safePct(total, totalConv);
  const best = camps.reduce((b, c) => (c.rate > (b?.rate ?? -1) ? c : b), null);
  const hasData = total > 0;

  const ranked = useMemo(() => [...camps].sort((a, b) => b.leads - a.leads), [camps]);
  const attention = useMemo(
    () => [...camps].sort((a, b) => (b.drop?.lossRate ?? -1) - (a.drop?.lossRate ?? -1)),
    [camps]
  );

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      style={{ display:"flex", flexDirection:"column", gap: mob ? SP[5] : SP[6] }}>

      {/* Cabeçalho */}
      <motion.header variants={rise} style={{ textAlign:"left", width:"100%" }}>
        <div style={{ display:"flex", alignItems:"center", gap:SP[2], marginBottom:SP[3] }}>
          <span className="zf-live" aria-hidden="true"
            style={{ width:6, height:6, borderRadius:"50%", background:theme.c0, flexShrink:0 }}/>
          <Eyebrow color={gl(theme.c0, 0.9)}>{theme.name}</Eyebrow>
        </div>
        <h1 style={{
          ...T.display, fontSize: mob ? 26 : 32, margin:0, width:"fit-content",
          background:`linear-gradient(100deg, ${D.t0} 55%, ${theme.c0} 100%)`,
          WebkitBackgroundClip:"text", backgroundClip:"text",
          WebkitTextFillColor:"transparent", color:"transparent",
        }}>
          Olá, We Worker!
        </h1>
        <p style={{ ...T.body, color:D.t1, margin:`${SP[2]}px 0 0`, maxWidth:560 }}>
          Acompanhe o desempenho acumulado das campanhas e identifique gargalos nos funis.
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:SP[2], marginTop:SP[4] }}>
          <Chip icon="ti-bolt" color={theme.c0}>
            {camps.length} campanha{camps.length > 1 ? "s" : ""} monitorada{camps.length > 1 ? "s" : ""}
          </Chip>
          <Chip icon="ti-database" color={theme.c1}>Dados acumulados</Chip>
          {timeStr && <Chip color={D.ok} live>Última sincronização · {timeStr}</Chip>}
          <Chip icon="ti-plug-connected" color={D.t1}>ManyChat · Google Sheets</Chip>
        </div>
      </motion.header>

      {!hasData && (
        <Surface hoverable={false} variants={rise} style={{ padding:SP[6] }}>
          <EmptyBlock
            icon="ti-inbox"
            text="Nenhuma entrada acumulada foi encontrada nesta planilha. Assim que os contatos entrarem nos fluxos do ManyChat, os funis aparecem aqui."
          />
        </Surface>
      )}

      {hasData && (
        <>
          {/* Métricas */}
          <motion.section variants={stagger} aria-label="Indicadores acumulados" style={{
            display:"grid",
            gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, minmax(0,1fr))", gap:SP[3],
          }}>
            <MetricCard label="Volume de entrada" icon="ti-users" color={theme.c0}
              value={<AnimatedNumber value={total}/>}>
              <MetricFoot>Contatos acumulados nos funis</MetricFoot>
            </MetricCard>

            <MetricCard label="Conversões finais" icon="ti-target-arrow" color={D.ok}
              value={<AnimatedNumber value={totalConv} delay={90}/>}>
              <div style={{ display:"flex", alignItems:"center", gap:SP[2] }}>
                <div style={{ flex:1 }}>
                  <Meter value={globalRate} color={D.ok} delay={140} height={4}/>
                </div>
                <span style={{ ...T.mono, fontSize:10, color:D.t1 }}>{fmtRate(globalRate)}</span>
              </div>
            </MetricCard>

            <MetricCard label="Melhor campanha" icon="ti-award" color={theme.c1}
              value={<AnimatedNumber value={best?.rate ?? 0} delay={180} format={(n) => `${n.toFixed(1)}%`}/>}>
              {best ? (
                <div style={{ display:"flex", alignItems:"center", gap:SP[2], minWidth:0 }}>
                  <IconBox icon={best.info.icon} color={best.color} size={20}/>
                  <MetricFoot>{best.key}</MetricFoot>
                </div>
              ) : <MetricFoot>—</MetricFoot>}
            </MetricCard>

            <MetricCard label="Campanhas ativas" icon="ti-stack-2" color={theme.c2}
              value={<AnimatedNumber value={camps.length} delay={260} duration={600}/>}>
              <div style={{ display:"flex", gap:5, alignItems:"center" }} aria-hidden="true">
                {camps.map((c, i) => (
                  <motion.span key={c.key}
                    initial={{ scaleX:0 }} animate={{ scaleX:1 }}
                    transition={{ duration:0.5, delay:0.3 + i * 0.07, ease:EASE }}
                    style={{
                      height:4, flex:1, borderRadius:R.pill, originX:0,
                      background:gl(c.color, 0.85),
                    }}/>
                ))}
              </div>
            </MetricCard>
          </motion.section>

          {/* Campanhas + Distribuição */}
          <motion.section variants={stagger} style={{
            display:"grid",
            gridTemplateColumns: mob ? "1fr" : "1.65fr 1fr", gap:SP[4], alignItems:"start",
          }}>
            <Surface color={theme.c0} variants={rise}>
              <SectionHeader title="Campanhas" accent={theme.c0}
                sub="Ordenadas por volume de entrada · clique para abrir o funil"
                right={<Badge color={theme.c0}>ManyChat</Badge>}/>
              {ranked.map((c, i) => (
                <CampaignRow key={c.key} rank={i + 1} name={c.key} info={c.info}
                  leads={c.leads} conv={c.conv} convRate={c.rate} color={c.color}
                  onClick={() => onSelect(c.key)} isLast={i === ranked.length - 1}/>
              ))}
            </Surface>

            <Surface color={theme.c0} variants={rise}>
              <SectionHeader title="Participação na base" accent={theme.c0}
                sub="Peso de cada campanha no volume acumulado"/>
              <div style={{ padding:SP[5] }}>
                <DonutChart
                  labels={camps.map(c => c.key)}
                  values={camps.map(c => c.leads)}
                  colors={camps.map(c => c.color)}
                  totalLabel="entradas"/>
              </div>
            </Surface>
          </motion.section>

          {/* Pontos de atenção */}
          <Surface color={theme.c0} variants={rise}>
            <SectionHeader title="Pontos de atenção" accent={theme.c0}
              sub="Maior queda entre etapas consecutivas de cada funil"/>
            {attention.map((c, i) => (
              <AttentionRow key={c.key} name={c.key} info={c.info} drop={c.drop} color={c.color}
                onClick={() => onSelect(c.key)} isLast={i === attention.length - 1}/>
            ))}
          </Surface>

          {/* Funis por automação */}
          <Surface color={theme.c0} variants={rise}>
            <SectionHeader title="Desempenho do funil por automação" accent={theme.c0}
              sub="Volume acumulado em cada etapa, sem recorte de período"/>
            <div style={{
              padding:SP[5], display:"grid",
              gridTemplateColumns: mob ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
              gap: mob ? SP[6] : SP[7],
            }}>
              {camps.map((c) => (
                <article key={c.key}>
                  <div style={{ display:"flex", alignItems:"center", gap:SP[2], marginBottom:SP[3] }}>
                    <IconBox icon={c.info.icon} color={c.color} size={22}/>
                    <span style={{ ...T.body, fontSize:11.5, fontWeight:600, color:D.t0,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.key}</span>
                  </div>
                  <FunnelBars campKey={c.key} info={c.info} M={M} color={c.color}
                    height={Math.max(120, c.info.etapas.length * 34)} compact/>
                </article>
              ))}
            </div>
          </Surface>

          {/* Taxas de conversão */}
          <Surface color={theme.c0} variants={rise}>
            <SectionHeader title="Taxas de conversão" accent={theme.c0}
              sub="Percentual do volume de entrada que alcançou cada etapa"/>
            <div style={{
              padding:SP[5], display:"grid",
              gridTemplateColumns: mob ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
              gap: mob ? SP[5] : SP[6],
            }}>
              {camps.map((c) => {
                const stages = getStages(c.info, M);
                return (
                  <article key={c.key}>
                    <div style={{ display:"flex", alignItems:"center", gap:SP[2], marginBottom:SP[3] }}>
                      <span aria-hidden="true" style={{
                        width:6, height:6, borderRadius:"50%", background:c.color, flexShrink:0,
                        boxShadow:`0 0 5px ${gl(c.color, 0.35)}`,
                      }}/>
                      <span style={{ ...T.body, fontSize:11.5, fontWeight:600, color:D.t0,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.key}</span>
                    </div>
                    <div>
                      {stages.slice(1).map((s, i) => {
                        const r = s.pctTop ?? 0;
                        const clr = rateColor(r, D, c.color);
                        return (
                          <div key={s.name} style={{
                            display:"flex", alignItems:"center", gap:SP[3], padding:"7px 0",
                            borderBottom: i < stages.length - 2 ? `1px solid ${D.bdr}` : "none",
                          }}>
                            <span style={{ ...T.small, fontSize:10.5, color:D.t1,
                              flex:"0 0 120px", lineHeight:1.35,
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              Entrada → {s.name}
                            </span>
                            <span style={{ flex:1, minWidth:40 }}>
                              <Meter value={r} color={clr} delay={i * 110} height={5}/>
                            </span>
                            <span style={{ ...T.mono, fontSize:10.5, fontWeight:600, color:clr,
                              width:46, textAlign:"right" }}>{fmtRate(r)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </Surface>
        </>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   12. DETALHE DA CAMPANHA
   ═════════════════════════════════════════════════════════════════════════ */

function FunnelDetail({ campKey, info, M, color, onBack }) {
  const D = useD();
  const mob = useIsMobile();
  const stages = useMemo(() => getStages(info, M), [info, M]);
  const drop = useMemo(() => getBiggestDrop(info, M), [info, M]);
  const top = stages[0]?.value ?? 0;
  const last = stages[stages.length - 1]?.value ?? 0;
  const finalRate = safePct(top, last);
  const finalClr = rateColor(finalRate, D, color);
  const cls = classifyDrop(drop?.lossRate, D);
  const hasData = top > 0;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      style={{ display:"flex", flexDirection:"column", gap: mob ? SP[5] : SP[6] }}>

      <motion.header variants={rise} style={{ display:"flex", alignItems:"center", gap:SP[3] }}>
        <motion.button type="button" onClick={onBack} className="zf-focus"
          aria-label="Voltar para a visão geral"
          whileHover={{ background: gl(color, 0.17), x:-2 }}
          whileTap={{ scale:0.94 }}
          transition={MOVE.hover}
          style={{
            width:36, height:36, borderRadius:R.md, flexShrink:0,
            background:gl(color, 0.09), border:`1px solid ${gl(color, 0.2)}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color, cursor:"pointer", fontSize:16,
          }}>
          <i className="ti ti-arrow-left" aria-hidden="true"/>
        </motion.button>
        <IconBox icon={info.icon} color={color} size={36}/>
        <div style={{ minWidth:0 }}>
          <h1 style={{ ...T.h1, fontSize: mob ? 17 : 20, color:D.t0, margin:0,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{campKey}</h1>
          <p style={{ ...T.small, color:D.t2, margin:"2px 0 0" }}>Desempenho acumulado do funil</p>
        </div>
      </motion.header>

      {!hasData && (
        <Surface hoverable={false} variants={rise} style={{ padding:SP[6] }}>
          <EmptyBlock icon="ti-inbox"
            text="Esta automação ainda não registrou entradas. Os dados aparecem assim que o primeiro contato percorrer o fluxo."/>
        </Surface>
      )}

      {hasData && (
        <>
          {/* Etapas */}
          <motion.section variants={stagger} aria-label="Etapas do funil" style={{
            display:"grid",
            gridTemplateColumns: mob ? "1fr 1fr" : `repeat(${Math.min(stages.length, 5)}, minmax(0,1fr))`,
            gap:SP[3],
          }}>
            {stages.map((s, i) => (
              <Surface key={s.name} color={color} variants={rise} style={{
                padding:`${SP[4]}px ${SP[5]}px`,
                background: i === 0 ? gl(color, 0.06) : D.surface,
                borderColor: i === 0 ? gl(color, 0.24) : D.bdr,
                position:"relative",
              }}>
                {i === 0 && (
                  <span aria-hidden="true" style={{
                    position:"absolute", top:0, left:0, right:0, height:2,
                    background:`linear-gradient(90deg, ${color}, ${gl(color, 0)})`,
                  }}/>
                )}
                <Eyebrow color={i === 0 ? gl(color, 0.9) : D.t2}>{s.name}</Eyebrow>
                <div style={{ ...T.metric, fontSize:26, color:D.t0, margin:`${SP[3]}px 0 ${SP[3]}px` }}>
                  <AnimatedNumber value={s.value} delay={i * 90}/>
                </div>
                {i === 0
                  ? <Badge color={color}>Volume de entrada</Badge>
                  : <Badge color={rateColor(s.pctTop ?? 0, D, color)}>
                      {s.pctTop !== null ? `${s.pctTop.toFixed(1)}% da entrada` : "—"}
                    </Badge>}
              </Surface>
            ))}
          </motion.section>

          <motion.section variants={stagger} style={{
            display:"grid",
            gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap:SP[4], alignItems:"start",
          }}>
            {/* Funil */}
            <Surface color={color} variants={rise}>
              <SectionHeader title="Desempenho do funil" accent={color}
                sub="Redução de volume entre etapas"/>
              <div style={{ padding:`${SP[5]}px ${SP[4]}px ${SP[5]}px ${SP[3]}px` }}>
                <FunnelBars campKey={campKey} info={info} M={M} color={color}
                  height={Math.max(150, stages.length * 42)}/>
              </div>
            </Surface>

            {/* Conversão entre etapas */}
            <Surface color={color} variants={rise}>
              <SectionHeader title="Conversão entre etapas" accent={color}
                sub="Comparação com a etapa anterior e com o volume de entrada"/>
              <div style={{ padding:`${SP[2]}px ${SP[5]}px ${SP[4]}px` }}>
                {stages.slice(1).map((s, i) => {
                  const prevRate = s.pctPrev ?? 0;
                  const clr = rateColor(prevRate, D, color);
                  return (
                    <div key={s.name} style={{
                      padding:`${SP[3]}px 0`,
                      borderBottom: i < stages.length - 2 ? `1px solid ${D.bdr}` : "none",
                    }}>
                      <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between",
                        gap:SP[3], marginBottom:SP[2] }}>
                        <span style={{ ...T.small, fontSize:11, color:D.t1, minWidth:0,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {s.previous !== null ? stages[i].name : ""} <span style={{ color:D.t2 }}>→</span> {s.name}
                        </span>
                        <span style={{ ...T.metric, fontSize:15, color:clr, flexShrink:0 }}>
                          {fmtRate(prevRate)}
                        </span>
                      </div>
                      <Meter value={prevRate} color={clr} delay={i * 120} height={5}/>
                      <div style={{ display:"flex", justifyContent:"space-between", gap:SP[3], marginTop:SP[2] }}>
                        <span style={{ ...T.mono, fontSize:9.5, color:D.t2 }}>
                          Perda: {fmtNum(s.lost)}
                        </span>
                        <span style={{ ...T.mono, fontSize:9.5, color:D.t2 }}>
                          {s.pctTop !== null ? `${s.pctTop.toFixed(1)}% da entrada` : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Surface>
          </motion.section>

          <motion.section variants={stagger} style={{
            display:"grid",
            gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap:SP[4],
          }}>
            {/* Maior queda */}
            <Surface color={cls.color} variants={rise} style={{
              padding:`${SP[5]}px`, position:"relative",
              background:D.surface, borderColor:gl(cls.color, 0.2),
            }}>
              <span aria-hidden="true" style={{
                position:"absolute", top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg, ${cls.color}, ${gl(cls.color, 0)})`,
              }}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:SP[3] }}>
                <Eyebrow color={D.t2}>Maior queda entre etapas</Eyebrow>
                <Badge color={cls.color}>{cls.label}</Badge>
              </div>
              {drop ? (
                <>
                  <div style={{ ...T.metric, fontSize: mob ? 34 : 40, color:cls.color, margin:`${SP[4]}px 0 ${SP[3]}px` }}>
                    <AnimatedNumber value={drop.lossRate} duration={1000} format={(n) => `${clamp(n, 0, 100).toFixed(1)}%`}/>
                  </div>
                  <p style={{ ...T.body, color:D.t1, margin:0 }}>
                    Entre <strong style={{ color:D.t0, fontWeight:600 }}>{drop.from}</strong> e{" "}
                    <strong style={{ color:D.t0, fontWeight:600 }}>{drop.to}</strong>,{" "}
                    <strong style={{ color:D.t0, fontWeight:600 }}>{fmtNum(drop.lost)}</strong> contatos não avançaram
                    ({fmtNum(drop.previous)} → {fmtNum(drop.current)}).
                  </p>
                </>
              ) : (
                <p style={{ ...T.body, color:D.t1, margin:`${SP[4]}px 0 0` }}>
                  Ainda não há volume suficiente entre as etapas para avaliar quedas.
                </p>
              )}
            </Surface>

            {/* Conversão final */}
            <Surface color={color} variants={rise} style={{
              padding:SP[5], position:"relative",
              background:gl(color, 0.05), borderColor:gl(color, 0.2),
            }}>
              <span aria-hidden="true" style={{
                position:"absolute", top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg, ${color}, ${gl(color, 0)})`,
              }}/>
              <Eyebrow color={gl(color, 0.85)}>Conversão final acumulada</Eyebrow>
              <div style={{ ...T.metric, fontSize: mob ? 34 : 40, color:finalClr, margin:`${SP[4]}px 0 ${SP[3]}px` }}>
                <AnimatedNumber value={finalRate} duration={1000} format={(n) => `${clamp(n, 0, 100).toFixed(1)}%`}/>
              </div>
              <p style={{ ...T.body, color:D.t1, margin:0 }}>
                <strong style={{ color:D.t0, fontWeight:600 }}>{fmtNum(top)}</strong> entraram no fluxo ·{" "}
                <strong style={{ color:D.t0, fontWeight:600 }}>{fmtNum(last)}</strong> chegaram a{" "}
                {info.etapas[info.etapas.length - 1]}.
              </p>
              <div style={{ marginTop:SP[4] }}>
                <Meter value={finalRate} color={finalClr} height={6} delay={200}/>
              </div>
            </Surface>
          </motion.section>
        </>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   13. NAVEGAÇÃO
   ═════════════════════════════════════════════════════════════════════════ */

/* O marcador do item ativo é um layoutId: ele não some e reaparece, ele
   escorrega de um item para o outro. */
function NavItem({ icon, label, count, active, onClick, color }) {
  const D = useD();
  return (
    <li>
      <motion.button type="button" onClick={onClick} className="zf-focus"
        initial={false}
        animate={{
          backgroundColor: active ? gl(color, 0.09) : "rgba(0,0,0,0)",
          color: active ? D.t0 : D.t1,
        }}
        whileHover={active ? {} : { backgroundColor: D.surfaceAlt, color: D.t0, x:1 }}
        whileTap={{ scale:0.98 }}
        transition={MOVE.hover}
        aria-current={active ? "page" : undefined}
        style={{
          position:"relative", display:"flex", alignItems:"center", gap:SP[3],
          width:"100%", minHeight:38, padding:"9px 12px 9px 13px", borderRadius:R.sm,
          fontFamily:F.b, fontSize:12.5, fontWeight: active ? 600 : 450,
          border:"1px solid transparent", cursor:"pointer", textAlign:"left",
        }}>
        {active && (
          <motion.span
            layoutId="nav-marker"
            aria-hidden="true"
            transition={MOVE.swap}
            style={{
              position:"absolute", left:0, top:8, bottom:8, width:2.5,
              borderRadius:R.pill, background:color,
              boxShadow:`0 0 8px ${gl(color, 0.5)}`,
            }}/>
        )}
        <i className={`ti ${icon}`} aria-hidden="true" style={{
          fontSize:15.5, flexShrink:0, color: active ? color : "inherit",
        }}/>
        <span style={{ flex:1, minWidth:0, overflow:"hidden",
          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
        {count !== null && count !== undefined && (
          <span style={{
            ...T.mono, fontSize:9.5, fontWeight:600,
            color: active ? gl(color, 0.95) : D.t2,
            background: active ? gl(color, 0.12) : D.track,
            padding:"2px 7px", borderRadius:R.pill, flexShrink:0,
          }}>{count}</span>
        )}
      </motion.button>
    </li>
  );
}

function NavGroup({ label, children }) {
  const D = useD();
  return (
    <div style={{ padding:`${SP[4]}px ${SP[3]}px ${SP[1]}px` }}>
      <div style={{ ...T.eyebrow, fontSize:8.5, color:D.t2, padding:`0 ${SP[3]}px ${SP[2]}px` }}>{label}</div>
      <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex",
        flexDirection:"column", gap:2 }}>{children}</ul>
    </div>
  );
}

function Sidebar({ theme, camps, M, sel, setSel, mob, closeSide, colors, timeStr, loading, reload }) {
  const D = useD();

  // No mobile a sidebar é uma gaveta: entra e sai de verdade (desmonta),
  // então não fica um menu invisível capturando o Tab.
  const drawer = mob
    ? {
        initial: { x:"-100%" },
        animate: { x:0 },
        exit:    { x:"-100%" },
        transition: { type:"spring", stiffness:320, damping:36 },
      }
    : {};

  return (
    <motion.nav aria-label="Navegação do cliente" {...drawer} style={{
      width:236, flexShrink:0, background:D.surface,
      borderRight:`1px solid ${D.bdr}`, display:"flex", flexDirection:"column",
      ...(mob
        ? { position:"fixed", top:0, left:0, bottom:0, zIndex:90, boxShadow:D.sh3 }
        : { position:"sticky", top:TOPBAR_H, height:`calc(100vh - ${TOPBAR_H}px)`, overflow:"hidden auto" }),
    }}>
      {/* Identidade do cliente */}
      <div style={{ padding:`${SP[4]}px ${SP[4]}px ${SP[3]}px` }}>
        <div style={{
          display:"flex", alignItems:"center", gap:SP[3],
          background:`linear-gradient(135deg, ${gl(theme.c0, 0.1)}, ${gl(theme.c3, 0.04)})`,
          border:`1px solid ${gl(theme.c0, 0.18)}`,
          borderRadius:R.md, padding:`${SP[3]}px ${SP[3]}px`,
        }}>
          <span aria-hidden="true" style={{
            width:32, height:32, borderRadius:R.sm, flexShrink:0,
            background:`linear-gradient(140deg, ${theme.c0}, ${theme.c3})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, fontWeight:700, color:"#fff", fontFamily:F.h,
          }}>{theme.avatar}</span>
          <div style={{ minWidth:0 }}>
            <div style={{ ...T.body, fontFamily:F.h, fontSize:12.5, fontWeight:700, color:D.t0,
              letterSpacing:"-0.012em", overflow:"hidden", textOverflow:"ellipsis",
              whiteSpace:"nowrap" }}>{theme.name}</div>
            <div style={{ ...T.eyebrow, fontSize:8, color:D.t2, marginTop:2 }}>Cliente ativo</div>
          </div>
        </div>
      </div>

      <Divider/>

      {/* O LayoutGroup mantém o marcador contínuo entre os dois grupos */}
      <LayoutGroup id="sidebar">
        <NavGroup label="Painel">
          <NavItem icon="ti-layout-dashboard" label="Visão geral" color={theme.c0}
            active={sel === "overview"}
            onClick={() => { setSel("overview"); if (mob) closeSide(); }}/>
        </NavGroup>

        <Divider/>

        <NavGroup label="Campanhas">
          {camps.map(([key, info], i) => {
            const count = M[info.cols[0]] ?? 0;
            return (
              <NavItem key={key} icon={info.icon}
                label={key}
                count={count > 0 ? fmtNum(count) : null}
                color={colors[i % colors.length]}
                active={sel === key}
                onClick={() => { setSel(key); if (mob) closeSide(); }}/>
            );
          })}
        </NavGroup>
      </LayoutGroup>

      {/* Rodapé: sincronização */}
      <div style={{ marginTop:"auto", padding:SP[4], borderTop:`1px solid ${D.bdr}` }}>
        <div style={{ ...T.mono, fontSize:9.5, color:D.t2, marginBottom:SP[3],
          display:"flex", alignItems:"center", gap:6 }}>
          <span className={loading ? "" : "zf-live"} aria-hidden="true" style={{
            width:6, height:6, borderRadius:"50%", flexShrink:0,
            background: loading ? D.warn : timeStr ? D.ok : D.t2,
          }}/>
          {loading ? "Sincronizando…" : timeStr ? `Última sincronização · ${timeStr}` : "Aguardando dados"}
        </div>
        <motion.button type="button" onClick={reload} disabled={loading} className="zf-focus"
          whileHover={loading ? {} : { backgroundColor:D.surfaceAlt, color:D.t0 }}
          whileTap={loading ? {} : { scale:0.98 }}
          animate={{ color: loading ? D.t2 : D.t1 }}
          transition={MOVE.hover}
          style={{
            display:"flex", alignItems:"center", justifyContent:"center", gap:7, width:"100%",
            minHeight:38, ...T.mono, fontSize:10.5, fontWeight:600,
            backgroundColor:"rgba(0,0,0,0)", border:`1px solid ${D.bdr2}`, borderRadius:R.sm,
            cursor: loading ? "default" : "pointer",
          }}>
          <i className={`ti ti-refresh${loading ? " spinning" : ""}`} style={{ fontSize:13 }} aria-hidden="true"/>
          {loading ? "Sincronizando" : "Sincronizar agora"}
        </motion.button>
      </div>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   14. TOPBAR
   ═════════════════════════════════════════════════════════════════════════ */

function ThemeToggle({ mode, onChange }) {
  const isDark = mode === "dark";
  return (
    <motion.button type="button" onClick={() => onChange(isDark ? "light" : "dark")}
      className="zf-focus"
      whileTap={{ scale:0.93 }}
      title={isDark ? "Usar modo claro" : "Usar modo escuro"}
      aria-label={isDark ? "Usar modo claro" : "Usar modo escuro"}
      aria-pressed={isDark}
      animate={{
        backgroundColor: isDark ? "#1C1C24" : "#E7E6EE",
        borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(17,17,26,0.14)",
      }}
      transition={{ duration:0.25, ease:EASE }}
      style={{
        width:46, height:26, borderRadius:R.pill, padding:0, position:"relative", flexShrink:0,
        borderWidth:1, borderStyle:"solid", cursor:"pointer",
      }}>
      <motion.i className="ti ti-sun" aria-hidden="true"
        animate={{ color: isDark ? "rgba(255,255,255,0.22)" : "#6E5FC8" }}
        transition={{ duration:0.25 }}
        style={{ position:"absolute", left:7, top:"50%", y:"-50%", fontSize:10 }}/>
      <motion.i className="ti ti-moon" aria-hidden="true"
        animate={{ color: isDark ? "#A78BFA" : "rgba(17,17,26,0.2)" }}
        transition={{ duration:0.25 }}
        style={{ position:"absolute", right:7, top:"50%", y:"-50%", fontSize:10 }}/>
      <motion.span aria-hidden="true"
        animate={{ left: isDark ? 22 : 2, backgroundColor: isDark ? "#A78BFA" : "#6E5FC8" }}
        transition={MOVE.swap}
        style={{
          position:"absolute", top:2, width:20, height:20, borderRadius:"50%",
          boxShadow:"0 1px 4px rgba(0,0,0,0.28)",
        }}/>
    </motion.button>
  );
}

/* A pílula do cliente agora vive dentro do botão ativo. O Motion interpola a
   posição sozinho (layoutId) — some o cálculo de `left: calc(...)`. */
function ClientSwitcher({ tab, setTab, mob }) {
  const D = useD();
  const mode = useTheme();
  const n = TABS.length;
  const activeTheme = THEMES[TABS[tab].ecoKey];

  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setTab((tab + 1) % n); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); setTab((tab + n - 1) % n); }
  };

  return (
    <div role="tablist" aria-label="Selecionar cliente" onKeyDown={onKey} style={{
      display:"grid", gridTemplateColumns:`repeat(${n}, 1fr)`, position:"relative",
      padding:3, borderRadius:R.md, minWidth: mob ? 0 : 300,
      background: mode === "dark" ? "rgba(255,255,255,0.035)" : "rgba(17,17,26,0.04)",
      border:`1px solid ${D.bdr}`,
    }}>
      {TABS.map((t, i) => {
        const active = i === tab;
        const th = THEMES[t.ecoKey];
        return (
          <motion.button key={t.ecoKey} type="button" role="tab" aria-selected={active}
            tabIndex={active ? 0 : -1} onClick={() => setTab(i)}
            className="zf-focus" title={t.label}
            whileTap={{ scale:0.97 }}
            animate={{ color: active ? D.t0 : D.t1 }}
            whileHover={active ? {} : { color: D.t0 }}
            transition={MOVE.hover}
            style={{
              position:"relative", display:"flex", alignItems:"center",
              justifyContent:"center", gap:7, minHeight:32,
              fontFamily:F.b, fontSize: mob ? 11 : 11.5, fontWeight: active ? 600 : 450,
              background:"transparent", border:"none", borderRadius:R.xs,
              padding: mob ? "5px 8px" : "5px 12px",
              cursor:"pointer", whiteSpace:"nowrap",
            }}>
            {active && (
              <motion.span
                layoutId="client-pill"
                aria-hidden="true"
                transition={MOVE.swap}
                style={{
                  position:"absolute", inset:0, borderRadius:R.xs,
                  background: mode === "dark" ? "rgba(255,255,255,0.07)" : "#FFFFFF",
                  border:`1px solid ${gl(activeTheme.c0, 0.22)}`,
                  boxShadow: mode === "dark" ? `0 0 12px ${gl(activeTheme.c0, 0.1)}` : D.sh1,
                }}/>
            )}
            <motion.span aria-hidden="true"
              animate={{
                opacity: active ? 1 : 0.5,
                scale: active ? 1 : 0.85,
                boxShadow: active ? `0 0 6px ${gl(th.c0, 0.55)}` : `0 0 0px ${gl(th.c0, 0)}`,
              }}
              transition={MOVE.hover}
              style={{
                position:"relative", width:6, height:6, borderRadius:"50%",
                flexShrink:0, background:th.c0,
              }}/>
            <span style={{ position:"relative" }}>{mob ? t.short : t.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function StatusPill({ loading, error, timeStr }) {
  const D = useD();
  const state = error
    ? { key:"err", color:D.err, label:"Integração com erro", live:false }
    : loading
      ? { key:"load", color:D.warn, label:"Sincronizando", live:false }
      : { key:"ok", color:D.ok, label: timeStr ? `Sincronizado · ${timeStr}` : "Conectado", live:true };

  return (
    <span title="Status da integração ManyChat · Google Sheets" style={{
      display:"inline-flex", alignItems:"center", gap:7,
      padding:"5px 11px", borderRadius:R.pill,
      background:D.surfaceAlt, border:`1px solid ${D.bdr}`,
      ...T.mono, fontSize:10, color:D.t1, whiteSpace:"nowrap",
    }}>
      <motion.span className={state.live ? "zf-live" : ""} aria-hidden="true"
        animate={{ backgroundColor: state.color }}
        transition={{ duration:0.3 }}
        style={{ width:6, height:6, borderRadius:"50%", flexShrink:0 }}/>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={state.label}
          initial={{ opacity:0, y:3 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-3 }}
          transition={{ duration:0.16 }}>
          {state.label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   15. PÁGINA DO ECOSSISTEMA
   ═════════════════════════════════════════════════════════════════════════ */

function EcosystemPage({ ecoKey, onStatus }) {
  const D = useD();
  const mode = useTheme();
  const mob = useIsMobile();
  const reduce = useReducedMotion();
  const theme = THEMES[ecoKey];

  const { rows, boolCols, error, loading, lastSync, reload } = useData(URLS[ecoKey]);
  const [sel, setSel] = useState("overview");
  const [sideOpen, setSideOpen] = useState(false);

  const M = useMemo(() => (!rows || !boolCols ? {} : buildMetrics(rows, boolCols)), [rows, boolCols]);
  const camps = useMemo(() => Object.entries(CAMPANHAS[ecoKey]), [ecoKey]);
  const colors = useMemo(() => [theme.c0, theme.c1, theme.c2, theme.c3], [theme]);
  const timeStr = lastSync?.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });

  const selIndex = camps.findIndex(([k]) => k === sel);
  const selColor = sel === "overview" || selIndex < 0
    ? theme.c0
    : colors[selIndex % colors.length] ?? theme.c0;

  const closeSide = useCallback(() => setSideOpen(false), []);

  /* Luz de fundo que segue o cursor. O ponteiro alimenta dois motion values,
     que passam por uma mola: o halo tem inércia em vez de colar no mouse.
     Nada disso re-renderiza o React. */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness:110, damping:24, mass:0.6 });
  const sy = useSpring(my, { stiffness:110, damping:24, mass:0.6 });
  const glowOpacity = useMotionValue(0);

  const cursorColor = gl(selColor, mode === "dark" ? 0.11 : 0.07);
  const glowColor = useMotionValue(cursorColor);
  useEffect(() => {
    const controls = animate(glowColor, cursorColor, { duration:0.5, ease:EASE });
    return () => controls.stop();
  }, [cursorColor, glowColor]);

  const glowBg = useMotionTemplate`radial-gradient(520px circle at ${sx}px ${sy}px, ${glowColor} 0%, transparent 62%)`;

  const handlePointer = useCallback((e) => {
    if (reduce) return;
    mx.set(e.clientX);
    my.set(e.clientY - TOPBAR_H);
    animate(glowOpacity, 1, { duration:0.4 });
  }, [reduce, mx, my, glowOpacity]);

  const handlePointerLeave = useCallback(() => {
    animate(glowOpacity, 0, { duration:0.5 });
  }, [glowOpacity]);

  // Reporta status da integração para a topbar
  useEffect(() => { onStatus({ loading, error, timeStr }); }, [loading, error, timeStr, onStatus]);

  // Volta ao topo ao trocar de página
  const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top:0 }); }, [sel]);

  // Esc fecha a gaveta
  useEffect(() => {
    if (!sideOpen) return;
    const fn = (e) => { if (e.key === "Escape") setSideOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [sideOpen]);

  const activeInfo = CAMPANHAS[ecoKey][sel];

  const sidebarProps = {
    theme, camps, M, sel, setSel, closeSide, colors, timeStr, loading, reload,
  };

  return (
    <div style={{ display:"flex", flex:1, minHeight:0 }}>
      {!mob && <Sidebar {...sidebarProps} mob={false}/>}

      <AnimatePresence>
        {mob && sideOpen && (
          <>
            <motion.div key="scrim" onClick={closeSide} aria-hidden="true"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.2 }}
              style={{
                position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
                backdropFilter:"blur(2px)", zIndex:80,
              }}/>
            <Sidebar key="drawer" {...sidebarProps} mob={true}/>
          </>
        )}
      </AnimatePresence>

      <main ref={scrollRef}
        onMouseMove={handlePointer}
        onMouseLeave={handlePointerLeave}
        style={{
          flex:1, minWidth:0, display:"flex", flexDirection:"column",
          background:D.bg, overflowX:"hidden",
          height:`calc(100vh - ${TOPBAR_H}px)`, overflowY:"auto", position:"relative",
        }}>

        {/* Fundo vivo: duas manchas em deriva lenta (CSS, loop infinito barato)
            + halo que segue o cursor com mola (Motion). */}
        <div aria-hidden="true" className="zf-bg" style={{
          position:"fixed", top:TOPBAR_H, left:0, right:0, bottom:0,
          pointerEvents:"none", zIndex:0, overflow:"hidden",
          "--c-soft": gl(selColor, mode === "dark" ? 0.075 : 0.05),
          "--c-faint": gl(selColor, mode === "dark" ? 0.05 : 0.032),
        }}>
          <motion.span className="zf-bg-cursor" style={{ background:glowBg, opacity:glowOpacity }}/>
          <span className="zf-bg-blob zf-bg-blob-a"/>
          <span className="zf-bg-blob zf-bg-blob-b"/>
        </div>

        {mob && (
          <div style={{
            display:"flex", alignItems:"center", gap:SP[3],
            padding:`${SP[2]}px ${SP[4]}px`,
            background: mode === "dark" ? gl("#111114", 0.88) : gl("#FFFFFF", 0.9),
            backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
            borderBottom:`1px solid ${D.bdr}`,
            position:"sticky", top:0, zIndex:40, flexShrink:0,
          }}>
            <motion.button type="button" onClick={() => setSideOpen(v => !v)}
              aria-label="Abrir menu de campanhas" aria-expanded={sideOpen}
              whileTap={{ scale:0.93 }}
              className="zf-focus" style={{
                width:38, height:38, borderRadius:R.sm, flexShrink:0,
                background:gl(selColor, 0.09), border:`1px solid ${gl(selColor, 0.2)}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:selColor, cursor:"pointer", fontSize:16,
              }}>
              <i className="ti ti-menu-2" aria-hidden="true"/>
            </motion.button>
            <span style={{ display:"flex", alignItems:"center", gap:7, minWidth:0 }}>
              <motion.span aria-hidden="true"
                animate={{ backgroundColor:selColor, boxShadow:`0 0 6px ${gl(selColor, 0.45)}` }}
                transition={{ duration:0.3 }}
                style={{ width:6, height:6, borderRadius:"50%", flexShrink:0 }}/>
              <span style={{ ...T.body, fontFamily:F.h, fontSize:12.5, fontWeight:600, color:D.t0,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {sel === "overview" ? "Visão geral" : sel}
              </span>
            </span>
          </div>
        )}

        <div style={{
          width:"100%", maxWidth:1320, margin:"0 auto",
          padding: mob ? `${SP[5]}px ${SP[4]}px ${SP[7]}px` : `${SP[7]}px ${SP[7]}px ${SP[8]}px`,
          flex:1, position:"relative", zIndex:1,
        }}>
          {/* Uma única troca de conteúdo: erro, esqueleto ou página.
              O que sai, sai animado — antes o conteúdo antigo desaparecia seco. */}
          <AnimatePresence mode="wait" initial={false}>
            {error ? (
              <motion.div key="error"
                initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                transition={MOVE.page}>
                <ErrorState message={error} onRetry={reload}/>
              </motion.div>
            ) : loading ? (
              <motion.div key="loading"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={MOVE.page}>
                <LoadingSkeleton mob={mob}/>
              </motion.div>
            ) : rows ? (
              <motion.div key={sel}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                transition={MOVE.page}>
                {sel === "overview" || !activeInfo
                  ? <Overview ecoKey={ecoKey} M={M} theme={theme} onSelect={setSel} timeStr={timeStr}/>
                  : <FunnelDetail campKey={sel} info={activeInfo} M={M}
                      color={selColor} onBack={() => setSel("overview")}/>}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   16. ABERTURA DA SESSÃO
   ═════════════════════════════════════════════════════════════════════════ */

const SPLASH_KEY = "zafra-splash-seen";

// Toca uma única vez por sessão do navegador. Enquanto ela roda, o fetch do
// Sheets já está em andamento por baixo — a espera vira tempo útil.
function shouldPlaySplash() {
  if (reducedMotionNow()) return false;
  try { return !sessionStorage.getItem(SPLASH_KEY); } catch { return false; }
}

/* Um único gesto de assinatura: o logo é revelado por uma cortina que se
   recolhe (não um brilho passando em loop), e o fechamento responde ao
   carregamento de verdade — o status só vira "Pronto" quando os dados do
   cliente ativo realmente chegaram. Nada aqui roda para sempre; tudo conta
   uma história com início, meio e fim, uma única vez. */
function SplashScreen({ mode, accent, status, onDone }) {
  const D = PALETTES[mode];
  const done = useRef(false);
  const [revealed, setRevealed] = useState(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onDone();
  }, [onDone]);

  // A cortina e o traço precisam de ~1.1s para contar a história inteira.
  // Isso é o piso: nunca fechamos antes disso, mesmo com dados já prontos.
  useEffect(() => {
    try { sessionStorage.setItem(SPLASH_KEY, "1"); } catch { /* storage indisponível */ }
    const reveal = setTimeout(() => setRevealed(true), 1100);
    // Rede lenta ou fora do ar: nunca prende a pessoa na tela de abertura.
    const safety = setTimeout(finish, 4200);
    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);
    return () => {
      clearTimeout(reveal);
      clearTimeout(safety);
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
  }, [finish]);

  // Só fecha quando a revelação terminou E o cliente ativo já sincronizou
  // (ou falhou — nesse caso o próprio app mostra o estado de erro em seguida).
  useEffect(() => {
    if (!revealed) return;
    if (status.loading && !status.error) return;
    const t = setTimeout(finish, 340);
    return () => clearTimeout(t);
  }, [revealed, status.loading, status.error, finish]);

  const connecting = status.loading && !status.error;
  const label = status.error
    ? "Não foi possível sincronizar agora"
    : connecting
      ? "Conectando aos seus dados"
      : "Pronto para começar";
  const icon = status.error ? "ti-alert-triangle" : connecting ? "ti-loader-2" : "ti-check";
  const iconColor = status.error ? D.err : connecting ? D.t2 : accent;

  return (
    <motion.div role="status" aria-live="polite" aria-label="Abrindo o painel"
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0, transition:{ duration:0.35, ease:EASE } }}
      transition={{ duration:0.3, ease:EASE }}
      style={{
        position:"fixed", inset:0, zIndex:2000,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        gap:SP[6], background:D.bg,
      }}>

      {/* Um único halo, na cor do cliente que está prestes a abrir */}
      <motion.div aria-hidden="true"
        initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ duration:1.1, ease:EASE }}
        style={{
          position:"absolute", top:"50%", left:"50%", zIndex:0,
          width:520, height:520, borderRadius:"50%", filter:"blur(90px)",
          transform:"translate(-50%,-50%)",
          background:gl(accent, mode === "dark" ? 0.13 : 0.09),
        }}/>

      {/* Logo revelado por cortina — a assinatura da abertura */}
      <div style={{ position:"relative", overflow:"hidden", zIndex:1 }}>
        <motion.img src={zafraLogo} alt="Zafra"
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ duration:0.3, delay:0.15 }}
          style={{
            height:72, width:"auto", objectFit:"contain", display:"block",
            filter: mode === "light" ? "brightness(0)" : "none",
          }}/>
        <motion.span aria-hidden="true"
          initial={{ scaleX:1 }}
          animate={{ scaleX:0 }}
          transition={{ duration:0.65, delay:0.2, ease:EASE }}
          style={{ position:"absolute", inset:0, background:D.bg, originX:0 }}/>
      </div>

      {/* Traço que se desenha ao final da cortina — fecha o gesto */}
      <motion.span aria-hidden="true"
        initial={{ scaleX:0 }}
        animate={{ scaleX:1 }}
        transition={{ duration:0.4, delay:0.88, ease:EASE }}
        style={{
          width:40, height:1.5, borderRadius:R.pill, background:accent,
          originX:0.5, zIndex:1,
        }}/>

      {/* Rótulo + status, um único bloco que sobe depois do traço */}
      <motion.div
        initial={{ opacity:0, y:8 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, delay:1.0, ease:EASE }}
        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:SP[4], zIndex:1 }}>

        <div style={{ ...T.eyebrow, fontSize:9, color:D.t2 }}>
          Painel de automações · ManyChat
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.i key={icon} className={`ti ${icon}${connecting ? " spinning" : ""}`}
              aria-hidden="true"
              initial={{ opacity:0, scale:0.6 }}
              animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.6 }}
              transition={{ duration:0.2 }}
              style={{ fontSize:12, color:iconColor }}/>
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={label}
              initial={{ opacity:0, y:3 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-3 }}
              transition={{ duration:0.2 }}
              style={{ ...T.mono, fontSize:10.5, color:D.t1 }}>
              {label}
            </motion.span>
          </AnimatePresence>
        </div>

        <div style={{
          width:120, height:2, borderRadius:R.pill, overflow:"hidden",
          background:D.track, position:"relative",
        }}>
          <AnimatePresence mode="wait" initial={false}>
            {connecting ? (
              <motion.span key="indeterminate"
                initial={{ left:"-38%", opacity:0 }}
                animate={{ left:"100%", opacity:1 }}
                exit={{ opacity:0 }}
                transition={{
                  left:{ duration:1.1, repeat:Infinity, ease:"easeInOut" },
                  opacity:{ duration:0.15 },
                }}
                style={{
                  position:"absolute", top:0, bottom:0, width:"38%", borderRadius:R.pill,
                  background:gl(accent, 0.65),
                }}/>
            ) : (
              <motion.span key="fill"
                initial={{ scaleX:0 }}
                animate={{ scaleX:1 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.35, ease:EASE }}
                style={{
                  display:"block", height:"100%", width:"100%", originX:0,
                  borderRadius:R.pill,
                  background: status.error ? D.err : accent,
                }}/>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   17. RAIZ
   ═════════════════════════════════════════════════════════════════════════ */

export default function App() {
  const [tab, setTab] = useState(0);
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("zafra-theme") || "dark"; } catch { return "dark"; }
  });
  const [splash, setSplash] = useState(shouldPlaySplash);
  const [status, setStatus] = useState({ loading:true, error:null, timeStr:null });
  const mob = useIsMobile();
  const D = PALETTES[mode];
  const activeTheme = THEMES[TABS[tab].ecoKey];

  useEffect(() => {
    try { localStorage.setItem("zafra-theme", mode); } catch { /* storage indisponível */ }
  }, [mode]);

  const endSplash = useCallback(() => setSplash(false), []);

  const handleStatus = useCallback((s) => {
    setStatus(prev =>
      prev.loading === s.loading && prev.error === s.error && prev.timeStr === s.timeStr
        ? prev
        : s
    );
  }, []);

  return (
    /* reducedMotion="user" respeita a preferência do sistema em tempo real:
       o Motion desliga sozinho transform e layout, e mantém opacidade e cor. */
    <MotionConfig reducedMotion="user">
      <ThemeCtx.Provider value={mode}>
        <AnimatePresence>
          {splash && (
            <SplashScreen key="splash" mode={mode} accent={activeTheme.c0}
              status={status} onDone={endSplash}/>
          )}
        </AnimatePresence>

        <div style={{
          display:"flex", flexDirection:"column", minHeight:"100vh",
          background:D.bg, fontFamily:F.b, color:D.t0, overflowX:"hidden",
          transition:"background .3s, color .3s",
        }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Instrument+Sans:wght@400..700&family=DM+Mono:wght@400;500&display=swap');
            @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css');

            *{box-sizing:border-box;}
            html,body,#root{margin:0;padding:0;width:100%;min-height:100%;overflow-x:hidden;}
            body{background:${D.bg};transition:background .3s;-webkit-font-smoothing:antialiased;}
            button{font:inherit;}
            ::selection{background:${gl(activeTheme.c0, 0.28)};}

            ::-webkit-scrollbar{width:6px;height:6px;}
            ::-webkit-scrollbar-track{background:transparent;}
            ::-webkit-scrollbar-thumb{background:${mode === "dark" ? "rgba(255,255,255,0.09)" : "rgba(17,17,26,0.14)"};border-radius:3px;}
            ::-webkit-scrollbar-thumb:hover{background:${mode === "dark" ? "rgba(255,255,255,0.17)" : "rgba(17,17,26,0.24)"};}

            @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
            .spinning{animation:spin 1s linear infinite;display:inline-block;}

            /* ── Fundo, pulso e shimmer ───────────────────────────────
               Loops infinitos decorativos continuam no CSS: o compositor do
               navegador faz isso mais barato que qualquer engine JS. */
            .zf-bg > *{position:absolute;display:block;}

            .zf-bg-cursor{top:0;left:0;right:0;bottom:0;}

            .zf-bg-blob{border-radius:50%;filter:blur(70px);will-change:transform;}
            .zf-bg-blob-a{
              width:min(620px,70vw);height:min(620px,70vw);
              top:-22%;left:6%;background:var(--c-soft);
              animation:zfDriftA 26s ease-in-out infinite alternate;
            }
            .zf-bg-blob-b{
              width:min(520px,60vw);height:min(520px,60vw);
              top:8%;right:2%;background:var(--c-faint);
              animation:zfDriftB 34s ease-in-out infinite alternate;
            }
            @keyframes zfDriftA{
              0%{transform:translate3d(0,0,0) scale(1);}
              50%{transform:translate3d(7vw,4vh,0) scale(1.12);}
              100%{transform:translate3d(-3vw,9vh,0) scale(0.96);}
            }
            @keyframes zfDriftB{
              0%{transform:translate3d(0,0,0) scale(1.04);}
              50%{transform:translate3d(-8vw,6vh,0) scale(0.92);}
              100%{transform:translate3d(2vw,-4vh,0) scale(1.1);}
            }

            @keyframes zfPing{0%{transform:scale(1);opacity:.4}70%,100%{transform:scale(2.4);opacity:0}}
            .zf-live{position:relative;}
            .zf-live::after{content:"";position:absolute;inset:0;border-radius:50%;
              background:inherit;animation:zfPing 2.6s cubic-bezier(0,0,.2,1) infinite;}

            @keyframes zfShimmer{from{background-position:200% 0}to{background-position:-200% 0}}
            .zf-shimmer{
              background:linear-gradient(90deg,
                ${mode === "dark" ? "rgba(255,255,255,0.045)" : "rgba(17,17,26,0.045)"} 25%,
                ${mode === "dark" ? "rgba(255,255,255,0.09)"  : "rgba(17,17,26,0.08)"} 50%,
                ${mode === "dark" ? "rgba(255,255,255,0.045)" : "rgba(17,17,26,0.045)"} 75%);
              background-size:200% 100%;
              animation:zfShimmer 1.4s linear infinite;
            }

            /* No mobile não há cursor: só as manchas, com blur mais barato */
            @media (max-width:768px){
              .zf-bg-cursor{display:none;}
              .zf-bg-blob{filter:blur(52px);}
            }

            .zf-focus{outline:none;}
            .zf-focus:focus-visible{outline:2px solid ${gl(activeTheme.c0, 0.75)};outline-offset:2px;border-radius:${R.xs}px;}

            /* O Motion já respeita a preferência via MotionConfig. Aqui ficam
               só os loops que ele não controla. */
            @media (prefers-reduced-motion: reduce){
              .zf-bg-blob{animation:none;}
              .zf-bg-cursor{display:none;}
              .zf-live::after{animation:none;display:none;}
              .zf-shimmer{animation:none;}
            }
          `}</style>

          {/* Grão sutil sobre a interface */}
          <div aria-hidden="true" style={{
            position:"fixed", inset:0, zIndex:999, pointerEvents:"none",
            mixBlendMode:"soft-light", opacity: mode === "dark" ? 0.06 : 0.035,
            backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}/>

          {/* Topbar */}
          <header style={{
            display:"flex", alignItems:"center", gap: mob ? SP[3] : SP[5],
            height:TOPBAR_H, flexShrink:0, padding: mob ? `0 ${SP[4]}px` : `0 ${SP[6]}px`,
            background: mode === "dark" ? gl("#111114", 0.85) : gl("#FFFFFF", 0.88),
            backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
            borderBottom:`1px solid ${D.bdr}`,
            position:"sticky", top:0, zIndex:50,
            transition:"background .3s, border-color .3s",
          }}>
            <motion.img src={zafraLogo} alt="Zafra"
              animate={{
                filter: mode === "light"
                  ? "brightness(0)"
                  : `drop-shadow(0 0 8px ${gl(activeTheme.c0, 0.16)})`,
              }}
              transition={{ duration:0.35, ease:EASE }}
              style={{
                height: mob ? 40 : 52, width:"auto", objectFit:"contain", flexShrink:0,
              }}/>

            <span aria-hidden="true" style={{ width:1, height:22, background:D.bdr, flexShrink:0 }}/>

            <ClientSwitcher tab={tab} setTab={setTab} mob={mob}/>

            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center",
              gap: mob ? SP[2] : SP[4], flexShrink:0 }}>
              {!mob && <StatusPill loading={status.loading} error={status.error} timeStr={status.timeStr}/>}
              <ThemeToggle mode={mode} onChange={setMode}/>
              {!mob && <span aria-hidden="true" style={{ width:1, height:20, background:D.bdr }}/>}
              <img src={manychatLogo} alt="ManyChat" style={{
                height: mob ? 16 : 22, width:"auto", objectFit:"contain",
                opacity: mode === "dark" ? 0.6 : 0.45,
                filter: mode === "light" ? "brightness(0)" : "none",
              }}/>
            </div>
          </header>

          <div style={{ display:"flex", flex:1, minHeight:0 }}>
            <EcosystemPage key={TABS[tab].ecoKey} ecoKey={TABS[tab].ecoKey} onStatus={handleStatus}/>
          </div>
        </div>
      </ThemeCtx.Provider>
    </MotionConfig>
  );
}