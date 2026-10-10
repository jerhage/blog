<script lang="ts">
  import { onMount } from 'svelte';
  import Slider from '../kandan/components/Slider.svelte';
  import { clampAmount, formatLength, widthSpread } from '../lib/ch-unit/ch-amount';
  import { BODY_FONTS } from '../lib/ch-unit/fonts';
  import { loadFaces } from '../lib/ch-unit/text-measure';
  import '../styles/ch-unit.css';

  const AMOUNT_MIN = 10;
  const AMOUNT_MAX = 120;

  let amount = $state(68);
  let loaded = $state(false);
  let rects = $state<(DOMRectReadOnly | undefined)[]>([]);

  const widths = $derived(rects.flatMap((rect) => (rect === undefined ? [] : [rect.width])));
  const spread = $derived(widthSpread(widths));

  onMount(async () => {
    await loadFaces(BODY_FONTS.map((font) => font.face));
    loaded = true;
  });
</script>

<div class="ch-unit stack-md">
  <div class="row wrap gap-4">
    <Slider
      label="Width in ch"
      value={amount}
      min={AMOUNT_MIN}
      max={AMOUNT_MAX}
      oninput={(event) => {
        amount = clampAmount(Number(event.currentTarget.value), AMOUNT_MIN, AMOUNT_MAX);
      }}
    />
    <code>width: {formatLength(amount, 'ch')}</code>
  </div>
  <div class="stack-md">
    {#each BODY_FONTS as font, index (font.name)}
      {@const rect = rects[index]}
      <div class="stack-sm">
        <div class="row wrap gap-4 text-sm">
          <strong style:font-family={font.stack}>{font.name}</strong>
          {#if rect !== undefined}
            <span class="mono text-muted">1ch = {(rect.width / amount).toFixed(2)}px</span>
            <span class="mono">{formatLength(amount, 'ch')} = {Math.round(rect.width)}px</span>
          {/if}
        </div>
        <div class="ch-unit-scroll">
          <div
            class="ch-box ch-box-bar"
            style:width={formatLength(amount, 'ch')}
            style:font-family={font.stack}
            bind:contentRect={rects[index]}
          ></div>
        </div>
      </div>
    {/each}
  </div>
  <p class="m-0 text-sm text-muted">
    {#if !loaded}
      Loading the fonts.
    {:else if spread !== null}
      The widest box is {Math.round(spread.widest)}px and the narrowest {Math.round(spread.narrowest)}px:
      {spread.ratio.toFixed(2)} times wider, from one CSS value.
    {/if}
  </p>
</div>
