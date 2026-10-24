# Repository audit & implementation record

## Source inspected

- GitHub repository: `vishvgxt/todoist`, default branch `main`.
- Original HEAD inspected during this task: `f0231ab5ff4b867b2d197691a877321fd5500cd9` (`Add files via upload`, 2026-10-24). The preceding visible commit was `6bbb6bbb33a6e5a4ed8fed6adeb5143de50fdd2c`.
- Original root files: `index.html`, `style.css`, `app.js`, `README.md`.
- The earlier project ZIP was also inspected; its four source files matched the original app architecture and behaviours.

## Original architecture and behaviour

The original app was a static single-page Orbit to-do list. `index.html` contained one task composer, counters, filters, search, a task list, and theme toggle. `app.js` was a single immediately-invoked script; its state was a single task array stored at `orbit-tasks-v1`. Task records used `id`, `title`, `priority`, `due`, `done`, and numeric `created` timestamp. It supported create, complete/reopen, title edit, delete, search, all/active/completed filtering, completed-task clearing, due-date/overdue display, counters, and `orbit-theme` preference. `style.css` provided the Orbit purple/lime identity, 3D stat cards, hover/transition polish, and a mobile layout. GSAP 3.12.5 and Google Fonts loaded from CDNs; the app's basic operations had no server dependency.

## Findings and risks

1. All logic lived in one script with no entity/service boundaries or automated tests.
2. localStorage stored only tasks and theme; there was no schema version, migration, import/export, or recovery path.
3. The model could not represent academic relationships, learning milestones, practice attempts, sessions, notes, revisions, or tests.
4. Progress was task completion only and could not distinguish planning, time logged, practice accuracy, or learning evidence.
5. There was one task-list screen rather than navigable academic modules.
6. External font/animation resources were nonessential but loaded from CDNs.
7. User data was device/browser-local, with no sync or authenticated backend.
8. The original reduced-motion styling existed, but accessible navigation, modal workflows, broader keyboard use, and small-screen module layouts were not part of the old application.

## Implementation plan and decisions

- Keep static GitHub Pages compatibility and avoid a framework/build dependency.
- Separate pure metrics/date/migration rules (`domain.js`) from persistence (`storage.js`) and view/workflow orchestration (`app.js`).
- Add a versioned record document and stable IDs for subjects, chapters, topics, goals, tasks, sessions, practice modules/attempts, notes, revisions, tests, calendar events, and audit history.
- Prefer IndexedDB with a versioned localStorage fallback; preserve `orbit-tasks-v1`, back it up before conversion, and preserve `orbit-theme` when bootstrapping a new workspace.
- Keep tasks, planned blocks, finished sessions, topic milestones, practice outcomes, and test results as separate record types to avoid misleading aggregate metrics.
- Make backup/restore and CSV/Markdown export part of the application, and retain an independent pre-import recovery snapshot.
- Keep external fonts optional; do not depend on GSAP or external chart libraries for core operations.
- Test pure calculations and migration mapping in Node; use a browser walkthrough for release qualification when a browser environment is available.

## Verification checklist

| Check | Result |
|---|---|
| Original HTML/CSS/JS/README inspected | Complete |
| Original storage key and task fields identified | Complete (`orbit-tasks-v1`, including `due`, `done`, `created`) |
| Static architecture and deployment assumption preserved | Complete |
| JavaScript syntax check | Passed (`npm run check`) |
| Domain unit tests | Passed (7/7) |
| CSS parser check | Passed (0 top-level parse errors; braces balanced) |
| Responsive CSS and reduced-motion rules added | Implemented; manual device review still required |
| Browser interaction smoke test | Blocked in this environment: browser navigation to local `file://`/`127.0.0.1` was rejected with `ERR_BLOCKED_BY_ADMINISTRATOR` |
| GitHub write/deployment | Not completed; prior GitHub integration writes returned 403 `Resource not accessible by integration` |

## Remaining release gaps

This is a broad working static foundation, not a claim that every requested production feature has passed full end-to-end qualification. Drag-and-drop scheduling, recurring tasks, browser push/background notifications, file attachments, rich equation rendering, advanced multi-filter practice search, chapter-level negative-marking breakdowns, per-subject marks splits inside a test, cloud sync/authentication, and a preloaded syllabus are not implemented. A full browser and real-device acceptance pass remains necessary. The app does not invent study history or test results.
