# Cómo escribir lecciones

Cada curso es un archivo en `data/cursos/`. Para que aparezca en la app, se registra en `data/cursos/index.json`.

## 1. Registrar el curso — `index.json`

```json
{
 "cursos": [
  {"id": "algebra", "nombre": "Álgebra", "area": "Matemática",
   "archivo": "algebra.json", "desc": "Exponentes, polinomios, ecuaciones.", "lecciones": 3}
 ]
}
```

- `id`: corto, sin tildes ni espacios. **No se cambia nunca**: el avance del estudiante se guarda con él.
- `lecciones`: total de lecciones con contenido (solo para la barra de avance).

## 2. Archivo del curso

```json
{
 "id": "algebra",
 "nombre": "Álgebra",
 "version": 1,
 "unidades": [
  {"id": "u1", "titulo": "Leyes de exponentes", "lecciones": [ LECCIÓN, LECCIÓN ]},
  {"id": "u2", "titulo": "Polinomios", "lecciones": []}
 ]
}
```

Una unidad con `"lecciones": []` aparece como "En preparación".

## 3. Una lección

```json
{
 "id": "u1l1",
 "titulo": "Multiplicar y dividir bases iguales",
 "aprende": [
  "Párrafo normal.",
  {"formula": "a^{m} · a^{n} = a^{m+n}"},
  {"ojo": "Advertencia o error típico."},
  {"lista": ["punto 1", "punto 2"]},
  {"texto": "Texto de lectura, por ejemplo en inglés.", "idioma": "en"}
 ],
 "ejemplo": {
  "enunciado": "Simplifica E = (x^{5} · x^{3}) ÷ x^{6}",
  "pasos": ["Paso 1.", "Paso 2.", "Paso 3."],
  "respuesta": "E = x^{2}"
 },
 "practica": [
  {"p": "3^{4} · 3^{2} =", "o": ["3^{6}", "3^{8}", "9^{6}", "3^{2}"], "c": 0,
   "x": "Explicación que se muestra después de responder."}
 ],
 "generador": {"id": "exp_mult", "n": 3},
 "chequeo": [ 5 preguntas con el mismo formato ]
}
```

- `id` de lección: único dentro del curso (`u1l1`, `u1l2`, `u2l1`…). No se cambia después de publicarlo.
- `o`: 4 opciones. `c`: posición de la correcta **contando desde 0**. La app mezcla el orden al mostrarlas.
- `x`: en práctica se muestra siempre; en el chequeo, solo si falla.
- `generador` (opcional): agrega `n` ejercicios generados de `js/generadores.js`. Hoy existen `exp_mult`, `exp_potpot` y `rad_frac`.
- Recomendado: 5 preguntas de práctica y 5 de chequeo. Se aprueba con el 80 %.

## Formato del texto

| Escribes | Se ve |
|---|---|
| `x^{2}` | x² (superíndice) |
| `H_{2}O` | H₂O (subíndice) |
| `**importante**` | **negrita** |
| `*word*` | *cursiva* (úsala para palabras en inglés) |

No uses `*` como signo de multiplicar: usa `·` o `×`.

## Antes de subir

1. Valida el JSON (una coma de más rompe todo el curso): pega el archivo en https://jsonlint.com o usa el editor de Codespaces, que marca los errores en rojo.
2. Revisa cada respuesta a mano. Si el contenido lo escribió una IA (Claude o Copilot), **verifícalo con tus libros**: puede equivocarse.
3. Prueba la lección completa en el servidor local antes de publicarla.

## Pedir un borrador a Copilot o Claude

> Siguiendo el formato de CONTENIDO.md, escribe la lección `u2l1` de Álgebra: "Grado de un monomio y de un polinomio", nivel examen UNMSM Área C. 5 bloques en `aprende`, 1 ejemplo con 3 pasos, 5 preguntas de práctica y 5 de chequeo con explicación. Solo el JSON de la lección.
