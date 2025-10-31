# Repository Guidelines

## Project Structure & Module Organization
Source code lives in `src/`, organized by responsibility: feature screens under `src/pages/`, shared UI in `src/components/`, client-side data logic in `src/services/` and `src/store/`, and cross-cutting helpers in `src/utils/` and `src/constants/`. `src/index.tsx` bootstraps the React app rendered by `src/App.tsx`. Static assets and the HTML shell live in `public/`, while build artifacts are emitted to `dist/` by Vite. Keep new modules close to the feature that owns them; shared utilities should be colocated in `src/utils/` with descriptive filenames.

## Build, Test, and Development Commands
- `npm install`: install or update dependencies before running anything else.
- `npm run dev`: start the Vite dev server with hot reload; use this for interactive checks.
- `npm run build`: produce an optimized production bundle in `dist/`; run before shipping changes.
- `npm run preview`: serve the production build locally to sanity-check deployment artifacts.

## Coding Style & Naming Conventions
This project uses TypeScript with React functional components. Prefer PascalCase for component files and exported components, camelCase for variables and hooks, and SCREAMING_SNAKE_CASE for constant exports. Stick to modern ECMAScript features and keep components presentational where possible, delegating data fetching and mutations to `src/services/` and `src/store/`. Follow the existing formatting produced by your editor’s TypeScript/Prettier defaults (2 spaces, single quotes discouraged). Co-locate hook logic under `src/hooks/` when it is reused by multiple views.

## Testing Guidelines
Automated tests are not yet wired, so validate UI flows manually in `npm run dev` and exercises around signing flows. When introducing tests, place them under `src/__tests__/` or alongside the component with a `.test.tsx` suffix and run them with Vitest (`npx vitest`) once added. Aim to cover sign/preview flows and data fetching edge cases before submitting large changes.

## Commit & Pull Request Guidelines
Commits should be small, focused, and written in the imperative mood (e.g., `update session flow`), mirroring the existing history. Reference issue IDs when applicable. Pull requests must summarize the change, link any related tickets, describe manual verification steps, and attach screenshots or screen recordings for UI updates. Ensure `npm run build` and relevant manual checks have completed before requesting review.
