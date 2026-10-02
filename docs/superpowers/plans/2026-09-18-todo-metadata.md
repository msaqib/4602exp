# TODO Due Dates and Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to create TODO tasks with optional due dates and normalized multiple tags that persist and render safely.

**Architecture:** Add a small dependency-free metadata utility that owns date validation, tag normalization, and display formatting and can be verified with Node's built-in test runner. The existing page will load that utility before `app.js`; `app.js` will use it to store and render metadata, while HTML and CSS provide the accessible inputs and card presentation.

**Tech Stack:** HTML5, CSS3, browser localStorage, vanilla JavaScript, Node.js built-in `node:test`

**Spec:** `docs/superpowers/specs/2026-09-18-todo-metadata-design.md`

## Global Constraints

- Do not add dependencies, backend services, filters, sorting rules, or task editing.
- Persist tasks in the existing `antigravity_todos` localStorage collection.
- Store `dueDate` as a `YYYY-MM-DD` string or an empty string.
- Store `tags` as an array of normalized non-empty strings.
- Preserve the first-entered casing of each tag while removing duplicate tags.
- Treat missing or malformed legacy metadata as absent so old saved tasks still render.
- HTML-escape user-entered tag text before inserting it into task-card markup.
- Keep the existing completion, deletion, clear-completed, and active/completed/all filtering behavior.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `todo-metadata.js` | Browser/global and CommonJS metadata helpers: normalize tags, accept only real ISO calendar dates, and format display dates. |
| `tests/todo-metadata.test.js` | Node built-in tests for the metadata helper's normalization, legacy-data protection, and date handling. |
| `index.html` | Accessible task-form controls and utility script loading order. |
| `app.js` | Read, persist, clear, and safely render per-task metadata with the existing TODO lifecycle. |
| `style.css` | Responsive form metadata row plus due-date and tag-chip styles. |

### Task 1: Add tested task-metadata helpers

**Files:**
- Create: `todo-metadata.js`
- Create: `tests/todo-metadata.test.js`

**Interfaces:**
- Consumes: raw comma-separated tag text (`string`), saved task metadata (`{ dueDate?: unknown, tags?: unknown }`), and an optional locale (`string | string[] | undefined`).
- Produces: `TodoMetadata.normalizeTags(rawTags): string[]`, `TodoMetadata.getMetadata(todo): { dueDate: string, tags: string[] }`, and `TodoMetadata.formatDueDate(dueDate, locales?): string`.
- Produces: CommonJS exports for the Node test suite and `window.TodoMetadata` for `app.js`.

- [ ] **Step 1: Write the failing test**

Create `tests/todo-metadata.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  formatDueDate,
  getMetadata,
  normalizeTags
} = require("../todo-metadata.js");

test("normalizeTags trims values, removes blanks, and keeps the first casing", () => {
  assert.deepEqual(
    normalizeTags(" Work, ,home,work, HOME , errands "),
    ["Work", "home", "errands"]
  );
});

test("getMetadata protects rendering from missing and malformed legacy metadata", () => {
  assert.deepEqual(getMetadata({}), { dueDate: "", tags: [] });
  assert.deepEqual(
    getMetadata({ dueDate: "2026-02-30", tags: "work" }),
    { dueDate: "", tags: [] }
  );
});

test("getMetadata normalizes stored task metadata", () => {
  assert.deepEqual(
    getMetadata({
      dueDate: "2026-09-30",
      tags: ["Work", "home", "work", "", 42]
    }),
    { dueDate: "2026-09-30", tags: ["Work", "home"] }
  );
});

test("formatDueDate renders an ISO calendar date without timezone shifting", () => {
  assert.equal(formatDueDate("2026-09-30", "en-US"), "Sep 30, 2026");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/todo-metadata.test.js`

Expected: FAIL because `../todo-metadata.js` does not exist.

- [ ] **Step 3: Write the minimal implementation**

Create `todo-metadata.js` as a dependency-free UMD-style module:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.TodoMetadata = api;
})(typeof globalThis === "undefined" ? this : globalThis, () => {
  const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function isValidDueDate(value) {
    if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day;
  }

  function normalizeTags(rawTags) {
    if (typeof rawTags !== "string") return [];
    const seen = new Set();
    return rawTags.split(",").reduce((tags, tag) => {
      const trimmed = tag.trim();
      const key = trimmed.toLocaleLowerCase();
      if (trimmed && !seen.has(key)) {
        seen.add(key);
        tags.push(trimmed);
      }
      return tags;
    }, []);
  }

  function getMetadata(todo) {
    const tags = Array.isArray(todo.tags)
      ? normalizeTags(todo.tags.filter((tag) => typeof tag === "string").join(","))
      : [];
    return {
      dueDate: isValidDueDate(todo.dueDate) ? todo.dueDate : "",
      tags
    };
  }

  function formatDueDate(dueDate, locales) {
    if (!isValidDueDate(dueDate)) return "";
    return new Intl.DateTimeFormat(locales, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(`${dueDate}T00:00:00`));
  }

  return { formatDueDate, getMetadata, normalizeTags };
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/todo-metadata.test.js`

Expected: PASS with all four subtests passing.

- [ ] **Step 5: Commit**

```bash
git add todo-metadata.js tests/todo-metadata.test.js
git commit -m "feat: add todo metadata helpers"
```

### Task 2: Add accessible metadata form controls and visual styles

**Files:**
- Modify: `index.html:20-39`
- Modify: `index.html:67-67`
- Modify: `style.css:73-123`
- Modify: `style.css:172-202`

**Interfaces:**
- Consumes: the existing `#todoForm`, `#todoInput`, and styles for `.todo-input-bar`.
- Produces: `#dueDateInput` (`input[type="date"]`) and `#tagsInput` (`input[type="text"]`) for `app.js`.
- Produces: `.todo-metadata-inputs`, `.todo-metadata`, `.todo-due-date`, `.todo-tags`, and `.todo-tag` presentation classes for task rendering.

- [ ] **Step 1: Add labelled controls to the form**

Keep the existing text input and submit button. Immediately below `.todo-input-bar`, add:

```html
<div class="todo-metadata-inputs">
  <label class="metadata-field" for="dueDateInput">
    <span>Due date</span>
    <input type="date" id="dueDateInput">
  </label>
  <label class="metadata-field" for="tagsInput">
    <span>Tags</span>
    <input
      type="text"
      id="tagsInput"
      placeholder="work, personal"
      aria-describedby="tagsHelp"
    >
    <span class="sr-only" id="tagsHelp">Separate tags with commas.</span>
  </label>
</div>
```

Load the helper before the application script:

```html
<script src="todo-metadata.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 2: Style the form controls and task metadata**

Add these styles, using the existing color and spacing variables:

```css
.todo-metadata-inputs {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 10px;
}

.metadata-field {
  display: grid;
  gap: 5px;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.metadata-field input {
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #f8fafc;
  color: var(--text-main);
  font: inherit;
}

.metadata-field input:focus {
  outline: none;
  border-color: var(--primary);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.todo-item-left {
  align-items: flex-start;
}

.todo-content {
  min-width: 0;
  flex: 1;
}

.todo-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.todo-tag,
.todo-due-date {
  font-size: 0.75rem;
  line-height: 1;
  padding: 4px 7px;
  border-radius: 999px;
}

.todo-due-date {
  background: var(--primary-light);
  color: var(--primary);
}

.todo-tag {
  background: #f1f5f9;
  color: var(--text-muted);
}

.todo-item.completed .todo-due-date,
.todo-item.completed .todo-tag {
  color: var(--text-dim);
}

@media (max-width: 420px) {
  .todo-metadata-inputs {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Perform a manual visual validation**

Open `index.html` in a browser and verify:

1. Both controls are reachable by keyboard and their labels describe them.
2. The metadata controls retain a compact two-column layout on desktop and do not overflow on a narrow viewport.
3. Existing add button, tabs, and footer remain usable.

Expected: the form is accessible and responsive without altering existing controls.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "feat: add task metadata inputs"
```

### Task 3: Integrate task metadata into persistence and rendering

**Files:**
- Modify: `app.js:2-12`
- Modify: `app.js:42-58`
- Modify: `app.js:89-100`
- Modify: `app.js:124-129`
- Test: `tests/todo-metadata.test.js`

**Interfaces:**
- Consumes: `#dueDateInput`, `#tagsInput`, `window.TodoMetadata.getMetadata`, `window.TodoMetadata.normalizeTags`, and `window.TodoMetadata.formatDueDate`.
- Produces: localStorage task records with `dueDate: string` and `tags: string[]`, plus optional safe task-card metadata markup.

- [ ] **Step 1: Establish the failing browser behavior**

Open `index.html`, enter a task title, select `2026-09-30`, enter
`Work, home, work, , HOME`, and submit. Inspect the new
`antigravity_todos` record in DevTools.

Expected: the due date and tags are absent from the saved record and card
before the integration work, demonstrating the missing end-to-end behavior.

- [ ] **Step 2: Update application state and rendering**

In `app.js`:

1. Read `dueDateInput` and `tagsInput` beside the existing `todoInput`.
2. Change `addTodo` to accept `(text, dueDate, tags)` and add:

```js
dueDate: TodoMetadata.getMetadata({ dueDate }).dueDate,
tags: TodoMetadata.normalizeTags(tags)
```

3. In `renderTodos`, derive `const metadata = TodoMetadata.getMetadata(todo);` before constructing the list item.
4. Build optional metadata markup only when `metadata.dueDate` or `metadata.tags.length` is nonzero:

```js
const dueDateMarkup = metadata.dueDate
  ? `<span class="todo-due-date">Due ${escapeHtml(
      TodoMetadata.formatDueDate(metadata.dueDate)
    )}</span>`
  : "";
const tagsMarkup = metadata.tags
  .map((tag) => `<span class="todo-tag">${escapeHtml(tag)}</span>`)
  .join("");
const metadataMarkup = dueDateMarkup || tagsMarkup
  ? `<div class="todo-metadata">${dueDateMarkup}${tagsMarkup}</div>`
  : "";
```

Wrap `.todo-text` and `metadataMarkup` in a `.todo-content` element, leaving the existing checkbox and delete button event wiring unchanged.

5. Submit all three form values, then set `todoInput.value`, `dueDateInput.value`, and `tagsInput.value` to `""` before returning focus to `todoInput`.

- [ ] **Step 3: Run the unit test suite**

Run: `node --test tests/todo-metadata.test.js`

Expected: PASS with all four subtests passing.

- [ ] **Step 4: Perform the browser regression validation**

Open `index.html`, clear or inspect `antigravity_todos` in DevTools, and verify:

1. Adding a task with no metadata creates the same compact card as before.
2. Adding `2026-09-30` and `Work, home, work, , HOME` stores `{ dueDate: "2026-09-30", tags: ["Work", "home"] }` in localStorage and displays a readable date plus two chips.
3. Reloading preserves the displayed due date and tags.
4. A legacy saved task containing only `id`, `text`, and `completed` renders without an error.
5. A saved task with `tags: "work"` or `dueDate: "2026-02-30"` renders without invalid metadata.
6. Checkbox click/keyboard toggling, delete, clear completed, and all three filter tabs still behave as before.

Expected: metadata works end-to-end while all previous TODO interactions remain intact.

- [ ] **Step 5: Commit**

```bash
git add app.js todo-metadata.js tests/todo-metadata.test.js
git commit -m "feat: persist todo due dates and tags"
```
