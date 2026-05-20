# Memory Bank: @hyperbitjs/hdkey

## Identity
- Path: `hdkey`
- Type: Project
- Package name: `@hyperbitjs/hdkey`

## Primary Commands
- `npm run build` -> `vite build`
- `npm run build:watch` -> `vite build --watch`
- `npm run dev` -> `vite build --watch`
- `npm run type-check` -> `tsc --noEmit`
- `npm run lint` -> `eslint . --max-warnings 0`
- `npm run lint:fix` -> `eslint . --fix`
- `npm run format` -> `prettier --write .`
- `npm run format:check` -> `prettier --check .`
- `npm run test` -> `vitest --run`
- `npm run test:watch` -> `vitest`
- `npm run test:coverage` -> `vitest --coverage`
- `npm run validate` -> `npm run type-check && npm run lint && npm run test`
- `npm run prepublishOnly` -> `npm run build && npm run validate`

## Runtime and Config
- Main entry hint: `./dist/index.cjs`
- Module entry hint: `./dist/index.mjs`
- Types entry hint: `./dist/index.d.ts`
- Env template: none detected

## Dependency Surface
- Prod deps count: 3
- Dev deps count: 10

## LLM Working Notes
- Keep edits minimal and localized by module responsibility.
- Validate with the smallest relevant script first, then broader checks.
- Record any non-obvious behavior changes in this file.

## Troubleshooting Checklist
- Confirm dependencies installed in this folder.
- Confirm expected environment variables are present.
- Run the nearest build/test/lint script and capture the exact error output.
- Verify relative paths from this package root, not workspace root.
