import type { Diagram } from '../types';
import { q, seg, bindSeg } from '../helpers';

const paths:Record<string,string>={cezanne:'塞尚：通过色块与形体建立画面秩序。他的空间处理为立体主义提供参考，但影响远不止一个流派。',seurat:'修拉：以分离的色点研究相邻颜色与观看距离。细点可能融合成整体，也可能保留色彩的闪动感。',vangogh:'梵高：笔触方向、明暗和颜色一起组织情绪与节奏。画面仍经过仔细安排，不能只理解成即时情绪的倾泻。',gauguin:'高更：平涂色块与象征性场景弱化自然主义空间。他对“原始”的想象还需要放回殖民语境中理解。'};
const diagram: Diagram = {
  html(){return `<div class="ctl">${seg('pi-path',[['cezanne','塞尚 · 结构'],['seurat','修拉 · 色彩关系'],['vangogh','梵高 · 笔触'],['gauguin','高更 · 象征']],'cezanne')}</div><p class="info-box" id="pi-note" aria-live="polite">${paths.cezanne}</p>
    <h4>从修拉的问题出发，看色点怎样并置</h4><div class="dg-wrap"><canvas id="dots" width="560" height="170" style="width:100%;min-width:480px;display:block" role="img" aria-label="同样颜色以粗细不同的色点并置，不是颜料混合"></canvas></div>
    <div class="ctl"><label for="d-dot">色点的可辨程度</label><input type="range" id="d-dot" min="1" max="9" step=".5" value="6"><span class="val" id="dot-val"></span></div><p class="info-box" id="dot-note" aria-live="polite"></p>`;},
  init(r){bindSeg(r,'pi-path',v=>q(r,'#pi-note').textContent=paths[v]);
    const cv=q(r,'#dots'),ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1;cv.width=560*dpr;cv.height=170*dpr;ctx.scale(dpr,dpr);
    const draw=(sz:number)=>{ctx.fillStyle='#fff';ctx.fillRect(0,0,560,170);const st=sz*1.7;
      // 两色交替且面积接近，避免随机比例变化伪装成观看距离效果。
      for(let y=0,row=0;y<170;y+=st,row++)for(let x=0,col=0;x<560;x+=st,col++){
        const even=(row+col)%2===0,sun=Math.hypot(x-450,y-40)<26;
        ctx.fillStyle=sun?(even?'#E8341C':'#FFD21F'):y<92?(even?'#3E6FD8':'#FFFFFF'):(even?'#2C55C8':'#F2D21E');ctx.beginPath();ctx.arc(x,y,sz*.85,0,Math.PI*2);ctx.fill();
      }
      q(r,'#dot-val').textContent=sz>4?'色点较清楚':'色点更细密';q(r,'#dot-note').textContent=sz>4?'下半部由蓝点与黄点交替构成。颜色并排放置，没有在调色盘里混合。':'细点更难逐个分辨，可能呈现较统一的色感。请以你实际看到的结果为准；屏幕上的蓝黄并置并不保证变绿。';
    };const s=q(r,'#d-dot');s.oninput=()=>draw(+s.value);draw(+s.value);
  }
};
export default diagram;
