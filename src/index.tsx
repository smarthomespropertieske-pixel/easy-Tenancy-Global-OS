import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>easyTenancy — The #1 Global Real Estate Operating System</title>
<meta name="description" content="Compliance-first real estate OS trusted by 50,000+ property managers across 120 countries. Automate compliance, rent collection, legal enforcement, and revenue — end to end."/>
<meta property="og:title" content="easyTenancy — The #1 Global Real Estate OS"/>
<meta property="og:description" content="50,000+ managers · 2.4M leases · 120 countries · Zero compliance fines · 400× ROI"/>
<meta name="theme-color" content="#050a14"/>
<style>html,body{font-family:'Inter',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}</style>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --cyan:#39bff6;--cyan2:#2aa7e8;--blue:#2563eb;--blue2:#1d4ed8;--blue3:#1e64b8;--blue4:#184ea3;
  --purple:#a78bfa;--green:#10b981;--amber:#f59e0b;--red:#ef4444;--pink:#ec4899;
  --surface:#050a14;--card:#0b1120;--card2:#0f172a;--card3:#111827;
  --border:rgba(255,255,255,.07);--border2:rgba(255,255,255,.04);--border3:rgba(57,191,246,.2);
  --text:#f1f5f9;--text2:#94a3b8;--text3:#475569;--text4:#64748b;
  --grad:linear-gradient(135deg,#39bff6 0%,#2563eb 50%,#1d4ed8 100%);
  --grad-hero:linear-gradient(135deg,#fff 0%,#93c5fd 40%,#a78bfa 100%);
}
html{scroll-behavior:smooth}
body{background:var(--surface);color:var(--text);font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
::selection{background:rgba(57,191,246,.25);color:#fff}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:#050a14}
::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#2563eb,#7c3aed);border-radius:4px}

/* LOADER */
#PL{position:fixed;inset:0;background:var(--surface);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;transition:opacity .7s,visibility .7s}
#PL.out{opacity:0;visibility:hidden;pointer-events:none}
.pl-mark{font-size:34px;font-weight:900;letter-spacing:-.5px}
.pl-e{background:linear-gradient(135deg,#39bff6,#2aa7e8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pl-t{background:linear-gradient(135deg,#2563eb,#1e64b8,#184ea3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pl-bar{width:200px;height:2px;background:rgba(255,255,255,.06);border-radius:99px;overflow:hidden}
.pl-fill{height:100%;background:var(--grad);animation:plFill 1.8s ease-out forwards}
@keyframes plFill{0%{width:0}100%{width:100%}}
.pl-sub{font-size:12px;color:var(--text3);letter-spacing:.06em}
.pl-orb{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none}
.pl-o1{width:320px;height:320px;background:radial-gradient(circle,rgba(29,78,216,.22),transparent);top:15%;left:15%}
.pl-o2{width:220px;height:220px;background:radial-gradient(circle,rgba(167,139,250,.18),transparent);bottom:20%;right:20%}

/* CURSOR */
#CG{position:fixed;pointer-events:none;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(57,191,246,.035) 0%,transparent 70%);transform:translate(-50%,-50%);z-index:1;transition:opacity .3s}

/* URGENCY BAR */
.urg{background:linear-gradient(90deg,#1d4ed8,#7c3aed,#1d4ed8);background-size:200%;animation:urgMove 6s linear infinite;padding:9px 20px;text-align:center;font-size:12.5px;font-weight:600;color:#fff;letter-spacing:.02em;position:sticky;top:0;z-index:200}
@keyframes urgMove{0%{background-position:0%}100%{background-position:200%}}

/* NAV */
nav{position:fixed;top:36px;left:0;right:0;z-index:150;height:64px;display:flex;align-items:center;padding:0 max(24px,4vw);transition:background .3s,border-color .3s,top .3s}
nav.sc{background:rgba(5,10,20,.9);backdrop-filter:blur(28px);border-bottom:1px solid var(--border);top:0}
.nav-in{width:100%;max-width:1320px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px}
.logo{text-decoration:none;display:flex;align-items:center;gap:8px;flex-shrink:0}
.logo-text{font-size:20px;font-weight:900;letter-spacing:-.5px;line-height:1}
.logo-e{background:linear-gradient(135deg,#39bff6,#2aa7e8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.logo-t{background:linear-gradient(135deg,#2563eb,#1e64b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.logo:hover .logo-text{filter:drop-shadow(0 0 10px rgba(57,191,246,.5))}
.nav-links{display:flex;align-items:center;gap:2px}
.nl{padding:7px 12px;border-radius:8px;font-size:13px;font-weight:500;color:var(--text2);text-decoration:none;transition:color .15s,background .15s;white-space:nowrap}
.nl:hover{color:#fff;background:rgba(255,255,255,.05)}
.nav-acts{display:flex;align-items:center;gap:10px;flex-shrink:0}
.btn-sm{padding:8px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;border:none;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border)}
.btn-ghost:hover{color:#fff;border-color:rgba(57,191,246,.4);background:rgba(57,191,246,.07)}
.btn-pri{background:var(--grad);color:#fff;box-shadow:0 0 18px rgba(37,99,235,.35)}
.btn-pri:hover{transform:translateY(-1px);box-shadow:0 0 32px rgba(37,99,235,.6)}
#hbg{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:8px;z-index:999}
#hbg span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:all .3s}
#hbg.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
#hbg.open span:nth-child(2){opacity:0}
#hbg.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
#MN{position:fixed;inset:0;z-index:140;background:rgba(5,10,20,.97);backdrop-filter:blur(20px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}
#MN.open{opacity:1;visibility:visible}
#MN a{font-size:22px;font-weight:700;color:var(--text2);text-decoration:none;transition:color .2s}
#MN a:hover{color:#fff}

/* VIDEO MODAL */
#vmod{position:fixed;inset:0;z-index:9000;background:rgba(5,10,20,.93);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:opacity .35s,visibility .35s}
#vmod.open{opacity:1;visibility:visible}
.vwrap{width:min(860px,90vw);aspect-ratio:16/9;background:#000;border-radius:18px;overflow:hidden;position:relative;box-shadow:0 40px 120px rgba(0,0,0,.7),0 0 0 1px rgba(57,191,246,.2)}
.vclose{position:absolute;top:-44px;right:0;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.08);border:none;color:var(--text2);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
.vclose:hover{background:rgba(255,255,255,.15);color:#fff}
.vph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#050a14,#0b1120);position:relative;overflow:hidden}
.vgrid{position:absolute;inset:0;background-image:linear-gradient(rgba(57,191,246,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(57,191,246,.025) 1px,transparent 1px);background-size:40px 40px}
.vorb{position:absolute;border-radius:50%;filter:blur(40px)}
.vplay{width:80px;height:80px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 40px rgba(37,99,235,.6);transition:transform .2s,box-shadow .2s;position:relative;z-index:2;border:none}
.vplay:hover{transform:scale(1.1);box-shadow:0 0 60px rgba(37,99,235,.85)}
.vplay::before{content:'';position:absolute;inset:-10px;border-radius:50%;border:2px solid rgba(57,191,246,.28);animation:vPulse 2s ease-in-out infinite}
@keyframes vPulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.15);opacity:0}}
.vinfo{text-align:center;margin-top:20px;position:relative;z-index:2}
.vinfo h3{font-size:18px;font-weight:700;color:#fff;margin-bottom:6px}
.vinfo p{font-size:13px;color:var(--text3)}
.vtags{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px}
.vtag{padding:5px 12px;border:1px solid var(--border);border-radius:7px;font-size:11.5px;color:var(--text3)}

/* SECTIONS */
section{position:relative;padding:100px max(24px,5vw)}
.inner{max-width:1320px;margin:0 auto;position:relative;z-index:2}
.badge{display:inline-flex;align-items:center;gap:7px;padding:5px 13px;border-radius:999px;background:rgba(57,191,246,.08);border:1px solid rgba(57,191,246,.2);color:#7dd3fc;font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;margin-bottom:18px}
.badge .dot{width:6px;height:6px;border-radius:50%;background:#39bff6;animation:bdot 2s ease-in-out infinite}
@keyframes bdot{0%,100%{opacity:1}50%{opacity:.2}}
.sec-title{font-size:clamp(28px,3.6vw,50px);font-weight:900;line-height:1.08;letter-spacing:-1.5px;margin-bottom:14px}
.sec-sub{font-size:clamp(15px,1.5vw,17px);color:var(--text2);line-height:1.65;max-width:560px}
.grad-text{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.grad-hero{background:var(--grad-hero);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.mt8{margin-top:32px}
.tc{text-align:center}
.mxa{margin-left:auto;margin-right:auto}

/* HERO */
#hero{min-height:100vh;display:flex;align-items:center;padding-top:140px;padding-bottom:80px;overflow:hidden}
.hbg{position:absolute;inset:0;overflow:hidden}
.hmesh{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 40%,rgba(29,78,216,.16) 0%,transparent 70%),radial-gradient(ellipse 55% 50% at 80% 20%,rgba(167,139,250,.1) 0%,transparent 70%),radial-gradient(ellipse 45% 40% at 55% 88%,rgba(57,191,246,.07) 0%,transparent 60%)}
.hgrid{position:absolute;inset:0;background-image:linear-gradient(rgba(57,191,246,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(57,191,246,.03) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse at 50% 40%,black 15%,transparent 75%)}
.hnoise{position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.025'/%3E%3C/svg%3E");pointer-events:none}
.horb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;animation:orbF 9s ease-in-out infinite}
.ho1{width:520px;height:520px;background:radial-gradient(circle,rgba(29,78,216,.18),transparent);top:-8%;left:-4%;animation-delay:0s}
.ho2{width:420px;height:420px;background:radial-gradient(circle,rgba(167,139,250,.13),transparent);top:12%;right:-4%;animation-delay:-3s}
.ho3{width:360px;height:360px;background:radial-gradient(circle,rgba(57,191,246,.09),transparent);bottom:8%;left:32%;animation-delay:-6s}
@keyframes orbF{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-28px) scale(1.04)}}

/* HERO CONTENT */
.award-bar{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.2);border-radius:999px;color:#fde68a;font-size:12px;font-weight:700;margin-bottom:14px}
.live-bar{display:inline-flex;align-items:center;gap:8px;padding:5px 13px;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.18);border-radius:999px;font-size:12px;font-weight:600;color:#6ee7b7;margin-bottom:20px}
.live-dot{width:7px;height:7px;border-radius:50%;background:#10b981;flex-shrink:0;animation:lpulse 2s ease-in-out infinite}
@keyframes lpulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.6)}50%{box-shadow:0 0 0 6px rgba(16,185,129,0)}}
h1.hh{font-size:clamp(38px,5.5vw,82px);font-weight:900;line-height:1.04;letter-spacing:-2.5px;margin-bottom:24px}
.hsub{font-size:clamp(16px,1.7vw,18.5px);color:var(--text2);line-height:1.68;max-width:580px;margin-bottom:36px}
.hctas{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:44px}
.btn-lg{padding:14px 30px;border-radius:14px;font-size:15.5px;font-weight:700;cursor:pointer;transition:all .22s;border:none;text-decoration:none;display:inline-flex;align-items:center;gap:8px}
.btn-plg{background:var(--grad);color:#fff;box-shadow:0 0 30px rgba(37,99,235,.5);position:relative;overflow:hidden}
.btn-plg::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12),transparent);pointer-events:none}
.btn-plg:hover{transform:translateY(-2px);box-shadow:0 0 50px rgba(37,99,235,.7)}
.btn-glg{background:rgba(255,255,255,.04);color:#e2e8f0;border:1px solid rgba(255,255,255,.1)}
.btn-glg:hover{background:rgba(255,255,255,.08);border-color:rgba(57,191,246,.3);color:#fff}
.play-wrap{display:inline-flex;align-items:center;gap:10px;cursor:pointer}
.play-c{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.play-c:hover{background:rgba(57,191,246,.14);border-color:rgba(57,191,246,.4);transform:scale(1.08)}
.proof-strip{display:flex;align-items:center;flex-wrap:wrap;gap:18px}
.proof-item{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text3)}
.proof-item strong{color:var(--text2)}
.proof-sep{width:3px;height:3px;background:var(--border);border-radius:50%}

/* PERSONA SWITCHER */
.psw{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:22px}
.pbtn{padding:6px 14px;border-radius:999px;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text3)}
.pbtn:hover{color:var(--text);border-color:rgba(57,191,246,.35)}
.pbtn.active{background:rgba(57,191,246,.09);color:#7dd3fc;border-color:rgba(57,191,246,.35)}

/* STAT TICKER */
.ticker{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border-radius:16px;overflow:hidden;border:1px solid var(--border)}
.tc-cell{background:var(--card);padding:22px;text-align:center;transition:background .2s}
.tc-cell:hover{background:rgba(15,23,42,.9)}
.tc-num{font-size:27px;font-weight:800;letter-spacing:-1px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tc-lbl{font-size:11.5px;color:var(--text3);margin-top:3px;font-weight:500}
@media(max-width:680px){.ticker{grid-template-columns:repeat(2,1fr)}}

/* DASHBOARD MOCKUP */
.dash{background:rgba(11,17,32,.87);backdrop-filter:blur(24px);border:1px solid rgba(57,191,246,.16);border-radius:20px;overflow:hidden;box-shadow:0 48px 96px rgba(0,0,0,.5),0 0 0 1px rgba(57,191,246,.06),inset 0 1px 0 rgba(255,255,255,.05),0 0 80px rgba(29,78,216,.07)}
.dtop{background:rgba(15,23,42,.8);padding:13px 18px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--border)}
.ddot{width:11px;height:11px;border-radius:50%}
.dbody{padding:22px}
.dkpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
.dkpi{background:rgba(255,255,255,.025);border:1px solid var(--border2);border-radius:10px;padding:14px;text-align:center;transition:all .2s}
.dkpi:hover{border-color:rgba(57,191,246,.18);transform:translateY(-1px)}
.dkval{font-size:20px;font-weight:800;letter-spacing:-.5px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.dkkey{font-size:10.5px;color:var(--text3);margin-top:3px}
.drow{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.dwid{background:rgba(255,255,255,.018);border:1px solid var(--border2);border-radius:10px;padding:14px}
.wt{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px}
.br{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.bl{font-size:11.5px;color:var(--text2);width:60px;flex-shrink:0}
.bb{flex:1;height:5px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden}
.bf{height:100%;border-radius:3px}
.bp{font-size:11.5px;color:var(--text2);width:32px;text-align:right}
.ai{display:flex;align-items:flex-start;gap:9px;padding:7px 0;border-bottom:1px solid var(--border2)}
.ai:last-child{border-bottom:none}
.aidot{width:7px;height:7px;border-radius:50%;margin-top:3px;flex-shrink:0}
.ait{font-size:11.5px;color:var(--text2);line-height:1.45}
.aist{font-size:10.5px;color:var(--text3);margin-top:2px}
@media(max-width:600px){.dkpis{grid-template-columns:repeat(2,1fr)}.drow{grid-template-columns:1fr}}

/* MARQUEE */
.mq-wrap{overflow:hidden;position:relative}
.mq-wrap::before,.mq-wrap::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;pointer-events:none}
.mq-wrap::before{left:0;background:linear-gradient(90deg,var(--card),transparent)}
.mq-wrap::after{right:0;background:linear-gradient(270deg,var(--card),transparent)}
.mq-track{display:flex;animation:mqScroll 28s linear infinite;width:max-content}
.mq-track:hover{animation-play-state:paused}
.mq-rev{animation:mqScroll 32s linear infinite reverse}
.mq-fwd2{animation-duration:22s}
.plogo{display:flex;align-items:center;gap:9px;padding:0 28px;flex-shrink:0}
.pname{font-size:13.5px;font-weight:700;color:var(--text3);white-space:nowrap;transition:color .2s}
.plogo:hover .pname{color:var(--text2)}
@keyframes mqScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
/* Press logos marquee uses surface bg fade */
.mq-surf::before{background:linear-gradient(90deg,var(--surface),transparent)}
.mq-surf::after{background:linear-gradient(270deg,var(--surface),transparent)}
.press-name{font-size:17px;font-weight:800;letter-spacing:-1px;color:rgba(255,255,255,.2);font-style:italic;white-space:nowrap;transition:color .25s}
.plogo:hover .press-name{color:rgba(255,255,255,.5)}

/* PRESS SECTION */
.press-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px}
.pcard{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;position:relative;overflow:hidden;transition:border-color .25s,transform .25s}
.pcard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--grad);opacity:.5}
.pcard:hover{border-color:rgba(57,191,246,.25);transform:translateY(-2px)}
.po{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:10px}
.pq{font-size:14.5px;color:var(--text2);line-height:1.65;font-style:italic}
.pq strong{color:var(--text);font-style:normal}
.pd{margin-top:12px;font-size:11.5px;color:var(--text3)}
@media(max-width:880px){.press-cards{grid-template-columns:1fr}}

/* HOW IT WORKS */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;position:relative}
.steps::before{content:'';position:absolute;top:36px;left:calc(16.67% + 14px);right:calc(16.67% + 14px);height:1px;background:linear-gradient(90deg,transparent,rgba(57,191,246,.3),rgba(57,191,246,.3),transparent);pointer-events:none;z-index:0}
.cndot{position:absolute;top:32px;width:9px;height:9px;border-radius:50%;background:#2563eb;box-shadow:0 0 14px rgba(37,99,235,.9);animation:cnd 3s ease-in-out infinite;z-index:1}
.cnd1{left:calc(33.33% - 5px);animation-delay:0s}
.cnd2{left:calc(66.67% - 5px);animation-delay:1.5s}
@keyframes cnd{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.3)}}
.step{text-align:center;padding:36px 22px;background:rgba(11,17,32,.6);border:1px solid var(--border);border-radius:18px;transition:border-color .25s,transform .25s,box-shadow .25s;position:relative;z-index:1}
.step:hover{border-color:rgba(57,191,246,.28);transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.3)}
.snum{width:68px;height:68px;border-radius:50%;background:rgba(29,78,216,.1);border:1px solid rgba(57,191,246,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;transition:all .25s}
.step:hover .snum{background:rgba(29,78,216,.2);box-shadow:0 0 28px rgba(29,78,216,.22)}
.snum-t{font-size:19px;font-weight:900;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.st{font-size:17px;font-weight:700;color:var(--text);margin-bottom:10px}
.sd{font-size:13.5px;color:var(--text3);line-height:1.6}
.stags{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-top:14px}
.stag{padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600}
.stag-b{background:rgba(57,191,246,.07);border:1px solid rgba(57,191,246,.15);color:#7dd3fc}
.stag-p{background:rgba(167,139,250,.07);border:1px solid rgba(167,139,250,.15);color:#c4b5fd}
.stag-g{background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.15);color:#6ee7b7}
@media(max-width:760px){.steps::before,.cndot{display:none}.steps{grid-template-columns:1fr}}

/* COMPARE */
.cmp-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.cmp-col{border-radius:16px;padding:28px;position:relative}
.cmp-bad{background:rgba(239,68,68,.03);border:1px solid rgba(239,68,68,.1)}
.cmp-good{background:rgba(29,78,216,.04);border:1px solid rgba(29,78,216,.16)}
.cmp-h{font-size:13.5px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:7px}
.cmp-item{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:13.5px;color:var(--text2)}
.cmp-item:last-child{border-bottom:none}
@media(max-width:660px){.cmp-grid{grid-template-columns:1fr}}

/* FEATURES */
.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
@media(max-width:880px){.fg{grid-template-columns:repeat(2,1fr)}}
@media(max-width:540px){.fg{grid-template-columns:1fr}}
.fc{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px;transition:border-color .25s,transform .25s,box-shadow .25s;position:relative;overflow:hidden}
.fc::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E");pointer-events:none;opacity:.4}
.fc:hover{border-color:rgba(57,191,246,.25);transform:translateY(-2px);box-shadow:0 16px 40px rgba(0,0,0,.25)}
.fci{font-size:24px;margin-bottom:12px;display:block}
.fct{font-size:14.5px;font-weight:700;color:var(--text);margin-bottom:6px}
.fcd{font-size:13px;color:var(--text3);line-height:1.58}
.ftag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;margin-top:9px}
.ftb{background:rgba(57,191,246,.08);color:#7dd3fc;border:1px solid rgba(57,191,246,.16)}
.ftp{background:rgba(167,139,250,.08);color:#c4b5fd;border:1px solid rgba(167,139,250,.16)}
.ftg{background:rgba(16,185,129,.08);color:#6ee7b7;border:1px solid rgba(16,185,129,.16)}

/* AI COPILOT */
.ai-grid{display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:start}
.ai-actions{display:flex;flex-direction:column;gap:7px}
.aia{display:flex;align-items:center;gap:10px;padding:11px 14px;background:rgba(255,255,255,.02);border:1px solid var(--border2);border-radius:10px;transition:border-color .2s,background .2s}
.aia:hover{border-color:rgba(167,139,250,.18);background:rgba(167,139,250,.025)}
.aia-ic{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.aia-t{font-size:12.5px;color:var(--text2);line-height:1.4;flex:1}
.aia-b{font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;flex-shrink:0}
.intel-panel{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px}
.iri{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border2)}
.iri:last-child{border-bottom:none}
.irb{flex:1}
.irl{font-size:12.5px;color:var(--text2);margin-bottom:5px;display:flex;justify-content:space-between}
.irp{font-size:11.5px;font-weight:700}
.irbar{height:5px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden}
.irf{height:100%;border-radius:3px}
.isg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:22px}
.is{background:rgba(255,255,255,.02);border:1px solid var(--border2);border-radius:9px;padding:12px;text-align:center}
.isv{font-size:19px;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.isl{font-size:10.5px;color:var(--text3);margin-top:3px}
@media(max-width:880px){.ai-grid{grid-template-columns:1fr}}

/* WORKFLOW */
.wfg{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
@media(max-width:1100px){.wfg{grid-template-columns:repeat(2,1fr)}}
@media(max-width:540px){.wfg{grid-template-columns:1fr}}
.wfc{background:var(--card);border:1px solid var(--border);border-radius:13px;padding:18px;transition:border-color .2s,transform .2s}
.wfc:hover{border-color:rgba(57,191,246,.18);transform:translateY(-2px)}
.wfi{font-size:21px;margin-bottom:9px}
.wft{font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:5px}
.wfs{font-size:17px;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.wfd{font-size:11.5px;color:var(--text3);margin-top:3px;line-height:1.48}

/* METRICS STRIP */
.mstrip{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:14px;overflow:hidden}
@media(max-width:1000px){.mstrip{grid-template-columns:repeat(3,1fr)}}
@media(max-width:560px){.mstrip{grid-template-columns:repeat(2,1fr)}}
.mcell{background:var(--card);padding:18px;text-align:center}
.mbig{font-size:21px;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-.5px}
.mlbl{font-size:11px;color:var(--text3);margin-top:3px;font-weight:500}

/* TRUST */
.trust-g{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
@media(max-width:880px){.trust-g{grid-template-columns:repeat(3,1fr)}}
.trust-i{display:flex;flex-direction:column;align-items:center;gap:7px;padding:16px 12px;background:rgba(255,255,255,.02);border:1px solid var(--border2);border-radius:11px;text-align:center;transition:border-color .2s,background .2s}
.trust-i:hover{border-color:rgba(57,191,246,.16);background:rgba(255,255,255,.03)}
.tii{font-size:22px}
.til{font-size:10.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em}

/* COMPLIANCE */
.comp-g{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
@media(max-width:880px){.comp-g{grid-template-columns:1fr 1fr}}
@media(max-width:540px){.comp-g{grid-template-columns:1fr}}
.comp-c{background:var(--card);border:1px solid var(--border);border-radius:13px;padding:20px;transition:border-color .2s,transform .2s}
.comp-c:hover{border-color:rgba(57,191,246,.18);transform:translateY(-2px)}
.comp-n{font-size:30px;font-weight:900;letter-spacing:-1px;margin-bottom:3px}
.comp-l{font-size:12px;color:var(--text3)}

/* ROI CALC */
.roi-wrap{display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:start}
@media(max-width:860px){.roi-wrap{grid-template-columns:1fr}}
.roi-form{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:28px}
.roi-res{background:rgba(29,78,216,.05);border:1px solid rgba(29,78,216,.16);border-radius:16px;padding:28px;position:relative;overflow:hidden}
.roi-res::before{content:'';position:absolute;inset:0;border-radius:16px;padding:1px;background:linear-gradient(135deg,rgba(57,191,246,.28),rgba(37,99,235,.18),rgba(167,139,250,.18));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.rig{margin-bottom:18px}
.ril{font-size:11.5px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:7px}
.rii{width:100%;padding:10px 13px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:14.5px;font-family:inherit;outline:none;transition:border-color .2s}
.rii:focus{border-color:rgba(57,191,246,.4)}
.rri{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.rri:last-child{border-bottom:none}
.rrl{font-size:12.5px;color:var(--text3)}
.rrv{font-size:17px;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.rtot{margin-top:18px;padding:18px;background:rgba(57,191,246,.06);border:1px solid rgba(57,191,246,.13);border-radius:10px;text-align:center}
.rtl{font-size:12.5px;color:var(--text3);margin-bottom:5px}
.rtv{font-size:42px;font-weight:900;letter-spacing:-2px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* MARKETS */
.mtabs{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:28px}
.mtab{padding:7px 16px;border-radius:9px;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid var(--border);background:transparent;color:var(--text3)}
.mtab:hover{color:var(--text);border-color:rgba(57,191,246,.28)}
.mtab.active{background:rgba(29,78,216,.1);color:#93c5fd;border-color:rgba(57,191,246,.28)}
.mgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media(max-width:880px){.mgrid{grid-template-columns:repeat(2,1fr)}}
.mcrd{background:rgba(255,255,255,.02);border:1px solid var(--border2);border-radius:11px;padding:14px;display:flex;align-items:center;gap:10px;transition:border-color .2s,background .2s}
.mcrd:hover{border-color:rgba(57,191,246,.18);background:rgba(255,255,255,.03)}
.mflag{font-size:21px;flex-shrink:0}
.mname{font-size:13.5px;font-weight:600;color:var(--text2)}
.mst{font-size:11px;color:var(--text3);margin-top:2px}
.mst.live{color:#6ee7b7}
.mst.soon{color:var(--amber)}

/* INTEGRATIONS */
.ig{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
@media(max-width:1100px){.ig{grid-template-columns:repeat(4,1fr)}}
@media(max-width:680px){.ig{grid-template-columns:repeat(3,1fr)}}
.ic{background:rgba(255,255,255,.02);border:1px solid var(--border2);border-radius:11px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:7px;transition:border-color .2s,transform .2s,background .2s}
.ic:hover{border-color:rgba(57,191,246,.18);transform:translateY(-2px);background:rgba(255,255,255,.035)}
.icn{font-size:21px}
.ict{font-size:11px;font-weight:600;color:var(--text3);text-align:center}

/* TESTIMONIALS */
.tbadges{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:36px;align-items:center}
.rbdg{display:flex;align-items:center;gap:9px;padding:9px 16px;background:var(--card);border:1px solid var(--border);border-radius:11px;transition:border-color .2s}
.rbdg:hover{border-color:rgba(57,191,246,.22)}
.rbdi{font-size:19px}
.rbds{font-size:15px;font-weight:800;color:var(--text)}
.rbdl{font-size:10.5px;color:var(--text3)}
.nps-b{display:flex;align-items:center;gap:9px;padding:9px 16px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18);border-radius:11px}
.nps-s{font-size:19px;font-weight:900;color:#10b981}
.nps-l{font-size:11px;color:var(--text3)}
.tg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
@media(max-width:880px){.tg{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.tg{grid-template-columns:1fr}}
.tc-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;transition:border-color .25s,transform .25s,box-shadow .25s;position:relative;overflow:hidden}
.tc-card:hover{border-color:rgba(57,191,246,.22);transform:translateY(-2px);box-shadow:0 18px 44px rgba(0,0,0,.28)}
/* video thumbnail on testimonial */
.tvt{width:100%;height:100px;border-radius:9px;overflow:hidden;position:relative;margin-bottom:18px;cursor:pointer}
.tvtbg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
.tvgrid{position:absolute;inset:0;background-image:linear-gradient(rgba(57,191,246,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(57,191,246,.03) 1px,transparent 1px);background-size:20px 20px}
.tvplay{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;transition:transform .2s;position:relative;z-index:1}
.tvplay:hover{transform:scale(1.12)}
.ts{display:flex;gap:2px;margin-bottom:12px}
.tstar{font-size:12px;color:#f59e0b}
.tq{font-size:13.5px;color:var(--text2);line-height:1.68;margin-bottom:16px;font-style:italic}
.tq strong{color:var(--text);font-style:normal}
.ta{display:flex;align-items:center;gap:10px}
.tav{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#fff;flex-shrink:0}
.tn{font-size:13.5px;font-weight:700;color:var(--text)}
.tr{font-size:11.5px;color:var(--text3)}
.tcbdg{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:rgba(57,191,246,.06);border:1px solid rgba(57,191,246,.1);font-size:10.5px;color:var(--text3);margin-top:5px}

/* ROADMAP */
.rmg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
@media(max-width:880px){.rmg{grid-template-columns:1fr 1fr}}
@media(max-width:540px){.rmg{grid-template-columns:1fr}}
.rmc{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:22px;transition:border-color .2s,transform .2s}
.rmc:hover{border-color:rgba(57,191,246,.2);transform:translateY(-2px)}
.rmp{font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px}
.rmt{font-size:15px;font-weight:700;color:var(--text);margin-bottom:7px}
.rmd{font-size:12px;color:var(--text3);margin-bottom:12px}
.rmfl{list-style:none;display:flex;flex-direction:column;gap:5px}
.rmfl li{font-size:12px;color:var(--text3);display:flex;align-items:center;gap:6px}
.rmfl li::before{content:'→';color:var(--blue);font-weight:700;flex-shrink:0}
.rms{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:600;margin-top:12px}
.rms-live{background:rgba(16,185,129,.09);color:#6ee7b7;border:1px solid rgba(16,185,129,.18)}
.rms-bld{background:rgba(251,191,36,.09);color:#fde68a;border:1px solid rgba(251,191,36,.18)}
.rms-pln{background:rgba(167,139,250,.09);color:#c4b5fd;border:1px solid rgba(167,139,250,.18)}

/* PRICING */
.ptog{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:36px}
.btog{position:relative;width:50px;height:26px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid var(--border);cursor:pointer;transition:background .2s}
.btog.ann{background:rgba(29,78,216,.4);border-color:rgba(57,191,246,.35)}
.btog-k{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 2px 5px rgba(0,0,0,.28)}
.btog.ann .btog-k{transform:translateX(24px)}
.blbl{font-size:13.5px;font-weight:600;color:var(--text3);cursor:pointer;transition:color .2s}
.blbl.on{color:var(--text)}
.save-b{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.22);color:#6ee7b7;font-size:11px;font-weight:700}
.pg{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
@media(max-width:1100px){.pg{grid-template-columns:repeat(2,1fr)}}
@media(max-width:580px){.pg{grid-template-columns:1fr}}
.pc{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:28px;position:relative;overflow:hidden;transition:transform .25s,box-shadow .25s,border-color .25s}
.pc::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.025'/%3E%3C/svg%3E");pointer-events:none}
.pc:hover{transform:translateY(-3px);box-shadow:0 22px 56px rgba(0,0,0,.3)}
.pc.feat{border-color:rgba(57,191,246,.3);background:linear-gradient(160deg,rgba(29,78,216,.1) 0%,var(--card) 60%)}
.pc.feat::before{content:'';position:absolute;inset:0;border-radius:18px;padding:1px;background:linear-gradient(135deg,rgba(57,191,246,.45),rgba(37,99,235,.25),rgba(167,139,250,.18));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.pbadge{position:absolute;top:18px;right:18px;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:700;background:var(--grad);color:#fff}
.ptier{font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
.pamt{font-size:36px;font-weight:900;letter-spacing:-1.5px;color:var(--text);margin-bottom:3px;transition:all .3s}
.pamt sup{font-size:16px;font-weight:600;color:var(--text3);vertical-align:top;margin-top:7px;display:inline-block}
.pper{font-size:12.5px;color:var(--text3);margin-bottom:18px}
.pdesc{font-size:12.5px;color:var(--text3);margin-bottom:20px;line-height:1.5}
.pdiv{height:1px;background:var(--border);margin:18px 0}
.pfl{list-style:none;display:flex;flex-direction:column;gap:8px}
.pfl li{font-size:12.5px;color:var(--text2);display:flex;align-items:flex-start;gap:8px;line-height:1.4}
.pfl li::before{content:'✓';color:#10b981;font-weight:800;flex-shrink:0;margin-top:1px}
.pfl li.dim{color:var(--text3)}
.pfl li.dim::before{content:'—';color:var(--text3)}
.pcta{display:block;width:100%;padding:12px;border-radius:11px;font-size:13.5px;font-weight:700;text-align:center;text-decoration:none;cursor:pointer;transition:all .2s;border:none;margin-top:22px}
.pcta-p{background:var(--grad);color:#fff;box-shadow:0 0 20px rgba(37,99,235,.38)}
.pcta-p:hover{transform:translateY(-1px);box-shadow:0 0 36px rgba(37,99,235,.6)}
.pcta-g{background:rgba(255,255,255,.05);color:var(--text2);border:1px solid var(--border)}
.pcta-g:hover{background:rgba(255,255,255,.08);color:var(--text)}

/* FAQ */
.faq{display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:16px;overflow:hidden;max-width:780px;margin:0 auto}
.fqi{border-bottom:1px solid var(--border);transition:background .2s}
.fqi:last-child{border-bottom:none}
.fqi.open{background:rgba(57,191,246,.025)}
.fqq{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:20px 24px;background:transparent;border:none;color:var(--text);font-size:14.5px;font-weight:600;text-align:left;cursor:pointer;font-family:inherit;transition:color .2s}
.fqq:hover{color:#fff}
.fqicon{font-size:19px;color:var(--text3);transition:transform .32s,color .2s;flex-shrink:0;line-height:1}
.fqi.open .fqicon{transform:rotate(45deg);color:#7dd3fc}
.fqa{max-height:0;overflow:hidden;transition:max-height .38s cubic-bezier(.4,0,.2,1),padding .3s}
.fqi.open .fqa{max-height:280px;padding:0 24px 20px}
.fqa-in{font-size:13.5px;color:var(--text3);line-height:1.75}
.fqa-in strong{color:var(--text2)}
.fqa-in a{color:#60a5fa;text-decoration:none}

/* WAITLIST */
.wl-wrap{max-width:600px;margin:0 auto;text-align:center}
.wl-form{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:28px}
.wl-in{padding:13px 18px;border-radius:11px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);color:var(--text);font-size:14.5px;font-family:inherit;outline:none;min-width:260px;flex:1;max-width:340px;transition:border-color .2s,background .2s}
.wl-in:focus{border-color:rgba(57,191,246,.45);background:rgba(255,255,255,.08)}
.wl-in::placeholder{color:var(--text3)}
.wl-btn{padding:13px 26px;border-radius:11px;background:var(--grad);color:#fff;font-size:14.5px;font-weight:700;border:none;cursor:pointer;transition:all .22s;box-shadow:0 0 24px rgba(37,99,235,.42);white-space:nowrap;position:relative;overflow:hidden}
.wl-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.1),transparent);pointer-events:none}
.wl-btn:hover{transform:translateY(-2px);box-shadow:0 0 44px rgba(37,99,235,.65)}
.wl-trust{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:18px;font-size:12px;color:var(--text3)}
.wl-trust-i{display:flex;align-items:center;gap:5px}
#wlSuccess{display:none;text-align:center;padding:24px}
#wlSuccess.show{display:block}
.suc-ico{font-size:44px;margin-bottom:10px}
.suc-h{font-size:19px;font-weight:800;color:var(--text);margin-bottom:7px}
.suc-s{font-size:13.5px;color:var(--text3)}

/* FOOTER */
footer{background:var(--card);border-top:1px solid var(--border);padding:64px max(24px,5vw) 36px}
.fin{max-width:1320px;margin:0 auto}
.ftop{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:44px;margin-bottom:48px}
@media(max-width:1100px){.ftop{grid-template-columns:1fr 1fr 1fr}}
@media(max-width:660px){.ftop{grid-template-columns:1fr 1fr}}
@media(max-width:420px){.ftop{grid-template-columns:1fr}}
.fbrand p{font-size:12.5px;color:var(--text3);line-height:1.7;margin:12px 0 18px;max-width:230px}
.fcerts{display:flex;flex-wrap:wrap;gap:6px}
.fcert{padding:4px 10px;border-radius:7px;background:rgba(255,255,255,.03);border:1px solid var(--border2);font-size:10.5px;font-weight:600;color:var(--text3)}
/* newsletter in footer */
.nl-form{display:flex;gap:8px;margin-top:14px}
.nl-in{flex:1;padding:9px 12px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12.5px;font-family:inherit;outline:none;transition:border-color .2s}
.nl-in:focus{border-color:rgba(57,191,246,.38)}
.nl-in::placeholder{color:var(--text3)}
.nl-btn{padding:9px 14px;background:var(--grad);border:none;border-radius:8px;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .2s}
.nl-btn:hover{opacity:.88;transform:translateY(-1px)}
.fcol h4{font-size:11.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:14px}
.flinks{list-style:none;display:flex;flex-direction:column;gap:8px}
.flinks a{font-size:12.5px;color:var(--text3);text-decoration:none;transition:color .15s}
.flinks a:hover{color:var(--text)}
.fbot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;padding-top:28px;border-top:1px solid var(--border)}
.fst{display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--text3)}
.fstdot{width:7px;height:7px;border-radius:50%;background:#10b981;animation:lpulse 2s ease-in-out infinite}
.fcopy{font-size:11.5px;color:var(--text3)}

/* FLOAT CTA */
#fCTA{position:fixed;bottom:24px;right:24px;z-index:500;opacity:0;transform:translateY(18px);transition:opacity .4s,transform .4s;pointer-events:none}
#fCTA.show{opacity:1;transform:translateY(0);pointer-events:auto}
.fcta-btn{padding:12px 20px;border-radius:13px;background:var(--grad);color:#fff;font-size:13.5px;font-weight:700;border:none;cursor:pointer;box-shadow:0 8px 30px rgba(29,78,216,.48),0 2px 8px rgba(0,0,0,.28);display:flex;align-items:center;gap:8px;text-decoration:none;transition:all .2s}
.fcta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 44px rgba(29,78,216,.62)}
.fcta-x{position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:50%;background:var(--card3);border:1px solid var(--border);font-size:10px;color:var(--text3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s}
.fcta-x:hover{background:rgba(255,255,255,.1);color:#fff}

/* GLOW LINE */
.gline{height:1px;background:linear-gradient(90deg,transparent,rgba(57,191,246,.38),rgba(167,139,250,.28),transparent);position:relative;overflow:hidden}
.gline::after{content:'';position:absolute;top:-2px;left:-30%;width:35%;height:5px;background:linear-gradient(90deg,transparent,rgba(57,191,246,.5),transparent);border-radius:3px;animation:glsweep 5s ease-in-out infinite}
@keyframes glsweep{0%{left:-35%}100%{left:105%}}

/* REVEAL */
.rv{opacity:0;transform:translateY(22px);transition:opacity .58s ease,transform .58s ease}
.rv.vi{opacity:1;transform:translateY(0)}
.rv1{transition-delay:.1s}
.rv2{transition-delay:.2s}
.rv3{transition-delay:.3s}
.rv4{transition-delay:.4s}
.rv5{transition-delay:.5s}

/* SYSTEM INTELLIGENCE */
.si-grid{display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:start}
@media(max-width:880px){.si-grid{grid-template-columns:1fr}}
.si-terminal{background:rgba(5,10,20,.95);border:1px solid rgba(57,191,246,.18);border-radius:18px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.5),0 0 0 1px rgba(57,191,246,.08)}
.si-top{background:rgba(11,17,32,.9);padding:11px 18px;display:flex;align-items:center;gap:9px;border-bottom:1px solid rgba(57,191,246,.1)}
.si-dot{width:10px;height:10px;border-radius:50%}
.si-title-bar{font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-left:6px}
.si-body{padding:20px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.8}
.si-line{display:flex;gap:10px;padding:2px 0}
.si-prompt{color:rgba(57,191,246,.6);flex-shrink:0}
.si-ok{color:#10b981}
.si-warn{color:#f59e0b}
.si-info{color:#7dd3fc}
.si-dim{color:var(--text3)}
.si-cursor{display:inline-block;width:8px;height:13px;background:#39bff6;animation:blink .8s step-end infinite;vertical-align:middle}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.si-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.si-stat{background:rgba(255,255,255,.02);border:1px solid var(--border2);border-radius:12px;padding:18px;position:relative;overflow:hidden;transition:border-color .2s,transform .2s}
.si-stat:hover{border-color:rgba(57,191,246,.2);transform:translateY(-2px)}
.si-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:var(--grad);opacity:.4}
.si-stat-n{font-size:28px;font-weight:900;letter-spacing:-1px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-variant-numeric:tabular-nums}
.si-stat-l{font-size:11.5px;color:var(--text3);margin-top:3px}
.si-stat-d{font-size:10.5px;color:var(--text3);margin-top:6px;padding-top:6px;border-top:1px solid var(--border2)}

/* ANIMATED COUNTER */
.cnt-num{font-variant-numeric:tabular-nums}
@keyframes countUp{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}

/* SOCIAL PROOF EXPANDED */
.sp-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-top:32px}
@media(max-width:900px){.sp-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:540px){.sp-grid{grid-template-columns:repeat(2,1fr)}}
.sp-cell{background:var(--card);padding:20px;text-align:center;transition:background .2s}
.sp-cell:hover{background:rgba(15,23,42,.9)}
.sp-big{font-size:24px;font-weight:900;letter-spacing:-.8px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sp-lbl{font-size:10.5px;color:var(--text3);margin-top:4px;font-weight:500}

/* GLASSMORPHISM HERO CARD */
.glass-card{background:rgba(11,17,32,.72);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);border:1px solid rgba(255,255,255,.07);border-radius:20px;box-shadow:0 32px 80px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.06)}
.glass-badge{background:rgba(57,191,246,.08);backdrop-filter:blur(12px);border:1px solid rgba(57,191,246,.2);border-radius:999px;padding:5px 13px;font-size:11px;font-weight:600;color:#7dd3fc;letter-spacing:.08em}

/* ACTIVITY TICKER */
.at-wrap{background:rgba(11,17,32,.7);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-top:18px}
.at-head{padding:9px 14px;background:rgba(255,255,255,.02);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:7px;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.07em}
.at-body{padding:6px 0}
.at-row{display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:12px;transition:background .15s}
.at-row:hover{background:rgba(255,255,255,.02)}
.at-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.at-msg{color:var(--text2);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.at-time{color:var(--text3);font-size:10.5px;flex-shrink:0}

/* ENHANCED TESTIMONIAL */
.tcard-feat{background:linear-gradient(160deg,rgba(29,78,216,.07) 0%,var(--card) 70%);border-color:rgba(57,191,246,.22)}
.tcard-feat::before{content:'';position:absolute;inset:0;border-radius:16px;padding:1px;background:linear-gradient(135deg,rgba(57,191,246,.3),transparent,rgba(167,139,250,.2));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.tverif{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:6px;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.16);font-size:10px;font-weight:700;color:#6ee7b7;margin-top:5px}

/* SOCIAL SHARE */
.sshare{display:flex;gap:8px;margin-top:28px;justify-content:center}
.sshare-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;border:1px solid var(--border);background:rgba(255,255,255,.03);font-size:12.5px;font-weight:600;color:var(--text3);cursor:pointer;transition:all .2s;text-decoration:none}
.sshare-btn:hover{color:var(--text);border-color:rgba(57,191,246,.3);background:rgba(57,191,246,.05)}

/* COOKIE BANNER */
#ckBanner{position:fixed;bottom:20px;left:20px;max-width:380px;background:rgba(11,17,32,.96);backdrop-filter:blur(20px);border:1px solid rgba(57,191,246,.18);border-radius:16px;padding:20px;z-index:8000;box-shadow:0 20px 60px rgba(0,0,0,.5);opacity:0;transform:translateY(20px);transition:opacity .4s,transform .4s;pointer-events:none}
#ckBanner.show{opacity:1;transform:translateY(0);pointer-events:auto}
.ck-t{font-size:13.5px;font-weight:700;color:var(--text);margin-bottom:6px}
.ck-s{font-size:12px;color:var(--text3);line-height:1.6;margin-bottom:14px}
.ck-acts{display:flex;gap:8px}
.ck-acc{flex:1;padding:8px;border-radius:8px;background:var(--grad);color:#fff;font-size:12.5px;font-weight:700;border:none;cursor:pointer;transition:opacity .2s}
.ck-acc:hover{opacity:.88}
.ck-dec{padding:8px 14px;border-radius:8px;background:rgba(255,255,255,.04);color:var(--text3);font-size:12.5px;font-weight:600;border:1px solid var(--border);cursor:pointer;transition:all .2s}
.ck-dec:hover{color:var(--text)}

/* SCROLL PROGRESS */
#sprog{position:fixed;top:0;left:0;height:2px;background:var(--grad);z-index:10000;width:0%;transition:width .1s;transform-origin:left}

/* EXIT INTENT POPUP */
#exitPop{position:fixed;inset:0;z-index:9500;background:rgba(5,10,20,.85);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:opacity .38s,visibility .38s}
#exitPop.show{opacity:1;visibility:visible}
.ep-box{background:var(--card2);border:1px solid rgba(57,191,246,.22);border-radius:24px;padding:44px 40px;max-width:480px;width:90%;text-align:center;position:relative;box-shadow:0 48px 96px rgba(0,0,0,.6)}
.ep-box::before{content:'';position:absolute;inset:0;border-radius:24px;padding:1px;background:linear-gradient(135deg,rgba(57,191,246,.35),transparent,rgba(167,139,250,.22));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.ep-close{position:absolute;top:14px;right:16px;background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;padding:4px 8px;transition:color .15s}
.ep-close:hover{color:#fff}
.ep-emoji{font-size:48px;margin-bottom:14px;display:block}
.ep-h{font-size:22px;font-weight:900;letter-spacing:-.5px;color:#fff;margin-bottom:10px}
.ep-s{font-size:14px;color:var(--text3);line-height:1.65;margin-bottom:22px}
.ep-offer{background:rgba(57,191,246,.07);border:1px solid rgba(57,191,246,.2);border-radius:12px;padding:14px;margin-bottom:22px}
.ep-offer-t{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:5px}
.ep-offer-v{font-size:20px;font-weight:900;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.ep-inp{width:100%;padding:11px 14px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:var(--text);font-size:14px;font-family:inherit;outline:none;margin-bottom:10px;transition:border-color .2s}
.ep-inp:focus{border-color:rgba(57,191,246,.4)}
.ep-btn{width:100%;padding:12px;border-radius:11px;background:var(--grad);color:#fff;font-size:14.5px;font-weight:700;border:none;cursor:pointer;transition:all .2s;box-shadow:0 0 24px rgba(37,99,235,.42)}
.ep-btn:hover{opacity:.9;transform:translateY(-1px)}
.ep-skip{margin-top:12px;font-size:12px;color:var(--text3);cursor:pointer;text-decoration:underline;display:block;transition:color .15s}
.ep-skip:hover{color:var(--text2)}

/* FLOATING SOCIAL PROOF */
#socProof{position:fixed;bottom:90px;left:24px;z-index:499;opacity:0;transform:translateX(-20px);transition:opacity .5s,transform .5s;pointer-events:none;max-width:260px}
#socProof.show{opacity:1;transform:translateX(0);pointer-events:auto}
.sp-popup{background:rgba(11,17,32,.95);backdrop-filter:blur(20px);border:1px solid rgba(57,191,246,.18);border-radius:14px;padding:13px 15px;display:flex;align-items:center;gap:11px;box-shadow:0 16px 44px rgba(0,0,0,.45)}
.sp-av{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#fff;flex-shrink:0}
.sp-txt{font-size:12px;color:var(--text2);line-height:1.45}
.sp-txt strong{color:#fff}
.sp-x{position:absolute;top:6px;right:8px;font-size:12px;color:var(--text3);cursor:pointer;background:none;border:none;padding:2px 4px}

/* STATS COUNTER SECTION */
.sc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:14px;overflow:hidden}
@media(max-width:800px){.sc-grid{grid-template-columns:repeat(2,1fr)}}
.sc-cell{background:var(--card);padding:28px 20px;text-align:center;position:relative;overflow:hidden;transition:background .2s}
.sc-cell:hover{background:rgba(15,23,42,.95)}
.sc-cell::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:var(--grad);opacity:.4;transform:scaleX(0);transition:transform .4s;transform-origin:left}
.sc-cell:hover::before{transform:scaleX(1)}
.sc-num{font-size:clamp(28px,3vw,40px);font-weight:900;letter-spacing:-1.5px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-variant-numeric:tabular-nums}
.sc-lbl{font-size:12px;color:var(--text3);margin-top:5px;font-weight:500}
.sc-sub{font-size:10.5px;color:var(--text3);margin-top:3px;opacity:.7}

/* NOTIFICATION TOAST */
#toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);z-index:9800;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);border-radius:999px;padding:10px 20px;font-size:13px;font-weight:600;color:#6ee7b7;display:flex;align-items:center;gap:8px;opacity:0;transition:opacity .35s,transform .35s;pointer-events:none;white-space:nowrap}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* PARTICLE BACKGROUND */
#particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.particle{position:absolute;width:2px;height:2px;border-radius:50%;background:rgba(57,191,246,.35);animation:particleFloat linear infinite}
@keyframes particleFloat{0%{transform:translateY(100vh) translateX(0);opacity:0}10%{opacity:1}90%{opacity:.3}100%{transform:translateY(-20px) translateX(var(--dx,20px));opacity:0}}

/* KEYBOARD SHORTCUT HINT */
.kbd{display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:5px;font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--text3)}

/* RESPONSIVE MISC */
@media(max-width:1020px){.nav-links{display:none}#hbg{display:flex}}
@media(max-width:760px){section{padding:72px max(18px,4vw)}.steps::before,.cndot{display:none}}
@keyframes cntUp{0%{opacity:.35;transform:translateY(7px)}100%{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>

<!-- SCROLL PROGRESS -->
<div id="sprog"></div>

<!-- PAGE LOADER -->
<div id="PL">
  <div class="pl-orb pl-o1"></div>
  <div class="pl-orb pl-o2"></div>
  <div class="pl-mark"><span class="pl-e">easy</span><span class="pl-t">Tenancy</span></div>
  <div class="pl-bar"><div class="pl-fill"></div></div>
  <div class="pl-sub">Loading the global real estate OS…</div>
</div>

<!-- CURSOR GLOW -->
<div id="CG"></div>

<!-- VIDEO MODAL -->
<div id="vmod" onclick="vmodc(event)">
  <div style="position:relative">
    <button class="vclose" onclick="cvmod()">✕</button>
    <div class="vwrap">
      <div class="vph">
        <div class="vgrid"></div>
        <div class="vorb" style="width:380px;height:380px;top:-80px;left:-80px;background:radial-gradient(circle,rgba(29,78,216,.22),transparent)"></div>
        <div class="vorb" style="width:280px;height:280px;bottom:-60px;right:-60px;background:radial-gradient(circle,rgba(167,139,250,.18),transparent)"></div>
        <div style="text-align:center;position:relative;z-index:2;padding:16px">
          <button class="vplay" onclick="void 0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="margin-left:3px"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <div class="vinfo">
            <h3>easyTenancy — 3-Minute Platform Demo</h3>
            <p>Compliance Engine · AI Copilot · Workflow Engine · 120 Markets</p>
            <div class="vtags">
              <span class="vtag">⏱ 3:24</span>
              <span class="vtag">🌍 120 jurisdictions</span>
              <span class="vtag">📊 Live dashboard walkthrough</span>
              <span class="vtag">🤖 AI Copilot in action</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- URGENCY BAR -->
<div class="urg">
  🚀 &nbsp;Phase C: Compliance Engine v3 — 200 jurisdictions · Q3 2026 &nbsp;·&nbsp;
  <span id="urg1">14</span> onboarding slots left this week &nbsp;·&nbsp;
  <a href="#trial" style="color:#fff;font-weight:800;text-decoration:underline">Claim slot →</a>
</div>

<!-- NAV -->
<nav id="mainNav">
  <div class="nav-in">
    <a href="#" class="logo">
      <div class="logo-text"><span class="logo-e">easy</span><span class="logo-t">Tenancy</span></div>
    </a>
    <div class="nav-links">
      <a class="nl" href="#platform">Platform</a>
      <a class="nl" href="#ai-copilot">AI Copilot</a>
      <a class="nl" href="#compliance">Compliance</a>
      <a class="nl" href="#workflow">Workflow</a>
      <a class="nl" href="#markets">Markets</a>
      <a class="nl" href="#pricing">Pricing</a>
      <a class="nl" href="#roadmap">Roadmap</a>
      <a class="nl" href="#roi">ROI</a>
    </div>
    <div class="nav-acts">
      <a href="#" class="btn-sm btn-ghost">Sign in</a>
      <a href="#trial" class="btn-sm btn-pri">Start free →</a>
    </div>
    <div id="hbg" onclick="tglMN()"><span></span><span></span><span></span></div>
  </div>
</nav>

<!-- MOBILE NAV -->
<div id="MN">
  <a href="#platform" onclick="tglMN()">Platform</a>
  <a href="#ai-copilot" onclick="tglMN()">AI Copilot</a>
  <a href="#compliance" onclick="tglMN()">Compliance</a>
  <a href="#pricing" onclick="tglMN()">Pricing</a>
  <a href="#roadmap" onclick="tglMN()">Roadmap</a>
  <a href="#trial" onclick="tglMN()" style="color:#7dd3fc">Start Free →</a>
</div>

<!-- ═══ HERO ═══ -->
<section id="hero">
  <div class="hbg">
    <div class="hmesh"></div>
    <div class="hgrid"></div>
    <div class="hnoise"></div>
    <div class="horb ho1"></div>
    <div class="horb ho2"></div>
    <div class="horb ho3"></div>
  </div>
  <div class="inner">
    <div style="max-width:820px">
      <div class="award-bar">🏆 #1 PropTech 2025 — Forbes · TechCrunch · Bloomberg</div>
      <div class="live-bar"><span class="live-dot"></span>50,000+ managers active · 99.97% uptime · &lt;100ms globally</div>
      <div class="badge"><span class="dot"></span>The #1 Global Real Estate Operating System</div>
      <div class="psw" id="psw">
        <button class="pbtn active" onclick="swp('owner')" data-p="owner">🏠 Property Owner</button>
        <button class="pbtn" onclick="swp('agent')" data-p="agent">🏢 Letting Agent</button>
        <button class="pbtn" onclick="swp('investor')" data-p="investor">📈 Portfolio Investor</button>
        <button class="pbtn" onclick="swp('tenant')" data-p="tenant">🔑 Tenant</button>
      </div>
      <h1 class="hh" id="hh">
        <span id="hl1">Manage your portfolio</span><br>
        <span class="grad-text" id="hl2">like a Fortune 500.</span>
      </h1>
      <p class="hsub" id="hsub">Compliance-first. AI-powered. Built for the world's most demanding property operators. 50,000+ managers. 2.4M leases. 120 countries. <strong style=&quot;color:#fff&quot;>Zero compliance fines.</strong></p>
      <div class="hctas">
        <a href="#trial" class="btn-lg btn-plg">Start free — no card needed <span>→</span></a>
        <div class="play-wrap" onclick="ovmod()">
          <div class="play-c">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <span style="font-size:14.5px;font-weight:600;color:var(--text2)">Watch 3-min demo</span>
        </div>
      </div>
      <div class="proof-strip">
        <div class="proof-item">⭐ <strong>4.9/5</strong> G2 &amp; Capterra</div>
        <div class="proof-sep"></div>
        <div class="proof-item">🏆 <strong>#1</strong> PropTech 2025</div>
        <div class="proof-sep"></div>
        <div class="proof-item">🌍 <strong>120</strong> countries</div>
        <div class="proof-sep"></div>
        <div class="proof-item">💰 <strong>400×</strong> Year-1 ROI</div>
        <div class="proof-sep"></div>
        <div class="proof-item">⏱ <strong>30+ hrs/mo</strong> saved</div>
      </div>
    </div>

    <!-- KPI Ticker -->
    <div class="ticker mt8 rv">
      <div class="tc-cell"><div class="tc-num">50,000+</div><div class="tc-lbl">Property Managers</div></div>
      <div class="tc-cell"><div class="tc-num">2.4M</div><div class="tc-lbl">Leases Managed</div></div>
      <div class="tc-cell"><div class="tc-num">120</div><div class="tc-lbl">Countries Served</div></div>
      <div class="tc-cell"><div class="tc-num">$0</div><div class="tc-lbl">Compliance Fines</div></div>
    </div>

    <!-- Dashboard Mockup -->
    <div class="dash mt8 rv rv1">
      <div class="dtop">
        <div class="ddot" style="background:#ef4444"></div>
        <div class="ddot" style="background:#f59e0b"></div>
        <div class="ddot" style="background:#10b981"></div>
        <span style="font-size:11.5px;color:var(--text3);margin-left:7px;font-family:'JetBrains Mono',monospace">app.easytenancy.co/dashboard</span>
        <div style="margin-left:auto" class="live-bar" style="margin-bottom:0"><span class="live-dot"></span>Live</div>
      </div>
      <div class="dbody">
        <div class="dkpis">
          <div class="dkpi"><div class="dkval">96.2%</div><div class="dkkey">Occupancy</div></div>
          <div class="dkpi"><div class="dkval">KES 4.2M</div><div class="dkkey">Collected / Month</div></div>
          <div class="dkpi"><div class="dkval">2.4%</div><div class="dkkey">Arrears Rate</div></div>
          <div class="dkpi"><div class="dkval">71.8%</div><div class="dkkey">NOI Margin</div></div>
        </div>
        <div class="drow">
          <div class="dwid">
            <div class="wt">Portfolio Health</div>
            <div class="br"><span class="bl">Occupancy</span><div class="bb"><div class="bf" style="width:96%;background:linear-gradient(90deg,#10b981,#34d399)"></div></div><span class="bp">96%</span></div>
            <div class="br"><span class="bl">Collections</span><div class="bb"><div class="bf" style="width:98%;background:linear-gradient(90deg,#39bff6,#2563eb)"></div></div><span class="bp">98%</span></div>
            <div class="br"><span class="bl">Compliance</span><div class="bb"><div class="bf" style="width:100%;background:linear-gradient(90deg,#a78bfa,#7c3aed)"></div></div><span class="bp">100%</span></div>
            <div class="br"><span class="bl">Arrears</span><div class="bb"><div class="bf" style="width:2.4%;background:#ef4444"></div></div><span class="bp">2.4%</span></div>
          </div>
          <div class="dwid">
            <div class="wt">AI Activity Feed</div>
            <div class="ai"><div class="aidot" style="background:#10b981"></div><div><div class="ait">M-Pesa reconciled — Unit 14B, KES 45,000</div><div class="aist">Just now</div></div></div>
            <div class="ai"><div class="aidot" style="background:#39bff6"></div><div><div class="ait">Lease renewal generated — 12 months, Flat 3A</div><div class="aist">2 min ago</div></div></div>
            <div class="ai"><div class="aidot" style="background:#f59e0b"></div><div><div class="ait">Compliance alert: EPC expires 30 days — LDN-247</div><div class="aist">8 min ago</div></div></div>
            <div class="ai"><div class="aidot" style="background:#a78bfa"></div><div><div class="ait">AI Copilot: 48 actions across 12 properties</div><div class="aist">15 min ago</div></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="gline"></div>

<!-- ═══ PARTNER MARQUEE ═══ -->
<div style="background:var(--card);overflow:hidden;border-bottom:1px solid var(--border);padding:40px 0">
  <div style="text-align:center;margin-bottom:22px">
    <p style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.14em;text-transform:uppercase">Trusted by leading operators in 120 countries</p>
  </div>
  <div class="mq-wrap" style="margin-bottom:14px">
    <div class="mq-track">
      <div class="plogo"><span style="font-size:17px">🏙️</span><span class="pname">Actis Capital</span></div>
      <div class="plogo"><span style="font-size:17px">🏢</span><span class="pname">Knight Frank Africa</span></div>
      <div class="plogo"><span style="font-size:17px">🌍</span><span class="pname">Emerging Markets Property Group</span></div>
      <div class="plogo"><span style="font-size:17px">🏗️</span><span class="pname">Shelter Afrique</span></div>
      <div class="plogo"><span style="font-size:17px">💼</span><span class="pname">Savills EMEA</span></div>
      <div class="plogo"><span style="font-size:17px">🏦</span><span class="pname">Standard Chartered RE</span></div>
      <div class="plogo"><span style="font-size:17px">🌐</span><span class="pname">JLL Global</span></div>
      <div class="plogo"><span style="font-size:17px">📊</span><span class="pname">Cushman &amp; Wakefield</span></div>
      <div class="plogo"><span style="font-size:17px">💰</span><span class="pname">Helios Investment Partners</span></div>
      <div class="plogo"><span style="font-size:17px">🏘️</span><span class="pname">Pam Golding Properties</span></div>
      <div class="plogo"><span style="font-size:17px">🌟</span><span class="pname">CBRE APAC</span></div>
      <div class="plogo"><span style="font-size:17px">🏙️</span><span class="pname">Actis Capital</span></div>
      <div class="plogo"><span style="font-size:17px">🏢</span><span class="pname">Knight Frank Africa</span></div>
      <div class="plogo"><span style="font-size:17px">🌍</span><span class="pname">Emerging Markets Property Group</span></div>
      <div class="plogo"><span style="font-size:17px">🏗️</span><span class="pname">Shelter Afrique</span></div>
      <div class="plogo"><span style="font-size:17px">💼</span><span class="pname">Savills EMEA</span></div>
      <div class="plogo"><span style="font-size:17px">🏦</span><span class="pname">Standard Chartered RE</span></div>
      <div class="plogo"><span style="font-size:17px">🌐</span><span class="pname">JLL Global</span></div>
      <div class="plogo"><span style="font-size:17px">📊</span><span class="pname">Cushman &amp; Wakefield</span></div>
      <div class="plogo"><span style="font-size:17px">💰</span><span class="pname">Helios Investment Partners</span></div>
      <div class="plogo"><span style="font-size:17px">🏘️</span><span class="pname">Pam Golding Properties</span></div>
      <div class="plogo"><span style="font-size:17px">🌟</span><span class="pname">CBRE APAC</span></div>
    </div>
  </div>
  <div class="mq-wrap">
    <div class="mq-track mq-rev">
      <div class="plogo"><span style="font-size:17px">🔑</span><span class="pname">Absa Property Finance</span></div>
      <div class="plogo"><span style="font-size:17px">🏗️</span><span class="pname">Centum Real Estate</span></div>
      <div class="plogo"><span style="font-size:17px">🌆</span><span class="pname">Azuri Holdings</span></div>
      <div class="plogo"><span style="font-size:17px">💎</span><span class="pname">Vukile Property Fund</span></div>
      <div class="plogo"><span style="font-size:17px">🏛️</span><span class="pname">Growthpoint Properties</span></div>
      <div class="plogo"><span style="font-size:17px">📈</span><span class="pname">Equity Group RE</span></div>
      <div class="plogo"><span style="font-size:17px">🌴</span><span class="pname">Sama Dubai</span></div>
      <div class="plogo"><span style="font-size:17px">🏯</span><span class="pname">CapitaLand SEA</span></div>
      <div class="plogo"><span style="font-size:17px">⚡</span><span class="pname">Proptech Africa</span></div>
      <div class="plogo"><span style="font-size:17px">🔑</span><span class="pname">Absa Property Finance</span></div>
      <div class="plogo"><span style="font-size:17px">🏗️</span><span class="pname">Centum Real Estate</span></div>
      <div class="plogo"><span style="font-size:17px">🌆</span><span class="pname">Azuri Holdings</span></div>
      <div class="plogo"><span style="font-size:17px">💎</span><span class="pname">Vukile Property Fund</span></div>
      <div class="plogo"><span style="font-size:17px">🏛️</span><span class="pname">Growthpoint Properties</span></div>
      <div class="plogo"><span style="font-size:17px">📈</span><span class="pname">Equity Group RE</span></div>
      <div class="plogo"><span style="font-size:17px">🌴</span><span class="pname">Sama Dubai</span></div>
      <div class="plogo"><span style="font-size:17px">🏯</span><span class="pname">CapitaLand SEA</span></div>
      <div class="plogo"><span style="font-size:17px">⚡</span><span class="pname">Proptech Africa</span></div>
    </div>
  </div>
</div>

<!-- ═══ PRESS / MEDIA ═══ -->
<section style="padding-top:64px;padding-bottom:64px;border-bottom:1px solid var(--border)">
  <div class="inner">
    <div class="tc" style="margin-bottom:32px">
      <div class="badge" style="margin:0 auto 14px"><span class="dot"></span>In The Press</div>
      <h2 class="sec-title">What the world's leading publications <span class="grad-text">are saying</span></h2>
    </div>
    <div class="mq-wrap mq-surf" style="margin-bottom:44px">
      <div class="mq-track mq-fwd2">
        <div class="plogo"><span class="press-name">Forbes</span></div>
        <div class="plogo"><span class="press-name">TechCrunch</span></div>
        <div class="plogo"><span class="press-name">Bloomberg</span></div>
        <div class="plogo"><span class="press-name">The Economist</span></div>
        <div class="plogo"><span class="press-name">Financial Times</span></div>
        <div class="plogo"><span class="press-name">Business Insider</span></div>
        <div class="plogo"><span class="press-name">Wired</span></div>
        <div class="plogo"><span class="press-name">Fast Company</span></div>
        <div class="plogo"><span class="press-name">MIT Tech Review</span></div>
        <div class="plogo"><span class="press-name">Forbes</span></div>
        <div class="plogo"><span class="press-name">TechCrunch</span></div>
        <div class="plogo"><span class="press-name">Bloomberg</span></div>
        <div class="plogo"><span class="press-name">The Economist</span></div>
        <div class="plogo"><span class="press-name">Financial Times</span></div>
        <div class="plogo"><span class="press-name">Business Insider</span></div>
        <div class="plogo"><span class="press-name">Wired</span></div>
        <div class="plogo"><span class="press-name">Fast Company</span></div>
        <div class="plogo"><span class="press-name">MIT Tech Review</span></div>
      </div>
    </div>
    <div class="press-cards rv">
      <div class="pcard">
        <div class="po">Forbes Africa — March 2025</div>
        <p class="pq">"<strong>The most ambitious proptech platform of the decade.</strong> easyTenancy isn't just automating rent collection — it's rebuilding the entire legal, financial, and operational infrastructure of property management from scratch."</p>
      </div>
      <div class="pcard">
        <div class="po">TechCrunch — February 2025</div>
        <p class="pq">"With <strong>400× ROI in year one</strong> and zero compliance fines across 50,000 customers, easyTenancy has done something remarkable: it has made compliance actually profitable."</p>
      </div>
      <div class="pcard">
        <div class="po">Bloomberg Technology — January 2025</div>
        <p class="pq">"easyTenancy's AI Copilot — trained on <strong>2.4 million anonymised leases</strong> — represents a category-defining moment for the $326 trillion global real estate market."</p>
      </div>
    </div>
  </div>
</section>

<!-- ═══ TRUST ═══ -->
<section style="padding-top:52px;padding-bottom:52px">
  <div class="inner">
    <div class="tc" style="margin-bottom:28px">
      <p style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.14em;text-transform:uppercase">Enterprise-grade security &amp; certifications</p>
    </div>
    <div class="trust-g rv">
      <div class="trust-i"><div class="tii">🛡️</div><div class="til">SOC 2 Type II</div></div>
      <div class="trust-i"><div class="tii">🔒</div><div class="til">ISO 27001</div></div>
      <div class="trust-i"><div class="tii">🇪🇺</div><div class="til">GDPR</div></div>
      <div class="trust-i"><div class="tii">🌍</div><div class="til">POPIA / PDPA</div></div>
      <div class="trust-i"><div class="tii">🔐</div><div class="til">256-bit SSL</div></div>
    </div>
  </div>
</section>

<div class="gline"></div>

<!-- ═══ HOW IT WORKS ═══ -->
<section style="background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
  <div class="inner">
    <div class="tc" style="margin-bottom:52px">
      <div class="badge" style="margin:0 auto 14px"><span class="dot"></span>How It Works</div>
      <h2 class="sec-title">From zero to <span class="grad-text">fully automated</span> in 10 minutes</h2>
      <p class="sec-sub mxa tc" style="margin-top:10px">No complex setup. No IT team. Just connect, import, and let easyTenancy handle everything from day one.</p>
    </div>
    <div class="steps rv" style="position:relative">
      <div class="cndot cnd1"></div>
      <div class="cndot cnd2"></div>
      <div class="step">
        <div class="snum"><span class="snum-t">1</span></div>
        <h3 class="st">Connect &amp; Import</h3>
        <p class="sd">Sign up in 60 seconds. Import from any spreadsheet, legacy system, or competing platform. Our AI auto-organises units, tenants, and leases — even messy data.</p>
        <div class="stags">
          <span class="stag stag-b">CSV / Excel import</span>
          <span class="stag stag-b">API migration</span>
          <span class="stag stag-b">Free white-glove setup</span>
        </div>
      </div>
      <div class="step">
        <div class="snum"><span class="snum-t">2</span></div>
        <h3 class="st">AI Configures &amp; Monitors</h3>
        <p class="sd">AI Copilot scans your jurisdictions, loads 120-country compliance rules, sets up rent collection triggers, and begins monitoring regulatory changes — instantly.</p>
        <div class="stags">
          <span class="stag stag-p">Auto compliance scan</span>
          <span class="stag stag-p">Smart rent rules</span>
          <span class="stag stag-p">Risk dashboard live</span>
        </div>
      </div>
      <div class="step">
        <div class="snum"><span class="snum-t">3</span></div>
        <h3 class="st">Automate &amp; Scale</h3>
        <p class="sd">Watch revenue climb and compliance risk drop to zero. AI handles renewals, notices, arrears, maintenance. You manage exceptions — we run everything else 24/7.</p>
        <div class="stags">
          <span class="stag stag-g">400× ROI tracked</span>
          <span class="stag stag-g">Zero fines guaranteed</span>
          <span class="stag stag-g">Scales to 10,000+ units</span>
        </div>
      </div>
    </div>
    <div class="tc" style="margin-top:36px">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.16);border-radius:99px;font-size:12.5px;font-weight:600;color:#6ee7b7">
        ⚡ Average setup time: <strong style="color:#fff;margin-left:2px">9 minutes 42 seconds</strong> — as verified by 50,000+ customers
      </div>
    </div>
  </div>
</section>

<!-- ═══ COMPARE ═══ -->
<section id="compare">
  <div class="inner">
    <div class="tc" style="margin-bottom:44px">
      <div class="badge" style="margin:0 auto 14px"><span class="dot"></span>The Problem We Solve</div>
      <h2 class="sec-title">Property management is <span style="color:var(--red)">broken.</span><br>easyTenancy <span class="grad-text">fixes it.</span></h2>
    </div>
    <div class="cmp-grid rv">
      <div class="cmp-col cmp-bad">
        <div class="cmp-h" style="color:var(--red)">❌ Without easyTenancy</div>
        <div class="cmp-item">📋 Compliance tracked in spreadsheets</div>
        <div class="cmp-item">⚠️ Missed deadlines → heavy fines</div>
        <div class="cmp-item">📞 Rent chasing via phone &amp; email</div>
        <div class="cmp-item">📄 Lease renewals done manually, late</div>
        <div class="cmp-item">🔧 Maintenance logged in WhatsApp</div>
        <div class="cmp-item">📊 Financial reports take days</div>
        <div class="cmp-item">🌍 Multi-country = multi-system chaos</div>
        <div class="cmp-item">⏱️ 30+ hrs/month lost to admin</div>
      </div>
      <div class="cmp-col cmp-good">
        <div class="cmp-h" style="color:#6ee7b7">✅ With easyTenancy</div>
        <div class="cmp-item">🤖 AI auto-monitors 47 regulations/month</div>
        <div class="cmp-item">🎯 Zero fines — 100% auto-enforced</div>
        <div class="cmp-item">💳 M-Pesa, card, crypto — auto-reconciled</div>
        <div class="cmp-item">📝 Leases auto-renewed, +31% renewal rate</div>
        <div class="cmp-item">⚡ Maintenance dispatched, SLA-tracked</div>
        <div class="cmp-item">📈 IFRS 16 reports in seconds</div>
        <div class="cmp-item">🌐 120 countries. One dashboard.</div>
        <div class="cmp-item">🚀 30+ hrs saved/month → growth</div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ PLATFORM / FEATURES ═══ -->
<section id="platform">
  <div class="inner">
    <div style="margin-bottom:44px">
      <div class="badge"><span class="dot"></span>Platform</div>
      <h2 class="sec-title">Everything to run a <span class="grad-text">world-class portfolio</span></h2>
      <p class="sec-sub" style="margin-top:10px">12 deeply integrated modules. One operating system. Built for scale from Day 1.</p>
    </div>
    <div class="fg rv">
      <div class="fc"><span class="fci">⚖️</span><div class="fct">Compliance Engine</div><div class="fcd">Auto-monitors 47 new laws/month across 120 jurisdictions. Zero fines — guaranteed.</div><span class="ftag ftb">120 jurisdictions</span></div>
      <div class="fc"><span class="fci">🤖</span><div class="fct">AI Copilot</div><div class="fcd">Predictive vacancy, dynamic rent pricing (+6.2%), autonomous notice drafting, portfolio risk scoring.</div><span class="ftag ftp">48 actions/day</span></div>
      <div class="fc"><span class="fci">💰</span><div class="fct">Automated Rent Collection</div><div class="fcd">M-Pesa, card, crypto, Open Banking. 98% collection rate. Auto-reconciled in real time.</div><span class="ftag ftg">98% collection</span></div>
      <div class="fc"><span class="fci">📝</span><div class="fct">Digital Lease Builder</div><div class="fcd">AI-generated, jurisdiction-aware leases. DocuSign, Adobe Sign. 2-minute turnaround.</div><span class="ftag ftb">120 country templates</span></div>
      <div class="fc"><span class="fci">🔧</span><div class="fct">Maintenance Workflow</div><div class="fcd">AI dispatch, vendor SLA tracking, tenant comms, cost control. 62% faster resolution.</div><span class="ftag ftg">SLA tracked</span></div>
      <div class="fc"><span class="fci">👤</span><div class="fct">Tenant Screening &amp; CRM</div><div class="fcd">AI credit &amp; risk scoring in under 60 seconds. Full tenant lifecycle management.</div><span class="ftag ftp">&lt;60s screening</span></div>
      <div class="fc"><span class="fci">📊</span><div class="fct">Financial Reporting &amp; IFRS 16</div><div class="fcd">Auto-generated P&amp;L, balance sheet, IFRS 16 lease accounting. Investor-ready instantly.</div><span class="ftag ftb">IFRS 16 compliant</span></div>
      <div class="fc"><span class="fci">💬</span><div class="fct">Omnichannel Communication</div><div class="fcd">WhatsApp, SMS, email, push — all unified. AI drafts responses. 4× faster resolution.</div><span class="ftag ftp">AI-drafted</span></div>
      <div class="fc"><span class="fci">🌐</span><div class="fct">Multi-Workspace &amp; API</div><div class="fcd">Manage multiple portfolios or clients from one account. Full REST API access.</div><span class="ftag ftg">Enterprise-ready</span></div>
    </div>
  </div>
</section>

<!-- ═══ AI COPILOT ═══ -->
<section id="ai-copilot" style="background:linear-gradient(180deg,var(--surface) 0%,rgba(13,20,36,.6) 100%)">
  <div class="inner">
    <div style="margin-bottom:44px">
      <div class="badge" style="background:rgba(167,139,250,.08);border-color:rgba(167,139,250,.2);color:#c4b5fd"><span class="dot" style="background:#a78bfa"></span>AI Copilot</div>
      <h2 class="sec-title">Your AI that <span class="grad-text">works 24/7</span> on your portfolio</h2>
      <p class="sec-sub" style="margin-top:10px">Trained on 6 years of data from 2.4M anonymised leases. Surfaces 48 portfolio-optimising actions every single day.</p>
    </div>
    <div class="ai-grid rv">
      <div class="ai-actions">
        <div class="aia"><div class="aia-ic" style="background:rgba(16,185,129,.1)">💰</div><div class="aia-t">M-Pesa reconciled — Unit 14B, KES 45,000. Arrears risk cleared.</div><div class="aia-b" style="background:rgba(16,185,129,.1);color:#6ee7b7">Done</div></div>
        <div class="aia"><div class="aia-ic" style="background:rgba(57,191,246,.1)">📝</div><div class="aia-t">Lease renewal auto-generated — 12 months, +3.2% rent uplift, Flat 3A</div><div class="aia-b" style="background:rgba(57,191,246,.1);color:#7dd3fc">Sent</div></div>
        <div class="aia"><div class="aia-ic" style="background:rgba(245,158,11,.1)">⚠️</div><div class="aia-t">Compliance: EPC expires 30 days — LDN-247. Auto-notice drafted.</div><div class="aia-b" style="background:rgba(245,158,11,.1);color:#fde68a">Act</div></div>
        <div class="aia"><div class="aia-ic" style="background:rgba(167,139,250,.1)">🎯</div><div class="aia-t">48 actions optimised across 12 properties. NOI uplift: +6.2%</div><div class="aia-b" style="background:rgba(167,139,250,.1);color:#c4b5fd">+6.2%</div></div>
        <div class="aia"><div class="aia-ic" style="background:rgba(16,185,129,.1)">👤</div><div class="aia-t">Tenant pre-qualified — risk score 94/100, approved in 42 seconds</div><div class="aia-b" style="background:rgba(16,185,129,.1);color:#6ee7b7">94/100</div></div>
        <div class="aia"><div class="aia-ic" style="background:rgba(57,191,246,.1)">🏠</div><div class="aia-t">Vacancy prediction: Unit 22B likely to vacate in 34 days. Pre-listed.</div><div class="aia-b" style="background:rgba(57,191,246,.1);color:#7dd3fc">Alert</div></div>
      </div>
      <div class="intel-panel">
        <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:18px">Portfolio Intelligence</div>
        <div class="iri"><div class="irb"><div class="irl"><span>Arrears Risk</span><span class="irp" style="color:#10b981">2.4% — Low</span></div><div class="irbar"><div class="irf" style="width:2.4%;background:linear-gradient(90deg,#10b981,#34d399)"></div></div></div></div>
        <div class="iri"><div class="irb"><div class="irl"><span>Vacancy Exposure</span><span class="irp" style="color:#f59e0b">3.8% — Moderate</span></div><div class="irbar"><div class="irf" style="width:3.8%;background:linear-gradient(90deg,#f59e0b,#d97706)"></div></div></div></div>
        <div class="iri"><div class="irb"><div class="irl"><span>Compliance Exposure</span><span class="irp" style="color:#10b981">0% — Zero</span></div><div class="irbar"><div class="irf" style="width:.2%;background:#10b981"></div></div></div></div>
        <div class="iri"><div class="irb"><div class="irl"><span>Maintenance Backlog</span><span class="irp" style="color:#39bff6">6.1% — Managed</span></div><div class="irbar"><div class="irf" style="width:6.1%;background:linear-gradient(90deg,#39bff6,#2563eb)"></div></div></div></div>
        <div class="iri"><div class="irb"><div class="irl"><span>Tenant Satisfaction</span><span class="irp" style="color:#10b981">94.2% — Excellent</span></div><div class="irbar"><div class="irf" style="width:94.2%;background:linear-gradient(90deg,#a78bfa,#7c3aed)"></div></div></div></div>
        <div class="isg">
          <div class="is"><div class="isv">2.4M</div><div class="isl">Training leases</div></div>
          <div class="is"><div class="isv">94%</div><div class="isl">Prediction accuracy</div></div>
          <div class="is"><div class="isv">6 yrs</div><div class="isl">Historical data</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ WORKFLOW ═══ -->
<section id="workflow" style="background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
  <div class="inner">
    <div style="margin-bottom:36px">
      <div class="badge"><span class="dot"></span>Workflow Engine</div>
      <h2 class="sec-title">Every workflow, <span class="grad-text">end-to-end automated</span></h2>
    </div>
    <div class="wfg rv">
      <div class="wfc"><div class="wfi">📋</div><div class="wft">Lease Onboarding</div><div class="wfs">9 min</div><div class="wfd">Average full onboarding. Digital, compliant, signed.</div></div>
      <div class="wfc"><div class="wfi">💳</div><div class="wft">Rent Collection</div><div class="wfs">98%</div><div class="wfd">Collection rate. M-Pesa, card, crypto, Open Banking.</div></div>
      <div class="wfc"><div class="wfi">🔧</div><div class="wft">Maintenance Dispatch</div><div class="wfs">–62%</div><div class="wfd">Reduction in resolution time via AI vendor dispatch.</div></div>
      <div class="wfc"><div class="wfi">🔄</div><div class="wft">Lease Renewal</div><div class="wfs">+31%</div><div class="wfd">Renewal rate uplift with AI-timed automated outreach.</div></div>
      <div class="wfc"><div class="wfi">⚖️</div><div class="wft">Legal Enforcement</div><div class="wfs">120</div><div class="wfd">Jurisdictions with court-ready notice generation.</div></div>
      <div class="wfc"><div class="wfi">🏠</div><div class="wft">Vacancy Management</div><div class="wfs">–62%</div><div class="wfd">Void period reduction via predictive re-listing.</div></div>
      <div class="wfc"><div class="wfi">📊</div><div class="wft">Investor Reporting</div><div class="wfs">0 hrs</div><div class="wfd">IFRS 16 reports auto-dispatched to investors.</div></div>
      <div class="wfc"><div class="wfi">🌍</div><div class="wft">Multi-Jurisdiction Ops</div><div class="wfs">120</div><div class="wfd">Countries on one platform. One workflow. Zero chaos.</div></div>
    </div>
  </div>
</section>

<!-- ═══ METRICS STRIP ═══ -->
<section style="padding-top:52px;padding-bottom:52px;background:var(--card);border-bottom:1px solid var(--border)">
  <div class="inner">
    <div class="mstrip rv">
      <div class="mcell"><div class="mbig">400×</div><div class="mlbl">Avg Year-1 ROI</div></div>
      <div class="mcell"><div class="mbig">30+ hrs</div><div class="mlbl">Saved / month</div></div>
      <div class="mcell"><div class="mbig">+23%</div><div class="mlbl">Median NOI uplift</div></div>
      <div class="mcell"><div class="mbig">47/mo</div><div class="mlbl">Laws auto-updated</div></div>
      <div class="mcell"><div class="mbig">6 yrs</div><div class="mlbl">Data depth</div></div>
      <div class="mcell"><div class="mbig">100%</div><div class="mlbl">Compliance rate</div></div>
    </div>
  </div>
</section>

<!-- ═══ STATS COUNTER GRID ═══ -->
<section style="padding-top:64px;padding-bottom:64px">
  <div class="inner">
    <div class="tc rv" style="margin-bottom:36px">
      <div class="badge" style="margin:0 auto 12px"><span class="dot"></span>By the numbers</div>
      <h2 class="sec-title">The platform <span class="grad-text">behind the numbers</span></h2>
    </div>
    <div class="sc-grid rv rv1">
      <div class="sc-cell">
        <div class="sc-num" data-target="50000" data-suffix="+" id="sc1">0</div>
        <div class="sc-lbl">Property Managers</div>
        <div class="sc-sub">Across 120 countries</div>
      </div>
      <div class="sc-cell">
        <div class="sc-num" data-target="2400000" data-suffix="" id="sc2">0</div>
        <div class="sc-lbl">Leases Under Management</div>
        <div class="sc-sub">AI-analysed in real time</div>
      </div>
      <div class="sc-cell">
        <div class="sc-num" data-target="9997" data-suffix="%" id="sc3">0</div>
        <div class="sc-lbl">Platform Uptime</div>
        <div class="sc-sub">4 global edge regions</div>
      </div>
      <div class="sc-cell">
        <div class="sc-num" data-target="400" data-suffix="×" id="sc4">0</div>
        <div class="sc-lbl">Avg Year-1 ROI</div>
        <div class="sc-sub">Verified by customers</div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ SYSTEM INTELLIGENCE ═══ -->
<section id="system-intel" style="background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
  <div class="inner">
    <div style="margin-bottom:44px">
      <div class="badge" style="background:rgba(167,139,250,.08);border-color:rgba(167,139,250,.2);color:#c4b5fd"><span class="dot" style="background:#a78bfa"></span>System Intelligence</div>
      <h2 class="sec-title">Real-time signals from <span class="grad-text">2.4M active leases</span></h2>
      <p class="sec-sub" style="margin-top:10px">Every transaction, compliance event, and AI action feeds our global intelligence network — making your portfolio smarter every day.</p>
    </div>
    <div class="si-grid rv">
      <div class="si-terminal">
        <div class="si-top">
          <div class="si-dot" style="background:#ef4444"></div>
          <div class="si-dot" style="background:#f59e0b"></div>
          <div class="si-dot" style="background:#10b981"></div>
          <span class="si-title-bar">easyTenancy AI Copilot — Live Feed</span>
          <div style="margin-left:auto" class="live-bar" style="margin-bottom:0;padding:3px 9px"><span class="live-dot"></span><span style="font-size:10px">LIVE</span></div>
        </div>
        <div class="si-body">
          <div class="si-line"><span class="si-prompt">AI ›</span><span class="si-ok">✓ M-Pesa batch reconciled — 847 units, KES 38.2M</span></div>
          <div class="si-line"><span class="si-prompt">AI ›</span><span class="si-info">↑ Rent pricing gap detected: 23 units underpriced by 6.2%</span></div>
          <div class="si-line"><span class="si-prompt">AI ›</span><span class="si-warn">⚠ EPC compliance: 14 notices auto-drafted, LDN portfolio</span></div>
          <div class="si-line"><span class="si-prompt">AI ›</span><span class="si-ok">✓ Lease renewals sent: 38 units, avg +3.1% uplift</span></div>
          <div class="si-line"><span class="si-prompt">AI ›</span><span class="si-info">→ Vacancy prediction: Unit 22B likely vacant in 34 days</span></div>
          <div class="si-line"><span class="si-prompt">AI ›</span><span class="si-ok">✓ Maintenance SLA met: 97/100 tickets ≤ 48hrs</span></div>
          <div class="si-line"><span class="si-prompt">AI ›</span><span class="si-warn">⚠ Arrears escalation: 3 units, legal notice auto-filed</span></div>
          <div class="si-line"><span class="si-prompt">AI ›</span><span class="si-info">📊 Investor report dispatched: 4 portfolios, IFRS 16</span></div>
          <div class="si-line"><span class="si-prompt">AI ›</span><span class="si-ok">✓ Tenant pre-qualified: score 94/100, approved in 42s</span></div>
          <div class="si-line"><span class="si-prompt">AI ›</span><span class="si-dim">Processing 48 portfolio actions… <span class="si-cursor"></span></span></div>
        </div>
        <div class="at-wrap" style="margin:0 16px 16px;border-radius:9px">
          <div class="at-head">
            <span style="width:7px;height:7px;border-radius:50%;background:#10b981;display:inline-block"></span>
            Live Global Activity
          </div>
          <div class="at-body" id="si-feed">
            <div class="at-row"><div class="at-dot" style="background:#10b981"></div><div class="at-msg">M-Pesa reconciled — Unit 14B, KES 45,000</div><div class="at-time">just now</div></div>
            <div class="at-row"><div class="at-dot" style="background:#39bff6"></div><div class="at-msg">Lease renewal generated — 12 months, Flat 3A</div><div class="at-time">2 min</div></div>
            <div class="at-row"><div class="at-dot" style="background:#f59e0b"></div><div class="at-msg">Compliance alert: EPC expires 30 days — LDN-247</div><div class="at-time">8 min</div></div>
            <div class="at-row"><div class="at-dot" style="background:#a78bfa"></div><div class="at-msg">AI Copilot: 48 actions across 12 properties</div><div class="at-time">15 min</div></div>
          </div>
        </div>
      </div>
      <div class="si-stats">
        <div class="si-stat">
          <div class="si-stat-n cnt-num" data-target="2400000" data-prefix="" data-suffix="M" data-scale="1000000">2.4M</div>
          <div class="si-stat-l">Active Leases</div>
          <div class="si-stat-d">Across 120 countries, 24/7 monitored</div>
        </div>
        <div class="si-stat">
          <div class="si-stat-n cnt-num" data-target="50000" data-prefix="" data-suffix="k+" data-scale="1000">50k+</div>
          <div class="si-stat-l">Property Managers</div>
          <div class="si-stat-d">From solo landlords to enterprise REITs</div>
        </div>
        <div class="si-stat">
          <div class="si-stat-n cnt-num" data-target="47" data-prefix="" data-suffix="/mo">0</div>
          <div class="si-stat-l">Laws Auto-Updated</div>
          <div class="si-stat-d">Every month, across all jurisdictions</div>
        </div>
        <div class="si-stat">
          <div class="si-stat-n cnt-num" data-target="400" data-prefix="" data-suffix="×">0×</div>
          <div class="si-stat-l">Avg Year-1 ROI</div>
          <div class="si-stat-d">Verified across 50,000+ customers</div>
        </div>
        <div class="si-stat">
          <div class="si-stat-n cnt-num" data-target="99.97" data-prefix="" data-suffix="%" data-decimal="2">0%</div>
          <div class="si-stat-l">Platform Uptime</div>
          <div class="si-stat-d">SLA-backed, 4 global edge regions</div>
        </div>
        <div class="si-stat">
          <div class="si-stat-n cnt-num" data-target="100" data-prefix="" data-suffix="ms &lt;">0ms</div>
          <div class="si-stat-l">Global Latency</div>
          <div class="si-stat-d">Via Cloudflare edge network worldwide</div>
        </div>
        <div class="si-stat">
          <div class="si-stat-n cnt-num" data-target="94" data-prefix="" data-suffix="%">0%</div>
          <div class="si-stat-l">AI Prediction Accuracy</div>
          <div class="si-stat-d">Vacancy, arrears, compliance signals</div>
        </div>
        <div class="si-stat">
          <div class="si-stat-n" style="color:#10b981">$0</div>
          <div class="si-stat-l">Customer Compliance Fines</div>
          <div class="si-stat-d">Zero fines. Ever. Guaranteed.</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ COMPLIANCE ═══ -->
<section id="compliance">
  <div class="inner">
    <div style="margin-bottom:44px">
      <div class="badge"><span class="dot"></span>Compliance</div>
      <h2 class="sec-title">The only platform with a <span class="grad-text">compliance guarantee</span></h2>
      <p class="sec-sub" style="margin-top:10px">120 jurisdictions. 47 laws updated monthly. Zero fines — ever — for any easyTenancy customer.</p>
    </div>
    <div class="comp-g rv">
      <div class="comp-c"><div class="comp-n grad-text">100%</div><div class="comp-l">Compliance Score</div></div>
      <div class="comp-c"><div class="comp-n" style="color:#10b981">120</div><div class="comp-l">Jurisdictions Covered</div></div>
      <div class="comp-c"><div class="comp-n grad-text">47</div><div class="comp-l">Laws Updated This Month</div></div>
      <div class="comp-c"><div class="comp-n" style="color:#10b981">2.4M</div><div class="comp-l">Leases Powering Signals</div></div>
      <div class="comp-c"><div class="comp-n" style="color:#10b981">$0</div><div class="comp-l">Customer Fines — Ever</div></div>
      <div class="comp-c" style="background:rgba(29,78,216,.04);border-color:rgba(29,78,216,.16)">
        <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:9px">Auto-Generated Notice</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.6;font-family:'JetBrains Mono',monospace">
          <div style="color:#6ee7b7">✓ EPC Rating B certified</div>
          <div style="color:#6ee7b7">✓ Section 21 removed</div>
          <div style="color:#6ee7b7">✓ Deposit registered</div>
          <div style="color:#6ee7b7">✓ Rent reform updated</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ ROI CALCULATOR ═══ -->
<section id="roi" style="background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
  <div class="inner">
    <div class="tc" style="margin-bottom:44px">
      <div class="badge" style="margin:0 auto 14px"><span class="dot"></span>ROI Calculator</div>
      <h2 class="sec-title">Calculate your exact <span class="grad-text">Year-1 return</span></h2>
      <p class="sec-sub mxa tc" style="margin-top:10px">Based on verified data from 50,000+ property managers. Real numbers, no fluff.</p>
    </div>
    <div class="roi-wrap rv">
      <div class="roi-form">
        <div class="rig"><div class="ril">Number of Units</div><input class="rii" id="rUnits" type="number" value="25" min="1" oninput="calcROI()"/></div>
        <div class="rig"><div class="ril">Average Monthly Rent (USD)</div><input class="rii" id="rRent" type="number" value="1200" min="100" oninput="calcROI()"/></div>
        <div class="rig"><div class="ril">Current Occupancy (%)</div><input class="rii" id="rOcc" type="number" value="85" min="10" max="100" oninput="calcROI()"/></div>
        <div class="rig"><div class="ril">Compliance Hours / Month</div><input class="rii" id="rHrs" type="number" value="12" min="1" oninput="calcROI()"/></div>
      </div>
      <div class="roi-res">
        <div style="font-size:12.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:18px">Your Projected Returns</div>
        <div class="rri"><div class="rrl">Extra revenue (rent uplift + occupancy)</div><div class="rrv" id="r-rev">$0</div></div>
        <div class="rri"><div class="rrl">Legal &amp; compliance cost savings</div><div class="rrv" id="r-legal">$0</div></div>
        <div class="rri"><div class="rrl">Time saved (hrs/year @ $65/hr)</div><div class="rrv" id="r-time">$0</div></div>
        <div class="rri"><div class="rrl">Median NOI uplift</div><div class="rrv" id="r-noi">+23%</div></div>
        <div class="rtot">
          <div class="rtl">Year-1 ROI Multiple</div>
          <div class="rtv" id="r-total">0×</div>
          <div style="font-size:11.5px;color:var(--text3);margin-top:6px">vs. Professional plan annual cost</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ MARKETS ═══ -->
<section id="markets">
  <div class="inner">
    <div style="margin-bottom:36px">
      <div class="badge"><span class="dot"></span>Global Markets</div>
      <h2 class="sec-title">Live in <span class="grad-text">120 countries.</span><br>Expanding to 200 by Q3 2026.</h2>
    </div>
    <div class="mtabs">
      <button class="mtab active" onclick="swMkt('africa',this)">🌍 Africa</button>
      <button class="mtab" onclick="swMkt('me',this)">🕌 Middle East</button>
      <button class="mtab" onclick="swMkt('apac',this)">🌏 APAC</button>
      <button class="mtab" onclick="swMkt('europe',this)">🇪🇺 Europe</button>
      <button class="mtab" onclick="swMkt('americas',this)">🌎 Americas</button>
    </div>
    <div id="mkt-africa" class="mgrid rv">
      <div class="mcrd"><span class="mflag">🇰🇪</span><div><div class="mname">Kenya</div><div class="mst live">● Live — M-Pesa native</div></div></div>
      <div class="mcrd"><span class="mflag">🇳🇬</span><div><div class="mname">Nigeria</div><div class="mst live">● Live — full compliance</div></div></div>
      <div class="mcrd"><span class="mflag">🇿🇦</span><div><div class="mname">South Africa</div><div class="mst live">● Live — POPIA compliant</div></div></div>
      <div class="mcrd"><span class="mflag">🇬🇭</span><div><div class="mname">Ghana</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇪🇬</span><div><div class="mname">Egypt</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇷🇼</span><div><div class="mname">Rwanda</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇹🇿</span><div><div class="mname">Tanzania</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇪🇹</span><div><div class="mname">Ethiopia</div><div class="mst soon">◑ Coming Q3 2026</div></div></div>
    </div>
    <div id="mkt-me" class="mgrid rv" style="display:none">
      <div class="mcrd"><span class="mflag">🇦🇪</span><div><div class="mname">UAE</div><div class="mst live">● Live — RERA compliant</div></div></div>
      <div class="mcrd"><span class="mflag">🇸🇦</span><div><div class="mname">Saudi Arabia</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇶🇦</span><div><div class="mname">Qatar</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇧🇭</span><div><div class="mname">Bahrain</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇰🇼</span><div><div class="mname">Kuwait</div><div class="mst soon">◑ Q2 2026</div></div></div>
      <div class="mcrd"><span class="mflag">🇯🇴</span><div><div class="mname">Jordan</div><div class="mst soon">◑ Q3 2026</div></div></div>
    </div>
    <div id="mkt-apac" class="mgrid rv" style="display:none">
      <div class="mcrd"><span class="mflag">🇸🇬</span><div><div class="mname">Singapore</div><div class="mst live">● Live — PDPA compliant</div></div></div>
      <div class="mcrd"><span class="mflag">🇦🇺</span><div><div class="mname">Australia</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇮🇳</span><div><div class="mname">India</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇲🇾</span><div><div class="mname">Malaysia</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇳🇿</span><div><div class="mname">New Zealand</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇵🇭</span><div><div class="mname">Philippines</div><div class="mst soon">◑ Q3 2026</div></div></div>
    </div>
    <div id="mkt-europe" class="mgrid rv" style="display:none">
      <div class="mcrd"><span class="mflag">🇬🇧</span><div><div class="mname">United Kingdom</div><div class="mst live">● Live — Renters Reform</div></div></div>
      <div class="mcrd"><span class="mflag">🇩🇪</span><div><div class="mname">Germany</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇫🇷</span><div><div class="mname">France</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇳🇱</span><div><div class="mname">Netherlands</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇮🇪</span><div><div class="mname">Ireland</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇵🇱</span><div><div class="mname">Poland</div><div class="mst soon">◑ Q2 2026</div></div></div>
    </div>
    <div id="mkt-americas" class="mgrid rv" style="display:none">
      <div class="mcrd"><span class="mflag">🇺🇸</span><div><div class="mname">United States</div><div class="mst live">● Live — 50 states</div></div></div>
      <div class="mcrd"><span class="mflag">🇨🇦</span><div><div class="mname">Canada</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇲🇽</span><div><div class="mname">Mexico</div><div class="mst live">● Live</div></div></div>
      <div class="mcrd"><span class="mflag">🇧🇷</span><div><div class="mname">Brazil</div><div class="mst soon">◑ Q3 2026</div></div></div>
      <div class="mcrd"><span class="mflag">🇦🇷</span><div><div class="mname">Argentina</div><div class="mst soon">◑ Q3 2026</div></div></div>
      <div class="mcrd"><span class="mflag">🇨🇱</span><div><div class="mname">Chile</div><div class="mst soon">◑ 2027</div></div></div>
    </div>
  </div>
</section>

<!-- ═══ INTEGRATIONS ═══ -->
<section id="integrations" style="background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
  <div class="inner">
    <div class="tc" style="margin-bottom:36px">
      <div class="badge" style="margin:0 auto 14px"><span class="dot"></span>Integrations</div>
      <h2 class="sec-title"><span class="grad-text">100+ native</span> integrations</h2>
      <p class="sec-sub mxa tc" style="margin-top:10px">Connect your entire stack in minutes. No code, no middleware.</p>
    </div>
    <div class="ig rv">
      <div class="ic"><div class="icn">📱</div><div class="ict">M-Pesa</div></div>
      <div class="ic"><div class="icn">💳</div><div class="ict">Stripe</div></div>
      <div class="ic"><div class="icn">📊</div><div class="ict">QuickBooks</div></div>
      <div class="ic"><div class="icn">🟢</div><div class="ict">Xero</div></div>
      <div class="ic"><div class="icn">✍️</div><div class="ict">DocuSign</div></div>
      <div class="ic"><div class="icn">🏦</div><div class="ict">Plaid</div></div>
      <div class="ic"><div class="icn">💬</div><div class="ict">Slack</div></div>
      <div class="ic"><div class="icn">⚡</div><div class="ict">Zapier</div></div>
      <div class="ic"><div class="icn">🔵</div><div class="ict">Salesforce</div></div>
      <div class="ic"><div class="icn">📧</div><div class="ict">Mailgun</div></div>
      <div class="ic"><div class="icn">💚</div><div class="ict">WhatsApp Biz</div></div>
      <div class="ic"><div class="icn">🏛️</div><div class="ict">Open Banking</div></div>
      <div class="ic"><div class="icn">🔐</div><div class="ict">Auth0 / SSO</div></div>
      <div class="ic"><div class="icn">🟠</div><div class="ict">HubSpot</div></div>
      <div class="ic"><div class="icn">📞</div><div class="ict">Twilio</div></div>
      <div class="ic"><div class="icn">✒️</div><div class="ict">Adobe Sign</div></div>
      <div class="ic"><div class="icn">₿</div><div class="ict">Crypto Pay</div></div>
      <div class="ic"><div class="icn">📈</div><div class="ict">Power BI</div></div>
    </div>
    <div class="tc" style="margin-top:22px">
      <span style="font-size:13px;color:var(--text3)">+ 80 more · <a href="#trial" style="color:#60a5fa;font-weight:600;text-decoration:none">See full list →</a></span>
    </div>
  </div>
</section>

<!-- ═══ TESTIMONIALS ═══ -->
<section id="testimonials">
  <div class="inner">
    <div class="tc" style="margin-bottom:36px">
      <div class="badge" style="margin:0 auto 14px"><span class="dot"></span>Customer Stories</div>
      <h2 class="sec-title">50,000+ managers. <span class="grad-text">Zero regrets.</span></h2>
    </div>
    <div class="tbadges rv">
      <div class="rbdg"><span class="rbdi">⭐</span><div><div class="rbds">4.9/5</div><div class="rbdl">G2 · 2,847 reviews</div></div></div>
      <div class="rbdg"><span class="rbdi">🏅</span><div><div class="rbds">4.8/5</div><div class="rbdl">Capterra · 1,923 reviews</div></div></div>
      <div class="nps-b"><span class="nps-s">NPS 74</span><span class="nps-l">World-class · Industry avg: 31</span></div>
      <div class="rbdg"><span class="rbdi">🏆</span><div><div class="rbds">#1 PropTech</div><div class="rbdl">G2 Leader 2025</div></div></div>
      <div class="rbdg"><span class="rbdi">🔥</span><div><div class="rbds">Product Hunt</div><div class="rbdl">#1 Product of the Day</div></div></div>
    </div>
    <div class="tg rv rv1">
      <div class="tc-card">
        <div class="tvt" onclick="ovmod()">
          <div class="tvtbg" style="background:linear-gradient(135deg,rgba(29,78,216,.38),rgba(57,191,246,.28))">
            <div class="tvgrid"></div>
            <div class="tvplay" style="position:relative;z-index:1"><svg width="13" height="13" viewBox="0 0 24 24" fill="#1d4ed8"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
          </div>
        </div>
        <div class="ts"><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span></div>
        <p class="tq">"easyTenancy cut our compliance time from <strong>40 hours to under 2 hours per month</strong>. Zero legal disputes since switching."</p>
        <div class="ta"><div class="tav" style="background:var(--grad)">SK</div><div><div class="tn">Sarah Kamau</div><div class="tr">Portfolio Director</div><div class="tcbdg">🏢 Actis Capital · Nairobi</div></div></div>
      </div>
      <div class="tc-card">
        <div class="tvt" onclick="ovmod()">
          <div class="tvtbg" style="background:linear-gradient(135deg,rgba(124,58,237,.35),rgba(167,139,250,.25))">
            <div class="tvgrid"></div>
            <div class="tvplay" style="position:relative;z-index:1"><svg width="13" height="13" viewBox="0 0 24 24" fill="#7c3aed"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
          </div>
        </div>
        <div class="ts"><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span></div>
        <p class="tq">"UAE, Singapore, UK — three platforms before. Now <strong>one dashboard, one workflow, $48,000 in legal cost savings</strong> year one."</p>
        <div class="ta"><div class="tav" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)">JR</div><div><div class="tn">James Rothwell</div><div class="tr">CEO, Azuri Holdings</div><div class="tcbdg">🌐 Dubai · Singapore · London</div></div></div>
      </div>
      <div class="tc-card">
        <div class="tvt" onclick="ovmod()">
          <div class="tvtbg" style="background:linear-gradient(135deg,rgba(5,150,105,.3),rgba(16,185,129,.2))">
            <div class="tvgrid"></div>
            <div class="tvplay" style="position:relative;z-index:1"><svg width="13" height="13" viewBox="0 0 24 24" fill="#059669"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
          </div>
        </div>
        <div class="ts"><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span></div>
        <p class="tq">"NOI went up <strong>26% in 8 months</strong>. AI Copilot found rent pricing was off by 6.2% across 40 units. Insane discovery."</p>
        <div class="ta"><div class="tav" style="background:linear-gradient(135deg,#059669,#10b981)">AN</div><div><div class="tn">Amara Nwosu</div><div class="tr">CIO, Equity Real Estate</div><div class="tcbdg">📈 Lagos · Abuja</div></div></div>
      </div>
      <div class="tc-card">
        <div class="ts"><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span></div>
        <p class="tq">"800 tenancies. Compliance was our biggest liability. easyTenancy is like having <strong>a full-time legal team 24/7</strong> for £49/month."</p>
        <div class="ta"><div class="tav" style="background:linear-gradient(135deg,#f59e0b,#d97706)">MW</div><div><div class="tn">Michael Whitfield</div><div class="tr">Director, Whitfield Lettings</div><div class="tcbdg">🏠 London, UK</div></div></div>
      </div>
      <div class="tc-card">
        <div class="ts"><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span></div>
        <p class="tq">"300 tenants across Nairobi. <strong>Zero reconciliation errors, 98.7% on-time payment rate</strong>. The arrears system eliminated bad debt."</p>
        <div class="ta"><div class="tav" style="background:linear-gradient(135deg,#39bff6,#2563eb)">FO</div><div><div class="tn">Faith Odhiambo</div><div class="tr">Property Manager</div><div class="tcbdg">🏘️ Centum RE · Kenya</div></div></div>
      </div>
      <div class="tc-card">
        <div class="ts"><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span><span class="tstar">⭐</span></div>
        <p class="tq">"Skeptical of the 400× ROI claim. After 12 months our verified return was <strong>387×</strong> on 45 units. AI Copilot alone paid for 3 years."</p>
        <div class="ta"><div class="tav" style="background:linear-gradient(135deg,#ec4899,#be185d)">RV</div><div><div class="tn">Renata Vasquez</div><div class="tr">Independent Investor</div><div class="tcbdg">🇲🇽 Mexico City Portfolio</div></div></div>
      </div>
    </div>
    <!-- Social share strip -->
    <div class="sshare rv rv2">
      <button class="sshare-btn" onclick="shareTwitter()"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/></svg> Share on X</button>
      <button class="sshare-btn" onclick="shareLinkedIn()"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> Share on LinkedIn</button>
      <button class="sshare-btn" id="copyBtn" onclick="copyLink()">🔗 Copy link</button>
    </div>
  </div>
</section>

<!-- ═══ ROADMAP ═══ -->
<section id="roadmap" style="background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
  <div class="inner">
    <div style="margin-bottom:36px">
      <div class="badge"><span class="dot"></span>Roadmap</div>
      <h2 class="sec-title">Building the <span class="grad-text">autonomous property OS</span></h2>
    </div>
    <div class="rmg rv">
      <div class="rmc"><div class="rmp" style="color:#10b981">Phase A</div><div class="rmt">SaaS Control Plane</div><div class="rmd">✅ Live Now</div><ul class="rmfl"><li>Compliance Engine v2</li><li>AI Copilot Standard</li><li>Rent Collection (all)</li><li>Digital Lease Builder</li></ul><span class="rms rms-live">● Live</span></div>
      <div class="rmc"><div class="rmp" style="color:#f59e0b">Phase B</div><div class="rmt">Workflow Engine</div><div class="rmd">🔨 Q2 2026</div><ul class="rmfl"><li>Visual workflow builder</li><li>Custom SOP automation</li><li>Multi-entity reporting</li><li>Advanced AI scoring</li></ul><span class="rms rms-bld">⚡ Building</span></div>
      <div class="rmc"><div class="rmp" style="color:#39bff6">Phase C</div><div class="rmt">Compliance Engine v3</div><div class="rmd">📅 Q3 2026</div><ul class="rmfl"><li>200 jurisdictions</li><li>Real-time reg feeds</li><li>AI legal drafting v2</li><li>Fine prevention AI</li></ul><span class="rms rms-bld">⚡ Building</span></div>
      <div class="rmc"><div class="rmp" style="color:#a78bfa">Phase D</div><div class="rmt">AI Copilot Enterprise</div><div class="rmd">📅 Q3 2026</div><ul class="rmfl"><li>Custom AI models</li><li>Portfolio-specific training</li><li>Multi-language Copilot</li><li>White-label AI</li></ul><span class="rms rms-pln">🔵 Planned</span></div>
      <div class="rmc"><div class="rmp" style="color:#ec4899">Phase E</div><div class="rmt">Marketplace &amp; API Economy</div><div class="rmd">📅 2027</div><ul class="rmfl"><li>Developer API platform</li><li>Integration marketplace</li><li>Revenue sharing</li><li>Third-party AI plugins</li></ul><span class="rms rms-pln">🔵 Planned</span></div>
      <div class="rmc"><div class="rmp" style="color:#f59e0b">Phase F</div><div class="rmt">Autonomous Property OS</div><div class="rmd">📅 2027–2028</div><ul class="rmfl"><li>Self-healing portfolios</li><li>Autonomous legal filing</li><li>AI-negotiated leases</li><li>Predictive capital plan</li></ul><span class="rms rms-pln">🚀 Vision</span></div>
    </div>
  </div>
</section>

<!-- ═══ PRICING ═══ -->
<section id="pricing">
  <div class="inner">
    <div class="tc" style="margin-bottom:14px">
      <div class="badge" style="margin:0 auto 14px"><span class="dot"></span>Pricing</div>
      <h2 class="sec-title">Start free. <span class="grad-text">Scale forever.</span></h2>
      <p class="sec-sub mxa tc" style="margin-top:10px">No hidden fees. No lock-in. Free migration from any platform.</p>
    </div>
    <div class="ptog">
      <span class="blbl on" id="lbl-mo">Monthly</span>
      <div class="btog" id="btog" onclick="tglBill()"><div class="btog-k"></div></div>
      <span class="blbl" id="lbl-yr">Annual</span>
      <span class="save-b">🎉 Save up to 20%</span>
    </div>
    <div class="pg rv">
      <div class="pc">
        <div class="ptier">Starter</div>
        <div class="pamt"><sup>$</sup>0</div>
        <div class="pper">Free forever · up to 5 units</div>
        <div class="pdesc">Perfect for landlords just starting out.</div>
        <div class="pdiv"></div>
        <ul class="pfl">
          <li>Up to 5 units</li>
          <li>Basic lease builder</li>
          <li>Rent collection (M-Pesa, card)</li>
          <li>1 jurisdiction pack</li>
          <li>Email support</li>
          <li class="dim">AI Copilot</li>
          <li class="dim">Multi-workspace</li>
        </ul>
        <a href="#trial" class="pcta pcta-g">Get started free</a>
      </div>
      <div class="pc feat">
        <div class="pbadge">Most Popular</div>
        <div class="ptier">Professional</div>
        <div class="pamt"><sup>$</sup><span id="p-pro">49</span></div>
        <div class="pper" id="pp-pro">per month · up to 100 units</div>
        <div class="pdesc">Everything to run a professional portfolio.</div>
        <div class="pdiv"></div>
        <ul class="pfl">
          <li>Up to 100 units</li>
          <li>AI Copilot — 50 actions/day</li>
          <li>10 jurisdiction packs</li>
          <li>All payment methods</li>
          <li>Digital lease builder (AI)</li>
          <li>Maintenance workflow</li>
          <li>Financial reporting</li>
          <li>100+ integrations</li>
          <li>Priority support</li>
        </ul>
        <a href="#trial" class="pcta pcta-p">Start 30-day free trial →</a>
      </div>
      <div class="pc">
        <div class="ptier">Portfolio</div>
        <div class="pamt"><sup>$</sup><span id="p-port">149</span></div>
        <div class="pper" id="pp-port">per month · unlimited units</div>
        <div class="pdesc">For serious operators across multiple markets.</div>
        <div class="pdiv"></div>
        <ul class="pfl">
          <li>Unlimited units</li>
          <li>AI Copilot — unlimited</li>
          <li>All 120 jurisdiction packs</li>
          <li>Multi-workspace (10)</li>
          <li>Full API + SSO</li>
          <li>IFRS 16 investor reporting</li>
          <li>Custom branding</li>
          <li>24/7 priority support</li>
          <li>99.97% SLA</li>
        </ul>
        <a href="#trial" class="pcta pcta-g">Start free trial →</a>
      </div>
      <div class="pc">
        <div class="ptier">Enterprise</div>
        <div class="pamt" style="font-size:26px;letter-spacing:-.5px">Custom</div>
        <div class="pper">tailored to your portfolio</div>
        <div class="pdesc">White-label. Dedicated infra. For 1,000+ units.</div>
        <div class="pdiv"></div>
        <ul class="pfl">
          <li>Everything in Portfolio</li>
          <li>White-label platform</li>
          <li>Dedicated infrastructure</li>
          <li>99.99% SLA</li>
          <li>Dedicated account manager</li>
          <li>Custom AI model training</li>
          <li>Legal indemnity cover</li>
          <li>On-premise option</li>
        </ul>
        <a href="#trial" class="pcta pcta-g">Talk to sales →</a>
      </div>
    </div>
    <div class="tc" style="margin-top:24px;font-size:12.5px;color:var(--text3)">
      🛡️ 30-day money-back guarantee · No credit card to start · Free migration · Cancel any time
    </div>
  </div>
</section>

<!-- ═══ FAQ ═══ -->
<section style="background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
  <div class="inner">
    <div class="tc" style="margin-bottom:44px">
      <div class="badge" style="margin:0 auto 14px"><span class="dot"></span>FAQ</div>
      <h2 class="sec-title">Everything you need to <span class="grad-text">know before you start</span></h2>
    </div>
    <div class="faq rv">
      <div class="fqi" onclick="tglFaq(this)">
        <button class="fqq">How long does setup take?<span class="fqicon">+</span></button>
        <div class="fqa"><div class="fqa-in">Setup takes <strong>under 10 minutes for most users.</strong> Import via CSV, spreadsheet, or direct API migration. Our AI organises your data automatically. White-glove migration from legacy platforms is completed in 24–72 hours at zero cost.</div></div>
      </div>
      <div class="fqi" onclick="tglFaq(this)">
        <button class="fqq">Which countries are supported?<span class="fqicon">+</span></button>
        <div class="fqa"><div class="fqa-in">easyTenancy is <strong>live in 120 countries</strong> with 7 regional compliance hubs. Expanding to 200 jurisdictions in Q3 2026. Each market has jurisdiction-specific compliance templates, lease builder rules, and payment methods.</div></div>
      </div>
      <div class="fqi" onclick="tglFaq(this)">
        <button class="fqq">How does the Compliance Engine work?<span class="fqicon">+</span></button>
        <div class="fqa"><div class="fqa-in">Our engine monitors <strong>47 new regulatory changes per month</strong> across 120 jurisdictions. When a law changes, it auto-updates templates, generates notices, and alerts you. We guarantee <strong>zero compliance fines</strong> for all customers.</div></div>
      </div>
      <div class="fqi" onclick="tglFaq(this)">
        <button class="fqq">What can the AI Copilot actually do?<span class="fqicon">+</span></button>
        <div class="fqa"><div class="fqa-in">AI Copilot is trained on <strong>6 years of data from 2.4M anonymised leases</strong>. It surfaces 48 daily actions: predictive vacancy detection (34 days advance), dynamic rent pricing (+6.2% uplift), autonomous notice drafting, tenant risk scoring, maintenance prioritisation, and arrears escalation — 24/7.</div></div>
      </div>
      <div class="fqi" onclick="tglFaq(this)">
        <button class="fqq">How secure is my data?<span class="fqicon">+</span></button>
        <div class="fqa"><div class="fqa-in"><strong>SOC 2 Type II, ISO 27001, GDPR, POPIA, PDPA</strong> certified. 256-bit SSL. 99.97% uptime SLA. &lt;100ms global latency via 4 edge regions. Your data is <strong>never sold</strong> and never used to train AI for other customers.</div></div>
      </div>
      <div class="fqi" onclick="tglFaq(this)">
        <button class="fqq">How is the 400× ROI calculated?<span class="fqicon">+</span></button>
        <div class="fqa"><div class="fqa-in">Based on verified data from 50,000+ managers: <strong>+4.6% average rent uplift</strong>, <strong>$8.40/unit/month legal savings</strong>, <strong>30+ hrs/month time saved</strong> at $65/hr, and <strong>+23% median NOI uplift</strong>. A 25-unit portfolio at $1,200/mo generates $87,000+ Year-1 value vs. $588 Professional plan cost.</div></div>
      </div>
      <div class="fqi" onclick="tglFaq(this)">
        <button class="fqq">What payment methods are supported?<span class="fqicon">+</span></button>
        <div class="fqa"><div class="fqa-in"><strong>M-Pesa, Stripe (card), crypto, Open Banking, ACH, SEPA, BACS</strong>, and regional methods in 120 countries. All payments auto-reconciled in real time. Handles split payments, partial payments, deposits, and auto-escalates arrears.</div></div>
      </div>
      <div class="fqi" onclick="tglFaq(this)">
        <button class="fqq">Is there a free plan?<span class="fqicon">+</span></button>
        <div class="fqa"><div class="fqa-in"><strong>Starter is free forever for up to 5 units.</strong> No credit card. Includes basic lease builder, rent collection, 1 jurisdiction pack. Professional ($49/mo) unlocks AI Copilot, 100 units, 10 jurisdiction packs. All paid plans include a 30-day free trial.</div></div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ FINAL CTA + WAITLIST ═══ -->
<section id="trial" style="background:linear-gradient(135deg,rgba(29,78,216,.16) 0%,rgba(5,10,20,1) 50%,rgba(124,58,237,.1) 100%);border-top:1px solid var(--border);position:relative;overflow:hidden">
  <div style="position:absolute;top:-180px;left:50%;transform:translateX(-50%);width:580px;height:580px;background:radial-gradient(circle,rgba(29,78,216,.1),transparent);border-radius:50%;pointer-events:none"></div>
  <div class="inner tc" style="position:relative;z-index:2">
    <div class="badge" style="margin:0 auto 20px"><span class="dot"></span>Start Today</div>
    <h2 class="sec-title" style="max-width:680px;margin:0 auto 18px">Your portfolio's <span class="grad-text">zero-compliance-fine future</span> starts in 10 minutes</h2>
    <p class="sec-sub mxa" style="margin-bottom:10px">30-day free trial · No credit card · Free migration · Live in &lt;10 minutes</p>
    <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 13px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.18);border-radius:999px;font-size:12px;color:#fca5a5;font-weight:600;margin-bottom:6px">
      🔥 Only <span id="urg2" style="font-weight:900;margin:0 3px">14</span> onboarding slots left this week
    </div>

    <div id="wlForm">
      <div class="wl-form">
        <input class="wl-in" id="wlEmail" type="email" placeholder="Enter your work email address"/>
        <button class="wl-btn" onclick="submitWL()">Get instant access →</button>
      </div>
      <div class="wl-trust">
        <div class="wl-trust-i">✅ No credit card</div>
        <div class="wl-trust-i">✅ Free migration</div>
        <div class="wl-trust-i">✅ Cancel any time</div>
        <div class="wl-trust-i">✅ &lt;10 min setup</div>
        <div class="wl-trust-i">🛡️ SOC2 · ISO27001 · GDPR</div>
      </div>
    </div>
    <div id="wlSuccess">
      <div class="suc-ico">🎉</div>
      <div class="suc-h">You're in! Check your inbox.</div>
      <div class="suc-s">We've sent your access link. Onboarding in &lt;5 minutes.<br>Your portfolio will be live before your next coffee.</div>
    </div>

    <div style="margin-top:22px;display:flex;flex-wrap:wrap;gap:14px;justify-content:center;font-size:12px;color:var(--text3)">
      <span>🌍 Join 50,000+ property managers</span>
      <span>·</span><span>📊 2.4M leases under management</span>
      <span>·</span><span>🏆 #1 PropTech 2025</span>
      <span>·</span><span>⭐ 4.9/5 · 4,770 reviews</span>
    </div>

    <!-- REFERRAL BADGE -->
    <div id="referralBadge" style="margin-top:32px;display:inline-flex;align-items:center;gap:12px;background:rgba(167,139,250,.07);border:1px solid rgba(167,139,250,.22);border-radius:16px;padding:16px 24px">
      <span style="font-size:28px">🎁</span>
      <div style="text-align:left">
        <div style="font-size:13px;font-weight:800;color:#c4b5fd;margin-bottom:3px">Refer a manager → both get 3 months free</div>
        <div style="font-size:11px;color:var(--text3)">Share your unique link after sign-up. No limits on referrals.</div>
      </div>
      <button onclick="copyReferral()" id="refBtn" style="flex-shrink:0;padding:8px 16px;border-radius:10px;background:rgba(167,139,250,.15);border:1px solid rgba(167,139,250,.3);color:#c4b5fd;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap">🔗 Copy referral link</button>
    </div>
  </div>
</section>

<!-- ═══ FOOTER ═══ -->
<footer>
  <div class="fin">
    <div class="ftop">
      <div class="fbrand">
        <div style="font-size:22px;font-weight:900;letter-spacing:-.5px;margin-bottom:2px">
          <span style="background:linear-gradient(135deg,#39bff6,#2aa7e8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">easy</span><span style="background:linear-gradient(135deg,#2563eb,#1e64b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Tenancy</span>
        </div>
        <p>The compliance-first real estate OS trusted by 50,000+ managers across 120 countries. Zero compliance fines — guaranteed.</p>
        <div class="fcerts">
          <div class="fcert">SOC 2</div><div class="fcert">ISO 27001</div><div class="fcert">GDPR</div><div class="fcert">POPIA</div><div class="fcert">256-bit SSL</div>
        </div>
        <div style="margin-top:16px">
          <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px">PropTech Insights Newsletter</div>
          <div class="nl-form">
            <input class="nl-in" type="email" placeholder="your@email.com" id="nlEmail"/>
            <button class="nl-btn" onclick="subNL()">Subscribe</button>
          </div>
        </div>
      </div>
      <div class="fcol">
        <h4>Platform</h4>
        <ul class="flinks">
          <li><a href="#platform">Compliance Engine</a></li>
          <li><a href="#ai-copilot">AI Copilot</a></li>
          <li><a href="#workflow">Workflow Engine</a></li>
          <li><a href="#platform">Rent Collection</a></li>
          <li><a href="#integrations">Integrations</a></li>
        </ul>
      </div>
      <div class="fcol">
        <h4>Markets</h4>
        <ul class="flinks">
          <li><a href="#markets">Africa</a></li>
          <li><a href="#markets">Middle East</a></li>
          <li><a href="#markets">APAC</a></li>
          <li><a href="#markets">Europe</a></li>
          <li><a href="#markets">Americas</a></li>
        </ul>
      </div>
      <div class="fcol">
        <h4>Company</h4>
        <ul class="flinks">
          <li><a href="#">About Us</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Press Kit</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>
      <div class="fcol">
        <h4>Legal</h4>
        <ul class="flinks">
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Service</a></li>
          <li><a href="#">GDPR Centre</a></li>
          <li><a href="#">Security</a></li>
          <li><a href="#">SLA</a></li>
        </ul>
      </div>
    </div>
    <div class="fbot">
      <div class="fst"><div class="fstdot"></div>All systems operational · 99.97% uptime · &lt;100ms · 4 edge regions</div>
      <div class="fcopy">© 2025–2026 easyTenancy Ltd · #1 PropTech 2025 · 120 countries</div>
    </div>
  </div>
</footer>

<!-- FLOATING CTA -->
<div id="fCTA">
  <a href="#trial" class="fcta-btn">🚀 Start free — 10 min setup</a>
  <div class="fcta-x" onclick="document.getElementById('fCTA').classList.remove('show')">✕</div>
</div>

<!-- COOKIE BANNER -->
<div id="ckBanner">
  <div class="ck-t">🍪 We use cookies</div>
  <div class="ck-s">We use essential cookies for performance and analytics to improve your experience. No personal data sold — ever.</div>
  <div class="ck-acts">
    <button class="ck-acc" onclick="ckAccept()">Accept All</button>
    <button class="ck-dec" onclick="ckDecline()">Essentials Only</button>
  </div>
</div>

<!-- EXIT INTENT POPUP -->
<div id="exitPop" onclick="if(event.target===this)closeExit()">
  <div class="ep-box">
    <button class="ep-close" onclick="closeExit()">✕</button>
    <span class="ep-emoji">🎁</span>
    <h3 class="ep-h">Wait — grab your free 30-day trial</h3>
    <p class="ep-s">Before you go, lock in your spot. <strong style="color:#fff">No credit card. Live in under 10 minutes.</strong> Join 50,000+ managers already saving 30 hrs/month.</p>
    <div class="ep-offer">
      <div class="ep-offer-t">Limited offer — this week only</div>
      <div class="ep-offer-v">30-day trial + free white-glove migration</div>
    </div>
    <input class="ep-inp" id="epEmail" type="email" placeholder="Enter your work email"/>
    <button class="ep-btn" onclick="submitExit()">Claim my free trial →</button>
    <span class="ep-skip" onclick="closeExit()">No thanks, I'll manage compliance manually</span>
  </div>
</div>

<!-- FLOATING SOCIAL PROOF -->
<div id="socProof">
  <div class="sp-popup" style="position:relative">
    <button class="sp-x" onclick="document.getElementById('socProof').classList.remove('show')">✕</button>
    <div class="sp-av" style="background:var(--grad)" id="spAv">SK</div>
    <div class="sp-txt"><span id="spTxt"><strong>Sarah K.</strong> just joined from Nairobi 🇰🇪</span></div>
  </div>
</div>

<!-- NOTIFICATION TOAST -->
<div id="toast">✅ <span id="toastMsg">Action completed</span></div>

<!-- PARTICLES -->
<div id="particles"></div>

<script>
// ── Loader ───────────────────────────────────────────────────────
window.addEventListener('load',()=>setTimeout(()=>document.getElementById('PL').classList.add('out'),1800));

// ── Cursor ───────────────────────────────────────────────────────
const CG=document.getElementById('CG');
document.addEventListener('mousemove',e=>{CG.style.left=e.clientX+'px';CG.style.top=e.clientY+'px'});

// ── Nav scroll ───────────────────────────────────────────────────
const nav=document.getElementById('mainNav');
window.addEventListener('scroll',()=>{
  nav.classList.toggle('sc',window.scrollY>20);
  document.getElementById('fCTA').classList.toggle('show',window.scrollY>600);
});

// ── Mobile nav ───────────────────────────────────────────────────
function tglMN(){document.getElementById('hbg').classList.toggle('open');document.getElementById('MN').classList.toggle('open')}

// ── Video Modal ──────────────────────────────────────────────────
function ovmod(){document.getElementById('vmod').classList.add('open');document.body.style.overflow='hidden'}
function cvmod(){document.getElementById('vmod').classList.remove('open');document.body.style.overflow=''}
function vmodc(e){if(e.target===document.getElementById('vmod'))cvmod()}
document.addEventListener('keydown',e=>{if(e.key==='Escape')cvmod()});

// ── Persona switcher ─────────────────────────────────────────────
const personas={
  owner:{h1:'Manage your portfolio',h2:'like a Fortune 500.',sub:'Compliance-first. AI-powered. Built for the world\u2019s most demanding property operators. 50,000+ managers. 2.4M leases. 120 countries. <b>Zero compliance fines.</b>'},
  agent:{h1:'Run your agency',h2:'on autopilot.',sub:'Automate compliance, lease renewals, rent collection, and tenant comms. Save 30+ hours/month. Win more clients with AI-backed portfolio intelligence.'},
  investor:{h1:'Maximise your NOI',h2:'+23% median uplift.',sub:'AI Copilot identifies rent pricing gaps, vacancy risks, and compliance liabilities before they cost you. IFRS 16 investor reports auto-generated in seconds.'},
  tenant:{h1:'Rent smarter.',h2:'Live better.',sub:'Digital lease signing, instant maintenance requests, and a landlord who responds in minutes — not days. Your home deserves a modern operating system.'}
};
function swp(p){
  document.querySelectorAll('.pbtn').forEach(b=>b.classList.toggle('active',b.dataset.p===p));
  const d=personas[p];
  document.getElementById('hl1').textContent=d.h1;
  document.getElementById('hl2').textContent=d.h2;
  document.getElementById('hsub').innerHTML=d.sub;
}

// ── Market tabs ──────────────────────────────────────────────────
function swMkt(r,btn){
  document.querySelectorAll('.mtab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  ['africa','me','apac','europe','americas'].forEach(m=>{
    const el=document.getElementById('mkt-'+m);
    if(el)el.style.display=m===r?'grid':'none';
  });
}

// ── Billing toggle ───────────────────────────────────────────────
let isAnn=false;
function tglBill(){
  isAnn=!isAnn;
  document.getElementById('btog').classList.toggle('ann',isAnn);
  document.getElementById('lbl-mo').classList.toggle('on',!isAnn);
  document.getElementById('lbl-yr').classList.toggle('on',isAnn);
  document.getElementById('p-pro').textContent=isAnn?'39':'49';
  document.getElementById('p-port').textContent=isAnn?'119':'149';
  document.getElementById('pp-pro').textContent=isAnn?'billed annually · save $120/yr':'per month · up to 100 units';
  document.getElementById('pp-port').textContent=isAnn?'billed annually · save $360/yr':'per month · unlimited units';
  calcROI();
}

// ── ROI Calculator ───────────────────────────────────────────────
function calcROI(){
  const u=parseInt(document.getElementById('rUnits').value)||25;
  const r=parseInt(document.getElementById('rRent').value)||1200;
  const o=parseInt(document.getElementById('rOcc').value)||85;
  const h=parseInt(document.getElementById('rHrs').value)||12;
  const rev=Math.round(u*r*12*0.046+u*r*12*((95-o)/100)*0.5);
  const legal=Math.round(u*8.4*12);
  const time=Math.round(h*12*65);
  const cost=(isAnn?39:49)*12;
  const tot=Math.round((rev+legal+time)/cost);
  document.getElementById('r-rev').textContent='$'+rev.toLocaleString();
  document.getElementById('r-legal').textContent='$'+legal.toLocaleString();
  document.getElementById('r-time').textContent='$'+time.toLocaleString();
  document.getElementById('r-noi').textContent='+23%';
  document.getElementById('r-total').textContent=tot+'×';
}
calcROI();

// ── FAQ ──────────────────────────────────────────────────────────
function tglFaq(el){
  const was=el.classList.contains('open');
  document.querySelectorAll('.fqi.open').forEach(i=>i.classList.remove('open'));
  if(!was)el.classList.add('open');
}

// ── Waitlist ─────────────────────────────────────────────────────
function submitWL(){
  const em=document.getElementById('wlEmail').value.trim();
  if(!em||!em.includes('@')){document.getElementById('wlEmail').style.borderColor='rgba(239,68,68,.5)';return}
  document.getElementById('wlForm').style.display='none';
  document.getElementById('wlSuccess').classList.add('show');
}

// ── Newsletter ───────────────────────────────────────────────────
function subNL(){
  const inp=document.getElementById('nlEmail');
  if(!inp.value.includes('@')){inp.style.borderColor='rgba(239,68,68,.4)';return}
  inp.value='✅ Subscribed!';inp.disabled=true;
  inp.style.borderColor='rgba(16,185,129,.4)';inp.style.color='#6ee7b7';
}

// ── Urgency slots ────────────────────────────────────────────────
let slots=14;
setInterval(()=>{
  if(Math.random()<.08&&slots>4){
    slots--;
    ['urg1','urg2'].forEach(id=>{const el=document.getElementById(id);if(el){el.textContent=slots;el.style.animation='none';void el.offsetWidth;el.style.animation='cntUp .3s ease-out'}});
  }
},7000);

// ── Scroll reveal ────────────────────────────────────────────────
const rvObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vi');rvObs.unobserve(e.target)}});
},{threshold:.07});
document.querySelectorAll('.rv').forEach(el=>rvObs.observe(el));

// ── Activity feed ────────────────────────────────────────────────
const feeds=[
  {c:'#10b981',t:'M-Pesa reconciled — Unit 14B, KES 45,000',s:'Just now'},
  {c:'#39bff6',t:'Lease renewal generated — 12 months, Flat 3A',s:'2 min ago'},
  {c:'#f59e0b',t:'Compliance: EPC expires 30 days — LDN-247',s:'8 min ago'},
  {c:'#a78bfa',t:'AI Copilot: 48 actions across 12 properties',s:'15 min ago'},
  {c:'#10b981',t:'Tenant pre-qualified in 42 seconds, score 94/100',s:'23 min ago'},
  {c:'#39bff6',t:'Maintenance SLA met — Unit 7C roofing done',s:'31 min ago'},
  {c:'#ef4444',t:'Arrears escalation — Unit 22A, 14 days overdue',s:'45 min ago'},
  {c:'#a78bfa',t:'Lease auto-renewed: Block C, 24 units, +3.2%',s:'1 hr ago'},
];
let fi=0;
setInterval(()=>{
  const feed=document.querySelector('.dwid:last-child');
  if(!feed)return;
  const items=feed.querySelectorAll('.ai');
  if(!items.length)return;
  const d=feeds[fi%feeds.length];
  const f=items[0];
  f.querySelector('.aidot').style.background=d.c;
  f.querySelector('.ait').textContent=d.t;
  f.querySelector('.aist').textContent=d.s;
  f.style.animation='none';void f.offsetWidth;f.style.animation='cntUp .4s ease-out';
  fi++;
},3800);

// ── Smooth scroll ────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const t=document.querySelector(a.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'})}
  });
});

// ── Scroll progress bar ──────────────────────────────────────────
const sprog=document.getElementById('sprog');
window.addEventListener('scroll',()=>{
  const pct=(window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))*100;
  if(sprog)sprog.style.width=pct+'%';
},{ passive:true });

// ── Animated number counters ─────────────────────────────────────
function animateCounter(el){
  const target=parseFloat(el.dataset.target)||0;
  const prefix=el.dataset.prefix||'';
  const suffix=el.dataset.suffix||'';
  const scale=parseFloat(el.dataset.scale)||1;
  const decimals=parseInt(el.dataset.decimal)||0;
  const duration=1800;
  const start=performance.now();
  function step(now){
    const p=Math.min((now-start)/duration,1);
    const ease=1-Math.pow(1-p,3);
    const val=target*ease;
    if(scale>1){
      el.textContent=prefix+(val/scale).toFixed(decimals)+'M'+suffix.replace('M','');
    } else {
      el.textContent=prefix+(decimals?val.toFixed(decimals):Math.round(val))+suffix;
    }
    if(p<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const cntObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting&&!e.target.dataset.done){
      e.target.dataset.done='1';
      animateCounter(e.target);
      cntObs.unobserve(e.target);
    }
  });
},{threshold:.3});
document.querySelectorAll('.cnt-num[data-target]').forEach(el=>cntObs.observe(el));

// ── Stats counter grid observer ──────────────────────────────────
const scObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting&&!e.target.dataset.done){
      e.target.dataset.done='1';
      animateStatGrid();
      scObs.unobserve(e.target);
    }
  });
},{threshold:.2});
const scGrid=document.querySelector('.sc-grid');
if(scGrid)scObs.observe(scGrid);

// ── System Intelligence live feed ────────────────────────────────
const siFeedItems=[
  {c:'#10b981',t:'M-Pesa reconciled — Unit 14B, KES 45,000',s:'just now'},
  {c:'#39bff6',t:'Lease renewal generated — 12 months, Flat 3A',s:'2 min'},
  {c:'#f59e0b',t:'Compliance: EPC expires 30 days — LDN-247',s:'8 min'},
  {c:'#a78bfa',t:'AI: 48 actions optimised across 12 properties',s:'15 min'},
  {c:'#10b981',t:'Tenant pre-qualified — score 94/100 in 42s',s:'23 min'},
  {c:'#39bff6',t:'Maintenance SLA met — Unit 7C, 31 hrs',s:'31 min'},
  {c:'#ef4444',t:'Arrears escalation — Unit 22A, notice filed',s:'45 min'},
  {c:'#a78bfa',t:'Lease auto-renewed: Block C, 24 units, +3.2%',s:'1 hr'},
  {c:'#10b981',t:'eTIMS receipt generated — KES 12,400',s:'1.2 hr'},
  {c:'#39bff6',t:'Investor report dispatched — IFRS 16, Q2',s:'2 hr'},
];
let siFi=0;
setInterval(()=>{
  const feed=document.getElementById('si-feed');
  if(!feed)return;
  const rows=feed.querySelectorAll('.at-row');
  if(!rows.length)return;
  const d=siFeedItems[siFi%siFeedItems.length];
  const newRow=rows[0].cloneNode(true);
  newRow.querySelector('.at-dot').style.background=d.c;
  newRow.querySelector('.at-msg').textContent=d.t;
  newRow.querySelector('.at-time').textContent=d.s;
  newRow.style.animation='none';
  feed.insertBefore(newRow,rows[0]);
  if(feed.querySelectorAll('.at-row').length>5)feed.removeChild(feed.lastChild);
  void newRow.offsetWidth;
  newRow.style.animation='cntUp .35s ease-out';
  siFi++;
},4200);

// ── Cookie banner ────────────────────────────────────────────────
function ckAccept(){document.getElementById('ckBanner').classList.remove('show');localStorage.setItem('ck','1');}
function ckDecline(){document.getElementById('ckBanner').classList.remove('show');localStorage.setItem('ck','0');}
if(!localStorage.getItem('ck'))setTimeout(()=>document.getElementById('ckBanner').classList.add('show'),3500);

// ── Social share buttons ─────────────────────────────────────────
function shareTwitter(){window.open('https://twitter.com/intent/tweet?text=Just+discovered+easyTenancy+—+the+%231+global+real+estate+OS.+400%C3%97+ROI%2C+120+countries%2C+zero+compliance+fines.+%F0%9F%9A%80&url=https%3A%2F%2Feasytenancy.co','_blank',  'width=600,height=400');}
function shareLinkedIn(){window.open('https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Feasytenancy.co','_blank','width=600,height=400');}

// ── Enhanced ROI with share nudge ────────────────────────────────
// (calcROI already defined above — no re-declaration needed)

// ── Copy CTA link ────────────────────────────────────────────────
function copyLink(){navigator.clipboard&&navigator.clipboard.writeText('https://easytenancy.co').then(()=>{const b=document.getElementById('copyBtn');if(b){b.textContent='✅ Copied!';setTimeout(()=>b.textContent='🔗 Copy link',2000);}});}

// ── Referral badge ───────────────────────────────────────────────
function copyReferral(){
  const refUrl='https://easytenancy.co?ref='+Math.random().toString(36).slice(2,8).toUpperCase();
  navigator.clipboard&&navigator.clipboard.writeText(refUrl).then(()=>{
    const b=document.getElementById('refBtn');
    if(b){b.textContent='✅ Link copied!';b.style.background='rgba(16,185,129,.15)';b.style.borderColor='rgba(16,185,129,.3)';b.style.color='#6ee7b7';}
    showToast('Referral link copied — share it to earn 3 months free!');
    setTimeout(()=>{if(b){b.textContent='🔗 Copy referral link';b.style.background='';b.style.borderColor='';b.style.color='';}},3000);
  });
}

// ── Stats counter grid animate ───────────────────────────────────
function animateStatGrid(){
  const cells=document.querySelectorAll('.sc-num[data-target]');
  cells.forEach(el=>{
    const target=parseInt(el.getAttribute('data-target')||'0');
    const suffix=el.getAttribute('data-suffix')||'';
    const dur=1800;
    const start=performance.now();
    function step(now){
      const p=Math.min((now-start)/dur,1);
      const ease=1-Math.pow(1-p,3);
      let val=Math.round(target*ease);
      let display=val>=1000000?(val/1000000).toFixed(1)+'M':val>=1000?(val/1000).toFixed(val>=10000?0:1)+'K':String(val);
      if(target===9997)display='99.97';
      el.textContent=display+suffix;
      if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// ── Toast notification ───────────────────────────────────────────
function showToast(msg,dur=3000){
  const t=document.getElementById('toast');
  const m=document.getElementById('toastMsg');
  if(!t||!m)return;
  m.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),dur);
}

// ── Exit intent popup ────────────────────────────────────────────
let exitShown=false;
function closeExit(){document.getElementById('exitPop').classList.remove('show');}
function submitExit(){
  const em=document.getElementById('epEmail');
  if(!em||!em.value.includes('@')){if(em)em.style.borderColor='rgba(239,68,68,.5)';return;}
  closeExit();
  showToast('🎉 Access link sent to '+em.value);
}
// Trigger on mouse leave (desktop) or back button intent
document.addEventListener('mouseleave',e=>{
  if(e.clientY<10&&!exitShown&&!localStorage.getItem('exitSeen')){
    exitShown=true;
    localStorage.setItem('exitSeen','1');
    setTimeout(()=>document.getElementById('exitPop').classList.add('show'),200);
  }
});
// Mobile: trigger after 45s
setTimeout(()=>{
  if(!exitShown&&!localStorage.getItem('exitSeen')&&window.innerWidth<768){
    exitShown=true;
    localStorage.setItem('exitSeen','1');
    document.getElementById('exitPop').classList.add('show');
  }
},45000);

// ── Social proof notifications ────────────────────────────────────
const spNotifs=[
  {av:'SK',bg:'linear-gradient(135deg,#39bff6,#2563eb)',txt:'<strong>Sarah K.</strong> just joined from Nairobi 🇰🇪'},
  {av:'JR',bg:'linear-gradient(135deg,#7c3aed,#a78bfa)',txt:'<strong>James R.</strong> added 120 units from Dubai 🇦🇪'},
  {av:'AN',bg:'linear-gradient(135deg,#10b981,#34d399)',txt:'<strong>Amara N.</strong> saved $48k in Year 1 🇳🇬'},
  {av:'FO',bg:'linear-gradient(135deg,#f59e0b,#d97706)',txt:'<strong>Faith O.</strong> hit 98.7% collection rate 🇰🇪'},
  {av:'MW',bg:'linear-gradient(135deg,#ec4899,#be185d)',txt:'<strong>Michael W.</strong> just upgraded to Portfolio 🇬🇧'},
  {av:'RV',bg:'linear-gradient(135deg,#6366f1,#4f46e5)',txt:'<strong>Renata V.</strong> verified 387× ROI 🇲🇽'},
];
let spIdx=0;
function showSpNotif(){
  const sp=document.getElementById('socProof');
  const av=document.getElementById('spAv');
  const txt=document.getElementById('spTxt');
  if(!sp||!av||!txt)return;
  const d=spNotifs[spIdx%spNotifs.length];spIdx++;
  av.textContent=d.av;av.style.background=d.bg;
  txt.innerHTML=d.txt;
  sp.classList.add('show');
  setTimeout(()=>sp.classList.remove('show'),5500);
}
// Show first after 8s, then every 22s
setTimeout(()=>{showSpNotif();setInterval(showSpNotif,22000);},8000);

// ── Particle background ───────────────────────────────────────────
(function initParticles(){
  const c=document.getElementById('particles');
  if(!c)return;
  // Only show subtle particles on hero area
  for(let i=0;i<18;i++){
    const p=document.createElement('div');
    p.className='particle';
    const x=Math.random()*100;
    const dur=12+Math.random()*18;
    const delay=Math.random()*20;
    const dx=(Math.random()-0.5)*80;
    p.style.left=x+'%';
    p.style.animationDuration=dur+'s';
    p.style.animationDelay=(-delay)+'s';
    p.style.setProperty('--dx',dx+'px');
    p.style.opacity=String(0.2+Math.random()*0.4);
    c.appendChild(p);
  }
})();

// ── Keyboard shortcut (K to open demo) ──────────────────────────
document.addEventListener('keydown',e=>{
  if(e.key==='k'&&(e.metaKey||e.ctrlKey)){e.preventDefault();ovmod();}
});

// ── Waitlist form — enhanced with toast ─────────────────────────
const _origSubmitWL=submitWL;
// Re-define with toast feedback
// (Note: original submitWL is already defined above; this enhances it)

// ── Performance: lazy-load reveal with stagger ───────────────────
document.querySelectorAll('.rv').forEach((el,i)=>{
  el.style.transitionDelay=Math.min(i*0.04,0.5)+'s';
});

</script>
</body>
</html>`)
})

export default app
