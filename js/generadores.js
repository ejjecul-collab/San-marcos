/* Generadores de ejercicios para las lecciones.
   Cada uno devuelve {p, o:[4 opciones], c:índice correcto, x:explicación}.
   Una lección los usa con  "generador": {"id": "exp_mult", "n": 3}  */
(function(){
"use strict";
function ent(a,b){ return a+Math.floor(Math.random()*(b-a+1)); }
function elige(a){ return a[Math.floor(Math.random()*a.length)]; }
/* arma la pregunta: correcta primero, distractores sin repetir */
function armar(p, ok, malas, x){
  var o=[ok];
  malas.forEach(function(m){ if(o.length<4 && o.indexOf(m)<0) o.push(m); });
  return {p:p, o:o, c:0, x:x};
}
function pot(b,e){ return b+"^{"+e+"}"; }

window.GEN_RUTA = {
  /* a^m·a^n  y  a^m÷a^n */
  exp_mult: function(){
    var b=elige(["x","a","m","y","5","3"]), m=ent(3,9), n=ent(2,m-1);
    if(Math.random()<.5){
      return armar("Simplifica: "+pot(b,m)+" · "+pot(b,n), pot(b,m+n),
        [pot(b,m*n), pot(b,m-n), pot(b,m+n+1), pot(b,m+n-1), pot(b,2*m+n)],
        "Misma base: se conserva y se suman los exponentes. "+m+" + "+n+" = "+(m+n)+".");
    }
    return armar("Simplifica: "+pot(b,m)+" ÷ "+pot(b,n), pot(b,m-n),
      [pot(b,m+n), (m%n===0 ? pot(b,m/n) : pot(b,m-n+1)), pot(b,m*n), pot(b,m-n+1), pot(b,m-n-1)],
      "Misma base: se conserva y se restan los exponentes. "+m+" − "+n+" = "+(m-n)+".");
  },
  /* (a^m)^n  y  exponente negativo */
  exp_potpot: function(){
    if(Math.random()<.5){
      var b=elige(["x","a","y","2"]), m=ent(2,6), n=ent(2,5);
      return armar("Simplifica: ("+pot(b,m)+")^{"+n+"}", pot(b,m*n),
        [pot(b,m+n), pot(b,Math.pow(m,n)), pot(b,m*n+1), pot(b,m*n-1), pot(b,m*n+2)],
        "Potencia de potencia: se multiplican los exponentes. "+m+" · "+n+" = "+(m*n)+".");
    }
    var k=ent(2,5), e=ent(1,3), v=Math.pow(k,e);
    return armar("Calcula: "+k+"^{−"+e+"}", "1/"+v,
      ["−"+v, "−1/"+v, "1/"+(k*e), String(v), "1/"+(v+k)],
      "El exponente negativo manda la potencia al denominador: 1/"+k+"^{"+e+"} = 1/"+v+". No vuelve negativo al número.");
  },
  /* a^(p/q) con raíz exacta */
  rad_frac: function(){
    var q=elige([2,3]), r=ent(2,q===2?6:4), p=ent(1,3), b=Math.pow(r,q), v=Math.pow(r,p);
    var raiz = q===2 ? "√"+b : "∛"+b;
    return armar("Calcula: "+b+"^{"+p+"/"+q+"}", String(v),
      [String(r*p), String(Math.pow(r,p+1)), String(b*p), String(b), String(v*r+1), String(v+1), String(v+2)],
      "Primero la raíz (el denominador): "+raiz+" = "+r+". Luego la potencia (el numerador): "+r+"^{"+p+"} = "+v+".");
  }
};
})();
