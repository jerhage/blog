<script lang="ts">
  import Diagram from '../kandan/components/Diagram.svelte';
  import SequenceDiagram from '../kandan/components/SequenceDiagram.svelte';
  import StepThrough from '../kandan/components/StepThrough.svelte';
  import { diagramPartsAt, sequenceStepsAt } from '../lib/diagram/steps-view';
  import type { StepsView } from '../lib/diagram/steps-view';

  type Props = { view: StepsView };

  let { view }: Props = $props();
</script>

<StepThrough label={view.label} captions={view.captions}>
  {#snippet children(step)}
    {#if view.kind === 'sequence'}
      <SequenceDiagram
        label={view.label}
        participants={view.participants}
        steps={sequenceStepsAt(view.steps, view.active, step)}
      />
    {:else}
      {@const drawn = diagramPartsAt(view.nodes, view.edges, view.active, step)}
      <Diagram
        label={view.label}
        scrollLabel={view.label}
        width={view.width}
        height={view.height}
        nodes={drawn.nodes}
        edges={drawn.edges}
      />
    {/if}
  {/snippet}
</StepThrough>
