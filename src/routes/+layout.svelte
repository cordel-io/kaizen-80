<script lang="ts">
  import "../lib/design-tokens/tokens.css";
</script>

<slot />

<style>
  :global(body) {
    margin: 0;
    background: var(--color-bg);
  }
</style>
