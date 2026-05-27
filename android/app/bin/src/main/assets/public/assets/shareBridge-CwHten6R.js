import{f as e,n as t,p as n,r,t as i}from"./vendor-Dhfoy1tk.js";import{l as a}from"./categoryStore-Z4tI22uZ.js";import{a as o,n as s,r as c}from"./format-DJk-fs_g.js";import{i as l}from"./billPresentation-BLFUtpBK.js";var u=`application/vnd.ms-excel`,d=`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,f=1240,p=1754,m=70,h=88,g=595.28,_=841.89,v=26,y=88,b=170,x=20;function S(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function C(e){return e.replace(/\r\n/g,`
`).trim()}function w(e){let t=C(e);return t?S(t).replace(/\n/g,`<br />`):`无`}function T(e,t=18){return e.length>t?`${e.slice(0,t-1)}…`:e}function E(e){let t=new Uint8Array(e),n=32768,r=``;for(let e=0;e<t.length;e+=n){let i=t.subarray(e,e+n);r+=String.fromCharCode(...i)}return window.btoa(r)}function D(e,t){let n=window.atob(e),r=new Uint8Array(n.length);for(let e=0;e<n.length;e+=1)r[e]=n.charCodeAt(e);return new Blob([r],{type:t})}function O(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=()=>t(String(r.result??``)),r.onerror=()=>n(Error(`无法读取图片内容`)),r.readAsDataURL(e)})}function k(e){return new Promise((t,n)=>{let r=new Image;r.onload=()=>t(r),r.onerror=()=>n(Error(`无法加载图片`)),r.src=e})}function A(e){return new Map(e.map(t=>[t.id,a(t,e)]))}function ee(e){return e===`draft`?`草稿`:`已确认`}function te(e){switch(e){case`date_asc`:return`按日期从早到晚`;case`amount_desc`:return`按金额从高到低`;case`amount_asc`:return`按金额从低到高`;default:return`按日期从新到旧`}}function j(e){return e?c(e,`YYYY年MM月DD日 HH:mm:ss`):`无`}function M(e){return!Number.isFinite(e)||e<=0?`未知`:e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(2)} MB`}function N(e,t){let n=C(e.purpose??``);if(n)return n.replace(/\n/g,` `);let r=C(e.description);return r?r.replace(/\n/g,` `):t?`${t}账单`:`${o(e.source)} ${c(e.billDate,`MM月DD日`)}`}function P(e,t){return[`关键字：${e.keyword||`全部`}`,`分类：${t||`全部分类`}`,`开始日期：${e.startDate||`不限`}`,`结束日期：${e.endDate||`不限`}`,`排序方式：${te(e.sortBy)}`].join(` ｜ `)}function F(e){return e.filter(e=>e.images.length>0).length}function I(e){return e.reduce((e,t)=>e+t.images.length,0)}async function ne(e){let t=l(e);if(!t)return``;if(t.startsWith(`data:`))return t;try{let e=await fetch(t);if(!e.ok)throw Error(`无法获取图片内容`);return await O(await e.blob())}catch{return t.startsWith(`http://`)||t.startsWith(`https://`)?t:``}}async function L(e,t){let n=await Promise.all(e.images.map(async(e,t)=>({id:e.id,name:e.name||`票据图片 ${t+1}`,mimeType:e.mimeType||`未知类型`,size:e.size,createdAt:e.createdAt,src:await ne(e)})));return{bill:e,title:N(e,t),categoryName:t||`未分类`,sourceLabel:o(e.source),statusLabel:ee(e.status),images:n}}async function R(e){let t=A(e.categories);return Promise.all(e.bills.map(e=>L(e,t.get(e.categoryId)??`未分类`)))}async function z(e){return{cards:await R(e),filterCategoryName:A(e.categories).get(e.filters.categoryId)??`全部分类`}}function B(e,t,n=``){return`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${S(e)}</title>
    <style>
      :root { color-scheme: light; font-family: 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
      body { margin: 0; padding: 24px; background: #f5f7fa; color: #303133; }
      main { max-width: 980px; margin: 0 auto; display: grid; gap: 16px; }
      section { background: #fff; border: 1px solid #ebeef5; border-radius: 18px; padding: 20px; }
      h1, h2, h3, h4, p { margin: 0; }
      h1 { font-size: 28px; }
      h2 { font-size: 22px; }
      h3 { font-size: 18px; }
      p { color: #606266; }
      .eyebrow { display: inline-block; margin-bottom: 6px; color: #909399; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
      .meta { display: grid; gap: 8px; }
      .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
      .tile { border: 1px solid #ebeef5; border-radius: 14px; padding: 16px; background: #fafafa; }
      .tile span { display: block; margin-bottom: 8px; color: #909399; font-size: 13px; }
      .tile strong { font-size: 22px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { padding: 10px 12px; border-bottom: 1px solid #ebeef5; text-align: left; vertical-align: top; }
      th { color: #909399; font-weight: 600; }
      .muted { color: #909399; }
      ${n}
      @media (max-width: 720px) {
        body { padding: 14px; }
        .stats, .bill-share-card__field-grid, .bill-share-card__image-grid { grid-template-columns: 1fr !important; }
      }
    </style>
  </head>
  <body>
    <main>${t}</main>
  </body>
</html>`}function re(e,t,n=``){return`<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40" lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${S(e)}</title>
    <style>
      body { font-family: 'Microsoft YaHei', sans-serif; margin: 16px; color: #303133; }
      h1, h2, p { margin: 0; }
      .meta { margin-bottom: 16px; display: grid; gap: 6px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #dcdfe6; padding: 10px; text-align: left; vertical-align: top; word-break: break-word; }
      th { background: #f5f7fa; color: #606266; }
      img { display: block; width: 120px; height: 120px; object-fit: cover; border-radius: 10px; border: 1px solid #ebeef5; margin-bottom: 8px; }
      .image-stack { display: grid; gap: 10px; }
      .image-card { padding: 8px; border: 1px solid #ebeef5; border-radius: 10px; background: #fafafa; }
      .image-meta { display: grid; gap: 4px; font-size: 12px; color: #606266; }
      ${n}
    </style>
  </head>
  <body>${t}</body>
</html>`}function V(e,t){let n=window.URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=e,r.style.display=`none`,document.body.appendChild(r),r.click(),r.remove(),window.URL.revokeObjectURL(n)}function H(){let e=document.createElement(`canvas`);e.width=f,e.height=p;let t=e.getContext(`2d`);if(!t)throw Error(`无法创建 PDF 画布`);return t.fillStyle=`#ffffff`,t.fillRect(0,0,e.width,e.height),t.textBaseline=`top`,e}function U(e,t,n){e.fillStyle=`#0f172a`,e.font=`600 48px 'PingFang SC', 'Microsoft YaHei', sans-serif`,e.fillText(t,m,h),e.fillStyle=`#64748b`,e.font=`400 24px 'PingFang SC', 'Microsoft YaHei', sans-serif`;let r=h+74;return n.forEach(t=>{e.fillText(t,m,r),r+=36}),r+24}function W(e,t,n){let r=[],i=C(t).split(`
`).filter(Boolean);return i.length?(i.forEach(t=>{let i=``;Array.from(t).forEach(t=>{let a=`${i}${t}`;if(e.measureText(a).width<=n){i=a;return}i&&r.push(i),i=t}),i&&r.push(i)}),r.length?r:[`无`]):[`无`]}function G(e,t,n,r,i,a,o,s){e.beginPath(),e.moveTo(t+a,n),e.lineTo(t+r-a,n),e.quadraticCurveTo(t+r,n,t+r,n+a),e.lineTo(t+r,n+i-a),e.quadraticCurveTo(t+r,n+i,t+r-a,n+i),e.lineTo(t+a,n+i),e.quadraticCurveTo(t,n+i,t,n+i-a),e.lineTo(t,n+a),e.quadraticCurveTo(t,n,t+a,n),e.closePath(),e.fillStyle=o,e.fill(),e.strokeStyle=s,e.lineWidth=2,e.stroke()}function K(e,t,n,r){let i=n,a=r;return e.font=`500 22px 'PingFang SC', 'Microsoft YaHei', sans-serif`,t.forEach(t=>{let r=e.measureText(t).width+36;i+r>f-m&&(i=n,a+=46),G(e,i,a,r,34,17,`#f8fafc`,`#dbeafe`),e.fillStyle=`#334155`,e.fillText(t,i+18,a+6),i+=r+12}),a+52}function q(e,t,n,r,i){let a=(r-v)/2,o=n;return i.forEach((r,i)=>{let s=i%2,c=Math.floor(i/2),l=t+s*(a+v),u=n+c*y;G(e,l,u,a,72,18,`#fafafa`,`#ebeef5`),e.fillStyle=`#64748b`,e.font=`500 22px 'PingFang SC', 'Microsoft YaHei', sans-serif`,e.fillText(r.label,l+18,u+14),e.fillStyle=`#0f172a`,e.font=`400 24px 'PingFang SC', 'Microsoft YaHei', sans-serif`,W(e,r.value,a-36).slice(0,2).forEach((t,n)=>{e.fillText(t,l+18,u+38+n*28)}),o=u+y}),o}function J(e,t,n,r,i,a){return G(e,t,n,r,150,22,`#ffffff`,`#ebeef5`),e.fillStyle=`#0f172a`,e.font=`600 28px 'PingFang SC', 'Microsoft YaHei', sans-serif`,e.fillText(i,t+20,n+18),e.fillStyle=`#334155`,e.font=`400 24px 'PingFang SC', 'Microsoft YaHei', sans-serif`,W(e,a,r-40).slice(0,4).forEach((r,i)=>{e.fillText(r,t+20,n+62+i*30)}),n+170}async function Y(e,t,n,r,i){let a=Math.max(Math.ceil(i.length/3),1)*(b+64+x)+86;if(G(e,t,n,r,a,22,`#ffffff`,`#ebeef5`),e.fillStyle=`#0f172a`,e.font=`600 28px 'PingFang SC', 'Microsoft YaHei', sans-serif`,e.fillText(`票据图片`,t+20,n+18),!i.length)return e.fillStyle=`#64748b`,e.font=`400 24px 'PingFang SC', 'Microsoft YaHei', sans-serif`,e.fillText(`当前账单未附带票据图片。`,t+20,n+64),n+a+18;let o=r-40,s=Math.min(b,Math.floor((o-x*2)/3)),c=s;for(let[r,a]of i.entries()){let i=r%3,o=Math.floor(r/3),l=t+20+i*(s+x),u=n+64+o*(c+64+x);if(G(e,l,u,s,c,18,`#f8fafc`,`#e2e8f0`),a.src)try{let t=await k(a.src);e.save(),e.beginPath(),e.moveTo(l+18,u),e.lineTo(l+s-18,u),e.quadraticCurveTo(l+s,u,l+s,u+18),e.lineTo(l+s,u+c-18),e.quadraticCurveTo(l+s,u+c,l+s-18,u+c),e.lineTo(l+18,u+c),e.quadraticCurveTo(l,u+c,l,u+c-18),e.lineTo(l,u+18),e.quadraticCurveTo(l,u,l+18,u),e.closePath(),e.clip(),e.drawImage(t,l,u,s,c),e.restore()}catch{e.fillStyle=`#64748b`,e.font=`400 22px 'PingFang SC', 'Microsoft YaHei', sans-serif`,e.fillText(`图片加载失败`,l+18,u+18)}else e.fillStyle=`#64748b`,e.font=`400 22px 'PingFang SC', 'Microsoft YaHei', sans-serif`,e.fillText(`无可用图片`,l+18,u+18);e.fillStyle=`#334155`,e.font=`500 20px 'PingFang SC', 'Microsoft YaHei', sans-serif`,e.fillText(T(a.name,10),l,u+c+10),e.fillStyle=`#64748b`,e.font=`400 18px 'PingFang SC', 'Microsoft YaHei', sans-serif`,e.fillText(T(M(a.size),10),l,u+c+36)}return n+a+18}function X(e,t,n,r,i){let a=i.length?i.map((e,t)=>`图片 ${t+1}：编号 ${e.id}；名称 ${e.name}；类型 ${e.mimeType}；大小 ${M(e.size)}；添加时间 ${j(e.createdAt)}`):[`当前账单未附带票据图片。`],o=Math.max(92,60+a.length*28);return G(e,t,n,r,o,22,`#ffffff`,`#ebeef5`),e.fillStyle=`#0f172a`,e.font=`600 28px 'PingFang SC', 'Microsoft YaHei', sans-serif`,e.fillText(`图片字段信息`,t+20,n+18),e.fillStyle=`#334155`,e.font=`400 20px 'PingFang SC', 'Microsoft YaHei', sans-serif`,a.forEach((i,a)=>{let o=W(e,i,r-40),s=n+60+a*28;e.fillText(o[0]??i,t+20,s)}),n+o+18}function Z(e){return e.trend.map(e=>[e.label,s(e.income),s(e.expense)])}function ie(e){return e.categorySummary.map(e=>[e.name,s(e.amount),String(e.count)])}function ae(e,t,n,r){let i=n.reduce((e,t)=>e+t.width,0),a=t,o=m;e.fillStyle=`#f8fafc`,e.fillRect(m,a,i,58),e.fillStyle=`#475569`,e.font=`600 22px 'PingFang SC', 'Microsoft YaHei', sans-serif`,n.forEach(t=>{e.fillText(t.title,o+12,a+16),o+=t.width}),a+=58,e.font=`400 22px 'PingFang SC', 'Microsoft YaHei', sans-serif`,r.forEach((t,r)=>{e.fillStyle=r%2==0?`#ffffff`:`#f8fafc`,e.fillRect(m,a,i,58),e.fillStyle=`#0f172a`;let o=m;t.forEach((t,r)=>{let i=n[r]?.width??160;e.fillText(T(t,r===0?22:14),o+12,a+16),o+=i}),a+=58}),e.strokeStyle=`#e2e8f0`,e.lineWidth=1;for(let n=0;n<=r.length+1;n+=1){let r=t+n*58;e.beginPath(),e.moveTo(m,r),e.lineTo(m+i,r),e.stroke()}}function Q(e,t){if(!e.length)return[[]];let n=[];for(let r=0;r<e.length;r+=t)n.push(e.slice(r,r+t));return n}async function oe(e){let{cards:t,filterCategoryName:n}=await z(e),i=new r({unit:`pt`,format:`a4`});for(let[r,a]of t.entries()){r>0&&i.addPage();let o=H(),l=o.getContext(`2d`),u=U(l,e.title,[`导出时间：${j(new Date().toISOString())}`,`筛选条件：${P(e.filters,n)}`,`当前账单：第 ${r+1} 笔，共 ${t.length} 笔`]),d=f-m*2,h=s(a.bill.amount);G(l,m,u,d,p-u-80,28,`#ffffff`,`#dbe4f0`),u+=24,l.fillStyle=`#64748b`,l.font=`500 22px 'PingFang SC', 'Microsoft YaHei', sans-serif`,l.fillText(`账单标题`,m+24,u),l.fillStyle=`#0f172a`,l.font=`600 40px 'PingFang SC', 'Microsoft YaHei', sans-serif`,l.fillText(a.title,m+24,u+32),l.fillStyle=`#2563eb`,l.font=`700 42px 'PingFang SC', 'Microsoft YaHei', sans-serif`,l.fillText(h,f-m-24-l.measureText(h).width,u+28),u+=98,u=K(l,[`分类：${a.categoryName}`,`来源：${a.sourceLabel}`,`状态：${a.statusLabel}`,`图片：${a.images.length} 张`],m+24,u),u=q(l,m+24,u,d-48,[{label:`账单 ID`,value:a.bill.id},{label:`账单编号`,value:a.bill.billNo||`未填写`},{label:`账单日期`,value:c(a.bill.billDate,`YYYY年MM月DD日`)},{label:`来源`,value:a.sourceLabel},{label:`状态`,value:a.statusLabel},{label:`分类名称`,value:a.categoryName},{label:`分类标识`,value:a.bill.categoryId||`无`},{label:`创建时间`,value:j(a.bill.createdAt)},{label:`更新时间`,value:j(a.bill.updatedAt)},{label:`图片数量`,value:`${a.images.length} 张`}]),u=J(l,m+24,u+8,d-48,`补充描述`,a.bill.description||`无`),u=J(l,m+24,u,d-48,`原始通知`,a.bill.rawText||`无`),u=await Y(l,m+24,u,d-48,a.images),X(l,m+24,u,d-48,a.images),i.addImage(o.toDataURL(`image/jpeg`,.95),`JPEG`,0,0,g,_)}if(!t.length){let t=H();U(t.getContext(`2d`),e.title,[`当前筛选条件下没有可导出的账单。`]),i.addImage(t.toDataURL(`image/jpeg`,.95),`JPEG`,0,0,g,_)}return E(i.output(`arraybuffer`))}async function se(e){let t=new r({unit:`pt`,format:`a4`}),n=Q(Z(e),18),i=Q(ie(e),18),a=(e,n,r,i)=>{let a=H(),o=a.getContext(`2d`),s=U(o,e,n);r.forEach(e=>{o.fillStyle=`#0f172a`,o.font=`600 30px 'PingFang SC', 'Microsoft YaHei', sans-serif`,o.fillText(e.heading,m,s),s+=50,ae(o,s,e.columns,e.rows.length?e.rows:[[`暂无数据`,`-`,`-`]]),s+=(e.rows.length+1)*58+42}),i>0&&t.addPage(),t.addImage(a.toDataURL(`image/jpeg`,.95),`JPEG`,0,0,g,_)};a(e.title,[`统计范围：${e.summaryLabel}`,`导出时间：${j(new Date().toISOString())}`,`收入 ${s(e.summary.income)} ｜ 支出 ${s(e.summary.expense)} ｜ 净值 ${s(e.summary.net)}`],[{heading:e.trendTitle,columns:[{title:`时间`,width:280},{title:`收入`,width:410},{title:`支出`,width:410}],rows:n[0]??[]}],0),n.slice(1).forEach((t,n)=>{a(e.title,[`统计范围：${e.summaryLabel}`,`趋势续表 ${n+2}`],[{heading:`${e.trendTitle}（续）`,columns:[{title:`时间`,width:280},{title:`收入`,width:410},{title:`支出`,width:410}],rows:t}],n+1)});let o=Math.max(n.length,1);return i.forEach((t,n)=>{a(e.title,[`统计范围：${e.summaryLabel}`,`分类概览 ${n+1}`],[{heading:`分类占比`,columns:[{title:`分类`,width:380},{title:`金额`,width:420},{title:`笔数`,width:300}],rows:t}],o+n)}),E(t.output(`arraybuffer`))}function $(e){return[{label:`账单 ID`,value:e.bill.id},{label:`来源`,value:e.sourceLabel},{label:`状态`,value:e.statusLabel},{label:`分类名称`,value:e.categoryName},{label:`分类标识`,value:e.bill.categoryId||`无`},{label:`金额`,value:s(e.bill.amount)},{label:`账单编号`,value:e.bill.billNo||`未填写`},{label:`账单日期`,value:c(e.bill.billDate,`YYYY年MM月DD日`)},{label:`创建时间`,value:j(e.bill.createdAt)},{label:`更新时间`,value:j(e.bill.updatedAt)},{label:`图片数量`,value:`${e.images.length} 张`}]}function ce(e,t){let n=$(e).map(e=>`
        <div class="bill-share-card__field">
          <span>${S(e.label)}</span>
          <strong>${S(e.value)}</strong>
        </div>`).join(``),r=e.images.length?`
      <div class="bill-share-card__block">
        <h3>票据图片</h3>
        <div class="bill-share-card__image-grid">
          ${e.images.map((e,t)=>`
                <article class="bill-share-card__image-card">
                  ${e.src?`<img class="bill-share-card__image" src="${S(e.src)}" alt="票据图片 ${t+1}" />`:`<div class="bill-share-card__image bill-share-card__image--empty">图片暂时无法展示</div>`}
                  <div class="bill-share-card__image-meta">
                    <p><strong>图片编号：</strong>${S(e.id)}</p>
                    <p><strong>图片名称：</strong>${S(e.name)}</p>
                    <p><strong>图片类型：</strong>${S(e.mimeType)}</p>
                    <p><strong>图片大小：</strong>${S(M(e.size))}</p>
                    <p><strong>添加时间：</strong>${S(j(e.createdAt))}</p>
                  </div>
                </article>`).join(``)}
        </div>
      </div>`:`
      <div class="bill-share-card__block">
        <h3>票据图片</h3>
        <p class="muted">当前账单未附带票据图片。</p>
      </div>`;return`
    <section class="bill-share-card">
      <div class="bill-share-card__head">
        <div>
          <span class="eyebrow">账单 ${t+1}</span>
          <h2>${S(e.title)}</h2>
        </div>
        <strong class="bill-share-card__amount">${S(s(e.bill.amount))}</strong>
      </div>
      <div class="bill-share-card__tags">
        <span>分类：${S(e.categoryName)}</span>
        <span>来源：${S(e.sourceLabel)}</span>
        <span>状态：${S(e.statusLabel)}</span>
        <span>图片：${e.images.length} 张</span>
      </div>
      <div class="bill-share-card__field-grid">${n}</div>
      <div class="bill-share-card__block">
        <h3>补充描述</h3>
        <p>${w(e.bill.description)}</p>
      </div>
      <div class="bill-share-card__block">
        <h3>原始通知</h3>
        <p>${w(e.bill.rawText)}</p>
      </div>
      ${r}
    </section>`}async function le(e){let{cards:t,filterCategoryName:n}=await z(e),r=`
    <section class="meta">
      <h1>${S(e.title)}</h1>
      <p>导出时间：${S(j(new Date().toISOString()))}</p>
      <p>${S(P(e.filters,n))}</p>
    </section>
    <section>
      <div class="stats">
        <div class="tile"><span>账单总数</span><strong>${t.length} 笔</strong></div>
        <div class="tile"><span>带图账单</span><strong>${F(t)} 笔</strong></div>
        <div class="tile"><span>图片总数</span><strong>${I(t)} 张</strong></div>
      </div>
    </section>
    ${t.length?t.map((e,t)=>ce(e,t)).join(``):`<section><p class="muted">当前筛选条件下没有可导出的账单。</p></section>`}
  `;return B(e.title,r,`
      .bill-share-card { display: grid; gap: 16px; }
      .bill-share-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
      .bill-share-card__amount { color: #2563eb; font-size: 26px; white-space: nowrap; }
      .bill-share-card__tags { display: flex; flex-wrap: wrap; gap: 10px; }
      .bill-share-card__tags span { padding: 6px 12px; border-radius: 999px; border: 1px solid #dbeafe; background: #eff6ff; color: #334155; font-size: 13px; }
      .bill-share-card__field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .bill-share-card__field { padding: 14px; border-radius: 14px; border: 1px solid #ebeef5; background: #fafafa; }
      .bill-share-card__field span { display: block; margin-bottom: 8px; color: #909399; font-size: 13px; }
      .bill-share-card__field strong { font-size: 16px; word-break: break-word; }
      .bill-share-card__block { display: grid; gap: 10px; }
      .bill-share-card__block p { line-height: 1.7; white-space: normal; }
      .bill-share-card__image-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .bill-share-card__image-card { padding: 12px; border-radius: 16px; border: 1px solid #ebeef5; background: #fafafa; display: grid; gap: 10px; }
      .bill-share-card__image { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; border-radius: 12px; border: 1px solid #dcdfe6; background: #fff; }
      .bill-share-card__image--empty { display: grid; place-items: center; color: #909399; }
      .bill-share-card__image-meta { display: grid; gap: 4px; }
      .bill-share-card__image-meta p { font-size: 13px; color: #606266; }
      .bill-share-card__image-meta strong { color: #303133; }
    `)}async function ue(e){let{cards:t,filterCategoryName:n}=await z(e),r=[`# ${e.title}`,``,`- 导出时间：${j(new Date().toISOString())}`,`- ${P(e.filters,n)}`,`- 账单总数：${t.length} 笔`,`- 带图账单：${F(t)} 笔`,`- 图片总数：${I(t)} 张`,``];return t.length?(t.forEach((e,t)=>{if(r.push(`## 账单 ${t+1}：${e.title}`),r.push(``),$(e).forEach(e=>{r.push(`- ${e.label}：${e.value}`)}),r.push(`- 金额：${s(e.bill.amount)}`),r.push(`- 补充描述：${C(e.bill.description)||`无`}`),r.push(`- 原始通知：${C(e.bill.rawText)||`无`}`),r.push(``),r.push(`### 票据图片`),r.push(``),!e.images.length){r.push(`当前账单未附带票据图片。`),r.push(``);return}e.images.forEach((e,t)=>{e.src&&r.push(`<img src="${e.src}" alt="票据图片 ${t+1}" width="220" />`),r.push(`- 图片 ${t+1} 编号：${e.id}`),r.push(`- 图片 ${t+1} 名称：${e.name}`),r.push(`- 图片 ${t+1} 类型：${e.mimeType}`),r.push(`- 图片 ${t+1} 大小：${M(e.size)}`),r.push(`- 图片 ${t+1} 添加时间：${j(e.createdAt)}`),r.push(``)})}),r.join(`
`)):(r.push(`当前筛选条件下没有可导出的账单。`),r.join(`
`))}async function de(e){let{cards:t,filterCategoryName:n}=await z(e),r=t.map(e=>{let t=new Map($(e).map(e=>[e.label,e.value]));return`
        <tr>
          <td>${S(e.title)}</td>
          <td>${S(t.get(`账单 ID`)??``)}</td>
          <td>${S(t.get(`来源`)??``)}</td>
          <td>${S(t.get(`状态`)??``)}</td>
          <td>${S(t.get(`分类名称`)??``)}</td>
          <td>${S(t.get(`分类标识`)??``)}</td>
          <td>${S(s(e.bill.amount))}</td>
          <td>${S(t.get(`账单编号`)??``)}</td>
          <td>${S(t.get(`账单日期`)??``)}</td>
          <td>${S(t.get(`创建时间`)??``)}</td>
          <td>${S(t.get(`更新时间`)??``)}</td>
          <td>${S(C(e.bill.description)||`无`)}</td>
          <td>${S(C(e.bill.rawText)||`无`)}</td>
          <td>${S(t.get(`图片数量`)??``)}</td>
          <td>
            ${e.images.length?`<div class="image-stack">${e.images.map((e,t)=>`
                        <div class="image-card">
                          ${e.src?`<img src="${S(e.src)}" alt="票据图片 ${t+1}" />`:`<div>图片暂时无法展示</div>`}
                          <div class="image-meta">
                            <div>图片编号：${S(e.id)}</div>
                            <div>图片名称：${S(e.name)}</div>
                            <div>图片类型：${S(e.mimeType)}</div>
                            <div>图片大小：${S(M(e.size))}</div>
                            <div>添加时间：${S(j(e.createdAt))}</div>
                          </div>
                        </div>`).join(``)}</div>`:`当前账单未附带票据图片。`}
          </td>
        </tr>`}).join(``);return re(e.title,`
      <div class="meta">
        <h1>${S(e.title)}</h1>
        <p>导出时间：${S(j(new Date().toISOString()))}</p>
        <p>${S(P(e.filters,n))}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>账单标题</th>
            <th>账单 ID</th>
            <th>来源</th>
            <th>状态</th>
            <th>分类名称</th>
            <th>分类标识</th>
            <th>金额</th>
            <th>账单编号</th>
            <th>账单日期</th>
            <th>创建时间</th>
            <th>更新时间</th>
            <th>补充描述</th>
            <th>原始通知</th>
            <th>图片数量</th>
            <th>图片内容</th>
          </tr>
        </thead>
        <tbody>${r||`<tr><td colspan="15">当前筛选条件下没有可导出的账单。</td></tr>`}</tbody>
      </table>
    `)}function fe(e){let t=e.trend.map(e=>`
        <tr>
          <td>${S(e.label)}</td>
          <td>${S(s(e.income))}</td>
          <td>${S(s(e.expense))}</td>
        </tr>`).join(``),n=e.categorySummary.map(e=>`
        <tr>
          <td>${S(e.name)}</td>
          <td>${S(s(e.amount))}</td>
          <td>${e.count}</td>
        </tr>`).join(``);return B(e.title,`
      <section class="meta">
        <h1>${S(e.title)}</h1>
        <p>统计范围：${S(e.summaryLabel)}</p>
        <p>导出时间：${S(j(new Date().toISOString()))}</p>
      </section>
      <section>
        <h2>账单概览</h2>
        <div class="stats">
          <div class="tile"><span>收入</span><strong>${S(s(e.summary.income))}</strong></div>
          <div class="tile"><span>支出</span><strong>${S(s(e.summary.expense))}</strong></div>
          <div class="tile"><span>净值</span><strong>${S(s(e.summary.net))}</strong></div>
        </div>
      </section>
      <section>
        <h2>${S(e.trendTitle)}</h2>
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>收入</th>
              <th>支出</th>
            </tr>
          </thead>
          <tbody>${t||`<tr><td colspan="3" class="muted">暂无趋势数据</td></tr>`}</tbody>
        </table>
      </section>
      <section>
        <h2>分类占比</h2>
        <table>
          <thead>
            <tr>
              <th>分类</th>
              <th>金额</th>
              <th>笔数</th>
            </tr>
          </thead>
          <tbody>${n||`<tr><td colspan="3" class="muted">当前视图没有分类占比数据</td></tr>`}</tbody>
        </table>
      </section>
    `)}function pe(e){let t=[`# ${e.title}`,``,`- 统计范围：${e.summaryLabel}`,`- 导出时间：${j(new Date().toISOString())}`,`- 收入：${s(e.summary.income)}`,`- 支出：${s(e.summary.expense)}`,`- 净值：${s(e.summary.net)}`,``,`## ${e.trendTitle}`,``,`| 时间 | 收入 | 支出 |`,`| --- | --- | --- |`];return e.trend.forEach(e=>{t.push(`| ${e.label} | ${s(e.income)} | ${s(e.expense)} |`)}),t.push(``,`## 分类占比`,``,`| 分类 | 金额 | 笔数 |`,`| --- | --- | --- |`),e.categorySummary.forEach(e=>{t.push(`| ${e.name} | ${s(e.amount)} | ${e.count} |`)}),t.join(`
`)}function me(e){let t=i.book_new(),n=i.json_to_sheet([{指标:`收入`,金额:e.summary.income},{指标:`支出`,金额:e.summary.expense},{指标:`净值`,金额:e.summary.net},{指标:`笔数`,金额:e.summary.count}]),r=i.json_to_sheet(e.trend.map(e=>({时间:e.label,收入:e.income,支出:e.expense}))),a=i.json_to_sheet(e.categorySummary.map(e=>({分类:e.name,金额:e.amount,笔数:e.count})));return i.book_append_sheet(t,n,`概览`),i.book_append_sheet(t,r,`趋势`),i.book_append_sheet(t,a,`分类`),t}function he(e,t,n){V(e,new Blob([t],{type:n}))}function ge(e){let t=e.base64Content?D(e.base64Content,e.mimeType):new Blob([e.textContent??``],{type:e.mimeType});V(e.fileName,t)}async function _e(e,t,n){switch(e){case`pdf`:return{fileName:`${t}.pdf`,mimeType:`application/pdf`,base64Content:await oe(n)};case`excel`:return{fileName:`${t}.xls`,mimeType:u,textContent:await de(n)};case`markdown`:return{fileName:`${t}.md`,mimeType:`text/markdown`,textContent:await ue(n)};case`html`:return{fileName:`${t}.html`,mimeType:`text/html`,textContent:await le(n)}}}async function ve(e,n,r){switch(e){case`pdf`:return{fileName:`${n}.pdf`,mimeType:`application/pdf`,base64Content:await se(r)};case`excel`:return{fileName:`${n}.xlsx`,mimeType:d,base64Content:t(me(r),{type:`base64`,bookType:`xlsx`})};case`markdown`:return{fileName:`${n}.md`,mimeType:`text/markdown`,textContent:pe(r)};case`html`:return{fileName:`${n}.html`,mimeType:`text/html`,textContent:fe(r)}}}var ye=n(`BillShare`);function be(e,t){let n=window.atob(e),r=new Uint8Array(n.length);for(let e=0;e<n.length;e+=1)r[e]=n.charCodeAt(e);return new Blob([r],{type:t})}function xe(e){return e.base64Content?be(e.base64Content,e.mimeType):new Blob([e.textContent??``],{type:e.mimeType})}function Se(){return e.getPlatform()===`android`}async function Ce(e){if(typeof navigator>`u`||typeof navigator.share!=`function`)return null;let t=xe(e),n=new File([t],e.fileName,{type:e.mimeType});if(typeof navigator.canShare==`function`&&!navigator.canShare({files:[n]}))return null;try{return await navigator.share({title:e.title,text:e.textContent,files:[n]}),{sharedVia:`chooser`}}catch{return null}}async function we(e){if(Se()){let t=await ye.shareFile(e).catch(()=>null);if(t)return t}return Ce(e)}export{ve as a,_e as i,ge as n,he as r,we as t};