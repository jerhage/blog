<script lang="ts">
  import { onMount } from 'svelte';
  import { readAppearance } from '../kandan/core/appearance.js';
  import type { Appearance } from '../kandan/core/appearance.js';
  import AppearanceSwitcher from '../kandan/components/AppearanceSwitcher.svelte';
  import { saveAppearance } from '../lib/appearance-storage';

  let appearance: Appearance = $state({ theme: 'base', colorScheme: 'automatic' });

  onMount(() => {
    appearance = readAppearance(document.documentElement);
  });

  function save(chosen: Appearance): void {
    saveAppearance(document.documentElement, localStorage, chosen);
  }
</script>

<AppearanceSwitcher bind:appearance onchoose={save} />
