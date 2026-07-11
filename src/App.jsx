import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import zafraLogo from "./zafra_logo_branca.png";
import manychatLogo from "./manychat_logo_branca.png";

// ─── THEME CONTEXT ────────────────────────────────────────────────────────────
const ThemeCtx = createContext("dark");
const useTheme = () => useContext(ThemeCtx);

// ─── RESPONSIVE ──────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
}

// ─── PALETTES ────────────────────────────────────────────────────────────────
const PALETTES = {
  dark: {
    bg:   "#080808",
    bg1:  "#0E0E0E",
    bg2:  "#0D0D0D",
    bg3:  "#161616",
    bdr:  "rgba(255,255,255,0.07)",
    bdr2: "rgba(255,255,255,0.12)",
    t0:   "#F0EEF6",
    t1:   "#8A8799",
    t2:   "#3F3D52",
    ok:   "#2EC98A",
    warn: "#D9922A",
    err:  "#E04444",
    shadow: "rgba(0,0,0,0.4)",
  },
  light: {
    bg:   "#F4F3F7",
    bg1:  "#FFFFFF",
    bg2:  "#FFFFFF",
    bg3:  "#F0EFF5",
    bdr:  "rgba(0,0,0,0.08)",
    bdr2: "rgba(0,0,0,0.14)",
    t0:   "#111018",
    t1:   "#5A5870",
    t2:   "#9896AA",
    ok:   "#1A9E6A",
    warn: "#B87020",
    err:  "#C03030",
    shadow: "rgba(0,0,0,0.08)",
  },
};

function useD() {
  const theme = useTheme();
  return PALETTES[theme];
}

// Space Grotesk = display/números · Inter = corpo · DM Mono = dados/labels
const F = {
  h: "'Space Grotesk', system-ui, sans-serif",
  b: "'Inter', system-ui, sans-serif",
  m: "'DM Mono', 'Fira Mono', monospace",
};

const gl = (hex, op) => {
  const h = hex.replace("#","");
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${op})`;
};

// ─── ECOSYSTEM THEMES ────────────────────────────────────────────────────────
const THEMES = {
  laise: { name:"Laise Mesquita", avatar:"L", c0:"#E8527A", c1:"#C43D63", c2:"#9E2E4E", c3:"#72203A" },
  chile: { name:"We Love Chile",  avatar:"C", c0:"#CC1A1A", c1:"#A51515", c2:"#7D1010", c3:"#550B0B" },
  peru:  { name:"We Love Peru",   avatar:"P", c0:"#1A7A3A", c1:"#156130", c2:"#0F4A24", c3:"#093318" },
};

// ─── CAMPAIGNS ───────────────────────────────────────────────────────────────
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

// ─── UTILS ───────────────────────────────────────────────────────────────────
const pct     = (t,p) => (!t?null:Math.round((p/t)*1000)/10);
const fmtPct  = (t,p) => { const v=pct(t,p); return v!==null?`${v.toFixed(1)}%`:"—"; };
const safePct = (t,p) => pct(t,p)??0;
const fmtNum  = (n) => (n??0).toLocaleString("pt-BR");

function parseBool(raw) {
  const s = String(raw??"").trim().toUpperCase();
  if (s==="TRUE"||s==="1") return true;
  if (s==="FALSE"||s==="0"||s===""||s==="NAN") return false;
  return null;
}
function parseCSV(text) {
  const lines = text.trim().replace(/\r\n|\r/g,"\n").split("\n");
  const headers = lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""));
  const rows = lines.slice(1).filter(l=>l.trim()).map(line=>{
    const vals=[]; let cur="",inQ=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='"'){inQ=!inQ;}
      else if(ch===","&&!inQ){vals.push(cur.trim());cur="";}
      else{cur+=ch;}
    }
    vals.push(cur.trim());
    const obj={};
    headers.forEach((h,i)=>{
      const raw=(vals[i]??"").replace(/^"|"$/g,"").trim();
      const b=parseBool(raw);
      obj[h]=b!==null?b:raw;
    });
    return obj;
  });
  const boolCols=headers.filter(h=>h&&rows.length>0&&rows.every(r=>r[h]===true||r[h]===false));
  return {rows,boolCols};
}
function buildMetrics(rows,boolCols){
  const M={};
  boolCols.forEach(col=>{M[col]=rows.filter(r=>r[col]===true).length;});
  return M;
}
function useData(url){
  const [st,setSt]=useState({rows:null,boolCols:null,error:null,loading:true,lastSync:null});
  const load=useCallback(async()=>{
    setSt(s=>({...s,loading:true,error:null}));
    try{
      const res=await fetch(url);
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const {rows,boolCols}=parseCSV(await res.text());
      setSt({rows,boolCols,error:null,loading:false,lastSync:new Date()});
    }catch(e){setSt(s=>({...s,error:e.message,loading:false}));}
  },[url]);
  useEffect(()=>{load();const id=setInterval(load,5*60*1000);return()=>clearInterval(id);},[load]);
  return {...st,reload:load};
}

// ─── MOTION HELPERS ──────────────────────────────────────────────────────────
const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Número que conta até o valor final (easeOutCubic). Respeita reduced-motion.
function AnimatedNumber({ value, format = (n)=>fmtNum(Math.round(n)), duration = 850, delay = 0 }) {
  const [v, setV] = useState(() => prefersReduced() ? value : 0);
  useEffect(() => {
    if (prefersReduced()) { setV(value); return; }
    let raf, start;
    const tick = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start - delay) / duration, 1);
      if (p < 0) { raf = requestAnimationFrame(tick); return; }
      setV(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay]);
  return <>{format(v)}</>;
}

// Barra de progresso que preenche a partir do zero, com stagger opcional
function Bar({ value, fill, track, height = 4, radius = 2, delay = 0 }) {
  const [w, setW] = useState(() => prefersReduced() ? value : 0);
  useEffect(() => {
    if (prefersReduced()) { setW(value); return; }
    const id = setTimeout(() => setW(value), 60 + delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return (
    <div style={{height, background:track, borderRadius:radius, overflow:"hidden"}}>
      <div style={{height:"100%", borderRadius:radius, width:`${Math.min(w,100)}%`,
        background:fill, transition:"width .8s cubic-bezier(.22,.68,.4,1)"}}/>
    </div>
  );
}

// ─── THEME TOGGLE ─────────────────────────────────────────────────────────────
function ThemeToggle({ mode, onChange }) {
  const isDark = mode === "dark";
  return (
    <button
      onClick={() => onChange(isDark ? "light" : "dark")}
      title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="zf-focus"
      style={{
        width:46, height:25, borderRadius:13, padding:0,
        border:`1px solid ${isDark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.15)"}`,
        background: isDark ? "#1E1E2E" : "#E4E2F0",
        cursor:"pointer", transition:"background .25s, border-color .25s",
        position:"relative", flexShrink:0,
      }}
    >
      <i className="ti ti-sun" style={{
        position:"absolute", left:6, top:"50%", transform:"translateY(-50%)",
        fontSize:10, color: isDark ? "rgba(255,255,255,0.2)" : "#7C6CD0",
        transition:"color .25s",
      }}/>
      <i className="ti ti-moon" style={{
        position:"absolute", right:6, top:"50%", transform:"translateY(-50%)",
        fontSize:10, color: isDark ? "#A78BFA" : "rgba(0,0,0,0.2)",
        transition:"color .25s",
      }}/>
      <div style={{
        position:"absolute", top:2,
        left: isDark ? 23 : 2,
        width:19, height:19, borderRadius:"50%",
        background: isDark ? "#A78BFA" : "#7C6CD0",
        transition:"left .25s cubic-bezier(.4,0,.2,1)",
        boxShadow:"0 1px 4px rgba(0,0,0,0.3)",
      }}/>
    </button>
  );
}

// ─── BASE COMPONENTS ─────────────────────────────────────────────────────────
function Divider() {
  const D = useD();
  return <div style={{height:1, background:D.bdr}}/>;
}

function Tag({ children, color }) {
  return (
    <span style={{
      fontSize:9, fontWeight:600, fontFamily:F.m, letterSpacing:"0.07em",
      textTransform:"uppercase", padding:"3px 9px", borderRadius:20,
      background:gl(color,0.13), color, border:`1px solid ${gl(color,0.28)}`,
      whiteSpace:"nowrap",
    }}>{children}</span>
  );
}

// Chip de metadado (usado no hero do overview)
function MetaChip({ icon, color, children }) {
  const D = useD();
  return (
    <span style={{display:"inline-flex", alignItems:"center", gap:6,
      background:D.bg2, border:`1px solid ${D.bdr}`, borderRadius:20,
      padding:"5px 12px", fontSize:10, color:D.t1, fontFamily:F.m,
      whiteSpace:"nowrap"}}>
      <i className={`ti ${icon}`} style={{fontSize:11, color}}/>
      {children}
    </span>
  );
}

function IconBox({ icon, color, size=36 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:size*0.3, flexShrink:0,
      background:`linear-gradient(145deg, ${gl(color,0.18)}, ${gl(color,0.06)})`,
      border:`1px solid ${gl(color,0.22)}`,
      boxShadow:`inset 0 1px 0 ${gl(color,0.15)}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      color, fontSize:size*0.45,
    }}>
      <i className={`ti ${icon}`}/>
    </div>
  );
}

// Painel base: vidro elevado + hover lift + glow na cor do tema
function Panel({ color, children, style, className="", hoverable=true }) {
  const D = useD();
  return (
    <div
      className={`${hoverable?"zf-card":""} ${className}`}
      style={{
        background:D.bg2, border:`1px solid ${D.bdr}`, borderRadius:16,
        overflow:"hidden", boxShadow:`0 1px 4px ${D.shadow}`,
        "--glow": color ? gl(color,0.10) : "rgba(0,0,0,0.2)",
        "--bdr-hover": color ? gl(color,0.3) : D.bdr2,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PanelHeader({ title, sub, right, accent }) {
  const D = useD();
  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
      gap:12, padding:"16px 20px", borderBottom:`1px solid ${D.bdr}`}}>
      <div style={{minWidth:0, display:"flex", gap:10, alignItems:"stretch"}}>
        {accent && <span aria-hidden="true" style={{width:3, borderRadius:2, flexShrink:0,
          background:`linear-gradient(180deg, ${accent}, ${gl(accent,0.15)})`}}/>}
        <div>
          <div style={{fontSize:13, fontWeight:600, color:D.t0, fontFamily:F.h, letterSpacing:"-0.01em"}}>{title}</div>
          {sub && <div style={{fontSize:10.5, color:D.t2, marginTop:3}}>{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  const D = useD();
  return (
    <Panel color={color} style={{padding:"16px 18px", display:"flex", alignItems:"center",
      gap:14}}>
      <IconBox icon={icon} color={color} size={40}/>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:9, fontWeight:500, fontFamily:F.m, letterSpacing:"0.11em",
          textTransform:"uppercase", color:D.t2, marginBottom:5}}>{label}</div>
        <div style={{fontSize:24, fontWeight:700, lineHeight:1, color:D.t0,
          letterSpacing:"-0.03em", fontFamily:F.h, fontVariantNumeric:"tabular-nums"}}>{value}</div>
        {sub && <div style={{fontSize:10.5, color:D.t1, marginTop:4,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{sub}</div>}
      </div>
    </Panel>
  );
}

// ─── AREA CHART ──────────────────────────────────────────────────────────────
function FunnelAreaChart({ campKey, info, M, color, animBegin = 0 }) {
  const D = useD();
  const vals = info.cols.map(c => M[c] ?? 0);
  const data = info.etapas.map((name,i) => ({ name, value:vals[i] }));
  const id = `area${campKey.replace(/\W/g,"")}`;
  const TT = ({ active, payload }) => {
    if (!active||!payload?.length) return null;
    return (
      <div style={{background:D.bg3, border:`1px solid ${D.bdr2}`, borderRadius:10,
        padding:"10px 14px", fontFamily:F.b, boxShadow:`0 8px 24px ${D.shadow}`}}>
        <div style={{fontSize:10, color:D.t1, marginBottom:3}}>{payload[0].payload.name}</div>
        <div style={{fontSize:16, fontWeight:600, color:D.t0, fontFamily:F.h,
          fontVariantNumeric:"tabular-nums"}}>{fmtNum(payload[0].value)}</div>
        <div style={{fontSize:9, fontFamily:F.m, color:gl(color,0.85), marginTop:2}}>
          {fmtPct(vals[0], payload[0].value)} do topo
        </div>
      </div>
    );
  };
  return (
    <div style={{width:"100%", height:140}}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{top:8,right:8,bottom:0,left:-20}}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32}/>
              <stop offset="100%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={D.bdr}/>
          <XAxis dataKey="name" tick={{fontSize:9,fill:D.t2,fontFamily:F.m}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fontSize:9,fill:D.t2,fontFamily:F.m}} axisLine={false} tickLine={false} tickFormatter={v=>fmtNum(v)}/>
          <Tooltip content={<TT/>} cursor={{stroke:gl(color,0.3), strokeDasharray:"3 3"}}/>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5}
            isAnimationActive={!prefersReduced()}
            animationDuration={900} animationBegin={animBegin} animationEasing="ease-out"
            fill={`url(#${id})`} dot={{fill:color,strokeWidth:0,r:3}}
            activeDot={{r:5.5,fill:color,stroke:D.bg2,strokeWidth:2}}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── DONUT ───────────────────────────────────────────────────────────────────
function DonutChart({ labels, values, colors }) {
  const D = useD();
  const [idx, setIdx] = useState(null);
  const total = values.reduce((a,b)=>a+b,0);
  const data  = labels.map((l,i)=>({name:l,value:values[i]}));
  const TT = ({ active, payload }) => {
    if (!active||!payload?.length) return null;
    const p = payload[0];
    return (
      <div style={{background:D.bg3, border:`1px solid ${D.bdr2}`, borderRadius:10,
        padding:"10px 14px", boxShadow:`0 8px 24px ${D.shadow}`}}>
        <div style={{fontSize:10,color:D.t1,marginBottom:2}}>{p.name}</div>
        <div style={{fontSize:15,fontWeight:600,color:D.t0,fontFamily:F.h,
          fontVariantNumeric:"tabular-nums"}}>{fmtNum(p.value)}</div>
        <div style={{fontSize:9,fontFamily:F.m,color:D.t2,marginTop:2}}>{fmtPct(total,p.value)}</div>
      </div>
    );
  };
  return (
    <div style={{display:"flex", alignItems:"center", gap:24}}>
      <div style={{position:"relative", width:134, height:134, flexShrink:0}}>
        <ResponsiveContainer width={134} height={134}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%"
              innerRadius="60%" outerRadius="82%" paddingAngle={3} strokeWidth={0}
              cornerRadius={3}
              isAnimationActive={!prefersReduced()} animationDuration={800}
              onMouseEnter={(_,i)=>setIdx(i)} onMouseLeave={()=>setIdx(null)}>
              {data.map((_,i)=>(
                <Cell key={i} fill={colors[i%colors.length]}
                  opacity={idx===null||idx===i?1:0.28}
                  style={{transition:"opacity .18s", cursor:"pointer"}}/>
              ))}
            </Pie>
            <Tooltip content={<TT/>}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
          <div style={{fontSize:19,fontWeight:700,color:D.t0,lineHeight:1,fontFamily:F.h,
            letterSpacing:"-0.02em",fontVariantNumeric:"tabular-nums"}}>
            {idx!==null?fmtNum(values[idx]):<AnimatedNumber value={total}/>}
          </div>
          <div style={{fontSize:7,fontFamily:F.m,color:D.t2,letterSpacing:"0.12em",marginTop:4,textTransform:"uppercase"}}>
            {idx!==null?labels[idx]:"total"}
          </div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:9}}>
        {labels.map((l,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,
            opacity:idx===null||idx===i?1:0.35,transition:"opacity .15s",cursor:"default"}}
            onMouseEnter={()=>setIdx(i)} onMouseLeave={()=>setIdx(null)}>
            <div style={{width:7,height:7,borderRadius:2.5,background:colors[i%colors.length],flexShrink:0,
              boxShadow:`0 0 4px ${gl(colors[i%colors.length],0.28)}`}}/>
            <div style={{flex:1,fontSize:11,color:D.t1}}>{l}</div>
            <div style={{fontSize:11,fontFamily:F.m,fontWeight:600,color:D.t0,
              fontVariantNumeric:"tabular-nums"}}>{fmtNum(values[i])}</div>
            <div style={{fontSize:9,fontFamily:F.m,color:D.t2,width:36,textAlign:"right",
              fontVariantNumeric:"tabular-nums"}}>{fmtPct(total,values[i])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CAMPAIGN TABLE ROW ───────────────────────────────────────────────────────
function CampTableRow({ rank, name, icon, leads, conv, convClr, subLabel, subValue, color, onClick, isLast }) {
  const D = useD();
  const [hov, setHov] = useState(false);
  return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      className="zf-focus zf-row"
      style={{display:"flex",alignItems:"center",gap:14,padding:"13px 20px",width:"100%",
        cursor:"pointer", background:hov?D.bg3:"transparent", border:"none",
        borderBottom:isLast?"none":`1px solid ${D.bdr}`,
        transition:"background .12s", textAlign:"left", fontFamily:F.b,
        animationDelay:`${rank*60}ms`}}>
      <div style={{fontSize:10,fontFamily:F.m,color:hov?gl(color,0.9):D.t2,width:18,flexShrink:0,
        textAlign:"center",transition:"color .12s"}}>{String(rank).padStart(2,"0")}</div>
      <IconBox icon={icon} color={color} size={34}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12.5,fontWeight:600,color:D.t0,overflow:"hidden",
          textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
        <div style={{fontSize:10,color:D.t1,marginTop:2}}>{subLabel}:{" "}
          <span style={{color:D.t0,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmtNum(subValue)}</span></div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:14,fontWeight:700,color:D.t0,fontFamily:F.h,
          fontVariantNumeric:"tabular-nums"}}>{fmtNum(leads)}</div>
        <div style={{fontSize:9,color:D.t2,fontFamily:F.m,marginTop:1}}>leads</div>
      </div>
      <div style={{textAlign:"right",width:52,flexShrink:0}}>
        <div style={{fontSize:13,fontWeight:600,color:convClr,fontFamily:F.m,
          fontVariantNumeric:"tabular-nums"}}>{conv}</div>
        <div style={{fontSize:9,color:D.t2,fontFamily:F.m,marginTop:1}}>conv.</div>
      </div>
      <div style={{width:60,flexShrink:0}}>
        <Bar value={parseFloat(conv)} height={4} radius={2} delay={rank*120}
          track={gl(color,0.14)}
          fill={`linear-gradient(90deg,${gl(color,0.7)},${color})`}/>
      </div>
      <i className="ti ti-chevron-right" style={{fontSize:14,flexShrink:0,
        color:hov?gl(color,0.9):D.t2, transform:hov?"translateX(2px)":"translateX(0)",
        transition:"color .12s, transform .15s"}}/>
    </button>
  );
}

// ─── SKELETON (loading) ──────────────────────────────────────────────────────
function Sk({ h=14, w="100%", r=8, style }) {
  return <div className="zf-shimmer" style={{height:h,width:w,borderRadius:r,...style}}/>;
}
function LoadingSkeleton({ mob }) {
  const D = useD();
  const card = {background:D.bg2, border:`1px solid ${D.bdr}`, borderRadius:16, padding:18};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}} aria-busy="true" aria-label="Carregando dados">
      <div>
        <Sk h={20} w={220}/><Sk h={11} w={300} style={{marginTop:10}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{...card, display:"flex", gap:14, alignItems:"center"}}>
            <Sk h={40} w={40} r={12}/>
            <div style={{flex:1}}><Sk h={9} w="60%"/><Sk h={20} w="45%" style={{marginTop:8}}/></div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"3fr 2fr",gap:14}}>
        <div style={card}>
          {[0,1,2].map(i=><Sk key={i} h={44} style={{marginBottom:i<2?12:0}}/>)}
        </div>
        <div style={{...card, display:"flex", alignItems:"center", gap:20}}>
          <Sk h={120} w={120} r={"50%"}/>
          <div style={{flex:1}}>{[0,1,2].map(i=><Sk key={i} h={11} style={{marginBottom:i<2?10:0}}/>)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── FUNNEL DETAIL ───────────────────────────────────────────────────────────
function FunnelDetail({ campKey, info, M, color, onBack }) {
  const D = useD();
  const mob = useIsMobile();
  const vals = info.cols.map(c => M[c] ?? 0);
  const topo = vals[0] || 1;
  const finalConv = safePct(topo, vals[vals.length-1]);
  const convClr = finalConv>60?D.ok:finalConv>30?D.warn:D.err;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div className="zf-in" style={{display:"flex",alignItems:"center",gap:11}}>
        <button onClick={onBack} aria-label="Voltar para o dashboard" className="zf-focus"
          style={{width:34,height:34,borderRadius:10,background:gl(color,0.1),
            border:`1px solid ${gl(color,0.22)}`,display:"flex",alignItems:"center",
            justifyContent:"center",color,cursor:"pointer",fontSize:15,
            transition:"background .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=gl(color,0.18);}}
          onMouseLeave={e=>{e.currentTarget.style.background=gl(color,0.1);}}>
          <i className="ti ti-arrow-left"/>
        </button>
        <IconBox icon={info.icon} color={color} size={34}/>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:D.t0,fontFamily:F.h,letterSpacing:"-0.01em"}}>{campKey}</div>
          <div style={{fontSize:10.5,color:D.t1,marginTop:1}}>Detalhe da automação</div>
        </div>
      </div>

      <div className="zf-in" style={{animationDelay:".05s",display:"grid",
        gridTemplateColumns:mob?"1fr 1fr":`repeat(${Math.min(info.cols.length,5)},1fr)`,gap:10}}>
        {info.etapas.map((etapa,i)=>(
          <Panel key={i} color={color} style={{
            background:i===0?gl(color,0.08):D.bg2,
            border:`1px solid ${i===0?gl(color,0.3):D.bdr}`,
            padding:"16px 18px",position:"relative"}}>
            {i===0&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,
              background:`linear-gradient(90deg,${color},${gl(color,0)})`}}/>}
            <div style={{fontSize:9,fontWeight:500,fontFamily:F.m,letterSpacing:"0.11em",
              textTransform:"uppercase",color:i===0?gl(color,0.85):D.t2,marginBottom:9}}>{etapa}</div>
            <div style={{fontSize:26,fontWeight:700,color:D.t0,lineHeight:1,fontFamily:F.h,
              letterSpacing:"-0.03em",fontVariantNumeric:"tabular-nums"}}>
              <AnimatedNumber value={vals[i]} delay={i*100}/>
            </div>
            {i>0&&<div style={{marginTop:8}}><Tag color={color}>{fmtPct(topo,vals[i])} do topo</Tag></div>}
          </Panel>
        ))}
      </div>

      <div className="zf-in" style={{animationDelay:".1s",display:"grid",
        gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:14}}>
        <Panel color={color}>
          <PanelHeader title="Funil da automação" sub="Volume por etapa" accent={color}/>
          <div style={{padding:"12px 20px 16px"}}>
            <FunnelAreaChart campKey={campKey} info={info} M={M} color={color}/>
          </div>
        </Panel>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Panel color={color} style={{flex:1}}>
            <PanelHeader title="Conversão por etapa" sub="% do topo que chegou a cada passo" accent={color}/>
            <div style={{padding:"8px 20px 14px"}}>
              {info.etapas.slice(1).map((e,i)=>{
                const r=safePct(topo,vals[i+1]);
                const clr=r>70?D.ok:r>40?color:r>20?D.warn:D.err;
                return (
                  <div key={i}>
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                      <div style={{fontSize:11,color:D.t1,flex:"0 0 130px",lineHeight:1.3}}>Topo → {e}</div>
                      <div style={{flex:1}}>
                        <Bar value={r} height={5} radius={3} delay={i*130}
                          track={gl("#000",0.08)}
                          fill={`linear-gradient(90deg,${gl(clr,0.7)},${clr})`}/>
                      </div>
                      <div style={{fontSize:11,fontWeight:600,fontFamily:F.m,color:clr,width:44,
                        textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{r.toFixed(1)}%</div>
                    </div>
                    {i<info.etapas.length-2&&<Divider/>}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel color={color} style={{
            background:gl(color,0.07),border:`1px solid ${gl(color,0.22)}`,
            padding:"18px 20px",position:"relative",
            boxShadow:`0 0 18px ${gl(color,0.06)}`}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,
              background:`linear-gradient(90deg,${color},${gl(color,0)})`}}/>
            <div style={{fontSize:9,fontWeight:500,fontFamily:F.m,letterSpacing:"0.11em",
              textTransform:"uppercase",color:gl(color,0.75),marginBottom:10}}>Conversão final</div>
            <div style={{fontSize:42,fontWeight:700,color:convClr,letterSpacing:"-0.04em",
              lineHeight:1,marginBottom:8,fontFamily:F.h,fontVariantNumeric:"tabular-nums"}}>
              <AnimatedNumber value={finalConv} duration={1100} format={(n)=>`${n.toFixed(1)}%`}/>
            </div>
            <div style={{fontSize:11,color:D.t1}}>
              <span style={{color:D.t0,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmtNum(topo)}</span> entraram ·{" "}
              <span style={{color:D.t0,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmtNum(vals[vals.length-1])}</span> converteram
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
function Overview({ ecoKey, M, theme, onSelect, timeStr }) {
  const D = useD();
  const mob = useIsMobile();
  const camps = Object.entries(CAMPANHAS[ecoKey]);
  const colors = [theme.c0, theme.c1, theme.c2, theme.c3];
  const total = camps.reduce((acc,[,info])=>acc+(M[info.cols[0]]??0),0);
  const totalConv = camps.reduce((acc,[,info])=>{acc+=M[info.kpi_sub_col]??0;return acc;},0);
  const bestCamp = camps.reduce((best,[key,info])=>{
    const conv=safePct(M[info.cols[0]]??0,M[info.kpi_sub_col]??0);
    return conv>(best.conv||0)?{key,conv}:best;
  },{});
  const cLabels = camps.map(([k])=>k.split(" ")[0]+(k.split(" ")[1]?" "+k.split(" ")[1].slice(0,4)+".":""));
  const cVals   = camps.map(([,info])=>M[info.cols[0]]??0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div className="zf-in" style={{textAlign:"center",padding:"6px 0 2px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
          <span className="zf-live" style={{width:6,height:6,borderRadius:"50%",
            background:theme.c0,flexShrink:0}}/>
          <span style={{fontSize:9,fontWeight:600,fontFamily:F.m,letterSpacing:"0.16em",
            textTransform:"uppercase",color:gl(theme.c0,0.85)}}>
            Visão geral · {theme.name}
          </span>
        </div>
        <div style={{fontSize:mob?27:34,fontWeight:700,fontFamily:F.h,
          letterSpacing:"-0.03em",lineHeight:1.05,width:"fit-content",
          margin:"0 auto",
          background:`linear-gradient(115deg, ${D.t0} 45%, ${theme.c0} 100%)`,
          WebkitBackgroundClip:"text",backgroundClip:"text",
          WebkitTextFillColor:"transparent",color:"transparent"}}>
          Olá, We Worker!
        </div>
        <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginTop:14}}>
          <MetaChip icon="ti-bolt" color={theme.c0}>
            {camps.length} campanha{camps.length>1?"s":""} ativa{camps.length>1?"s":""}
          </MetaChip>
          {timeStr && (
            <MetaChip icon="ti-clock" color={D.ok}>Atualizado às {timeStr}</MetaChip>
          )}
          <MetaChip icon="ti-plug-connected" color={theme.c1}>ManyChat · Google Sheets</MetaChip>
        </div>
      </div>

      <div className="zf-in" style={{animationDelay:".05s",display:"grid",
        gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
        <StatCard icon="ti-users" label="Total na base" value={<AnimatedNumber value={total}/>} sub="entradas nos funis" color={theme.c0}/>
        <StatCard icon="ti-brand-whatsapp" label="Conversões" value={<AnimatedNumber value={totalConv} delay={100}/>} sub={`${fmtPct(total,totalConv)} do total`} color={D.ok}/>
        <StatCard icon="ti-trophy" label="Melhor campanha" value={<AnimatedNumber value={bestCamp.conv??0} delay={200} format={(n)=>`${n.toFixed(1)}%`}/>} sub={bestCamp.key} color={theme.c1}/>
        <StatCard icon="ti-bolt" label="Campanhas ativas" value={<AnimatedNumber value={camps.length} delay={300} duration={600}/>} sub="automações ManyChat" color={theme.c2}/>
      </div>

      <div className="zf-in" style={{animationDelay:".1s",display:"grid",
        gridTemplateColumns:mob?"1fr":"3fr 2fr",gap:14}}>
        <Panel color={theme.c0}>
          <PanelHeader title="Top Campanhas" sub="Clique em uma campanha para ver o detalhe" accent={theme.c0}
            right={<Tag color={theme.c0}>ManyChat</Tag>}/>
          {camps.map(([key,info],i)=>{
            const leads=M[info.cols[0]]??0;
            const subV=M[info.kpi_sub_col]??0;
            const conv=safePct(leads,subV);
            const clr=conv>60?D.ok:conv>30?D.warn:D.err;
            return (
              <CampTableRow key={key} rank={i+1} name={key} icon={info.icon}
                leads={leads} conv={`${conv.toFixed(1)}%`} convClr={clr}
                subLabel={info.kpi_sub_label} subValue={subV}
                color={colors[i%colors.length]}
                onClick={()=>onSelect(key)} isLast={i===camps.length-1}/>
            );
          })}
        </Panel>

        <Panel color={theme.c0}>
          <PanelHeader title="Distribuição" sub="Participação percentual por campanha" accent={theme.c0}/>
          <div style={{padding:"20px"}}>
            <DonutChart labels={cLabels} values={cVals} colors={colors}/>
          </div>
        </Panel>
      </div>

      <Panel color={theme.c0} className="zf-in" style={{animationDelay:".15s"}}>
        <PanelHeader title="Funis por automação" sub="Volume relativo ao topo de cada campanha" accent={theme.c0}/>
        <div style={{padding:"20px",display:"grid",
          gridTemplateColumns:mob?"1fr":"repeat(auto-fit,minmax(220px,1fr))",gap:24}}>
          {camps.map(([key,info],i)=>{
            const clr=colors[i%colors.length];
            return (
              <div key={key}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <IconBox icon={info.icon} color={clr} size={24}/>
                  <span style={{fontSize:10,fontWeight:600,fontFamily:F.m,
                    letterSpacing:"0.09em",textTransform:"uppercase",color:D.t2}}>{key.split(" ")[0]}</span>
                </div>
                <FunnelAreaChart campKey={key} info={info} M={M} color={clr} animBegin={i*180}/>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel color={theme.c0} className="zf-in" style={{animationDelay:".2s"}}>
        <PanelHeader title="Taxas de conversão" sub="% do topo que avançou em cada etapa" accent={theme.c0}/>
        <div style={{padding:"8px 20px 16px",display:"grid",
          gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 40px"}}>
          {camps.flatMap(([key,info],ci)=>{
            const topo=M[info.cols[0]]??0;
            const clr=colors[ci%colors.length];
            return info.cols.slice(1).map((col,i)=>{
              const r=safePct(topo,M[col]??0);
              const rClr=r>70?D.ok:r>40?clr:r>20?D.warn:D.err;
              return (
                <div key={`${key}${i}`}>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flex:"0 0 170px"}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:clr,flexShrink:0,
                        boxShadow:`0 0 4px ${gl(clr,0.28)}`}}/>
                      <span style={{fontSize:11,color:D.t1,lineHeight:1.3}}>
                        {key.split(" ")[0]} → {info.etapas[i+1]}
                      </span>
                    </div>
                    <div style={{flex:1}}>
                      <Bar value={r} height={5} radius={3} delay={(ci*3+i)*70}
                        track={gl("#000",0.07)}
                        fill={`linear-gradient(90deg,${gl(rClr,0.7)},${rClr})`}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,fontFamily:F.m,color:rClr,width:44,
                      textAlign:"right",fontVariantNumeric:"tabular-nums"}}>
                      {r>0?`${r.toFixed(1)}%`:"—"}
                    </span>
                  </div>
                  <Divider/>
                </div>
              );
            });
          })}
        </div>
      </Panel>
    </div>
  );
}

// ─── SIDEBAR ITEM ─────────────────────────────────────────────────────────────
function SidebarItem({ icon, label, count, active, onClick, color }) {
  const D = useD();
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      className="zf-focus"
      style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
        width:"calc(100% - 16px)",margin:"0 8px 2px",borderRadius:10,
        fontSize:12,fontWeight:active?600:450,
        color:active?D.t0:hov?D.t0:D.t1,
        background:active?gl(color,0.12):hov?gl(color,0.05):"transparent",
        border:`1px solid ${active?gl(color,0.22):"transparent"}`,
        cursor:"pointer",transition:"all .15s",
        textAlign:"left",fontFamily:F.b}}>
      <i className={`ti ${icon}`} style={{fontSize:15,flexShrink:0,
        color:active?color:"inherit",
        filter:active?`drop-shadow(0 0 4px ${gl(color,0.3)})`:"none"}}/>
      <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
      {count&&(
        <span style={{fontSize:9,fontFamily:F.m,fontWeight:600,
          color:active?gl(color,0.95):D.t2,
          background:active?gl(color,0.14):gl("#888",0.1),
          padding:"2px 7px",borderRadius:20,fontVariantNumeric:"tabular-nums"}}>{count}</span>
      )}
    </button>
  );
}

// ─── ECOSYSTEM PAGE ───────────────────────────────────────────────────────────
function EcosystemPage({ ecoKey }) {
  const D = useD();
  const mode = useTheme();
  const theme = THEMES[ecoKey];
  const { rows, boolCols, error, loading, lastSync, reload } = useData(URLS[ecoKey]);
  const [sel, setSel] = useState("overview");
  const [sideOpen, setSideOpen] = useState(false);
  const mob = useIsMobile();
  const M = useMemo(()=>(!rows||!boolCols)?{}:buildMetrics(rows,boolCols),[rows,boolCols]);
  const camps = Object.entries(CAMPANHAS[ecoKey]);
  const colors = [theme.c0, theme.c1, theme.c2, theme.c3];
  const timeStr = lastSync?.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  const selColor = (sel==="overview"||!CAMPANHAS[ecoKey][sel])
    ? theme.c0
    : colors[camps.findIndex(([k])=>k===sel)%colors.length] ?? theme.c0;

  // Volta ao topo ao navegar entre Dashboard e detalhe (evita entrar no meio da página)
  const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top:0 }); }, [sel]);

  // Esc fecha a sidebar no mobile
  useEffect(() => {
    if (!sideOpen) return;
    const fn = (e) => { if (e.key === "Escape") setSideOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [sideOpen]);

  return (
    <div style={{display:"flex",flex:1,minHeight:0}}>
      {mob&&sideOpen&&(
        <div onClick={()=>setSideOpen(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",
            backdropFilter:"blur(2px)",zIndex:80}}/>
      )}

      <nav style={{
        width:230,flexShrink:0,background:D.bg1,
        borderRight:`1px solid ${D.bdr}`,display:"flex",flexDirection:"column",
        ...(mob?{position:"fixed",top:0,left:0,bottom:0,zIndex:90,
          transform:sideOpen?"translateX(0)":"translateX(-100%)",
          transition:"transform 0.25s cubic-bezier(.4,0,.2,1)",
          boxShadow:sideOpen?`8px 0 32px ${D.shadow}`:"none"}:
          {position:"sticky",top:58,height:"calc(100vh - 58px)",overflow:"hidden auto"})
      }}>
        <div style={{padding:"18px 16px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:11,
            background:`linear-gradient(135deg, ${gl(theme.c0,0.12)}, ${gl(theme.c3,0.06)})`,
            border:`1px solid ${gl(theme.c0,0.22)}`,
            borderRadius:12,padding:"11px 12px",
            boxShadow:`inset 0 1px 0 ${gl(theme.c0,0.1)}`}}>
            <div style={{width:34,height:34,borderRadius:10,flexShrink:0,
              background:`linear-gradient(135deg,${theme.c0},${theme.c3})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:15,fontWeight:700,color:"#fff",fontFamily:F.h,
              boxShadow:`0 0 9px ${gl(theme.c0,0.25)}`}}>{theme.avatar}</div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:D.t0,fontFamily:F.h,
                letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",
                whiteSpace:"nowrap"}}>{theme.name}</div>
              <div style={{fontSize:8,color:D.t2,fontFamily:F.m,letterSpacing:"0.09em",marginTop:2}}>WE LOVE · ANALYTICS</div>
            </div>
          </div>
        </div>

        <Divider/>
        <div style={{padding:"10px 0 6px"}}>
          <div style={{fontSize:8,fontWeight:600,fontFamily:F.m,letterSpacing:"0.14em",
            textTransform:"uppercase",color:D.t2,padding:"0 20px 8px"}}>Visão geral</div>
          <SidebarItem icon="ti-layout-dashboard" label="Dashboard"
            active={sel==="overview"} onClick={()=>{setSel("overview");if(mob)setSideOpen(false);}}
            color={theme.c0}/>
        </div>

        <Divider/>
        <div style={{padding:"10px 0 6px"}}>
          <div style={{fontSize:8,fontWeight:600,fontFamily:F.m,letterSpacing:"0.14em",
            textTransform:"uppercase",color:D.t2,padding:"0 20px 8px"}}>Campanhas</div>
          {camps.map(([key,info],i)=>{
            const count=M[info.cols[0]]??0;
            return (
              <SidebarItem key={key} icon={info.icon}
                label={key.length>18?key.slice(0,16)+"…":key}
                count={count>0?fmtNum(count):null}
                active={sel===key}
                onClick={()=>{setSel(key);if(mob)setSideOpen(false);}}
                color={colors[i%colors.length]}/>
            );
          })}
        </div>

        <div style={{marginTop:"auto",padding:"14px 16px",borderTop:`1px solid ${D.bdr}`}}>
          {timeStr&&(
            <div style={{fontSize:9,fontFamily:F.m,color:D.t2,marginBottom:10,
              display:"flex",alignItems:"center",gap:6}}>
              <span className="zf-live" style={{width:6,height:6,borderRadius:"50%",
                background:D.ok,flexShrink:0}}/>
              Atualizado às {timeStr}
            </div>
          )}
          <button onClick={reload} disabled={loading} className="zf-focus"
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,
              fontSize:10,fontFamily:F.m,fontWeight:600,
              color:loading?D.t2:D.t1,background:"transparent",
              border:`1px solid ${D.bdr}`,borderRadius:10,
              padding:"9px 0",cursor:loading?"default":"pointer",width:"100%",transition:"all .15s"}}
            onMouseEnter={e=>{if(!loading)e.currentTarget.style.background=gl(theme.c0,0.07);}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <i className={`ti ti-refresh${loading?" spinning":""}`} style={{fontSize:13}}/>
            {loading?"Sincronizando…":"Sincronizar"}
          </button>
        </div>
      </nav>

      <div ref={scrollRef} style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",
        background:D.bg,overflowX:"hidden",height:"calc(100vh - 58px)",overflowY:"auto",
        position:"relative"}}>

        {/* Assinatura: glow ambiente na cor do ecossistema/campanha ativa */}
        <div aria-hidden="true" style={{
          position:"absolute", top:-180, left:"50%", transform:"translateX(-50%)",
          width:"min(900px, 120%)", height:480, pointerEvents:"none", zIndex:0,
          background:`radial-gradient(ellipse at center, ${gl(selColor, mode==="dark"?0.07:0.045)} 0%, transparent 65%)`,
          transition:"background .5s ease",
        }}/>

        {mob&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"10px 14px",
            background:mode==="dark"?gl("#0E0E0E",0.85):gl("#FFFFFF",0.85),
            backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
            borderBottom:`1px solid ${D.bdr}`,
            position:"sticky",top:0,zIndex:40,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setSideOpen(v=>!v)} aria-label="Abrir menu" className="zf-focus"
                style={{width:32,height:32,borderRadius:9,background:gl(selColor,0.1),
                  border:`1px solid ${gl(selColor,0.2)}`,display:"flex",alignItems:"center",
                  justifyContent:"center",color:selColor,cursor:"pointer",fontSize:15}}>
                <i className="ti ti-menu-2"/>
              </button>
              <span style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:selColor,
                  boxShadow:`0 0 5px ${gl(selColor,0.35)}`,transition:"background .3s"}}/>
                <span style={{color:D.t0,fontWeight:600,fontFamily:F.h,letterSpacing:"-0.01em"}}>
                  {sel==="overview"?"Dashboard":sel}</span>
              </span>
            </div>
            {loading&&<span style={{fontSize:9,fontFamily:F.m,color:D.t2}}>Carregando…</span>}
          </div>
        )}

        <div style={{padding:mob?"16px 14px":"26px 28px",flex:1,position:"relative",zIndex:1}}>
          {error&&(
            <div style={{display:"flex",gap:12,alignItems:"flex-start",padding:"15px 18px",marginBottom:18,
              background:gl(D.err,0.08),border:`1px solid ${gl(D.err,0.22)}`,
              borderRadius:14,fontSize:11.5,color:D.err}}>
              <i className="ti ti-alert-circle" style={{fontSize:16,marginTop:1,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>Não foi possível carregar os dados do Google Sheets.</div>
                <div style={{fontFamily:F.m,fontSize:9,opacity:0.65,marginTop:3}}>{error}</div>
              </div>
              <button onClick={reload} className="zf-focus"
                style={{flexShrink:0,fontSize:10,fontFamily:F.m,fontWeight:600,color:D.err,
                  background:gl(D.err,0.1),border:`1px solid ${gl(D.err,0.3)}`,
                  borderRadius:9,padding:"7px 14px",cursor:"pointer",transition:"background .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=gl(D.err,0.18);}}
                onMouseLeave={e=>{e.currentTarget.style.background=gl(D.err,0.1);}}>
                Tentar novamente
              </button>
            </div>
          )}
          {loading&&!error&&<LoadingSkeleton mob={mob}/>}
          {!loading&&!error&&rows&&(
            <div key={sel} className="zf-page">
              {sel==="overview"||!CAMPANHAS[ecoKey][sel]
                ?<Overview ecoKey={ecoKey} M={M} theme={theme} onSelect={setSel} timeStr={timeStr}/>
                :<FunnelDetail campKey={sel} info={CAMPANHAS[ecoKey][sel]} M={M}
                    color={colors[camps.findIndex(([k])=>k===sel)%colors.length]??theme.c0}
                    onBack={()=>setSel("overview")}/>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
  { label:"Laise Mesquita", ecoKey:"laise" },
  { label:"We Love Chile",  ecoKey:"chile" },
  { label:"We Love Peru",   ecoKey:"peru"  },
];

// ─── CLIENT SWITCHER (topbar) ────────────────────────────────────────────────
// Segmented control: o thumb desliza entre os clientes e assume a cor de cada um.
function ClientSwitcher({ tab, setTab, mob }) {
  const D = useD();
  const mode = useTheme();
  const n = TABS.length;
  const activeTheme = Object.values(THEMES)[tab];

  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setTab((tab+1)%n); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); setTab((tab+n-1)%n); }
  };

  return (
    <div role="tablist" aria-label="Selecionar cliente" onKeyDown={onKey}
      style={{display:"grid", gridTemplateColumns:`repeat(${n},1fr)`,
        position:"relative", padding:3, borderRadius:12,
        background: mode==="dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)",
        border:`1px solid ${D.bdr}`}}>

      {/* Thumb deslizante — muda de posição e de cor junto */}
      <div aria-hidden="true" style={{
        position:"absolute", top:3, bottom:3,
        width:`calc((100% - 6px) / ${n})`,
        left:`calc(3px + ${tab} * ((100% - 6px) / ${n}))`,
        borderRadius:9,
        background:gl(activeTheme.c0, mode==="dark"?0.11:0.09),
        border:`1px solid ${gl(activeTheme.c0,0.28)}`,
        boxShadow:`0 0 10px ${gl(activeTheme.c0,0.12)}, inset 0 1px 0 ${gl(activeTheme.c0,0.1)}`,
        transition:"left .32s cubic-bezier(.22,.68,.4,1), background .32s, border-color .32s, box-shadow .32s",
      }}/>

      {TABS.map((t,i)=>{
        const active = i===tab;
        const th = Object.values(THEMES)[i];
        return (
          <button key={i} role="tab" aria-selected={active}
            tabIndex={active?0:-1}
            onClick={()=>setTab(i)}
            className="zf-focus"
            title={t.label}
            style={{position:"relative", zIndex:1,
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              fontFamily:F.b, fontSize:mob?10:11.5, fontWeight:active?600:450,
              color:active?D.t0:D.t1,
              background:"transparent", border:"none", borderRadius:9,
              padding:mob?"6px 8px":"6px 14px",
              cursor:"pointer", transition:"color .2s", whiteSpace:"nowrap"}}
            onMouseEnter={e=>{if(!active)e.currentTarget.style.color=D.t0;}}
            onMouseLeave={e=>{if(!active)e.currentTarget.style.color=D.t1;}}>
            <span style={{width:mob?18:17, height:mob?18:17, borderRadius:5, flexShrink:0,
              background:`linear-gradient(135deg,${th.c0},${th.c3})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:9, fontWeight:700, color:"#fff", fontFamily:F.h,
              opacity:active?1:0.55, transition:"opacity .2s, box-shadow .2s",
              boxShadow:active?`0 0 6px ${gl(th.c0,0.28)}`:"none"}}>{th.avatar}</span>
            {!mob && t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);
  const [mode, setMode] = useState(() => localStorage.getItem("zafra-theme") || "dark");
  const mob = useIsMobile();
  const D = PALETTES[mode];
  const activeTheme = Object.values(THEMES)[tab];

  useEffect(() => { localStorage.setItem("zafra-theme", mode); }, [mode]);

  return (
    <ThemeCtx.Provider value={mode}>
      <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",
        background:D.bg,fontFamily:F.b,color:D.t0,overflowX:"hidden",
        transition:"background .3s, color .3s"}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;450;500;600;700&family=DM+Mono:wght@400;500&display=swap');
          @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css');
          *{box-sizing:border-box;}
          html,body,#root{margin:0;padding:0;width:100%;min-height:100%;overflow-x:hidden;}
          body{background:${D.bg};transition:background .3s;}
          ::selection{background:${gl(activeTheme.c0,0.3)};}
          ::-webkit-scrollbar{width:5px;height:5px;}
          ::-webkit-scrollbar-track{background:transparent;}
          ::-webkit-scrollbar-thumb{background:${mode==="dark"?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"};border-radius:3px;}
          ::-webkit-scrollbar-thumb:hover{background:${mode==="dark"?"rgba(255,255,255,0.18)":"rgba(0,0,0,0.25)"};}

          @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          .spinning{animation:spin 1s linear infinite;display:inline-block;}

          /* Cards: lift + glow no hover */
          .zf-card{transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;}
          .zf-card:hover{transform:translateY(-2px);
            box-shadow:0 6px 20px var(--glow), 0 1px 4px ${D.shadow};
            border-color:var(--bdr-hover) !important;}

          /* Entrada em cascata das seções */
          @keyframes zfIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          .zf-in{animation:zfIn .45s cubic-bezier(.22,.68,.4,1) backwards;}

          /* Linhas de tabela entram em cascata (delay inline por linha) */
          @keyframes zfRow{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
          .zf-row{animation:zfRow .38s cubic-bezier(.22,.68,.4,1) backwards;}

          /* Transição ao navegar entre Dashboard e detalhe de campanha */
          @keyframes zfPage{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          .zf-page{animation:zfPage .32s ease-out backwards;}

          /* Pulso "ao vivo" — dados auto-atualizam a cada 5 min */
          @keyframes zfPing{0%{transform:scale(1);opacity:.45}70%,100%{transform:scale(2.3);opacity:0}}
          .zf-live{position:relative;}
          .zf-live::after{content:"";position:absolute;inset:0;border-radius:50%;
            background:inherit;animation:zfPing 2.4s cubic-bezier(0,0,.2,1) infinite;}

          /* Skeleton shimmer */
          @keyframes zfShimmer{from{background-position:200% 0}to{background-position:-200% 0}}
          .zf-shimmer{
            background:linear-gradient(90deg,
              ${mode==="dark"?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"} 25%,
              ${mode==="dark"?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.09)"} 50%,
              ${mode==="dark"?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"} 75%);
            background-size:200% 100%;
            animation:zfShimmer 1.4s linear infinite;
          }

          /* Foco de teclado visível em tudo que é interativo */
          .zf-focus{outline:none;}
          .zf-focus:focus-visible{outline:2px solid ${gl(activeTheme.c0,0.7)};outline-offset:2px;}

          /* Acessibilidade: respeita preferência por menos movimento */
          @media (prefers-reduced-motion: reduce){
            .zf-in,.zf-row,.zf-page{animation:none;}
            .zf-live::after{animation:none;display:none;}
            .zf-card, .zf-card:hover{transform:none;transition:none;}
            .zf-shimmer{animation:none;}
            *{transition-duration:.01ms !important;animation-duration:.01ms !important;}
          }
        `}</style>

        {/* Grain sutil sobre toda a UI — tira o aspecto "flat" de tela gerada */}
        <div aria-hidden="true" style={{position:"fixed", inset:0, zIndex:999,
          pointerEvents:"none", mixBlendMode:"soft-light",
          opacity:mode==="dark"?0.08:0.05,
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>

        {/* Global topbar */}
        <div style={{display:"flex",alignItems:"center",
          background:D.bg1,borderBottom:`1px solid ${D.bdr}`,
          padding:mob?"0 14px":"0 24px",
          position:"sticky",top:0,zIndex:50,height:58,flexShrink:0,
          boxShadow:`0 1px 4px ${D.shadow}`,
          transition:"background .3s, border-color .3s"}}>

          <div style={{display:"flex",alignItems:"center",marginRight:mob?12:24,flexShrink:0}}>
            <img src={zafraLogo} alt="Zafra"
              style={{height:mob?34:46,width:"auto",objectFit:"contain",
                transition:"filter .4s",
                filter:mode==="dark"
                  ?`drop-shadow(0 0 7px ${gl(activeTheme.c0,0.18)})`
                  :`drop-shadow(0 0 5px ${gl(activeTheme.c0,0.12)}) brightness(0)`}}/>
          </div>

          <div style={{width:1,height:18,background:D.bdr,marginRight:mob?12:20}}/>

          <ClientSwitcher tab={tab} setTab={setTab} mob={mob}/>

          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:12}}>
            <ThemeToggle mode={mode} onChange={setMode}/>
            <img src={manychatLogo} alt="ManyChat"
              style={{height:mob?20:28,width:"auto",objectFit:"contain",
                opacity:mode==="dark"?0.65:0.5,
                filter:mode==="light"?"brightness(0)":"none"}}/>
          </div>
        </div>

        <div style={{display:"flex",flex:1}}>
          <EcosystemPage key={TABS[tab].ecoKey} ecoKey={TABS[tab].ecoKey}/>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}