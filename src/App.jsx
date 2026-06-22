import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import zafraLogo from "./zafra_logo_branca.png";
import manychatLogo from "./manychat_logo_branca.png";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
}

// ─── DESIGN SYSTEM ───────────────────────────────────────────────────────────
const D = {
  // Superfícies — preto com variações bem sutis
  s0: "#050505",   // página
  s1: "#090909",   // sidebar / topbar
  s2: "#0D0D0D",   // card base
  s3: "#111111",   // card elevado / hover
  s4: "#161616",   // popover / tooltip

  // Rosa avermelhado — família monochromática
  r0: "#E8527A",   // rosa claro Laíse
  r1: "#C43D63",   // rosa médio
  r2: "#9E2E4E",   // rosa escuro
  r3: "#72203A",   // rosa vinho
  r4: "#3D0D1F",   // rosa profundo

  // Texto
  t0: "#EDE9F4",   // primário
  t1: "#8A8799",   // secundário
  t2: "#3F3D52",   // terciário / desabilitado

  // Bordas
  b0: "rgba(255,255,255,0.07)",
  b1: "rgba(255,255,255,0.12)",

  // Semântico — cores neutras para não conflitar
  ok:   "#2EC98A",
  warn: "#D9922A",
  err:  "#E04444",
};

const F = {
  h: "'Montserrat', system-ui, sans-serif",
  b: "'Montserrat', system-ui, sans-serif",
  m: "'DM Mono', 'Fira Mono', monospace",
};

// Campanha → tom da família rosa
const CAMP_COLORS = {
  "Acesso Comercial":           D.r0,
  "Campanha Comunidade":        D.r1,
  "We Love Rental – Comunidade":D.r2,
  "Caderno Secreto":            D.r3,
};

const CAMPANHAS = {
  "Todas as Campanhas": { icon:"ti-layout-grid", cols:null, etapas:null, label_resumo:null, kpi_sub_col:null, kpi_sub_label:null },
  "Acesso Comercial":   { icon:"ti-briefcase", desc:"Fluxo comercial direto.", cols:["Comercial (Iniciou)","Comercial (clicou em quero saber mais)","Comercial (Clicou Wpp)"], etapas:["Iniciou","Quero saber mais","Clicou no Wpp"], label_resumo:"Acesso Comercial", kpi_sub_col:"Comercial (Clicou Wpp)", kpi_sub_label:"→ Wpp" },
  "Campanha Comunidade":{ icon:"ti-users", desc:"Leads da campanha da comunidade.", cols:["Campanha Comunidade (Iniciou)","Campanha Comunidade (clicou em quero saber mais)","Campanha Comunidade (Clicou Wpp)"], etapas:["Iniciou","Quero saber mais","Clicou no Wpp"], label_resumo:"Comunidade", kpi_sub_col:"Campanha Comunidade (Clicou Wpp)", kpi_sub_label:"→ Wpp" },
  "We Love Rental – Comunidade":{ icon:"ti-hanger", desc:"Aluguel da comunidade We Love.", cols:["We Love Rental - Comunidade (Iniciou)","We Love Rental - Comunidade (Acessou site)"], etapas:["Iniciou","Acessou o site"], label_resumo:"WL Rental", kpi_sub_col:"We Love Rental - Comunidade (Acessou site)", kpi_sub_label:"→ Site" },
  "Caderno Secreto":    { icon:"ti-book", desc:"Leads do Caderno Secreto.", cols:["Caderno Secreto (Iniciou)","Caderno Secreto (clicou em saber mais)","Caderno Secreto (Mandou wpp)","Caderno Secreto (Acessou)","Caderno Secreto (Clicou Wpp)"], etapas:["Iniciou","Saber mais","Mandou Wpp","Acessou","Clicou Wpp"], label_resumo:"Caderno Secreto", kpi_sub_col:"Caderno Secreto (Clicou Wpp)", kpi_sub_label:"→ Wpp" },
};

const SPECIFIC = Object.entries(CAMPANHAS).filter(([,v])=>v.cols!==null);

// ── CHILE ─────────────────────────────────────────────────────────────────
const CHILE_COLORS = {
  "Envio de PDF":           "#CC1A1A",
  "Envio de Link":          "#A51515",
  "Envio WhatsApp":         "#7D1010",
  "Envio Mensagem Direct":  "#550B0B",
};

const CAMPANHAS_CHILE = {
  "Todas as Campanhas": { icon:"ti-layout-grid", cols:null, etapas:null, label_resumo:null, kpi_sub_col:null, kpi_sub_label:null },
  "Envio de PDF": {
    icon:"ti-file-type-pdf",
    desc:"Automação de envio de PDF informativo.",
    cols:["Envio de PDF - Iniciou","Envio de PDF - Interessou","Envio de PDF -  Mandou Wpp","Envio de PDF -  Acessou PDF"],
    etapas:["Iniciou","Interessou","Mandou Wpp","Acessou PDF"],
    label_resumo:"Envio de PDF",
    kpi_sub_col:"Envio de PDF -  Acessou PDF", kpi_sub_label:"→ PDF",
  },
  "Envio de Link": {
    icon:"ti-link",
    desc:"Automação de envio de link.",
    cols:["Envio de Link - Iniciou","Envio de Link - Interessou","Envio de Link - Mandou Wpp","Envio de Link - Acessou link"],
    etapas:["Iniciou","Interessou","Mandou Wpp","Acessou Link"],
    label_resumo:"Envio de Link",
    kpi_sub_col:"Envio de Link - Acessou link", kpi_sub_label:"→ Link",
  },
  "Envio WhatsApp": {
    icon:"ti-brand-whatsapp",
    desc:"Automação de envio direto pelo WhatsApp.",
    cols:["Envio WhatsApp - Iniciou","Envio WhatsApp - Interessou","Envio WhatsApp - Clicou wpp"],
    etapas:["Iniciou","Interessou","Clicou Wpp"],
    label_resumo:"Envio WhatsApp",
    kpi_sub_col:"Envio WhatsApp - Clicou wpp", kpi_sub_label:"→ Wpp",
  },
  "Envio Mensagem Direct": {
    icon:"ti-message-circle",
    desc:"Automação via mensagem direta no Instagram.",
    cols:["Envio Mensagem Direct - Iniciou","Envio Mensagem Direct - Interessou","Envio Mensagem Direct - Mandou Wpp"],
    etapas:["Iniciou","Interessou","Mandou Wpp"],
    label_resumo:"Msg Direct",
    kpi_sub_col:"Envio Mensagem Direct - Mandou Wpp", kpi_sub_label:"→ Wpp",
  },
};

const SPECIFIC_CHILE = Object.entries(CAMPANHAS_CHILE).filter(([,v])=>v.cols!==null);
const chileClr = (key) => CHILE_COLORS[key] ?? "#CC1A1A";

// ── PERU ──────────────────────────────────────────────────────────────────────
const PERU_COLORS = {
  "Acesso ao Link": "#1A7A3A",
};

const CAMPANHAS_PERU = {
  "Todas as Campanhas": { icon:"ti-layout-grid", cols:null, etapas:null, label_resumo:null, kpi_sub_col:null, kpi_sub_label:null },
  "Acesso ao Link": {
    icon:"ti-link",
    desc:"Automação de acesso ao link da campanha.",
    cols:["Acesso ao Link - Iniciou","Acesso ao Link - Interessou","Acesso ao Link - Mandou Wpp","Acesso ao Link - Acessou Link"],
    etapas:["Iniciou","Interessou","Mandou Wpp","Acessou Link"],
    label_resumo:"Acesso ao Link",
    kpi_sub_col:"Acesso ao Link - Acessou Link", kpi_sub_label:"→ Link",
  },
};

const SPECIFIC_PERU = Object.entries(CAMPANHAS_PERU).filter(([,v])=>v.cols!==null);
const peruClr = (key) => PERU_COLORS[key] ?? "#1A7A3A";

const PERU_D = {
  r0: "#1A7A3A",  // verde principal
  r1: "#156130",  // verde médio
  r2: "#0F4A24",  // verde escuro
  r3: "#093318",  // verde profundo
};

const SHEET_ID  = "1QZ6TJhikHTwhJDsbxQpA88GPj-QUFclHfUVFQVsPtsU";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

// We Love Chile — gid correto da aba
const CHILE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=407668234`;

// We Love Peru
const PERU_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1780246388`;

// ─── UTILS ───────────────────────────────────────────────────────────────────
const pct     = (t,p) => (!t?null:Math.round((p/t)*1000)/10);
const fmtPct  = (t,p) => { const v=pct(t,p); return v!==null?`${v.toFixed(1)}%`:"—"; };
const safePct = (t,p) => pct(t,p)??0;
const fmtNum  = (n) => (n??0).toLocaleString("pt-BR");
const gl      = (hex,op) => { const h=hex.replace("#",""); return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${op})`; };
const campClr = (key) => CAMP_COLORS[key]??D.r0;

function parseBool(raw) {
  const s=String(raw??"").trim().toUpperCase();
  if(s==="TRUE"||s==="1"||s==="VERDADEIRO"||s==="YES") return true;
  if(s==="FALSE"||s==="0"||s===""||s==="NAN"||s==="FALSO"||s==="NO") return false;
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

function buildMetrics(rows,boolCols) {
  const M={};
  boolCols.forEach(col=>{ M[col]=rows.filter(r=>r[col]===true).length; });
  return M;
}

function useData(url) {
  const U = url || SHEET_URL;
  const [st,setSt]=useState({rows:null,boolCols:null,error:null,loading:true,lastSync:null});
  const load=useCallback(async()=>{
    setSt(s=>({...s,loading:true,error:null}));
    try {
      const res=await fetch(U);
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const text=await res.text();
      const {rows,boolCols}=parseCSV(text);
      setSt({rows,boolCols,error:null,loading:false,lastSync:new Date()});
    } catch(e){setSt(s=>({...s,error:e.message,loading:false}));}
  },[U]);
  useEffect(()=>{ load(); const id=setInterval(load,5*60*1000); return ()=>clearInterval(id); },[load]);
  return {...st,reload:load};
}

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────

// Card com efeito de brilho sutil no topo
function Card({children,style={},glow,onClick}) {
  const [hov,setHov]=useState(false);
  const glowClr=glow||D.r0;
  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        background:D.s2,
        border:`1px solid ${hov&&onClick?gl(glowClr,0.3):D.b0}`,
        borderRadius:12,overflow:"hidden",
        boxShadow: hov&&onClick
          ? `0 0 24px ${gl(glowClr,0.12)}, inset 0 1px 0 ${gl(glowClr,0.1)}`
          : `inset 0 1px 0 rgba(255,255,255,0.03)`,
        cursor:onClick?"pointer":"default",
        transition:"border-color .18s, box-shadow .18s",
        ...style,
      }}>
      {/* linha de luz topo */}
      <div style={{height:1,background:hov&&onClick
        ?`linear-gradient(90deg,${glowClr},${gl(glowClr,0.3)},transparent)`
        :`linear-gradient(90deg,${gl(glowClr,0.25)},transparent)`
      }}/>
      {children}
    </div>
  );
}

function CH({title,sub,right,pad="16px 20px"}) {
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",
      padding:pad,borderBottom:`1px solid ${D.b0}`,gap:12}}>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:D.t0,letterSpacing:"0.01em"}}>{title}</div>
        {sub&&<div style={{fontSize:10,color:D.t2,marginTop:3,fontFamily:F.m,letterSpacing:"0.03em"}}>{sub}</div>}
      </div>
      {right&&<div style={{flexShrink:0}}>{right}</div>}
    </div>
  );
}

function Tag({children,color=D.r0}) {
  return (
    <span style={{fontSize:9,fontWeight:700,fontFamily:F.m,letterSpacing:"0.07em",
      textTransform:"uppercase",padding:"3px 8px",borderRadius:6,
      background:gl(color,0.14),color,border:`1px solid ${gl(color,0.28)}`}}>
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{height:1,background:D.b0}}/>;
}

// ─── SPARKLINE ───────────────────────────────────────────────────────────────
function Spark({vals,color=D.r0,h=34}) {
  if(!vals||vals.length<2) return null;
  const data=vals.map((v,i)=>({i,v}));
  const id=`sp${color.replace(/\W/g,"")}${h}`;
  return (
    <div style={{width:"100%",height:h}}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{top:1,right:0,bottom:0,left:0}}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25}/>
              <stop offset="100%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#${id})`} dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────
function KPI({label,value,chip,sub,color=D.r0,spark,wide,featured}) {
  const mob=useIsMobile();
  return (
    <div style={{
      background: featured ? gl(color,0.07) : D.s2,
      border:`1px solid ${featured?gl(color,0.28):D.b0}`,
      borderRadius:12,padding:"20px 22px",
      display:"flex",flexDirection:"column",justifyContent:"space-between",
      height:"100%",minHeight:mob?100:130,
      position:"relative",overflow:"hidden",
      boxShadow: featured ? `0 0 36px ${gl(color,0.1)}, inset 0 1px 0 ${gl(color,0.12)}` : `inset 0 1px 0 rgba(255,255,255,0.03)`,
      ...(wide?{gridColumn:"span 2"}:{}),
      width:"100%",
    }}>
      {/* linha de luz */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,${color},${gl(color,0.4)},transparent)`}}/>
      {/* orbe de luz canto */}
      {featured&&<div style={{position:"absolute",top:-48,right:-48,width:120,height:120,
        borderRadius:"50%",background:gl(color,0.08),filter:"blur(28px)",pointerEvents:"none"}}/>}

      <div style={{fontSize:9,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
        textTransform:"uppercase",color:featured?gl(color,0.8):D.t2,marginBottom:10}}>
        {label}
      </div>
      <div style={{fontSize:30,fontWeight:300,lineHeight:1,letterSpacing:"-0.025em",
        color:D.t0,marginBottom:chip||sub?8:0,fontFamily:F.h,
        transition:"all 0.3s ease"}}>
        {value}
      </div>
      {chip&&<Tag color={color}>{chip}</Tag>}
      {sub&&<div style={{fontSize:10,color:D.t1,marginTop:sub&&chip?6:0,fontFamily:F.m}}>{sub}</div>}
      {spark&&<div style={{marginTop:12,opacity:0.75}}><Spark vals={spark} color={color}/></div>}
    </div>
  );
}

// ─── DONUT ───────────────────────────────────────────────────────────────────
function Donut({labels,values,colors}) {
  const [idx,setIdx]=useState(null);
  const total=values.reduce((s,v)=>s+v,0);
  const data=labels.map((l,i)=>({name:l,value:values[i]}));
  const clrs=colors||[D.r0,D.r1,D.r2,D.r3];
  const TT=({active,payload})=>{
    if(!active||!payload?.length) return null;
    const p=payload[0];
    return (
      <div style={{background:D.s4,border:`1px solid ${D.b1}`,borderRadius:8,padding:"10px 14px"}}>
        <div style={{fontSize:10,color:D.t1,marginBottom:2,fontFamily:F.m}}>{p.name}</div>
        <div style={{fontSize:15,fontWeight:500,color:D.t0}}>{fmtNum(p.value)}</div>
        <div style={{fontSize:9,fontFamily:F.m,color:D.t2,marginTop:2}}>{fmtPct(total,p.value)}</div>
      </div>
    );
  };
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 16px 16px",gap:14}}>
      <div style={{position:"relative",width:144,height:144}}>
        <ResponsiveContainer width={144} height={144}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%"
              innerRadius="58%" outerRadius="80%" paddingAngle={2} strokeWidth={0}
              onMouseEnter={(_,i)=>setIdx(i)} onMouseLeave={()=>setIdx(null)}>
              {data.map((_,i)=>(
                <Cell key={i} fill={clrs[i%clrs.length]}
                  opacity={idx===null||idx===i?1:0.3}/>
              ))}
            </Pie>
            <Tooltip content={<TT/>}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
          <div style={{fontSize:19,fontWeight:300,color:D.t0,letterSpacing:"-0.02em",lineHeight:1,fontFamily:F.h}}>
            {fmtNum(idx!==null?values[idx]:total)}
          </div>
          <div style={{fontSize:7,fontFamily:F.m,color:D.t2,letterSpacing:"0.1em",marginTop:4,textTransform:"uppercase"}}>
            {idx!==null?labels[idx]:"total"}
          </div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,width:"100%"}}>
        {labels.map((l,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,
            opacity:idx===null||idx===i?1:0.3,transition:"opacity .15s",cursor:"default"}}
            onMouseEnter={()=>setIdx(i)} onMouseLeave={()=>setIdx(null)}>
            <span style={{width:6,height:6,borderRadius:2,background:clrs[i%clrs.length],flexShrink:0}}/>
            <span style={{fontSize:11,color:D.t1,flex:1}}>{l}</span>
            <span style={{fontSize:10,fontFamily:F.m,color:D.t0,fontWeight:500}}>{fmtNum(values[i])}</span>
            <span style={{fontSize:9,fontFamily:F.m,color:D.t2,width:34,textAlign:"right"}}>{fmtPct(total,values[i])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BAR CHART ───────────────────────────────────────────────────────────────
function VolumeBar({labels,values,colors}) {
  const clrs=colors||[D.r0,D.r1,D.r2,D.r3];
  const data=labels.map((name,i)=>({name,v:values[i]}));
  const TT=({active,payload})=>{
    if(!active||!payload?.length) return null;
    return (
      <div style={{background:D.s4,border:`1px solid ${D.b1}`,borderRadius:8,padding:"10px 14px"}}>
        <div style={{fontSize:10,color:D.t1,marginBottom:2,fontFamily:F.m}}>{payload[0].payload.name}</div>
        <div style={{fontSize:15,fontWeight:500,color:D.t0}}>{fmtNum(payload[0].value)}</div>
      </div>
    );
  };
  const Rect=(props)=>{
    const {x,y,width,height,index}=props;
    const c=clrs[index%clrs.length];
    const id=`bg${index}`;
    return (
      <g>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity={0.9}/>
            <stop offset="100%" stopColor={c} stopOpacity={0.35}/>
          </linearGradient>
        </defs>
        <rect x={x} y={y} width={width} height={Math.max(height,2)} fill={`url(#${id})`} rx={4}/>
      </g>
    );
  };
  return (
    <div style={{width:"100%",height:148}}>
      <ResponsiveContainer>
        <BarChart data={data} barCategoryGap="38%" margin={{top:4,right:2,bottom:0,left:-24}}>
          <CartesianGrid vertical={false} stroke={D.b0}/>
          <XAxis dataKey="name" tick={{fontSize:10,fill:D.t2,fontFamily:F.m}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fontSize:9,fill:D.t2,fontFamily:F.m}} axisLine={false} tickLine={false} tickFormatter={v=>fmtNum(v)}/>
          <Tooltip content={<TT/>} cursor={{fill:gl("#fff",0.03)}}/>
          <Bar dataKey="v" shape={<Rect/>} maxBarSize={50}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── FUNIL VISUAL ────────────────────────────────────────────────────────────
function FunnelViz({etapas,values,color}) {
  const max=values[0]||1;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {etapas.map((label,i)=>{
        const v=values[i];
        const w=Math.min(100,Math.max(3,Math.round((v/max)*100)));
        const prevV=i>0?values[i-1]:v;
        const drop=i>0?safePct(prevV,prevV-v):0;
        const dropClr=drop>50?D.err:drop>25?D.warn:D.ok;
        return (
          <div key={i}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flex:"0 0 100px",minWidth:0}}>
                <div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,
                  background:i===0?color:gl(color,0.45)}}/>
                <span style={{fontSize:11,color:D.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
              </div>
              <div style={{flex:1,height:5,background:gl(color,0.08),borderRadius:3,overflow:"hidden"}}>
                <div style={{width:`${w}%`,height:"100%",
                  background:`linear-gradient(90deg,${color},${gl(color,0.5)})`,
                  borderRadius:3,transition:"width .5s cubic-bezier(.4,0,.2,1)"}}/>
              </div>
              <span style={{fontSize:11,fontFamily:F.m,color:D.t0,fontWeight:500,width:44,textAlign:"right"}}>{fmtNum(v)}</span>
              {i>0&&(
                <span style={{fontSize:9,fontFamily:F.m,fontWeight:600,color:dropClr,
                  background:gl(dropClr,0.1),padding:"2px 6px",borderRadius:5,width:44,textAlign:"center"}}>
                  −{drop.toFixed(0)}%
                </span>
              )}
              {i===0&&<span style={{width:44}}/>}
            </div>
            {i<etapas.length-1&&<Divider/>}
          </div>
        );
      })}
    </div>
  );
}

// ─── CONV RATE BARS ──────────────────────────────────────────────────────────
function ConvRates({stages,rates,color}) {
  const max=Math.max(...rates,1);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {stages.map((s,i)=>{
        const r=rates[i]??0;
        const w=Math.max(2,Math.round((r/max)*100));
        const clr=r>70?D.ok:r>40?color:r>20?D.warn:D.err;
        return (
          <div key={i}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0"}}>
              <div style={{fontSize:11,color:D.t1,flex:"0 0 130px",minWidth:0,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis"}}>{s}</div>
              <div style={{flex:1,height:4,background:gl("#fff",0.06),borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${Math.min(w,100)}%`,height:"100%",background:clr,
                  borderRadius:2,transition:"width .5s cubic-bezier(.4,0,.2,1)"}}/>
              </div>
              <span style={{fontSize:11,fontWeight:600,fontFamily:F.m,color:clr,width:44,textAlign:"right",flexShrink:0}}>
                {r>0?`${r.toFixed(1)}%`:"—"}
              </span>
            </div>
            {i<stages.length-1&&<Divider/>}
          </div>
        );
      })}
    </div>
  );
}

// ─── CAMPAIGN ROW (tabela) ────────────────────────────────────────────────────
function CampRow({campKey,info,M,onSelect,isLast}) {
  const mob=useIsMobile();
  const [hov,setHov]=useState(false);
  const clr=campClr(campKey);
  const vals=info.cols.map(c=>M[c]??0);
  const topo=vals[0]||1;
  const finalV=vals[vals.length-1];
  const conv=safePct(topo,finalV);
  const convClr=conv>60?D.ok:conv>30?D.warn:D.err;

  return (
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      onClick={()=>onSelect(campKey)}
      style={{display:"flex",alignItems:"center",gap:16,padding:"14px 20px",
        cursor:"pointer",background:hov?D.s3:"transparent",
        borderBottom:isLast?"none":`1px solid ${D.b0}`,
        transition:"background .12s, transform .15s",
        transform:hov?"translateX(2px)":"translateX(0)"}}>
      {/* ícone */}
      <div style={{width:32,height:32,borderRadius:8,background:gl(clr,0.12),
        display:"flex",alignItems:"center",justifyContent:"center",color:clr,fontSize:15,flexShrink:0}}>
        <i className={`ti ${info.icon}`}/>
      </div>
      {/* nome */}
      <div style={{flex:"0 0 150px"}}>
        <div style={{fontSize:12,fontWeight:500,color:D.t0}}>{info.label_resumo}</div>
        <div style={{fontSize:9,color:D.t2,fontFamily:F.m,marginTop:2}}>{info.etapas.length} etapas</div>
      </div>
      {/* mini funil — barras verticais decrescentes, ocupam espaço flex */}
      <div style={{flex:1,display:"flex",gap:4,alignItems:"flex-end",height:32,
        padding:"0 16px"}}>
        {vals.map((v,i)=>{
          const hPct=Math.max(8,Math.round((v/topo)*100));
          const opacity=1-i*(0.55/Math.max(vals.length-1,1));
          return (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",
              justifyContent:"flex-end",height:"100%"}}>
              <div style={{width:"100%",height:`${hPct}%`,borderRadius:"2px 2px 0 0",
                background:clr,opacity,transition:"height .4s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
          );
        })}
      </div>
      {/* topo */}
      <div style={{width:64,textAlign:"right"}}>
        <div style={{fontSize:14,fontWeight:300,color:D.t0,fontFamily:F.h}}>{fmtNum(topo)}</div>
        <div style={{fontSize:8,color:D.t2,fontFamily:F.m,marginTop:1}}>LEADS</div>
      </div>
      {/* conversão */}
      <div style={{width:60,textAlign:"right"}}>
        <div style={{fontSize:13,fontWeight:600,color:convClr,fontFamily:F.m}}>{conv.toFixed(1)}%</div>
        <div style={{fontSize:8,color:D.t2,fontFamily:F.m,marginTop:1}}>CONV.</div>
      </div>
      {/* arrow */}
      <div style={{width:20,textAlign:"right",color:D.t2,opacity:hov?1:0,transition:"opacity .12s"}}>
        <i className="ti ti-chevron-right" style={{fontSize:14}}/>
      </div>
    </div>
  );
}

// ─── OVERVIEW (todas as campanhas) ───────────────────────────────────────────
function Overview({M,onSelect}) {
  const mob=useIsMobile();
  const total=SPECIFIC.reduce((acc,[,info])=>acc+(M[info.cols[0]]??0),0);
  const cLabels=SPECIFIC.map(([,i])=>i.label_resumo);
  const cVals=SPECIFIC.map(([,i])=>M[i.cols[0]]??0);
  const cColors=SPECIFIC.map(([k])=>campClr(k));

  const allStages=[],allRates=[],allColors=[];
  SPECIFIC.forEach(([k,info])=>{
    const topo=M[info.cols[0]]??0;
    info.cols.slice(1).forEach((col,idx)=>{
      allStages.push(`${info.label_resumo} → ${info.etapas[idx+1]}`);
      allRates.push(safePct(topo,M[col]??0));
      allColors.push(campClr(k));
    });
  });

  const totalWpp=SPECIFIC.reduce((acc,[,info])=>{
    if((info.kpi_sub_label||"").includes("Wpp")) acc+=M[info.kpi_sub_col]??0;
    return acc;
  },0);
  const bestIdx=allRates.indexOf(Math.max(...allRates,0));

  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16,overflow:"visible"}}>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"2fr 1fr 1fr 1fr",gap:mob?10:12,alignItems:"stretch"}}>
        <div className="fade-up stagger-1" style={{display:"flex"}}>
          <KPI label="Total na base" value={fmtNum(total)} sub="entradas em todos os funis"
            color={D.r0} spark={cVals} featured wide/>
        </div>
        <div className="fade-up stagger-2" style={{display:"flex"}}>
          <KPI label="Chegaram ao Wpp" value={fmtNum(totalWpp)}
            chip={`${fmtPct(total,totalWpp)} do total`} color={D.ok}/>
        </div>
        <div className="fade-up stagger-3" style={{display:"flex"}}>
          <KPI label="Melhor conversão"
            value={allRates[bestIdx]?`${allRates[bestIdx].toFixed(1)}%`:"—"}
            sub={allStages[bestIdx]||""} color={D.r1}/>
        </div>
        <div className="fade-up stagger-4" style={{display:"flex"}}>
          <KPI label="Campanhas ativas" value={String(SPECIFIC.length)}
            sub="automações ManyChat" color={D.r2}/>
        </div>
      </div>

      {/* Campanhas — lista clicável */}
      <Card glow={D.r0}>
        <CH title="Campanhas" sub="Clique para detalhar uma campanha"
          right={<Tag color={D.r0}>ManyChat</Tag>}/>
        <div>
          {SPECIFIC.map(([key,info],i)=>(
            <div key={key} className={`fade-up stagger-${i+2}`}>
              <CampRow campKey={key} info={info} M={M}
                onSelect={onSelect} isLast={i===SPECIFIC.length-1}/>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"3fr 2fr",gap:12,alignItems:"stretch"}}>
        <div className="scale-in stagger-5" style={{display:"flex"}}>
          <Card glow={D.r1} style={{flex:1,display:"flex",flexDirection:"column"}}>
            <CH title="Volume por campanha" sub="Entradas no topo do funil"/>
            <div style={{padding:"14px 20px 18px",flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
              <VolumeBar labels={cLabels} values={cVals} colors={cColors}/>
            </div>
          </Card>
        </div>
        <div className="scale-in stagger-6" style={{display:"flex"}}>
          <Card glow={D.r2} style={{flex:1,display:"flex",flexDirection:"column"}}>
            <CH title="Distribuição" sub="Participação percentual"/>
            <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
              <Donut labels={cLabels} values={cVals} colors={cColors}/>
            </div>
          </Card>
        </div>
      </div>

      {/* Conversão */}
      {allStages.length>0&&(
        <Card glow={D.r0}>
          <CH title="Taxas de conversão" sub="% do topo que avançou em cada etapa"/>
          <div style={{padding:"4px 20px 12px",display:"grid",
            gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:mob?"0":"0 40px"}}>
            {allStages.map((s,i)=>{
              const r=allRates[i]??0;
              const clr=r>70?D.ok:r>40?allColors[i]:r>20?D.warn:D.err;
              return (
                <div key={i}>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flex:"0 0 165px"}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:allColors[i],flexShrink:0}}/>
                      <span style={{fontSize:11,color:D.t1,lineHeight:1.3}}>{s}</span>
                    </div>
                    <div style={{flex:1,height:4,background:gl("#fff",0.05),borderRadius:2,overflow:"hidden"}}>
                      <div style={{width:`${Math.min(r,100)}%`,height:"100%",background:clr,borderRadius:2,transition:"width .5s"}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,fontFamily:F.m,color:clr,width:42,textAlign:"right"}}>
                      {r>0?`${r.toFixed(1)}%`:"—"}
                    </span>
                  </div>
                  <Divider/>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── DETALHE DE CAMPANHA ─────────────────────────────────────────────────────
function Detail({selected,M,onBack}) {
  const mob=useIsMobile();
  const info=CAMPANHAS[selected];
  const clr=campClr(selected);
  const vals=info.cols.map(c=>M[c]??0);
  const topo=vals[0];
  const finalConv=safePct(topo,vals[vals.length-1]);
  const convClr=finalConv>60?D.ok:finalConv>30?D.warn:D.err;

  if(topo===0) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"80px",gap:16,textAlign:"center"}}>
      <div style={{width:52,height:52,borderRadius:14,background:gl(clr,0.1),
        display:"flex",alignItems:"center",justifyContent:"center",color:clr,fontSize:24}}>
        <i className="ti ti-alert-circle"/>
      </div>
      <div style={{fontSize:15,fontWeight:500,color:D.t0}}>Sem dados ainda</div>
      <button onClick={onBack} style={{fontSize:12,color:clr,background:"none",
        border:"none",cursor:"pointer",fontFamily:F.b,textDecoration:"underline"}}>
        ← Voltar para visão geral
      </button>
    </div>
  );

  const convLabels=info.etapas.slice(1).map(e=>`Topo → ${e}`);
  const convRates=vals.slice(1).map(v=>safePct(topo,v));

  return (
    <div className="fade-up" style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Back */}
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <button onClick={onBack}
          style={{width:30,height:30,borderRadius:8,background:gl(clr,0.1),
            border:`1px solid ${gl(clr,0.2)}`,display:"flex",alignItems:"center",
            justifyContent:"center",color:clr,cursor:"pointer",fontSize:13,flexShrink:0}}>
          <i className="ti ti-arrow-left"/>
        </button>
        <span style={{width:6,height:6,borderRadius:"50%",background:clr,flexShrink:0}}/>
        <span style={{fontSize:14,fontWeight:600,color:D.t0}}>{selected}</span>
        {!mob&&<span style={{fontSize:10,color:D.t2,fontFamily:F.m}}>{info.desc}</span>}
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":`repeat(${Math.min(info.cols.length,5)},1fr)`,gap:10}}>
        {info.cols.map((col,i)=>(
          <KPI key={i} label={info.etapas[i]} value={fmtNum(vals[i])}
            chip={i>0?`${fmtPct(topo,vals[i])} do topo`:null}
            color={i===0?clr:gl(clr,0.6)} featured={i===0}/>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:12}}>
        {/* Funil */}
        <Card glow={clr}>
          <CH title="Funil detalhado" sub="Volume e queda entre etapas"/>
          <div style={{padding:"8px 20px 16px"}}>
            <FunnelViz etapas={info.etapas} values={vals} color={clr}/>
          </div>
        </Card>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Conv */}
          <Card glow={clr} style={{flex:1}}>
            <CH title="Conversão por etapa" sub="% do topo que chegou a cada passo"/>
            <div style={{padding:"4px 20px 12px"}}>
              <ConvRates stages={convLabels} rates={convRates} color={clr}/>
            </div>
          </Card>

          {/* Resultado final */}
          <div style={{
            background:gl(clr,0.07),
            border:`1px solid ${gl(clr,0.22)}`,
            borderRadius:12,padding:"18px 20px",
            position:"relative",overflow:"hidden",
            boxShadow:`0 0 32px ${gl(clr,0.1)}, inset 0 1px 0 ${gl(clr,0.15)}`,
          }}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,
              background:`linear-gradient(90deg,${clr},${gl(clr,0.3)},transparent)`}}/>
            <div style={{position:"absolute",bottom:-40,right:-40,width:110,height:110,
              borderRadius:"50%",background:gl(clr,0.07),filter:"blur(28px)",pointerEvents:"none"}}/>
            <div style={{fontSize:8,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
              textTransform:"uppercase",color:gl(clr,0.7),marginBottom:10}}>
              Conversão final
            </div>
            <div style={{fontSize:40,fontWeight:300,color:D.t0,letterSpacing:"-0.025em",
              lineHeight:1,marginBottom:6,fontFamily:F.h,color:convClr}}>
              {finalConv.toFixed(1)}%
            </div>
            <div style={{fontSize:11,color:D.t1}}>
              <span style={{color:D.t0,fontWeight:500}}>{fmtNum(topo)}</span> entraram ·{" "}
              <span style={{color:D.t0,fontWeight:500}}>{fmtNum(vals[vals.length-1])}</span> chegaram ao fim
            </div>
            <div style={{marginTop:12,opacity:0.7}}>
              <Spark vals={vals} color={clr} h={30}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR NAV ─────────────────────────────────────────────────────────────
function NavItem({icon,label,count,active,onClick,color=D.r0}) {
  const [hov,setHov]=useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"center",gap:9,padding:"7px 16px",width:"100%",
        fontSize:11,fontWeight:active?600:400,
        color:active?D.t0:hov?D.t0:D.t1,
        background:active?gl(color,0.1):hov?gl("#fff",0.03):"transparent",
        borderLeft:`2px solid ${active?color:"transparent"}`,
        border:"none",cursor:"pointer",transition:"all .18s cubic-bezier(.4,0,.2,1)",
        transform:hov&&!active?"translateX(3px)":"translateX(0)",
        textAlign:"left",fontFamily:F.b}}>
      <i className={`ti ${icon}`} style={{fontSize:13,flexShrink:0,color:active?color:"inherit"}}/>
      <span style={{flex:1,lineHeight:1.3}}>{label}</span>
      {count&&(
        <span style={{fontSize:9,fontFamily:F.m,fontWeight:600,color:D.t2,
          background:gl("#fff",0.05),padding:"2px 7px",borderRadius:8,letterSpacing:"0.03em"}}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── ECOSYSTEM ───────────────────────────────────────────────────────────────
function Ecosystem({title}) {
  const {rows,boolCols,error,loading,lastSync,reload}=useData();
  const [sel,setSel]=useState("Todas as Campanhas");
  const [sideOpen,setSideOpen]=useState(false);
  const mob=useIsMobile();
  const M=useMemo(()=>(!rows||!boolCols)?{}:buildMetrics(rows,boolCols),[rows,boolCols]);
  const timeStr=lastSync?.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  const selClr=sel==="Todas as Campanhas"?D.r0:campClr(sel);
  const handleSelect=(key)=>{setSel(key);if(mob)setSideOpen(false);};

  return (
    <div style={{display:"flex",flex:1,minHeight:0}}>
      {/* Sidebar */}
      {/* Mobile overlay */}
      {mob&&sideOpen&&(
        <div onClick={()=>setSideOpen(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:80}}/>
      )}
      <nav style={{
        width:218,flexShrink:0,background:D.s1,
        borderRight:`1px solid ${D.b0}`,display:"flex",flexDirection:"column",
        ...(mob?{
          position:"fixed",top:0,left:0,bottom:0,zIndex:90,
          transform:sideOpen?"translateX(0)":"translateX(-100%)",
          transition:"transform 0.25s cubic-bezier(.4,0,.2,1)",
        }:{
          position:"sticky",top:58,height:"calc(100vh - 58px)",overflow:"hidden auto",
        })
      }}>

        {/* Marca */}
        <div style={{padding:"16px 16px 14px"}}>
          {/* Cliente ativo */}
          <div style={{display:"flex",alignItems:"center",gap:8,
            background:gl(D.r0,0.07),border:`1px solid ${gl(D.r0,0.18)}`,
            borderRadius:8,padding:"8px 10px"}}>
            <div style={{width:24,height:24,borderRadius:6,flexShrink:0,
              background:`linear-gradient(135deg,${D.r0} 0%,${D.r3} 100%)`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif"}}>L</div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:D.t0,fontFamily:F.h}}>Laíse Mesquita</div>
              <div style={{fontSize:8,color:D.t2,fontFamily:F.m,letterSpacing:"0.06em",marginTop:1}}>WE LOVE · ANALYTICS</div>
            </div>
          </div>
        </div>

        <Divider/>

        <div style={{padding:"10px 0 6px"}}>
          <div style={{fontSize:8,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
            textTransform:"uppercase",color:D.t2,padding:"0 16px 6px"}}>Visão geral</div>
          <NavItem icon="ti-layout-grid" label="Todas as campanhas"
            active={sel==="Todas as Campanhas"} onClick={()=>setSel("Todas as Campanhas")} color={D.r0}/>
        </div>

        <Divider/>

        <div style={{padding:"10px 0 6px"}}>
          <div style={{fontSize:8,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
            textTransform:"uppercase",color:D.t2,padding:"0 16px 6px"}}>Campanhas</div>
          {SPECIFIC.map(([key,info])=>(
            <NavItem key={key} icon={info.icon} label={info.label_resumo}
              count={(M[info.cols[0]]??0)>0?fmtNum(M[info.cols[0]]):null}
              active={sel===key} onClick={()=>setSel(key)} color={campClr(key)}/>
          ))}
        </div>

        <div style={{marginTop:"auto",padding:"14px 16px",borderTop:`1px solid ${D.b0}`}}>
          {timeStr&&(
            <div style={{fontSize:9,fontFamily:F.m,color:D.t2,marginBottom:10,
              display:"flex",alignItems:"center",gap:5}}>
              <i className="ti ti-circle-check" style={{fontSize:11,color:D.ok}}/>
              Atualizado às {timeStr}
            </div>
          )}
          <button onClick={reload}
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,
              fontSize:10,fontFamily:F.m,fontWeight:500,
              color:loading?D.t2:D.t1,background:"transparent",
              border:`1px solid ${D.b0}`,borderRadius:8,
              padding:"7px 0",cursor:"pointer",width:"100%",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=gl("#fff",0.05);}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <i className={`ti ti-refresh${loading?" spinning":""}`} style={{fontSize:12}}/>
            {loading?"Sincronizando…":"Sincronizar"}
          </button>
        </div>
      </nav>

      {/* Main */}
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",background:D.s0,overflowX:"hidden",height:"calc(100vh - 58px)",overflowY:"auto"}}>
        {/* Sub-topbar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:mob?"10px 14px":"10px 24px",background:D.s1,borderBottom:`1px solid ${D.b0}`,
          position:"sticky",top:0,zIndex:40,gap:12,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {mob&&(
              <button onClick={()=>setSideOpen(v=>!v)}
                style={{width:32,height:32,borderRadius:8,background:gl(selClr,0.1),
                  border:`1px solid ${gl(selClr,0.2)}`,display:"flex",alignItems:"center",
                  justifyContent:"center",color:selClr,cursor:"pointer",fontSize:15,flexShrink:0}}>
                <i className="ti ti-menu-2"/>
              </button>
            )}
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:D.t1}}>
              {!mob&&<><span style={{color:D.t2}}>{title}</span><span style={{color:D.t2,fontSize:9}}>/</span></>}
              <span style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:selClr}}/>
                <span style={{color:D.t0,fontWeight:600,fontSize:mob?12:11}}>{sel}</span>
              </span>
            </div>
          </div>
          {loading&&<span style={{fontSize:9,fontFamily:F.m,color:D.t2}}>Carregando…</span>}
        </div>

        <div style={{padding:mob?"14px":"20px 24px",paddingTop:"20px",flex:1,minWidth:0}}>
          {error&&(
            <div style={{display:"flex",gap:12,padding:"14px 18px",marginBottom:16,
              background:gl(D.err,0.08),border:`1px solid ${gl(D.err,0.22)}`,
              borderRadius:10,fontSize:11,color:D.err}}>
              <i className="ti ti-alert-circle" style={{fontSize:15,marginTop:1,flexShrink:0}}/>
              <div>Não foi possível carregar o Google Sheets. Verifique se está público.<br/>
                <span style={{fontFamily:F.m,fontSize:9,opacity:0.6}}>{error}</span></div>
            </div>
          )}
          {loading&&!error&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",padding:"80px",gap:12,textAlign:"center"}}>
              <div style={{width:48,height:48,borderRadius:12,background:gl(D.r0,0.1),
                display:"flex",alignItems:"center",justifyContent:"center",color:D.r0,fontSize:22}}>
                <i className="ti ti-refresh spinning"/>
              </div>
              <div style={{fontSize:12,color:D.t1}}>Buscando dados do Google Sheets…</div>
            </div>
          )}
          {!loading&&!error&&rows&&(
            CAMPANHAS[sel].cols===null
              ?<Overview M={M} onSelect={setSel}/>
              :<Detail selected={sel} M={M} onBack={()=>setSel("Todas as Campanhas")}/>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── WE LOVE CHILE ───────────────────────────────────────────────────────────
// Paleta vermelho puro para o Chile
const CH_D = {
  r0: "#CC1A1A",
  r1: "#A51515",
  r2: "#7D1010",
  r3: "#550B0B",
};

function OverviewChile({M,onSelect}) {
  const mob=useIsMobile();
  const total = SPECIFIC_CHILE.reduce((acc,[,info])=>acc+(M[info.cols[0]]??0),0);
  const cLabels = SPECIFIC_CHILE.map(([,i])=>i.label_resumo);
  const cVals   = SPECIFIC_CHILE.map(([,i])=>M[i.cols[0]]??0);
  const cColors = SPECIFIC_CHILE.map(([k])=>chileClr(k));

  const allStages=[],allRates=[],allColors=[];
  SPECIFIC_CHILE.forEach(([k,info])=>{
    const topo=M[info.cols[0]]??0;
    info.cols.slice(1).forEach((col,idx)=>{
      allStages.push(`${info.label_resumo} → ${info.etapas[idx+1]}`);
      allRates.push(safePct(topo,M[col]??0));
      allColors.push(chileClr(k));
    });
  });

  const totalWpp=SPECIFIC_CHILE.reduce((acc,[,info])=>{
    if((info.kpi_sub_label||"").includes("Wpp")) acc+=M[info.kpi_sub_col]??0;
    return acc;
  },0);
  const bestIdx=allRates.indexOf(Math.max(...allRates,0));

  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16,overflow:"visible"}}>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"2fr 1fr 1fr 1fr",gap:mob?10:12,alignItems:"stretch"}}>
        <div className="fade-up stagger-1" style={{display:"flex"}}>
          <KPIChile label="Total na base" value={fmtNum(total)} sub="entradas em todos os funis"
            color={CH_D.r0} spark={cVals} featured wide/>
        </div>
        <div className="fade-up stagger-2" style={{display:"flex"}}>
          <KPIChile label="Chegaram ao Wpp" value={fmtNum(totalWpp)}
            chip={`${fmtPct(total,totalWpp)} do total`} color={D.ok}/>
        </div>
        <div className="fade-up stagger-3" style={{display:"flex"}}>
          <KPIChile label="Melhor conversão"
            value={allRates[bestIdx]?`${allRates[bestIdx].toFixed(1)}%`:"—"}
            sub={allStages[bestIdx]||""} color={CH_D.r1}/>
        </div>
        <div className="fade-up stagger-4" style={{display:"flex"}}>
          <KPIChile label="Campanhas ativas" value={String(SPECIFIC_CHILE.length)}
            sub="automações ManyChat" color={CH_D.r2}/>
        </div>
      </div>

      <Card glow={CH_D.r0}>
        <CH title="Campanhas" sub="Clique para detalhar uma campanha"
          right={<Tag color={CH_D.r0}>ManyChat</Tag>}/>
        <div>
          {SPECIFIC_CHILE.map(([key,info],i)=>(
            <div key={key} className={`fade-up stagger-${i+2}`}>
              <CampRowChile campKey={key} info={info} M={M}
                onSelect={onSelect} isLast={i===SPECIFIC_CHILE.length-1}/>
            </div>
          ))}
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"3fr 2fr",gap:12,alignItems:"stretch"}}>
        <div className="scale-in stagger-5" style={{display:"flex"}}>
          <Card glow={CH_D.r1} style={{flex:1,display:"flex",flexDirection:"column"}}>
            <CH title="Volume por campanha" sub="Entradas no topo do funil"/>
            <div style={{padding:"14px 20px 18px",flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
              <VolumeBar labels={cLabels} values={cVals} colors={cColors}/>
            </div>
          </Card>
        </div>
        <div className="scale-in stagger-6" style={{display:"flex"}}>
          <Card glow={CH_D.r2} style={{flex:1,display:"flex",flexDirection:"column"}}>
            <CH title="Distribuição" sub="Participação percentual"/>
            <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
              <Donut labels={cLabels} values={cVals} colors={cColors}/>
            </div>
          </Card>
        </div>
      </div>

      {allStages.length>0&&(
        <Card glow={CH_D.r0}>
          <CH title="Taxas de conversão" sub="% do topo que avançou em cada etapa"/>
          <div style={{padding:"4px 20px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 40px"}}>
            {allStages.map((s,i)=>{
              const r=allRates[i]??0;
              const clr=r>70?D.ok:r>40?allColors[i]:r>20?D.warn:D.err;
              return (
                <div key={i}>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flex:"0 0 165px"}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:allColors[i],flexShrink:0}}/>
                      <span style={{fontSize:11,color:D.t1,lineHeight:1.3}}>{s}</span>
                    </div>
                    <div style={{flex:1,height:4,background:gl("#fff",0.05),borderRadius:2,overflow:"hidden"}}>
                      <div style={{width:`${Math.min(r,100)}%`,height:"100%",background:clr,borderRadius:2,transition:"width .5s"}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,fontFamily:F.m,color:clr,width:42,textAlign:"right"}}>
                      {r>0?`${r.toFixed(1)}%`:"—"}
                    </span>
                  </div>
                  <Divider/>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function KPIChile({label,value,chip,sub,color=CH_D.r0,spark,wide,featured}) {
  const mob=useIsMobile();
  return (
    <div style={{
      background: featured ? gl(color,0.07) : D.s2,
      border:`1px solid ${featured?gl(color,0.28):D.b0}`,
      borderRadius:12,padding:"20px 22px",
      display:"flex",flexDirection:"column",justifyContent:"space-between",
      height:"100%",minHeight:mob?100:130,width:"100%",
      position:"relative",overflow:"hidden",
      boxShadow: featured ? `0 0 36px ${gl(color,0.1)}, inset 0 1px 0 ${gl(color,0.12)}` : `inset 0 1px 0 rgba(255,255,255,0.03)`,
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,${color},${gl(color,0.4)},transparent)`}}/>
      {featured&&<div style={{position:"absolute",top:-48,right:-48,width:120,height:120,
        borderRadius:"50%",background:gl(color,0.08),filter:"blur(28px)",pointerEvents:"none"}}/>}
      <div style={{fontSize:9,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
        textTransform:"uppercase",color:featured?gl(color,0.8):D.t2,marginBottom:10}}>{label}</div>
      <div style={{fontSize:30,fontWeight:300,lineHeight:1,letterSpacing:"-0.025em",
        color:D.t0,marginBottom:chip||sub?8:0,fontFamily:F.h,width:"100%",transition:"all 0.3s ease"}}>{value}</div>
      {chip&&<Tag color={color}>{chip}</Tag>}
      {sub&&<div style={{fontSize:10,color:D.t1,marginTop:sub&&chip?6:0,fontFamily:F.m}}>{sub}</div>}
      {spark&&<div style={{marginTop:12,opacity:0.75}}><Spark vals={spark} color={color}/></div>}
    </div>
  );
}

function CampRowChile({campKey,info,M,onSelect,isLast}) {
  const mob=useIsMobile();
  const [hov,setHov]=useState(false);
  const clr=chileClr(campKey);
  const vals=info.cols.map(c=>M[c]??0);
  const topo=vals[0]||1;
  const finalV=vals[vals.length-1];
  const conv=safePct(topo,finalV);
  const convClr=conv>60?D.ok:conv>30?D.warn:D.err;

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>onSelect(campKey)}
      style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",
        cursor:"pointer",background:hov?D.s3:"transparent",
        borderBottom:isLast?"none":`1px solid ${D.b0}`,
        transition:"background .12s, transform .15s",
        transform:hov?"translateX(2px)":"translateX(0)",
        minWidth:0,overflow:"hidden"}}>
      <div style={{width:30,height:30,borderRadius:8,background:gl(clr,0.12),
        display:"flex",alignItems:"center",justifyContent:"center",color:clr,fontSize:14,flexShrink:0}}>
        <i className={`ti ${info.icon}`}/>
      </div>
      <div style={{flex:"0 0 120px",minWidth:0}}>
        <div style={{fontSize:12,fontWeight:500,color:D.t0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{info.label_resumo}</div>
        <div style={{fontSize:9,color:D.t2,fontFamily:F.m,marginTop:2}}>{info.etapas.length} etapas</div>
      </div>
      <div style={{flex:1,display:"flex",gap:4,alignItems:"flex-end",height:32,padding:"0 16px"}}>
        {vals.map((v,i)=>{
          const hPct=Math.max(8,Math.round((v/topo)*100));
          const opacity=1-i*(0.55/Math.max(vals.length-1,1));
          return (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end",height:"100%"}}>
              <div style={{width:"100%",height:`${hPct}%`,borderRadius:"2px 2px 0 0",
                background:clr,opacity,transition:"height .4s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
          );
        })}
      </div>
      <div style={{width:64,textAlign:"right"}}>
        <div style={{fontSize:14,fontWeight:300,color:D.t0,fontFamily:F.h}}>{fmtNum(topo)}</div>
        <div style={{fontSize:8,color:D.t2,fontFamily:F.m,marginTop:1}}>LEADS</div>
      </div>
      <div style={{width:60,textAlign:"right"}}>
        <div style={{fontSize:13,fontWeight:600,color:convClr,fontFamily:F.m}}>{conv.toFixed(1)}%</div>
        <div style={{fontSize:8,color:D.t2,fontFamily:F.m,marginTop:1}}>CONV.</div>
      </div>
      <div style={{width:20,textAlign:"right",color:D.t2,opacity:hov?1:0,transition:"opacity .12s"}}>
        <i className="ti ti-chevron-right" style={{fontSize:14}}/>
      </div>
    </div>
  );
}

function DetailChile({selected,M,onBack}) {
  const mob=useIsMobile();
  const info=CAMPANHAS_CHILE[selected];
  const clr=chileClr(selected);
  const vals=info.cols.map(c=>M[c]??0);
  const topo=vals[0];
  const finalConv=safePct(topo,vals[vals.length-1]);
  const convClr=finalConv>60?D.ok:finalConv>30?D.warn:D.err;

  if(topo===0) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"80px",gap:16,textAlign:"center"}}>
      <div style={{width:52,height:52,borderRadius:14,background:gl(clr,0.1),
        display:"flex",alignItems:"center",justifyContent:"center",color:clr,fontSize:24}}>
        <i className="ti ti-alert-circle"/>
      </div>
      <div style={{fontSize:15,fontWeight:500,color:D.t0}}>Sem dados ainda</div>
      <button onClick={onBack} style={{fontSize:12,color:clr,background:"none",
        border:"none",cursor:"pointer",fontFamily:F.b,textDecoration:"underline"}}>
        ← Voltar
      </button>
    </div>
  );

  const convLabels=info.etapas.slice(1).map(e=>`Topo → ${e}`);
  const convRates=vals.slice(1).map(v=>safePct(topo,v));

  return (
    <div className="fade-up" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <button onClick={onBack}
          style={{width:30,height:30,borderRadius:8,background:gl(clr,0.1),
            border:`1px solid ${gl(clr,0.2)}`,display:"flex",alignItems:"center",
            justifyContent:"center",color:clr,cursor:"pointer",fontSize:13,flexShrink:0}}>
          <i className="ti ti-arrow-left"/>
        </button>
        <span style={{width:6,height:6,borderRadius:"50%",background:clr,flexShrink:0}}/>
        <span style={{fontSize:14,fontWeight:600,color:D.t0}}>{selected}</span>
        {!mob&&<span style={{fontSize:10,color:D.t2,fontFamily:F.m}}>{info.desc}</span>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(info.cols.length,5)},1fr)`,gap:10}}>
        {info.cols.map((col,i)=>(
          <div key={i} className={`fade-up stagger-${i+1}`}>
            <KPIChile label={info.etapas[i]} value={fmtNum(vals[i])}
              chip={i>0?`${fmtPct(topo,vals[i])} do topo`:null}
              color={i===0?clr:gl(clr,0.6)} featured={i===0}/>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:12}}>
        <Card glow={clr}>
          <CH title="Funil detalhado" sub="Volume e queda entre etapas"/>
          <div style={{padding:"8px 20px 16px"}}>
            <FunnelViz etapas={info.etapas} values={vals} color={clr}/>
          </div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card glow={clr} style={{flex:1}}>
            <CH title="Conversão por etapa" sub="% do topo que chegou a cada passo"/>
            <div style={{padding:"4px 20px 12px"}}>
              <ConvRates stages={convLabels} rates={convRates} color={clr}/>
            </div>
          </Card>
          <div style={{background:gl(clr,0.07),border:`1px solid ${gl(clr,0.22)}`,
            borderRadius:12,padding:"18px 20px",position:"relative",overflow:"hidden",
            boxShadow:`0 0 32px ${gl(clr,0.1)}, inset 0 1px 0 ${gl(clr,0.15)}`}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,
              background:`linear-gradient(90deg,${clr},${gl(clr,0.3)},transparent)`}}/>
            <div style={{position:"absolute",bottom:-40,right:-40,width:110,height:110,
              borderRadius:"50%",background:gl(clr,0.07),filter:"blur(28px)",pointerEvents:"none"}}/>
            <div style={{fontSize:8,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
              textTransform:"uppercase",color:gl(clr,0.7),marginBottom:10}}>Conversão final</div>
            <div style={{fontSize:40,fontWeight:300,letterSpacing:"-0.025em",
              lineHeight:1,marginBottom:6,fontFamily:F.h,color:convClr}}>{finalConv.toFixed(1)}%</div>
            <div style={{fontSize:11,color:D.t1}}>
              <span style={{color:D.t0,fontWeight:500}}>{fmtNum(topo)}</span> entraram ·{" "}
              <span style={{color:D.t0,fontWeight:500}}>{fmtNum(vals[vals.length-1])}</span> chegaram ao fim
            </div>
            <div style={{marginTop:12,opacity:0.7}}><Spark vals={vals} color={clr} h={30}/></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EcosystemChile({title}) {
  const {rows,boolCols,error,loading,lastSync,reload}=useData(CHILE_URL);
  const [sel,setSel]=useState("Todas as Campanhas");
  const [sideOpen,setSideOpen]=useState(false);
  const mob=useIsMobile();
  const M=useMemo(()=>(!rows||!boolCols)?{}:buildMetrics(rows,boolCols),[rows,boolCols]);
  const timeStr=lastSync?.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  const selClr=sel==="Todas as Campanhas"?CH_D.r0:chileClr(sel);
  const handleChileSelect=(key)=>{setSel(key);if(mob)setSideOpen(false);};

  return (
    <div style={{display:"flex",flex:1,minHeight:0}}>
      {/* Mobile overlay */}
      {mob&&sideOpen&&(
        <div onClick={()=>setSideOpen(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:80}}/>
      )}
      <nav style={{
        width:218,flexShrink:0,background:D.s1,
        borderRight:`1px solid ${D.b0}`,display:"flex",flexDirection:"column",
        ...(mob?{
          position:"fixed",top:0,left:0,bottom:0,zIndex:90,
          transform:sideOpen?"translateX(0)":"translateX(-100%)",
          transition:"transform 0.25s cubic-bezier(.4,0,.2,1)",
        }:{
          position:"sticky",top:58,height:"calc(100vh - 58px)",overflow:"hidden auto",
        })
      }}>
        <div style={{padding:"16px 16px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,
            background:gl(CH_D.r0,0.07),border:`1px solid ${gl(CH_D.r0,0.18)}`,
            borderRadius:8,padding:"8px 10px"}}>
            <div style={{width:24,height:24,borderRadius:6,flexShrink:0,
              background:`linear-gradient(135deg,${CH_D.r0},${CH_D.r3})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif"}}>C</div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:D.t0,fontFamily:F.h}}>We Love Chile</div>
              <div style={{fontSize:8,color:D.t2,fontFamily:F.m,letterSpacing:"0.06em",marginTop:1}}>WE LOVE · ANALYTICS</div>
            </div>
          </div>
        </div>
        <Divider/>
        <div style={{padding:"10px 0 6px"}}>
          <div style={{fontSize:8,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
            textTransform:"uppercase",color:D.t2,padding:"0 16px 6px"}}>Visão geral</div>
          <NavItem icon="ti-layout-grid" label="Todas as campanhas"
            active={sel==="Todas as Campanhas"} onClick={()=>setSel("Todas as Campanhas")} color={CH_D.r0}/>
        </div>
        <Divider/>
        <div style={{padding:"10px 0 6px"}}>
          <div style={{fontSize:8,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
            textTransform:"uppercase",color:D.t2,padding:"0 16px 6px"}}>Campanhas</div>
          {SPECIFIC_CHILE.map(([key,info])=>(
            <NavItem key={key} icon={info.icon} label={info.label_resumo}
              count={(M[info.cols[0]]??0)>0?fmtNum(M[info.cols[0]]):null}
              active={sel===key} onClick={()=>setSel(key)} color={chileClr(key)}/>
          ))}
        </div>
        <div style={{marginTop:"auto",padding:"14px 16px",borderTop:`1px solid ${D.b0}`}}>
          {timeStr&&(
            <div style={{fontSize:9,fontFamily:F.m,color:D.t2,marginBottom:10,
              display:"flex",alignItems:"center",gap:5}}>
              <i className="ti ti-circle-check" style={{fontSize:11,color:D.ok}}/>
              Atualizado às {timeStr}
            </div>
          )}
          <button onClick={reload}
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,
              fontSize:10,fontFamily:F.m,fontWeight:500,
              color:loading?D.t2:D.t1,background:"transparent",
              border:`1px solid ${D.b0}`,borderRadius:8,
              padding:"7px 0",cursor:"pointer",width:"100%",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=gl("#fff",0.05);}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <i className={`ti ti-refresh${loading?" spinning":""}`} style={{fontSize:12}}/>
            {loading?"Sincronizando…":"Sincronizar"}
          </button>
        </div>
      </nav>

      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",background:D.s0,overflowX:"hidden",height:"calc(100vh - 58px)",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:mob?"10px 14px":"10px 24px",background:D.s1,borderBottom:`1px solid ${D.b0}`,
          position:"sticky",top:0,zIndex:40,gap:12,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {mob&&(
              <button onClick={()=>setSideOpen(v=>!v)}
                style={{width:32,height:32,borderRadius:8,background:gl(selClr,0.1),
                  border:`1px solid ${gl(selClr,0.2)}`,display:"flex",alignItems:"center",
                  justifyContent:"center",color:selClr,cursor:"pointer",fontSize:15,flexShrink:0}}>
                <i className="ti ti-menu-2"/>
              </button>
            )}
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:D.t1}}>
              {!mob&&<><span style={{color:D.t2}}>{title}</span><span style={{color:D.t2,fontSize:9}}>/</span></>}
              <span style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:selClr}}/>
                <span style={{color:D.t0,fontWeight:600,fontSize:mob?12:11}}>{sel}</span>
              </span>
            </div>
          </div>
          {loading&&<span style={{fontSize:9,fontFamily:F.m,color:D.t2}}>Carregando…</span>}
        </div>

        <div style={{padding:mob?"14px":"20px 24px",paddingTop:"20px",flex:1,minWidth:0}}>
          {error&&(
            <div style={{display:"flex",gap:12,padding:"14px 18px",marginBottom:16,
              background:gl(D.err,0.08),border:`1px solid ${gl(D.err,0.22)}`,
              borderRadius:10,fontSize:11,color:D.err}}>
              <i className="ti ti-alert-circle" style={{fontSize:15,marginTop:1,flexShrink:0}}/>
              <div>Não foi possível carregar o Google Sheets. Verifique se está público.<br/>
                <span style={{fontFamily:F.m,fontSize:9,opacity:0.6}}>{error}</span></div>
            </div>
          )}
          {loading&&!error&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",padding:"80px",gap:12,textAlign:"center"}}>
              <div style={{width:48,height:48,borderRadius:12,background:gl(CH_D.r0,0.1),
                display:"flex",alignItems:"center",justifyContent:"center",color:CH_D.r0,fontSize:22}}>
                <i className="ti ti-refresh spinning"/>
              </div>
              <div style={{fontSize:12,color:D.t1}}>Buscando dados do Google Sheets…</div>
            </div>
          )}
          {!loading&&!error&&rows&&(
            CAMPANHAS_CHILE[sel].cols===null
              ?<OverviewChile M={M} onSelect={handleChileSelect}/>
              :<DetailChile selected={sel} M={M} onBack={()=>setSel("Todas as Campanhas")}/>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── WE LOVE PERU ────────────────────────────────────────────────────────────
function OverviewPeru({M, onSelect}) {
  const mob = useIsMobile();
  const total = SPECIFIC_PERU.reduce((acc,[,info])=>acc+(M[info.cols[0]]??0),0);
  const cLabels = SPECIFIC_PERU.map(([,i])=>i.label_resumo);
  const cVals   = SPECIFIC_PERU.map(([,i])=>M[i.cols[0]]??0);
  const cColors = SPECIFIC_PERU.map(([k])=>peruClr(k));

  const allStages=[],allRates=[],allColors=[];
  SPECIFIC_PERU.forEach(([k,info])=>{
    const topo=M[info.cols[0]]??0;
    info.cols.slice(1).forEach((col,idx)=>{
      allStages.push(`${info.label_resumo} → ${info.etapas[idx+1]}`);
      allRates.push(safePct(topo,M[col]??0));
      allColors.push(peruClr(k));
    });
  });

  const bestIdx=allRates.indexOf(Math.max(...allRates,0));
  const totalLink=SPECIFIC_PERU.reduce((acc,[,info])=>{
    if((info.kpi_sub_label||"").includes("Link")) acc+=M[info.kpi_sub_col]??0;
    return acc;
  },0);

  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16,overflow:"visible"}}>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"2fr 1fr 1fr 1fr",gap:mob?10:12,alignItems:"stretch"}}>
        <div className="fade-up stagger-1" style={{display:"flex"}}>
          <KPIPeru label="Total na base" value={fmtNum(total)} sub="entradas em todos os funis"
            color={PERU_D.r0} spark={cVals} featured wide/>
        </div>
        <div className="fade-up stagger-2" style={{display:"flex"}}>
          <KPIPeru label="Acessaram o Link" value={fmtNum(totalLink)}
            chip={`${fmtPct(total,totalLink)} do total`} color={D.ok}/>
        </div>
        <div className="fade-up stagger-3" style={{display:"flex"}}>
          <KPIPeru label="Melhor conversão"
            value={allRates[bestIdx]?`${allRates[bestIdx].toFixed(1)}%`:"—"}
            sub={allStages[bestIdx]||""} color={PERU_D.r1}/>
        </div>
        <div className="fade-up stagger-4" style={{display:"flex"}}>
          <KPIPeru label="Campanhas ativas" value={String(SPECIFIC_PERU.length)}
            sub="automações ManyChat" color={PERU_D.r2}/>
        </div>
      </div>

      <Card glow={PERU_D.r0}>
        <CH title="Campanhas" sub="Clique para detalhar uma campanha"
          right={<Tag color={PERU_D.r0}>ManyChat</Tag>}/>
        <div>
          {SPECIFIC_PERU.map(([key,info],i)=>(
            <div key={key} className={`fade-up stagger-${i+2}`}>
              <CampRowPeru campKey={key} info={info} M={M}
                onSelect={onSelect} isLast={i===SPECIFIC_PERU.length-1}/>
            </div>
          ))}
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"3fr 2fr",gap:12,alignItems:"stretch"}}>
        <div className="scale-in stagger-5" style={{display:"flex"}}>
          <Card glow={PERU_D.r1} style={{flex:1,display:"flex",flexDirection:"column"}}>
            <CH title="Volume por campanha" sub="Entradas no topo do funil"/>
            <div style={{padding:"14px 20px 18px",flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
              <VolumeBar labels={cLabels} values={cVals} colors={cColors}/>
            </div>
          </Card>
        </div>
        <div className="scale-in stagger-6" style={{display:"flex"}}>
          <Card glow={PERU_D.r2} style={{flex:1,display:"flex",flexDirection:"column"}}>
            <CH title="Distribuição" sub="Participação percentual"/>
            <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
              <Donut labels={cLabels} values={cVals} colors={cColors}/>
            </div>
          </Card>
        </div>
      </div>

      {allStages.length>0&&(
        <Card glow={PERU_D.r0}>
          <CH title="Taxas de conversão" sub="% do topo que avançou em cada etapa"/>
          <div style={{padding:"4px 20px 12px",display:"grid",
            gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 40px"}}>
            {allStages.map((s,i)=>{
              const r=allRates[i]??0;
              const clr=r>70?D.ok:r>40?allColors[i]:r>20?D.warn:D.err;
              return (
                <div key={i}>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flex:"0 0 165px"}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:allColors[i],flexShrink:0}}/>
                      <span style={{fontSize:11,color:D.t1,lineHeight:1.3}}>{s}</span>
                    </div>
                    <div style={{flex:1,height:4,background:gl("#fff",0.05),borderRadius:2,overflow:"hidden"}}>
                      <div style={{width:`${Math.min(r,100)}%`,height:"100%",background:clr,borderRadius:2,transition:"width .5s"}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,fontFamily:F.m,color:clr,width:42,textAlign:"right"}}>
                      {r>0?`${r.toFixed(1)}%`:"—"}
                    </span>
                  </div>
                  <Divider/>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function KPIPeru({label,value,chip,sub,color=PERU_D.r0,spark,wide,featured}) {
  const mob=useIsMobile();
  return (
    <div style={{
      background: featured ? gl(color,0.07) : D.s2,
      border:`1px solid ${featured?gl(color,0.28):D.b0}`,
      borderRadius:12,padding:"20px 22px",
      display:"flex",flexDirection:"column",justifyContent:"space-between",
      height:"100%",minHeight:mob?100:130,width:"100%",
      position:"relative",overflow:"hidden",
      boxShadow: featured ? `0 0 36px ${gl(color,0.1)}, inset 0 1px 0 ${gl(color,0.12)}` : `inset 0 1px 0 rgba(255,255,255,0.03)`,
      ...(wide?{gridColumn:"span 2"}:{}),
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,${color},${gl(color,0.4)},transparent)`}}/>
      {featured&&<div style={{position:"absolute",top:-48,right:-48,width:120,height:120,
        borderRadius:"50%",background:gl(color,0.08),filter:"blur(28px)",pointerEvents:"none"}}/>}
      <div style={{fontSize:9,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
        textTransform:"uppercase",color:featured?gl(color,0.8):D.t2,marginBottom:10}}>{label}</div>
      <div style={{fontSize:mob?24:30,fontWeight:300,lineHeight:1,letterSpacing:"-0.025em",
        color:D.t0,marginBottom:chip||sub?8:0,fontFamily:F.h,width:"100%",transition:"all 0.3s ease"}}>{value}</div>
      {chip&&<Tag color={color}>{chip}</Tag>}
      {sub&&<div style={{fontSize:10,color:D.t1,marginTop:sub&&chip?6:0,fontFamily:F.m}}>{sub}</div>}
      {spark&&<div style={{marginTop:12,opacity:0.75}}><Spark vals={spark} color={color}/></div>}
    </div>
  );
}

function CampRowPeru({campKey,info,M,onSelect,isLast}) {
  const [hov,setHov]=useState(false);
  const mob=useIsMobile();
  const clr=peruClr(campKey);
  const vals=info.cols.map(c=>M[c]??0);
  const topo=vals[0]||1;
  const finalV=vals[vals.length-1];
  const conv=safePct(topo,finalV);
  const convClr=conv>60?D.ok:conv>30?D.warn:D.err;

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>onSelect(campKey)}
      style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",
        cursor:"pointer",background:hov?D.s3:"transparent",
        borderBottom:isLast?"none":`1px solid ${D.b0}`,
        transition:"background .12s, transform .15s",
        transform:hov?"translateX(2px)":"translateX(0)",
        minWidth:0,overflow:"hidden"}}>
      <div style={{width:30,height:30,borderRadius:8,background:gl(clr,0.12),
        display:"flex",alignItems:"center",justifyContent:"center",color:clr,fontSize:14,flexShrink:0}}>
        <i className={`ti ${info.icon}`}/>
      </div>
      <div style={{flex:"0 0 120px",minWidth:0}}>
        <div style={{fontSize:12,fontWeight:500,color:D.t0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{info.label_resumo}</div>
        <div style={{fontSize:9,color:D.t2,fontFamily:F.m,marginTop:2}}>{info.etapas.length} etapas</div>
      </div>
      <div style={{flex:1,display:"flex",gap:4,alignItems:"flex-end",height:32,padding:"0 16px"}}>
        {vals.map((v,i)=>{
          const hPct=Math.max(8,Math.round((v/topo)*100));
          const opacity=1-i*(0.55/Math.max(vals.length-1,1));
          return (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end",height:"100%"}}>
              <div style={{width:"100%",height:`${hPct}%`,borderRadius:"2px 2px 0 0",
                background:clr,opacity,transition:"height .4s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
          );
        })}
      </div>
      <div style={{width:64,textAlign:"right"}}>
        <div style={{fontSize:14,fontWeight:300,color:D.t0,fontFamily:F.h}}>{fmtNum(topo)}</div>
        <div style={{fontSize:8,color:D.t2,fontFamily:F.m,marginTop:1}}>LEADS</div>
      </div>
      <div style={{width:60,textAlign:"right"}}>
        <div style={{fontSize:13,fontWeight:600,color:convClr,fontFamily:F.m}}>{conv.toFixed(1)}%</div>
        <div style={{fontSize:8,color:D.t2,fontFamily:F.m,marginTop:1}}>CONV.</div>
      </div>
      <div style={{width:20,textAlign:"right",color:D.t2,opacity:hov?1:0,transition:"opacity .12s"}}>
        <i className="ti ti-chevron-right" style={{fontSize:14}}/>
      </div>
    </div>
  );
}

function DetailPeru({selected,M,onBack}) {
  const mob=useIsMobile();
  const info=CAMPANHAS_PERU[selected];
  const clr=peruClr(selected);
  const vals=info.cols.map(c=>M[c]??0);
  const topo=vals[0];
  const finalConv=safePct(topo,vals[vals.length-1]);
  const convClr=finalConv>60?D.ok:finalConv>30?D.warn:D.err;

  if(topo===0) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"80px",gap:16,textAlign:"center"}}>
      <div style={{width:52,height:52,borderRadius:14,background:gl(clr,0.1),
        display:"flex",alignItems:"center",justifyContent:"center",color:clr,fontSize:24}}>
        <i className="ti ti-alert-circle"/>
      </div>
      <div style={{fontSize:15,fontWeight:500,color:D.t0}}>Sem dados ainda</div>
      <button onClick={onBack} style={{fontSize:12,color:clr,background:"none",
        border:"none",cursor:"pointer",fontFamily:F.b,textDecoration:"underline"}}>
        ← Voltar
      </button>
    </div>
  );

  const convLabels=info.etapas.slice(1).map(e=>`Topo → ${e}`);
  const convRates=vals.slice(1).map(v=>safePct(topo,v));

  return (
    <div className="fade-up" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <button onClick={onBack}
          style={{width:30,height:30,borderRadius:8,background:gl(clr,0.1),
            border:`1px solid ${gl(clr,0.2)}`,display:"flex",alignItems:"center",
            justifyContent:"center",color:clr,cursor:"pointer",fontSize:13,flexShrink:0}}>
          <i className="ti ti-arrow-left"/>
        </button>
        <span style={{width:6,height:6,borderRadius:"50%",background:clr,flexShrink:0}}/>
        <span style={{fontSize:14,fontWeight:600,color:D.t0}}>{selected}</span>
        {!mob&&<span style={{fontSize:10,color:D.t2,fontFamily:F.m}}>{info.desc}</span>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":`repeat(${Math.min(info.cols.length,5)},1fr)`,gap:10}}>
        {info.cols.map((col,i)=>(
          <div key={i} className={`fade-up stagger-${i+1}`}>
            <KPIPeru label={info.etapas[i]} value={fmtNum(vals[i])}
              chip={i>0?`${fmtPct(topo,vals[i])} do topo`:null}
              color={i===0?clr:gl(clr,0.6)} featured={i===0}/>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:12}}>
        <Card glow={clr}>
          <CH title="Funil detalhado" sub="Volume e queda entre etapas"/>
          <div style={{padding:"8px 20px 16px"}}>
            <FunnelViz etapas={info.etapas} values={vals} color={clr}/>
          </div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card glow={clr} style={{flex:1}}>
            <CH title="Conversão por etapa" sub="% do topo que chegou a cada passo"/>
            <div style={{padding:"4px 20px 12px"}}>
              <ConvRates stages={convLabels} rates={convRates} color={clr}/>
            </div>
          </Card>
          <div style={{background:gl(clr,0.07),border:`1px solid ${gl(clr,0.22)}`,
            borderRadius:12,padding:"18px 20px",position:"relative",overflow:"hidden",
            boxShadow:`0 0 32px ${gl(clr,0.1)}, inset 0 1px 0 ${gl(clr,0.15)}`}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,
              background:`linear-gradient(90deg,${clr},${gl(clr,0.3)},transparent)`}}/>
            <div style={{position:"absolute",bottom:-40,right:-40,width:110,height:110,
              borderRadius:"50%",background:gl(clr,0.07),filter:"blur(28px)",pointerEvents:"none"}}/>
            <div style={{fontSize:8,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
              textTransform:"uppercase",color:gl(clr,0.7),marginBottom:10}}>Conversão final</div>
            <div style={{fontSize:40,fontWeight:300,letterSpacing:"-0.025em",
              lineHeight:1,marginBottom:6,fontFamily:F.h,color:convClr}}>{finalConv.toFixed(1)}%</div>
            <div style={{fontSize:11,color:D.t1}}>
              <span style={{color:D.t0,fontWeight:500}}>{fmtNum(topo)}</span> entraram ·{" "}
              <span style={{color:D.t0,fontWeight:500}}>{fmtNum(vals[vals.length-1])}</span> chegaram ao fim
            </div>
            <div style={{marginTop:12,opacity:0.7}}><Spark vals={vals} color={clr} h={30}/></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EcosystemPeru({title}) {
  const {rows,boolCols,error,loading,lastSync,reload}=useData(PERU_URL);
  const [sel,setSel]=useState("Todas as Campanhas");
  const [sideOpen,setSideOpen]=useState(false);
  const mob=useIsMobile();
  const M=useMemo(()=>(!rows||!boolCols)?{}:buildMetrics(rows,boolCols),[rows,boolCols]);
  const timeStr=lastSync?.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  const selClr=sel==="Todas as Campanhas"?PERU_D.r0:peruClr(sel);
  const handlePeruSelect=(key)=>{setSel(key);if(mob)setSideOpen(false);};

  return (
    <div style={{display:"flex",flex:1,minHeight:0}}>
      {mob&&sideOpen&&(
        <div onClick={()=>setSideOpen(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:80}}/>
      )}
      <nav style={{
        width:218,flexShrink:0,background:D.s1,
        borderRight:`1px solid ${D.b0}`,display:"flex",flexDirection:"column",
        ...(mob?{
          position:"fixed",top:0,left:0,bottom:0,zIndex:90,
          transform:sideOpen?"translateX(0)":"translateX(-100%)",
          transition:"transform 0.25s cubic-bezier(.4,0,.2,1)",
        }:{
          position:"sticky",top:58,height:"calc(100vh - 58px)",overflow:"hidden auto",
        })
      }}>
        <div style={{padding:"16px 16px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,
            background:gl(PERU_D.r0,0.07),border:`1px solid ${gl(PERU_D.r0,0.18)}`,
            borderRadius:8,padding:"8px 10px"}}>
            <div style={{width:24,height:24,borderRadius:6,flexShrink:0,
              background:`linear-gradient(135deg,${PERU_D.r0},${PERU_D.r3})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif"}}>P</div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:D.t0,fontFamily:F.h}}>We Love Peru</div>
              <div style={{fontSize:8,color:D.t2,fontFamily:F.m,letterSpacing:"0.06em",marginTop:1}}>WE LOVE · ANALYTICS</div>
            </div>
          </div>
        </div>
        <Divider/>
        <div style={{padding:"10px 0 6px"}}>
          <div style={{fontSize:8,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
            textTransform:"uppercase",color:D.t2,padding:"0 16px 6px"}}>Visão geral</div>
          <NavItem icon="ti-layout-grid" label="Todas as campanhas"
            active={sel==="Todas as Campanhas"} onClick={()=>setSel("Todas as Campanhas")} color={PERU_D.r0}/>
        </div>
        <Divider/>
        <div style={{padding:"10px 0 6px"}}>
          <div style={{fontSize:8,fontWeight:700,fontFamily:F.m,letterSpacing:"0.12em",
            textTransform:"uppercase",color:D.t2,padding:"0 16px 6px"}}>Campanhas</div>
          {SPECIFIC_PERU.map(([key,info])=>(
            <NavItem key={key} icon={info.icon} label={info.label_resumo}
              count={(M[info.cols[0]]??0)>0?fmtNum(M[info.cols[0]]):null}
              active={sel===key} onClick={()=>handlePeruSelect(key)} color={peruClr(key)}/>
          ))}
        </div>
        <div style={{marginTop:"auto",padding:"14px 16px",borderTop:`1px solid ${D.b0}`}}>
          {timeStr&&(
            <div style={{fontSize:9,fontFamily:F.m,color:D.t2,marginBottom:10,
              display:"flex",alignItems:"center",gap:5}}>
              <i className="ti ti-circle-check" style={{fontSize:11,color:D.ok}}/>
              Atualizado às {timeStr}
            </div>
          )}
          <button onClick={reload}
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,
              fontSize:10,fontFamily:F.m,fontWeight:500,
              color:loading?D.t2:D.t1,background:"transparent",
              border:`1px solid ${D.b0}`,borderRadius:8,
              padding:"7px 0",cursor:"pointer",width:"100%",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=gl("#fff",0.05);}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <i className={`ti ti-refresh${loading?" spinning":""}`} style={{fontSize:12}}/>
            {loading?"Sincronizando…":"Sincronizar"}
          </button>
        </div>
      </nav>

      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",background:D.s0,overflowX:"hidden",height:"calc(100vh - 58px)",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:mob?"10px 14px":"10px 24px",background:D.s1,borderBottom:`1px solid ${D.b0}`,
          position:"sticky",top:0,zIndex:40,gap:12,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {mob&&(
              <button onClick={()=>setSideOpen(v=>!v)}
                style={{width:32,height:32,borderRadius:8,background:gl(selClr,0.1),
                  border:`1px solid ${gl(selClr,0.2)}`,display:"flex",alignItems:"center",
                  justifyContent:"center",color:selClr,cursor:"pointer",fontSize:15,flexShrink:0}}>
                <i className="ti ti-menu-2"/>
              </button>
            )}
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:D.t1}}>
              {!mob&&<><span style={{color:D.t2}}>{title}</span><span style={{color:D.t2,fontSize:9}}>/</span></>}
              <span style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:selClr}}/>
                <span style={{color:D.t0,fontWeight:600,fontSize:mob?12:11}}>{sel}</span>
              </span>
            </div>
          </div>
          {loading&&<span style={{fontSize:9,fontFamily:F.m,color:D.t2}}>Carregando…</span>}
        </div>

        <div style={{padding:mob?"14px":"20px 24px",paddingTop:"20px",flex:1,minWidth:0}}>
          {error&&(
            <div style={{display:"flex",gap:12,padding:"14px 18px",marginBottom:16,
              background:gl(D.err,0.08),border:`1px solid ${gl(D.err,0.22)}`,
              borderRadius:10,fontSize:11,color:D.err}}>
              <i className="ti ti-alert-circle" style={{fontSize:15,marginTop:1,flexShrink:0}}/>
              <div>Não foi possível carregar o Google Sheets. Verifique se está público.<br/>
                <span style={{fontFamily:F.m,fontSize:9,opacity:0.6}}>{error}</span></div>
            </div>
          )}
          {loading&&!error&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",padding:"80px",gap:12,textAlign:"center"}}>
              <div style={{width:48,height:48,borderRadius:12,background:gl(PERU_D.r0,0.1),
                display:"flex",alignItems:"center",justifyContent:"center",color:PERU_D.r0,fontSize:22}}>
                <i className="ti ti-refresh spinning"/>
              </div>
              <div style={{fontSize:12,color:D.t1}}>Buscando dados do Google Sheets…</div>
            </div>
          )}
          {!loading&&!error&&rows&&(
            CAMPANHAS_PERU[sel].cols===null
              ?<OverviewPeru M={M} onSelect={handlePeruSelect}/>
              :<DetailPeru selected={sel} M={M} onBack={()=>setSel("Todas as Campanhas")}/>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMING SOON ─────────────────────────────────────────────────────────────
function ComingSoon({title}) {
  return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:D.s0}}>
      <div style={{textAlign:"center",maxWidth:300,padding:48}}>
        <div style={{fontSize:52,fontWeight:300,color:D.t2,letterSpacing:"-0.04em",lineHeight:1,marginBottom:18,fontFamily:F.h}}>
          Em breve
        </div>
        <div style={{fontSize:12,color:D.t2,lineHeight:1.9}}>
          Conecte a planilha ManyChat do ecossistema{" "}
          <strong style={{color:D.t1}}>{title}</strong> para ativar esta área.
        </div>
        <div style={{display:"inline-flex",alignItems:"center",gap:7,marginTop:22,
          padding:"7px 16px",fontSize:8,fontFamily:F.m,fontWeight:700,
          letterSpacing:"0.1em",textTransform:"uppercase",
          border:`1px solid ${D.b0}`,borderRadius:20,color:D.t2,marginTop:20}}>
          <i className="ti ti-plug-off" style={{fontSize:12}}/>
          Aguardando conexão
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
const TABS=[
  {label:"Laise Mesquita", content:<Ecosystem title="Laise Mesquita"/>},
  {label:"We Love Chile",  content:<EcosystemChile title="We Love Chile"/>},
  {label:"We Love Peru",   content:<EcosystemPeru title="We Love Peru"/>},
];

export default function App() {
  const [tab,setTab]=useState(0);
  const [hov,setHov]=useState(null);
  const isMob=useIsMobile();
  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",
      background:D.s0,fontFamily:F.b,color:D.t0,overflowX:"hidden",maxWidth:"100vw"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{margin:0;padding:0;width:100%;min-height:100%;overflow-x:hidden;}
        body{background:#050505;overflow-x:hidden;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.13);}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .spinning{animation:spin 1s linear infinite;display:inline-block;}
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes slideOut{from{transform:translateX(0)}to{transform:translateX(-100%)}}
        .sidebar-open{animation:slideIn 0.25s cubic-bezier(.4,0,.2,1) both}
        .sidebar-close{animation:slideOut 0.2s cubic-bezier(.4,0,.2,1) both}
        @media(max-width:767px){
          .mob-hide{display:none!important;}
          .mob-col{flex-direction:column!important;}
          .mob-full{width:100%!important;min-width:0!important;}
          .mob-grid1{grid-template-columns:1fr!important;}
          .mob-grid2{grid-template-columns:1fr 1fr!important;}
          .mob-p{padding:14px 14px!important;}
          .mob-no-pad{padding:0!important;}
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes slideRight{from{width:0}to{width:100%}}
        @keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.45s cubic-bezier(.4,0,.2,1) both}
        .fade-in{animation:fadeIn 0.35s ease both}
        .scale-in{animation:scaleIn 0.35s cubic-bezier(.4,0,.2,1) both}
        .stagger-1{animation-delay:0.05s}
        .stagger-2{animation-delay:0.10s}
        .stagger-3{animation-delay:0.15s}
        .stagger-4{animation-delay:0.20s}
        .stagger-5{animation-delay:0.25s}
        .stagger-6{animation-delay:0.30s}
        .stagger-7{animation-delay:0.35s}
        .stagger-8{animation-delay:0.40s}
      `}</style>

      {/* Topbar global */}
      <div style={{display:"flex",alignItems:"center",background:D.s1,
        borderBottom:`1px solid ${D.b0}`,padding:isMob?"0 12px":"0 20px",
        position:"sticky",top:0,zIndex:50,height:58,flexShrink:0,
        boxShadow:`0 1px 0 ${D.b0}`}}>

        <div style={{display:"flex",alignItems:"center",marginRight:isMob?10:20,flexShrink:0}}>
          <img src={zafraLogo} alt="Zafra"
            style={{height:isMob?36:52,width:"auto",objectFit:"contain",
              filter:`drop-shadow(0 0 12px ${gl(D.r0,0.35)})`}}/>
        </div>

        {!isMob&&<div style={{width:1,height:14,background:D.b1,marginRight:18}}/>}

        {TABS.map((t,i)=>{
          const active=i===tab;
          return (
            <button key={i} onClick={()=>setTab(i)}
              onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{fontFamily:F.b,fontSize:isMob?10:11,fontWeight:active?600:400,
                color:active?D.t0:hov===i?D.t0:D.t1,
                background:"transparent",border:"none",
                borderBottom:`2px solid ${active?D.r0:"transparent"}`,
                padding:isMob?"0 8px":"0 14px",height:"100%",cursor:"pointer",
                transition:"color .15s,border-color .15s",
                marginBottom:-1,whiteSpace:"nowrap"}}>
              {isMob?t.label.split(" ")[0]:t.label}
            </button>
          );
        })}

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center"}}>
          <img src={manychatLogo} alt="ManyChat"
            style={{height:isMob?20:32,width:"auto",objectFit:"contain",opacity:0.7}}/>
        </div>
      </div>

      <div style={{display:"flex",flex:1}}>
        {TABS[tab].content}
      </div>
    </div>
  );
}