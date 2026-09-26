function envLi(n){ var li=document.createElement("li"); li.appendChild(n); return li; }
document.addEventListener("submit", function(e){ e.preventDefault(); });
/* Generadores: cada plantilla produce infinitas preguntas con números distintos.
   gen(L) recibe el nivel 1..10 y devuelve {q, a, k, s}. */
(function(root){
"use strict";

function R(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function esc(n){
  if(!isFinite(n)) return "0";
  var r=Math.round(n*100)/100;
  return (Math.abs(r-Math.round(r))<1e-9 ? String(Math.round(r)) : String(r));
}
function mcd(a,b){ while(b){ var t=b; b=a%b; a=t; } return Math.abs(a); }
function mcm(a,b){ return Math.abs(a*b)/mcd(a,b); }
function esc2(n){ return esc(n); }

/* arma alternativas a partir del valor correcto y una lista de distractores */
function armar(correcto, distractores, unidad){
  unidad = unidad || "";
  var vistos = {}, lista = [];
  function add(v){
    var t = (typeof v === "number" ? esc(v) : String(v)) + unidad;
    if(vistos[t]) return false;
    vistos[t]=1; lista.push(t); return true;
  }
  add(correcto);
  var clave = lista[0];
  for(var i=0;i<distractores.length && lista.length<4;i++) add(distractores[i]);
  var guard=0;
  while(lista.length<4 && guard++<50){
    var base = (typeof correcto==="number") ? correcto : parseFloat(correcto) || 10;
    add(Math.round((base*(1 + (R(-40,40)/100)))*100)/100 || base+R(1,9));
  }
  // barajar
  for(var j=lista.length-1;j>0;j--){ var k=Math.floor(Math.random()*(j+1)); var t=lista[j]; lista[j]=lista[k]; lista[k]=t; }
  var letras="ABCD", alt={}, key="A";
  lista.forEach(function(v,idx){ alt[letras[idx]]=v; if(v===clave) key=letras[idx]; });
  return {a:alt, k:key};
}

/* escribe "x", "3x", "-x" en vez de "1x" o "-1x" */
function coef(n, v){
  if(n===0) return "";
  if(n===1) return v;
  if(n===-1) return "-"+v;
  return n+v;
}
function term(n, v){ // con signo para ir después de otro término
  if(n===0) return "";
  return (n>0?" + ":" \u2212 ") + coef(Math.abs(n), v);
}
function P(id, curso, nombre, grupo, fn){ return {id:id, c:curso, n:nombre, g:grupo, gen:fn}; }

var T = [

/* ---------------- ARITMÉTICA ---------------- */
P("mcd_mcm","Aritmética","MCD y MCM","mat",function(L){
  var e = L<4 ? 1 : 2;
  var a = R(2,4+L)*R(2,3+e), b = R(2,4+L)*R(2,3+e);
  var quiere = pick(["MCD","MCM"]);
  var v = quiere==="MCD" ? mcd(a,b) : mcm(a,b);
  var d = [quiere==="MCD"?mcm(a,b):mcd(a,b), a*b, Math.abs(a-b), v*2];
  var r = armar(v,d);
  return {q:"Halle el "+quiere+" de "+a+" y "+b+".", a:r.a, k:r.k,
    s:"MCD("+a+","+b+") = "+mcd(a,b)+" y MCM("+a+","+b+") = "+mcm(a,b)+".\nRecuerda que MCD × MCM = producto de los números: "+mcd(a,b)+" × "+mcm(a,b)+" = "+a*b+"."};
}),

P("porc_suc","Aritmética","Porcentajes sucesivos","mat",function(L){
  var p = R(1,4)*5, q = R(1,4)*5, base = R(2,20)*100;
  var sube = L<4 ? false : pick([true,false]);
  var v = base*(1+ (sube?p:-p)/100)*(1 - q/100);
  var ingenuo = base*(1 + ((sube?p:-p) - q)/100);
  var r = armar(Math.round(v*100)/100, [Math.round(ingenuo*100)/100, base*(1-q/100), base*(1-p/100)]);
  return {q:"Un precio de S/ "+base+" "+(sube?"aumenta":"disminuye")+" "+p+"% y luego el nuevo precio disminuye "+q+"%. ¿Cuál es el precio final?",
    a:r.a, k:r.k,
    s:"Los porcentajes sucesivos se multiplican, no se suman.\n"+base+" × "+(1+(sube?p:-p)/100)+" × "+(1-q/100)+" = "+esc(v)+"\nEl error común es hacer "+((sube?p:-p)-q)+"% de una sola vez, que da "+esc(ingenuo)+"."};
}),

P("regla3","Aritmética","Regla de tres compuesta","mat",function(L){
  var ob=R(3,9), d=R(2,9), h=R(4,9), ob2=R(3,12);
  var obra = L>5 ? R(2,3) : 1;
  var d2 = (ob*d*h*obra)/(ob2*h);
  var r = armar(Math.round(d2*100)/100, [ob2*d/ob, d*obra, (ob2*d)/ob*h]);
  return {q:ob+" obreros hacen una obra en "+d+" días trabajando "+h+" horas diarias. ¿En cuántos días "+ob2+" obreros harán "+(obra>1?obra+" obras":"la misma obra")+" con la misma jornada?",
    a:r.a, k:r.k,
    s:"Obreros y días son inversamente proporcionales; obra y días son directamente proporcionales.\ndías = ("+ob+" × "+d+" × "+obra+") / "+ob2+" = "+esc(d2)+" días."};
}),

P("promedio","Aritmética","Promedios y mezclas","mat",function(L){
  var n1=R(2,6), n2=R(2,6), p1=R(8,16), p2=R(2,7);
  var v=(n1*p1+n2*p2)/(n1+n2);
  var r = armar(Math.round(v*100)/100, [(p1+p2)/2, (n1*p1+n2*p2)/2, p1-p2]);
  return {q:"Se mezclan "+n1+" kg de un producto de S/ "+p1+" el kilo con "+n2+" kg de otro de S/ "+p2+" el kilo. ¿Cuál es el precio por kilo de la mezcla?",
    a:r.a, k:r.k,
    s:"Es un promedio ponderado, no el promedio simple.\n("+n1+"×"+p1+" + "+n2+"×"+p2+") / ("+n1+"+"+n2+") = "+esc(v)+" soles por kilo.\nEl promedio simple daría "+esc((p1+p2)/2)+", que sería correcto solo si las cantidades fueran iguales."};
}),

/* ---------------- ÁLGEBRA ---------------- */
P("prod_not","Álgebra","Productos notables","mat",function(L){
  var a=R(2,3+L), b=R(2,3+L);
  var s=a+b, p=a*b;
  var tipo = L<4 ? 1 : pick([1,2]);
  if(tipo===1){
    var v=s*s-2*p;
    var r=armar(v,[s*s, s*s+2*p, p*p]);
    return {q:"Si x + y = "+s+" y x·y = "+p+", halle x² + y².", a:r.a, k:r.k,
      s:"x² + y² = (x+y)² − 2xy = "+s+"² − 2("+p+") = "+(s*s)+" − "+(2*p)+" = "+v+".\nEl error típico es responder (x+y)² = "+(s*s)+" directamente."};
  }
  var v2=s*s-4*p;
  var r2=armar(v2,[s*s-2*p, s*s+4*p, Math.abs(a-b)]);
  return {q:"Si x + y = "+s+" y x·y = "+p+", halle (x − y)².", a:r2.a, k:r2.k,
    s:"(x−y)² = (x+y)² − 4xy = "+(s*s)+" − "+(4*p)+" = "+v2+"."};
}),

P("cuadratica","Álgebra","Ecuación de segundo grado","mat",function(L){
  var r1=R(-3-L,6+L)||1, r2=R(-3-L,6+L)||2;
  var b=-(r1+r2), c=r1*r2;
  var ec = "x\u00b2" + term(b,"x") + (c===0 ? "" : (c>0?" + ":" \u2212 ")+Math.abs(c));
  var q = pick(["suma","producto","mayor"]);
  var v = q==="suma" ? r1+r2 : q==="producto" ? r1*r2 : Math.max(r1,r2);
  var r = armar(v, [-b, -c, Math.min(r1,r2), r1+r2+1]);
  return {q:"En la ecuación "+ec+" = 0, halle "+
      (q==="suma"?"la suma de sus raíces":q==="producto"?"el producto de sus raíces":"la raíz mayor")+".",
    a:r.a, k:r.k,
    s:"Las raíces son "+r1+" y "+r2+".\nPor Cardano-Vieta: suma = −b/a = "+(r1+r2)+" y producto = c/a = "+(r1*r2)+".\nNo hace falta resolver la ecuación para la suma o el producto."};
}),

P("sistema","Álgebra","Sistema de dos ecuaciones","mat",function(L){
  var x=R(1,4+L), y=R(1,4+L);
  var a1=R(1,4), b1=R(1,4), a2=R(1,4), b2=R(1,5);
  if(a1*b2-a2*b1===0) b2+=1;
  var c1=a1*x+b1*y, c2=a2*x+b2*y;
  var q=pick(["x","y","x+y"]);
  var v = q==="x"?x:q==="y"?y:x+y;
  var r=armar(v,[q==="x"?y:x, x*y, Math.abs(x-y)]);
  return {q:"Resuelva el sistema:\n"+coef(a1,"x")+" + "+coef(b1,"y")+" = "+c1+"\n"+coef(a2,"x")+" + "+coef(b2,"y")+" = "+c2+"\nHalle "+q+".",
    a:r.a, k:r.k,
    s:"Por reducción o sustitución: x = "+x+", y = "+y+".\nVerificación: "+a1+"("+x+") + "+b1+"("+y+") = "+c1+" ✓"};
}),

P("exponentes","Álgebra","Leyes de exponentes","mat",function(L){
  var base=pick([2,3,5]), m=R(2,4+Math.floor(L/2)), n=R(1,3+Math.floor(L/2));
  var v=Math.pow(base,m-n);
  var r=armar(v,[Math.pow(base,m+n), Math.pow(base,m*n), Math.pow(base,m)-Math.pow(base,n)]);
  return {q:"Simplifique y calcule: "+base+"^"+m+" ÷ "+base+"^"+n,
    a:r.a, k:r.k,
    s:"Al dividir potencias de igual base se restan los exponentes: "+base+"^("+m+"−"+n+") = "+base+"^"+(m-n)+" = "+v+"."};
}),

/* ---------------- GEOMETRÍA ---------------- */
P("angulos","Geometría","Ángulos en el triángulo","mat",function(L){
  var A=R(30,80), B=R(30,180-A-20);
  var C=180-A-B;
  var q=pick(["C","ext"]);
  var v= q==="C" ? C : 180-C;
  var r=armar(v,[C, 180-A, 90-C, A+B+C]);
  return {q:"En un triángulo, dos ángulos interiores miden "+A+"° y "+B+"°. Halle "+(q==="C"?"el tercer ángulo":"el ángulo exterior correspondiente al tercer vértice")+".",
    a:r.a, k:r.k, s:"La suma de los ángulos interiores es 180°: el tercero mide 180 − "+A+" − "+B+" = "+C+"°.\n"+(q==="ext"?"El ángulo exterior es su suplemento: 180 − "+C+" = "+(180-C)+"°.":"")};
}),

P("pitagoras","Geometría","Teorema de Pitágoras","mat",function(L){
  var ternas=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41],[20,21,29]];
  var t=pick(ternas), k=L<4?1:R(1,3);
  var a=t[0]*k, b=t[1]*k, c=t[2]*k;
  var falta=pick(["hip","cat"]);
  var v= falta==="hip" ? c : a;
  var r=armar(v, falta==="hip"?[a+b,Math.abs(b-a),Math.round(Math.sqrt(b*b-a*a))]:[c-b, a+b, Math.round(Math.sqrt(c*c+b*b))]);
  return {q: falta==="hip"
      ? "Los catetos de un triángulo rectángulo miden "+a+" y "+b+". Halle la hipotenusa."
      : "En un triángulo rectángulo la hipotenusa mide "+c+" y un cateto "+b+". Halle el otro cateto.",
    a:r.a, k:r.k,
    s:"a² + b² = c² → "+a+"² + "+b+"² = "+c+"².\nEs la terna "+t.join("-")+(k>1?" multiplicada por "+k:"")+". Reconocer las ternas ahorra todo el cálculo."};
}),

P("areas","Geometría","Áreas","mat",function(L){
  var tipo=pick(["triangulo","circulo","trapecio"]);
  if(tipo==="triangulo"){
    var b=R(4,10+L)*2, h=R(3,9+L);
    var v=b*h/2;
    var r=armar(v,[b*h, b+h, (b+h)/2]);
    return {q:"Halle el área de un triángulo de base "+b+" cm y altura "+h+" cm.", a:r.a, k:r.k,
      s:"A = b·h/2 = "+b+"×"+h+"/2 = "+v+" cm². Olvidar dividir entre 2 da "+(b*h)+", el error más frecuente."};
  }
  if(tipo==="circulo"){
    var rad=R(2,7+L);
    var v2=rad*rad;
    var r2=armar(v2+"π",[2*rad+"π", rad+"π", (2*rad*rad)+"π"]);
    return {q:"Halle el área de un círculo de radio "+rad+" cm, en términos de π.", a:r2.a, k:r2.k,
      s:"A = πr² = π("+rad+")² = "+v2+"π cm².\nLa longitud de la circunferencia sería 2πr = "+(2*rad)+"π, que es otra cosa."};
  }
  var B=R(6,14+L), b2=R(3,B-1), h2=R(3,9);
  var v3=(B+b2)*h2/2;
  var r3=armar(v3,[B*h2, (B+b2)*h2, (B-b2)*h2/2]);
  return {q:"Un trapecio tiene bases de "+B+" cm y "+b2+" cm, y altura "+h2+" cm. Halle su área.", a:r3.a, k:r3.k,
    s:"A = (B + b)·h / 2 = ("+B+" + "+b2+")×"+h2+"/2 = "+v3+" cm²."};
}),

/* ---------------- TRIGONOMETRÍA ---------------- */
P("razones","Trigonometría","Razones trigonométricas","mat",function(L){
  var t=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25]]);
  var k=L<5?1:R(1,3);
  var co=t[0]*k, ca=t[1]*k, h=t[2]*k;
  var razon=pick(["sen","cos","tan"]);
  var v = razon==="sen" ? co+"/"+h : razon==="cos" ? ca+"/"+h : co+"/"+ca;
  var r=armar(v,[ca+"/"+h, co+"/"+h, ca+"/"+co, h+"/"+co]);
  return {q:"En un triángulo rectángulo, el cateto opuesto al ángulo θ mide "+co+", el adyacente "+ca+" y la hipotenusa "+h+". Halle "+razon+" θ.",
    a:r.a, k:r.k,
    s:"sen = opuesto/hipotenusa = "+co+"/"+h+"\ncos = adyacente/hipotenusa = "+ca+"/"+h+"\ntan = opuesto/adyacente = "+co+"/"+ca};
}),

P("conversion","Trigonometría","Conversión de ángulos","mat",function(L){
  var g=pick([30,45,60,90,120,135,150,180,210,270])*(L>6?1:1);
  var frac=g/180;
  function fr(x){ var den=1/x; var d=Math.round(den*12)/12;
    var n=1, dd=Math.round(1/x);
    if(Math.abs(1/x-dd)<0.001) return "π/"+dd;
    var num=Math.round(x*12), de=12, gg=mcd(num,de);
    return (num/gg)+"π/"+(de/gg);
  }
  var v=fr(frac);
  var r=armar(v,[fr(frac*2), fr(frac/2), g+"π"]);
  return {q:"Convierta "+g+"° a radianes.", a:r.a, k:r.k,
    s:"180° = π rad, entonces "+g+"° = "+g+"π/180 = "+v+" rad."};
}),

/* ---------------- FÍSICA ---------------- */
P("mru","Física","MRU","mat",function(L){
  var v0=R(4,20)*(L>5?R(1,3):1), t=R(2,12);
  var d=v0*t;
  var q=pick(["d","t"]);
  if(q==="d"){
    var r=armar(d,[v0+t, d/2, v0*t*2]);
    return {q:"Un móvil viaja con velocidad constante de "+v0+" m/s durante "+t+" s. ¿Qué distancia recorre?",
      a:r.a, k:r.k, s:"En MRU: d = v·t = "+v0+" × "+t+" = "+d+" m."};
  }
  var r2=armar(t,[d*v0, d+v0, v0/d]);
  return {q:"Un móvil con velocidad constante de "+v0+" m/s recorre "+d+" m. ¿Cuánto tiempo tarda?",
    a:r2.a, k:r2.k, s:"t = d/v = "+d+"/"+v0+" = "+t+" s."};
}),

P("mruv","Física","MRUV","mat",function(L){
  var v0=R(0,12), a=R(1,5), t=R(2,8);
  var vf=v0+a*t, d=v0*t+a*t*t/2;
  var q= L<4 ? "vf" : pick(["vf","d"]);
  if(q==="vf"){
    var r=armar(vf,[v0*t+a, a*t, v0+a]);
    return {q:"Un móvil parte con "+v0+" m/s y acelera a "+a+" m/s² durante "+t+" s. ¿Cuál es su velocidad final?",
      a:r.a, k:r.k, s:"vf = v₀ + a·t = "+v0+" + "+a+"×"+t+" = "+vf+" m/s."};
  }
  var r2=armar(d,[v0*t+a*t*t, vf*t, v0*t]);
  return {q:"Un móvil parte con "+v0+" m/s y acelera a "+a+" m/s² durante "+t+" s. ¿Qué distancia recorre?",
    a:r2.a, k:r2.k,
    s:"d = v₀t + ½at² = "+v0+"×"+t+" + ½×"+a+"×"+t+"² = "+esc(d)+" m.\nOlvidar el ½ da "+esc(v0*t+a*t*t)+", error clásico."};
}),

P("caida","Física","Caída libre","mat",function(L){
  var t=R(1,6), g=10;
  var h=g*t*t/2, v=g*t;
  var q=pick(["h","v"]);
  var val= q==="h"?h:v;
  var r=armar(val,[q==="h"?g*t*t:g+t, q==="h"?g*t:h, t*t]);
  return {q:"Se suelta un cuerpo desde el reposo y cae durante "+t+" s (g = 10 m/s²). Halle "+(q==="h"?"la altura de caída":"la velocidad al final"),
    a:r.a, k:r.k,
    s:"Desde el reposo: v = g·t = "+v+" m/s y h = ½g·t² = "+h+" m."};
}),

P("newton","Física","Segunda ley de Newton","mat",function(L){
  var m=R(2,12), a=R(1,6);
  var F=m*a;
  var extra = L>5;
  var roce = extra ? R(1,10) : 0;
  var Fap = F + roce;
  var q = extra ? "F" : pick(["F","a"]);
  if(q==="F"){
    var r=armar(Fap,[F, m+a, m*a*10, m*10]);
    return {q:"Sobre un bloque de "+m+" kg que acelera a "+a+" m/s²"+(extra?" actúa una fuerza de rozamiento de "+roce+" N":"")+". ¿Cuál es la fuerza aplicada?",
      a:r.a, k:r.k,
      s:"F_neta = m·a = "+m+"×"+a+" = "+F+" N."+(extra?"\nLa fuerza aplicada debe vencer además el rozamiento: "+F+" + "+roce+" = "+Fap+" N.":"")};
  }
  var r2=armar(a,[F*m, F+m, m/F]);
  return {q:"Una fuerza neta de "+F+" N actúa sobre un cuerpo de "+m+" kg. ¿Cuál es su aceleración?",
    a:r2.a, k:r2.k, s:"a = F/m = "+F+"/"+m+" = "+a+" m/s²."};
}),

/* ---------------- HABILIDAD LÓGICO MATEMÁTICA ---------------- */
P("edades","HLM","Edades","mat",function(L){
  var hijo=R(5,18), k=pick([2,3,4]);
  var padre=hijo*k;
  var anios=R(3,15);
  var v=padre+anios;
  var q=pick(["futuro","suma"]);
  if(q==="futuro"){
    var r=armar(v,[padre, hijo+anios, padre+hijo]);
    return {q:"La edad de un padre es "+k+" veces la de su hijo, que tiene "+hijo+" años. ¿Qué edad tendrá el padre dentro de "+anios+" años?",
      a:r.a, k:r.k, s:"Edad actual del padre = "+k+"×"+hijo+" = "+padre+".\nDentro de "+anios+" años: "+padre+" + "+anios+" = "+v+" años."};
  }
  var r2=armar(padre+hijo,[padre-hijo, padre*hijo, padre]);
  return {q:"Un padre tiene "+k+" veces la edad de su hijo. Si el hijo tiene "+hijo+" años, ¿cuánto suman ambas edades?",
    a:r2.a, k:r2.k, s:"Padre = "+padre+", hijo = "+hijo+". Suma = "+(padre+hijo)+"."};
}),

P("trabajo","HLM","Trabajo y obreros","mat",function(L){
  var a=R(4,14), b=R(4,14);
  if(a===b) b+=2;
  var juntos=(a*b)/(a+b);
  var r=armar(Math.round(juntos*100)/100,[a+b, (a+b)/2, Math.abs(a-b)]);
  return {q:"A solo puede hacer una obra en "+a+" días y B solo en "+b+" días. ¿En cuántos días la hacen juntos?",
    a:r.a, k:r.k,
    s:"Se suman los rendimientos, no los días.\n1/"+a+" + 1/"+b+" = ("+a+"+"+b+")/("+a+"×"+b+")\ndías = "+a*b+"/"+(a+b)+" = "+esc(juntos)+" días.\nSumar los días ("+(a+b)+") es el error habitual."};
}),

P("sucesion","HLM","Sucesiones","mat",function(L){
  var tipo = L<4 ? "arit" : pick(["arit","geo","cuad"]);
  var a0=R(1,9), d=R(2,7), serie=[], sig;
  if(tipo==="arit"){
    for(var i=0;i<5;i++) serie.push(a0+d*i);
    sig=a0+d*5;
    var r=armar(sig,[sig+d, serie[4]+d+1, serie[4]*2]);
    return {q:"¿Qué número sigue?\n"+serie.join("; ")+"; ...", a:r.a, k:r.k,
      s:"Cada término aumenta en "+d+" (progresión aritmética). El siguiente es "+serie[4]+" + "+d+" = "+sig+"."};
  }
  if(tipo==="geo"){
    var q2=pick([2,3]); a0=R(1,5);
    for(var j=0;j<5;j++) serie.push(a0*Math.pow(q2,j));
    sig=a0*Math.pow(q2,5);
    var r2=armar(sig,[serie[4]+q2, serie[4]*2, serie[4]+serie[3]]);
    return {q:"¿Qué número sigue?\n"+serie.join("; ")+"; ...", a:r2.a, k:r2.k,
      s:"Cada término se multiplica por "+q2+" (progresión geométrica). El siguiente es "+serie[4]+" × "+q2+" = "+sig+"."};
  }
  for(var m=1;m<=5;m++) serie.push(m*m+a0);
  sig=36+a0;
  var r3=armar(sig,[serie[4]+5, serie[4]*2, sig+1]);
  return {q:"¿Qué número sigue?\n"+serie.join("; ")+"; ...", a:r3.a, k:r3.k,
    s:"Son los cuadrados perfectos más "+a0+": 1,4,9,16,25,36 (+"+a0+"). El siguiente es 36 + "+a0+" = "+sig+"."};
}),

P("operador","HLM","Operadores matemáticos","mat",function(L){
  var p=R(2,5), q=R(1,6), x=R(2,9), y=R(1,8);
  var v=p*x+q*y;
  var r=armar(v,[p*y+q*x, x+y, p*x*q*y]);
  return {q:"Se define a \u2206 b = "+coef(p,"a")+" + "+coef(q,"b")+". Calcule "+x+" \u2206 "+y+".",
    a:r.a, k:r.k,
    s:"Se reemplaza en el orden dado: a = "+x+", b = "+y+".\n"+p+"("+x+") + "+q+"("+y+") = "+(p*x)+" + "+(q*y)+" = "+v+".\nInvertir el orden da "+(p*y+q*x)+"."};
}),

P("movil","HLM","Encuentro de móviles","mat",function(L){
  var v1=R(4,15), v2=R(4,15), d=(v1+v2)*R(2,9);
  var t=d/(v1+v2);
  var r=armar(t,[d/Math.abs(v1-v2||1), d/v1, (v1+v2)/d]);
  return {q:"Dos móviles parten simultáneamente al encuentro desde puntos separados "+d+" m, con velocidades de "+v1+" m/s y "+v2+" m/s. ¿En cuántos segundos se encuentran?",
    a:r.a, k:r.k,
    s:"Al ir al encuentro las velocidades se suman: "+v1+" + "+v2+" = "+(v1+v2)+" m/s.\nt = "+d+" / "+(v1+v2)+" = "+esc(t)+" s.\nSi fueran en el mismo sentido se restarían."};
})

];

root.GEN = {
  plantillas: T,
  /* crea una pregunta lista para la app */
  crear: function(tpl, nivel){
    var o = tpl.gen(Math.max(1, Math.min(10, nivel|0)));
    return {gen:true, tpl:tpl.id, c:tpl.c, g:"gen", nivel:nivel,
            q:o.q, a:o.a, k:o.k, s:o.s};
  }
};
})(typeof module!=="undefined"&&module.exports ? module.exports : (typeof window!=="undefined"?window:globalThis));
