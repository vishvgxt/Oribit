# Orbit JEE Student OS

A local-first academic command centre for JEE Main / JEE Advanced preparation, built from the original Orbit to-do repository using vanilla HTML, CSS, and JavaScript ES modules. It deploys as a static site: **no build step, application server, account, or API key is required**.

## Repository audit and starting point

The source repository originally contained four root files: `index.html`, `style.css`, `app.js`, and `README.md`. It was a single-page task list with CSS 3D styling, GSAP from a CDN, localStorage key `orbit-tasks-v1`, task add/edit/complete/delete, search/filter, priorities, due dates, summary counters, and theme switching. The original UI depended on one large script and a single task array; there was no syllabus model, test suite, schema version, storage abstraction, or backup/restore workflow. Google Fonts and GSAP were network enhancements.

This implementation keeps the lightweight static-hosting approach and core task workflows while separating domain calculations and persistence. GSAP is not required for any core behaviour. The original task archive is included as `orbit-legacy-app.js` for audit/reference; it is not loaded by the new app.

## Features implemented

- **Dashboard:** daily tasks, actual logged minutes, subject allocation, last-seven-day session bars, milestone coverage, revisions due, upcoming tests, goals, and recent audit activity. Empty metrics stay empty instead of inventing results.
- **Task management:** create/edit/complete/reopen/delete, partial/blocked states, search, filters, priority, due dates, subject/chapter/topic links, time estimates, question counts, and goal associations.
- **Daily, weekly, monthly planning:** daily timeline and study blocks, weekly distribution and unfinished-task redistribution, monthly weekly milestones, and workload summaries. Plans are separate from completed session records.
- **Subjects, chapters, topics:** custom subjects, chapter estimates/dates/difficulty, topic status, configurable milestone checkboxes, personal objectives/doubts, and topic-level question metrics. Default topics have theory/examples/practice/revision milestones; checked milestones are coverage evidence, not mastery certification.
- **Study timer:** start, pause, resume, finish, and cancel; link sessions to subject/chapter/topic/task; save actual minutes, question counts, and summary. A running timer is paused when the page unloads/reopens; closed-tab time is not counted.
- **PYQ and practice centre:** custom modules (Main/Advanced PYQ, DPP, worksheet, mock, error log, etc.), linked subjects/chapters/topics, question-level outcome, difficulty, source reference, time, bookmark, and solution/mistake notes.
- **Notes/formula book:** Markdown/plain-text notes, categories, subject links, tags, pinning, search, safe text rendering, single-note Markdown export, and all-notes export. Raw HTML is never executed; math is kept as readable text rather than requiring an external renderer.
- **Revision planner:** due/upcoming/completed review lists, editable intervals, confidence/recall result, history events, and weak-topic flagging when a review is marked weak.
- **Tests and mock analysis:** manually recorded scores, maximum marks, question counts, duration, rank/percentile fields, analysis, accuracy and marks-percentage calculations, and trend bars. Empty score values do not become zero scores.
- **Analytics:** date-bounded 30-day session/task/question/revision summaries, subject time allocation, topic weakness list, syllabus milestone coverage, CSV report export, and metric definitions.
- **Calendar:** month grid plus agenda, showing tasks, study events, revisions, and test dates.
- **Settings:** study level, exam goal, available hours, preferred day window, light/dark theme, reduced motion, backup/import/export, record counts, and clear-data confirmation.
- **Responsive navigation:** desktop sidebar, mobile drawer, accessible labels, visible focus, reduced-motion support, and narrow-screen layouts.

## Architecture

- `index.html` — semantic shell, navigation, dialogs, and module entry point.
- `style.css` — design tokens, dark/light themes, responsive components, focus styles, and reduced-motion rules.
- `app.js` — view routing, rendering, forms, task/session workflows, and event delegation.
- `domain.js` — schema version, stable IDs, date helpers, migration mapping, and pure metric calculations.
- `storage.js` — IndexedDB adapter, localStorage fallback, legacy migration, backup validation, and import handling.
- `tests/domain.test.js` — automated unit tests for percentages, accuracy, topic milestones, test metrics, legacy migration, safe state merge, and local calendar dates.
- `package.json` — optional Node test/check commands; it does not add runtime dependencies to the hosted app.
- `orbit-legacy-app.js` — archived original app script for comparison only; not loaded by the app.

## Data model and storage

The schema is version 3. The root document contains `profile`, `settings`, `subjects`, `chapters`, `topics`, `goals`, `tasks`, `sessions`, `modules`, `attempts`, `notes`, `revisions`, `revisionEvents`, `tests`, `calendarEvents`, `activityTypes`, `audit`, and `activeSession`. Relationships use stable IDs rather than titles. Calendar dates use local `YYYY-MM-DD` strings; timestamps use ISO strings.

The app prefers IndexedDB (`orbit-jee-student-os`, object store `documents`) and maintains a best-effort localStorage mirror for small state documents (up to about 1.5 MB). Larger documents stay in IndexedDB and clear the old fallback mirror to prevent stale data from being mistaken for current state; if IndexedDB later becomes unavailable for a large workspace, export/restore recovery may be needed. This is **local storage, not cloud sync**. Data remains in the browser profile/device that created it. Clearing browser site data may remove the workspace.

### Legacy task migration

On first load without a current Orbit JEE state, the app checks `orbit-tasks-v1`. If found, it copies the raw JSON to a timestamped `orbit-tasks-v1-backup-*` localStorage key, maps tasks into the new schema, records a migration audit event, and leaves the original `orbit-tasks-v1` key untouched. Titles, IDs where present, due dates, priorities, completion status, and timestamps are preserved where possible. If parsing/migration fails, the original key is not deleted and an error is shown. Export a JSON backup before clearing or importing data.

### Backups and imports

The full backup format is JSON with `app`, `schemaVersion`, `exportedAt`, and `data`. Import files are limited to 10 MB, parsed as JSON, checked for the expected app/schema and record IDs, and merged by stable IDs or used to replace the workspace after explicit confirmation. A pre-import snapshot is saved under a separate recovery key before applying the import; Settings offers a restore action for the latest snapshot. The explicit clear-all action removes the workspace, legacy task key, and migration backups from local storage after confirmation. CSV export includes task, session, goal, attempt, test, and revision tables. Markdown export is available for notes.

## Run locally

Requires a modern browser. Use a local static server (recommended for ES modules and consistent IndexedDB behaviour):

```bash
python -m http.server 8000
```

Open <http://localhost:8000> from the project directory. Or use any static file server. Do not open the files from a `file://` URL if the browser blocks JavaScript modules.

Optional code checks (Node.js 20+ recommended):

```bash
npm test
npm run check
```

No `npm install` is needed; there are no runtime package dependencies.

## Deploy to GitHub Pages

1. Put the contents of this project directory at the root of `vishvgxt/todoist` (`index.html` must be in the repository root).
2. Commit and push the files to `main`.
3. In repository **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Wait for GitHub Pages to finish the deployment workflow. The public site URL will be shown in that settings page.

Google Fonts are optional polish; the app uses system fallbacks if they fail. No external chart or animation library is needed for core operations.

## Verification status and limitations

Automated domain tests cover key calculations and legacy migration mapping. `npm run check` validates JavaScript syntax. Manual browser walkthroughs and real-device testing are still required before calling this a production-audited product. This static first release does **not** implement account authentication, cross-device sync, web push/background notifications, drag-and-drop scheduling, file attachments, recurrence rules, a rich equation renderer, an imported pre-built JEE syllabus, or an online question bank. No exam scores, ranks, percentiles, streaks, or historic study records are pre-populated. Practice content must be entered by the student or referenced from lawfully obtained material.

There is no server-side backup, no multi-user access control, and no promise that browser storage survives device loss. Export backups regularly.
