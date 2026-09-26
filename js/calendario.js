/* Mi horario: cada estudiante registra sus ocupaciones fijas y la app
   reparte los bloques de estudio en sus horas libres.
   Guarda en S.cal = {ocup:[{t,l,d:[0..6],i,f}], desde, hasta, margen} */
(function(){
"use strict";
var R = window.RSM, $ = function(id){ return document.getElementById(id); };
var minu = R.minu;
function hhmm(m){ return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0"); }
function esc(t){ return String(t).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

/* Orden de la semana para mostrar: lunes primero */
var ORDEN=[1,2,3,4,5,6,0];

/* Plantillas rápidas: solo rellenan el formulario, el estudiante ajusta */
var PLANT=[
  {n:"Colegio",     t:"Colegio",     d:[1,2,3,4,5], i:"07:30", f:"13:30"},
  {n:"Instituto",   t:"Instituto",   d:[1,2,3,4,5], i:"08:00", f:"13:00"},
  {n:"Trabajo",     t:"Trabajo",     d:[1,2,3,4,5], i:"08:00", f:"17:00"},
  {n:"Prácticas",   t:"Prácticas",   d:[1,2,3,4,5], i:"08:00", f:"14:00"},
  {n:"Academia",    t:"Academia",    d:[1,3,5],     i:"15:00", f:"19:00"}
];

/* Rotación de cursos por peso en el examen del Área C
   (matemática es lo que más preguntas tiene) */
var ROTA=["gen","cie","hab","let","hum","gen","cie","gen","hab","hum","cie","let","gen"];
var TIT={gen:"Matemática", cie:"Ciencias", hab:"Habilidades", let:"Lenguaje y letras",
         hum:"Humanidades", sim:"Simulacro", err:"Cuaderno de errores"};
var NOTA={gen:"Ejercicios generados: práctica sin límite.",
          cie:"Física, química o biología.",
          hab:"Comprensión lectora (también en inglés) y razonamiento matemático.",
          let:"Lenguaje y literatura.",
          hum:"Historia, geografía, economía, cívica, filosofía o psicología.",
          sim:"Cronometrado y sin celular, como el examen real.",
          err:"Rehacer lo fallado en la semana. Nada nuevo."};
/* Horas por semana que busca cada intensidad (id del app: 3 ligero, 2 normal, 1 fuerte) */
var META={3:7, 2:12, 1:17};
/* Orden de reparto: alterna días para que el plan ligero no deje media semana vacía */
var REPARTO=[1,3,5,2,4,6,0];

/* ---------- motor: ocupaciones → huecos → bloques ---------- */
function expandir(cal){
  var out=[];
  (cal.ocup||[]).forEach(function(o){
    o.d.forEach(function(d){ out.push({d:d, i:o.i, f:o.f, t:o.t, l:o.l||""}); });
  });
  return out;
}
function huecos(cal, d, oc){
  var ini=minu(cal.desde||"06:00"), fin=minu(cal.hasta||"22:00"), mg=cal.margen==null?30:cal.margen;
  var ocup=oc.filter(function(b){ return b.d===d; })
    .map(function(b){ return [minu(b.i)-15, minu(b.f)+mg]; })
    .sort(function(a,b){ return a[0]-b[0]; });
  var libres=[], cur=ini;
  ocup.forEach(function(x){
    if(x[0]>cur) libres.push([cur, Math.min(x[0],fin)]);
    cur=Math.max(cur,x[1]);
  });
  if(cur<fin) libres.push([cur,fin]);
  return libres.filter(function(x){ return x[1]-x[0]>=45; });
}
function candidatos(cal, d, oc){
  var out=[];
  huecos(cal,d,oc).forEach(function(h){
    var t=h[0], n=0;
    while(h[1]-t>=45 && n<3){
      var len=Math.min(90, h[1]-t);
      out.push({d:d, a:t, b:t+len, len:len, score:len+(t<7*60+30?-40:0)+(t>=14*60&&t<19*60?10:0)+(t>=21*60?-30:0)});
      t+=len+30; n++;
    }
  });
  return out.sort(function(a,b){ return b.score-a.score; });
}
function generar(cal){
  var oc=expandir(cal), porDia={}, total=0, elegidos=[];
  ORDEN.forEach(function(d){ porDia[d]=candidatos(cal,d,oc); });
  /* 1) fin de semana: simulacro (bloque más largo) y cuaderno de errores, siempre */
  function sacar(dias, minLen){
    var m=null, md=null;
    /* prueba los días en orden; el primero que tenga un hueco válido gana */
    dias.forEach(function(d){ if(m) return; porDia[d].forEach(function(c){ if(c.len>=minLen && (!m || c.len>m.len || (c.len===m.len && c.score>m.score))){ m=c; md=d; } }); });
    if(m){ porDia[md].splice(porDia[md].indexOf(m),1); }
    return m;
  }
  var sim=sacar([6,0],75);
  if(sim){ sim.g="sim"; sim.n=3; elegidos.push(sim); total+=sim.len; }
  var err=sacar(sim&&sim.d===6?[0,6]:[6,0],45);
  if(err){ if(err.len>60){ err.b=err.a+60; err.len=60; } err.g="err"; err.n=3; elegidos.push(err); total+=err.len; }
  /* 2) el resto por rondas: el mejor bloque de cada día primero */
  var tier=3, meta=META[3]*60;
  while(tier>=1 && total>=meta){ tier--; if(tier>=1) meta=META[tier]*60; }
  var ronda=0, quedan=true;
  while(quedan && tier>=1){
    quedan=false;
    for(var k=0;k<REPARTO.length && tier>=1;k++){
      var lista=porDia[REPARTO[k]];
      if(ronda<lista.length){
        quedan=true;
        var c=lista[ronda]; c.n=tier; elegidos.push(c); total+=c.len;
        while(tier>=1 && total>=meta){ tier--; if(tier>=1) meta=META[tier]*60; }
      }
    }
    ronda++;
  }
  /* 3) cursos: rotación por peso, primero los bloques obligatorios */
  var r=0;
  elegidos.slice().sort(function(a,b){ return b.n-a.n || ORDEN.indexOf(a.d)-ORDEN.indexOf(b.d) || a.a-b.a; })
    .forEach(function(c){ if(!c.g){ c.g=ROTA[r%ROTA.length]; r++; } });
  return {
    ocup: oc,
    estudio: elegidos.map(function(c){
      return {d:c.d, i:hhmm(c.a), f:hhmm(c.b), g:c.g, t:TIT[c.g], nota:NOTA[c.g], n:c.n};
    })
  };
}

function aplicar(){
  var S=R.S;
  var plan = S.cal ? generar(S.cal) : {ocup:[], estudio:[]};
  V3.SENATI.length=0; plan.ocup.forEach(function(x){ V3.SENATI.push(x); });
  V3.ESTUDIO.length=0; plan.estudio.forEach(function(x){ V3.ESTUDIO.push(x); });
}
function horas(cal, intens){
  var t=0; generar(cal).estudio.forEach(function(b){ if(b.n>=intens) t+=minu(b.f)-minu(b.i); });
  return Math.round(t/6)/10;
}

/* ---------- asistente en 3 pasos ---------- */
var W=null;  /* borrador mientras se edita */
var paso=1, form=null;

function nuevoForm(p){
  p=p||{};
  return {t:p.t||"", l:p.l||"", d:(p.d||[]).slice(), i:p.i||"08:00", f:p.f||"13:00"};
}
function abrir(){
  var S=R.S;
  W = S.cal ? JSON.parse(JSON.stringify(S.cal)) : {ocup:[], desde:"07:00", hasta:"22:00", margen:30};
  paso = 1; form = nuevoForm();
  pintar();
}
function pasos(){
  var nombres=["Ocupaciones","Horas libres","Intensidad"];
  return '<ol class="cal-pasos">'+nombres.map(function(n,i){
    return '<li class="'+(i+1===paso?"on":(i+1<paso?"hecho":""))+'"><span>'+(i+1)+'</span>'+n+'</li>';
  }).join("")+'</ol>';
}
function pintar(){
  var box=$("cal-cont"); if(!box) return;
  var h=pasos();
  if(paso===1) h+=paso1(); else if(paso===2) h+=paso2(); else h+=paso3();
  box.innerHTML=h;
  enlazar();
}
function paso1(){
  var lista = W.ocup.length ? W.ocup.map(function(o,k){
    return '<li class="item cal-oc"><div><b>'+esc(o.t)+'</b><span class="muted"> · '+
      diasTxt(o.d)+' · '+o.i+'–'+o.f+(o.l?' · '+esc(o.l):'')+'</span></div>'+
      '<button type="button" class="chip" data-borra="'+k+'" aria-label="Quitar '+esc(o.t)+'">Quitar</button></li>';
  }).join("") : '<li class="muted">Todavía no agregaste nada. Si no tienes horario fijo, pasa al siguiente paso.</li>';
  return '<article class="card"><header><h3 class="lbl">Tu semana</h3></header>'+
    '<p class="muted">Anota lo que ya ocupa tu tiempo cada semana: colegio, instituto, trabajo, academia, viaje. Solo lo fijo.</p>'+
    '<ul class="list">'+lista+'</ul></article>'+
    '<article class="card"><header><h3 class="lbl">Agregar ocupación</h3></header>'+
    '<p class="muted" style="margin:0">Atajos (luego ajustas):</p>'+
    '<div class="chips" id="cal-plant">'+PLANT.map(function(p,k){ return '<button type="button" class="chip" data-pl="'+k+'">'+p.n+'</button>'; }).join("")+'</div>'+
    '<form class="cal-form" id="cal-form">'+
      '<label>Nombre<input class="campo" id="cf-t" maxlength="40" placeholder="Ej.: Colegio" value="'+esc(form.t)+'"></label>'+
      '<fieldset><legend>Días</legend><div class="chips" id="cf-d">'+
        ORDEN.map(function(d){ return '<button type="button" class="chip'+(form.d.indexOf(d)>=0?" on":"")+'" data-d="'+d+'" aria-pressed="'+(form.d.indexOf(d)>=0)+'">'+R.DIAC[d]+'</button>'; }).join("")+
        '<button type="button" class="chip" data-d="lv">Lun–Vie</button></div></fieldset>'+
      '<div class="row"><label>Desde<input class="campo" type="time" id="cf-i" value="'+form.i+'"></label>'+
      '<label>Hasta<input class="campo" type="time" id="cf-f" value="'+form.f+'"></label></div>'+
      '<label>Lugar <small class="muted">(opcional)</small><input class="campo" id="cf-l" maxlength="40" placeholder="Ej.: Aula 201, virtual" value="'+esc(form.l)+'"></label>'+
      '<p class="cal-err" id="cf-err" role="alert"></p>'+
      '<button type="button" class="btn sec" id="cf-add">Agregar a mi semana</button>'+
    '</form></article>'+
    '<div class="row cal-nav"><button type="button" class="btn" id="cal-sig">Siguiente</button></div>';
}
function paso2(){
  var oc=expandir(W);
  var filas=ORDEN.map(function(d){
    var hs=huecos(W,d,oc), t=0;
    hs.forEach(function(x){ t+=x[1]-x[0]; });
    return '<li class="item"><b>'+R.DIAS[d]+'</b> <span class="muted">· '+(Math.round(t/6)/10)+' h libres</span>'+
      '<p class="muted">'+(hs.length? hs.map(function(x){ return hhmm(x[0])+'–'+hhmm(x[1]); }).join(", ") : "Sin huecos de 45 min o más")+'</p></li>';
  }).join("");
  return '<article class="card"><header><h3 class="lbl">¿Entre qué horas puedes estudiar?</h3></header>'+
    '<div class="row"><label>Desde<input class="campo" type="time" id="cf-desde" value="'+W.desde+'"></label>'+
    '<label>Hasta<input class="campo" type="time" id="cf-hasta" value="'+W.hasta+'"></label></div>'+
    '<p class="muted" style="margin:12px 0 0">Descanso después de cada ocupación (comer, viajar):</p>'+
    '<div class="chips" id="cf-mg">'+[15,30,60,90].map(function(m){ return '<button type="button" class="chip'+(W.margen===m?" on":"")+'" data-mg="'+m+'">'+m+' min</button>'; }).join("")+'</div>'+
    '</article>'+
    '<article class="card"><header><h3 class="lbl">Tus horas libres</h3></header>'+
    '<p class="muted">Calculadas solas. Si algo no cuadra, vuelve atrás y corrige tus ocupaciones.</p>'+
    '<ol class="list">'+filas+'</ol></article>'+
    '<div class="row cal-nav"><button type="button" class="btn sec" id="cal-atras">Atrás</button><button type="button" class="btn" id="cal-sig">Siguiente</button></div>';
}
function paso3(){
  var S=R.S, it=S.intens||2;
  var plan=generar(W).estudio.filter(function(b){ return b.n>=it; });
  var filas=ORDEN.map(function(d){
    var bs=plan.filter(function(b){ return b.d===d; }).sort(function(a,b){ return minu(a.i)-minu(b.i); });
    return '<li class="item"><b>'+R.DIAS[d]+'</b><p class="muted">'+(bs.length? bs.map(function(b){ return b.i+' '+b.t; }).join(" · ") : "Descanso")+'</p></li>';
  }).join("");
  return '<article class="card"><header><h3 class="lbl">¿Qué tan fuerte?</h3></header>'+
    '<div class="chips" id="cf-int">'+R.INTENS.map(function(x){ return '<button type="button" class="chip'+(x.id===it?" on":"")+'" data-it="'+x.id+'">'+x.n+'</button>'; }).join("")+'</div>'+
    '<h2 class="tnum" style="font-size:2rem;margin:10px 0 0">'+horas(W,it)+' h <small class="muted">por semana</small></h2>'+
    '<p class="muted">Matemática recibe más bloques porque es lo que más pesa en el Área C. Si te sobra poco tiempo, empieza en Ligero: la constancia gana a la intensidad.</p>'+
    '</article>'+
    '<article class="card"><header><h3 class="lbl">Tu plan</h3></header><ol class="list">'+filas+'</ol></article>'+
    '<div class="row cal-nav"><button type="button" class="btn sec" id="cal-atras">Atrás</button><button type="button" class="btn" id="cal-ok">Guardar mi plan</button></div>';
}
function diasTxt(d){
  var s=d.slice().sort(function(a,b){ return ORDEN.indexOf(a)-ORDEN.indexOf(b); });
  if(s.join()==="1,2,3,4,5") return "Lun–Vie";
  if(s.length===7) return "Todos los días";
  return s.map(function(x){ return R.DIAC[x]; }).join(", ");
}
function leerForm(){
  if(!$("cf-t")) return;
  form.t=$("cf-t").value.trim(); form.l=$("cf-l").value.trim();
  form.i=$("cf-i").value; form.f=$("cf-f").value;
}
function enlazar(){
  var box=$("cal-cont");
  box.querySelectorAll("[data-borra]").forEach(function(b){
    b.addEventListener("click", function(){ leerForm(); W.ocup.splice(+b.dataset.borra,1); pintar(); });
  });
  box.querySelectorAll("[data-pl]").forEach(function(b){
    b.addEventListener("click", function(){ form=nuevoForm(PLANT[+b.dataset.pl]); pintar(); $("cf-t").focus(); });
  });
  box.querySelectorAll("#cf-d [data-d]").forEach(function(b){
    b.addEventListener("click", function(){
      leerForm();
      var v=b.dataset.d;
      if(v==="lv") form.d=[1,2,3,4,5];
      else { v=+v; var k=form.d.indexOf(v); if(k>=0) form.d.splice(k,1); else form.d.push(v); }
      pintar();
    });
  });
  if($("cf-add")) $("cf-add").addEventListener("click", function(){
    leerForm();
    var e="";
    if(!form.t) e="Ponle un nombre.";
    else if(!form.d.length) e="Elige al menos un día.";
    else if(!form.i || !form.f || minu(form.f)<=minu(form.i)) e="La hora de fin debe ser después del inicio.";
    if(e){ $("cf-err").textContent=e; return; }
    W.ocup.push({t:form.t, l:form.l, d:form.d.slice().sort(), i:form.i, f:form.f});
    form=nuevoForm(); pintar();
  });
  box.querySelectorAll("[data-mg]").forEach(function(b){
    b.addEventListener("click", function(){ leer2(); W.margen=+b.dataset.mg; pintar(); });
  });
  ["cf-desde","cf-hasta"].forEach(function(id){
    if($(id)) $(id).addEventListener("change", function(){ leer2(); pintar(); });
  });
  box.querySelectorAll("[data-it]").forEach(function(b){
    b.addEventListener("click", function(){ R.S.intens=+b.dataset.it; pintar(); });
  });
  if($("cal-sig")) $("cal-sig").addEventListener("click", function(){
    if(paso===1){ leerForm(); if(form.t && form.d.length){ $("cf-err").textContent="Tienes una ocupación sin agregar: toca «Agregar a mi semana» o borra el nombre."; return; } }
    if(paso===2){ leer2(); if(minu(W.hasta)<=minu(W.desde)) return; }
    paso++; pintar(); window.scrollTo(0,0);
  });
  if($("cal-atras")) $("cal-atras").addEventListener("click", function(){ if(paso===2) leer2(); paso--; pintar(); window.scrollTo(0,0); });
  if($("cal-ok")) $("cal-ok").addEventListener("click", function(){
    var S=R.S; S.cal=W; if(!S.intens) S.intens=2;
    R.guardar(); aplicar(); R.ver("hoy");
  });
}
function leer2(){ if($("cf-desde")){ W.desde=$("cf-desde").value||"06:00"; W.hasta=$("cf-hasta").value||"22:00"; } }

/* ---------- conexión con la app ---------- */
window.RSM_VISTA = window.RSM_VISTA || {};
window.RSM_VISTA.cal = abrir;
window.RSM_VISTA.hoy = function(){
  var b=$("hoy-sin-cal"); if(b) b.classList.toggle("hide", !!R.S.cal);
};
document.addEventListener("click", function(e){
  var t=e.target.closest && e.target.closest("[data-abrir-cal]");
  if(t) R.ver("cal");
});
window.RSM_CAL = {generar:generar, aplicar:aplicar};

aplicar();
if(!R.S.cal) R.ver("cal"); else R.pintarHoy();
})();
