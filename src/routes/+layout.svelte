<script lang="ts">
  import "../lib/design-tokens/tokens.css";
</script>

<slot />

<style>
  :global(body) {
    position: relative;
    margin: 0;
    min-height: 100vh;
    background: var(--color-bg-void);
    overflow-x: hidden;
  }

  /* Base scene: vertical purple-to-black gradient, a faint glowing
     horizon line ~70% down the viewport, and a scanline texture,
     fixed behind all page content. */
  :global(body)::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -2;
    pointer-events: none;
    background:
      repeating-linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.035) 0px,
        rgba(255, 255, 255, 0.035) 1px,
        transparent 1px,
        transparent 3px
      ),
      radial-gradient(
        ellipse 90% 4% at 50% 70%,
        rgba(0, 240, 255, 0.45),
        rgba(255, 46, 196, 0.3) 45%,
        transparent 75%
      ),
      linear-gradient(to bottom, #1a0b30 0%, #0d0a1a 45%, #05040a 75%, #020103 100%);
  }

  /* Receding synthwave ground grid, pinned to the bottom of the
     viewport, behind all page content. */
  :global(body)::after {
    content: "";
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 38vh;
    z-index: -1;
    pointer-events: none;
    opacity: 0.55;
    background-image:
      linear-gradient(rgba(0, 240, 255, 0.4) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 46, 196, 0.3) 1px, transparent 1px);
    background-size:
      100% 2.4rem,
      2.8rem 100%;
    transform: perspective(200px) rotateX(65deg);
    transform-origin: bottom;
    -webkit-mask-image: linear-gradient(to top, black 0%, transparent 80%);
    mask-image: linear-gradient(to top, black 0%, transparent 80%);
  }
</style>
