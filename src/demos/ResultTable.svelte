<script lang="ts">
  import Badge from '../kandan/components/Badge.svelte';
  import Table from '../kandan/components/Table.svelte';
  import TableBody from '../kandan/components/TableBody.svelte';
  import TableCell from '../kandan/components/TableCell.svelte';
  import TableHeader from '../kandan/components/TableHeader.svelte';
  import TableHeaderCell from '../kandan/components/TableHeaderCell.svelte';
  import TableRow from '../kandan/components/TableRow.svelte';
  import type { BadgeVariant } from '../kandan/components/classes';
  import type { SqlValue } from '../lib/sql/sample-data';

  type RowTag = { readonly label: string; readonly variant: BadgeVariant };

  type Props = {
    caption: string;
    columns: readonly string[];
    rows: readonly (readonly SqlValue[])[];
    tagHeading?: string;
    tags?: readonly RowTag[];
  };

  let { caption, columns, rows, tagHeading = 'Row', tags }: Props = $props();
</script>

<Table size="sm" {caption}>
  <TableHeader>
    <TableRow>
      {#each columns as column (column)}
        <TableHeaderCell scope="col">{column}</TableHeaderCell>
      {/each}
      {#if tags !== undefined}
        <TableHeaderCell scope="col">{tagHeading}</TableHeaderCell>
      {/if}
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each rows as row, index (index)}
      <TableRow>
        {#each row as value, column (column)}
          <TableCell numeric={typeof value === 'number'}>
            {#if value === null}
              <span class="mono text-muted">NULL</span>
            {:else}
              {value}
            {/if}
          </TableCell>
        {/each}
        {@const tag = tags?.[index]}
        {#if tag !== undefined}
          <TableCell>
            <Badge variant={tag.variant}>{tag.label}</Badge>
          </TableCell>
        {/if}
      </TableRow>
    {/each}
  </TableBody>
</Table>
