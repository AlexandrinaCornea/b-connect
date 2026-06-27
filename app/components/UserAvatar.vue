<script setup lang="ts">
defineProps<{
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div
    class="rounded-full bg-sage-100 flex items-center justify-center text-sage-600 font-semibold shrink-0"
    :class="{
      'w-6 h-6 text-[10px]': size === 'xs',
      'w-8 h-8 text-xs': size === 'sm',
      'w-10 h-10 text-sm': !size || size === 'md',
      'w-16 h-16 text-2xl font-bold': size === 'lg',
    }"
  >
    {{ name?.charAt(0).toUpperCase() ?? '?' }}
  </div>
</template>
