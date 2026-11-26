# Caserío Las Viñas

Web de la casa rural Caserío Las Viñas (Los Guájares, Granada). Sitio estático: HTML, CSS y
JavaScript sin dependencias ni proceso de compilación.

## Estructura

```
src/                         ← la web (esta carpeta es la que se publica)
├── index.html               ← página principal
├── privacidad.html          ← aviso legal y política de privacidad
├── cookies.html             ← política de cookies
├── estilos.css
├── app.js                   ← menú, galería y calendario de disponibilidad y tarifas
├── consentimiento.js        ← aviso de cookies y bloqueo previo al consentimiento
└── tarifas.json             ← copia de respaldo de fechas y precios
GUIA_HOJA_GOOGLE.md          ← cómo se editan las fechas y los precios
hoja_caserio_las_vinas.xlsx  ← plantilla de la hoja de Google
```

## Fechas y precios

La web lee la disponibilidad y las tarifas de una hoja de cálculo de Google, que el propietario
edita sin tocar el código. Si la hoja no responde, se usa `src/tarifas.json`. El funcionamiento
está explicado en [GUIA_HOJA_GOOGLE.md](GUIA_HOJA_GOOGLE.md).

## Verla en local

```
python -m http.server 8765 --directory src
```

Y abrir http://localhost:8765.

## Publicación

Cualquier alojamiento de sitios estáticos sirve. En Cloudflare Pages: sin comando de compilación
y con `src` como directorio de salida. Cada cambio en la rama `main` se publica solo.

## Pendiente antes de publicar con el dominio definitivo

- Copiar las fotografías al repositorio: ahora se enlazan desde el servidor de la web anterior.
- Servir las tipografías Lora y Karla desde la propia web en lugar de Google Fonts.
- Completar el NIF del titular en el aviso legal.
- Migrar las condiciones de reserva, que aún enlazan a la web anterior.
