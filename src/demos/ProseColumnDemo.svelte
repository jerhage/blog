<script lang="ts">
  import { formatLength } from '../lib/ch-unit/ch-amount';
  import { BODY_FONTS, PROSE_REM, SENTENCE } from '../lib/ch-unit/fonts';
  import { charactersThatFit } from '../lib/ch-unit/text-measure';
  import '../styles/ch-unit.css';

  type Column = { readonly label: string; readonly length: string };

  const COLUMNS: readonly (readonly [Column, Column])[] = BODY_FONTS.map((font) => [
    { label: 'ch', length: formatLength(font.proseCh, 'ch') },
    { label: 'rem', length: formatLength(PROSE_REM, 'rem') },
  ]);

  let rects = $state<(DOMRectReadOnly | undefined)[]>([]);
  let lines = $state<(HTMLElement | undefined)[]>([]);

  function slot(fontIndex: number, columnIndex: number): number {
    return fontIndex * 2 + columnIndex;
  }

  function fitted(fontIndex: number, columnIndex: number): number | undefined {
    const rect = rects[slot(fontIndex, columnIndex)];
    const line = lines[slot(fontIndex, columnIndex)];
    return rect === undefined || line === undefined
      ? undefined
      : charactersThatFit(line, SENTENCE, rect.width);
  }
</script>

<div class="ch-unit stack-md">
  {#each BODY_FONTS as font, fontIndex (font.name)}
    <div class="stack-sm">
      <strong class="text-sm" style:font-family={font.stack}>{font.name}</strong>
      {#each COLUMNS[fontIndex] ?? [] as column, columnIndex (column.label)}
        {@const rect = rects[slot(fontIndex, columnIndex)]}
        <div class="stack-sm">
          <div class="row wrap gap-4 text-sm">
            <code>max-width: {column.length}</code>
            {#if rect !== undefined}
              <span class="mono">{Math.round(rect.width)}px</span>
              <span class="mono text-muted">{fitted(fontIndex, columnIndex)} characters</span>
            {/if}
          </div>
          <div class="ch-unit-scroll">
            <div
              class={['ch-box', { 'ch-box-accent': column.label === 'rem' }]}
              style:width={column.length}
              style:font-family={font.stack}
              bind:contentRect={rects[slot(fontIndex, columnIndex)]}
            >
              <span class="ch-box-line" bind:this={lines[slot(fontIndex, columnIndex)]}
                >{SENTENCE}</span
              >
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>
