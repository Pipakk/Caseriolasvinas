# Fechas y precios desde una hoja de Google

La web lee la disponibilidad y las tarifas de una hoja de cálculo de Google. El dueño cambia una
casilla y la web se actualiza sola a los pocos minutos, sin tocar código ni volver a publicar.

## Puesta en marcha (una sola vez)

1. Abrir la hoja de Google y elegir **Archivo → Importar → Subir**.
2. Subir `hoja_caserio_las_vinas.xlsx`, elegir **Reemplazar hoja de cálculo** e **Importar datos**.
   Se crean cuatro pestañas ya rellenas: *Calendario*, *Precios*, *Temporadas* e *Instrucciones*.
3. Comprobar que sigue compartida: **Compartir → Acceso general → Cualquier persona con el
   enlace → Lector.**

Con ese permiso cualquiera que tenga el enlace puede **leer** la hoja, pero solo el dueño puede
editarla. No debe guardarse en ella nada que no sea público (nombres de huéspedes, teléfonos,
cobros).

## El día a día: pestaña «Calendario»

Cada fila es un mes y cada columna un día, como un planning de pared.

- **Entra una reserva:** escribir una **X** en esos días. La casilla se pone roja.
- **Se cancela:** borrar las X. La casilla vuelve a verde.
- **Abrir un mes nuevo:** escribir su nombre y el año debajo del último, por ejemplo
  `enero 2028`. La web solo muestra los meses que aparecen aquí, y nunca los ya pasados.

Verde es libre, rojo es ocupado. Para marcar muchos días de golpe, se escribe una X, se copia y
se pega en el resto de casillas.

## De vez en cuando: pestañas «Precios» y «Temporadas»

**Precios** es la lista de tarifas. Cada una ocupa tres filas (1 a 2, 3 a 4 y 5 a 6 personas) con
el precio total de la estancia según las noches. La primera, *Normal*, es la que se aplica
siempre que no se diga otra cosa. Un precio vacío significa que esa estancia no se ofrece.

**Temporadas** dice en qué fechas se cobra una tarifa distinta de la normal: desde, hasta y la
tarifa, que se elige de una lista desplegable. El resto del año no hay que escribir nada.

| Quiero… | Hago… |
|---|---|
| Subir el precio normal | Cambio los números de la tarifa *Normal* en «Precios». |
| Poner un puente más caro | Añado una fila en «Temporadas» con las fechas y una tarifa. |
| Crear una tarifa nueva | Añado tres filas en «Precios» con un nombre nuevo; ya aparece en la lista de «Temporadas». |
| Ofrecer solo semanas completas | Dejo vacíos los precios de 2 a 6 noches de esa tarifa. |

## Normas para no romper nada

- No cambiar el nombre de las pestañas *Calendario*, *Precios* y *Temporadas* ni su fila de títulos.
- En «Personas» se escribe `1 a 2`, `3 a 4` o `5 a 6` (con la letra «a»: con guion, Google lo
  convierte en una fecha).
- Fechas de «Temporadas» con el formato día/mes/año: `27/11/2026`.
- Una fila mal escrita se ignora; el resto sigue funcionando.

## Qué pasa si…

- **Tarda en verse el cambio:** Google tarda unos minutos en servir la versión nueva.
- **La hoja no responde, se vacía o deja de estar compartida:** la web muestra la copia de
  respaldo, `src/tarifas.json`. Conviene actualizarla de vez en cuando con los datos de la hoja.
- **Se cambia de hoja:** basta con sustituir su identificador en `HOJA_ID`, al principio de
  `src/app.js` (el tramo largo de la dirección, entre `/d/` y `/edit`).
