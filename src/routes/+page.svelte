<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { habits, getHabits, addHabit } from "$lib/stores/habits";
  import { getDailyLog, saveDailyLog, type DailyLogDraft } from "$lib/stores/daily-log";
  import { db } from "$lib/db/schema";
  import { calculateStreak } from "$lib/logic/streaks";
  import { toggleEntry } from "$lib/logic/toggle-entry";
  import { toDateKey } from "$lib/logic/date-key";
  import { getQuoteOfTheDay } from "$lib/content/quotes";
  import HabitCard from "$lib/components/HabitCard.svelte";

  type PriorityKey = "spiritualWin" | "mentalWin" | "physicalWin";

  const todayKey = toDateKey(new Date());
  const quote = getQuoteOfTheDay(todayKey);

  const priorities: { key: PriorityKey; label: string; accent: string; jp: string }[] = [
    { key: "spiritualWin", label: "Spiritual Win", accent: "var(--color-neon-purple)", jp: "精神" },
    { key: "mentalWin", label: "Mental Win", accent: "var(--color-neon-cyan)", jp: "心" },
    { key: "physicalWin", label: "Physical Win", accent: "var(--color-neon-pink)", jp: "体" }
  ];

  let priorityValues: Record<PriorityKey, string> = {
    spiritualWin: "",
    mentalWin: "",
    physicalWin: ""
  };
  let gratitudeItems: string[] = ["", "", ""];
  let reflection = "";

  let newHabitName = "";
  let streaks: Record<number, number> = {};
  let completedForDate: Record<number, boolean> = {};
  let loading = true;
  let mounted = false;

  // The URL's ?date= param drives which day is being viewed/edited. Future
  // dates are clamped back to today — there's no sensible "future" entry.
  // Reading searchParams is disallowed on a prerendered page, so this is
  // guarded to only ever evaluate client-side (the app is fully client-
  // rendered anyway; the prerendered shell is just the initial "today" view).
  $: requestedDateKey = browser ? $page.url.searchParams.get("date") || todayKey : todayKey;
  $: viewDateKey = requestedDateKey > todayKey ? todayKey : requestedDateKey;
  $: isToday = viewDateKey === todayKey;
  $: dateLabel = formatDisplayDate(viewDateKey);

  function dateKeyToDate(dateKey: string): Date {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function shiftDateKey(dateKey: string, deltaDays: number): string {
    const date = dateKeyToDate(dateKey);
    date.setDate(date.getDate() + deltaDays);
    return toDateKey(date);
  }

  function formatDisplayDate(dateKey: string): string {
    if (dateKey === todayKey) return "Today";
    return dateKeyToDate(dateKey).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
  }

  function navigateToDate(dateKey: string) {
    const url = new URL($page.url);
    if (dateKey === todayKey) {
      url.searchParams.delete("date");
    } else {
      url.searchParams.set("date", dateKey);
    }
    void goto(url, { replaceState: false, keepFocus: true, noScroll: true });
  }

  // No freeze-count tracking exists on the Habit record yet, so streaks are
  // calculated with zero freezes available until that's added to the schema.
  async function refreshHabitStats(dateKey: string) {
    const all = await getHabits();
    const nextStreaks: Record<number, number> = {};
    const nextCompletedForDate: Record<number, boolean> = {};

    for (const habit of all) {
      const entries = await db.entries.where({ habitId: habit.id }).sortBy("date");
      nextStreaks[habit.id] = calculateStreak(entries, 0);
      nextCompletedForDate[habit.id] = entries.some(
        (entry) => entry.date === dateKey && entry.completed
      );
    }

    streaks = nextStreaks;
    completedForDate = nextCompletedForDate;
    loading = false;
  }

  async function loadDailyLog(dateKey: string) {
    const log = await getDailyLog(dateKey);
    priorityValues = {
      spiritualWin: log.spiritualWin,
      mentalWin: log.mentalWin,
      physicalWin: log.physicalWin
    };
    gratitudeItems = [...log.gratitude];
    reflection = log.reflection;
  }

  function persistField(patch: Partial<DailyLogDraft>) {
    void saveDailyLog(viewDateKey, patch);
  }

  async function handleToggle(habitId: number) {
    await toggleEntry(habitId, viewDateKey);
    await refreshHabitStats(viewDateKey);
  }

  async function handleAddHabit() {
    const name = newHabitName.trim();
    if (!name) return;
    await addHabit(name);
    newHabitName = "";
    await refreshHabitStats(viewDateKey);
  }

  // Gated on `mounted` so this never touches IndexedDB during SSR/prerender,
  // and re-runs whenever the viewed date changes (nav buttons, back/forward).
  $: if (mounted) {
    void refreshHabitStats(viewDateKey);
    void loadDailyLog(viewDateKey);
  }

  onMount(() => {
    mounted = true;
  });
</script>

<main class="page">
  <header class="masthead">
    <span class="wordmark">KAIZEN-80</span>
    <p class="quote">{quote}</p>

    <nav class="date-nav">
      <button
        type="button"
        class="date-nav-btn"
        aria-label="Previous day"
        on:click={() => navigateToDate(shiftDateKey(viewDateKey, -1))}
      >
        ‹
      </button>
      <span class="date-label">{dateLabel}</span>
      <button
        type="button"
        class="date-nav-btn"
        aria-label="Next day"
        disabled={isToday}
        on:click={() => navigateToDate(shiftDateKey(viewDateKey, 1))}
      >
        ›
      </button>
      {#if !isToday}
        <button type="button" class="date-today-btn" on:click={() => navigateToDate(todayKey)}>
          Today
        </button>
      {/if}
    </nav>
  </header>

  <section class="priorities">
    {#each priorities as priority (priority.key)}
      <div class="panel priority-box" style="--panel-accent: {priority.accent}">
        <h2><span class="jp-tag">{priority.jp}</span>{priority.label}</h2>
        <input
          type="text"
          placeholder="Today's win..."
          bind:value={priorityValues[priority.key]}
          on:blur={() => persistField({ [priority.key]: priorityValues[priority.key] })}
        />
      </div>
    {/each}
  </section>

  <section class="panel checklist-panel" style="--panel-accent: var(--color-neon-blue)">
    <h2>
      <span class="jp-tag">今日</span>{isToday ? "Today's Checklist" : `${dateLabel}'s Checklist`}
    </h2>

    {#if loading}
      <p class="muted">Loading...</p>
    {:else if $habits.length === 0}
      <p class="muted">No habits yet — add one below.</p>
    {:else}
      <ul class="habit-list">
        {#each $habits as habit (habit.id)}
          <li>
            <HabitCard
              name={habit.name}
              streak={streaks[habit.id] ?? 0}
              completedToday={completedForDate[habit.id] ?? false}
              on:toggle={() => handleToggle(habit.id)}
            />
          </li>
        {/each}
      </ul>
    {/if}

    <form class="add-habit-form" on:submit|preventDefault={handleAddHabit}>
      <input type="text" placeholder="New habit..." bind:value={newHabitName} />
      <button type="submit">Add</button>
    </form>
  </section>

  <section class="panel gratitude-panel" style="--panel-accent: var(--color-neon-pink)">
    <h2><span class="jp-tag">感謝</span>I am grateful for...</h2>
    <ol class="gratitude-list">
      {#each gratitudeItems as _, i}
        <li>
          <span class="gratitude-index">{i + 1}</span>
          <input
            type="text"
            bind:value={gratitudeItems[i]}
            on:blur={() => persistField({ gratitude: gratitudeItems })}
          />
        </li>
      {/each}
    </ol>
  </section>

  <section class="panel reflection-panel" style="--panel-accent: var(--color-neon-purple)">
    <h2><span class="jp-tag">内省</span>Daily Reflection</h2>
    <textarea
      class="reflection"
      rows="6"
      placeholder="How did today go?"
      bind:value={reflection}
      on:blur={() => persistField({ reflection })}
    ></textarea>
  </section>
</main>

<style>
  .page {
    min-height: 100vh;
    box-sizing: border-box;
    background: transparent;
    color: var(--color-text-primary);
    font-family: var(--font-family-base);
    padding: 2.5rem 1.5rem 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
  }

  .masthead {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    text-align: center;
  }

  .wordmark {
    font-family: var(--font-retro);
    font-size: 0.85rem;
    letter-spacing: 0.3em;
    color: var(--color-neon-pink);
    text-shadow:
      -1.5px 0 0 rgba(255, 46, 196, 0.8),
      1.5px 0 0 rgba(0, 240, 255, 0.8),
      0 0 8px var(--color-neon-pink),
      0 0 18px var(--color-neon-purple);
  }

  .quote {
    margin: 0;
    max-width: 40rem;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .date-nav {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.25rem;
  }

  .date-nav-btn,
  .date-today-btn {
    font-family: var(--font-family-base);
    background: transparent;
    border: 1px solid var(--color-neon-blue);
    border-radius: 0.3rem;
    color: var(--color-text-primary);
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      opacity 0.15s ease;
  }

  .date-nav-btn {
    width: 1.9rem;
    height: 1.9rem;
    line-height: 1;
    font-size: 1.1rem;
  }

  .date-nav-btn:hover:not(:disabled),
  .date-today-btn:hover {
    border-color: var(--color-neon-cyan);
    box-shadow: 0 0 8px var(--color-neon-cyan);
  }

  .date-nav-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .date-label {
    min-width: 9rem;
    text-align: center;
    font-size: 0.85rem;
    color: var(--color-neon-cyan);
  }

  .date-today-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .priorities {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    width: 100%;
    max-width: 48rem;
  }

  @media (max-width: 640px) {
    .priorities {
      grid-template-columns: 1fr;
    }
  }

  .panel {
    position: relative;
    width: 100%;
    max-width: 48rem;
    box-sizing: border-box;
    background: var(--color-bg-surface);
    border: 1px solid var(--panel-accent, var(--color-neon-blue));
    border-radius: 0.35rem;
    padding: 1.1rem 1.25rem;
    box-shadow:
      0 0 6px color-mix(in srgb, var(--panel-accent, var(--color-neon-blue)) 65%, transparent),
      0 0 24px color-mix(in srgb, var(--panel-accent, var(--color-neon-blue)) 45%, transparent),
      0 0 56px color-mix(in srgb, var(--panel-accent, var(--color-neon-blue)) 28%, transparent),
      inset 0 0 20px color-mix(in srgb, var(--panel-accent, var(--color-neon-blue)) 8%, transparent);
  }

  .panel::before,
  .panel::after {
    content: "";
    position: absolute;
    width: 0.8rem;
    height: 0.8rem;
    pointer-events: none;
  }

  .panel::before {
    top: -1px;
    left: -1px;
    border-top: 2px solid var(--panel-accent, var(--color-neon-blue));
    border-left: 2px solid var(--panel-accent, var(--color-neon-blue));
  }

  .panel::after {
    bottom: -1px;
    right: -1px;
    border-bottom: 2px solid var(--panel-accent, var(--color-neon-blue));
    border-right: 2px solid var(--panel-accent, var(--color-neon-blue));
  }

  .panel h2 {
    margin: 0 0 0.75rem;
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--panel-accent, var(--color-neon-blue));
  }

  .jp-tag {
    font-family: var(--font-retro);
    font-size: 1rem;
    text-transform: none;
    letter-spacing: 0;
    opacity: 0.8;
    text-shadow: 0 0 6px currentColor;
  }

  .priority-box {
    max-width: none;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .panel input[type="text"],
  .reflection {
    width: 100%;
    box-sizing: border-box;
    padding: 0.55rem 0.75rem;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-bg-elevated);
    border-radius: 0.3rem;
    color: var(--color-text-primary);
    font-family: var(--font-family-base);
  }

  .panel input[type="text"]:focus,
  .reflection:focus {
    outline: none;
    border-color: var(--panel-accent, var(--color-neon-cyan));
    box-shadow: 0 0 8px var(--panel-accent, var(--color-neon-cyan));
  }

  .habit-list {
    list-style: none;
    margin: 0 0 0.75rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .add-habit-form {
    display: flex;
    gap: 0.5rem;
  }

  .add-habit-form input {
    flex: 1;
    min-width: 0;
  }

  .add-habit-form button {
    flex: none;
    padding: 0.55rem 1rem;
    background: var(--color-neon-purple);
    color: var(--color-text-inverse);
    border: none;
    border-radius: 0.3rem;
    font-family: var(--font-family-base);
    font-weight: 600;
    cursor: pointer;
  }

  .add-habit-form button:hover {
    background: var(--color-neon-pink);
  }

  .gratitude-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .gratitude-list li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .gratitude-index {
    flex: none;
    width: 1.4rem;
    color: var(--panel-accent, var(--color-neon-pink));
    font-weight: 700;
    text-align: right;
  }

  .reflection {
    resize: vertical;
    line-height: 1.8rem;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent calc(1.8rem - 1px),
      color-mix(in srgb, var(--panel-accent, var(--color-neon-purple)) 30%, transparent) calc(1.8rem - 1px),
      color-mix(in srgb, var(--panel-accent, var(--color-neon-purple)) 30%, transparent) 1.8rem
    );
    background-attachment: local;
  }

  .muted {
    color: var(--color-text-muted);
  }
</style>
