<script lang="ts">
  import CodeBlock from '../kandan/components/CodeBlock.svelte';
  import SegmentedControl from '../kandan/components/SegmentedControl.svelte';
  import { authorHeroIds, winnerHeroIds } from '../lib/sql/sample-data';
  import {
    SET_OPERATORS,
    originLabel,
    setOperation,
    setOperationSql,
    setOperatorLabel,
  } from '../lib/sql/set-operations';
  import type { SetOperator, SetOrigin } from '../lib/sql/set-operations';
  import ResultTable from './ResultTable.svelte';

  const options = SET_OPERATORS.map((operator) => ({
    value: operator,
    label: setOperatorLabel(operator),
  }));

  const ORIGIN_VARIANTS: Readonly<Record<SetOrigin, 'primary' | 'warning' | 'success'>> = {
    a: 'primary',
    b: 'warning',
    both: 'success',
  };

  let operator = $state<SetOperator>('union');

  const authors = authorHeroIds();
  const winners = winnerHeroIds();
  const rows = $derived(setOperation(operator, authors, winners));
  const tags = $derived(
    rows.map((row) => ({
      label: originLabel(operator, row.origin),
      variant: ORIGIN_VARIANTS[row.origin],
    })),
  );
</script>

<div class="stack-md">
  <div class="grid-2 items-start">
    <ResultTable
      caption="A: heroes with a cc card"
      columns={['hero_id']}
      rows={authors.map((id) => [id])}
    />
    <ResultTable
      caption="B: heroes with a won match"
      columns={['hero_id']}
      rows={winners.map((id) => [id])}
    />
  </div>
  <SegmentedControl label="Set operator" class="wrap" {options} bind:value={operator} />
  <CodeBlock code={setOperationSql(operator)} label="The query" />
  <ResultTable
    caption={setOperatorLabel(operator)}
    columns={['hero_id']}
    rows={rows.map((row) => [row.value])}
    tagHeading="Held by"
    {tags}
  />
</div>
