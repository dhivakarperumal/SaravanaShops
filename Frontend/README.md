# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Google sign-in configuration

The frontend uses Google Identity Services to return an ID token, which the
backend verifies before creating or logging in a user. Configure the same **Web
application OAuth client ID** in `Frontend/.env` as
`VITE_GOOGLE_CLIENT_ID` and in the backend deployment environment as
`GOOGLE_CLIENT_ID`. The client ID is public; do not put a Google client secret
in frontend variables or source code.

The configured frontend origins evidenced by this project are:

- Local development: `http://localhost:5173`
- Production: `https://saravanashoppings.com`

Add those exact origins under **Authorized JavaScript origins** for that OAuth
client in Google Cloud Console. This popup/credential flow does not use an OAuth
redirect URI; the backend endpoint `POST /api/auth/google` verifies the ID
token and is not a Google OAuth callback URL. The production frontend calls
`/api` on its own origin; Vite proxies local development API requests to
`VITE_BACKEND_URL` (default: `http://localhost:5002`).

Use the provided `.env.example` files as templates. Production environment
variables must be configured in the hosting platforms; the local `.env` files
are ignored by Git.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
