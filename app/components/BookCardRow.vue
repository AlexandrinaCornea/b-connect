<script setup lang="ts">
defineProps<{
  book: {
    id: string
    title: string
    author: string
    imageUrl?: string | null
    status: string
  }
}>()
</script>

<template>
  <NuxtLink
    :to="`/books/${book.id}`"
    class="flex gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm hover:border-gray-200 transition"
  >
    <div class="w-12 h-16 rounded-lg bg-gray-50 overflow-hidden shrink-0">
      <img v-if="book.imageUrl" :src="book.imageUrl" class="w-full h-full object-cover" />
      <div v-else class="w-full h-full flex items-center justify-center">
        <Icon name="heroicons:book-open" class="w-5 h-5 text-gray-200" />
      </div>
    </div>
    <div class="min-w-0">
      <p class="text-sm font-medium text-gray-900 truncate">{{ book.title }}</p>
      <p class="text-xs text-gray-500">{{ book.author }}</p>
      <span
        class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
        :class="book.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'"
      >
        {{ book.status === 'available' ? 'Disponibilă' : 'Împrumutată' }}
      </span>
    </div>
  </NuxtLink>
</template>
