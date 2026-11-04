# techpilots-ci

Gemensamt CI/CD-flöde för alla Techpilots-projekt. Repot måste vara publikt (eller ha Actions-åtkomst
inställd under Settings > Actions > General > Access) eftersom andra repon anropar och checkar ut det.
Det innehåller inga hemligheter.

## Vad som körs
| Steg | Var |
|---|---|
| `npm audit` / `pnpm audit` (produktion, nivå high) | alla |
| ESLint, Stylelint, tsc, bygge | alla (kan stängas av per repo) |
| axe-core (WCAG 2.1 AA, 375 och 1280 px) | statiska sajter |
| Lighthouse (prestanda >= 0.85, LCP <= 2,5 s, CLS <= 0,1) | statiska sajter |
| Playwright e2e | valfritt (`e2e: true`) |
| Deploy via rsync | `deploy-static.yml`, vid push till main |
| Dependabot | `templates/dependabot.yml`, kopieras till varje repo |

## Användning i ett projekt
`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  ci:
    uses: Nedissa/techpilots-ci/.github/workflows/ci.yml@main
    with:
      static-site: true
```
Alla inputs står överst i `ci.yml`. Tröskelvärden för Lighthouse ligger i `lighthouserc.json`.

## Lokalt
```
npm install && npx playwright install chromium
node scripts/serve.mjs <projekt>/out 4173 &
node scripts/a11y.mjs <projekt>/out http://localhost:4173
```
