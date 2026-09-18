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
