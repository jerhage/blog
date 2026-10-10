<script lang="ts">
  import { match } from 'ts-pattern';
  import Badge from '../kandan/components/Badge.svelte';
  import Button from '../kandan/components/Button.svelte';
  import Field from '../kandan/components/Field.svelte';
  import Input from '../kandan/components/Input.svelte';
  import { choseongOf, searchKind } from '../lib/unicode/hangul';
  import type { SearchKind } from '../lib/unicode/hangul';

  const WORDS: readonly string[] = [
    '고양이',
    '고양이가',
    '고양이를',
    '강아지',
    '고구마',
    '가방',
    '기억',
    '사과',
    '바나나',
    '딸기',
    '도서관',
  ];

  const QUERIES: readonly string[] = ['ㄱㅇㅇ', '고양이', 'ㄱㄱㅁ', 'ㄷㅅㄱ', 'ㅂㄴㄴ'];

  let query = $state('ㄱㅇㅇ');

  const results = $derived(
    WORDS.map((word) => ({ word, choseong: choseongOf(word), kind: searchKind(query, word) })),
  );
  const found = $derived(results.filter((result) => result.kind !== 'none').length);

  function kindLabel(kind: SearchKind): string {
    return match(kind)
      .with('text', () => 'text match')
      .with('choseong', () => 'initial consonants')
      .with('none', () => 'no match')
      .exhaustive();
  }
</script>

<div class="stack-md">
  <div class="row wrap gap-2">
    {#each QUERIES as sample (sample)}
      <Button size="sm" variant="outline" onclick={() => (query = sample)}
        ><span lang="ko">{sample}</span></Button
      >
    {/each}
  </div>
  <Field label="Search">
    {#snippet children(control)}
      <Input {...control} bind:value={query} lang="ko" />
    {/snippet}
  </Field>
  <ul class="stack-sm m-0 list-reset">
    {#each results as result (result.word)}
      <li class="row wrap items-center gap-2">
        <span class="text-lg" lang="ko">{result.word}</span>
        <span class="text-muted" lang="ko">{result.choseong}</span>
        {#if result.kind === 'none'}
          <Badge emphasis="quiet">{kindLabel(result.kind)}</Badge>
        {:else}
          <Badge variant={result.kind === 'text' ? 'success' : 'primary'}
            >{kindLabel(result.kind)}</Badge
          >
        {/if}
      </li>
    {/each}
  </ul>
  <p class="m-0 text-sm text-muted">{found} of {WORDS.length} words found.</p>
</div>
