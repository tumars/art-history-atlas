import type { Diagram } from "../types";
import { q, mixHex, mulHex, keyColor, hex2rgb, rgb2hex, seg, bindSeg } from "../helpers";

/* 16 印象派：干草堆 */
const SKY_TOP:[number,string][]=[[5,"#2E2A5A"],[6.5,"#7A6FA8"],[8,"#8EB6E0"],[12,"#4F8FD8"],[16,"#6FA4DC"],[18.5,"#E07A4A"],[20,"#4A3A78"],[21,"#1E1A3A"]];
const SKY_BOT:[number,string][]=[[5,"#E9A0A0"],[6.5,"#F5C1A0"],[8,"#E8EEF2"],[12,"#CFE2F5"],[16,"#F2E3C0"],[18.5,"#F7B26A"],[20,"#C47AA8"],[21,"#4A3A6A"]];
const LIGHT:[number,string][]=[[5,"#F4A6A0"],[7,"#FFD9B0"],[10,"#FFF6E6"],[12,"#FFFFFF"],[16,"#FFE7A6"],[18.5,"#FF9A4D"],[20,"#B06AB8"],[21,"#6A5A9A"]];
const diagram: Diagram = {
html(){return `<div class="dg-wrap"><svg class="dg" viewBox="0 0 560 260" role="img" aria-label="不同时刻光线下干草堆颜色与阴影的变化">
  <defs><linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop id="sky1" offset="0"/><stop id="sky2" offset="1"/></linearGradient></defs>
  <rect width="560" height="200" fill="url(#skyG)"/><circle id="sun" r="14"/>
  <rect y="196" width="560" height="64" id="ground"/>
  <ellipse id="hay-sh" cy="214" ry="9"/>
  <path id="hay" d="M200 214 Q196 120 280 106 Q364 120 360 214 Z"/>
  <path id="hay-dark"/>
  <path d="M232 128 Q280 94 328 128 Q300 116 280 116 Q260 116 232 128 Z" id="hay-cap"/>
  <text x="14" y="26" class="t-b t-l" id="time-t" style="fill:#FFFFFF"></text>
  </svg></div>
  <div class="ctl"><label for="d-time">时间</label><input type="range" id="d-time" min="5" max="21" step=".1" value="8">${seg("sh-mode",[["imp","印象派：彩色阴影"],["aca","学院派：阴影加黑"]],"imp")}</div>`},
init(r){const s=q(r,"#d-time");let mode="imp";const g=(id:string)=>q(r,"#"+id);
  const up=()=>{const t=+s.value;g("sky1").setAttribute("stop-color",keyColor(SKY_TOP,t));g("sky2").setAttribute("stop-color",keyColor(SKY_BOT,t));
    const L=keyColor(LIGHT,t),ph=(t-5)/16,sx=40+ph*480,sy=190-Math.sin(ph*Math.PI)*170;g("sun").setAttribute("cx",sx);g("sun").setAttribute("cy",sy);g("sun").setAttribute("fill",L);
    const lit=mulHex("#E2B95C",L),grd=mulHex("#7FA05A",L);g("ground").setAttribute("fill",grd);g("hay").setAttribute("fill",lit);g("hay-cap").setAttribute("fill",mulHex("#F0D27A",L));
    const comp=mixHex(rgb2hex(hex2rgb(L).map(v=>255-v*.75)),"#3E4FC8",.72);
    const shade=mode==="aca"?mixHex(lit,"#1E1810",.62):mixHex(lit,comp,.72);
    g("hay-dark").setAttribute("d",sx<280?"M280 106 Q364 120 360 214 L292 214 Q300 160 280 106 Z":"M280 106 Q196 120 200 214 L268 214 Q260 160 280 106 Z");g("hay-dark").setAttribute("fill",shade);
    const len=40+(1-Math.sin(ph*Math.PI))*140,dir=sx<280?1:-1;g("hay-sh").setAttribute("cx",280+dir*(80+len/2));g("hay-sh").setAttribute("rx",len/2+40);
    g("hay-sh").setAttribute("fill",mode==="aca"?mixHex(grd,"#141008",.6):mixHex(grd,comp,.6));
    const h=Math.floor(t),m=Math.round((t-h)*60/10)*10;g("time-t").textContent=`${h<12?"上午":h<18?"下午":"傍晚"} ${h}:${String(m%60).padStart(2,"0")}`;};
  s.oninput=up;bindSeg(r,"sh-mode",v=>{mode=v;up()});up();}};

export default diagram;
