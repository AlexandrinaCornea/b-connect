<script setup lang="ts">
defineProps<{ rating: number }>()
</script>

<template>
  <div class="flex gap-0.5">
    <span
      v-for="s in 5"
      :key="s"
      class="text-sm"
      :class="s <= rating ? 'text-amber-400' : 'text-gray-200'"
    >★</span>
  </div>
</template>
