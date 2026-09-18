(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  try {
    if (typeof root !== "undefined") root.TodoMetadata = api;
  } catch (e) {
    /* ignore */
  }
})(typeof globalThis === "undefined" ? this : globalThis, function () {
  'use strict';

  var ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function isValidDueDate(value) {
    if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) return false;
    var parts = value.split('-').map(function (v) { return Number(v); });
    var year = parts[0], month = parts[1], day = parts[2];
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
    var date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function normalizeTags(rawTags) {
    if (typeof rawTags !== 'string') return [];
    var seen = new Set();
    return rawTags.split(',').reduce(function (acc, part) {
      var trimmed = String(part).trim();
      if (!trimmed) return acc;
      var key = trimmed.toLocaleLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        acc.push(trimmed);
      }
      return acc;
    }, []);
  }

  function getMetadata(todo) {
    if (!todo || typeof todo !== 'object') return { dueDate: '', tags: [] };
    var dueDate = '';
    if (isValidDueDate(todo.dueDate)) dueDate = todo.dueDate;

    var tags = [];
    if (Array.isArray(todo.tags)) {
      // keep only string tags
      var onlyStrings = todo.tags.filter(function (t) { return typeof t === 'string'; });
      tags = normalizeTags(onlyStrings.join(','));
    }

    return { dueDate: dueDate, tags: tags };
  }

  function formatDueDate(dueDate, locales) {
    if (!isValidDueDate(dueDate)) return '';
    var parts = dueDate.split('-').map(function (v) { return Number(v); });
    var year = parts[0], month = parts[1], day = parts[2];
    var date = new Date(Date.UTC(year, month - 1, day));
    // Force UTC formatting so local timezone doesn't shift the calendar date
    try {
      return new Intl.DateTimeFormat(locales, { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    } catch (e) {
      // Fallback simple ISO if Intl isn't available or errors
      return date.getUTCFullYear() + '-' + String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + String(date.getUTCDate()).padStart(2, '0');
    }
  }

  return { formatDueDate: formatDueDate, getMetadata: getMetadata, normalizeTags: normalizeTags };
});
