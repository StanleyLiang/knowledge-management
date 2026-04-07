# Lexical.js 0.18 → 0.36.2 Upgrade Plan (Option B — Conservative Stop)

## Context

An internal project currently uses **Lexical.js 0.18**, has been running stably in production for **two years**, and needs a controlled upgrade. After cost/benefit analysis, the chosen target is **Lexical 0.36.2**, NOT the latest 0.42.

**Why stop at 0.36.2 instead of going to 0.42:**

- The project has been stable on 0.18 for 2 years with no specific bug or feature pulling it forward.
- The Table plugin and Code Highlight plugin were forked from the 0.18 `playground` package and customized. These forks cannot consume upstream improvements anyway, so the upside of newer versions is minimal.
- **0.39 introduces a JSON serialization shape change** for `ElementNode.textFormat` / `textStyle`. With 2 years of accumulated production `editorState` documents in mixed historical shapes, that change creates a high-risk silent-data-drift surface. Stopping at 0.36.2 avoids it entirely.
- **0.42 deprecates the Prism path in `@lexical/code`** and forces a migration to `@lexical/code-prism` or `@lexical/code-shiki`. The forked Code Highlight plugin would have to be re-aligned twice (once for table refactor in 0.30, once for the code package split in 0.42). Stopping at 0.36.2 avoids the second re-alignment.
- 0.36.2 still gives the project **two years of bug fixes**, tighter TypeScript types, improved selection / IME handling, and the relaxed `$generateNodesFromDOM` signature.

**Intended outcome**: After all phases complete, the project runs on Lexical 0.36.2; the forked Table plugin is patched to match 0.30+ internals; existing `editorState` documents continue to load and save **byte-identically** (no shape drift); the forked Code Highlight plugin is left untouched (it does not need re-alignment until 0.38+).

---

## Critical Constraints That Shape This Plan

1. **Executor model**: Internal Claude Code agent backed by **Qwen 3.5**, not Opus. Instructions must be explicit, mechanical, short, and leave no inference gaps.
2. **Session token budget**: **12.8k tokens per session** maximum. The upgrade CANNOT be completed in one session. Each phase below is sized to fit a single session and ends with a clean commit + handoff note.
3. **Forked plugins**: Table and Code Highlight are forks of Lexical 0.18 `playground`. Treat them as project-owned source code. **Do not replace forks with upstream imports.** Patch in place only when forced.
4. **Two years of production data**: There is a wide distribution of historical `editorState` JSON shapes in storage. Compatibility must hold for the **whole distribution**, not just recent documents.
5. **Full tooling**: The agent has `git`, `npm`/`pnpm`, build, lint, and test commands available.

---

## Global Rules for the Executing Agent (Qwen 3.5)

Read these rules before starting ANY phase. They apply to every phase.

1. **One phase per session.** Do not start phase N+1 in the same session as phase N. Commit and stop.
2. **Follow the phase checklist in order.** Do not skip steps. Do not reorder steps.
3. **No refactors.** Only the changes the step asks for. No renames, no cleanup, no "while I'm here".
4. **Pin exact versions.** Always pin `lexical` and every `@lexical/*` to the **same exact version** in `package.json`. No `^`. No `~`.
5. **Never use `npm audit fix --force` or `npm update`.**
6. **Run the Phase Verification block at the end of each phase.** Do not commit a red phase.
7. **Each phase ends with one commit** named `chore(lexical): upgrade to X.Y.Z (phase N)` and updates `docs/lexical-upgrade-progress.md` (created in Phase 0).
8. **If unsure, stop and write the question** into `docs/lexical-upgrade-progress.md` under `## Open Questions`. Hand off. Do not guess.
9. **Forked files are sacred.** Patch them in place. Do not import upstream replacements.
10. **EditorState compatibility is non-negotiable.** Round-trip diff must be **byte-identical** for all golden fixtures by the end of every phase.

---

## Known Breaking Changes Covered by This Plan

| Version   | Breaking Change                                                                                                                              | Phase That Handles It           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 0.19–0.25 | Selection API tightening, `NodeKey` typing, `$getRoot` return type                                                                           | Phase 1                         |
| 0.25–0.30 | `TableNode` internal refactor, `MarkdownTransformer` interface change, `DecoratorNode<T>` generic, `TableObserver` replaces `TableSelection` | Phase 2 (forked Table re-align) |
| 0.30–0.36 | `$generateNodesFromDOM` signature relax, clipboard API tightening, `createCommand` typing                                                    | Phase 3                         |
| 0.36.2    | `$generateNodesFromDOM` accepts any `ParentNode`                                                                                             | Phase 3 (source-compatible)     |

**Explicitly NOT covered (because we stop at 0.36.2):**

- 0.38.1 transform inheritance change
- 0.39 `textFormat` / `textStyle` serialization shape change ← **the main reason we stop**
- 0.41 CSS variable scoping change
- 0.42 Prism extraction / `@lexical/code` deprecation

---

## Phase 0 — Baseline & Inventory (1 session)

**Goal**: Produce a complete, machine-checkable inventory and baseline. **No code changes.**

### Steps

1. Create branch: `chore/lexical-upgrade-0.36`.
2. Capture baseline into `docs/lexical-upgrade-baseline.txt`:
   - `node --version && npm --version`
   - `cat package.json | grep -E '"lexical|@lexical'`
   - `npm ls lexical 2>&1 || true`
   - `npm run build 2>&1 | tail -50`
   - `npm test 2>&1 | tail -50`
   - `npm run lint 2>&1 | tail -50`
   - Take screenshots of 3 representative documents in the running app and save under `docs/lexical-upgrade-screenshots/baseline/`.
3. Create `docs/lexical-upgrade-progress.md` with this exact template:

   ```markdown
   # Lexical Upgrade Progress (target: 0.36.2)

   | Phase | Target Version      | Status | Commit | Notes |
   | ----- | ------------------- | ------ | ------ | ----- |
   | 0     | 0.18 (baseline)     | [ ]    |        |       |
   | 1     | 0.25.11             | [ ]    |        |       |
   | 2     | 0.30.0              | [ ]    |        |       |
   | 3     | 0.36.2              | [ ]    |        |       |
   | 4     | 0.36.2 final canary | [ ]    |        |       |

   ## Open Questions

   ## Handoff Notes for Next Session
   ```

4. Create `docs/lexical-upgrade-inventory.md` from these searches:
   - `grep -rn "from 'lexical'" src/`
   - `grep -rn "from '@lexical/" src/`
   - `grep -rn "extends DecoratorNode\|extends ElementNode\|extends TextNode" src/`
   - `grep -rn "exportJSON\|importJSON" src/`
   - `grep -rn "registerNodeTransform\|registerCommand" src/`
   - Record the **path** of the forked Table plugin directory.
   - Record the **path** of the forked Code Highlight plugin directory.
5. Build the **golden fixture set** at `test/fixtures/editor-state/` — these MUST cover the production data distribution, not just recent documents. Pick:
   - 1 newest document (last 30 days)
   - 1 document from ~1 year ago
   - 1 document from ~2 years ago (oldest available)
   - 1 "most complex" document (most custom nodes, biggest table, longest code block)
   - 1 document the team has previously seen bugs on (search bug tracker or commit history for hints)
     Save as `doc-1-newest.json`, `doc-2-1yr.json`, `doc-3-2yr.json`, `doc-4-complex.json`, `doc-5-history.json`. Anonymize PII before committing.
6. Commit: `chore(lexical): phase 0 baseline and inventory`.
7. Update progress doc: tick Phase 0, write 2 bullets in "Handoff Notes" pointing the next session at Phase 1.

### Files to Modify (Phase 0)

- `docs/lexical-upgrade-baseline.txt` (new)
- `docs/lexical-upgrade-progress.md` (new)
- `docs/lexical-upgrade-inventory.md` (new)
- `docs/lexical-upgrade-screenshots/baseline/*.png` (new)
- `test/fixtures/editor-state/*.json` (new, 5 files, PII-anonymized)

### Phase 0 Verification

- [ ] Branch `chore/lexical-upgrade-0.36` exists
- [ ] All inventory files non-empty
- [ ] 5 fixtures saved, PII removed
- [ ] Baseline screenshots saved
- [ ] Progress doc lists 4 upcoming phases
- [ ] `git status` clean

---

## Phase 1 — Bump to 0.25.11 (1 session)

**Goal**: First version jump. Fix only TypeScript/runtime errors that 0.19–0.25 introduces. **Do NOT touch the forked Table or Code Highlight plugins yet** — Phase 2 handles Table; Code Highlight is left alone for the entire upgrade.

### Steps

1. In `package.json`, change every `lexical` and `@lexical/*` entry to exact `0.25.11`. No `^`.
2. Reinstall: `rm -rf node_modules package-lock.json && npm install`.
3. Build: `npm run build 2>&1 | tee build-phase1.log`.
4. For each TypeScript error in `build-phase1.log`:
   - **If the error is inside the forked Table plugin**, prepend `// @ts-expect-error lexical 0.25 upgrade — fixed in phase 2` to the offending line. Do NOT touch logic.
   - **If the error is inside the forked Code Highlight plugin**, prepend `// @ts-expect-error lexical 0.25 upgrade — kept as-is for option B` and leave it. The Code Highlight fork stays at 0.18-era APIs throughout this entire upgrade; we only silence the type checker.
   - **Otherwise**, fix the type using the new signature. Common fixes: `$getSelection()` may return `BaseSelection | null` — narrow with `$isRangeSelection(sel)` before use; `NodeKey` is now branded — use the constructor function instead of casting.
5. Test: `npm test 2>&1 | tee test-phase1.log`. Same rule: real fix outside forks; `it.skip` with a TODO comment inside forks.
6. Round-trip sanity script — create `test/lexical-roundtrip.mjs`:
   - Use `createHeadlessEditor` from `@lexical/headless` with all project nodes registered.
   - For each fixture in `test/fixtures/editor-state/`, `parseEditorState` then `JSON.stringify(editor.getEditorState())`. Print whether load throws.
   - This phase only requires "loads without throwing". Strict diff comes in Phase 3.
7. Run: `node test/lexical-roundtrip.mjs`. **All 5 fixtures must load without exceptions.**
8. Commit: `chore(lexical): upgrade to 0.25.11 (phase 1)`.
9. Update progress doc. List every `@ts-expect-error` you added so Phase 2 knows what to clean up.

### Files to Modify (Phase 1)

- `package.json`, `package-lock.json`
- Selection / command call sites flagged by the compiler
- `test/lexical-roundtrip.mjs` (new)
- **NOT** the forked Table plugin (silenced only)
- **NOT** the forked Code Highlight plugin (silenced only)

### Phase 1 Verification

- [ ] `npm run build` exits 0
- [ ] `npm test` exits 0 (skips inside forks allowed)
- [ ] `node test/lexical-roundtrip.mjs` loads all 5 fixtures without throwing
- [ ] Progress doc updated with `@ts-expect-error` inventory

---

## Phase 2 — Bump to 0.30.0 + Re-align Forked Table Plugin (1 session, **HIGHEST RISK**)

**Goal**: Patch the forked Table plugin against the 0.25 → 0.30 internal refactor. This is the structurally hardest phase.

### Steps

1. Bump every `lexical*` pin to exact `0.30.0`. Reinstall.
2. Build: `npm run build 2>&1 | tee build-phase2.log`.
3. Open the forked Table plugin directory (path from Phase 0 inventory).
4. Apply these known patches to the fork:
   - **`$createTableNodeWithDimensions(rows, cols, includeHeaders)`** — `includeHeaders` is now an object: `{ rows: boolean; columns: boolean }`. Update all call sites.
   - **`TableObserver`** replaces the older `TableSelection` helper. The fork's drag/selection handlers must switch class. Look at upstream `@lexical/table` source for the new constructor signature; **do not copy upstream wholesale**, only mirror the API surface the fork uses.
   - **`getCellIndexFromPoint` / cell coordinate helpers** — some have been renamed. Match against the new exports of `@lexical/table@0.30.0`.
   - **Command priority constants** — lower any `COMMAND_PRIORITY_CRITICAL` on table command listeners to `COMMAND_PRIORITY_HIGH` if they were using CRITICAL only to win against built-ins.
5. Remove every `// @ts-expect-error lexical 0.25 upgrade — fixed in phase 2` marker inside the forked Table plugin. They must all be gone by the end of this phase.
6. **Markdown transformers**: if the project defines custom transformers, ensure they expose the discriminator `type: 'element' | 'text-match'` correctly. Check the inventory for `MarkdownTransformer` references.
7. Run roundtrip script. **All 5 fixtures must load**, and `doc-4-complex.json` (which has tables) must produce a valid in-memory tree — you can verify by counting `TableNode` instances after load.
8. Build, test, lint — all green.
9. **Manual smoke test** (record results in progress doc):
   - [ ] Create a 3×3 table via the toolbar
   - [ ] Add a row
   - [ ] Merge two cells
   - [ ] Resize a column
   - [ ] Save document, reload, confirm state preserved
10. Commit: `chore(lexical): upgrade to 0.30.0 + re-align forked table plugin (phase 2)`.

### Files to Modify (Phase 2)

- `package.json`, `package-lock.json`
- The entire forked Table plugin directory
- Any files that import from the forked Table plugin and break due to its API changes
- Custom Markdown transformer files (if any)
- **NOT** the forked Code Highlight plugin (still silenced from Phase 1)

### Phase 2 Verification

- [ ] Build green, tests green, lint green
- [ ] No `@ts-expect-error` remains inside the forked Table plugin
- [ ] Roundtrip script loads all 5 fixtures
- [ ] Manual table smoke test checklist complete
- [ ] Progress doc updated

---

## Phase 3 — Bump to 0.36.2 (1 session)

**Goal**: Reach the target version. Handle 0.30 → 0.36 DOM and clipboard API adjustments. **Lowest-risk phase.**

### Steps

1. Bump every pin to exact `0.36.2`. Reinstall.
2. Build. Fix type errors at:
   - `$generateNodesFromDOM(...)` call sites — new signature accepts any `ParentNode`, mostly source-compatible. Watch for `Document | null` narrowing.
   - `$generateHtmlFromNodes(...)` — verify return type is still `string`.
   - `@lexical/clipboard` `$insertDataTransferForRichText` — confirm signature.
3. Run roundtrip script. **From this phase onward the script must do strict diff:**
   - Update `test/lexical-roundtrip.mjs`: load fixture → serialize → load again → serialize again. Compare. **Any non-empty diff is a Phase 3 failure.**
   - If a fixture diffs, it means the fork or a custom node's `importJSON` is mutating the shape. Fix the `importJSON` (add fallbacks for missing fields) until diff is empty for **all 5 fixtures**.
4. Build, test, lint — all green.
5. **Manual smoke test** (record in progress doc):
   - [ ] Paste rich HTML from a browser tab
   - [ ] Copy from editor and paste into a plain text target
   - [ ] Open `doc-3-2yr.json` (the oldest fixture) — confirm visual rendering matches the Phase 0 baseline screenshot
6. Commit: `chore(lexical): upgrade to 0.36.2 (phase 3)`.

### Files to Modify (Phase 3)

- `package.json`, `package-lock.json`
- Files that call `$generateNodesFromDOM`, `$generateHtmlFromNodes`, or clipboard helpers
- `test/lexical-roundtrip.mjs` (upgrade to strict diff mode)
- Any custom node's `importJSON` that shows up in roundtrip diffs

### Phase 3 Verification

- [ ] Build, test, lint green
- [ ] Strict roundtrip diff is **empty** for all 5 fixtures
- [ ] Manual smoke test complete
- [ ] Visual diff vs baseline screenshots is acceptable

---

## Phase 4 — Production Canary + Final Verification (1 session)

**Goal**: Before merging the upgrade branch, prove against **real production data at scale** that no document silently drifts when loaded by Lexical 0.36.2. This is the safety net the 2-year production history demands.

### Steps

1. Confirm Phase 3 is committed and progress doc is up to date.
2. Write a **read-only canary script** at `scripts/lexical-canary.mjs`:
   - Connects to a **read replica** of production (or a recent full snapshot in staging — never the primary).
   - Pulls a random sample of `N=1000` `editorState` documents.
   - For each document: `parseEditorState` → `editor.getEditorState().toJSON()` → string-compare with the original.
   - Output:
     - Count of documents that loaded successfully
     - Count that threw on parse
     - Count that loaded but produced a non-empty diff (silent drift)
     - For diffing documents, save the first 10 examples to `canary-diff-samples/` for inspection
   - **NEVER write back to the database. NEVER call save APIs.**
3. Run the canary script against staging. Record results in `docs/lexical-upgrade-progress.md` under a new "Canary Results" section.
4. Decision rule:
   - **Parse failures > 0** → STOP. Investigate failing documents. Fix `importJSON` fallbacks. Re-run canary. Do not merge until parse failures = 0.
   - **Silent drift > 1% of sample** → STOP. Inspect `canary-diff-samples/`. The diff usually points at one specific custom node or one specific historical schema variant. Fix the relevant `importJSON` to preserve the original shape. Re-run.
   - **Parse failures = 0 AND drift ≤ 1%** → Acceptable. Document the residual drift cases in progress doc and proceed.
   - **Parse failures = 0 AND drift = 0** → Ideal. Proceed.
5. Run the **full regression** one final time:
   - `npm ci && npm run build && npm test && npm run lint`
   - `node test/lexical-roundtrip.mjs` (strict diff)
   - Manual smoke tests from Phases 2 and 3 re-run
   - Visual comparison of all 5 fixtures vs Phase 0 baseline screenshots
6. Update `README.md` if it documents a Lexical version.
7. Update `docs/lexical-upgrade-progress.md`: mark Phase 4 done, move "Open Questions" into a closing "Known Follow-ups" section.
8. Commit: `chore(lexical): phase 4 canary results and final verification`.
9. Open a PR against `main` with description containing:
   - Why we stopped at 0.36.2 (link to this plan's Context section)
   - List of all 4 phase commit SHAs
   - Canary script results
   - Manual smoke test checklist with results
   - Known follow-ups (e.g., "Code Highlight fork retains 0.18-era types behind `@ts-expect-error` markers — tracked in TICKET-XXX")

### Files to Modify (Phase 4)

- `scripts/lexical-canary.mjs` (new)
- `docs/lexical-upgrade-progress.md`
- `README.md` (only if it mentions a version)
- `canary-diff-samples/*.json` (new, gitignored or scrubbed; never commit raw production data)

### Phase 4 Verification

- [ ] Canary script run on staging against production-shaped data
- [ ] Parse failures = 0
- [ ] Silent drift ≤ 1% (or 0 ideally)
- [ ] Full regression green
- [ ] PR opened with complete description

---

## Session Handoff Protocol

Every session MUST end with these steps so the next 12.8k-token session can resume instantly:

1. Commit your work using the phase's prescribed commit message.
2. In `docs/lexical-upgrade-progress.md`:
   - Tick the phase checkbox.
   - Paste the commit SHA.
   - Under "Handoff Notes for Next Session", write 2–3 bullets:
     - What phase is next
     - Any unexpected state (skipped tests, TODO markers, open questions)
     - The first command the next session should run (usually `git log -1 && cat docs/lexical-upgrade-progress.md`)
3. Push the branch.
4. **STOP.** Do not start the next phase in the same session.

## Rollback Protocol

If a phase fails and cannot be fixed in the same session:

1. Do **NOT** commit a broken state.
2. `git stash` or `git checkout -- .` to drop changes.
3. Write into the progress doc under "Open Questions" what failed and what you tried.
4. Hand off. A future session picks it up with fresh context.

## Critical Files Index (reference for every phase)

- `package.json` — version pins
- `docs/lexical-upgrade-progress.md` — session-to-session handoff (Phase 0 creates it)
- `docs/lexical-upgrade-inventory.md` — surface area map (Phase 0 creates it)
- `docs/lexical-upgrade-baseline.txt` — pre-upgrade baseline (Phase 0)
- `docs/lexical-upgrade-screenshots/baseline/*.png` — visual baseline (Phase 0)
- `test/fixtures/editor-state/*.json` — 5 golden fixtures spanning 2 years
- `test/lexical-roundtrip.mjs` — fixture loader (Phase 1 creates, Phase 3 upgrades to strict diff)
- `scripts/lexical-canary.mjs` — production canary (Phase 4)
- Forked Table plugin directory (path from Phase 0 inventory) — patched in Phase 2
- Forked Code Highlight plugin directory (path from Phase 0 inventory) — **NOT patched**, only `@ts-expect-error` silenced in Phase 1

## What This Plan Explicitly Does Not Do

- Does NOT upgrade past 0.36.2.
- Does NOT migrate the Code Highlight fork to `@lexical/code-prism` or `@lexical/code-shiki`.
- Does NOT replace forks with upstream packages.
- Does NOT touch any feature code unrelated to Lexical compatibility.
- Does NOT change `editorState` JSON shape on disk.
- Does NOT introduce a server-side migration job over historical data.
