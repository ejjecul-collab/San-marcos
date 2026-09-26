(function(){
"use strict";
var Q = window.BANCO;
var $ = function(id){ return document.getElementById(id); };
var KEY = "rsm.v1";

var GRUPOS = [
  {id:"todos", n:"Todo mezclado"},
  {id:"gen",   n:"Generadas \u221e"},
  {id:"mat",   n:"Matemática"},
  {id:"cie",   n:"Ciencias"},
  {id:"hab",   n:"Habilidades"},
  {id:"let",   n:"Lenguaje"},
  {id:"hum",   n:"Humanidades"}
];
var MODOS = [
  {id:"mixto",  n:"Mixto",   d:"Repasos pendientes + preguntas nuevas"},
  {id:"repaso", n:"Repaso",  d:"Solo lo que te toca repasar hoy"},
  {id:"nuevo",  n:"Nuevas",  d:"Solo preguntas que nunca has visto"}
];
var CAUSAS = [
  {id:"teoria",   n:"No sabía la teoría"},
  {id:"calculo",  n:"Error de cálculo"},
  {id:"lectura",  n:"Leí mal el enunciado"},
  {id:"trampa",   n:"Caí en la trampa"},
  {id:"tiempo",   n:"Me apuré"}
];
var INTERVALOS = [1,3,7,21,60];

/* ---------- estado ---------- */
var S = {prog:{}, gen:{}, gerr:[], dias:[], racha:0, ult:""};
function cargar(){
  try{ var r=localStorage.getItem(KEY); if(r){ var o=JSON.parse(r); if(o&&o.prog) S=o; } }catch(e){}
  if(!S.prog) S.prog={}; if(!S.gen) S.gen={}; if(!Array.isArray(S.gerr)) S.gerr=[];
  if(!Array.isArray(S.dias)) S.dias=[];
}
function guardar(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function hoy(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function dias(a,b){
  function p(s){ var x=s.split("-").map(Number); return new Date(x[0],x[1]-1,x[2]).getTime(); }
  return Math.round((p(b)-p(a))/86400000);
}
function reg(i){ return S.prog[i] || null; }
function vence(i){ var r=reg(i); return r ? dias(hoy(), r.prox) <= 0 : false; }

function marcarDia(){
  var h=hoy();
  if(S.ult===h) return;
  S.racha = (S.ult && dias(S.ult,h)===1) ? (S.racha||0)+1 : 1;
  S.ult=h;
  S.dias.push(h); if(S.dias.length>400) S.dias=S.dias.slice(-400);
}

/* ---------- métricas ---------- */
function todos(){ var a=[]; for(var k in S.prog) a.push(S.prog[k]); return a; }
function metricas(){
  var r=todos(), bien=0, seg=0, segMal=0, dudMal=0, dudBien=0;
  r.forEach(function(x){
    if(x.bien) bien++;
    if(x.conf==="seguro"){ seg++; if(!x.bien) segMal++; }
    else { if(x.bien) dudBien++; else dudMal++; }
  });
  var due=0; for(var k in S.prog) if(vence(k)) due++;
  return {n:r.length, bien:bien, pct:r.length?Math.round(bien*100/r.length):0,
          segBien:seg-segMal, segMal:segMal, dudBien:dudBien, dudMal:dudMal, due:due};
}

/* ---------- selección de preguntas ---------- */
function barajar(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
function pool(grupo, modo){
  if(grupo==="gen") return loteGenerado(12);
  var base = Q.filter(function(q){ return grupo==="todos" || q.g===grupo; });
  var due = base.filter(function(q){ return vence(q.i); });
  var nuevas = base.filter(function(q){ return !reg(q.i); });
  if(modo==="repaso") return barajar(due);
  if(modo==="nuevo")  return barajar(nuevas);
  var sel = barajar(due).slice(0,6).concat(barajar(nuevas).slice(0,10));
  if(sel.length<10) sel = sel.concat(barajar(base.filter(function(q){
    return sel.indexOf(q)<0; })).slice(0, 10-sel.length));
  return barajar(sel);
}

/* ---------- generadores ---------- */
function nivelDe(id){ var g=S.gen[id]; return g&&g.nivel?g.nivel:1; }
function nivelMedio(){
  var t=GEN.plantillas, su=0;
  t.forEach(function(x){ su+=nivelDe(x.id); });
  return Math.round(su/t.length*10)/10;
}
function loteGenerado(n){
  var out=[], ts=barajar(GEN.plantillas.slice());
  for(var i=0;i<n;i++){
    var t=ts[i%ts.length];
    var nv=nivelDe(t.id);
    // 15% de las veces cae una muy por encima de tu nivel, a propósito
    if(Math.random()<0.15) nv=Math.min(10, nv+3);
    out.push(GEN.crear(t, nv));
  }
  return out;
}

/* ---------- vistas ---------- */
var VISTAS=["hoy","inicio","ruta","temario","ficha","recall","practica","fin","errores","progreso","cal"];
function ver(v){
  VISTAS.forEach(function(x){ $("v-"+x).classList.toggle("hide", x!==v); });
  document.querySelectorAll("nav button").forEach(function(b){
    b.classList.toggle("on", b.dataset.go===v);
  });
  window.scrollTo(0,0);
  if(v==="hoy") pintarHoy();
  if(v==="temario") pintarTemario();
  if(v==="inicio") pintarInicio();
  if(v==="errores") pintarErrores();
  if(v==="progreso"){ pintarProgreso(); pintarRecursos(); pintarTemas(); }
  if(window.RSM_VISTA && RSM_VISTA[v]) RSM_VISTA[v]();
}
document.querySelectorAll("nav button").forEach(function(b){
  b.addEventListener("click", function(){ ver(b.dataset.go); });
});

/* ---------- v3: hoy, plan y temario ---------- */
var DIAS=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
var DIAC=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
var INTENS=[{id:3,n:"Ligero"},{id:2,n:"Normal"},{id:1,n:"Fuerte"}];
var GNOMBRE={gen:"Generadas \u221e", cie:"Ciencias", hum:"Humanidades", let:"Lenguaje",
  hab:"Habilidades", todos:"Todo mezclado", err:"Cuaderno de errores", sim:"Simulacro"};

function minu(h){ var x=h.split(":"); return +x[0]*60 + +x[1]; }
function dur(a,b){ var m=minu(b)-minu(a); return m>=60 ? (Math.floor(m/60)+"h"+(m%60?" "+(m%60)+"m":"")) : m+"m"; }
function intensidad(){ return S.intens || 2; }
function bloquesEstudio(d){
  return V3.ESTUDIO.filter(function(b){ return b.d===d && b.n>=intensidad(); })
    .sort(function(a,b){ return minu(a.i)-minu(b.i); });
}
function horasSemana(){
  var t=0;
  V3.ESTUDIO.forEach(function(b){ if(b.n>=intensidad()) t+=(minu(b.f)-minu(b.i))/60; });
  return Math.round(t*10)/10;
}
function itemBloque(b, esClase, d){
  var el=document.createElement("li");
  el.className="item";
  var head='<div style="display:flex;justify-content:space-between;gap:10px">'+
    '<b style="font-size:.92rem">'+b.t+'</b>'+
    '<span class="tnum muted">'+b.i+'–'+b.f+'</span></div>';
  el.innerHTML=head+'<span class="muted">'+(esClase? (b.l ? b.l : "Ocupación") : dur(b.i,b.f)+" · "+(GNOMBRE[b.g]||b.g))+'</span>'+
    (b.nota?'<p class="muted">'+b.nota+'</p>':'');
  if(!esClase && b.g!=="err" && b.g!=="sim"){
    var bt=document.createElement("button");
    bt.className="btn"; bt.style.marginTop="10px"; bt.textContent="Empezar este bloque";
    bt.addEventListener("click", function(){ elegido.grupo=b.g; elegido.modo="mixto"; empezar(); });
    el.appendChild(bt);
  }
  if(!esClase && b.g==="err"){
    var b2=document.createElement("button");
    b2.className="btn sec"; b2.style.marginTop="10px"; b2.textContent="Abrir cuaderno de errores";
    b2.addEventListener("click", function(){ ver("errores"); });
    el.appendChild(b2);
  }
  if(!esClase && b.g==="sim"){
    var b3=document.createElement("button");
    b3.className="btn"; b3.style.marginTop="10px"; b3.textContent="Ir al simulacro";
    b3.addEventListener("click", function(){ ver("inicio"); setTimeout(function(){ $("sim-go").scrollIntoView({behavior:"smooth",block:"center"}); },120);});
    el.appendChild(b3);
  }
  return el;
}
function pintarDia(cont, d, titulo){
  cont.textContent="";
  var clases=V3.SENATI.filter(function(b){ return b.d===d; }).sort(function(a,b){ return minu(a.i)-minu(b.i); });
  var est=bloquesEstudio(d);
  if(!clases.length && !est.length){
    cont.innerHTML='<li class="empty">Día libre. Aprovecha: pon un bloque tú mismo.</li>'; return;
  }
  var todos=clases.map(function(c){ return {b:c, clase:true, m:minu(c.i)}; })
    .concat(est.map(function(e){ return {b:e, clase:false, m:minu(e.i)}; }))
    .sort(function(a,b){ return a.m-b.m; });
  todos.forEach(function(x){ cont.appendChild(itemBloque(x.b, x.clase, d)); });
}
function pintarHoy(){
  // cuenta regresiva
  var ex=S.examen;
  $("cd-set").classList.toggle("hide", !!ex);
  $("cd-ver").classList.toggle("hide", !ex);
  if(ex){
    var d=dias(hoy(), ex);
    $("cd-dias").textContent = d<0 ? "Ya pasó" : d+(d===1?" día":" días");
    var sem=Math.ceil(d/7);
    var fase = sem<=6 ? 3 : (sem<=26 ? 2 : 1);
    $("cd-txt").textContent = d<0 ? "Actualiza la fecha del próximo proceso."
      : sem+" semanas · deberías estar en fase "+fase+(fase===3?": solo simulacros y errores":fase===2?": cuerpo del temario":": cimientos");
  }
  poPinta();
  chips($("int-chips"), INTENS, intensidad(), function(id){ S.intens=id; guardar(); pintarHoy(); });
  $("int-txt").textContent = horasSemana()+" horas de estudio a la semana, repartidas en tus horas libres.";
  var d0=new Date().getDay();
  $("hoy-lbl").textContent = DIAS[d0];
  pintarDia($("hoy-lista"), d0);
  var sel = S.diaSem===undefined ? d0 : S.diaSem;
  chips($("sem-dias"), DIAC.map(function(n,i){ return {id:i, n:n}; }), sel, function(id){ S.diaSem=id; pintarHoy(); });
  pintarDia($("sem-lista"), sel);
  pintarAhora();
}
$("cd-ok").addEventListener("click", function(){
  var v=$("cd-fecha").value; if(!v) return;
  S.examen=v; guardar(); pintarHoy();
});
$("cd-edit").addEventListener("click", function(){
  $("cd-fecha").value=S.examen||""; S.examen=null; guardar(); pintarHoy();
});

/* ---------- Ahora: qué toca en este momento ---------- */
function pintarAhora(){
  var ahora=new Date(), d=ahora.getDay(), m=ahora.getHours()*60+ahora.getMinutes();
  var clases=V3.SENATI.filter(function(b){ return b.d===d; });
  var est=bloquesEstudio(d);
  var todos=clases.map(function(b){ return {b:b,c:true}; }).concat(est.map(function(b){ return {b:b,c:false}; }))
    .sort(function(a,b){ return minu(a.b.i)-minu(b.b.i); });
  var enCurso=todos.filter(function(x){ return minu(x.b.i)<=m && m<minu(x.b.f); })[0];
  var sig=todos.filter(function(x){ return minu(x.b.i)>m; })[0];
  var due=0; try{ due=metricas().due||0; }catch(e){}
  var acc=$("ah-acc"); acc.textContent="";
  var barra=$("ah-barra"); barra.classList.add("hide");
  function boton(txt,sec,fn){ var b=document.createElement("button"); b.type="button"; b.className="btn"+(sec?" sec":""); if(sec) b.style.width="auto";
    b.textContent=txt; b.addEventListener("click",fn); acc.appendChild(b); }
  function accionBloque(b){
    if(b.g==="err") boton("Abrir errores",false,function(){ ver("errores"); });
    else if(b.g==="sim") boton("Ir al simulacro",false,function(){ ver("inicio"); setTimeout(function(){ $("sim-go").scrollIntoView({behavior:"smooth",block:"center"}); },120); });
    else boton("Empezar",false,function(){ elegido.grupo=b.g; elegido.modo="mixto"; empezar(); });
  }
  function enMin(x){ var r=minu(x)-m; return r>=60 ? Math.floor(r/60)+" h "+(r%60?r%60+" min":"") : r+" min"; }
  var card=$("ahora"); card.dataset.estado="";
  if(enCurso && enCurso.c){
    card.dataset.estado="clase";
    $("ah-tit").textContent="Ahora · en clase";
    $("ah-que").textContent=enCurso.b.t;
    $("ah-det").textContent="Ocupado hasta las "+enCurso.b.f+(sig?". Luego: "+sig.b.t+" a las "+sig.b.i+".":". Después tienes el resto del día libre.");
  } else if(enCurso){
    card.dataset.estado="toca";
    var ini=minu(enCurso.b.i), fin=minu(enCurso.b.f), q=fin-m;
    $("ah-tit").textContent="Ahora · te toca";
    $("ah-que").textContent=enCurso.b.t;
    $("ah-det").textContent="Quedan "+q+" min del bloque ("+enCurso.b.i+"–"+enCurso.b.f+"). "+(enCurso.b.nota||"");
    barra.classList.remove("hide"); $("ah-barra-i").style.width=Math.round((m-ini)*100/(fin-ini))+"%";
    accionBloque(enCurso.b);
    boton("Pomodoro",true,function(){ var r=$("po-reloj"); r.scrollIntoView({behavior:"smooth",block:"center"}); });
  } else if(sig){
    card.dataset.estado="espera";
    $("ah-tit").textContent="Siguiente · en "+enMin(sig.b.i);
    $("ah-que").textContent=sig.b.t;
    $("ah-det").textContent=(sig.c?"Ocupación":"Bloque de estudio")+" a las "+sig.b.i+"."+
      (due>0&&!sig.c?" Mientras tanto, tienes "+due+(due===1?" repaso pendiente.":" repasos pendientes."):"");
    if(!sig.c) accionBloque(sig.b);
    if(due>0) boton("Repasar errores",!sig.c,function(){ ver("errores"); });
  } else {
    card.dataset.estado="libre";
    var man=(d+1)%7, primero=bloquesEstudio(man)[0];
    $("ah-tit").textContent="Hoy ya terminaste";
    $("ah-que").textContent= due>0 ? due+(due===1?" repaso pendiente":" repasos pendientes") : "Descansa, lo ganaste";
    $("ah-det").textContent= (due>0?"Si te queda energía, 10 minutos de errores rinden más que una hora nueva. ":"")+
      (primero?"Mañana empiezas con "+primero.t+" a las "+primero.i+".":"Mañana no tienes bloques de estudio.");
    if(due>0) boton("Repasar errores",false,function(){ ver("errores"); });
  }
}
setInterval(function(){ if(!document.hidden && $("ahora") && !$("v-hoy").classList.contains("hide")) pintarAhora(); },60000);

/* ---------- Constancia: mapa de días ---------- */
function pintarConstancia(){
  var set={}; (S.dias||[]).forEach(function(x){ set[x]=1; });
  function clave(dt){ return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0"); }
  var hoyD=new Date(); hoyD.setHours(12,0,0,0);
  // racha actual (cuenta desde hoy o ayer hacia atrás)
  var r=0, c=new Date(hoyD); if(!set[clave(c)]) c.setDate(c.getDate()-1);
  while(set[clave(c)]){ r++; c.setDate(c.getDate()-1); }
  // mejor racha
  var ord=Object.keys(set).sort(), mejor=0, run=0, prev=null;
  ord.forEach(function(k){ var t=new Date(k+"T12:00:00"); run = prev && Math.round((t-prev)/864e5)===1 ? run+1 : 1; if(run>mejor) mejor=run; prev=t; });
  var mes=ord.filter(function(k){ return k.slice(0,7)===clave(hoyD).slice(0,7); }).length;
  $("const-nums").innerHTML='<div><b class="tnum">'+r+'</b><span>racha actual</span></div>'+
    '<div><b class="tnum">'+mejor+'</b><span>mejor racha</span></div>'+
    '<div><b class="tnum">'+mes+'</b><span>días este mes</span></div>';
  var h=$("heat"); h.textContent="";
  var ini=new Date(hoyD); ini.setDate(ini.getDate()-ini.getDay()-7*15);
  var total=0;
  for(var i=0;i<16*7;i++){
    var dt=new Date(ini); dt.setDate(ini.getDate()+i);
    var k=clave(dt), q=document.createElement("i");
    if(dt>hoyD) q.className="fut"; else if(set[k]){ q.className="si"; total++; }
    if(k===clave(hoyD)) q.classList.add("hoy");
    q.title=k+(set[k]?" · estudiaste":"");
    h.appendChild(q);
  }
  h.setAttribute("aria-label","Estudiaste "+total+" de los últimos 112 días. Racha actual: "+r+" días.");
}

/* ---------- pomodoro ---------- */
var POMOS=[{id:25,n:"25 / 5"},{id:50,n:"50 / 10"}];
var poMin=25, poRest=25*60, poTick=null, poFase="foco", poCorre=false;
function poPinta(){
  var m=Math.floor(poRest/60), sg=poRest%60;
  $("po-reloj").textContent=m+":"+String(sg).padStart(2,"0");
  $("po-reloj").style.color = poFase==="pausa" ? "var(--ok)" : "";
  var hoyMin=(S.pomo && S.pomo.d===hoy()) ? S.pomo.min : 0;
  var cic=(S.pomo && S.pomo.d===hoy()) ? S.pomo.c : 0;
  $("po-est").textContent = (poFase==="pausa"?"Pausa · ":"Foco · ")+
    hoyMin+" min reales hoy · "+cic+(cic===1?" bloque completado":" bloques completados");
  $("po-go").textContent = poCorre ? "Pausar" : "Iniciar";
  chips($("po-modo"), POMOS, poMin, function(id){ poMin=id; poReset(); });
}
function poReset(){
  poParar(); poFase="foco"; poRest=poMin*60; poPinta();
}
/* --- sonido, vibración, pantalla encendida --- */
var poCtx=null, poProg=[], poFinAt=0, poLock=null;
function poAudio(){
  try{ if(!poCtx){ var A=window.AudioContext||window.webkitAudioContext; if(A) poCtx=new A(); }
       if(poCtx && poCtx.state==="suspended") poCtx.resume(); }catch(e){}
  return poCtx;
}
function poNota(ctx,f,t,d,vol){
  var o=ctx.createOscillator(), g=ctx.createGain();
  o.type="sine"; o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+d+0.05); return o;
}
function poMelodia(tipo,retraso){
  var ctx=poAudio(); if(!ctx || S.poSon===false) return [];
  var t=ctx.currentTime+Math.max(0,retraso||0), out=[];
  // foco terminado: campana ascendente x2 · pausa terminada: dos toques firmes x2
  var notas = tipo==="foco" ? [[659,0],[784,.18],[1047,.36],[659,1.2],[784,1.38],[1047,1.56]]
                            : [[523,0],[523,.22],[523,1.0],[523,1.22]];
  notas.forEach(function(n){ out.push(poNota(ctx,n[0],t+n[1],tipo==="foco"?0.9:0.35,0.35)); });
  return out;
}
function poCancelarSonido(){ poProg.forEach(function(o){ try{ o.stop(); }catch(e){} }); poProg=[]; }
function poVibrar(tipo){
  if(S.poVib===false || !navigator.vibrate) return;
  try{ navigator.vibrate(tipo==="foco" ? [400,150,400,150,800] : [200,100,200]); }catch(e){}
}
function poPantalla(on){
  try{
    if(on && navigator.wakeLock && !poLock){ navigator.wakeLock.request("screen").then(function(l){ poLock=l; l.addEventListener("release",function(){ poLock=null; }); }).catch(function(){}); }
    if(!on && poLock){ poLock.release(); poLock=null; }
  }catch(e){}
}
function poParar(){ clearInterval(poTick); poCorre=false; poCancelarSonido(); poPantalla(false); }
function poAviso(tipo){
  var card=$("po-reloj").closest("article");
  card.classList.remove("po-fin"); void card.offsetWidth; card.classList.add("po-fin");
  var t0=document.title; document.title=(tipo==="foco"?"⏰ Pausa · ":"⏰ A estudiar · ")+t0;
  setTimeout(function(){ document.title=t0; },8000);
}
function poFin(){
  var tipo=poFase;
  if(poFase==="foco"){
    if(!S.pomo || S.pomo.d!==hoy()) S.pomo={d:hoy(), min:0, c:0};
    S.pomo.min+=poMin; S.pomo.c+=1; marcarDia(); guardar();
    poFase="pausa"; poRest=(poMin===25?5:10)*60;
  } else { poFase="foco"; poRest=poMin*60; }
  if(!poProg.length) poMelodia(tipo,0); poProg=[];
  poVibrar(tipo); poAviso(tipo); poPantalla(false);
  poPinta();
}
$("po-go").addEventListener("click", function(){
  if(poCorre){ poParar(); poPinta(); return; }
  poAudio();
  poCorre=true; poFinAt=Date.now()+poRest*1000;
  poProg=poMelodia(poFase, poRest);   // queda agendado aunque el móvil congele el temporizador
  poPantalla(true); poPinta();
  poTick=setInterval(function(){
    poRest=Math.max(0,Math.round((poFinAt-Date.now())/1000));
    if(poRest<=0){ clearInterval(poTick); poCorre=false; poFin(); return; }
    poPinta();
  },500);
});
$("po-reset").addEventListener("click", poReset);
document.addEventListener("visibilitychange", function(){
  if(!document.hidden && poCorre){ poRest=Math.max(0,Math.round((poFinAt-Date.now())/1000)); poPinta(); poPantalla(true); }
});
function poPintaOpc(){
  chips($("po-opc"), [{id:"son",n:(S.poSon===false?"🔇 Sonido":"🔔 Sonido")},{id:"vib",n:(S.poVib===false?"Vibración: no":"Vibración: sí")}],
    (S.poSon===false?"":"son"), function(id){
      if(id==="son") S.poSon=(S.poSon===false); else S.poVib=(S.poVib===false);
      guardar(); poPintaOpc();
    });
  var v=$("po-opc").children[1]; if(v && S.poVib!==false) v.classList.add("on");
}
$("po-probar").addEventListener("click", function(){ poAudio(); poMelodia(poFase,0.05); poVibrar(poFase); });
poPintaOpc();

/* ---------- recuerdo activo (hoja en blanco) ---------- */
var rc=null;
function abrirRecall(id){
  rc={id:id, t:V3.TEMARIO.filter(function(x){ return x.id===id; })[0], f:V4.FICHAS[id]};
  $("rc-curso").textContent=rc.t.c;
  $("rc-tit").textContent=rc.t.n;
  $("rc-txt").value="";
  $("rc-fase1").classList.remove("hide");
  $("rc-fase2").classList.add("hide");
  ver("recall");
}
$("rc-volver").addEventListener("click", function(){ abrirFicha(rc.id, 2); });
$("rc-comparar").addEventListener("click", function(){
  var f=rc.f;
  var puntos = (f.tipo==="comp" ? f.claves : f.herr).slice(0,10);
  var cont=$("rc-check"); cont.textContent="";
  var marcados={};
  puntos.forEach(function(x,i){
    var b=document.createElement("button");
    b.className="item"; b.style.textAlign="left"; b.style.width="100%";
    b.innerHTML='<div style="display:flex;gap:10px;align-items:flex-start">'+
      '<span class="rc-box" style="flex:none;width:20px;height:20px;border-radius:5px;border:1px solid var(--line)"></span>'+
      '<span style="font-size:.88rem">'+x+'</span></div>';
    b.addEventListener("click", function(){
      marcados[i]=!marcados[i];
      var q=b.querySelector(".rc-box");
      q.style.background = marcados[i] ? "var(--ok)" : "transparent";
      b.style.borderColor = marcados[i] ? "var(--ok)" : "var(--line)";
      var n=Object.keys(marcados).filter(function(k){ return marcados[k]; }).length;
      var pct=Math.round(n*100/puntos.length);
      var v=$("rc-nota");
      v.className="verdict "+(pct>=80?"good":pct>=50?"trap":"bad");
      v.innerHTML="Recordaste "+n+" de "+puntos.length+" ("+pct+"%)<p>"+
        (pct>=80?"Sólido. Este tema aguanta.":pct>=50?"A medias. Repite la hoja en blanco mañana.":
         "Todavía no lo tienes. Vuelve a la caja de herramientas y repite esto en dos días.")+"</p>";
      rc.pct=pct;
    });
    cont.appendChild(envLi(b));
  });
  $("rc-nota").className="verdict"; $("rc-nota").innerHTML="Marca lo que recordaste para ver tu puntaje.";
  $("rc-fase1").classList.add("hide");
  $("rc-fase2").classList.remove("hide");
});
$("rc-fin").addEventListener("click", function(){
  if(!S.recall) S.recall={};
  S.recall[rc.id]={pct:rc.pct||0, fecha:hoy(), txt:($("rc-txt").value||"").slice(0,800)};
  guardar(); abrirFicha(rc.id, 2);
});

/* ---------- temario ---------- */
function dominado(id){ return !!(S.temas && S.temas[id]); }
function pintarTemario(){
  if(!S.temas) S.temas={};
  var tot=V3.TEMARIO.length, hechos=V3.TEMARIO.filter(function(t){ return dominado(t.id); }).length;
  $("tm-pct").textContent=Math.round(hechos*100/tot)+"%";
  var nf=0; V3.TEMARIO.forEach(function(t){ if(V4.FICHAS[t.id]) nf++; });
  $("tm-sub").textContent=hechos+" de "+tot+" temas marcados · "+nf+" con clase escrita. Marca uno solo cuando resuelvas 8 de 10 sin mirar.";
  var cont=$("tm-lista"); cont.textContent="";
  var AREAS=[
    {n:"Razonamiento",d:"La mitad del puntaje sale de aquí.",c:["HLM","Habilidad Verbal"]},
    {n:"Matemática",d:"Aritmética, álgebra, geometría y trigonometría.",c:["Aritmética","Álgebra","Geometría","Trigonometría"]},
    {n:"Ciencias",d:"Física, química y biología.",c:["Física","Química","Biología"]},
    {n:"Comunicación",d:"Lenguaje y literatura.",c:["Lenguaje","Literatura"]},
    {n:"Humanidades",d:"Historia, sociedad y pensamiento.",c:["Historia","Geografía","Economía","Educación Cívica","Filosofía","Psicología"]}];
  var todos=[]; V3.TEMARIO.forEach(function(t){ if(todos.indexOf(t.c)<0) todos.push(t.c); });
  var usados=[]; AREAS.forEach(function(a){ usados=usados.concat(a.c); });
  var resto=todos.filter(function(c){ return usados.indexOf(c)<0; });
  if(resto.length) AREAS.push({n:"Otros",d:"",c:resto});
  if(!window.TM_ABIERTO) window.TM_ABIERTO={};
  AREAS.forEach(function(A){
    var cursos=A.c.filter(function(c){ return todos.indexOf(c)>=0; }); if(!cursos.length) return;
    var temasA=V3.TEMARIO.filter(function(t){ return cursos.indexOf(t.c)>=0; });
    var okA=temasA.filter(function(t){ return dominado(t.id); }).length, pA=Math.round(okA*100/temasA.length);
    var area=document.createElement("div"); area.className="area";
    area.innerHTML='<header class="area-cab"><div><h3>'+A.n+'</h3><p class="muted">'+A.d+'</p></div>'+
      '<span class="area-num tnum">'+okA+'<small>/'+temasA.length+'</small></span>'+
      '<div class="prog area-prog"><i style="width:'+pA+'%"></i></div></header>';
    var grid=document.createElement("div"); grid.className="area-grid"; area.appendChild(grid); cont.appendChild(area);
  cursos.forEach(function(c){
    var lista=V3.TEMARIO.filter(function(t){ return t.c===c; });
    var ok=lista.filter(function(t){ return dominado(t.id); }).length;
    var card=document.createElement("article");
    card.className="card curso";
    var det=document.createElement("details"); det.open=!!window.TM_ABIERTO[c];
    det.addEventListener("toggle",function(){ window.TM_ABIERTO[c]=det.open; });
    var pc=Math.round(ok*100/lista.length);
    det.innerHTML='<summary><h4 class="lbl">'+c+'</h4><span class="muted tnum">'+ok+'/'+lista.length+'</span>'+
      '<span class="chev" aria-hidden="true"></span><div class="prog curso-prog"><i style="width:'+pc+'%"></i></div></summary>';
    card.appendChild(det);
    var ul=document.createElement("ul"); ul.className="list"; ul.style.marginTop="10px";
    lista.forEach(function(t){
      var falta=t.p.filter(function(p){ return !dominado(p); });
      var b=document.createElement("button");
      b.className="item"; b.style.textAlign="left"; b.style.width="100%";
      b.style.borderColor = dominado(t.id) ? "var(--ok)" : "var(--line)";
      b.innerHTML='<div style="display:flex;gap:10px;align-items:flex-start">'+
        '<span style="flex:none;width:22px;height:22px;border-radius:6px;border:1px solid '+
        (dominado(t.id)?"var(--ok);background:var(--ok)":"var(--line)")+'"></span>'+
        '<span><b style="font-size:.9rem;font-weight:600">'+t.n+'</b>'+
        (falta.length?'<span class="muted" style="display:block;font-size:.76rem">Antes: '+
          falta.map(function(f){ var o=V3.TEMARIO.filter(function(x){return x.id===f;})[0]; return o?o.n:f; }).join(", ")+'</span>':'')+
        '</span></div>';
      if(V4.FICHAS[t.id]){
        b.innerHTML = b.innerHTML.replace("</span></div>",
          '<span class="muted" style="display:block;font-size:.74rem;color:var(--brand)">Clase disponible \u2192</span></span></div>');
      }
      b.addEventListener("click", function(){
        if(V4.FICHAS[t.id]) abrirFicha(t.id);
        else { S.temas[t.id]=!dominado(t.id); guardar(); pintarTemario(); }
      });
      ul.appendChild(envLi(b));
    });
    det.appendChild(ul);
    grid.appendChild(card);
  });
  });
}
$("buscar").addEventListener("input", function(){
  var q=this.value.trim().toLowerCase();
  var res=$("tm-res"), lista=$("tm-res-lista");
  if(q.length<3){ res.classList.add("hide"); $("tm-lista").classList.remove("hide"); return; }
  res.classList.remove("hide"); $("tm-lista").classList.add("hide");
  lista.textContent="";
  var temas=V3.TEMARIO.filter(function(t){ return (t.n+" "+t.c).toLowerCase().indexOf(q)>=0; }).slice(0,8);
  var preg=Q.filter(function(x){ return x.q.toLowerCase().indexOf(q)>=0; }).slice(0,15);
  if(!temas.length && !preg.length){
    lista.innerHTML='<li class="empty">Sin resultados para “'+q+'”.</li>'; return;
  }
  temas.forEach(function(t){
    var el=document.createElement("li"); el.className="item";
    el.innerHTML='<span class="muted">Tema · '+t.c+'</span><p><b>'+t.n+'</b></p>';
    lista.appendChild(el);
  });
  preg.forEach(function(x){
    var el=document.createElement("li"); el.className="item";
    el.innerHTML='<span class="muted">Pregunta · '+x.c+'</span><p></p><p class="muted"></p>';
    el.querySelectorAll("p")[0].textContent=x.q.slice(0,180)+(x.q.length>180?"…":"");
    el.querySelectorAll("p")[1].textContent="Clave "+x.k+": "+String(x.a[x.k]).slice(0,70);
    lista.appendChild(el);
  });
});

/* ---------- fichas de clase (v4) ---------- */
var fic=null, fpaso=0;
function abrirFicha(id, paso){
  fic={id:id, t:V3.TEMARIO.filter(function(x){ return x.id===id; })[0], f:V4.FICHAS[id], gen:null};
  fpaso = (paso===undefined ? 0 : paso); ver("ficha"); pintarFicha();
}
$("fi-volver").addEventListener("click", function(){ ver("temario"); });
$("fi-atras").addEventListener("click", function(){ if(fpaso>0){ fpaso--; pintarFicha(); } else ver("temario"); });
$("fi-sig").addEventListener("click", function(){ if(fpaso<4){ fpaso++; pintarFicha(); window.scrollTo(0,0); } });

function ul(arr, cls){
  return '<ul style="margin:8px 0 0;padding-left:18px;line-height:1.6">'+
    arr.map(function(x){ return '<li style="margin-bottom:6px" class="'+(cls||'')+'">'+x+'</li>'; }).join("")+'</ul>';
}
function pintarFicha(){
  var f=fic.f, t=fic.t, c=$("fi-cuerpo");
  var nombres=["Pregunta de entrada","La idea base",
    f.tipo==="comp"?"El relato y las claves":"Caja de herramientas",
    f.tipo==="comp"?"Perspectivas":"Yo lo hago, lo hacemos, lo haces","Cierre"];
  $("fi-curso").textContent=t.c;
  $("fi-tit").textContent=t.n;
  $("fi-paso").textContent=(fpaso+1)+" / 5 · "+nombres[fpaso];
  $("fi-prog").style.width=((fpaso+1)*20)+"%";
  $("fi-sig").textContent = fpaso===4 ? "Terminado" : "Siguiente";
  $("fi-sig").disabled = fpaso===4;
  c.textContent="";
  var h="";

  if(fpaso===0){
    h='<p class="qtext">'+f.entrada+'</p>'+
      '<p class="muted">No la resuelvas todavía. Vuelve a ella en el paso 5 y compara.</p>';
  }
  if(fpaso===1){
    h='<p class="qtext" style="font-size:.98rem">'+f.idea+'</p>';
  }
  if(fpaso===2){
    if(f.tipo==="comp"){
      h='<p class="qtext" style="font-size:.96rem">'+f.relato+'</p>'+
        '<p class="lbl" style="margin-top:14px">Fechas y hechos clave</p>'+ul(f.claves,"muted");
    } else {
      h='<p class="lbl">Fórmulas y reglas</p>'+ul(f.herr)+
        '<p class="lbl" style="margin-top:14px">Cuando veas esto, usa aquello</p>'+ul(f.patrones)+
        '<p class="lbl" style="margin-top:14px">Errores que comete todo el mundo</p>'+ul(f.errores,"muted");
    }
  }
  if(fpaso===3){
    if(f.tipo==="comp"){
      h='<p class="lbl">Cómo lo discuten los historiadores</p>'+ul(f.perspectivas)+
        '<p class="lbl" style="margin-top:14px">Preguntas que debes poder responder</p>'+ul(f.preguntas,"muted")+
        '<p class="muted" style="margin-top:12px">Si no puedes responderlas en voz alta con tus palabras, todavía no lo sabes.</p>';
    } else {
      h='';
      f.ej.forEach(function(e){
        h+='<p class="lbl" style="margin-top:14px">'+e.t+'</p><p class="qtext" style="font-size:.95rem;margin:6px 0">'+e.q+'</p>'+
           '<div class="sol">'+e.pasos.map(function(x,i){ return (i+1)+". "+x; }).join("\n")+'</div>';
      });
      h+='<p class="lbl" style="margin-top:16px">Lo haces</p>';
    }
  }
  if(fpaso===4){
    h='<p class="lbl">Volvamos a la pregunta del inicio</p>'+
      '<p class="qtext" style="font-size:.95rem">'+f.entrada+'</p>'+
      '<div class="sol">'+f.cierre+'</div>'+
      '<p class="lbl" style="margin-top:16px">Pregunta que te harías en el examen</p>'+
      '<textarea id="fi-preg" style="width:100%;margin-top:6px;min-height:52px;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit;font-size:.9rem" placeholder="Escribe una pregunta cuya respuesta sea este tema."></textarea>'+
      '<p class="lbl" style="margin-top:14px">Escribe el método con tus palabras</p>'+
      '<textarea id="fi-nota" style="width:100%;margin-top:6px;min-height:80px;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit;font-size:.9rem" placeholder="En una o dos líneas: ¿cómo se resuelve este tipo de problema?"></textarea>';
  }
  c.innerHTML=h;

  if(fpaso===2){
    var rb=document.createElement("button");
    rb.className="btn sec"; rb.style.marginTop="14px";
    var prev=S.recall && S.recall[fic.id];
    rb.textContent = prev ? "Hoja en blanco (última vez: "+prev.pct+"%)" : "Hoja en blanco: ciérralo y recuerda";
    rb.addEventListener("click", function(){ abrirRecall(fic.id); });
    c.appendChild(rb);
  }
  if(fpaso===3){
    if(f.tpl){
      var bt=document.createElement("button");
      bt.className="btn"; bt.textContent="Resolver una generada de este tema";
      bt.addEventListener("click", function(){
        var tpl=GEN.plantillas.filter(function(x){ return x.id===f.tpl; })[0];
        if(!tpl) return;
        ses={lista:[GEN.crear(tpl, nivelDe(tpl.id))], k:0, bien:0, hechas:[], t:Date.now(), vuelta:fic.id};
        ver("practica"); reloj(); mostrar();
      });
      c.appendChild(bt);
    } else if(f.tipo!=="comp"){
      var p2=document.createElement("p");
      p2.className="muted"; p2.textContent="Este tema no tiene generador todavía. Practícalo desde el banco.";
      c.appendChild(p2);
    }
  }
  if(fpaso===4){
    if(!S.notas) S.notas={};
    var ta=$("fi-nota");
    ta.value=S.notas[fic.id]||"";
    ta.addEventListener("input", function(){ S.notas[fic.id]=ta.value.slice(0,500); guardar(); });
    if(!S.preg) S.preg={};
    var tp=$("fi-preg");
    tp.value=S.preg[fic.id]||"";
    tp.addEventListener("input", function(){ S.preg[fic.id]=tp.value.slice(0,300); guardar(); });
    var ok=document.createElement("button");
    ok.className="btn"; ok.style.marginTop="12px";
    ok.textContent = dominado(fic.id) ? "Quitar de dominados" : "Marcar tema como dominado";
    ok.addEventListener("click", function(){
      S.temas[fic.id]=!dominado(fic.id); guardar(); ver("temario");
    });
    c.appendChild(ok);
    var av=document.createElement("p");
    av.className="muted"; av.style.marginTop="8px";
    av.textContent="Márcalo solo cuando resuelvas 8 de 10 sin mirar la caja de herramientas.";
    c.appendChild(av);
  }
}

/* ---------- recursos ---------- */
function pintarRecursos(){
  function llenar(id, arr, link){
    var c=$(id); c.textContent="";
    arr.forEach(function(x){
      var dl=c.tagName==="DL";
      var el=document.createElement(link?"a":"div");
      el.className="item";
      if(link){ el.href=x.u; el.target="_blank"; el.rel="noreferrer"; el.style.display="block"; el.style.color="inherit"; el.style.textDecoration="none"; }
      el.innerHTML=(dl?'<dt style="font-weight:700;font-size:.9rem">'+x.t+'</dt><dd class="muted" style="margin:4px 0 0">'+x.d+'</dd>':'<b style="font-size:.9rem">'+(x.t)+'</b><p class="muted">'+(x.d)+'</p>')+
        (x.g?'<span class="muted" style="font-size:.72rem">'+x.g+'</span>':'');
      c.appendChild(dl?el:envLi(el));
    });
  }
  // retorno por curso: peso en el examen x lo que te falta
  var PESO={"Habilidad Verbal":15,"HLM":15,"Aritmética":6,"Álgebra":7,"Geometría":6,"Trigonometría":5,
    "Física":8,"Química":7,"Biología":5,"Lenguaje":6,"Literatura":4,"Historia":5,"Geografía":4,
    "Economía":3,"Educación Cívica":3,"Filosofía":3,"Psicología":3};
  var datos={};
  for(var k in S.prog){ var r=S.prog[k], cu=r.curso||"?";
    datos[cu]=datos[cu]||{n:0,b:0}; datos[cu].n++; if(r.bien) datos[cu].b++; }
  for(var tid in S.gen){ var g=S.gen[tid]; if(!g.curso) continue;
    datos[g.curso]=datos[g.curso]||{n:0,b:0}; datos[g.curso].n+=g.int; datos[g.curso].b+=g.ac; }
  var filas=[];
  for(var cu2 in PESO){
    var d=datos[cu2], peso=PESO[cu2];
    var acierto = d && d.n>=3 ? d.b/d.n : null;
    var ganancia = acierto===null ? null : Math.round(peso*(1-acierto)*20);
    filas.push({c:cu2, peso:peso, ac:acierto, g:ganancia, n:d?d.n:0});
  }
  filas.sort(function(a,b){
    if(a.g===null && b.g===null) return b.peso-a.peso;
    if(a.g===null) return 1; if(b.g===null) return -1;
    return b.g-a.g;
  });
  var rc2=$("roi"); rc2.textContent="";
  filas.slice(0,8).forEach(function(f){
    var el=document.createElement("li"); el.className="item";
    el.innerHTML='<div style="display:flex;justify-content:space-between;gap:10px">'+
      '<b style="font-size:.9rem">'+f.c+'</b><span class="tnum" style="color:'+(f.g&&f.g>=100?"var(--brand)":"var(--muted)")+'">'+
      (f.g===null?"sin datos":"+"+f.g+" pts")+'</span></div>'+
      '<span class="muted" style="font-size:.76rem">~'+f.peso+' preguntas · '+
      (f.ac===null?"practica al menos 3 para estimar":"aciertas el "+Math.round(f.ac*100)+"%")+'</span>';
    rc2.appendChild(el);
  });

  llenar("metodos", [
    {t:"Recuperación activa · sirve", d:"Cerrar el material y reconstruir de memoria. Es lo mejor que existe. En la app: la Hoja en blanco, dentro de cada clase."},
    {t:"Repetición espaciada (Leitner) · sirve", d:"Tarjetas que avanzan al acertar y vuelven al fallar. En la app: el cuaderno de errores ya funciona así, con cajas de 1, 3, 7, 21 y 60 días."},
    {t:"Práctica intercalada · sirve", d:"Mezclar temas obliga a decidir qué método usar, que es la habilidad real del examen. En la app: el grupo Todo mezclado."},
    {t:"Feynman y autoexplicación · sirve", d:"Explicarlo con tus palabras expone los huecos. En la app: el paso 5 de cada clase."},
    {t:"Cornell · sirve a medias", d:"Lo valioso no es el formato, es la columna de preguntas. En la app: escribes tu propia pregunta de examen en el cierre."},
    {t:"Pomodoro · sirve para empezar", d:"No mejora la memoria; mejora que te sientes a estudiar. En la app: arriba en Hoy."},
    {t:"Palacio mental y mapas mentales · limitado", d:"Solo para listas arbitrarias: fechas, clasificaciones, taxonomías. Para matemáticas es perder el tiempo."},
    {t:"Subrayar, releer y anotación marginal · rinde poco", d:"Se siente productivo y deja poco rastro. Cámbialo por recuperar."},
    {t:"Lectura al revés · sin evidencia", d:"Empezar un libro por el último capítulo no mejora nada. Es contenido viral, no un método."},
    {t:"No abandones cursos · sirve", d:"Mejorar un curso donde ya aciertas el 80% rinde mucho menos que uno donde aciertas el 30%. Mira el panel de arriba."},
    {t:"Dormir · no es opcional", d:"La memoria se consolida durmiendo. Estudiar hasta tarde borra parte de lo que acabas de estudiar."}
  ], false);
  llenar("estrategia", V3.ESTRATEGIA, false);
  llenar("libros", V3.LIBROS, false);
  llenar("canales", V3.OFICIAL.concat(V3.CANALES), true);
}

/* ---------- inicio ---------- */
var elegido={grupo:"todos", modo:"mixto"};
function chips(cont, items, activo, cb){
  cont.textContent="";
  items.forEach(function(it){
    var b=document.createElement("button");
    b.className="chip"+(it.id===activo?" on":"");
    b.type="button";
    b.innerHTML = it.n + (it.extra?' <small>'+it.extra+'</small>':'');
    b.addEventListener("click", function(){ cb(it.id); });
    cont.appendChild(b);
  });
}
function pintarInicio(){
  var m=metricas();
  $("s-total").textContent=m.n;
  $("s-pct").textContent = m.n ? m.pct+"%" : "—";
  $("s-racha").textContent=S.racha||0;
  $("s-due").textContent=m.due;

  var gs=GRUPOS.map(function(g){
    if(g.id==="gen") return {id:g.id,n:g.n,extra:GEN.plantillas.length+" tipos"};
    var n=Q.filter(function(q){ return g.id==="todos"||q.g===g.id; }).length;
    return {id:g.id,n:g.n,extra:n};
  });
  chips($("pick-grupo"), gs, elegido.grupo, function(id){ elegido.grupo=id; pintarInicio(); });
  chips($("pick-modo"), MODOS, elegido.modo, function(id){ elegido.modo=id; pintarInicio(); });
  var esGen = elegido.grupo==="gen";
  $("pick-modo").classList.toggle("hide", esGen);
  if(esGen){
    $("pick-info").textContent = "Preguntas nuevas cada vez, con números distintos. Nivel medio "+nivelMedio()+" de 10. Nunca se acaban.";
    $("go").disabled=false;
  } else {
    var p=pool(elegido.grupo, elegido.modo);
    var modo=MODOS.filter(function(x){return x.id===elegido.modo;})[0];
    $("pick-info").textContent = modo.d + " · " + p.length + " disponibles";
    $("go").disabled = p.length===0;
  }

  var mm=$("matriz"); mm.textContent="";
  [["Seguro y bien",m.segBien,"best"],["Seguro y mal",m.segMal,"danger"],
   ["Dudaba y bien",m.dudBien,""],["Dudaba y mal",m.dudMal,""]].forEach(function(x){
    var d=document.createElement("div");
    d.className="qbox "+(x[2]||"");
    d.innerHTML="<b class='tnum'>"+x[1]+"</b><span>"+x[0]+"</span>";
    mm.appendChild(d);
  });
  var msg="Responde unas cuantas y aquí aparece tu punto ciego.";
  if(m.n>=8){
    var tasa=Math.round(m.segMal*100/Math.max(1,m.segMal+m.segBien));
    if(m.segMal===0) msg="Cuando dices que estás seguro, aciertas. Esa confianza vale.";
    else if(tasa>=25) msg="De lo que marcas como seguro, fallas el "+tasa+"%. Ese es tu mayor riesgo: no sabes lo que no sabes.";
    else msg="Fallas el "+tasa+"% de lo que crees dominar. Vigila esas.";
    if(m.dudBien>m.segBien) msg+=" Y aciertas mucho dudando: sabes más de lo que crees.";
  }
  $("cal-msg").textContent=msg;

  var cursos={};
  Q.forEach(function(q){ cursos[q.c]=(cursos[q.c]||0)+1; });
  var rr=$("resumen"); rr.textContent="";
  Object.keys(cursos).sort(function(a,b){ return cursos[b]-cursos[a]; }).forEach(function(c){
    var s=document.createElement("span");
    s.className="chip"; s.style.pointerEvents="none";
    s.innerHTML=c+" <small>"+cursos[c]+"</small>";
    rr.appendChild(s);
  });
}

/* ---------- simulacro ---------- */
var SIMS=[{id:20,n:"20 preguntas · 36 min"},{id:50,n:"50 · 90 min"},{id:100,n:"100 · 3 horas"}];
var simN=20;
function pintarSim(){ chips($("sim-chips"), SIMS, simN, function(id){ simN=id; pintarSim(); }); }
function mezclaExamen(n){
  var pesos={hab:.30, mat:.22, cie:.22, let:.13, hum:.13};
  var out=[];
  for(var g in pesos){
    var k=Math.round(n*pesos[g]);
    if(g==="mat"){ out=out.concat(loteGenerado(k)); continue; }
    var b=barajar(Q.filter(function(q){ return q.g===g; })).slice(0,k);
    out=out.concat(b);
  }
  while(out.length<n) out.push(barajar(Q.slice())[0]);
  return barajar(out).slice(0,n);
}
$("sim-go").addEventListener("click", function(){
  ses={lista:mezclaExamen(simN), k:0, bien:0, mal:0, blanco:0, hechas:[], t:Date.now(),
       examen:true, limite:Math.round(simN*1.8*60000)};
  ver("practica"); reloj(); mostrar();
});

/* ---------- sesión ---------- */
var ses=null, t0=0, tick=null;
function empezar(){
  var p=pool(elegido.grupo, elegido.modo).slice(0,12);
  if(!p.length) return;
  ses={lista:p, k:0, bien:0, hechas:[], t:Date.now()};
  ver("practica");
  reloj();
  mostrar();
}
function reloj(){
  clearInterval(tick);
  var pintar=function(){
    if(!ses) return;
    if(ses.examen){
      var rest=Math.max(0, ses.limite-(Date.now()-ses.t));
      var ss=Math.floor(rest/1000);
      $("reloj").textContent="⏳ "+Math.floor(ss/60)+":"+String(ss%60).padStart(2,"0");
      $("reloj").style.color = ss<120 ? "var(--bad)" : "";
      if(rest<=0) return terminar();
    } else {
      var s=Math.floor((Date.now()-ses.t)/1000);
      $("reloj").textContent=Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
    }
  };
  pintar();
  tick=setInterval(pintar,1000);
}
var sel=null, conf=null;
var CONF=[{id:"seguro",n:"Seguro"},{id:"dudo",n:"Dudo"},{id:"adivino",n:"Adivino"}];
function pintarConf(){
  if(ses.examen){
    $("paso-conf").classList.add("hide"); $("paso-rev").classList.add("hide");
    $("paso-why").classList.add("hide");
    var sk=document.createElement("button");
  }
  chips($("conf-chips"), CONF, conf, function(id){
    conf=id; pintarConf(); $("check").disabled=!sel;
  });
}
function mostrar(){
  var q=ses.lista[ses.k];
  sel=null; conf=null; t0=Date.now();
  $("cont").textContent=(ses.k+1)+" / "+ses.lista.length;
  $("prog-i").style.width=(ses.k/ses.lista.length*100)+"%";
  $("q-curso").textContent = q.gen ? (q.c+" · nivel "+q.nivel) : q.c;
  $("q-text").textContent=q.q;

  var box=$("q-alts"); box.textContent="";
  Object.keys(q.a).sort().forEach(function(k){
    var b=document.createElement("button");
    b.className="alt"; b.type="button"; b.dataset.k=k;
    b.innerHTML='<span class="k">'+k+'</span><span>'+q.a[k]+'</span>';
    b.addEventListener("click", function(){
      if(b.disabled) return;
      sel=k;
      box.querySelectorAll(".alt").forEach(function(x){ x.classList.toggle("sel", x.dataset.k===k); });
      if(ses.examen){ responderExamen(k); return; }
      $("paso-conf").classList.remove("hide");
      $("check").disabled = !conf;
    });
    box.appendChild(b);
  });

  pintarConf();
  $("paso-conf").classList.add("hide");
  $("paso-rev").classList.add("hide");
  $("paso-why").classList.toggle("hide", !(q.g==="hum"||q.g==="let"));
  $("why-txt").value="";
  $("check").disabled=true;
}

$("check").addEventListener("click", function(){
  var q=ses.lista[ses.k];
  var bien = sel===q.k;
  var seg = Date.now()-t0;
  if(q.gen) return revisarGenerada(q, bien, seg);
  var r = reg(q.i) || {caja:0};
  r.bien=bien; r.conf=conf; r.fecha=hoy(); r.curso=q.c; r.grupo=q.g;
  r.seg=Math.round(seg/1000);
  if(bien && conf==="seguro") r.caja=Math.min(4,(r.caja||0)+1);
  else if(bien) r.caja=Math.min(2,(r.caja||0)+1);
  else r.caja=0;
  var d=new Date(); d.setDate(d.getDate()+INTERVALOS[r.caja]);
  r.prox=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  if($("why-txt").value.trim()) r.razon=$("why-txt").value.trim().slice(0,300);
  if(bien) delete r.causa;
  S.prog[q.i]=r;
  marcarDia(); guardar();

  if(bien) ses.bien++;
  ses.hechas.push({i:q.i, bien:bien, conf:conf});

  $("q-alts").querySelectorAll(".alt").forEach(function(b){
    b.disabled=true;
    if(b.dataset.k===q.k) b.classList.add("ok");
    else if(b.dataset.k===sel) b.classList.add("no");
    b.classList.remove("sel");
  });
  $("paso-conf").classList.add("hide");
  $("paso-rev").classList.remove("hide");

  var v=$("verdict");
  if(bien && conf==="seguro"){ v.className="verdict good"; v.innerHTML="Correcta, y lo sabías.<p>Vuelve en "+INTERVALOS[r.caja]+" días.</p>"; }
  else if(bien){ v.className="verdict good"; v.innerHTML="Correcta, pero dudabas.<p>Aún no está firme. Vuelve en "+INTERVALOS[r.caja]+" días.</p>"; }
  else if(conf==="seguro"){ v.className="verdict trap"; v.innerHTML="Incorrecta, y estabas seguro.<p>Este es el error más caro que existe. Lee la solución con calma.</p>"; }
  else { v.className="verdict bad"; v.innerHTML="Incorrecta.<p>La respuesta era "+q.k+". Vuelve mañana.</p>"; }
  $("sol").textContent=q.s || "Sin solución en el material.";

  $("causa-box").classList.toggle("hide", bien);
  if(!bien){
    var pintarCausa = function(){
      chips($("causa-chips"), CAUSAS, r.causa, function(id){
        r.causa=id; S.prog[q.i]=r; guardar(); pintarCausa();
      });
    };
    pintarCausa();
  }
  window.scrollTo({top:document.body.scrollHeight, behavior:"smooth"});
});

$("next").addEventListener("click", function(){
  if(ses.vuelta && ses.k+1>=ses.lista.length){ var id=ses.vuelta; clearInterval(tick); ses=null; abrirFicha(id, 3); return; }
  ses.k++;
  if(ses.k>=ses.lista.length) return terminar();
  mostrar(); window.scrollTo(0,0);
});
$("salir").addEventListener("click", function(){ if(ses && ses.k>0) terminar(); else { clearInterval(tick); ses=null; ver("inicio"); } });

function terminar(){
  clearInterval(tick);
  if(ses && ses.examen) return terminarExamen();
  var n=ses.hechas.length, bien=ses.bien;
  var pct=n?Math.round(bien*100/n):0;
  var segMal=ses.hechas.filter(function(x){ return !x.bien && x.conf==="seguro"; }).length;
  var dudBien=ses.hechas.filter(function(x){ return x.bien && x.conf!=="seguro"; }).length;
  var mins=Math.max(1,Math.round((Date.now()-ses.t)/60000));
  $("f-pct").textContent=pct+"%";
  $("f-linea").textContent=bien+" de "+n+" · "+mins+" min";
  var g=$("f-grid"); g.textContent="";
  [["Seguro y mal",segMal,segMal?"danger":""],["Acertaste dudando",dudBien,""]].forEach(function(x){
    var d=document.createElement("div"); d.className="qbox "+(x[2]||"");
    d.innerHTML="<b class='tnum'>"+x[1]+"</b><span>"+x[0]+"</span>"; g.appendChild(d);
  });
  var c;
  if(segMal>=2) c="Tienes "+segMal+" errores con confianza alta. Antes de seguir avanzando, vuelve a esos temas: ahí es donde se pierde el examen.";
  else if(pct>=85) c="Buen resultado. Sube la dificultad o cambia de curso: practicar lo que ya dominas no te suma.";
  else if(pct>=60) c="Zona correcta para aprender. Sigue así y respeta los repasos.";
  else c="Muchos fallos. No es mala señal si son temas nuevos: revisa las soluciones antes de volver.";
  $("f-consejo").textContent=c;
  ses=null;
  ver("fin");
}
function terminarExamen(){
  var n=ses.lista.length, bien=ses.bien, mal=ses.mal, blanco=n-bien-mal;
  var punt=Math.round((bien*20 - mal*1.125)*100)/100;
  var sobre=n*20;
  var mins=Math.max(1,Math.round((Date.now()-ses.t)/60000));
  $("f-pct").textContent=punt+" pts";
  $("f-linea").textContent="de "+sobre+" posibles · "+bien+" bien, "+mal+" mal, "+blanco+" sin responder · "+mins+" min";
  var g=$("f-grid"); g.textContent="";
  var proy=Math.round(punt/n*100);
  [["Acierto",Math.round(bien*100/n)+"%",""],["Proyectado a 100 preg.",proy+" pts", proy>=1000?"best":""]].forEach(function(x){
    var d=document.createElement("div"); d.className="qbox "+(x[2]||"");
    d.innerHTML="<b class='tnum' style='font-size:1.2rem'>"+x[1]+"</b><span>"+x[0]+"</span>"; g.appendChild(d);
  });
  var c="";
  if(blanco>0) c="Dejaste "+blanco+" sin responder: eso te costó unos "+Math.round(blanco*4.2)+" puntos. Adivinar conviene siempre.";
  else if(proy>=1200) c="Buen nivel. Mantén los simulacros semanales y no descuides los repasos.";
  else c="Revisa abajo cada fallo y anótalo. La autopsia vale más que el simulacro.";
  $("f-consejo").textContent=c;
  var rev=ses.hechas.filter(function(x){ return !x.bien; }).slice(0,20);
  if(rev.length){
    var box=document.createElement("ul"); box.className="list"; box.style.marginTop="14px";
    rev.forEach(function(x){
      var el=document.createElement("li"); el.className="item";
      el.innerHTML='<span class="muted">'+x.c+' · marcaste '+x.dado+', era '+x.k+'</span><p></p><p class="muted"></p>';
      el.querySelectorAll("p")[0].textContent=x.q.slice(0,150)+(x.q.length>150?"…":"");
      el.querySelectorAll("p")[1].textContent=(x.s||"").slice(0,220);
      box.appendChild(el);
    });
    var vf=$("v-fin").querySelector(".card");
    var viejo=vf.querySelector(".list"); if(viejo) viejo.remove();
    vf.appendChild(box);
  }
  marcarDia(); guardar(); ses=null; ver("fin");
}
$("go").addEventListener("click", empezar);
$("f-otra").addEventListener("click", empezar);
$("f-home").addEventListener("click", function(){ ver("inicio"); });

function revisarGenerada(q, bien, seg){
  var g = S.gen[q.tpl] || {nivel:1, int:0, ac:0};
  g.int++; if(bien) g.ac++;
  var antes=g.nivel||1;
  if(bien && conf==="seguro") g.nivel=Math.min(10, antes+1);
  else if(!bien) g.nivel=Math.max(1, antes-1);
  g.curso=q.c;
  S.gen[q.tpl]=g;
  if(!bien){
    S.gerr.unshift({tpl:q.tpl, c:q.c, q:q.q, k:q.k, r:q.a[q.k], s:q.s, fecha:hoy(), nivel:q.nivel});
    if(S.gerr.length>80) S.gerr.pop();
  }
  marcarDia(); guardar();
  if(bien) ses.bien++;
  ses.hechas.push({gen:true, bien:bien, conf:conf});

  $("q-alts").querySelectorAll(".alt").forEach(function(b){
    b.disabled=true;
    if(b.dataset.k===q.k) b.classList.add("ok");
    else if(b.dataset.k===sel) b.classList.add("no");
    b.classList.remove("sel");
  });
  $("paso-conf").classList.add("hide");
  $("paso-rev").classList.remove("hide");
  var v=$("verdict"), sube = g.nivel>antes, baja = g.nivel<antes;
  if(bien && conf==="seguro"){ v.className="verdict good"; v.innerHTML="Correcta, y lo sabías.<p>"+(sube?"Subes al nivel "+g.nivel+" en "+q.c+".":"Nivel "+g.nivel+".")+"</p>"; }
  else if(bien){ v.className="verdict good"; v.innerHTML="Correcta, pero dudabas.<p>El nivel no sube hasta que aciertes con seguridad.</p>"; }
  else if(conf==="seguro"){ v.className="verdict trap"; v.innerHTML="Incorrecta, y estabas seguro.<p>El error más caro."+(baja?" Bajas al nivel "+g.nivel+".":"")+"</p>"; }
  else { v.className="verdict bad"; v.innerHTML="Incorrecta.<p>Era "+q.k+"."+(baja?" Bajas al nivel "+g.nivel+".":"")+"</p>"; }
  $("sol").textContent=q.s;
  $("causa-box").classList.add("hide");
  window.scrollTo({top:document.body.scrollHeight, behavior:"smooth"});
}

function responderExamen(k){
  var q=ses.lista[ses.k];
  var bien = k===q.k;
  if(bien) ses.bien++; else ses.mal++;
  ses.hechas.push({bien:bien, c:q.c, q:q.q, k:q.k, dado:k, s:q.s});
  ses.k++;
  if(ses.k>=ses.lista.length) return terminar();
  mostrar(); window.scrollTo(0,0);
}

/* ---------- errores ---------- */
var errFiltro="pend";
function pintarErrores(){
  chips($("err-filtros"), [{id:"pend",n:"Pendientes"},{id:"hoy",n:"Toca hoy"},{id:"todos",n:"Todos"}],
    errFiltro, function(id){ errFiltro=id; pintarErrores(); });
  var lista=[];
  for(var k in S.prog){
    var r=S.prog[k];
    var esErr = !r.bien || (r.caja||0)<=1;
    if(!esErr) continue;
    if(errFiltro==="pend" && r.bien && (r.caja||0)>1) continue;
    if(errFiltro==="hoy" && !vence(k)) continue;
    lista.push({k:k, r:r});
  }
  var cont=$("err-lista"); cont.textContent="";
  if(errFiltro!=="hoy"){
    S.gerr.slice(0,25).forEach(function(e){
      var el=document.createElement("li");
      el.className="item";
      el.innerHTML='<span class="muted">'+e.c+' · generada · nivel '+e.nivel+' · '+e.fecha+'</span><p></p><p class="muted"></p>';
      el.querySelectorAll("p")[0].textContent=e.q.slice(0,160)+(e.q.length>160?"…":"");
      el.querySelectorAll("p")[1].textContent="Clave: "+e.k+" · "+String(e.r).slice(0,60);
      cont.appendChild(el);
    });
  }
  if(!lista.length && !cont.children.length){
    cont.innerHTML='<li class="empty">Nada por aquí. Practica un poco y lo que falles aparece.</li>';
    return;
  }
  lista.sort(function(a,b){ return (a.r.prox||"").localeCompare(b.r.prox||""); });
  lista.slice(0,60).forEach(function(x){
    var q=Q[x.k]; if(!q) return;
    var causa=CAUSAS.filter(function(c){ return c.id===x.r.causa; })[0];
    var d=dias(hoy(), x.r.prox||hoy());
    var cuando = d<=0 ? "toca hoy" : "en "+d+(d===1?" día":" días");
    var el=document.createElement("li");
    el.className="item";
    el.innerHTML='<span class="muted">'+q.c+' · '+cuando+(causa?' · '+causa.n:'')+'</span>'+
      '<p>'+q.q.slice(0,150)+(q.q.length>150?'…':'')+'</p>'+
      '<p class="muted"></p>';
    el.querySelector("p.muted").textContent="Clave: "+q.k+" · "+(q.a[q.k]||"").slice(0,80);
    cont.appendChild(el);
  });
}

/* ---------- progreso ---------- */
function pintarProgreso(){
  pintarConstancia();
  var m=metricas();
  if(m.n<10){
    $("p-punt").textContent="—";
    $("p-nota").textContent="Con 10 preguntas respondidas empiezo a estimar tu puntaje.";
  } else {
    var aciertos=m.pct/100;
    var fallos=1-aciertos;
    var punt=Math.round(100*(aciertos*20 - fallos*1.125));
    $("p-punt").textContent=punt+" pts";
    $("p-nota").textContent="Estimado sobre 2000 si hoy respondieras las 100 preguntas al mismo ritmo de acierto ("+m.pct+"%), sin dejar ninguna en blanco. Es una referencia, no una promesa.";
  }
  var porCurso={};
  for(var k in S.prog){
    var r=S.prog[k], c=r.curso||"?";
    porCurso[c]=porCurso[c]||{n:0,b:0};
    porCurso[c].n++; if(r.bien) porCurso[c].b++;
  }
  var cont=$("p-cursos"); cont.textContent="";
  var ks=Object.keys(porCurso);
  pintarNiveles();
  if(!ks.length){ cont.innerHTML='<p class="empty">Todavía sin datos del banco. Si practicas las generadas, mira los niveles abajo.</p>'; return; }
  ks.sort(function(a,b){ return (porCurso[a].b/porCurso[a].n)-(porCurso[b].b/porCurso[b].n); });
  var tb=document.createElement("table"); tb.className="tabla";
  var tn=0, tbn=0, filas="";
  ks.forEach(function(c){
    var x=porCurso[c], p=Math.round(x.b*100/x.n); tn+=x.n; tbn+=x.b;
    var col=p>=70?'var(--ok)':p>=50?'var(--warn)':'var(--bad)';
    filas+='<tr><th scope="row">'+c+'</th><td class="tnum">'+x.b+' / '+x.n+'</td>'+
      '<td class="tnum"><span style="color:'+col+';font-weight:700">'+p+'%</span>'+
      '<div class="prog" style="margin:5px 0 0"><i style="width:'+p+'%;background:'+col+'"></i></div></td></tr>';
  });
  var tp=Math.round(tbn*100/Math.max(1,tn));
  tb.innerHTML='<caption class="sr-only">Aciertos por curso, del más débil al más fuerte</caption>'+
    '<thead><tr><th scope="col">Curso</th><th scope="col">Aciertos</th><th scope="col">%</th></tr></thead>'+
    '<tbody>'+filas+'</tbody>'+
    '<tfoot><tr><th scope="row">Total</th><td class="tnum">'+tbn+' / '+tn+'</td><td class="tnum"><strong>'+tp+'%</strong></td></tr></tfoot>';
  cont.appendChild(tb);
}

function pintarNiveles(){
  var cont=$("p-niveles"); cont.textContent="";
  var hechos=GEN.plantillas.filter(function(t){ return S.gen[t.id]; });
  if(!hechos.length){ cont.innerHTML='<li class="empty">Practica el grupo Generadas y aquí verás tu nivel por tipo de ejercicio.</li>'; return; }
  hechos.sort(function(a,b){ return nivelDe(a.id)-nivelDe(b.id); });
  hechos.forEach(function(t){
    var g=S.gen[t.id], p=Math.round(g.ac*100/Math.max(1,g.int));
    var el=document.createElement("li"); el.className="item";
    el.innerHTML='<div style="display:flex;justify-content:space-between;gap:10px">'+
      '<b style="font-size:.92rem">'+t.n+'</b><span class="tnum" style="color:var(--brand)">nivel '+nivelDe(t.id)+'</span></div>'+
      '<div class="prog" style="margin:8px 0 0"><i style="width:'+(nivelDe(t.id)*10)+'%"></i></div>'+
      '<span class="muted">'+t.c+' · '+g.ac+' de '+g.int+' ('+p+'%)</span>';
    cont.appendChild(el);
  });
}

/* ---------- respaldo ---------- */
$("exp").addEventListener("click", function(){
  var s=JSON.stringify({app:"rsm",v:1,data:S});
  var t=$("bak"); t.classList.remove("hide"); t.value=s;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(s).then(function(){ $("bak-msg").textContent="Copiado. Guárdalo en tus notas."; },
      function(){ $("bak-msg").textContent="Copia el texto de arriba a mano."; });
  } else $("bak-msg").textContent="Copia el texto de arriba a mano.";
});
$("imp").addEventListener("click", function(){
  var t=$("bak");
  if(t.classList.contains("hide") || !t.value.trim()){
    t.classList.remove("hide"); t.value=""; $("bak-msg").textContent="Pega tu respaldo y toca Restaurar otra vez."; return;
  }
  try{
    var o=JSON.parse(t.value);
    if(!o || o.app!=="rsm" || !o.data) throw 0;
    S=o.data; guardar(); $("bak-msg").textContent="Restaurado."; pintarProgreso();
  }catch(e){ $("bak-msg").textContent="Ese texto no es un respaldo válido."; }
});

/* ---------- apariencia ---------- */
var TEMAS=[{id:"noche",n:"Noche azul"},{id:"violeta",n:"Violeta"},
  {id:"atardecer",n:"Atardecer"},{id:"neon",n:"Neón"},{id:"papel",n:"Papel claro"}];
function aplicarTema(id){
  document.documentElement.setAttribute("data-tema", id);
  try{ localStorage.setItem("rsm.tema2", id); }catch(e){}
  var pal=$("paleta");
  if(pal){
    pal.textContent="";
    ["var(--bg1)","var(--bg2)","var(--brand)","var(--brand2)"].forEach(function(c){
      var d=document.createElement("i"); d.style.background=c; pal.appendChild(d);
    });
  }
}
function pintarTemas(){
  var act=document.documentElement.getAttribute("data-tema")||"noche";
  chips($("temas"), TEMAS, act, function(id){ aplicarTema(id); pintarTemas(); });
  aplicarTema(act);
}
try{ var t2=localStorage.getItem("rsm.tema2"); if(t2) document.documentElement.setAttribute("data-tema",t2); }catch(e){}

/* ---------- tema ---------- */
$("theme").addEventListener("click", function(){
  var act=document.documentElement.getAttribute("data-tema")||"noche";
  var i=0; TEMAS.forEach(function(t,k){ if(t.id===act) i=k; });
  aplicarTema(TEMAS[(i+1)%TEMAS.length].id);
  if($("temas").children.length) pintarTemas();
});

/* API para los módulos js/calendario.js y js/ruta.js */
window.RSM = {
  get S(){ return S; }, guardar:function(){ guardar(); }, ver:ver, chips:chips,
  pintarHoy:function(){ pintarHoy(); }, marcarDia:function(){ marcarDia(); guardar(); },
  minu:minu, DIAS:DIAS, DIAC:DIAC, INTENS:INTENS, GNOMBRE:GNOMBRE
};
cargar();
$("sub").textContent="Área C · "+Q.length+" preguntas del CEPRE";
pintarSim();
ver("hoy");
})();


/* v6: logo interactivo + intro */
(function(){
  var logo=document.getElementById("logo"), tono=0;
  function florecer(){
    logo.classList.remove("florece"); void logo.offsetWidth; logo.classList.add("florece");
  }
  if(logo){ logo.addEventListener("click",florecer);
    logo.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); florecer(); } });
    setInterval(function(){ if(!document.hidden) florecer(); }, 20000); }
  var intro=document.getElementById("intro"); if(!intro) return;
  var visto=false; try{ visto=sessionStorage.getItem("rsm.intro")==="1"; sessionStorage.setItem("rsm.intro","1"); }catch(e){}
  if(visto){ intro.remove(); return; }
  var f=intro.querySelector(".in-flor"), svg=document.querySelector(".logo-flor");
  if(f&&svg){ var c=svg.cloneNode(true); c.removeAttribute("class"); f.appendChild(c); }
  function cerrar(){ intro.classList.add("fuera"); setTimeout(function(){ intro.remove(); },450); }
  var bt=document.getElementById("in-entrar"); bt.addEventListener("click",cerrar);
  setTimeout(function(){ try{ bt.focus({preventScroll:true}); }catch(e){} },1400);
})();
