document.addEventListener("DOMContentLoaded", () => {
  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const todoList = document.getElementById("todoList");
  const emptyState = document.getElementById("emptyState");
  const itemsLeft = document.getElementById("itemsLeft");
  const taskCounter = document.getElementById("taskCounter");
  const clearCompletedBtn = document.getElementById("clearCompletedBtn");
  const filterTabs = document.querySelectorAll(".filter-tabs .tab");
  const currentDateEl = document.getElementById("currentDate");

  // Display today's date
  const options = { weekday: "long", month: "short", day: "numeric" };
  if (currentDateEl) {
    currentDateEl.textContent = new Date().toLocaleDateString(undefined, options);
  }

  let todos = JSON.parse(localStorage.getItem("antigravity_todos")) || [
    { id: 1, text: "Explore Google Antigravity features", completed: true },
    { id: 2, text: "Build an HTML/CSS Todo application", completed: true },
    { id: 3, text: "Test parallel subagent tasks", completed: false }
  ];

  let currentFilter = "all";

  function saveTodos() {
    localStorage.setItem("antigravity_todos", JSON.stringify(todos));
  }

  function renderTodos() {
    todoList.innerHTML = "";

    const filtered = todos.filter((todo) => {
      if (currentFilter === "active") return !todo.completed;
      if (currentFilter === "completed") return todo.completed;
      return true;
    });

    if (filtered.length === 0) {
      emptyState.classList.add("visible");
    } else {
      emptyState.classList.remove("visible");
    }

    filtered.forEach((todo) => {
      const li = document.createElement("li");
      li.className = `todo-item ${todo.completed ? "completed" : ""}`;
      li.innerHTML = `
        <div class="todo-item-left">
          <div class="todo-checkbox" role="checkbox" aria-checked="${todo.completed}" tabindex="0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span class="todo-text">${escapeHtml(todo.text)}</span>
        </div>
        <button class="delete-btn" aria-label="Delete task" title="Delete">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;

      // Toggle checkbox
      const checkbox = li.querySelector(".todo-checkbox");
      checkbox.addEventListener("click", () => toggleTodo(todo.id));
      checkbox.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTodo(todo.id);
        }
      });

      // Delete button
      const deleteBtn = li.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTodo(todo.id);
      });

      todoList.appendChild(li);
    });

    // Update counts
    const activeCount = todos.filter((t) => !t.completed).length;
    itemsLeft.textContent = `${activeCount} ${activeCount === 1 ? "item" : "items"} remaining`;
    taskCounter.textContent = `${activeCount} pending`;
  }

  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newTodo = {
      id: Date.now(),
      text: trimmed,
      completed: false
    };
    todos.unshift(newTodo);
    saveTodos();
    renderTodos();
  }

  function toggleTodo(id) {
    todos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTodos();
    renderTodos();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    renderTodos();
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.completed);
    saveTodos();
    renderTodos();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo(todoInput.value);
    todoInput.value = "";
    todoInput.focus();
  });

  clearCompletedBtn.addEventListener("click", clearCompleted);

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.filter;
      renderTodos();
    });
  });

  renderTodos();
});
