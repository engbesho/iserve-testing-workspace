/* Excel workbook adapter. The workbook must be in OneDrive for Business or SharePoint. */
(function (root) {
  "use strict";
  var KEY = "tc-excel-v1";
  var GRAPH = "https://graph.microsoft.com/v1.0";
  var HEADERS = ["RecordKey", "ProjectId", "RecordType", "ParentId", "Position", "Payload"];
  var cfg = {};
  try { cfg = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  var app = null, account = null, token = null, queue = Promise.resolve();

  function config(c) {
    cfg = Object.assign({}, cfg, c || {});
    localStorage.setItem(KEY, JSON.stringify(cfg));
    app = null; token = null;
    return cfg;
  }
  function ready() { return !!(cfg.clientId && cfg.tenantId && cfg.path); }
  function msal() {
    if (!root.msal || !root.msal.PublicClientApplication) throw new Error("Microsoft sign-in library did not load. Open the app from a hosted URL and check your connection.");
    if (!ready()) throw new Error("Enter the Microsoft tenant ID, app client ID, and workbook path first.");
    if (!app) app = new root.msal.PublicClientApplication({auth:{clientId:cfg.clientId,authority:"https://login.microsoftonline.com/"+cfg.tenantId,redirectUri:location.origin},cache:{cacheLocation:"localStorage"}});
    return app;
  }
  async function accessToken(interactive) {
    var a = msal(), accts = a.getAllAccounts();
    account = account || accts[0] || null;
    if (!account && interactive) { var login = await a.loginPopup({scopes:["Files.ReadWrite"]}); account = login.account; }
    if (!account) throw new Error("Sign in with your Microsoft work account first.");
    try { token = (await a.acquireTokenSilent({scopes:["Files.ReadWrite"],account:account})).accessToken; }
    catch (e) { if (!interactive) throw e; token = (await a.acquireTokenPopup({scopes:["Files.ReadWrite"],account:account})).accessToken; }
    return token;
  }
  function workbookBase() {
    var p = String(cfg.path || "").split("/").filter(Boolean).map(encodeURIComponent).join("/");
    return GRAPH + "/me/drive/root:/" + p + ":/workbook";
  }
  async function request(path, method, body, interactive) {
    var t = await accessToken(!!interactive), headers = {Authorization:"Bearer "+t};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    var r = await fetch(path, {method:method || "GET", headers:headers, body:body === undefined ? undefined : JSON.stringify(body)});
    if (r.status === 429) throw new Error("Excel is busy. Wait a moment and try again.");
    if (!r.ok) { var msg = "Microsoft Graph error ("+r.status+")"; try { var j = await r.json(); msg = j.error && j.error.message || msg; } catch (e) {} throw new Error(msg); }
    return r.status === 204 ? null : r.json();
  }
  async function rows() {
    var url = workbookBase()+"/tables/AppData/rows?$top=500", out=[];
    while (url) { var j=await request(url,"GET",undefined,false); out=out.concat(j.value||[]); url=j["@odata.nextLink"]||""; }
    return out;
  }
  function encode(store) {
    var out=[];
    (store.projects||[]).forEach(function(p,pi){
      function add(type,id,parent,pos,payload){out.push({key:p.id+"|"+type+"|"+id,row:[p.id+"|"+type+"|"+id,p.id,type,parent||"",pos,JSON.stringify(payload)]});}
      var prefs=Object.assign({},p.prefs||{}); ["bgImg","profile"].forEach(function(k){if(/^data:/.test(prefs[k]||""))delete prefs[k]});
      add("Project",p.id,"",pi,{name:p.name||"",banner:p.banner==="default"?"default":"",prefs:prefs});
      (p.services||[]).forEach(function(s,si){
        add("Service",s.id,p.id,si,{name:s.name||"",desc:s.desc||"",note:s.note||"",result:s.result||"",done:!!s.done});
        (s.checks||[]).forEach(function(c,i){add("Check",c.id,s.id,i,{text:c.text||"",done:!!c.done});});
        (s.bugs||[]).forEach(function(b,i){add("Bug",b.id,s.id,i,{text:b.text||"",sev:b.sev||"Medium",fixed:!!b.fixed,atts:(b.atts||[]).map(function(a){return{id:a.id,name:a.name,type:a.type,size:a.size,fileUrl:a.fileUrl||""};})});});
        (s.log||[]).forEach(function(n,i){add("Note",n.id,s.id,i,{text:n.text||"",at:Number(n.at)||0});});
      });
    });
    return out;
  }
  function decode(rs) {
    var projects=[], pm={}, sm={}, ordered=rs.map(function(r){return{index:Number(r.index),v:r.values||[]};}).sort(function(a,b){return a.index-b.index;});
    ordered.forEach(function(x){var v=x.v, type=String(v[2]||""), id=String(v[0]||""), pid=String(v[1]||""), obj={};try{obj=JSON.parse(v[5]||"{}");}catch(e){}
      if(type==="Project"){var p={id:pid,name:obj.name||"",banner:obj.banner||"",prefs:obj.prefs||{},services:[]};projects.push(p);pm[pid]=p;}
      else if(type==="Service"){var p0=pm[pid];if(!p0)return;var s={id:id,name:obj.name||"",desc:obj.desc||"",note:obj.note||"",result:obj.result||"",done:!!obj.done,checks:[],bugs:[],log:[]};p0.services.push(s);sm[pid+"|"+id]=s;}
      else {var parent=sm[pid+"|"+String(v[3]||"")];if(!parent)return;
        if(type==="Check")parent.checks.push({id:id,text:obj.text||"",done:!!obj.done});
        if(type==="Bug")parent.bugs.push({id:id,text:obj.text||"",sev:obj.sev||"Medium",fixed:!!obj.fixed,atts:obj.atts||[]});
        if(type==="Note")parent.log.push({id:id,text:obj.text||"",at:Number(obj.at)||0});
      }
    });
    return {projects:projects,active:projects[0]&&projects[0].id||null};
  }
  async function load() { return decode(await rows()); }
  async function saveNow(store) {
    var desired=encode(store), current=await rows(), want={}; desired.forEach(function(x){want[x.key]=x;});
    var existing={}; current.forEach(function(r){var v=r.values||[];existing[String(v[0]||"")]={index:Number(r.index),values:v};});
    var deletes=Object.keys(existing).filter(function(k){return !want[k];}).map(function(k){return existing[k].index;}).sort(function(a,b){return b-a;});
    for(var d=0;d<deletes.length;d++) await request(workbookBase()+"/tables/AppData/rows/"+deletes[d],"DELETE");
    var removed=deletes.slice();
    for(var i=0;i<desired.length;i++){
      var rec=desired[i], old=existing[rec.key];
      if(!old){await request(workbookBase()+"/tables/AppData/rows/add","POST",{index:null,values:[rec.row]});continue;}
      var adjusted=old.index-removed.filter(function(n){return n<old.index;}).length;
      if(JSON.stringify(old.values)!==JSON.stringify(rec.row)) await request(workbookBase()+"/tables/AppData/rows/"+adjusted,"PATCH",{values:rec.row});
    }
  }
  function save(store) { queue=queue.catch(function(){}).then(function(){return saveNow(store);}); return queue; }
  root.ExcelDB={config:config,getConfig:function(){return Object.assign({},cfg);},ready:ready,signIn:function(){return accessToken(true);},load:load,save:save,headers:HEADERS};
})(window);
