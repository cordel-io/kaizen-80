<script lang="ts">
  import { onMount } from "svelte";
  import { habits, getHabits, addHabit } from "$lib/stores/habits";
  import { db } from "$lib/db/schema";
  import { calculateStreak } from "$lib/logic/streaks";
  import { toggleEntry } from "$lib/logic/toggle-entry";
  import { toDateKey } from "$lib/logic/date-key";
  import HabitCard from "$lib/components/HabitCard.svelte";

  const todayKey = toDateKey(new Date());

  let newHabitName = "";
  let streaks: Record<number, number> = {};
  let completedToday: Record<number, boolean> = {};
  let loading = true;

  // No freeze-count tracking exists on the Habit record yet, so streaks are
  // calculated with zero freezes available until that's added to the schema.
  async function refreshStats() {
    const all = await getHabits();
    const nextStreaks: Record<number, number> = {};
    const nextCompletedToday: Record<number, boolean> = {};

    for (const habit of all) {
      const entries = await db.entries.where({ habitId: habit.id }).sortBy("date");
      nextStreaks[habit.id] = calculateStreak(entries, 0);
      nextCompletedToday[habit.id] = entries.some(
        (entry) => entry.date === todayKey && entry.completed
      );
    }

    streaks = nextStreaks;
    completedToday = nextCompletedToday;
    loading = false;
  }

  async function handleToggle(habitId: number) {
    await toggleEntry(habitId, todayKey);
    await refreshStats();
  }

  async function handleAddHabit() {
    const name = newHabitName.trim();
    if (!name) return;
    await addHabit(name);
    newHabitName = "";
    await refreshStats();
  }

  onMount(refreshStats);
</script>

<main class="page">
  <h1>Kaizen-80</h1>

  <form class="add-habit-form" on:submit|preventDefault={handleAddHabit}>
    <input type="text" placeholder="New habit..." bind:value={newHabitName} />
    <button type="submit">Add Habit</button>
  </form>

  {#if loading}
    <p class="muted">Loading...</p>
  {:else if $habits.length === 0}
    <p class="muted">No habits yet — add one above.</p>
  {:else}
    <ul class="habit-list">
      {#each $habits as habit (habit.id)}
        <li>
          <HabitCard
            name={habit.name}
            streak={streaks[habit.id] ?? 0}
            completedToday={completedToday[habit.id] ?? false}
            on:toggle={() => handleToggle(habit.id)}
          />
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  .page {
    min-height: 100vh;
    box-sizing: border-box;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-family: var(--font-family-base);
    padding: 2rem 1.5rem 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  h1 {
    font-family: var(--font-retro);
    color: var(--color-neon-pink);
    text-shadow:
      0 0 10px var(--color-neon-pink),
      0 0 24px var(--color-neon-purple);
    letter-spacing: 0.08em;
    margin: 0;
  }

  .add-habit-form {
    display: flex;
    gap: 0.5rem;
    width: 100%;
    max-width: 28rem;
  }

  .add-habit-form input {
    flex: 1;
    min-width: 0;
    padding: 0.6rem 0.85rem;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-neon-blue);
    border-radius: 0.4rem;
    color: var(--color-text-primary);
    font-family: var(--font-family-base);
  }

  .add-habit-form input:focus {
    outline: none;
    border-color: var(--color-neon-cyan);
    box-shadow: 0 0 8px var(--color-neon-cyan);
  }

  .add-habit-form button {
    padding: 0.6rem 1.1rem;
    background: var(--color-neon-purple);
    color: var(--color-text-inverse);
    border: none;
    border-radius: 0.4rem;
    font-family: var(--font-family-base);
    font-weight: 600;
    cursor: pointer;
  }

  .add-habit-form button:hover {
    background: var(--color-neon-pink);
  }

  .habit-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 28rem;
  }

  .muted {
    color: var(--color-text-muted);
  }
</style>
