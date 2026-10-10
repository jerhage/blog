<script lang="ts">
  import SegmentedControl from '../kandan/components/SegmentedControl.svelte';
  import { formatLength } from '../lib/ch-unit/ch-amount';
  import type { LengthUnit } from '../lib/ch-unit/ch-amount';
  import { BODY_FONTS } from '../lib/ch-unit/fonts';
  import '../styles/ch-unit.css';

  const AMOUNT = 20;

  const UNITS: readonly LengthUnit[] = ['em', 'rem', 'ch', 'ic'];

  const FONT_OPTIONS = BODY_FONTS.map((font) => ({ value: font.name, label: font.name }));

  const SIZES = [
    { value: '0.875rem', label: '0.875rem' },
    { value: '1rem', label: '1rem' },
    { value: '1.5rem', label: '1.5rem' },
  ] as const;

  let fontName = $state<string>('system-ui');
  let size = $state<string>('1rem');
  let rects = $state<(DOMRectReadOnly | undefined)[]>([]);

  const stack = $derived(BODY_FONTS.find((font) => font.name === fontName)?.stack ?? 'system-ui');
</script>

<div class="ch-unit stack-md">
  <SegmentedControl label="Font" class="wrap" options={FONT_OPTIONS} bind:value={fontName} />
  <SegmentedControl label="Font size of the box" class="wrap" options={SIZES} bind:value={size} />
  <div class="stack-md">
    {#each UNITS as unit, index (unit)}
      <div class="stack-sm">
        <div class="row wrap gap-4 text-sm">
          <code>{formatLength(AMOUNT, unit)}</code>
          {#if rects[index] !== undefined}
            <span class="mono">{Math.round(rects[index].width)}px</span>
          {/if}
        </div>
        <div class="ch-unit-scroll">
          <div
            class="ch-box ch-box-bar"
            style:width={formatLength(AMOUNT, unit)}
            style:font-family={stack}
            style:font-size={size}
            bind:contentRect={rects[index]}
          ></div>
        </div>
      </div>
    {/each}
  </div>
</div>
