<script lang="ts">
  import StepThrough from '../kandan/components/StepThrough.svelte';
  import { recursionCaption, recursionSteps } from '../lib/sql/recursion';
  import { CARD_TYPES } from '../lib/sql/sample-data';
  import type { TreeRow } from '../lib/sql/recursion';
  import ResultTable from './ResultTable.svelte';

  const steps = recursionSteps(CARD_TYPES, 1);
  const captions = steps.map((step, index) => recursionCaption(index, step));

  function cells(rows: readonly TreeRow[]): readonly (readonly (string | number)[])[] {
    return rows.map((row) => [row.id, row.name, row.depth, row.path]);
  }
</script>

<StepThrough label="A recursive query, one run at a time" {captions}>
  {#snippet children(index)}
    {@const step = steps[index]}
    {#if step !== undefined}
      <div class="stack-md">
        <ResultTable
          caption="Working table"
          columns={['id', 'name', 'depth', 'path']}
          rows={cells(step.working)}
        />
        <ResultTable
          caption="Result so far"
          columns={['id', 'name', 'depth', 'path']}
          rows={cells(step.result)}
        />
      </div>
    {/if}
  {/snippet}
</StepThrough>
