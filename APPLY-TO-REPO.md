# Apply this project to `vishvgxt/todoist`

The repository write connector returned HTTP 403 (`Resource not accessible by integration`) during prior write attempts, so these files have **not** been committed by ChatGPT. Use one of the routes below; do not share a GitHub password or personal access token in chat.

## Recommended: local Git (preserves normal commit history)

1. Download and extract `orbit-jee-student-os.zip`.
2. In a terminal, run:

```bash
git clone https://github.com/vishvgxt/todoist.git
cd todoist
# Copy the extracted project's CONTENTS into this repository root,
# replacing index.html, style.css, app.js, and README.md.
# Make sure domain.js and storage.js are also at the repository root.
git add index.html style.css app.js domain.js storage.js README.md package.json REPOSITORY-AUDIT.md APPLY-TO-REPO.md orbit-legacy-app.js tests/
git commit -m "Transform Orbit into JEE Student OS"
git push origin main
```

Copying files is a separate step between `cd todoist` and `git add`. From the parent directory, one possible command is:

```bash
cp -R /path/to/orbit-jee-student-os/. ./todoist/
```

Replace `/path/to/` with the actual extracted location. On Windows, use File Explorer copy/paste or `Copy-Item` in PowerShell.

## Browser-only upload

1. Open <https://github.com/vishvgxt/todoist> and choose **Add file → Upload files**.
2. Upload/replace `index.html`, `style.css`, `app.js`, and `README.md` at the repository root.
3. Add `domain.js`, `storage.js`, `package.json`, `REPOSITORY-AUDIT.md`, `APPLY-TO-REPO.md`, and `orbit-legacy-app.js` at the root; add `tests/domain.test.js` under a `tests/` directory.
4. Commit the changes to `main`. Ensure `index.html` remains in the root, not inside a nested `orbit-jee-student-os/` folder.
5. In **Settings → Pages**, choose **Deploy from a branch**, `main`, and `/(root)`.

## Run before or after upload

```bash
python -m http.server 8000
# open http://localhost:8000 in a browser
npm test
npm run check
```

No `npm install` is required. This app is static and stores data in the user's browser; publishing it does not create a cloud account or sync data across devices.
