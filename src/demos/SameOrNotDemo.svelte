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
  import { comparisonRows } from '../lib/unicode/name-matching';

  type Pair = { readonly label: string; readonly left: string; readonly right: string };

  const PAIRS: readonly Pair[] = [
    { label: 'Composed and decomposed', left: 'が', right: 'が' },
    { label: 'Half-width and full-width', left: 'ｶﾞｲﾄﾞ', right: 'ガイド' },
    { label: 'Full-width Latin', left: 'ＡＢＣ', right: 'abc' },
    { label: 'Katakana and hiragana', left: 'ネコ', right: 'ねこ' },
    { label: 'Voiced and plain', left: 'が', right: 'か' },
    { label: 'A circled number', left: '①', right: '1' },
    { label: 'A square word', left: '㌔', right: 'キロ' },
    { label: 'Extra spaces', left: '  my   words ', right: 'My words' },
  ];

  let left = $state('ｶﾞｲﾄﾞ');
  let right = $state('ガイド');

  const rows = $derived(comparisonRows(left, right));

  function choose(pair: Pair): void {
    left = pair.left;
    right = pair.right;
  }
</script>

<div class="stack-md">
  <div class="row wrap gap-2">
    {#each PAIRS as pair (pair.label)}
      <Button size="sm" variant="outline" onclick={() => choose(pair)}>{pair.label}</Button>
    {/each}
  </div>
  <div class="grid-2 gap-2">
    <Field label="Left">
      {#snippet children(control)}
        <Input {...control} bind:value={left} lang="ja" />
      {/snippet}
    </Field>
    <Field label="Right">
      {#snippet children(control)}
        <Input {...control} bind:value={right} lang="ja" />
      {/snippet}
    </Field>
  </div>
  <Table size="sm" caption="Whether the two strings compare as the same">
    <TableHeader>
      <TableRow>
        <TableHeaderCell scope="col">Comparison</TableHeaderCell>
        <TableHeaderCell scope="col">Result</TableHeaderCell>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each rows as row (row.label)}
        <TableRow>
          <TableCell class="mono text-xs">{row.label}</TableCell>
          <TableCell>
            {#if row.equal}
              <Badge variant="success">same</Badge>
            {:else}
              <Badge>different</Badge>
            {/if}
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>
