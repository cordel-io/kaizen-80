<script lang="ts">
  import { onMount, onDestroy } from "svelte";
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

  const priorities: { key: PriorityKey; label: string; jp: string }[] = [
    { key: "spiritualWin", label: "SPIRITUAL WIN", jp: "精神" },
    { key: "mentalWin", label: "MENTAL WIN", jp: "心" },
    { key: "physicalWin", label: "PHYSICAL WIN", jp: "体" }
  ];

  let priorityValues: Record<PriorityKey, string> = {
    spiritualWin: "",
    mentalWin: "",
    physicalWin: ""
  };
  let gratitudeItems: string[] = ["", "", ""];
  let reflection = "";
  let reflectionUpdatedAt: string | undefined;
  let reflectionSaveTimer: ReturnType<typeof setTimeout> | undefined;

  let newHabitName = "";
  let streaks: Record<number, number> = {};
  let completedForDate: Record<number, boolean> = {};
  let loading = true;
  let mounted = false;

  let now = new Date();
  let clockTimer: ReturnType<typeof setInterval> | undefined;

  // The URL's ?date= param drives which day is being viewed/edited. Future
  // dates are clamped back to today — there's no sensible "future" entry.
  // Reading searchParams is disallowed on a prerendered page, so this is
  // guarded to only ever evaluate client-side (the app is fully client-
  // rendered anyway; the prerendered shell is just the initial "today" view).
  $: requestedDateKey = browser ? $page.url.searchParams.get("date") || todayKey : todayKey;
  $: viewDateKey = requestedDateKey > todayKey ? todayKey : requestedDateKey;
  $: isToday = viewDateKey === todayKey;
  $: dateLabel = formatDisplayDate(viewDateKey);
  $: clockLabel = now.toLocaleTimeString("en-GB", { hour12: false });
  $: pathLabel = `~/kaizen-80/${viewDateKey}`;
  $: wordCount = reflection.trim() ? reflection.trim().split(/\s+/).length : 0;
  $: checklistLabel = isToday ? "TODAY'S CHECKLIST" : `${dateLabel.toUpperCase()}'S CHECKLIST`;

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

  function formatSavedTime(iso: string | undefined): string {
    if (!iso) return "not yet saved";
    return `saved ${new Date(iso).toLocaleTimeString("en-GB", { hour12: false })}`;
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
    reflectionUpdatedAt = log.updatedAt;
  }

  function persistField(patch: Partial<DailyLogDraft>) {
    void saveDailyLog(viewDateKey, patch);
  }

  async function saveReflection() {
    const log = await saveDailyLog(viewDateKey, { reflection });
    reflectionUpdatedAt = log.updatedAt;
  }

  function handleReflectionInput() {
    if (reflectionSaveTimer) clearTimeout(reflectionSaveTimer);
    reflectionSaveTimer = setTimeout(() => void saveReflection(), 600);
  }

  function flushReflectionSave() {
    if (reflectionSaveTimer) {
      clearTimeout(reflectionSaveTimer);
      reflectionSaveTimer = undefined;
    }
    void saveReflection();
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
    clockTimer = setInterval(() => {
      now = new Date();
    }, 1000);
  });

  onDestroy(() => {
    if (clockTimer) clearInterval(clockTimer);
    if (reflectionSaveTimer) clearTimeout(reflectionSaveTimer);
  });
</script>

<div class="app-shell">
  <aside class="journal">
    <div class="seigaiha" aria-hidden="true"></div>
    <div class="hanko" aria-hidden="true">改善</div>
    <div class="journal-vertical" aria-hidden="true">継続は力なり</div>

    <div class="journal-body">
      <div class="journal-header">
        <span class="log-name">DAILY_REFLECTION.log</span>
        <span class="log-date">[{viewDateKey}]</span>
      </div>

      <p class="journal-prompt">&gt; <em>what shaped today?</em></p>

      <textarea
        class="journal-textarea"
        placeholder="write it down..."
        bind:value={reflection}
        on:input={handleReflectionInput}
        on:blur={flushReflectionSave}
      ></textarea>

      <div class="journal-footer">
        <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
        <span>{formatSavedTime(reflectionUpdatedAt)}</span>
      </div>
    </div>
  </aside>

  <main class="main">
    <div class="status-line">
      <span class="status-path">{pathLabel}</span>
      <span class="status-clock">{clockLabel}</span>
    </div>

    <header class="masthead">
      <div class="title-row">
        <h1 class="wordmark">KAIZEN-80</h1>
        <span class="wordmark-jp">改善</span>
      </div>
      <p class="quote">{quote}</p>
      <div class="hud-rule"></div>

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
        <div class="priority-cell">
          <h2 class="section-label">
            <span class="jp-mark">{priority.jp}</span><span class="muted">// {priority.label}</span
            >
          </h2>
          <input
            type="text"
            placeholder="today's win..."
            bind:value={priorityValues[priority.key]}
            on:blur={() => persistField({ [priority.key]: priorityValues[priority.key] })}
          />
        </div>
      {/each}
    </section>

    <section class="block checklist-block">
      <h2 class="section-label">
        <span class="jp-mark">今日</span><span class="muted">// {checklistLabel}</span>
      </h2>

      {#if loading}
        <p class="muted">loading...</p>
      {:else if $habits.length === 0}
        <p class="muted">no habits yet — add one below.</p>
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
        <input type="text" placeholder="new habit..." bind:value={newHabitName} />
        <button type="submit">add</button>
      </form>
    </section>

    <section class="block gratitude-block">
      <h2 class="section-label">
        <span class="jp-mark">感謝</span><span class="muted">// I AM GRATEFUL FOR</span>
      </h2>
      <ol class="gratitude-list">
        {#each gratitudeItems as _, i}
          <li>
            <span class="gratitude-index">{i + 1}.</span>
            <input
              type="text"
              bind:value={gratitudeItems[i]}
              on:blur={() => persistField({ gratitude: gratitudeItems })}
            />
          </li>
        {/each}
      </ol>
    </section>
  </main>
</div>

<style>
  .app-shell {
    display: flex;
    min-height: 100vh;
    background: var(--color-bg);
    color: var(--color-text-muted);
    font-family: var(--font-family-base);
  }

  /* ---------- Left column: journal panel ---------- */

  .journal {
    position: relative;
    flex: 0 0 300px;
    width: 300px;
    box-sizing: border-box;
    border-right: 1px solid var(--color-border);
    background: var(--color-bg-surface);
    overflow: hidden;
  }

  .seigaiha {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.07;
    background-image: repeating-radial-gradient(
      circle at 0 0,
      transparent 0,
      transparent 7px,
      var(--color-text-primary) 7px,
      var(--color-text-primary) 8px,
      transparent 8px,
      transparent 14px,
      var(--color-text-primary) 14px,
      var(--color-text-primary) 15px,
      transparent 15px,
      transparent 21px,
      var(--color-text-primary) 21px,
      var(--color-text-primary) 22px
    );
    background-size: 22px 22px;
  }

  .hanko {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 2;
    width: 2.75rem;
    height: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--color-accent-red);
    border-radius: 4px;
    background: color-mix(in srgb, var(--color-accent-red) 8%, transparent);
    color: var(--color-accent-red);
    font-family: var(--font-jp);
    font-size: 1.1rem;
    font-weight: 700;
    transform: rotate(2deg);
    box-shadow: 0 0 10px color-mix(in srgb, var(--color-accent-red) 55%, transparent);
  }

  .journal-vertical {
    position: absolute;
    left: 0.65rem;
    top: 5rem;
    bottom: 2rem;
    z-index: 1;
    writing-mode: vertical-rl;
    font-family: var(--font-jp);
    font-size: 1.05rem;
    letter-spacing: 0.3em;
    color: var(--color-glow-pink);
    text-shadow: 0 0 8px color-mix(in srgb, var(--color-glow-pink) 65%, transparent);
    opacity: 0.75;
    pointer-events: none;
  }

  .journal-body {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    height: 100%;
    box-sizing: border-box;
    padding: 4rem 1.25rem 1.5rem 3rem;
  }

  .journal-header {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .log-name {
    color: var(--color-text-primary);
    font-size: 0.8rem;
    letter-spacing: 0.05em;
  }

  .log-date {
    color: var(--color-text-muted);
    font-size: 0.72rem;
  }

  .journal-prompt {
    margin: 0;
    color: var(--color-glow-pink);
    font-style: italic;
    font-size: 0.85rem;
  }

  .journal-textarea {
    flex: 1;
    min-height: 220px;
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    padding: 0.5rem 0.6rem;
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    line-height: 1.7rem;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent calc(1.7rem - 1px),
      var(--color-border) calc(1.7rem - 1px),
      var(--color-border) 1.7rem
    );
    background-attachment: local;
  }

  .journal-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .journal-textarea:focus {
    outline: none;
    border-color: var(--color-glow-pink);
    box-shadow: 0 0 8px color-mix(in srgb, var(--color-glow-pink) 35%, transparent);
  }

  .journal-footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.68rem;
    letter-spacing: 0.03em;
    color: var(--color-text-muted);
  }

  /* ---------- Right column: main ---------- */

  .main {
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    padding: 1.75rem 2.5rem 4rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .status-line {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
  }

  .status-clock {
    color: var(--color-text-primary);
  }

  .masthead {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .title-row {
    display: flex;
    align-items: baseline;
    gap: 0.85rem;
  }

  .wordmark {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 2rem;
    letter-spacing: 0.08em;
    color: var(--color-glow-pink);
    text-shadow:
      0 0 8px var(--color-glow-pink),
      0 0 20px color-mix(in srgb, var(--color-glow-pink) 55%, transparent);
  }

  .wordmark-jp {
    font-family: var(--font-jp);
    font-size: 1.3rem;
    color: var(--color-glow-pink);
    opacity: 0.85;
    text-shadow: 0 0 6px color-mix(in srgb, var(--color-glow-pink) 55%, transparent);
  }

  .quote {
    margin: 0;
    max-width: 36rem;
    color: var(--color-text-muted);
    font-style: italic;
    font-size: 0.9rem;
  }

  .hud-rule {
    height: 2px;
    width: 100%;
    margin-top: 0.15rem;
    background: linear-gradient(90deg, var(--color-accent-red), var(--color-glow-pink), transparent);
  }

  .date-nav {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.5rem;
  }

  .date-nav-btn,
  .date-today-btn {
    font-family: var(--font-family-base);
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      color 0.15s ease,
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
    border-color: var(--color-glow-pink);
    color: var(--color-glow-pink);
    box-shadow: 0 0 6px color-mix(in srgb, var(--color-glow-pink) 45%, transparent);
  }

  .date-nav-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .date-label {
    min-width: 9rem;
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-text-primary);
  }

  .date-today-btn {
    padding: 0.25rem 0.6rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .section-label {
    margin: 0 0 0.75rem;
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    font-size: 0.78rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .jp-mark {
    font-family: var(--font-jp);
    font-size: 1rem;
    text-transform: none;
    letter-spacing: 0;
    color: var(--color-text-primary);
    text-shadow: 0 0 5px color-mix(in srgb, var(--color-text-primary) 55%, transparent);
  }

  .section-label .muted {
    color: var(--color-text-muted);
  }

  .priorities {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 1px solid var(--color-border);
  }

  .priority-cell {
    box-sizing: border-box;
    padding: 1rem 1.1rem;
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .priority-cell:last-child {
    border-right: none;
  }

  @media (max-width: 860px) {
    .app-shell {
      flex-direction: column;
    }

    .journal {
      flex: none;
      width: 100%;
      border-right: none;
      border-bottom: 1px solid var(--color-border);
    }

    .journal-textarea {
      min-height: 160px;
    }

    .priorities {
      grid-template-columns: 1fr;
    }

    .priority-cell {
      border-right: none;
      border-bottom: 1px solid var(--color-border);
    }

    .priority-cell:last-child {
      border-bottom: none;
    }
  }

  .priorities input[type="text"],
  .block input[type="text"] {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem 0.65rem;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    font-family: var(--font-family-base);
    font-size: 0.85rem;
  }

  .priorities input[type="text"]::placeholder,
  .block input[type="text"]::placeholder {
    color: var(--color-text-muted);
  }

  .priorities input[type="text"]:focus,
  .block input[type="text"]:focus {
    outline: none;
    border-color: var(--color-glow-pink);
    box-shadow: 0 0 6px color-mix(in srgb, var(--color-glow-pink) 30%, transparent);
  }

  .block {
    box-sizing: border-box;
    border: 1px solid var(--color-border);
    padding: 1.1rem 1.25rem;
    background: var(--color-bg-surface);
  }

  .habit-list {
    list-style: none;
    margin: 0 0 0.75rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
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
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--color-glow-pink);
    color: var(--color-glow-pink);
    font-family: var(--font-family-base);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition:
      background 0.15s ease,
      color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .add-habit-form button:hover {
    background: var(--color-glow-pink);
    color: var(--color-text-inverse);
    box-shadow: 0 0 10px color-mix(in srgb, var(--color-glow-pink) 55%, transparent);
  }

  .gratitude-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-family: var(--font-family-base);
  }

  .gratitude-list li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--color-text-muted);
  }

  .gratitude-index {
    flex: none;
    width: 1.6rem;
    text-align: right;
    color: var(--color-text-muted);
  }

  .muted {
    color: var(--color-text-muted);
  }
</style>
