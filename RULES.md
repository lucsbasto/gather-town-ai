# Project Rules & Development Workflow

## 1. Branching & Git Flow

- **Main Branch:** The main branch is for production-ready code only. It is protected and requires a PR to merge.
- **Feature Branches:** Develop new features in branches named `feat/feature-name`.
- **Bug Fixes:** Use `fix/issue-name` for bug-related branches.
- **Merge Policy:** All merges to main must go through a Pull Request (PR) with at least one manual review (or AI-driven check).

---

## 2. Commit Message Standards (Conventional Commits)

We use the Conventional Commits format to ensure a readable project history:

- `feat:` A new user-facing feature.
- `fix:` A bug fix.
- `test:` Adding or correcting tests.
- `docs:` Documentation-only changes.
- `chore:` Maintenance tasks (e.g., updating dependencies).
- `refactor:` Code changes that neither fix bugs nor add features.

**Example:** `feat(game): add proximity-based video activation logic`

---

## 3. Pull Request (PR) Checklist

Before any PR is approved, the following must be verified:

- [ ] **Build:** The project must build successfully (`yarn build`).
- [ ] **Lint:** No linting or TypeScript errors.
- [ ] **Tests:** All automated tests must pass. **REQUIRED - PR will be blocked if tests fail.**
- [ ] **Documentation:** New mechanics must be documented in Design.md.
- [ ] **Small Scope:** PRs should be surgical. Avoid refactoring unrelated code in a feature PR.

---

## CI/CD - Tests Must Pass Before Merge

All PRs require passing tests. The workflow runs:
1. `yarn install`
2. `yarn build`
3. `yarn test` (unit tests)
4. `yarn test:e2e` (E2E tests - when implemented)

**Blocker:** If tests fail, fix the functionality BEFORE opening PR.

---

## 4. Testing Standards

To maintain high reliability, the project follows a tiered testing approach:

### 4.1. Database & Security (Supabase)

- **RLS Policies:** Every table must have Row Level Security (RLS) enabled.
- **pgTAP Tests:** Use supabase test db to verify RLS policies and database functions in `./supabase/tests/`.

### 4.2. Game Logic (Unit Testing) - REQUIRED

- **Vitest:** All new features must include unit tests.
- **Coverage:** Aim for 80% coverage on new code.
- **Pure Functions:** Test distance calculations, collision logic, state reducers.

### 4.3. Real-time & Multiplayer - REQUIRED

- **Socket Events:** Test Socket.io emitters and listeners.
- **Playwright:** E2E tests for critical flows.

### 4.4. Test Files Location

```
modules/
├── gather-browser/
│   └── src/
│       └── __tests__/      # Vitest tests
└── gather-dev-server/
    └── src/
        └── __tests__/      # Vitest tests
```

### 4.5. Running Tests

```bash
yarn test              # Unit tests
yarn test:e2e         # E2E tests
yarn test:coverage    # Coverage report
```

---

## 5. AI Interaction Rules (For Cursor/Claude Code)

When using AI agents, they must obey these strict behaviors:

- **Search First:** Always use grep or codebase search before implementing new functions to reuse existing patterns.
- **No Hallucinations:** Do not guess API methods for Phaser or LiveKit. Check the local llms.txt or docs if unsure.
- **Plan First:** Describe the implementation plan in the chat and wait for confirmation before making large edits.
- **Minimal Changes:** Avoid rewriting whole files when only a few lines need adjustment.
