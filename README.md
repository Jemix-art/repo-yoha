# Invitación de boda · Yohana & José Luis

Invitación digital de página única. Sobre lacrado que se abre con un toque y
revela la carta. Pensada para compartirse por WhatsApp y abrirse en móvil vertical.

**Boda:** sábado 10 de octubre de 2026 · Loja, Ecuador
**Ceremonia:** 17:00, Iglesia Inmaculada Concepción (El Pedestal)
**Recepción:** Restaurante Cecilia

> Repositorio **privado**: contiene fotografías familiares y una canción con
> derechos de autor. No hacerlo público sin retirar ambas cosas antes.

## Estructura

```
index.html          una sola página; la carta vive oculta hasta abrir el sobre
styles.css          incluye la máscara de papel rasgado incrustada como data URI
script.js           apertura del sobre, cuenta atrás y música
fonts/              Cormorant Garamond y Great Vibes, auto-alojadas (sin CDN)
img/                fotografías en WebP, tarjeta de vista previa, iconos
img/generados/      adornos florales e ilustración de la iglesia
mp3/                la canción de los novios
```

## Decisiones que conviene no deshacer

**Las fuentes van auto-alojadas.** Palatino y Segoe UI no existen en Android:
la mitad de los invitados veía tipografías del sistema. Sin CDN, por requisito.

**La máscara del papel rasgado está incrustada en el CSS como data URI.** Una
máscara CSS con imagen externa está sujeta a política de origen, y al abrir el
archivo con `file://` se bloquea: las fotos entonces **no se pintan en absoluto**.
Sacarla a archivo externo rompe eso.

**El tamaño de letra compensa el dibujo de Cormorant.** Su altura de x es 39 por
cada 100 de cuerpo, frente a 52 de Arial. El cuerpo a 22 px se percibe como Arial
de 16. Bajarlo lo devuelve a resultar pequeño en móvil.

**Sin JavaScript la carta se muestra entera**, no un sobre que no abre.

## Publicado en

https://jemix-art.github.io/repo-yoha/

Las etiquetas `og:image` y `og:url` apuntan ahí de forma absoluta. Si el sitio
cambia de dominio, hay que actualizarlas en `index.html`: los raspadores de
enlaces no resuelven rutas relativas y la vista previa saldría sin imagen.

`.nojekyll` evita que GitHub procese el sitio con Jekyll.

## Invitados y confirmaciones

Cada invitado tiene su enlace: `?i=codigo`. Los datos salen de `invitados.js`,
generado desde `invitados y pases.xlsx` (27 invitaciones, 54 pases). Los enlaces
listos para repartir están en `enlaces-invitados.txt`.

Para que las respuestas caigan en una hoja de cálculo, seguir `CONFIRMACIONES.md`.

## Pendiente

- Pegar la URL del Apps Script en `ENDPOINT_RSVP` (`script.js`).
