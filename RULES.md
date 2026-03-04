# Project Rules & Development Workflow

## 1. Branching & Git Flow

- **Main Branch:** The main branch is PROTECTED. NEVER commit directly to main.
- **Feature Branches:** Develop new features in branches named `feat/feature-name`.
- **Bug Fixes:** Use `fix/issue-name` for bug-related branches.
- **Documentation:** Use `docs/doc-name` for documentation.
- **Merge Policy:** ALL changes must go through a Pull Request (PR). NO exceptions.

**🚫 NEVER do: git push origin main**
**✅ ALWAYS do: git push origin feat/my-feature → Create PR**

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

## 3. Before ANY Commit (ALWAYS CHECK)

### Step 1: Check .gitignore
**ALWAYS verify** that you're not committing:
- node_modules/
- .env files
- dist/
- logs/
- .cache/

Run: `git status` and review every file.

### Step 2: Use Skills
Before implementing anything, search for relevant skills:
- Check awesome-claude-skills and antigravity-awesome-skills repos
- Use **create-pr** for creating pull requests
- Use **git-pr-workflows-git-workflow** for PR workflow
- Use **comprehensive-review-pr-enhance** for PR descriptions
- Use interface-design for UI
- Use test-driven-development for tests
- Use supabase for database
- Use conventional-commits for commits

---

## 4. Pull Request (PR) Workflow

### Before Creating PR (ALWAYS)
1. **Run local checks first:**
   ```bash
   yarn lint && yarn typecheck && yarn test && yarn build
   ```

2. **Create branch with proper name:**
   - `feat/ticket-description`
   - `fix/bug-description`
   - `chore/task-description`

3. **Push and Create PR via GitHub API**

### PR Requirements
- [ ] All local checks pass (lint, typecheck, test, build)
- [ ] Tests written for new code (test-driven-development)
- [ ] CI pipeline must pass
- [ ] At least 1 approval required
- [ ] No merge conflicts

### NEVER Merge Without:
- ✅ Tests passing
- ✅ CI passing
- ✅ Code reviewed

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
