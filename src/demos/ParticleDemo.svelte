<script lang="ts">
  import { match } from 'ts-pattern';
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
  import { finalKindOf, particleRows } from '../lib/unicode/hangul';
  import type { FinalKind } from '../lib/unicode/hangul';

  const SAMPLES: readonly string[] = ['사과', '고양이', '책', '서울', '집'];

  let word = $state('사과');

  const rows = $derived(particleRows(word.trim()));
  const kind = $derived(finalKindOf(word.trim()));

  function kindLabel(one: FinalKind): string {
    return match(one)
      .with('vowel', () => 'ends in a vowel')
      .with('rieul', () => 'ends in ㄹ')
      .with('consonant', () => 'ends in a consonant')
      .exhaustive();
  }
</script>

<div class="stack-md">
  <div class="row wrap gap-2">
    {#each SAMPLES as sample (sample)}
      <Button size="sm" variant="outline" onclick={() => (word = sample)}
        ><span lang="ko">{sample}</span></Button
      >
    {/each}
  </div>
  <Field label="Word">
    {#snippet children(control)}
      <Input {...control} bind:value={word} lang="ko" />
    {/snippet}
  </Field>
  {#if word.trim() !== ''}
    <p class="m-0"><Badge variant="primary">{kindLabel(kind)}</Badge></p>
    <Table size="sm" caption="The particle each pair takes after the word">
      <TableHeader>
        <TableRow>
          <TableHeaderCell scope="col">Pair</TableHeaderCell>
          <TableHeaderCell scope="col">Chosen</TableHeaderCell>
          <TableHeaderCell scope="col">Joined</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each rows as row (row.pair)}
          <TableRow>
            <TableCell lang="ko">{row.pair}</TableCell>
            <TableCell class="text-lg" lang="ko">{row.particle}</TableCell>
            <TableCell class="text-lg" lang="ko">{row.joined}</TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  {/if}
</div>
