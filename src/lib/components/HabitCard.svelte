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

<label class="habit-row" class:completed={completedToday}>
  <input
    type="checkbox"
    class="habit-checkbox"
    checked={completedToday}
    on:change={() => dispatch("toggle")}
  />
  <span class="habit-name">{name}</span>
  <span class="habit-streak">{streak} {streak === 1 ? "day" : "days"} · {improvement}</span>
</label>

<style>
  .habit-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    box-sizing: border-box;
    padding: 0.65rem 0.75rem;
    border-radius: 0.35rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .habit-row:hover {
    background: var(--color-bg-elevated);
  }

  .habit-checkbox {
    appearance: none;
    -webkit-appearance: none;
    margin: 0;
    flex: none;
    width: 1.15rem;
    height: 1.15rem;
    display: grid;
    place-content: center;
    border: 2px solid var(--color-neon-purple);
    border-radius: 0.25rem;
    background: transparent;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .habit-checkbox:hover {
    border-color: var(--color-neon-cyan);
    box-shadow: 0 0 8px var(--color-neon-cyan);
  }

  .habit-checkbox::before {
    content: "";
    width: 0.6rem;
    height: 0.6rem;
    transform: scale(0);
    transition: transform 0.1s ease;
    box-shadow: inset 1rem 1rem var(--color-neon-green);
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 45% 62%);
  }

  .habit-checkbox:checked {
    border-color: var(--color-neon-green);
    box-shadow: 0 0 10px var(--color-neon-green);
  }

  .habit-checkbox:checked::before {
    transform: scale(1);
  }

  .habit-name {
    flex: 1;
    min-width: 0;
    font-size: 0.95rem;
    color: var(--color-text-primary);
  }

  .habit-row.completed .habit-name {
    color: var(--color-text-muted);
    text-decoration: line-through;
    text-decoration-color: var(--color-neon-green);
  }

  .habit-streak {
    flex: none;
    font-size: 0.75rem;
    color: var(--color-neon-cyan);
    white-space: nowrap;
  }

  .habit-row.completed .habit-streak {
    color: var(--color-neon-green);
  }
</style>
