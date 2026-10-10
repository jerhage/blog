<script lang="ts">
  import SegmentedControl from '../kandan/components/SegmentedControl.svelte';
  import { formatLength } from '../lib/ch-unit/ch-amount';
  import { SENTENCE, fontsNamed } from '../lib/ch-unit/fonts';
  import { charactersThatFit } from '../lib/ch-unit/text-measure';
  import '../styles/ch-unit.css';

  const FONTS = fontsNamed(['system-ui', 'Archivo', 'Literata', 'Zen Kaku Gothic New']);

  const AMOUNTS = [
    { value: '20', label: '20ch' },
    { value: '30', label: '30ch' },
    { value: '40', label: '40ch' },
  ] as const;

  let chosen = $state<string>('30');
  let rects = $state<(DOMRectReadOnly | undefined)[]>([]);
  let lines = $state<(HTMLElement | undefined)[]>([]);

  const amount = $derived(Number(chosen));
  const counts = $derived(
    FONTS.map((_, index) => {
      const rect = rects[index];
      const line = lines[index];
      return rect === undefined || line === undefined
        ? undefined
        : charactersThatFit(line, SENTENCE, rect.width);
    }),
  );
</script>

<div class="ch-unit stack-md">
  <SegmentedControl label="Box width" class="wrap" options={AMOUNTS} bind:value={chosen} />
  <div class="stack-md">
    {#each FONTS as font, index (font.name)}
      <div class="stack-sm">
        <div class="row wrap gap-4 text-sm">
          <strong style:font-family={font.stack}>{font.name}</strong>
          <span class="mono">{amount} zeros</span>
          {#if counts[index] !== undefined}
            <span class="mono">{counts[index]} characters of the sentence</span>
          {/if}
        </div>
        <div class="ch-unit-scroll">
          <div
            class="ch-box"
            style:width={formatLength(amount, 'ch')}
            style:font-family={font.stack}
            bind:contentRect={rects[index]}
          >
            <span class="ch-box-line">{'0'.repeat(amount)}</span>
            <span class="ch-box-line" bind:this={lines[index]}>{SENTENCE}</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
