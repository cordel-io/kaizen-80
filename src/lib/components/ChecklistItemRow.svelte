<script lang="ts">
  import { createEventDispatcher, tick } from "svelte";

  export let text: string;
  export let completed: boolean;

  const dispatch = createEventDispatcher<{
    toggle: void;
    rename: string;
    delete: void;
  }>();

  let editing = false;
  let editValue = text;
  let editInput: HTMLInputElement | null = null;

  async function startEdit() {
    editValue = text;
    editing = true;
    await tick();
    editInput?.focus();
    editInput?.select();
  }

  function commitEdit() {
    if (!editing) return;
    editing = false;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== text) {
      dispatch("rename", trimmed);
    }
  }

  function cancelEdit() {
    editing = false;
    editValue = text;
  }

  function handleEditKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  }

  function handleDelete() {
    if (confirm(`Delete task "${text}"?`)) {
      dispatch("delete");
    }
  }
</script>

<div class="task-row" class:completed>
  <button
    type="button"
    class="bracket-checkbox"
    role="checkbox"
    aria-checked={completed}
    aria-label={`Mark "${text}" ${completed ? "incomplete" : "complete"}`}
    on:click={() => dispatch("toggle")}
  >
    {completed ? "[x]" : "[ ]"}
  </button>

  {#if editing}
    <input
      class="task-edit-input"
      type="text"
      bind:value={editValue}
      bind:this={editInput}
      on:blur={commitEdit}
      on:keydown={handleEditKeydown}
    />
  {:else}
    <span class="task-text">{text}</span>
  {/if}

  <span class="task-actions">
    <button type="button" class="icon-btn" aria-label={`Edit "${text}"`} on:click={startEdit}>
      ✎
    </button>
    <button
      type="button"
      class="icon-btn icon-btn-delete"
      aria-label={`Delete "${text}"`}
      on:click={handleDelete}
    >
      ×
    </button>
  </span>
</div>

<style>
  .task-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem 0.6rem;
    font-family: var(--font-mono);
    transition: background 0.15s ease;
  }

  .task-row:hover,
  .task-row:focus-within {
    background: var(--color-bg-elevated);
  }

  .task-row:hover .task-actions,
  .task-row:focus-within .task-actions {
    opacity: 1;
  }

  .bracket-checkbox {
    flex: none;
    padding: 0;
    border: none;
    background: none;
    font-family: var(--font-mono);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      color 0.15s ease,
      text-shadow 0.15s ease;
  }

  .bracket-checkbox:hover {
    color: var(--color-glow-pink);
  }

  .task-row.completed .bracket-checkbox {
    color: var(--color-glow-pink);
    text-shadow:
      0 0 6px var(--color-glow-pink),
      0 0 14px var(--color-glow-pink);
  }

  .task-text {
    flex: 1;
    min-width: 0;
    font-size: 0.9rem;
    color: var(--color-text-primary);
  }

  .task-row.completed .task-text {
    color: var(--color-text-muted);
    text-decoration: line-through;
    text-decoration-color: var(--color-glow-pink);
  }

  .task-edit-input {
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    padding: 0.15rem 0.4rem;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-glow-pink);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }

  .task-edit-input:focus {
    outline: none;
    box-shadow: 0 0 6px color-mix(in srgb, var(--color-glow-pink) 35%, transparent);
  }

  .task-actions {
    flex: none;
    display: flex;
    gap: 0.3rem;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .icon-btn {
    flex: none;
    width: 1.4rem;
    height: 1.4rem;
    display: grid;
    place-content: center;
    padding: 0;
    border: none;
    background: none;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    line-height: 1;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .icon-btn:hover {
    color: var(--color-glow-pink);
  }

  .icon-btn-delete:hover {
    color: var(--color-accent-red);
  }
</style>
