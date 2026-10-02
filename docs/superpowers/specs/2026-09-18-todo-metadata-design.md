# TODO Due Dates and Tags Design

## Purpose

Extend the browser-based TODO application so each task can optionally have a
due date and zero or more tags. The application must continue to support its
current add, complete, delete, clear-completed, and status-filter behavior.

## Scope

- Add an optional calendar input for a task due date.
- Add an optional text input for comma-separated task tags.
- Normalize tags by trimming whitespace, discarding empty values, and removing
  duplicates without changing their first-entered casing.
- Persist the due date and tags with each task in the existing
  `antigravity_todos` localStorage collection.
- Display a human-readable due date and tag chips on task cards when metadata
  exists.
- Keep pre-existing saved tasks valid when they have no due date or tags.

## User Experience

The add-task form will retain its primary text input and add a compact metadata
row beneath it:

- **Due date:** an optional native `date` input.
- **Tags:** an optional text input with a comma-separated placeholder.

Submitting the form creates a task only when its text is non-empty. The form
then clears all three inputs and returns focus to the task text field.

Task cards will place metadata below the task text. When supplied, the due date
will appear as a localized, readable date. Tags will render as separate chips.
Tasks without either value will keep the current compact card layout. Completed
tasks will retain the application's completed styling while their metadata
remains readable.

## Data Model and Persistence

Each newly created task will use this structure:

```js
{
  id: Date.now(),
  text: "Prepare presentation",
  completed: false,
  dueDate: "2026-09-30",
  tags: ["work", "important"]
}
```

`dueDate` is either an ISO calendar-date string in `YYYY-MM-DD` format or an
empty string. `tags` is always an array of normalized non-empty strings. The
renderer will treat missing `dueDate` and `tags` properties on previously saved
tasks as absent metadata, avoiding a disruptive localStorage migration.

## Implementation Boundaries

- `index.html` will add the two metadata form controls with accessible labels.
- `app.js` will read inputs on submission, normalize tags, store metadata,
  safely render optional metadata, and clear the added controls after submit.
- `style.css` will lay out the metadata fields and task-card metadata without
  changing the existing filters or controls.

No new dependencies, backend services, filters, sorting rules, or task editing
will be introduced.

## Error Handling and Accessibility

Native browser date validation will prevent invalid date input. Empty metadata
is allowed. Rendering will guard against missing or malformed legacy tag arrays
so a saved task cannot prevent the full list from rendering. User-entered tag
text will be HTML-escaped before it is inserted into card markup, just as task
text is.

The date and tags controls will have associated visible labels. Tag chips will
be plain descriptive text, and the existing keyboard-accessible completion
control will remain unchanged.

## Verification

Validate in a browser that:

1. A task can be added with neither metadata field.
2. A task persists an optional due date and multiple comma-separated tags
   across a page reload.
3. Tags are trimmed, empty entries are ignored, and duplicates are removed.
4. Metadata is safely rendered alongside old localStorage tasks that contain
   only `id`, `text`, and `completed`.
5. Existing active/completed/all filters, toggling, deletion, and
   clear-completed behavior continue to work.
