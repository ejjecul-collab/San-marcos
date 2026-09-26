# Ruta San Marcos

App de estudio para postular a la UNMSM, Área C (Ingeniería). Funciona en el navegador, sin cuentas: el avance se guarda en el propio dispositivo.

Sitio: https://ejjecul-collab.github.io/San-marcos/

## Qué tiene

- **Hoy**: plan del día según el horario que arma cada estudiante, Pomodoro con aviso, cuenta regresiva al examen.
- **Aprender**: cursos por unidades y lecciones (Aprende → Ejemplo → Práctica → Chequeo). Con 4 de 5 en el chequeo se desbloquea la siguiente.
- **Practicar**: banco de preguntas, ejercicios generados, fichas de clase, simulacro.
- **Temario**, **Errores** (cuaderno de errores con repaso espaciado) y **Progreso**.

## Estructura

```
index.html              página
css/app.css             estilos y temas
img/                    portadas y franjas de cada tema
js/banco.js             banco de preguntas
js/base.js, datos.js    utilidades, temario y recursos
js/fichas.js            fichas de clase
js/app.js               app principal (vistas, práctica, Hoy, Pomodoro, progreso)
js/calendario.js        "Mi horario": asistente y reparto automático de bloques
js/ruta.js              "Aprender": motor de lecciones
js/generadores.js       ejercicios generados para las lecciones
data/cursos/            contenido de las lecciones (ver CONTENIDO.md)
```

## Subir o actualizar en GitHub

1. En el repo, borra los archivos viejos (o créalo vacío).
2. **Add file → Upload files** y arrastra todo el contenido de esta carpeta (no la carpeta en sí: `index.html` debe quedar en la raíz).
3. **Settings → Pages**: rama `main`, carpeta `/ (root)`.
4. Espera 1 o 2 minutos y abre el sitio.

Para agregar contenido después solo subes o reemplazas archivos en `data/cursos/`.

## Probar en tu computadora o Codespaces

"Aprender" lee archivos JSON, así que no funciona abriendo `index.html` con doble clic. Usa un servidor local:

```
python3 -m http.server 8000
```

y abre `http://localhost:8000`. En Codespaces, el puerto se abre solo en una pestaña.

## Contenido y derechos

Las lecciones se escriben con palabras propias. No se copian textos de libros ni academias en este repo público.
