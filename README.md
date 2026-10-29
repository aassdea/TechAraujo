# TechAraujo

Frontend React + TypeScript conectado a MySQL/MariaDB mediante una API PHP.

## XAMPP
1. Copiá `techaraujo` en `C:/xampp/htdocs/`.
2. Iniciá Apache y MySQL.
3. En phpMyAdmin importá `backend/techaraujo_corregido.sql`.
4. Ejecutá `npm install` y `npm run dev`.
5. La API por defecto es `http://localhost/techaraujo/backend/api.php`.

Podés cambiarla creando `.env` a partir de `.env.example`.

## Acceso con Google

1. En `.env`, definí `VITE_GOOGLE_CLIENT_ID` con el ID de cliente de tipo **Aplicación web**.
2. Reiniciá `npm run dev` (o ejecutá `npm run build`) para que Vite tome el valor.
3. En Google Cloud agregá `http://localhost` y `http://localhost:5173` a los orígenes autorizados para desarrollo. En producción, usá el dominio HTTPS real de la aplicación.

La API valida el token de Google en el servidor, guarda el identificador único de la cuenta (`google_sub`) y crea usuarios nuevos con el rol `cliente`. Si el email ya existe, conserva su rol y vincula esa cuenta con Google.

## Uso en red local

Instalá el proyecto, XAMPP, MySQL y Composer solo en **una PC servidor**. Las demás PCs de la escuela o empresa solo necesitan un navegador y estar conectadas a la misma red.

1. En la PC servidor, iniciá Apache y MySQL desde XAMPP.
2. Ejecutá `npm run dev` y buscá la dirección de red que muestra Vite, por ejemplo `http://192.168.1.25:5173`.
3. Abrí esa dirección desde las otras PCs. Si Windows pregunta, permití el acceso a Node/Vite en redes privadas.

La app usa `/techaraujo/backend/api.php`, por lo que cada navegador consulta automáticamente la API de la PC servidor: no hay que editar una IP en cada equipo.

Para que funcione el acceso con Google fuera de `localhost`, la página debe estar publicada con HTTPS y ese dominio debe estar autorizado en Google Cloud. En una red local con una IP HTTP, usá el inicio de sesión por email o configurá un dominio HTTPS.

La carpeta `vendor` ya contiene las librerías de PHP requeridas. Si se copia junto con el proyecto, no hace falta instalar Composer en otra PC. Si no se copia `vendor`, instalá Composer solo en la PC servidor y ejecutá `composer install` dentro del proyecto.
