# Frontend - Operativos SJ (Astro)

Página frontend creada con Astro que muestra un mapa con operativos en tiempo real.

Variables de entorno:
- `PUBLIC_API_URL` (opcional): URL del endpoint que devuelve un arreglo JSON de operativos. Cada operatico debe tener `{ id, lat, lng, title, description, timestamp }`. Por defecto se usa `/api/operativos`.

Instalación y uso en desarrollo:

```bash
cd frontend/astro
npm install
npm run dev
```

El frontend consulta por defecto al backend en `http://localhost:3001/api/operativos`.

El mapa usa OpenStreetMap y Leaflet via CDN. Si tu backend corre en otro puerto o dominio, configura `PUBLIC_API_URL` para evitar problemas de CORS o ajusta el backend para permitir peticiones desde el frontend.
# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
