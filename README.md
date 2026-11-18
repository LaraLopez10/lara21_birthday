# The Birthday Club · Lara's 21

Invitación estática mobile-first para el cumpleaños de Lara, con estilo scrapbook retro. No usa backend: los datos de organización se guardan en `localStorage` y los equipos publicados se comparten en un enlace con el resultado codificado en el fragmento de URL.

## Ejecutar localmente

Abrí esta carpeta con un servidor estático, por ejemplo `npx serve .`, y navegá a la URL local. También se puede abrir `index.html` directamente, aunque para módulos JavaScript y algunas funciones del navegador se recomienda un servidor.

## Publicar en Vercel

Importá el repositorio como proyecto estático con preset **Other**, sin comando de build y con la carpeta raíz del proyecto como directorio. Publicá el deploy y compartí la URL raíz para la invitación. El organizador está en `/admin.html`; no compartas esa ruta.

## Uso

- La invitación permite enviar una confirmación por WhatsApp. La invitada queda confirmada solo cuando envía el mensaje; luego se carga manualmente en el organizador.
- En `/admin.html`, agregá participantes, elegí entre 2 y 6 equipos, personalizá sus nombres y sorteá. Podés revisar la distribución, mover participantes y publicar el resultado.
- Copiá el enlace de equipos para que cualquier dispositivo abra el resultado sin depender del almacenamiento local.
- Exportá un respaldo JSON y guardalo en un lugar seguro. Importarlo reemplaza el estado organizador actual.

El organizador no tiene autenticación. `localStorage` es local al navegador y el enlace de equipos es visible para cualquiera que lo reciba. No incluye números de teléfono ni otra información privada.

## Personalización

- WhatsApp y cuenta regresiva: `invite.js`.
- Dirección y mapa: `index.html`.
- Equipos predeterminados y validación del enlace: `shared.js`.
- Estilos: `style.css`.


Invitacion para mis 21 años
