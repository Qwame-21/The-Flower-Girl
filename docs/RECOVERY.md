# Recovery procedure

## Known-good checkpoints

- `c180476` — secured restored storefront baseline.
- `51dc24e` — restored footer readability and vertical Careers details.
- The latest verified commit after this document is added supersedes both while retaining them in history.

An offline baseline archive also exists at `.recovery/storefront-secured-baseline-2026-09-04.tgz`. Its recorded SHA-256 is `d6a67eecf878495095ec50e8d51a97687ee07bbe22f698e37d942ba0705ed7db`.

## Diagnose before changing anything

```bash
git status --short
git log --oneline -8
npm run lint
npm run build
```

Do not use `git reset --hard` or discard uncommitted files. First inspect the diff and preserve user work.

## Recover safely

1. Create a temporary recovery branch from the desired known-good commit.
2. Run the lint and production build checks.
3. Preview the branch and compare it with `docs/STOREFRONT_MEMORY.md` at desktop, tablet, and mobile widths.
4. Restore only the verified files or commit through a normal merge or cherry-pick workflow.
5. Never copy `.env` into an archive or commit payment credentials.

Example read-only inspection:

```bash
git show --stat 51dc24e
git diff 51dc24e..HEAD -- src
```

## Payment boundary

`.env` is ignored. `.env.example` documents only the public variable name. Paystack transaction initialization, amount validation, reference creation, and webhook verification still belong on a trusted backend and must use secret credentials there only.
