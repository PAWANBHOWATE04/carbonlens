# CarbonLens - Deployment & Submission Audit TODO

## Phase 0: Deployment-first (must pass)
- [x] Modify `vercel.json` with minimal fix to eliminate Vercel 404.
- [x] Verify Vercel routing expectations locally (SPA root + static assets) via server and a quick curl/supertest-style checks.
- [x] Verify API `/api/*` routes return valid JSON locally.


## Phase 1: Server compatibility hardening (only if required)
- [ ] Inspect/update `server/server.js` only if Vercel still fails routing.

## Phase 2: Automated validation
- [ ] Run `npm install`.
- [ ] Run `npm test`.
- [ ] Run `npm start` sanity checks.

## Phase 3: Repo optimization & security
- [ ] Update `.gitignore`.
- [ ] Remove unnecessary tracked files (if any).
- [ ] Verify repo size under 10MB.
- [ ] Scan for secrets.

## Phase 4: Production README
- [ ] Replace/Generate `README.md` according to required sections + Mermaid + badges.

## Phase 5: Final report
- [ ] Produce final audit report with modified files, root cause, verification results, and readiness score.

