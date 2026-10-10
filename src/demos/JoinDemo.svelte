<script lang="ts">
  import CodeBlock from '../kandan/components/CodeBlock.svelte';
  import SegmentedControl from '../kandan/components/SegmentedControl.svelte';
  import type { BadgeVariant } from '../kandan/components/classes';
  import {
    JOIN_KINDS,
    joinKindLabel,
    joinOriginLabel,
    joinRows,
    joinSql,
  } from '../lib/sql/joins';
  import type { JoinKind, JoinOrigin } from '../lib/sql/joins';
  import { CARDS, HEROES } from '../lib/sql/sample-data';
  import ResultTable from './ResultTable.svelte';

  const ORIGIN_VARIANTS: Readonly<Record<JoinOrigin, BadgeVariant>> = {
    matched: 'success',
    'left-only': 'primary',
    'right-only': 'warning',
    unrelated: 'neutral',
  };

  const options = JOIN_KINDS.map((kind) => ({ value: kind, label: joinKindLabel(kind) }));

  let kind = $state<JoinKind>('inner');

  const rows = $derived(joinRows(kind, HEROES, CARDS));
</script>

<div class="stack-md">
  <div class="grid-2 items-start">
    <ResultTable
      caption="heroes (left)"
      columns={['id', 'name']}
      rows={HEROES.map((hero) => [hero.id, hero.name])}
    />
    <ResultTable
      caption="cards (right)"
      columns={['id', 'hero_id', 'name']}
      rows={CARDS.map((card) => [card.id, card.heroId, card.name])}
    />
  </div>
  <SegmentedControl label="Join type" class="wrap" {options} bind:value={kind} />
  <CodeBlock code={joinSql(kind)} label="The query" />
  <ResultTable
    caption="{joinKindLabel(kind)} join, {rows.length} rows"
    columns={['name', 'card_id', 'card']}
    rows={rows.map((row) => [row.hero?.name ?? null, row.card?.id ?? null, row.card?.name ?? null])}
    tagHeading="Row"
    tags={rows.map((row) => ({
      label: joinOriginLabel(row.origin),
      variant: ORIGIN_VARIANTS[row.origin],
    }))}
  />
</div>
