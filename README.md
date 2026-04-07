# @lexical-editor/editor

A rich text editor package built on top of [Lexical](https://lexical.dev/), providing reusable nodes and components (Mermaid diagrams, code snippets with Prism highlighting, resizable media, and more).

This branch is a trimmed-down view of the monorepo that contains only the `packages/editor` package and the root tooling needed to build, test, and lint it. Apps, infra, and unrelated tooling have been removed.

## Layout

```
.
├── package.json          # workspace root (packages/* only)
├── tsconfig.base.json    # shared TS config extended by the editor package
└── packages/
    └── editor/           # @lexical-editor/editor source
```

## Requirements

- Node.js `>=20`
- npm (uses npm workspaces)

## Install

```bash
npm install
```

This will install dependencies for the editor workspace and regenerate `package-lock.json`.

## Scripts

Run from the repo root:

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run build`      | Build the editor package via `rslib` |
| `npm test`           | Run the editor's `vitest` suite once |
| `npm run test:watch` | Run vitest in watch mode             |
| `npm run lint`       | Run ESLint across the repo           |
| `npm run format`     | Run Prettier on the repo             |

You can also run package-scoped scripts directly:

```bash
npm run build --workspace=packages/editor
npm run dev   --workspace=packages/editor   # rslib build --watch
```

## Package

See [`packages/editor/package.json`](./packages/editor/package.json) for the full dependency list and exports. The package entry point is `packages/editor/src/index.ts` and styles are exported from `@lexical-editor/editor/styles.css`.
