# CI/CD workflow

`.github/workflows/ci.yml` runs on every push and pull request using Node.js 20 and an npm lockfile cache. It installs exact dependencies with `npm ci`, generates Prisma Client, runs linting, strict type checking and all tests, then builds the complete Next.js application.

This repository uses a single deployable Next.js service: React Server Components and browser code form the frontend, while route handlers under `src/app/api` are the Node.js REST backend. Therefore `npm run build` compiles and validates both frontend and backend in one production artifact. The workflow fails immediately if any required command returns a non-zero status.

Deployment is intentionally not automatic because production hosting credentials are not stored in the repository. Add a protected deployment job after the validation job when a Vercel/Railway target is selected.
