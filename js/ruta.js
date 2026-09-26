/* Aprender: ruta por cursos → unidades → lecciones.
   Cada lección: Aprende → Ejemplo → Practica → Chequeo (4 de 5 desbloquea la siguiente).
   El contenido vive en data/cursos/*.json (formato explicado en CONTENIDO.md). */
(function(){
"use strict";
var R = window.RSM, $ = function(id){ return document.getElementById(id); };
var INDICE=null, CACHE={}, st=null;
var APRUEBA=0.8;

function prog(){ var S=R.S; if(!S.ruta) S.ruta={}; return S.ruta; }
function esc(t){ return String(t).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
/* Formato mínimo del contenido: ^{x} superíndice, _{x} subíndice, **negrita**, *cursiva*, salto con \n */
function fmt(t){
  return esc(t).replace(/\^\{([^}]*)\}/g,"<sup>$1</sup>").replace(/_\{([^}]*)\}/g,"<sub>$1</sub>")
    .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>").replace(/\n/g,"<br>");
}
function mezclar(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function cont(){ return $("ru-cont"); }
function cargarJSON(url){
  return fetch(url,{cache:"no-cache"}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); });
}
function error(msg){
  cont().innerHTML='<article class="card"><header><h3 class="lbl">No se pudo cargar</h3></header><p class="muted">'+msg+
    '</p><p class="muted">Esta sección lee archivos de <code>data/cursos/</code>. Funciona en GitHub Pages o con un servidor local; abriendo el archivo con doble clic, no.</p></article>';
}

/* ---------- lista de cursos ---------- */
function inicio(){
  st=null;
  if(INDICE) return pintarCursos();
  cont().innerHTML='<p class="muted">Cargando cursos…</p>';
  cargarJSON("data/cursos/index.json").then(function(j){ INDICE=j; pintarCursos(); })
    .catch(function(){ error("No encontré data/cursos/index.json."); });
}
function lecciones(c){ var a=[]; c.unidades.forEach(function(u){ (u.lecciones||[]).forEach(function(l){ a.push(l); }); }); return a; }
function pintarCursos(){
  var P=prog();
  var h='<p class="muted ru-intro">Un tema a la vez. Cada lección se desbloquea al aprobar el chequeo de la anterior.</p><div class="ru-cursos">';
  INDICE.cursos.forEach(function(c){
    var hechos=0; for(var k in P) if(k.indexOf(c.id+"/")===0 && P[k].ok) hechos++;
    h+='<button type="button" class="card ru-curso" data-c="'+c.id+'"><span class="ru-area">'+esc(c.area)+'</span>'+
      '<b>'+esc(c.nombre)+'</b><span class="muted">'+esc(c.desc||"")+'</span>'+
      '<span class="ru-mini">'+hechos+' de '+c.lecciones+' lecciones</span>'+
      '<i class="ru-barra"><i style="width:'+(c.lecciones?Math.round(hechos/c.lecciones*100):0)+'%"></i></i></button>';
  });
  cont().innerHTML=h+'</div>';
  cont().querySelectorAll("[data-c]").forEach(function(b){ b.addEventListener("click", function(){ abrirCurso(b.dataset.c); }); });
}

/* ---------- mapa del curso ---------- */
function abrirCurso(id){
  var meta=INDICE.cursos.filter(function(c){ return c.id===id; })[0];
  if(CACHE[id]) return pintarCurso(CACHE[id]);
  cont().innerHTML='<p class="muted">Cargando '+esc(meta.nombre)+'…</p>';
  cargarJSON("data/cursos/"+meta.archivo).then(function(j){ CACHE[id]=j; pintarCurso(j); })
    .catch(function(){ error("No encontré data/cursos/"+meta.archivo+" o tiene un error de formato."); });
}
function desbloqueada(c, lid){
  var ls=lecciones(c), P=prog();
  for(var i=0;i<ls.length;i++){
    if(ls[i].id===lid) return i===0 || !!(P[c.id+"/"+ls[i-1].id]||{}).ok;
  }
  return false;
}
function pintarCurso(c){
  var P=prog();
  var h='<button type="button" class="chip ru-volver" id="ru-v">‹ Cursos</button><h2 class="ru-h">'+esc(c.nombre)+'</h2>';
  c.unidades.forEach(function(u,ui){
    h+='<article class="card ru-unidad"><header><h3 class="lbl">Unidad '+(ui+1)+'</h3></header><p class="ru-ut">'+esc(u.titulo)+'</p>';
    if(!u.lecciones || !u.lecciones.length){ h+='<p class="muted">En preparación.</p></article>'; return; }
    h+='<ol class="ru-camino">';
    u.lecciones.forEach(function(l,li){
      var r=P[c.id+"/"+l.id]||{}, ab=desbloqueada(c,l.id);
      var est=r.ok?"hecha":(ab?"abierta":"cerrada");
      h+='<li class="ru-paso '+est+'"><button type="button" data-l="'+l.id+'"'+(ab?'':' disabled')+'>'+
        '<span class="ru-nodo">'+(r.ok?"✓":(li+1))+'</span><span><b>'+esc(l.titulo)+'</b>'+
        '<small class="muted">'+(r.ok?"Aprobada · "+r.nota+"/"+r.de:(ab?"Siguiente":"Aprueba la anterior"))+'</small></span></button></li>';
    });
    h+='</ol></article>';
  });
  cont().innerHTML=h;
  $("ru-v").addEventListener("click", pintarCursos);
  cont().querySelectorAll("[data-l]").forEach(function(b){
    b.addEventListener("click", function(){ empezar(c, b.dataset.l); });
  });
}

/* ---------- lección ---------- */
function buscar(c,lid){ return lecciones(c).filter(function(l){ return l.id===lid; })[0]; }
function empezar(c, lid){
  var l=buscar(c,lid);
  function copia(q){ var o={}; for(var k in q) if(k!=="_o") o[k]=q[k]; return o; }
  var prac=(l.practica||[]).map(copia);
  if(l.generador && window.GEN_RUTA && GEN_RUTA[l.generador.id]){
    for(var k=0;k<(l.generador.n||3);k++) prac.push(GEN_RUTA[l.generador.id]());
  }
  st={c:c, l:l, fase:0, paso:0, prac:prac, chq:(l.chequeo||[]).map(copia), k:0, bien:0, resp:null};
  fase();
}
var FASES=["Aprende","Ejemplo","Practica","Chequeo"];
function cabecera(){
  return '<button type="button" class="chip ru-volver" id="ru-salir">‹ '+esc(st.c.nombre)+'</button>'+
    '<h2 class="ru-h">'+esc(st.l.titulo)+'</h2><ol class="cal-pasos ru-fases">'+FASES.map(function(n,i){
      return '<li class="'+(i===st.fase?"on":(i<st.fase?"hecho":""))+'"><span>'+(i+1)+'</span>'+n+'</li>';
    }).join("")+'</ol>';
}
function bloque(b){
  if(typeof b==="string") return '<p>'+fmt(b)+'</p>';
  if(b.formula) return '<p class="ru-formula">'+fmt(b.formula)+'</p>';
  if(b.ojo) return '<p class="ru-ojo"><b>Ojo:</b> '+fmt(b.ojo)+'</p>';
  if(b.lista) return '<ul class="ru-lista">'+b.lista.map(function(x){ return '<li>'+fmt(x)+'</li>'; }).join("")+'</ul>';
  if(b.texto) return '<blockquote class="ru-texto" lang="'+(b.idioma||"es")+'">'+fmt(b.texto)+'</blockquote>';
  return '';
}
function fase(){
  window.scrollTo(0,0);
  var h=cabecera();
  if(st.fase===0){
    h+='<article class="card ru-lec">'+(st.l.aprende||[]).map(bloque).join("")+'</article>'+
      '<button type="button" class="btn" id="ru-sig">Ver ejemplo resuelto</button>';
  } else if(st.fase===1){
    var e=st.l.ejemplo;
    h+='<article class="card ru-lec"><header><h3 class="lbl">Ejemplo</h3></header><p>'+fmt(e.enunciado)+'</p><ol class="ru-pasos-ej">';
    for(var i=0;i<=st.paso && i<e.pasos.length;i++) h+='<li>'+fmt(e.pasos[i])+'</li>';
    h+='</ol>'+(st.paso>=e.pasos.length-1?'<p class="ru-formula">'+fmt(e.respuesta)+'</p>':'')+'</article>';
    h+= st.paso<e.pasos.length-1 ? '<button type="button" class="btn" id="ru-paso">Siguiente paso</button>'
                                 : '<button type="button" class="btn" id="ru-sig">A practicar</button>';
  } else {
    h+=pregunta();
  }
  cont().innerHTML=h;
  $("ru-salir").addEventListener("click", function(){ pintarCurso(st.c); });
  if($("ru-sig")) $("ru-sig").addEventListener("click", function(){ st.fase++; st.k=0; st.bien=0; st.paso=0; fase(); });
  if($("ru-paso")) $("ru-paso").addEventListener("click", function(){ st.paso++; fase(); });
  enlazarPregunta();
}
function lista(){ return st.fase===2 ? st.prac : st.chq; }
function pregunta(){
  var L=lista();
  if(st.k>=L.length) return final();
  var q=L[st.k];
  if(!q._o) q._o=mezclar(q.o.map(function(t,i){ return {t:t, ok:i===q.c}; }));
  var h='<article class="card"><header><h3 class="lbl">'+(st.fase===2?"Práctica":"Chequeo")+' · '+(st.k+1)+' / '+L.length+'</h3></header>'+
    '<p class="ru-q">'+fmt(q.p)+'</p><div class="alts">';
  q._o.forEach(function(o,i){
    h+='<button type="button" class="alt" data-i="'+i+'"><span class="k">'+"ABCDE"[i]+'</span><span>'+fmt(o.t)+'</span></button>';
  });
  h+='</div><div id="ru-fb"></div></article>';
  return h;
}
function enlazarPregunta(){
  cont().querySelectorAll(".alt[data-i]").forEach(function(b){
    b.addEventListener("click", function(){ responder(+b.dataset.i); });
  });
  if($("ru-next")) $("ru-next").addEventListener("click", function(){ st.k++; fase(); });
  if($("ru-rep")) $("ru-rep").addEventListener("click", function(){ st.fase=0; st.k=0; st.bien=0; fase(); });
  if($("ru-rechq")) $("ru-rechq").addEventListener("click", function(){ st.fase=3; st.k=0; st.bien=0; st.chq.forEach(function(q){ delete q._o; }); fase(); });
  if($("ru-mapa")) $("ru-mapa").addEventListener("click", function(){ pintarCurso(st.c); });
  if($("ru-otra")) $("ru-otra").addEventListener("click", function(){ empezar(st.c, $("ru-otra").dataset.l); });
}
function responder(i){
  var q=lista()[st.k], o=q._o[i];
  var alts=cont().querySelectorAll(".alt[data-i]");
  alts.forEach(function(b,j){ b.disabled=true; if(q._o[j].ok) b.classList.add("ok"); });
  if(o.ok) st.bien++; else alts[i].classList.add("no");
  /* En práctica hay explicación siempre; en el chequeo solo si fallas */
  var fb=$("ru-fb");
  fb.innerHTML='<p class="ru-res '+(o.ok?"bien":"mal")+'">'+(o.ok?"Correcto.":"No es esa.")+'</p>'+
    ((q.x && (st.fase===2 || !o.ok))?'<p class="muted ru-x">'+fmt(q.x)+'</p>':'')+
    '<button type="button" class="btn" id="ru-next">Continuar</button>';
  $("ru-next").addEventListener("click", function(){ st.k++; fase(); });
  $("ru-next").focus({preventScroll:true});
  $("ru-next").scrollIntoView({block:"nearest", behavior:"smooth"});
}
function final(){
  var L=lista(), n=L.length;
  if(st.fase===2){
    return '<article class="card"><header><h3 class="lbl">Práctica terminada</h3></header>'+
      '<h2 class="tnum" style="font-size:2.2rem;margin:6px 0 0">'+st.bien+' / '+n+'</h2>'+
      '<p class="muted">Ahora el chequeo: '+st.chq.length+' preguntas sin explicación previa. Necesitas '+Math.ceil(st.chq.length*APRUEBA)+' para avanzar.</p></article>'+
      '<div class="row"><button type="button" class="btn sec" id="ru-rep">Repasar la teoría</button><button type="button" class="btn" id="ru-sig">Empezar chequeo</button></div>';
  }
  var ok = st.bien >= Math.ceil(n*APRUEBA);
  var P=prog(), key=st.c.id+"/"+st.l.id, prev=P[key]||{};
  if(ok || !prev.ok) P[key]={ok: ok || !!prev.ok, nota: Math.max(st.bien, prev.nota||0), de:n, f:(function(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); })(new Date())};
  R.marcarDia();
  var ls=lecciones(st.c), idx=ls.indexOf(st.l), sig=ls[idx+1];
  return '<article class="card"><header><h3 class="lbl">'+(ok?"Lección aprobada":"Todavía no")+'</h3></header>'+
    '<h2 class="tnum" style="font-size:2.2rem;margin:6px 0 0">'+st.bien+' / '+n+'</h2>'+
    '<p class="muted">'+(ok ? (sig?"Desbloqueaste: "+esc(sig.titulo)+".":"Terminaste todas las lecciones disponibles de este curso.")
                          : "Necesitas "+Math.ceil(n*APRUEBA)+". Repasa la teoría y vuelve a intentarlo: el chequeo cambia de orden.")+'</p></article>'+
    '<div class="row">'+(ok
      ? '<button type="button" class="btn sec" id="ru-mapa">Ver el mapa</button>'+(sig?'<button type="button" class="btn" id="ru-otra" data-l="'+sig.id+'">Siguiente lección</button>':'')
      : '<button type="button" class="btn sec" id="ru-rep">Repasar la teoría</button><button type="button" class="btn" id="ru-rechq">Reintentar chequeo</button>')+'</div>';
}

window.RSM_VISTA = window.RSM_VISTA || {};
window.RSM_VISTA.ruta = inicio;
})();
