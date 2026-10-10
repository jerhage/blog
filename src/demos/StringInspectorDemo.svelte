<script lang="ts">
  import Badge from '../kandan/components/Badge.svelte';
  import Button from '../kandan/components/Button.svelte';
  import Field from '../kandan/components/Field.svelte';
  import Input from '../kandan/components/Input.svelte';
  import Table from '../kandan/components/Table.svelte';
  import TableBody from '../kandan/components/TableBody.svelte';
  import TableCell from '../kandan/components/TableCell.svelte';
  import TableHeader from '../kandan/components/TableHeader.svelte';
  import TableHeaderCell from '../kandan/components/TableHeaderCell.svelte';
  import TableRow from '../kandan/components/TableRow.svelte';
  import {
    NORMALIZATION_FORMS,
    graphemeRows,
    textCounts,
    wholeForms,
  } from '../lib/unicode/text-inspection';

  const SAMPLES: readonly { readonly label: string; readonly text: string }[] = [
    { label: 'が, composed', text: 'が' },
    { label: 'が, decomposed', text: 'が' },
    { label: 'Half-width ｶﾞｲﾄﾞ', text: 'ｶﾞｲﾄﾞ' },
    { label: 'Full-width ＡＢＣ１', text: 'ＡＢＣ１' },
    { label: '㌔ and ㍿', text: '㌔㍿' },
    { label: '𠮟る', text: '𠮟る' },
    { label: 'A family emoji', text: '👨‍👩‍👧' },
    { label: 'A sentence', text: '吾輩は猫である。' },
  ];

  let text = $state('が𠮟る');

  const rows = $derived(graphemeRows(text));
  const counts = $derived(textCounts(text));
  const forms = $derived(wholeForms(text));
</script>

<div class="stack-md">
  <div class="row wrap gap-2">
    {#each SAMPLES as sample (sample.label)}
      <Button size="sm" variant="outline" onclick={() => (text = sample.text)}
        >{sample.label}</Button
      >
    {/each}
  </div>
  <Field label="Text to inspect">
    {#snippet children(control)}
      <Input {...control} bind:value={text} lang="ja" />
    {/snippet}
  </Field>
  <dl class="grid-4 gap-2 m-0 text-sm">
    <div>
      <dt class="text-muted">UTF-16 units, <code>length</code></dt>
      <dd class="m-0 text-lg">{counts.units}</dd>
    </div>
    <div>
      <dt class="text-muted">Code points</dt>
      <dd class="m-0 text-lg">{counts.codePoints}</dd>
    </div>
    <div>
      <dt class="text-muted">Graphemes</dt>
      <dd class="m-0 text-lg">{counts.graphemes}</dd>
    </div>
    <div>
      <dt class="text-muted">UTF-8 bytes</dt>
      <dd class="m-0 text-lg">{counts.bytes}</dd>
    </div>
  </dl>
  {#if rows.length > 0}
    <Table size="sm" caption="Each grapheme of the text">
      <TableHeader>
        <TableRow>
          <TableHeaderCell scope="col">Grapheme</TableHeaderCell>
          <TableHeaderCell scope="col">Code points</TableHeaderCell>
          <TableHeaderCell scope="col">UTF-16</TableHeaderCell>
          <TableHeaderCell scope="col">UTF-8</TableHeaderCell>
          {#each NORMALIZATION_FORMS as form (form)}
            <TableHeaderCell scope="col">{form}</TableHeaderCell>
          {/each}
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each rows as row, index (index)}
          <TableRow>
            <TableCell class="text-lg" lang="ja">{row.grapheme}</TableCell>
            <TableCell class="mono">{row.codePoints.join(' ')}</TableCell>
            <TableCell class="mono">{row.units.join(' ')}</TableCell>
            <TableCell class="mono">{row.bytes.join(' ')}</TableCell>
            {#each row.forms as piece (piece.form)}
              <TableCell>
                {#if piece.changed}
                  <Badge variant="warning"><span lang="ja">{piece.text}</span></Badge>
                  <span class="mono text-xs">{piece.codePoints.join(' ')}</span>
                {:else}
                  <span class="text-muted">same</span>
                {/if}
              </TableCell>
            {/each}
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  {/if}
  <p class="m-0 text-sm">
    The whole string:
    {#each forms as piece (piece.form)}
      <span class="me-2"
        ><code>{piece.form}</code>
        {piece.changed
          ? `changes it (${piece.text.length} ${piece.text.length === 1 ? 'unit' : 'units'})`
          : 'leaves it alone'}</span
      >
    {/each}
  </p>
</div>
