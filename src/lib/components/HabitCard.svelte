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
  class="habit-card"
  class:completed={completedToday}
  aria-pressed={completedToday}
  on:click={() => dispatch("toggle")}
>
  <span class="habit-name">{name}</span>
  <span class="habit-streak">{streak} {streak === 1 ? "day" : "days"}</span>
  <span class="habit-improvement">{improvement}</span>
</button>

<style>
  .habit-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    width: 100%;
    padding: 1rem 1.25rem;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-neon-purple);
    border-radius: 0.5rem;
    color: var(--color-text-primary);
    font-family: var(--font-family-base);
    text-align: left;
    cursor: pointer;
    transition:
      box-shadow 0.15s ease,
      border-color 0.15s ease,
      transform 0.1s ease;
  }

  .habit-card:hover {
    border-color: var(--color-neon-cyan);
    box-shadow: 0 0 12px var(--color-neon-cyan);
  }

  .habit-card:active {
    transform: scale(0.99);
  }

  .habit-card.completed {
    border-color: var(--color-neon-green);
    box-shadow: 0 0 16px var(--color-neon-green);
  }

  .habit-name {
    font-size: 1.05rem;
    font-weight: 600;
  }

  .habit-streak {
    font-size: 0.9rem;
    color: var(--color-neon-cyan);
  }

  .habit-card.completed .habit-streak {
    color: var(--color-neon-green);
  }

  .habit-improvement {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
</style>
