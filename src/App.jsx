import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import zafraLogo from "./zafra_logo_branca.png";
import manychatLogo from "./manychat_logo_branca.png";

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

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const D = {
  bg:    "#080808",
  bg1:   "#0E0E0E",
  bg2:   "#141414",
  bg3:   "#1A1A1A",
  bg4:   "#202020",
  bdr:   "rgba(255,255,255,0.07)",
  bdr2:  "rgba(255,255,255,0.12)",
  t0:    "#F0EEF6",
  t1:    "#8A8799",
  t2:    "#3F3D52",
  ok:    "#2EC98A",
  warn:  "#D9922A",
  err:   "#E04444",
};
const F = {
  h: "'Montserrat', system-ui, sans-serif",
  b: "'Montserrat', system-ui, sans-serif",
  m: "'DM Mono', 'Fira Mono', monospace",
};
const gl = (hex, op) => {
  const h = hex.replace("#","");
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${op})`;
};

// ─── ECOSYSTEM THEMES ────────────────────────────────────────────────────────
const THEMES = {
  laise: {
    name: "Laise Mesquita",
    sub:  "We Love · Analytics",
    avatar: "L",
    c0: "#E8527A", c1: "#C43D63", c2: "#9E2E4E", c3: "#72203A",
    label: "rosa",
  },
  chile: {
    name: "We Love Chile",
    sub:  "We Love · Analytics",
    avatar: "C",
    c0: "#CC1A1A", c1: "#A51515", c2: "#7D1010", c3: "#550B0B",
    label: "vermelho",
  },
  peru: {
    name: "We Love Peru",
    sub:  "We Love · Analytics",
    avatar: "P",
    c0: "#1A7A3A", c1: "#156130", c2: "#0F4A24", c3: "#093318",
    label: "verde",
  },
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
    "Envio de PDF":           { icon:"ti-file-type-pdf", cols:["Envio de PDF - Iniciou","Envio de PDF - Interessou","Envio de PDF -  Mandou Wpp","Envio de PDF -  Acessou PDF"], etapas:["Iniciou","Interessou","Mandou Wpp","Acessou PDF"], kpi_sub_col:"Envio de PDF -  Acessou PDF", kpi_sub_label:"→ PDF" },
    "Envio de Link":          { icon:"ti-link", cols:["Envio de Link - Iniciou","Envio de Link - Interessou","Envio de Link - Mandou Wpp","Envio de Link - Acessou link"], etapas:["Iniciou","Interessou","Mandou Wpp","Acessou Link"], kpi_sub_col:"Envio de Link - Acessou link", kpi_sub_label:"→ Link" },
    "Envio WhatsApp":         { icon:"ti-brand-whatsapp", cols:["Envio WhatsApp - Iniciou","Envio WhatsApp - Interessou","Envio WhatsApp - Clicou wpp"], etapas:["Iniciou","Interessou","Clicou Wpp"], kpi_sub_col:"Envio WhatsApp - Clicou wpp", kpi_sub_label:"→ Wpp" },
    "Envio Mensagem Direct":  { icon:"ti-message-circle", cols:["Envio Mensagem Direct - Iniciou","Envio Mensagem Direct - Interessou","Envio Mensagem Direct - Mandou Wpp"], etapas:["Iniciou","Interessou","Mandou Wpp"], kpi_sub_col:"Envio Mensagem Direct - Mandou Wpp", kpi_sub_label:"→ Wpp" },
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
  const normalized = text.trim().replace(/\r\n|\r/g, "\n");
  const lines = normalized.split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = [];
    let cur = "", inQ = false;
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
  const boolCols = headers.filter(h => {
    if (!h) return false;
    return rows.length > 0 && rows.every(r => r[h] === true || r[h] === false);
  });
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
    } catch(e) { setSt(s => ({ ...s, error:e.message, loading:false })); }
  }, [url]);
  useEffect(() => { load(); const id = setInterval(load, 5*60*1000); return () => clearInterval(id); }, [load]);
  return { ...st, reload:load };
}

// ─── BASE COMPONENTS ─────────────────────────────────────────────────────────
function Divider() { return <div style={{height:1, background:D.bdr}}/>; }

function Tag({ children, color }) {
  return (
    <span style={{
      fontSize:9, fontWeight:700, fontFamily:F.m, letterSpacing:"0.07em",
      textTransform:"uppercase", padding:"3px 8px", borderRadius:6,
      background:gl(color,0.15), color, border:`1px solid ${gl(color,0.3)}`,
    }}>{children}</span>
  );
}

function IconBox({ icon, color, size=36 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:10, flexShrink:0,
      background:gl(color,0.12),
      display:"flex", alignItems:"center", justifyContent:"center",
      color, fontSize:size*0.45,
    }}>
      <i className={`ti ${icon}`}/>
    </div>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, delta }) {
  return (
    <div style={{
      background:D.bg2, border:`1px solid ${D.bdr}`, borderRadius:12,
      padding:"14px 16px", display:"flex", alignItems:"center", gap:14,
      position:"relative", overflow:"hidden",
      boxShadow:`inset 0 1px 0 rgba(255,255,255,0.04)`,
    }}>
      <div style={{position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,${color},${gl(color,0)})`, opacity:0.7}}/>
      <IconBox icon={icon} color={color} size={38}/>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:9, fontWeight:600, fontFamily:F.m, letterSpacing:"0.1em",
          textTransform:"uppercase", color:D.t2, marginBottom:4}}>{label}</div>
        <div style={{fontSize:22, fontWeight:700, lineHeight:1, color:D.t0,
          letterSpacing:"-0.02em", fontFamily:F.h}}>{value}</div>
        {sub && <div style={{fontSize:10, color:D.t1, marginTop:3}}>{sub}</div>}
      </div>
      {delta !== undefined && (
        <span style={{
          fontSize:10, fontWeight:700, fontFamily:F.m, flexShrink:0,
          color: delta >= 0 ? D.ok : D.err,
          background: delta >= 0 ? gl(D.ok,0.1) : gl(D.err,0.1),
          padding:"3px 8px", borderRadius:20,
          border:`1px solid ${delta >= 0 ? gl(D.ok,0.2) : gl(D.err,0.2)}`,
        }}>
          {delta >= 0 ? "+" : ""}{delta}%
        </span>
      )}
    </div>
  );
}

// ─── AREA CHART ──────────────────────────────────────────────────────────────
function FunnelAreaChart({ campKey, info, M, color }) {
  const vals = info.cols.map(c => M[c] ?? 0);
  const data = info.etapas.map((name, i) => ({ name, value: vals[i] }));
  const id = `area${campKey.replace(/\W/g,"")}`;
  const TT = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{background:D.bg3, border:`1px solid ${D.bdr2}`, borderRadius:8,
        padding:"10px 14px", fontFamily:F.b}}>
        <div style={{fontSize:10, color:D.t1, marginBottom:3}}>{payload[0].payload.name}</div>
        <div style={{fontSize:16, fontWeight:600, color:D.t0}}>{fmtNum(payload[0].value)}</div>
        <div style={{fontSize:9, fontFamily:F.m, color:D.t2, marginTop:2}}>
          {fmtPct(vals[0], payload[0].value)}
        </div>
      </div>
    );
  };
  return (
    <div style={{width:"100%", height:140}}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{top:8, right:8, bottom:0, left:-20}}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="100%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={D.bdr}/>
          <XAxis dataKey="name" tick={{fontSize:9, fill:D.t2, fontFamily:F.m}}
            axisLine={false} tickLine={false}/>
          <YAxis tick={{fontSize:9, fill:D.t2, fontFamily:F.m}}
            axisLine={false} tickLine={false} tickFormatter={v => fmtNum(v)}/>
          <Tooltip content={<TT/>}/>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            fill={`url(#${id})`} dot={{ fill:color, strokeWidth:0, r:3 }}
            activeDot={{ r:5, fill:color }}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── DONUT ───────────────────────────────────────────────────────────────────
function DonutChart({ labels, values, colors }) {
  const [idx, setIdx] = useState(null);
  const total = values.reduce((a,b) => a+b, 0);
  const data  = labels.map((l,i) => ({ name:l, value:values[i] }));
  const TT = ({ active, payload }) => {
    if (!active||!payload?.length) return null;
    const p = payload[0];
    return (
      <div style={{background:D.bg3, border:`1px solid ${D.bdr2}`, borderRadius:8, padding:"10px 14px"}}>
        <div style={{fontSize:10, color:D.t1, marginBottom:2}}>{p.name}</div>
        <div style={{fontSize:15, fontWeight:600, color:D.t0}}>{fmtNum(p.value)}</div>
        <div style={{fontSize:9, fontFamily:F.m, color:D.t2, marginTop:2}}>{fmtPct(total,p.value)}</div>
      </div>
    );
  };
  return (
    <div style={{display:"flex", alignItems:"center", gap:24}}>
      <div style={{position:"relative", width:130, height:130, flexShrink:0}}>
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%"
              innerRadius="58%" outerRadius="80%" paddingAngle={2} strokeWidth={0}
              onMouseEnter={(_,i) => setIdx(i)} onMouseLeave={() => setIdx(null)}>
              {data.map((_,i) => (
                <Cell key={i} fill={colors[i%colors.length]}
                  opacity={idx===null||idx===i?1:0.3}/>
              ))}
            </Pie>
            <Tooltip content={<TT/>}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", pointerEvents:"none"}}>
          <div style={{fontSize:18, fontWeight:600, color:D.t0, lineHeight:1, fontFamily:F.h}}>
            {fmtNum(idx!==null?values[idx]:total)}
          </div>
          <div style={{fontSize:7, fontFamily:F.m, color:D.t2, letterSpacing:"0.1em", marginTop:4, textTransform:"uppercase"}}>
            {idx!==null?labels[idx]:"total"}
          </div>
        </div>
      </div>
      <div style={{flex:1, display:"flex", flexDirection:"column", gap:8}}>
        {labels.map((l,i) => (
          <div key={i} style={{display:"flex", alignItems:"center", gap:8,
            opacity:idx===null||idx===i?1:0.35, transition:"opacity .15s", cursor:"default"}}
            onMouseEnter={() => setIdx(i)} onMouseLeave={() => setIdx(null)}>
            <div style={{width:6, height:6, borderRadius:2, background:colors[i%colors.length], flexShrink:0}}/>
            <div style={{flex:1, fontSize:11, color:D.t1}}>{l}</div>
            <div style={{fontSize:11, fontFamily:F.m, fontWeight:600, color:D.t0}}>{fmtNum(values[i])}</div>
            <div style={{fontSize:9, fontFamily:F.m, color:D.t2, width:34, textAlign:"right"}}>{fmtPct(total,values[i])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CAMPAIGN TABLE ROW ───────────────────────────────────────────────────────
function CampTableRow({ rank, name, icon, leads, conv, convClr, subLabel, subValue, color, onClick, isLast }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:14, padding:"12px 20px",
        cursor:"pointer",
        background: hov ? D.bg3 : "transparent",
        borderBottom: isLast ? "none" : `1px solid ${D.bdr}`,
        transition:"background .12s",
      }}>
      <div style={{fontSize:11, fontFamily:F.m, color:D.t2, width:16, flexShrink:0, textAlign:"center"}}>
        {rank}
      </div>
      <IconBox icon={icon} color={color} size={32}/>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:12, fontWeight:600, color:D.t0, overflow:"hidden",
          textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{name}</div>
        <div style={{fontSize:10, color:D.t1, marginTop:2}}>{subLabel}: <span style={{color:D.t0, fontWeight:600}}>{fmtNum(subValue)}</span></div>
      </div>
      <div style={{textAlign:"right", flexShrink:0}}>
        <div style={{fontSize:14, fontWeight:700, color:D.t0, fontFamily:F.h}}>{fmtNum(leads)}</div>
        <div style={{fontSize:9, color:D.t2, fontFamily:F.m, marginTop:1}}>leads</div>
      </div>
      <div style={{textAlign:"right", width:52, flexShrink:0}}>
        <div style={{fontSize:13, fontWeight:700, color:convClr, fontFamily:F.m}}>{conv}</div>
        <div style={{fontSize:9, color:D.t2, fontFamily:F.m, marginTop:1}}>conv.</div>
      </div>
      {/* progress bar */}
      <div style={{width:60, flexShrink:0}}>
        <div style={{height:3, background:gl(color,0.15), borderRadius:2, overflow:"hidden"}}>
          <div style={{
            height:"100%", borderRadius:2,
            width:`${Math.min(parseFloat(conv),100)}%`,
            background:color, transition:"width .5s"
          }}/>
        </div>
      </div>
    </div>
  );
}

// ─── FUNNEL DETAIL ───────────────────────────────────────────────────────────
function FunnelDetail({ campKey, info, M, color, onBack }) {
  const mob = useIsMobile();
  const vals = info.cols.map(c => M[c] ?? 0);
  const topo = vals[0] || 1;
  const finalConv = safePct(topo, vals[vals.length-1]);
  const convClr = finalConv > 60 ? D.ok : finalConv > 30 ? D.warn : D.err;

  return (
    <div style={{display:"flex", flexDirection:"column", gap:16}}>
      {/* Header */}
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        <button onClick={onBack}
          style={{width:32, height:32, borderRadius:9, background:gl(color,0.1),
            border:`1px solid ${gl(color,0.2)}`, display:"flex", alignItems:"center",
            justifyContent:"center", color, cursor:"pointer", fontSize:14}}>
          <i className="ti ti-arrow-left"/>
        </button>
        <IconBox icon={info.icon} color={color} size={32}/>
        <div>
          <div style={{fontSize:15, fontWeight:700, color:D.t0}}>{campKey}</div>
          <div style={{fontSize:10, color:D.t1}}>Detalhe da automação</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid", gridTemplateColumns:mob?"1fr 1fr":`repeat(${Math.min(info.cols.length,5)},1fr)`, gap:10}}>
        {info.etapas.map((etapa, i) => (
          <div key={i} style={{
            background: i===0 ? gl(color,0.08) : D.bg2,
            border:`1px solid ${i===0 ? gl(color,0.3) : D.bdr}`,
            borderRadius:12, padding:"16px 18px",
            position:"relative", overflow:"hidden",
          }}>
            {i===0 && <div style={{position:"absolute", top:0, left:0, right:0, height:2,
              background:`linear-gradient(90deg,${color},${gl(color,0)})`}}/>}
            <div style={{fontSize:9, fontWeight:600, fontFamily:F.m, letterSpacing:"0.1em",
              textTransform:"uppercase", color:i===0?gl(color,0.8):D.t2, marginBottom:8}}>{etapa}</div>
            <div style={{fontSize:24, fontWeight:600, color:D.t0, lineHeight:1, fontFamily:F.h}}>{fmtNum(vals[i])}</div>
            {i>0 && <div style={{marginTop:6}}><Tag color={color}>{fmtPct(topo,vals[i])} do topo</Tag></div>}
          </div>
        ))}
      </div>

      <div style={{display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:14}}>
        {/* Funil area chart */}
        <div style={{background:D.bg2, border:`1px solid ${D.bdr}`, borderRadius:14, overflow:"hidden"}}>
          <div style={{padding:"16px 20px", borderBottom:`1px solid ${D.bdr}`}}>
            <div style={{fontSize:13, fontWeight:600, color:D.t0}}>Funil da automação</div>
            <div style={{fontSize:10, color:D.t2, marginTop:3}}>Volume por etapa</div>
          </div>
          <div style={{padding:"12px 20px 16px"}}>
            <FunnelAreaChart campKey={campKey} info={info} M={M} color={color}/>
          </div>
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:14}}>
          {/* Conv rates */}
          <div style={{background:D.bg2, border:`1px solid ${D.bdr}`, borderRadius:14, overflow:"hidden", flex:1}}>
            <div style={{padding:"16px 20px", borderBottom:`1px solid ${D.bdr}`}}>
              <div style={{fontSize:13, fontWeight:600, color:D.t0}}>Conversão por etapa</div>
              <div style={{fontSize:10, color:D.t2, marginTop:3}}>% do topo que chegou a cada passo</div>
            </div>
            <div style={{padding:"8px 20px 14px"}}>
              {info.etapas.slice(1).map((e, i) => {
                const r = safePct(topo, vals[i+1]);
                const clr = r>70?D.ok:r>40?color:r>20?D.warn:D.err;
                return (
                  <div key={i}>
                    <div style={{display:"flex", alignItems:"center", gap:10, padding:"7px 0"}}>
                      <div style={{fontSize:11, color:D.t1, flex:"0 0 130px", lineHeight:1.3}}>Topo → {e}</div>
                      <div style={{flex:1, height:4, background:gl("#fff",0.06), borderRadius:2, overflow:"hidden"}}>
                        <div style={{width:`${Math.min(r,100)}%`, height:"100%", background:clr, borderRadius:2, transition:"width .5s"}}/>
                      </div>
                      <div style={{fontSize:11, fontWeight:700, fontFamily:F.m, color:clr, width:42, textAlign:"right"}}>{r.toFixed(1)}%</div>
                    </div>
                    {i < info.etapas.length - 2 && <Divider/>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final conv */}
          <div style={{
            background:gl(color,0.07), border:`1px solid ${gl(color,0.22)}`,
            borderRadius:14, padding:"18px 20px", position:"relative", overflow:"hidden",
            boxShadow:`0 0 32px ${gl(color,0.08)}`,
          }}>
            <div style={{position:"absolute", top:0, left:0, right:0, height:2,
              background:`linear-gradient(90deg,${color},${gl(color,0)})`}}/>
            <div style={{fontSize:9, fontWeight:600, fontFamily:F.m, letterSpacing:"0.1em",
              textTransform:"uppercase", color:gl(color,0.7), marginBottom:10}}>Conversão final</div>
            <div style={{fontSize:38, fontWeight:700, color:convClr, letterSpacing:"-0.02em",
              lineHeight:1, marginBottom:6, fontFamily:F.h}}>{finalConv.toFixed(1)}%</div>
            <div style={{fontSize:11, color:D.t1}}>
              <span style={{color:D.t0, fontWeight:600}}>{fmtNum(topo)}</span> entraram ·{" "}
              <span style={{color:D.t0, fontWeight:600}}>{fmtNum(vals[vals.length-1])}</span> converteram
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
function Overview({ ecoKey, M, theme, onSelect }) {
  const mob = useIsMobile();
  const camps = Object.entries(CAMPANHAS[ecoKey]);
  const colors = [theme.c0, theme.c1, theme.c2, theme.c3];

  const total = camps.reduce((acc,[,info]) => acc + (M[info.cols[0]] ?? 0), 0);
  const totalConv = camps.reduce((acc,[,info]) => {
    acc += M[info.kpi_sub_col] ?? 0;
    return acc;
  }, 0);

  const bestCamp = camps.reduce((best, [key,info]) => {
    const conv = safePct(M[info.cols[0]] ?? 0, M[info.kpi_sub_col] ?? 0);
    return conv > (best.conv||0) ? { key, conv } : best;
  }, {});

  const cLabels = camps.map(([k]) => CAMPANHAS[ecoKey][k] ? k.split(" ")[0] + (k.split(" ")[1] ? " "+k.split(" ")[1].slice(0,4)+"." : "") : k);
  const cVals   = camps.map(([,info]) => M[info.cols[0]] ?? 0);

  return (
    <div style={{display:"flex", flexDirection:"column", gap:20}}>

      {/* Greeting */}
      <div style={{marginBottom:4}}>
        <div style={{fontSize:mob?16:18, fontWeight:700, color:D.t0, fontFamily:F.h}}>
          Olá, We Lover! 👋
        </div>
        <div style={{fontSize:11, color:D.t1, marginTop:3}}>
          Aqui está o desempenho das suas automações ManyChat.
        </div>
      </div>

      {/* Stat cards */}
      <div style={{display:"grid", gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)", gap:12}}>
        <StatCard icon="ti-users" label="Total na base" value={fmtNum(total)}
          sub="entradas nos funis" color={theme.c0}/>
        <StatCard icon="ti-brand-whatsapp" label="Conversões" value={fmtNum(totalConv)}
          sub={`${fmtPct(total,totalConv)} do total`} color={D.ok}/>
        <StatCard icon="ti-trophy" label="Melhor campanha" value={`${bestCamp.conv?.toFixed(1)}%`}
          sub={bestCamp.key} color={theme.c1}/>
        <StatCard icon="ti-bolt" label="Campanhas ativas" value={String(camps.length)}
          sub="automações ManyChat" color={theme.c2}/>
      </div>

      {/* Top campanhas + distribuição */}
      <div style={{display:"grid", gridTemplateColumns:mob?"1fr":"3fr 2fr", gap:14}}>
        {/* Top campanhas */}
        <div style={{background:D.bg2, border:`1px solid ${D.bdr}`, borderRadius:14, overflow:"hidden"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"16px 20px", borderBottom:`1px solid ${D.bdr}`}}>
            <div>
              <div style={{fontSize:13, fontWeight:700, color:D.t0}}>Top Campanhas</div>
              <div style={{fontSize:10, color:D.t2, marginTop:3}}>Clique para ver o detalhe</div>
            </div>
            <Tag color={theme.c0}>ManyChat</Tag>
          </div>
          {camps.map(([key,info], i) => {
            const leads = M[info.cols[0]] ?? 0;
            const subV  = M[info.kpi_sub_col] ?? 0;
            const conv  = safePct(leads, subV);
            const clr   = conv>60?D.ok:conv>30?D.warn:D.err;
            return (
              <CampTableRow key={key}
                rank={i+1} name={key} icon={info.icon}
                leads={leads} conv={`${conv.toFixed(1)}%`} convClr={clr}
                subLabel={info.kpi_sub_label} subValue={subV}
                color={colors[i%colors.length]}
                onClick={() => onSelect(key)}
                isLast={i===camps.length-1}/>
            );
          })}
        </div>

        {/* Distribuição */}
        <div style={{background:D.bg2, border:`1px solid ${D.bdr}`, borderRadius:14, overflow:"hidden"}}>
          <div style={{padding:"16px 20px", borderBottom:`1px solid ${D.bdr}`}}>
            <div style={{fontSize:13, fontWeight:700, color:D.t0}}>Distribuição</div>
            <div style={{fontSize:10, color:D.t2, marginTop:3}}>Participação percentual por campanha</div>
          </div>
          <div style={{padding:"20px"}}>
            <DonutChart labels={cLabels} values={cVals} colors={colors}/>
          </div>
        </div>
      </div>

      {/* Funil de cada campanha */}
      <div style={{background:D.bg2, border:`1px solid ${D.bdr}`, borderRadius:14, overflow:"hidden"}}>
        <div style={{padding:"16px 20px", borderBottom:`1px solid ${D.bdr}`}}>
          <div style={{fontSize:13, fontWeight:700, color:D.t0}}>Funis por automação</div>
          <div style={{fontSize:10, color:D.t2, marginTop:3}}>Volume relativo ao topo de cada campanha</div>
        </div>
        <div style={{padding:"20px", display:"grid",
          gridTemplateColumns:mob?"1fr":"repeat(auto-fit,minmax(220px,1fr))", gap:24}}>
          {camps.map(([key,info], i) => {
            const clr = colors[i%colors.length];
            return (
              <div key={key}>
                <div style={{display:"flex", alignItems:"center", gap:7, marginBottom:12}}>
                  <IconBox icon={info.icon} color={clr} size={24}/>
                  <span style={{fontSize:10, fontWeight:700, fontFamily:F.m,
                    letterSpacing:"0.08em", textTransform:"uppercase", color:D.t2}}>{key.split(" ")[0]}</span>
                </div>
                <FunnelAreaChart campKey={key} info={info} M={M} color={clr}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Taxas de conversão */}
      <div style={{background:D.bg2, border:`1px solid ${D.bdr}`, borderRadius:14, overflow:"hidden"}}>
        <div style={{padding:"16px 20px", borderBottom:`1px solid ${D.bdr}`}}>
          <div style={{fontSize:13, fontWeight:700, color:D.t0}}>Taxas de conversão</div>
          <div style={{fontSize:10, color:D.t2, marginTop:3}}>% do topo que avançou em cada etapa</div>
        </div>
        <div style={{padding:"8px 20px 16px", display:"grid",
          gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:"0 40px"}}>
          {camps.flatMap(([key,info], ci) => {
            const topo = M[info.cols[0]] ?? 0;
            const clr  = colors[ci%colors.length];
            return info.cols.slice(1).map((col, i) => {
              const r = safePct(topo, M[col]??0);
              const rClr = r>70?D.ok:r>40?clr:r>20?D.warn:D.err;
              return (
                <div key={`${key}${i}`}>
                  <div style={{display:"flex", alignItems:"center", gap:10, padding:"7px 0"}}>
                    <div style={{display:"flex", alignItems:"center", gap:5, flex:"0 0 170px"}}>
                      <span style={{width:5, height:5, borderRadius:"50%", background:clr, flexShrink:0}}/>
                      <span style={{fontSize:11, color:D.t1, lineHeight:1.3}}>
                        {key.split(" ")[0]} → {info.etapas[i+1]}
                      </span>
                    </div>
                    <div style={{flex:1, height:4, background:gl("#fff",0.05), borderRadius:2, overflow:"hidden"}}>
                      <div style={{width:`${Math.min(r,100)}%`, height:"100%", background:rClr, borderRadius:2, transition:"width .5s"}}/>
                    </div>
                    <span style={{fontSize:11, fontWeight:700, fontFamily:F.m, color:rClr, width:42, textAlign:"right"}}>
                      {r>0?`${r.toFixed(1)}%`:"—"}
                    </span>
                  </div>
                  <Divider/>
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function SidebarItem({ icon, label, count, active, onClick, color }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:10, padding:"8px 16px", width:"100%",
        fontSize:12, fontWeight:active?600:400,
        color: active?D.t0:hov?D.t0:D.t1,
        background: active?gl(color,0.12):hov?gl("#fff",0.04):"transparent",
        borderLeft:`2px solid ${active?color:"transparent"}`,
        border:"none", cursor:"pointer", transition:"all .15s",
        textAlign:"left", fontFamily:F.b,
        transform: hov&&!active?"translateX(3px)":"translateX(0)",
      }}>
      <i className={`ti ${icon}`} style={{fontSize:15, flexShrink:0, color:active?color:"inherit"}}/>
      <span style={{flex:1}}>{label}</span>
      {count && (
        <span style={{fontSize:9, fontFamily:F.m, fontWeight:700, color:D.t2,
          background:gl("#fff",0.06), padding:"2px 7px", borderRadius:8}}>{count}</span>
      )}
    </button>
  );
}

// ─── ECOSYSTEM PAGE ───────────────────────────────────────────────────────────
function EcosystemPage({ ecoKey }) {
  const theme = THEMES[ecoKey];
  const { rows, boolCols, error, loading, lastSync, reload } = useData(URLS[ecoKey]);
  const [sel, setSel] = useState("overview");
  const [sideOpen, setSideOpen] = useState(false);

  const mob = useIsMobile();
  const M = useMemo(() => (!rows||!boolCols)?{}:buildMetrics(rows,boolCols), [rows,boolCols]);
  const camps = Object.entries(CAMPANHAS[ecoKey]);
  const colors = [theme.c0, theme.c1, theme.c2, theme.c3];
  const timeStr = lastSync?.toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"});
  const selColor = (sel==="overview" || !CAMPANHAS[ecoKey][sel]) ? theme.c0 : colors[camps.findIndex(([k])=>k===sel)%colors.length] ?? theme.c0;

  return (
    <div style={{display:"flex", flex:1, minHeight:0}}>
      {/* Mobile overlay */}
      {mob&&sideOpen&&(
        <div onClick={() => setSideOpen(false)}
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:80}}/>
      )}

      {/* Sidebar */}
      <nav style={{
        width:224, flexShrink:0, background:D.bg1,
        borderRight:`1px solid ${D.bdr}`,
        display:"flex", flexDirection:"column",
        ...(mob?{
          position:"fixed", top:0, left:0, bottom:0, zIndex:90,
          transform:sideOpen?"translateX(0)":"translateX(-100%)",
          transition:"transform 0.25s cubic-bezier(.4,0,.2,1)",
        }:{
          position:"sticky", top:58, height:"calc(100vh - 58px)", overflow:"hidden auto",
        })
      }}>
        {/* Brand card */}
        <div style={{padding:"18px 16px 14px"}}>
          <div style={{
            display:"flex", alignItems:"center", gap:10,
            background:gl(theme.c0,0.08), border:`1px solid ${gl(theme.c0,0.2)}`,
            borderRadius:10, padding:"10px 12px",
          }}>
            <div style={{
              width:32, height:32, borderRadius:8, flexShrink:0,
              background:`linear-gradient(135deg,${theme.c0},${theme.c3})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:15, fontWeight:700, color:"#fff", fontFamily:"Georgia,serif",
              boxShadow:`0 0 12px ${gl(theme.c0,0.3)}`,
            }}>{theme.avatar}</div>
            <div>
              <div style={{fontSize:12, fontWeight:700, color:D.t0, fontFamily:F.h}}>{theme.name}</div>
              <div style={{fontSize:8, color:D.t2, fontFamily:F.m, letterSpacing:"0.07em", marginTop:1}}>
                WE LOVE · ANALYTICS
              </div>
            </div>
          </div>
        </div>

        <Divider/>

        <div style={{padding:"10px 0 6px"}}>
          <div style={{fontSize:8, fontWeight:700, fontFamily:F.m, letterSpacing:"0.12em",
            textTransform:"uppercase", color:D.t2, padding:"0 16px 8px"}}>Visão geral</div>
          <SidebarItem icon="ti-layout-dashboard" label="Dashboard"
            active={sel==="overview"} onClick={() => { setSel("overview"); if(mob)setSideOpen(false); }}
            color={theme.c0}/>
        </div>

        <Divider/>

        <div style={{padding:"10px 0 6px"}}>
          <div style={{fontSize:8, fontWeight:700, fontFamily:F.m, letterSpacing:"0.12em",
            textTransform:"uppercase", color:D.t2, padding:"0 16px 8px"}}>Campanhas</div>
          {camps.map(([key,info], i) => {
            const count = M[info.cols[0]] ?? 0;
            return (
              <SidebarItem key={key} icon={info.icon} label={key.length > 18 ? key.slice(0,16)+"…" : key}
                count={count>0?fmtNum(count):null}
                active={sel===key}
                onClick={() => { setSel(key); if(mob)setSideOpen(false); }}
                color={colors[i%colors.length]}/>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{marginTop:"auto", padding:"14px 16px", borderTop:`1px solid ${D.bdr}`}}>
          {timeStr && (
            <div style={{fontSize:9, fontFamily:F.m, color:D.t2, marginBottom:10,
              display:"flex", alignItems:"center", gap:5}}>
              <i className="ti ti-circle-check" style={{fontSize:11, color:D.ok}}/>
              Atualizado às {timeStr}
            </div>
          )}
          <button onClick={reload}
            style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              fontSize:10, fontFamily:F.m, fontWeight:600,
              color:loading?D.t2:D.t1, background:"transparent",
              border:`1px solid ${D.bdr}`, borderRadius:9,
              padding:"8px 0", cursor:"pointer", width:"100%", transition:"all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = gl("#fff",0.05); }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <i className={`ti ti-refresh${loading?" spinning":""}`} style={{fontSize:13}}/>
            {loading?"Sincronizando…":"Sincronizar"}
          </button>
        </div>
      </nav>

      {/* Main area */}
      <div style={{
        flex:1, minWidth:0, display:"flex", flexDirection:"column",
        background:D.bg, overflowX:"hidden",
        height:"calc(100vh - 58px)", overflowY:"auto",
      }}>
        {/* Sub-topbar */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:mob?"10px 14px":"12px 28px",
          background:D.bg1, borderBottom:`1px solid ${D.bdr}`,
          position:"sticky", top:0, zIndex:40, flexShrink:0,
        }}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            {mob && (
              <button onClick={() => setSideOpen(v=>!v)}
                style={{
                  width:32, height:32, borderRadius:9, background:gl(selColor,0.1),
                  border:`1px solid ${gl(selColor,0.2)}`, display:"flex", alignItems:"center",
                  justifyContent:"center", color:selColor, cursor:"pointer", fontSize:15,
                }}>
                <i className="ti ti-menu-2"/>
              </button>
            )}
            <div style={{display:"flex", alignItems:"center", gap:7, fontSize:12}}>
              {!mob && <span style={{color:D.t2}}>{theme.name}</span>}
              {!mob && <span style={{color:D.t2, fontSize:10}}>/</span>}
              <span style={{display:"flex", alignItems:"center", gap:5}}>
                <span style={{width:6, height:6, borderRadius:"50%", background:selColor}}/>
                <span style={{color:D.t0, fontWeight:600}}>
                  {sel==="overview"?"Dashboard":sel}
                </span>
              </span>
            </div>
          </div>
          {loading && <span style={{fontSize:9, fontFamily:F.m, color:D.t2}}>Carregando…</span>}
        </div>

        {/* Content */}
        <div style={{padding:mob?"14px":"24px 28px", paddingTop:"24px", flex:1}}>
          {error && (
            <div style={{
              display:"flex", gap:12, padding:"14px 18px", marginBottom:18,
              background:gl(D.err,0.08), border:`1px solid ${gl(D.err,0.22)}`,
              borderRadius:12, fontSize:11, color:D.err,
            }}>
              <i className="ti ti-alert-circle" style={{fontSize:15, marginTop:1, flexShrink:0}}/>
              <div>Não foi possível carregar o Google Sheets. Verifique se está público.<br/>
                <span style={{fontFamily:F.m, fontSize:9, opacity:0.6}}>{error}</span></div>
            </div>
          )}

          {loading && !error && (
            <div style={{display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", padding:"80px", gap:14, textAlign:"center"}}>
              <div style={{width:52, height:52, borderRadius:14, background:gl(theme.c0,0.1),
                display:"flex", alignItems:"center", justifyContent:"center", color:theme.c0, fontSize:24}}>
                <i className="ti ti-refresh spinning"/>
              </div>
              <div style={{fontSize:13, color:D.t1}}>Buscando dados…</div>
            </div>
          )}

          {!loading && !error && rows && (
            sel === "overview" || !CAMPANHAS[ecoKey][sel]
              ? <Overview ecoKey={ecoKey} M={M} theme={theme} onSelect={setSel}/>
              : <FunnelDetail
                  campKey={sel}
                  info={CAMPANHAS[ecoKey][sel]}
                  M={M}
                  color={colors[camps.findIndex(([k])=>k===sel)%colors.length] ?? theme.c0}
                  onBack={() => setSel("overview")}
                />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMING SOON ─────────────────────────────────────────────────────────────
function ComingSoon({ title }) {
  return (
    <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:D.bg}}>
      <div style={{textAlign:"center", maxWidth:320, padding:48}}>
        <div style={{fontSize:48, fontWeight:300, color:D.t2, letterSpacing:"-0.04em",
          lineHeight:1, marginBottom:16, fontFamily:F.h}}>Em breve</div>
        <div style={{fontSize:13, color:D.t2, lineHeight:1.9}}>
          Conecte a planilha ManyChat do ecossistema{" "}
          <strong style={{color:D.t1}}>{title}</strong> para ativar.
        </div>
      </div>
    </div>
  );
}

// ─── TABS ────────────────────────────────────────────────────────────────────
// TABS are functions so we render with key= forcing full remount on tab change
const TABS = [
  { label:"Laise Mesquita", ecoKey:"laise" },
  { label:"We Love Chile",  ecoKey:"chile" },
  { label:"We Love Peru",   ecoKey:"peru"  },
];

// ─── ROOT ────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);
  const [hov, setHov] = useState(null);
  const mob = useIsMobile();

  return (
    <div style={{display:"flex", flexDirection:"column", minHeight:"100vh",
      background:D.bg, fontFamily:F.b, color:D.t0, overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css');
        *{box-sizing:border-box;}
        html,body,#root{margin:0;padding:0;width:100%;min-height:100%;overflow-x:hidden;}
        body{background:#080808;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.14);}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .spinning{animation:spin 1s linear infinite;display:inline-block;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.4s cubic-bezier(.4,0,.2,1) both;}
      `}</style>

      {/* Global topbar */}
      <div style={{
        display:"flex", alignItems:"center",
        background:D.bg1, borderBottom:`1px solid ${D.bdr}`,
        padding:mob?"0 14px":"0 24px",
        position:"sticky", top:0, zIndex:50, height:58, flexShrink:0,
      }}>
        <div style={{display:"flex", alignItems:"center", marginRight:mob?12:24, flexShrink:0}}>
          <img src={zafraLogo} alt="Zafra"
            style={{height:mob?36:48, width:"auto", objectFit:"contain",
              filter:`drop-shadow(0 0 10px rgba(232,82,122,0.3))`}}/>
        </div>

        <div style={{width:1, height:18, background:D.bdr, marginRight:mob?12:20}}/>

        {TABS.map((t,i) => {
          const active = i===tab;
          const theme  = Object.values(THEMES)[i];
          return (
            <button key={i} onClick={() => setTab(i)}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{
                fontFamily:F.b, fontSize:mob?10:12, fontWeight:active?700:400,
                color: active?D.t0:hov===i?D.t0:D.t1,
                background:"transparent", border:"none",
                borderBottom:`2px solid ${active?theme.c0:"transparent"}`,
                padding:mob?"0 10px":"0 16px", height:"100%",
                cursor:"pointer", transition:"color .15s, border-color .15s",
                marginBottom:-1, whiteSpace:"nowrap",
              }}>
              {mob ? t.label.split(" ")[0] : t.label}
            </button>
          );
        })}

        <div style={{marginLeft:"auto"}}>
          <img src={manychatLogo} alt="ManyChat"
            style={{height:mob?22:30, width:"auto", objectFit:"contain", opacity:0.65}}/>
        </div>
      </div>

      <div style={{display:"flex", flex:1}}>
        <EcosystemPage key={TABS[tab].ecoKey} ecoKey={TABS[tab].ecoKey}/>
      </div>
    </div>
  );
}