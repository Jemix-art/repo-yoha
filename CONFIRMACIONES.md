# Recoger las confirmaciones en una hoja de Google

La invitación está en GitHub Pages, que es alojamiento **estático**: sirve archivos
pero no puede recibir ni guardar nada. Para que las respuestas se apunten solas
hace falta algo fuera que las reciba. Esto lo resuelve en unos cinco minutos y es
gratis.

## 1. Crea la hoja

Entra en [sheets.new](https://sheets.new) y llámala, por ejemplo, **Confirmaciones boda**.
No hace falta que pongas cabeceras: el script las escribe la primera vez.

## 2. Pega el script

En esa misma hoja: menú **Extensiones → Apps Script**. Borra lo que haya y pega esto:

```javascript
function doPost(e) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  if (hoja.getLastRow() === 0) {
    hoja.appendRow(['Fecha', 'Código', 'Invitado', 'Pases', '¿Asiste?', 'Cuántos vienen']);
    hoja.getRange(1, 1, 1, 6).setFontWeight('bold');
  }

  var d = JSON.parse(e.postData.contents);

  // Si ese invitado ya respondió, se actualiza su fila en vez de duplicarla.
  var codigos = hoja.getRange(1, 2, Math.max(hoja.getLastRow(), 1), 1).getValues();
  var fila = 0;
  for (var i = 1; i < codigos.length; i++) {
    if (codigos[i][0] === d.codigo) { fila = i + 1; break; }
  }

  var valores = [new Date(), d.codigo, d.nombre, d.pases, d.asiste, d.personas];
  if (fila) {
    hoja.getRange(fila, 1, 1, 6).setValues([valores]);
  } else {
    hoja.appendRow(valores);
  }

  return ContentService.createTextOutput('ok');
}
```

## 3. Publícalo

Botón **Implementar → Nueva implementación**.

- Tipo: **Aplicación web**
- Ejecutar como: **Yo**
- Quién tiene acceso: **Cualquier usuario** ← imprescindible, si no los invitados no podrán enviar

Acepta los permisos que pida (Google avisa de que la app no está verificada; es
tuya, entra en *Configuración avanzada → Ir a…*). Al final te da una **URL** que
termina en `/exec`.

## 4. Pégala en la invitación

En `script.js`, primera línea del bloque de invitados:

```javascript
const ENDPOINT_RSVP = "";   // <- aquí va la URL que termina en /exec
```

Haz commit y sube. Listo.

## Cómo bajar el Excel

En la hoja: **Archivo → Descargar → Microsoft Excel (.xlsx)**.

## Una limitación que conviene conocer

Apps Script no devuelve cabeceras CORS, así que la invitación envía la respuesta
en modo `no-cors`: **la petición llega, pero el navegador no nos deja leer la
confirmación del servidor**. En la práctica significa que si Google fallara, el
invitado vería igualmente el mensaje de gracias.

Por eso conviene que **revises la hoja un par de veces** antes del 24 y que
compares con la lista: son 27 invitaciones, se repasa en un minuto. Si a alguien
no le aparece la respuesta, un WhatsApp lo resuelve.

## Los enlaces

Están en `enlaces-invitados.txt`, uno por invitado, listos para copiar y pegar.
Cada uno lleva su código: `?i=jordan-roman`.

Quien abra la invitación **sin código** verá la carta completa pero sin la
dedicatoria personal y sin el formulario, con un aviso de que use su enlace.
