<script lang="ts">
  import Button from '../kandan/components/Button.svelte';
  import Field from '../kandan/components/Field.svelte';
  import Input from '../kandan/components/Input.svelte';
  import Select from '../kandan/components/Select.svelte';
  import Table from '../kandan/components/Table.svelte';
  import TableBody from '../kandan/components/TableBody.svelte';
  import TableCell from '../kandan/components/TableCell.svelte';
  import TableHeader from '../kandan/components/TableHeader.svelte';
  import TableHeaderCell from '../kandan/components/TableHeaderCell.svelte';
  import TableRow from '../kandan/components/TableRow.svelte';
  import { FINALS, INITIALS, MEDIALS, syllableOf, syllableRows } from '../lib/unicode/hangul';

  const SAMPLES: readonly string[] = ['한글', '값', '고양이', '닭', '왜'];

  let text = $state('한글');
  let initial = $state(18);
  let medial = $state(0);
  let final = $state(4);

  const rows = $derived(syllableRows(text));
  const composed = $derived(syllableOf(initial, medial, final));
</script>

<div class="stack-md">
  <div class="row wrap gap-2">
    {#each SAMPLES as sample (sample)}
      <Button size="sm" variant="outline" onclick={() => (text = sample)}
        ><span lang="ko">{sample}</span></Button
      >
    {/each}
  </div>
  <Field label="Korean text">
    {#snippet children(control)}
      <Input {...control} bind:value={text} lang="ko" />
    {/snippet}
  </Field>
  {#if rows.length > 0}
    <Table size="sm" caption="The three jamo of each syllable">
      <TableHeader>
        <TableRow>
          <TableHeaderCell scope="col">Syllable</TableHeaderCell>
          <TableHeaderCell scope="col">Initial</TableHeaderCell>
          <TableHeaderCell scope="col">Medial</TableHeaderCell>
          <TableHeaderCell scope="col">Final</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each rows as row, position (position)}
          <TableRow>
            <TableCell class="text-lg" lang="ko">{row.syllable}</TableCell>
            <TableCell
              ><span lang="ko">{row.initial.jamo}</span>
              <span class="mono text-xs">{row.initial.index}</span></TableCell
            >
            <TableCell
              ><span lang="ko">{row.medial.jamo}</span>
              <span class="mono text-xs">{row.medial.index}</span></TableCell
            >
            <TableCell
              ><span lang="ko">{row.final.jamo === '' ? 'none' : row.final.jamo}</span>
              <span class="mono text-xs">{row.final.index}</span></TableCell
            >
          </TableRow>
        {/each}
      </TableBody>
    </Table>
    <ul class="list-reset stack-sm m-0">
      {#each rows as row, position (position)}
        <li class="mono text-xs"><span lang="ko">{row.syllable}</span> {row.formula}</li>
      {/each}
    </ul>
  {/if}
  <div class="grid-3 gap-2">
    <Field label="Initial, 19 choices">
      {#snippet children(control)}
        <Select {...control} bind:value={initial}>
          {#each INITIALS as jamo, index (index)}
            <option value={index}>{index} {jamo}</option>
          {/each}
        </Select>
      {/snippet}
    </Field>
    <Field label="Medial, 21 choices">
      {#snippet children(control)}
        <Select {...control} bind:value={medial}>
          {#each MEDIALS as jamo, index (index)}
            <option value={index}>{index} {jamo}</option>
          {/each}
        </Select>
      {/snippet}
    </Field>
    <Field label="Final, 28 choices">
      {#snippet children(control)}
        <Select {...control} bind:value={final}>
          {#each FINALS as jamo, index (index)}
            <option value={index}>{index} {jamo === '' ? 'none' : jamo}</option>
          {/each}
        </Select>
      {/snippet}
    </Field>
  </div>
  <p class="m-0 row wrap items-center gap-4">
    <span class="text-lg" lang="ko">{composed.syllable}</span>
    <code>{composed.codePoint}</code>
    <span class="mono text-xs">{composed.formula}</span>
  </p>
  <p class="m-0 text-sm text-muted">
    Decomposed (NFD):
    <code
      >{[composed.initial.conjoining, composed.medial.conjoining, composed.final.conjoining]
        .filter((part) => part !== '')
        .map((part) => `U+${part.codePointAt(0)?.toString(16).toUpperCase()}`)
        .join(' ')}</code
    >
  </p>
</div>
