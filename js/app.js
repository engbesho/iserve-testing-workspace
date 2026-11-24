(function(){
var KEY="test-checklist-v1",MK="test-checklist-meta",data=[],meta={name:"IServe Migration"},sel=null,tab="check",query="";
var $=function(i){return document.getElementById(i)};
$("hero").src=ASSETS.banner;$("logo").src=ASSETS.logo;
try{data=JSON.parse(localStorage.getItem(KEY)||"[]")||[]}catch(e){data=[]}
try{meta=Object.assign(meta,JSON.parse(localStorage.getItem(MK)||"{}"))}catch(e){}
if(meta.name==="Test checklist")meta.name="IServe Migration";
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function save(){try{var p=act();if(p){p.services=data;var sg=projSig(p);if(sg!==p.sig){p.sig=sg;p.dirty=true}}localStorage.setItem(SK2,JSON.stringify(store));sched();return true}catch(e){return false}}
function toast(m){var t=$("toast");t.textContent=m;t.classList.add("on");setTimeout(function(){t.classList.remove("on")},2200)}
function ob(s){return s.bugs.filter(function(b){return!b.fixed}).length}
function cd(s){return s.checks.filter(function(c){return c.done}).length}
function pct(a,b){return b?Math.round(a/b*100):0}
function fix(s){s.bugs=s.bugs||[];s.checks=s.checks||[];s.log=s.log||[];s.desc=s.desc||"";s.note=s.note||"";s.name=s.name||"";s.id=s.id||uid();if(s.result===undefined)s.result=s.done?(ob(s)?"bug":"clean"):""}
var SK2="tc-projects-v1",store=null,DEFB=$("hero").src;
try{store=JSON.parse(localStorage.getItem(SK2))}catch(e){}
if(!store||!Array.isArray(store.projects)||!store.projects.length)store={projects:[{id:uid(),name:meta.name,banner:"default",services:data}],active:null};
store.projects.forEach(function(p){p.id=p.id||uid();p.services=p.services||[];p.services.forEach(fix);if(p.banner===undefined)p.banner=""});
function act(){return store.projects.filter(function(p){return p.id===store.active})[0]||store.projects[0]}
function bind(){var p=act();store.active=p.id;data=p.services;meta=p;if(typeof PD!=="undefined"&&PD){p.prefs=Object.assign({},PD,p.prefs||{});prefs=p.prefs}}
function slug(){return(meta.name||"project").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"project"}
bind();
var PK="tc-prefs-v1",PD={bg:"",bgImg:"",profile:"",sub:"",cap:"",ink:"",fs:""},LEG={},prefs;
try{LEG=JSON.parse(localStorage.getItem(PK)||"{}")||{}}catch(e){}
store.projects.forEach(function(p){if(!p.prefs)p.prefs=Object.assign({},PD,LEG)});
bind();
var DEFLOGO=$("logo").src,DEFSUB=$("subline").textContent,DEFCAP=$("capline").textContent;
function savePrefs(){if(save())return true;toast("Image is too large to save");return false}
function applyPrefs(){var r=document.documentElement,s=r.style,b=document.body.style,dark=r.getAttribute("data-theme")==="dark";
 if(prefs.bg&&!dark)s.setProperty("--bg",prefs.bg);else s.removeProperty("--bg");
 if(prefs.ink&&!dark)s.setProperty("--ink",prefs.ink);else s.removeProperty("--ink");
 if(prefs.fs)s.setProperty("--fs",prefs.fs);else s.removeProperty("--fs");
 b.backgroundImage=prefs.bgImg?'url("'+prefs.bgImg+'")':"";b.backgroundSize="cover";b.backgroundAttachment="fixed";b.backgroundPosition="center";
 $("logo").src=prefs.profile||DEFLOGO;$("subline").textContent=prefs.sub||DEFSUB;$("capline").textContent=prefs.cap||DEFCAP}
var SL={bugs:"Has bugs",pass:"Passed",prog:"In progress",todo:"Not started"},PC={bugs:"bad",pass:"ok",prog:"info",todo:""},SK={bugs:"var(--bad)",pass:"var(--ok)",prog:"var(--warn)",todo:"var(--line)"};
function status(s){return(ob(s)||s.result==="bug")?"bugs":s.result==="clean"?"pass":cd(s)?"prog":"todo"}
function cur(){return data.filter(function(s){return s.id===sel})[0]}
function totals(){var t={n:data.length,pass:0,bugs:0,todo:0,prog:0,open:0,fixed:0,ck:0,cd:0,sev:{High:0,Medium:0,Low:0}};
 data.forEach(function(s){t[status(s)]++;t.ck+=s.checks.length;t.cd+=cd(s);s.bugs.forEach(function(b){if(b.fixed)t.fixed++;else{t.open++;t.sev[b.sev]++}})});return t}
function card(l,v){return'<div class="kpi"><span>'+l+'</span><b>'+v+'</b></div>'}
function kpiHtml(t){var p=pct(t.cd,t.ck);return card("Total services",t.n)+card("Passed services",t.pass)+card("Open bugs",t.open)+'<div class="kpi"><span>Checklist completion</span><b>'+p+'%</b><div class="bar"><i style="width:'+p+'%"></i></div></div>'}
function renderKpis(){$("kpis").innerHTML=kpiHtml(totals())}
function renderList(){
 var f=data.filter(function(s){return s.name.toLowerCase().indexOf(query)>-1});$("cnt").textContent=data.length;
 $("svcList").innerHTML=f.length?f.map(function(s){var st=status(s);return'<button class="item'+(s.id===sel?' on':'')+'" data-sid="'+s.id+'"><span class="in"><b>'+esc(s.name||"Untitled")+'</b><span class="pill '+PC[st]+'">'+SL[st]+'</span></span><span class="im">'+cd(s)+'/'+s.checks.length+' checks, '+ob(s)+' open bugs</span></button>'}).join(""):'<p class="hint">'+(data.length?"No services match your search.":"No services yet.")+'</p>'}
function sevSel(v){return'<select data-a="bsev" aria-label="Severity">'+["Low","Medium","High"].map(function(o){return'<option'+(o===v?' selected':'')+'>'+o+'</option>'}).join("")+'</select>'}
function renderMain(){
 var s=cur();if(!s&&data.length){sel=data[0].id;s=data[0]}
 if(!s){$("main").innerHTML='<div class="empty"><h2>Start your checklist</h2><p>Add the first service you need to test.</p><button class="btn pri" data-a="open">+ Add service</button></div>';return}
 var h='<div class="mh"><div class="titles"><input class="title" data-a="name" value="'+esc(s.name)+'" aria-label="Service name"><br><input class="desc" data-a="desc" value="'+esc(s.desc)+'" placeholder="Add a short description" aria-label="Description" style="width:100%"><div class="meta">'+cd(s)+'/'+s.checks.length+' checklist items completed</div></div>'+
 '<div class="mact"><select data-a="result" aria-label="Test result">'+[["","Not tested"],["bug","Done \u2013 has bug"],["clean","Done \u2013 no bug"]].map(function(o){return'<option value="'+o[0]+'"'+(o[0]===(s.result||"")?' selected':'')+'>'+o[1]+'</option>'}).join("")+'</select><button class="btn danger" data-a="del">Delete</button></div></div>'+
 '<div class="tabs" role="tablist">'+[["check","Checklist ("+s.checks.length+")"],["notes","Notes ("+s.log.length+")"],["bugs","Bugs ("+s.bugs.length+")"]].map(function(t){return'<button role="tab" data-tab="'+t[0]+'" class="'+(tab===t[0]?'on':'')+'">'+t[1]+'</button>'}).join("")+'</div>';
 if(tab==="check"){
  h+='<div class="sec"><b>Test checklist</b></div>'+(s.checks.length?s.checks.map(function(c){return'<div class="chk'+(c.done?' d':'')+'" data-cid="'+c.id+'"><input type="checkbox" data-a="cdone"'+(c.done?' checked':'')+' aria-label="Done"><input class="ctext" data-a="ctext" value="'+esc(c.text)+'" aria-label="Check"><button class="x" data-a="cdel" aria-label="Delete check">\u00d7</button></div>'}).join(""):'<p class="hint" style="text-align:left">No checks yet. Add what you need to verify for this service.</p>')+
  '<div class="row"><input type="text" data-a="newchk" placeholder="Add a check and press Enter" aria-label="New check"><button class="btn" data-a="addchk">+ Add check</button></div>'+
  '<div class="sec"><b>Quick testing notes</b><span class="saved">Saved automatically</span></div><textarea data-a="note" placeholder="Record observations, test data, environment details, decisions...">'+esc(s.note)+'</textarea>'}
 else if(tab==="notes"){
  h+='<div class="sec"><b>Notes log</b></div><textarea data-a="newlog" style="min-height:70px" placeholder="Write a note about this test run"></textarea><div class="row"><button class="btn pri" data-a="addlog">Add note</button></div>'+
  s.log.map(function(l){return'<div class="log" data-lid="'+l.id+'"><div><small>'+esc(new Date(l.at).toLocaleString())+'</small>'+esc(l.text)+'</div><button class="x" data-a="ldel" aria-label="Delete note">\u00d7</button></div>'}).join("")}
 else{
  h+='<div class="sec"><b>Bugs</b><span class="saved">'+ob(s)+' open</span></div>'+(s.bugs.length?'':'<p class="hint" style="text-align:left">No bugs found yet.</p>')+s.bugs.map(function(b){return'<div class="bug'+(b.fixed?' fixed':'')+'" data-bid="'+b.id+'"><input type="checkbox" data-a="bfix" title="Mark fixed" aria-label="Mark fixed"'+(b.fixed?' checked':'')+'><textarea data-a="btext" aria-label="Bug description">'+esc(b.text)+'</textarea>'+sevSel(b.sev)+'<button class="x" data-a="bdel" aria-label="Delete bug">\u00d7</button>'+attHtml(b)+'</div>'}).join("")+
  '<div class="row"><input type="text" data-a="newbug" placeholder="Describe a bug and press Enter" aria-label="New bug"><button class="btn" data-a="addbug">+ Add bug</button></div>'}
 $("main").innerHTML=h;
 var sv=$("main").querySelectorAll('[data-a="bsev"]');
 loadThumbs();
}
function renderAll(){renderKpis();renderList();renderMain()}
function addItem(k){
 var s=cur(),i=document.querySelector('#main [data-a="new'+k+'"]'),v=i.value.trim();if(!v)return;
 if(k==="chk")s.checks.push({id:uid(),text:v,done:false});else if(k==="bug")s.bugs.push({id:uid(),text:v,sev:"Medium",fixed:false});else s.log.unshift({id:uid(),text:v,at:Date.now()});
 save();renderAll();var n=document.querySelector('#main [data-a="new'+k+'"]');if(n)n.focus()}
function openDlg(){$("dn").value="";$("dd").value="";$("dlg").showModal();$("dn").focus()}
function addService(){var v=$("dn").value.trim();if(!v){$("dn").focus();return}
 var s={id:uid(),name:v,desc:$("dd").value.trim(),note:"",result:"",checks:[],bugs:[],log:[]};data.push(s);sel=s.id;tab="check";save();$("dlg").close();renderAll()}
$("addSvc").onclick=openDlg;$("dc").onclick=function(){$("dlg").close()};$("dok").onclick=addService;
$("dlg").addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.tagName==="INPUT")addService()});
$("q").oninput=function(){query=this.value.trim().toLowerCase();renderList()};
$("svcList").onclick=function(e){var b=e.target.closest("[data-sid]");if(b){sel=b.dataset.sid;tab="check";renderList();renderMain()}};
function rowOf(t){return t.closest("[data-cid],[data-bid],[data-lid]")}
$("main").onclick=function(e){
 var t=e.target.closest("[data-a],[data-tab]");if(!t)return;
 if(t.dataset.a==="open"){openDlg();return}
 var s=cur();if(!s)return;if(t.dataset.tab){tab=t.dataset.tab;renderMain();return}
 var a=t.dataset.a,r=rowOf(t),id=r&&(r.dataset.cid||r.dataset.bid||r.dataset.lid);
 if(a==="del"){ask("Delete \u201c"+(s.name||"this service")+"\u201d and everything in it?","Delete",function(){purge([s]);data=data.filter(function(x){return x!==s});sel=data[0]?data[0].id:null;save();renderAll()})}
 else if(a==="addchk")addItem("chk");else if(a==="addbug")addItem("bug");else if(a==="addlog")addItem("log");
 else if(a==="cdel"){s.checks=s.checks.filter(function(x){return x.id!==id});save();renderAll()}
 else if(a==="bdel"){purge([{bugs:s.bugs.filter(function(x){return x.id===id})}]);s.bugs=s.bugs.filter(function(x){return x.id!==id});save();renderAll()}
 else if(a==="ldel"){s.log=s.log.filter(function(x){return x.id!==id});save();renderAll()}
};
function find(arr,r,k){return arr.filter(function(x){return r&&x.id===r.dataset[k]})[0]}
$("main").onchange=function(e){
 var t=e.target,a=t.dataset.a,s=cur(),r=rowOf(t);if(!s)return;
 if(a==="result"){s.result=t.value;s.done=!!t.value}
 else if(a==="cdone"){find(s.checks,r,"cid").done=t.checked}
 else if(a==="bfix"){find(s.bugs,r,"bid").fixed=t.checked}
 else if(a==="bsev"){find(s.bugs,r,"bid").sev=t.value}else return;
 save();renderAll()};
$("main").oninput=function(e){
 var t=e.target,a=t.dataset.a,s=cur(),r=rowOf(t);if(!s)return;
 if(a==="name"){s.name=t.value;renderList()}else if(a==="desc")s.desc=t.value;else if(a==="note")s.note=t.value;
 else if(a==="ctext")find(s.checks,r,"cid").text=t.value;else if(a==="btext")find(s.bugs,r,"bid").text=t.value;else return;
 save()};
$("main").onkeydown=function(e){var a=e.target.dataset.a;if(e.key==="Enter"&&e.target.tagName==="INPUT"&&(a==="newchk"||a==="newbug"))addItem(a.slice(3))};
$("proj").value=meta.name;
function logo(){document.title=meta.name+" \u2013 Test Checklist"}
$("proj").oninput=function(){meta.name=this.value;logo();renderProjects();$("genName").textContent=meta.name||"Untitled project";save()};logo();
function setTheme(t,keep){document.documentElement.setAttribute("data-theme",t);$("theme").textContent=t==="dark"?"Light":"Dark";if(keep){try{localStorage.setItem("tc-theme",t)}catch(e){}}applyPrefs()}
var th="light";try{th=localStorage.getItem("tc-theme")==="dark"?"dark":"light"}catch(e){}
setTheme(th);$("theme").onclick=function(){setTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark",true)};
function reportBody(){
 var t=totals(),d=new Date().toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});
 if(!t.n)return'<p class="sub">No services yet.</p>';
 function sg(k){return t[k]?'<i style="width:'+t[k]/t.n*100+'%;background:'+SK[k]+'"></i>':''}
 return'<p class="sub">Test summary as of '+esc(d)+'</p><div class="kpis">'+kpiHtml(t)+'</div><div class="panel"><h2>Service status</h2><div class="stack">'+sg("pass")+sg("bugs")+sg("prog")+sg("todo")+'</div><span class="sub">Passed '+t.pass+', has bugs '+t.bugs+', in progress '+t.prog+', not started '+t.todo+'. Open bugs: high '+t.sev.High+', medium '+t.sev.Medium+', low '+t.sev.Low+'. Fixed: '+t.fixed+'.</span></div>'+
 '<div class="panel"><h2>Results by service</h2><div class="scroll"><table><thead><tr><th>Service</th><th>Result</th><th>Checks</th><th>Notes</th><th>Bugs</th></tr></thead><tbody>'+data.map(function(s){var st=status(s);
 return'<tr><td><b>'+esc(s.name)+'</b></td><td><span class="pill '+PC[st]+'">'+SL[st]+'</span></td><td>'+cd(s)+'/'+s.checks.length+'</td><td class="pre">'+esc(s.note)+'</td><td>'+(s.bugs.length?'<ul>'+s.bugs.map(function(b){return'<li>'+(b.fixed?'<s>'+esc(b.text)+'</s>':esc(b.text))+' ('+b.sev+(b.fixed?', fixed':'')+(b.atts&&b.atts.length?', '+b.atts.length+' attachment'+(b.atts.length>1?'s':''):'')+')</li>'}).join("")+'</ul>':'None')+'</td></tr>'}).join("")+'</tbody></table></div></div>'}
function pageCss(){var out="";try{[].forEach.call(document.styleSheets,function(ss){if(ss.href&&ss.href.indexOf("fonts.googleapis")>-1)return;[].forEach.call(ss.cssRules,function(r){out+=r.cssText+"\n"})})}catch(e){out=ASSETS.css||""}return out||ASSETS.css||""}
async function exportFile(name,type,content){
 $("menu").open=false;var dl=null;try{dl=window.claude&&await claude.use("downloads")}catch(e){}
 if(!dl){try{var u=URL.createObjectURL(new Blob([content],{type:type})),l=document.createElement("a");l.href=u;l.download=name;document.body.appendChild(l);l.click();l.remove();setTimeout(function(){URL.revokeObjectURL(u)},1500)}catch(e){toast("Export failed")}return}
 try{await dl.save({filename:name,data:new Blob([content],{type:type})})}catch(e){if(!e||e.code!=="declined")toast("Export failed")}}
$("expHtml").onclick=function(){var css=pageCss();
 exportFile(slug()+"-summary.html","text/html",'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+esc(meta.name)+' summary</title><style>'+css+'</style></head><body><div class="wrap rep">'+(bannerSrc()?'<img class="hero" src="'+bannerSrc()+'" alt="">':'')+'<h1 style="font-size:20px;margin:0 0 14px">'+esc(meta.name)+'</h1>'+reportBody()+'</div></body></html>')};
$("expCsv").onclick=function(){
 function q(v){return'"'+String(v).replace(/"/g,'""')+'"'}
 var rows=[["Service","Result","Checks done","Notes","Bug","Severity","Bug status","Attachments"]];
 data.forEach(function(s){(s.bugs.length?s.bugs:[null]).forEach(function(b){rows.push([s.name,SL[status(s)],cd(s)+"/"+s.checks.length,s.note,b?b.text:"",b?b.sev:"",b?(b.fixed?"Fixed":"Open"):"",b?(b.atts||[]).length:""])})});
 exportFile(slug()+"-results.csv","text/csv","\uFEFF"+rows.map(function(r){return r.map(q).join(",")}).join("\r\n"))};
$("expJson").onclick=function(){exportFile("test-checklist-backup.json","application/json",JSON.stringify({version:2,projects:store.projects},null,2))};
$("imp").onclick=function(){$("file").click()};
$("file").onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();
 r.onload=function(){try{var j=JSON.parse(r.result);
  if(Array.isArray(j.projects)){if(!j.projects.length)throw 0;ask("Replace ALL projects with the backup ("+j.projects.length+" projects)?","Replace",function(){store.projects.forEach(function(p){purge(p.services);markDel(p.id)});j.projects.forEach(function(p){p.id=p.id||uid();p.services=p.services||[];p.services.forEach(fix);if(p.banner===undefined)p.banner=""});store.projects=j.projects;setActive(store.projects[0].id);toast("Backup imported")})}
  else{var a=Array.isArray(j)?j:j.services;if(!Array.isArray(a))throw 0;a.forEach(fix);var p={id:uid(),name:j.project||"Imported project",banner:"",services:a};store.projects.push(p);setActive(p.id);toast("Imported as a new project")}
 }catch(e){toast("That file isn\u2019t a valid backup")}};
 r.readAsText(f);this.value=""};
function showDash(on){$("dash").hidden=!on;document.querySelector(".grid").hidden=on;$("kpis").hidden=on;$("dashBtn").textContent=on?"Checklist":"Dashboard";if(on)$("dashBody").innerHTML=reportBody()}
$("dashBtn").onclick=function(){showDash($("dash").hidden)};
$("dBack").onclick=function(){showDash(false)};
$("dExpHtml").onclick=function(){$("expHtml").onclick()};
$("dExpCsv").onclick=function(){$("expCsv").onclick()};
function renderProjects(){$("projs").innerHTML=store.projects.map(function(p){return'<button class="pchip'+(p.id===store.active?' on':'')+'" data-pid="'+p.id+'">'+esc(p.name||"Untitled")+'</button>'}).join("")+'<button class="pchip new">+ New project</button>'}
function bannerSrc(){var b=meta.banner;return b==="default"?DEFB:(b&&String(b).indexOf("data:")===0?b:"")}
function renderHero(){var s=bannerSrc();$("hero").hidden=!s;$("gen").hidden=!!s;if(s)$("hero").src=s;$("genName").textContent=meta.name||"Untitled project"}
function setActive(id){store.active=id;bind();sel=null;tab="check";query="";$("q").value="";$("proj").value=meta.name;logo();save();applyPrefs();renderProjects();renderHero();renderAll();if(!$("dash").hidden)$("dashBody").innerHTML=reportBody()}
$("projs").onclick=function(e){var b=e.target.closest("button");if(!b)return;if(b.dataset.pid){if(b.dataset.pid!==store.active)setActive(b.dataset.pid)}else{$("pn").value="";$("pcopy").checked=false;$("pdlg").showModal();$("pn").focus()}};
function createProject(){var v=$("pn").value.trim();if(!v){$("pn").focus();return}
 var svc=$("pcopy").checked?data.map(function(s){return{id:uid(),name:s.name,desc:s.desc,note:"",result:"",bugs:[],log:[],checks:s.checks.map(function(c){return{id:uid(),text:c.text,done:false}})}}):[];
 var p={id:uid(),name:v,banner:"",services:svc};store.projects.push(p);$("pdlg").close();setActive(p.id);toast("Project created")}
$("pc").onclick=function(){$("pdlg").close()};$("pok").onclick=createProject;
$("pdlg").addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.tagName==="INPUT"&&e.target.type==="text")createProject()});
$("pdel").onclick=function(){$("pmenu").open=false;var gone=meta;
 ask('Delete project \u201c'+(gone.name||"Untitled")+'\u201d and all its services, notes and bugs?',"Delete project",function(){
  purge(gone.services);markDel(gone.id);store.projects=store.projects.filter(function(p){return p!==gone});
  if(!store.projects.length)store.projects.push({id:uid(),name:"My project",banner:"",services:[]});
  setActive(store.projects[0].id)})};
$("bset").onclick=function(){$("pmenu").open=false;$("bfile").click()};
$("brem").onclick=function(){$("pmenu").open=false;meta.banner="";save();renderHero()};
$("bfile").onchange=function(){var f=this.files[0];this.value="";if(!f)return;var r=new FileReader();
 r.onload=function(){var im=new Image();
  im.onload=function(){var W=1600,H=533,c=document.createElement("canvas");c.width=W;c.height=H;var x=c.getContext("2d"),k=Math.max(W/im.width,H/im.height),w=im.width*k,h=im.height*k;x.drawImage(im,(W-w)/2,(H-h)/2,w,h);
   var old=meta.banner;meta.banner=c.toDataURL("image/jpeg",.82);if(save()){renderHero();toast("Banner updated")}else{meta.banner=old;toast("Image is too large to save")}};
  im.onerror=function(){toast("That isn\u2019t an image")};im.src=r.result};
 r.readAsDataURL(f)};
var BG=[["","Auto"],["#ffffff","White"],["#eaf2ff","Sky"],["#fff6e5","Sand"],["#e9f6ee","Mint"],["#f1ecfa","Lavender"],["#e2e8f0","Slate"]],INK=[["","Auto"],["#0b1f44","Navy"],["#000000","Black"],["#334155","Slate"],["#7a1f1f","Maroon"]];
function sw(id,list,key){$(id).innerHTML=list.map(function(o){return'<button class="swb'+((prefs[key]||"")===o[0]?' on':'')+'" data-v="'+o[0]+'" title="'+o[1]+'" aria-label="'+o[1]+'" style="background:'+(o[0]||"repeating-linear-gradient(45deg,var(--soft),var(--soft) 4px,var(--surface) 4px,var(--surface) 8px)")+'"></button>'}).join("")}
function fillSet(){sw("bgsw",BG,"bg");sw("inksw",INK,"ink");$("bgc").value=prefs.bg||"#f4f6fa";$("inkc").value=prefs.ink||"#16202e";$("pprev").src=prefs.profile||DEFLOGO;$("tsub").value=prefs.sub;$("tcap").value=prefs.cap;$("tfs").value=prefs.fs}
function setPref(k,v,quiet){var old=prefs[k];prefs[k]=v;if(!savePrefs())prefs[k]=old;applyPrefs();if(!quiet)fillSet()}
function readImg(f,W,H,q,cb){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var h=H||Math.round(W*im.height/im.width),c=document.createElement("canvas");c.width=W;c.height=h;var x=c.getContext("2d"),k=Math.max(W/im.width,h/im.height),w=im.width*k,hh=im.height*k;x.fillStyle="#fff";x.fillRect(0,0,W,h);x.drawImage(im,(W-w)/2,(h-hh)/2,w,hh);cb(c.toDataURL("image/jpeg",q))};im.onerror=function(){toast("That isn\u2019t an image")};im.src=r.result};r.readAsDataURL(f)}
$("custBtn").onclick=function(){fillSet();$("sdlg").querySelector("h2").textContent="Customize \u201c"+(meta.name||"Untitled")+"\u201d";$("sdlg").showModal()};
$("sdone").onclick=function(){$("sdlg").close()};
$("bgsw").onclick=function(e){var b=e.target.closest("button");if(b)setPref("bg",b.dataset.v)};
$("inksw").onclick=function(e){var b=e.target.closest("button");if(b)setPref("ink",b.dataset.v)};
$("bgc").oninput=function(){setPref("bg",this.value,true)};
$("inkc").oninput=function(){setPref("ink",this.value,true)};
$("bgup").onclick=function(){$("bgfile").click()};
$("bgfile").onchange=function(){var f=this.files[0];this.value="";if(f)readImg(f,1600,0,.72,function(u){setPref("bgImg",u)})};
$("bgrm").onclick=function(){setPref("bgImg","")};
$("prup").onclick=function(){$("prfile").click()};
$("prfile").onchange=function(){var f=this.files[0];this.value="";if(f)readImg(f,256,256,.88,function(u){setPref("profile",u)})};
$("prrm").onclick=function(){setPref("profile","")};
$("tsub").oninput=function(){setPref("sub",this.value,true)};
$("tcap").oninput=function(){setPref("cap",this.value,true)};
$("tfs").onchange=function(){setPref("fs",this.value,true)};
$("sreset").onclick=function(){meta.prefs=Object.assign({},PD);prefs=meta.prefs;savePrefs();applyPrefs();fillSet()};
var MAX=200*1024*1024,urls={},attTarget=null,dbp=null;
function db(){return dbp||(dbp=new Promise(function(res,rej){try{var r=indexedDB.open("tc-media",1);r.onupgradeneeded=function(){r.result.createObjectStore("m")};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}}catch(e){rej(e)}}))}
function tx(mode,fn){return db().then(function(d){return new Promise(function(res,rej){var t=d.transaction("m",mode),q=fn(t.objectStore("m"));t.oncomplete=function(){res(q&&q.result)};t.onerror=t.onabort=function(){rej(t.error)}})})}
function dbPut(id,b){return tx("readwrite",function(s){return s.put(b,id)})}
function dbGet(id){return tx("readonly",function(s){return s.get(id)})}
function dbDel(id){return tx("readwrite",function(s){return s.delete(id)})}
function fmt(n){return n>1048576?(n/1048576).toFixed(1)+" MB":Math.max(1,Math.round(n/1024))+" KB"}
function attHtml(b){return'<div class="atts"><button class="btn sm" data-a="attach">Attach image or video</button>'+(b.atts||[]).map(function(x){return'<div class="att" data-aid="'+x.id+'"><div class="thumb" data-a="aview" title="'+esc(x.name)+'"></div><button class="x sm" data-a="adel" aria-label="Remove attachment">\u00d7</button></div>'}).join("")+'</div>'}
function findAtt(id){var s=cur(),r=null;if(s)s.bugs.forEach(function(b){(b.atts||[]).forEach(function(a){if(a.id===id)r=a})});return r}
function urlFor(a){return urls[a.id]?Promise.resolve(urls[a.id]):dbGet(a.id).then(function(b){return b?(urls[a.id]=URL.createObjectURL(b)):null})}
function loadThumbs(){[].forEach.call(document.querySelectorAll("#main [data-aid]"),function(el){var a=findAtt(el.dataset.aid),th=el.querySelector(".thumb");if(!a)return;
 urlFor(a).then(function(u){if(!u){th.textContent="Missing";return}th.innerHTML=a.type.indexOf("video")===0?'<video src="'+u+'" muted preload="metadata"></video><span class="play">\u25b6</span>':'<img src="'+u+'" alt="'+esc(a.name)+'">'}).catch(function(){th.textContent="Missing"})})}
function purgeIds(ids){ids.forEach(function(id){if(urls[id]){URL.revokeObjectURL(urls[id]);delete urls[id]}dbDel(id).catch(function(){})})}
function purge(svcs){var ids=[];svcs.forEach(function(s){s.bugs.forEach(function(b){(b.atts||[]).forEach(function(a){ids.push(a.id)})})});purgeIds(ids)}
async function cloneAtts(svcs){for(var i=0;i<svcs.length;i++)for(var j=0;j<svcs[i].bugs.length;j++){var b=svcs[i].bugs[j],n=[];for(var k=0;k<(b.atts||[]).length;k++){var a=b.atts[k],blob=null;try{blob=await dbGet(a.id)}catch(e){}if(!blob)continue;var id=uid();await dbPut(id,blob);n.push(Object.assign({},a,{id:id}))}b.atts=n}}
async function addFiles(files,bid){var s=cur(),b=s&&s.bugs.filter(function(x){return x.id===bid})[0];if(!b)return;b.atts=b.atts||[];var n=0;
 try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
 for(var i=0;i<files.length;i++){var f=files[i];
  if(!/^(image|video)\//.test(f.type)){toast("Only images and videos can be attached");continue}
  if(f.size>MAX){toast((f.name||"File")+" is larger than 200 MB");continue}
  var id=uid();try{await dbPut(id,f)}catch(e){toast("Couldn\u2019t save "+(f.name||"file")+". Browser storage may be full.");continue}
  b.atts.push({id:id,name:f.name||("pasted-"+Date.now()+".png"),type:f.type,size:f.size});n++}
 if(n){save();renderMain();toast(n+" file"+(n>1?"s":"")+" attached")}}
function openAtt(id){var a=findAtt(id);if(!a)return;urlFor(a).then(function(u){if(!u){toast("This file isn\u2019t in this browser");return}
 $("vbody").innerHTML=a.type.indexOf("video")===0?'<video src="'+u+'" controls autoplay></video>':'<img src="'+u+'" alt="">';$("vname").textContent=a.name+" ("+fmt(a.size)+")";$("vdlg").showModal()})}
$("vclose").onclick=function(){$("vdlg").close()};
$("vdlg").addEventListener("close",function(){$("vbody").innerHTML=""});
$("main").addEventListener("click",function(e){var t=e.target.closest("[data-a]");if(!t)return;var a=t.dataset.a,r=t.closest("[data-bid]"),s=cur();if(!s||!r)return;
 if(a==="attach"){attTarget=r.dataset.bid;$("afile").click()}
 else if(a==="aview"){openAtt(t.closest("[data-aid]").dataset.aid)}
 else if(a==="adel"){var id=t.closest("[data-aid]").dataset.aid,b=s.bugs.filter(function(x){return x.id===r.dataset.bid})[0];b.atts=(b.atts||[]).filter(function(x){return x.id!==id});purgeIds([id]);save();renderMain()}});
$("afile").onchange=function(){var fs=[].slice.call(this.files);this.value="";if(fs.length&&attTarget)addFiles(fs,attTarget)};
$("main").addEventListener("paste",function(e){var r=e.target.closest&&e.target.closest("[data-bid]");if(!r)return;var fs=[].filter.call((e.clipboardData&&e.clipboardData.files)||[],function(f){return/^image\//.test(f.type)});if(fs.length){e.preventDefault();addFiles(fs,r.dataset.bid)}});
$("main").addEventListener("dragover",function(e){if(e.target.closest&&e.target.closest("[data-bid]"))e.preventDefault()});
$("main").addEventListener("drop",function(e){var r=e.target.closest&&e.target.closest("[data-bid]");if(r&&e.dataTransfer.files.length){e.preventDefault();addFiles([].slice.call(e.dataTransfer.files),r.dataset.bid)}});
$("pdup").onclick=async function(){$("pmenu").open=false;var c=JSON.parse(JSON.stringify(meta));c.id=uid();c.rev=0;c.dirty=true;delete c.sig;c.name=(meta.name||"Project")+" (copy)";c.services=JSON.parse(JSON.stringify(data));await cloneAtts(c.services);store.projects.push(c);setActive(c.id);toast("Project duplicated")};
var askCb=null,askNo=null;
function ask(m,ok,cb,no){askCb=cb;askNo=no||null;$("cmsg").textContent=m;$("cok").textContent=ok||"OK";$("cdlg").showModal()}
$("cno").onclick=function(){$("cdlg").close();var f=askNo;askNo=null;if(f)f()};
$("cok").onclick=function(){$("cdlg").close();var f=askCb;askCb=null;askNo=null;if(f)f()};
var SYK="tc-sync-v1",sync={url:"",key:"",on:false,del:[]},syncBusy=false,syncTimer=null,lastErr="",conflicts={};
try{sync=Object.assign(sync,JSON.parse(localStorage.getItem(SYK)||"{}"))}catch(e){}
function saveSync(){try{localStorage.setItem(SYK,JSON.stringify(sync))}catch(e){}}
function setSt(s){$("syncBtn").textContent="Sync: "+s}
function hash(s){var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return h}
function syncPrefs(p){var q=Object.assign({},p.prefs||{});delete q.bgImg;delete q.profile;return q}
function projSig(p){return hash(JSON.stringify([p.name,p.services,syncPrefs(p),p.banner==="default"?1:0]))}
function markDel(id){sync.del=sync.del||[];if(sync.del.indexOf(id)<0)sync.del.push(id);saveSync();sched()}
function api(action,body){
 if(!sync.url)return Promise.reject(new Error("Add the Web App URL first"));
 return fetch(sync.url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(Object.assign({action:action,key:sync.key},body||{}))})
 .then(function(r){return r.json()},function(){throw new Error("Can\u2019t reach the server. Check the URL, that the web app is deployed for \u201cAnyone\u201d, and that this page isn\u2019t inside Claude\u2019s preview.")})
 .then(function(j){if(j.error)throw new Error(j.error);return j})}
function needsPush(){return store.projects.some(function(p){return!conflicts[p.id]&&(p.dirty||!p.rev)})}
function sched(){if(!sync||!sync.on||!sync.url)return;clearTimeout(syncTimer);syncTimer=setTimeout(runSync,1500)}
function stripAtts(s){return JSON.parse(JSON.stringify(s,function(k,v){return k==="atts"?undefined:v}))}
function applyRemote(l,r){var am={};l.services.forEach(function(s){s.bugs.forEach(function(b){if(b.atts&&b.atts.length)am[b.id]=b.atts})});
 r.services.forEach(function(s){fix(s);s.bugs.forEach(function(b){b.atts=am[b.id]||[]})});
 l.name=r.name;l.services=r.services;l.prefs=Object.assign({},PD,l.prefs,r.prefs);
 if(r.banner==="default"){if(!/^data:/.test(l.banner||""))l.banner="default"}else if(l.banner==="default")l.banner="";
 l.rev=r.rev;l.sig=projSig(l);l.dirty=false}
function persist(){try{localStorage.setItem(SK2,JSON.stringify(store));return true}catch(e){return false}}
function refreshUI(){if(!store.projects.length)store.projects.push({id:uid(),name:"My project",banner:"",services:[]});
 if(!store.projects.some(function(p){return p.id===store.active}))store.active=store.projects[0].id;
 bind();persist();if(document.activeElement!==$("proj"))$("proj").value=meta.name;logo();applyPrefs();renderProjects();renderHero();renderAll();if(!$("dash").hidden)$("dashBody").innerHTML=reportBody()}
async function flushDel(){while(sync.del&&sync.del.length){await api("delete",{id:sync.del[0]});sync.del.shift();saveSync()}}
async function pull(){var j=await api("load"),changed=false,skip=sync.del||[];
 (j.deleted||[]).forEach(function(id){var l=store.projects.filter(function(p){return p.id===id})[0];if(l){purge(l.services);store.projects=store.projects.filter(function(p){return p!==l});changed=true}});
 j.projects.forEach(function(r){if(skip.indexOf(r.id)>-1)return;var l=store.projects.filter(function(p){return p.id===r.id})[0];
  if(!l){r.services.forEach(fix);var n={id:r.id,name:r.name,banner:r.banner==="default"?"default":"",prefs:Object.assign({},PD,r.prefs),services:r.services,rev:r.rev,dirty:false};n.sig=projSig(n);store.projects.push(n);changed=true;return}
  if(r.rev>(l.rev||0)){if(l.dirty)conflicts[l.id]=true;else{applyRemote(l,r);changed=true}}});
 if(changed)refreshUI()}
async function push(p){var sg=p.sig,body={project:{id:p.id,name:p.name,banner:p.banner==="default"?"default":"",prefs:syncPrefs(p),services:p.services.map(stripAtts)},baseRev:p.rev||0};
 var j=await api("save",body);
 if(j.conflict){conflicts[p.id]=true;return}
 if(j.deleted){purge(p.services);store.projects=store.projects.filter(function(x){return x!==p});refreshUI();return}
 p.rev=j.rev;if(p.sig===sg)p.dirty=false;persist()}
async function pushAll(){var list=store.projects.slice();for(var i=0;i<list.length;i++){var p=list[i];if(conflicts[p.id]||!(p.dirty||!p.rev))continue;await push(p)}}
async function runSync(){if(!sync.on||!sync.url||syncBusy)return;syncBusy=true;setSt("Syncing\u2026");var ok=true;
 try{await flushDel();await pull();await pushAll();lastErr="";setSt(Object.keys(conflicts).length?"Conflict":"Synced")}catch(e){ok=false;lastErr=e&&e.message||String(e);setSt("Error")}
 syncBusy=false;
 if(Object.keys(conflicts).length&&!$("cdlg").open)resolveNext();else if(ok&&needsPush())sched()}
function resolveNext(){var id=Object.keys(conflicts)[0],p=store.projects.filter(function(x){return x.id===id})[0];if(!p){delete conflicts[id];return}
 ask("\u201c"+(p.name||"Untitled")+"\u201d was changed by someone else. Use their version? (Cancel keeps yours and overwrites theirs.)","Use theirs",
  async function(){try{var j=await api("load"),r=j.projects.filter(function(x){return x.id===id})[0];if(r)applyRemote(p,r);delete conflicts[id];refreshUI();setSt("Synced")}catch(e){lastErr=e.message;setSt("Error")}},
  async function(){try{var j=await api("load"),r=j.projects.filter(function(x){return x.id===id})[0];if(r)p.rev=r.rev;p.dirty=true;delete conflicts[id];persist();sched()}catch(e){lastErr=e.message;setSt("Error")}})}
store.projects.forEach(function(p){if(p.sig===undefined)p.sig=projSig(p)});
$("syncBtn").onclick=function(){$("yurl").value=sync.url;$("ykey").value=sync.key;$("yon").checked=sync.on;$("ymsg").textContent=lastErr?("Last error: "+lastErr):"";$("ydlg").showModal()};
$("yclose").onclick=function(){$("ydlg").close()};
function applyCfg(){sync.url=$("yurl").value.trim();sync.key=$("ykey").value.trim();sync.on=$("yon").checked&&!!sync.url;saveSync();setSt(sync.on?"Synced":"Off")}
$("ytest").onclick=function(){applyCfg();$("ymsg").textContent="Testing...";api("ping").then(function(){$("ymsg").textContent="Connected."}).catch(function(e){$("ymsg").textContent="Failed: "+e.message})};
$("ysave").onclick=function(){applyCfg();$("ymsg").textContent=sync.on?"Sync is on.":"Sync is off.";if(sync.on)runSync()};
setInterval(function(){if(!document.hidden)runSync()},30000);
document.addEventListener("visibilitychange",function(){if(!document.hidden)runSync()});
setSt(sync.on?"Synced":"Off");
renderProjects();renderHero();renderAll();
if(sync.on)runSync();
})();
