<script lang="ts">
  import Field from '../kandan/components/Field.svelte';
  import Textarea from '../kandan/components/Textarea.svelte';
  import '../styles/line-break.css';

  let text = $state(
    '고양이가 창가에 앉아서 지나가는 사람들을 조용히 바라보고 있었습니다. 저녁 햇살이 따뜻하게 방 안으로 들어왔습니다.',
  );
</script>

<div class="line-break stack-md">
  <Field label="Paragraph">
    {#snippet children(control)}
      <Textarea {...control} bind:value={text} rows={4} lang="ko" />
    {/snippet}
  </Field>
  <div class="grid-2 gap-4">
    <div class="stack-sm">
      <p class="m-0 text-sm text-muted"><code>word-break: normal</code></p>
      <p class="line-break-box word-break-normal surface-sunken bordered rounded-container m-0" lang="ko">
        {text}
      </p>
    </div>
    <div class="stack-sm">
      <p class="m-0 text-sm text-muted"><code>word-break: keep-all</code></p>
      <p class="line-break-box word-break-keep-all surface-sunken bordered rounded-container m-0" lang="ko">
        {text}
      </p>
    </div>
  </div>
</div>
