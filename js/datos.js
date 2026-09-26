/* Datos: temario del Área C y recursos. El horario lo arma cada estudiante. */
(function(root){
"use strict";

/* El horario ya no viene fijo: lo arma cada estudiante en "Mi horario"
   (js/calendario.js). Estas listas se llenan al cargar la app. */
var SENATI = [];
var ESTUDIO = [];

/* Temario del Área C. p = prerrequisitos */
var TEMARIO = [
 {id:"ar1", c:"Aritmética", n:"Operaciones, potencias y raíces", p:[]},
 {id:"ar2", c:"Aritmética", n:"Fracciones y decimales", p:["ar1"]},
 {id:"ar3", c:"Aritmética", n:"Razones y proporciones", p:["ar2"]},
 {id:"ar4", c:"Aritmética", n:"Porcentajes y descuentos sucesivos", p:["ar3"]},
 {id:"ar5", c:"Aritmética", n:"Regla de tres simple y compuesta", p:["ar3"]},
 {id:"ar6", c:"Aritmética", n:"Divisibilidad y números primos", p:["ar1"]},
 {id:"ar7", c:"Aritmética", n:"MCD y MCM", p:["ar6"]},
 {id:"ar8", c:"Aritmética", n:"Promedios y mezclas", p:["ar3"]},
 {id:"ar9", c:"Aritmética", n:"Conteo de números y sistemas de numeración", p:["ar1"]},

 {id:"al1", c:"Álgebra", n:"Leyes de exponentes y radicales", p:["ar1"]},
 {id:"al2", c:"Álgebra", n:"Polinomios y grados", p:["al1"]},
 {id:"al3", c:"Álgebra", n:"Productos notables", p:["al2"]},
 {id:"al4", c:"Álgebra", n:"División algebraica y cocientes notables", p:["al3"]},
 {id:"al5", c:"Álgebra", n:"Factorización", p:["al3"]},
 {id:"al6", c:"Álgebra", n:"Ecuaciones de primer grado", p:["al2"]},
 {id:"al7", c:"Álgebra", n:"Ecuación cuadrática y Cardano-Vieta", p:["al5","al6"]},
 {id:"al8", c:"Álgebra", n:"Sistemas de ecuaciones", p:["al6"]},
 {id:"al9", c:"Álgebra", n:"Inecuaciones y valor absoluto", p:["al7"]},
 {id:"al10",c:"Álgebra", n:"Funciones: dominio, rango y gráficas", p:["al7"]},
 {id:"al11",c:"Álgebra", n:"Logaritmos", p:["al1","al10"]},
 {id:"al12",c:"Álgebra", n:"Progresiones aritmética y geométrica", p:["al6"]},
 {id:"al13",c:"Álgebra", n:"Matrices y determinantes", p:["al8"]},

 {id:"ge1", c:"Geometría", n:"Ángulos y rectas paralelas", p:[]},
 {id:"ge2", c:"Geometría", n:"Triángulos y líneas notables", p:["ge1"]},
 {id:"ge3", c:"Geometría", n:"Congruencia y semejanza", p:["ge2"]},
 {id:"ge4", c:"Geometría", n:"Relaciones métricas y Pitágoras", p:["ge3"]},
 {id:"ge5", c:"Geometría", n:"Cuadriláteros y polígonos", p:["ge2"]},
 {id:"ge6", c:"Geometría", n:"Circunferencia y ángulos en el círculo", p:["ge5"]},
 {id:"ge7", c:"Geometría", n:"Áreas de regiones planas", p:["ge5","ge6"]},
 {id:"ge8", c:"Geometría", n:"Sólidos: prisma, pirámide, cilindro, cono, esfera", p:["ge7"]},
 {id:"ge9", c:"Geometría", n:"Geometría analítica: recta y circunferencia", p:["al10","ge6"]},

 {id:"tr1", c:"Trigonometría", n:"Sistemas de medida angular", p:["ar2"]},
 {id:"tr2", c:"Trigonometría", n:"Razones en el triángulo rectángulo", p:["ge4","tr1"]},
 {id:"tr3", c:"Trigonometría", n:"Ángulos notables y reducción al primer cuadrante", p:["tr2"]},
 {id:"tr4", c:"Trigonometría", n:"Circunferencia trigonométrica", p:["tr3"]},
 {id:"tr5", c:"Trigonometría", n:"Identidades fundamentales", p:["tr3"]},
 {id:"tr6", c:"Trigonometría", n:"Ley de senos y cosenos", p:["tr5"]},
 {id:"tr7", c:"Trigonometría", n:"Funciones trigonométricas y sus gráficas", p:["tr4","al10"]},

 {id:"fi1", c:"Física", n:"Magnitudes, unidades y análisis dimensional", p:["ar1"]},
 {id:"fi2", c:"Física", n:"Vectores", p:["fi1","tr2"]},
 {id:"fi3", c:"Física", n:"MRU y MRUV", p:["fi1"]},
 {id:"fi4", c:"Física", n:"Caída libre y movimiento parabólico", p:["fi3","fi2"]},
 {id:"fi5", c:"Física", n:"Estática", p:["fi2"]},
 {id:"fi6", c:"Física", n:"Leyes de Newton y dinámica", p:["fi3","fi5"]},
 {id:"fi7", c:"Física", n:"Trabajo, energía y potencia", p:["fi6"]},
 {id:"fi8", c:"Física", n:"Cantidad de movimiento y choques", p:["fi6"]},
 {id:"fi9", c:"Física", n:"Hidrostática", p:["fi5"]},
 {id:"fi10",c:"Física", n:"Calor y termodinámica", p:["fi7"]},
 {id:"fi11",c:"Física", n:"Electrostática y corriente eléctrica", p:["fi7"]},
 {id:"fi12",c:"Física", n:"Ondas, sonido y óptica", p:["fi4"]},

 {id:"qu1", c:"Química", n:"Materia, estructura atómica", p:[]},
 {id:"qu2", c:"Química", n:"Tabla periódica y propiedades", p:["qu1"]},
 {id:"qu3", c:"Química", n:"Enlace químico", p:["qu2"]},
 {id:"qu4", c:"Química", n:"Nomenclatura inorgánica", p:["qu3"]},
 {id:"qu5", c:"Química", n:"Unidades químicas de masa y mol", p:["qu1","ar2"]},
 {id:"qu6", c:"Química", n:"Reacciones y estequiometría", p:["qu4","qu5"]},
 {id:"qu7", c:"Química", n:"Soluciones y concentraciones", p:["qu6"]},
 {id:"qu8", c:"Química", n:"Ácidos, bases y pH", p:["qu7"]},
 {id:"qu9", c:"Química", n:"Química orgánica básica", p:["qu4"]},

 {id:"bi1", c:"Biología", n:"Química de la vida y biomoléculas", p:[]},
 {id:"bi2", c:"Biología", n:"Célula: estructura y funciones", p:["bi1"]},
 {id:"bi3", c:"Biología", n:"Metabolismo: respiración y fotosíntesis", p:["bi2"]},
 {id:"bi4", c:"Biología", n:"División celular", p:["bi2"]},
 {id:"bi5", c:"Biología", n:"Genética mendeliana", p:["bi4"]},
 {id:"bi6", c:"Biología", n:"Sistemas del cuerpo humano", p:["bi2"]},
 {id:"bi7", c:"Biología", n:"Ecología y biodiversidad", p:["bi3"]},
 {id:"bi8", c:"Biología", n:"Evolución", p:["bi5"]},

 {id:"hm1", c:"HLM", n:"Sucesiones y series", p:["al12"]},
 {id:"hm2", c:"HLM", n:"Planteo de ecuaciones", p:["al6"]},
 {id:"hm3", c:"HLM", n:"Edades", p:["hm2"]},
 {id:"hm4", c:"HLM", n:"Móviles y cronometría", p:["hm2"]},
 {id:"hm5", c:"HLM", n:"Trabajo y rendimiento", p:["ar5"]},
 {id:"hm6", c:"HLM", n:"Operadores matemáticos", p:["al2"]},
 {id:"hm7", c:"HLM", n:"Razonamiento lógico y verdades", p:[]},
 {id:"hm8", c:"HLM", n:"Ordenamiento y cuadros de decisión", p:["hm7"]},
 {id:"hm9", c:"HLM", n:"Conteo de figuras y análisis combinatorio", p:["ar9"]},
 {id:"hm10",c:"HLM", n:"Probabilidades", p:["hm9"]},

 {id:"hv1", c:"Habilidad Verbal", n:"Comprensión lectora: idea principal", p:[]},
 {id:"hv2", c:"Habilidad Verbal", n:"Inferencia y extrapolación", p:["hv1"]},
 {id:"hv3", c:"Habilidad Verbal", n:"Término en contexto", p:["hv1"]},
 {id:"hv4", c:"Habilidad Verbal", n:"Eliminación de oraciones y plan de redacción", p:["hv1"]},
 {id:"hv5", c:"Habilidad Verbal", n:"Comprensión lectora en inglés", p:["hv1"]},

 {id:"le1", c:"Lenguaje", n:"Fonética y ortografía", p:[]},
 {id:"le2", c:"Lenguaje", n:"Morfología: clases de palabras", p:["le1"]},
 {id:"le3", c:"Lenguaje", n:"Sintaxis: oración simple y compuesta", p:["le2"]},
 {id:"le4", c:"Lenguaje", n:"Semántica y normativa", p:["le2"]},
 {id:"li1", c:"Literatura", n:"Géneros y figuras literarias", p:[]},
 {id:"li2", c:"Literatura", n:"Literatura peruana", p:["li1"]},
 {id:"li3", c:"Literatura", n:"Literatura universal e hispanoamericana", p:["li1"]},

 {id:"hi1", c:"Historia", n:"Perú prehispánico", p:[]},
 {id:"hi2", c:"Historia", n:"Conquista y Virreinato", p:["hi1"]},
 {id:"hi3", c:"Historia", n:"Emancipación e Independencia", p:["hi2"]},
 {id:"hi4", c:"Historia", n:"Perú republicano siglo XIX", p:["hi3"]},
 {id:"hi5", c:"Historia", n:"Perú siglo XX y contemporáneo", p:["hi4"]},
 {id:"hi6", c:"Historia", n:"Historia universal: revoluciones y guerras mundiales", p:[]},
 {id:"gg1", c:"Geografía", n:"Geografía física del Perú", p:[]},
 {id:"gg2", c:"Geografía", n:"Regiones naturales y recursos", p:["gg1"]},
 {id:"gg3", c:"Geografía", n:"Geografía humana y económica", p:["gg2"]},
 {id:"ec1", c:"Economía", n:"Conceptos básicos y agentes económicos", p:[]},
 {id:"ec2", c:"Economía", n:"Mercado, oferta y demanda", p:["ec1"]},
 {id:"ec3", c:"Economía", n:"Dinero, inflación y sistema financiero", p:["ec2"]},
 {id:"ci1", c:"Educación Cívica", n:"Constitución y derechos", p:[]},
 {id:"ci2", c:"Educación Cívica", n:"Estado peruano y poderes", p:["ci1"]},
 {id:"ci3", c:"Educación Cívica", n:"Defensa nacional y seguridad ciudadana", p:["ci2"]},
 {id:"fs1", c:"Filosofía", n:"Problemas y ramas de la filosofía", p:[]},
 {id:"fs2", c:"Filosofía", n:"Filosofía antigua y medieval", p:["fs1"]},
 {id:"fs3", c:"Filosofía", n:"Filosofía moderna y contemporánea", p:["fs2"]},
 {id:"fs4", c:"Filosofía", n:"Lógica proposicional", p:["hm7"]},
 {id:"ps1", c:"Psicología", n:"Bases biológicas de la conducta", p:[]},
 {id:"ps2", c:"Psicología", n:"Procesos cognitivos", p:["ps1"]},
 {id:"ps3", c:"Psicología", n:"Personalidad, aprendizaje y desarrollo", p:["ps2"]}
];

/* Recursos. Los enlaces de búsqueda no caducan aunque un canal cambie de nombre. */
var LIBROS = [
  {t:"Colección Lumbreras (por curso)", d:"El estándar de las academias peruanas. Teoría y problemas tipo examen para Aritmética, Álgebra, Geometría, Trigonometría, Física y Química.", g:"Todos"},
  {t:"Álgebra de Baldor", d:"Clásico para reforzar fundamentos si el álgebra te cuesta desde la base.", g:"Álgebra"},
  {t:"Física de Serway (nivel introductorio)", d:"Para entender el porqué, no solo la fórmula. Útil si apuntas más allá del examen.", g:"Física"},
  {t:"Cómo plantear y resolver problemas, de George Polya", d:"El método de los cuatro pasos. El libro que más te va a servir para problemas que no sabes cómo empezar.", g:"Método"},
  {t:"Compendio de Historia del Perú y Literatura peruana", d:"Para humanidades, un compendio de academia rinde más que un libro largo.", g:"Humanidades"}
];

function yt(q){ return "https://www.youtube.com/results?search_query="+encodeURIComponent(q); }
var CANALES = [
  {t:"Trucos de aritmética para San Marcos", u:yt("trucos aritmetica examen admision san marcos"), d:"Métodos rápidos de cálculo para ahorrar minutos."},
  {t:"Álgebra: factorización y cuadráticas", u:yt("factorizacion aspa simple ejercicios resueltos admision"), d:"Busca videos con ejercicios resueltos, no clases teóricas largas."},
  {t:"Geometría y trigonometría nivel admisión", u:yt("geometria admision san marcos ejercicios resueltos"), d:"Prioriza los que resuelven exámenes anteriores."},
  {t:"Física para admisión", u:yt("fisica admision universidad peru ejercicios resueltos MRUV"), d:"Enfócate en cinemática y dinámica, que es lo que más cae."},
  {t:"Habilidad verbal y comprensión lectora", u:yt("comprension lectora examen admision san marcos"), d:"Técnica de lectura, no contenido."},
  {t:"MateMovil", u:yt("MateMovil"), d:"Canal peruano de matemáticas con ejercicios de nivel admisión."},
  {t:"Unicoos", u:yt("unicoos matematicas"), d:"Teoría clara de matemáticas y física en español."}
];

var OFICIAL = [
  {t:"Oficina Central de Admisión UNMSM", u:"https://admision.unmsm.edu.pe", d:"Cronograma, temario oficial, prospecto y resultados. Es la única fuente que vale."},
  {t:"Exámenes de admisión anteriores", u:yt("examen de admision san marcos resuelto area C"), d:"Los exámenes pasados son el mejor material que existe. Consíguelos en PDF."}
];

/* Estrategia del examen DECO */
var ESTRATEGIA = [
  {t:"Nunca dejes una en blanco", d:"Acertar suma 20, fallar resta solo 1,125. Adivinar al azar entre 4 alternativas te da +4,2 puntos en promedio. Dejar 15 en blanco es regalar unos 60 puntos."},
  {t:"Dos pasadas", d:"Primera pasada: responde solo las que ves claras, sin pelearte con ninguna. Segunda pasada: las dudosas. Al final, marca todas las que queden aunque sea al azar."},
  {t:"Presupuesto de tiempo", d:"180 minutos para 100 preguntas: 1,8 minutos por pregunta. Si una te toma más de 2 minutos en la primera pasada, márcala y sigue."},
  {t:"Descarta antes de calcular", d:"En alternativas numéricas, muchas veces dos son absurdas por magnitud. Descartar dos sube tu acierto al azar del 25% al 50%."},
  {t:"Verifica con dimensiones", d:"Si el resultado de un problema de física sale en unidades que no corresponden, está mal. Revisar unidades detecta errores en segundos."},
  {t:"Sección actitudinal", d:"Ahí los errores no restan. Responde absolutamente todas."}
];

root.V3 = {SENATI:SENATI, ESTUDIO:ESTUDIO, TEMARIO:TEMARIO, LIBROS:LIBROS,
           CANALES:CANALES, OFICIAL:OFICIAL, ESTRATEGIA:ESTRATEGIA};
})(typeof module!=="undefined"&&module.exports ? module.exports : (typeof window!=="undefined"?window:globalThis));
