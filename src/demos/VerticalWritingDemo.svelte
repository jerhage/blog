<script lang="ts">
  import SegmentedControl from '../kandan/components/SegmentedControl.svelte';
  import Toggle from '../kandan/components/Toggle.svelte';
  import '../styles/vertical-writing.css';

  type Mode = 'horizontal-tb' | 'vertical-rl' | 'vertical-lr';

  type Orientation = 'mixed' | 'upright' | 'sideways';

  const MODES = [
    { value: 'horizontal-tb', label: 'horizontal-tb' },
    { value: 'vertical-rl', label: 'vertical-rl' },
    { value: 'vertical-lr', label: 'vertical-lr' },
  ] as const;

  const ORIENTATIONS = [
    { value: 'mixed', label: 'mixed' },
    { value: 'upright', label: 'upright' },
    { value: 'sideways', label: 'sideways' },
  ] as const;

  let mode = $state<Mode>('vertical-rl');
  let orientation = $state<Orientation>('mixed');
  let combined = $state(true);
  let readings = $state(true);
</script>

<div class="vertical-writing stack-md">
  <div class="row wrap gap-4">
    <SegmentedControl label="writing-mode" class="wrap" options={MODES} bind:value={mode} />
    <SegmentedControl
      label="text-orientation"
      class="wrap"
      options={ORIENTATIONS}
      bind:value={orientation}
    />
  </div>
  <div class="row wrap gap-4">
    <Toggle bind:checked={combined}>Tate-chu-yoko</Toggle>
    <Toggle bind:checked={readings}>Show furigana</Toggle>
  </div>
  <div
    class={[
      'vertical-writing-stage surface-sunken bordered rounded-container',
      `mode-${mode}`,
      `orientation-${orientation}`,
      { 'readings-hidden': !readings },
    ]}
    lang="ja"
  >
    <p class="m-0">
      <ruby>吾輩<rp>（</rp><rt>わがはい</rt><rp>）</rp></ruby>は<ruby
        >猫<rp>（</rp><rt>ねこ</rt><rp>）</rp></ruby
      >である。第<span class={{ combined }}>12</span>話は<span class={{ combined }}>10</span
      >月<span class={{ combined }}>3</span>日に読む。この版でも OCR を使う。
    </p>
  </div>
</div>
