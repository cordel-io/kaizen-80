<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { calculateStreakMultiplier } from "$lib/logic/streak-multiplier";
  import { formatStreakPercentage } from "$lib/logic/format-streak";

  export let name: string;
  export let streak: number;
  export let completedToday: boolean;

  const dispatch = createEventDispatcher<{ toggle: void }>();

  $: improvement = formatStreakPercentage(calculateStreakMultiplier(streak));
</script>

<button
  type="button"
  class="habit-row"
  class:completed={completedToday}
  role="checkbox"
  aria-checked={completedToday}
  on:click={() => dispatch("toggle")}
>
  <span class="bracket-checkbox" aria-hidden="true">{completedToday ? "[x]" : "[ ]"}</span>
  <span class="habit-name">{name}</span>
  <span class="habit-streak">{streak} {streak === 1 ? "day" : "days"} · {improvement}</span>
</button>

<style>
  .habit-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem 0.6rem;
    border: none;
    background: none;
    font-family: var(--font-mono);
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .habit-row:hover {
    background: var(--color-bg-elevated);
  }

  .bracket-checkbox {
    flex: none;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text-muted);
    transition:
      color 0.15s ease,
      text-shadow 0.15s ease;
  }

  .habit-row:hover .bracket-checkbox {
    color: var(--color-glow-pink);
  }

  .habit-row.completed .bracket-checkbox {
    color: var(--color-glow-pink);
    text-shadow:
      0 0 6px var(--color-glow-pink),
      0 0 14px var(--color-glow-pink);
  }

  .habit-name {
    flex: 1;
    min-width: 0;
    font-size: 0.9rem;
    color: var(--color-text-primary);
  }

  .habit-row.completed .habit-name {
    color: var(--color-text-muted);
    text-decoration: line-through;
    text-decoration-color: var(--color-glow-pink);
  }

  .habit-streak {
    flex: none;
    font-size: 0.72rem;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .habit-row.completed .habit-streak {
    color: var(--color-glow-pink);
  }
</style>
