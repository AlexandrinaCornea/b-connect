<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data: favs, refresh } = await useFetch('/api/favorites')

async function removeFavorite(bookId: string) {
  await $fetch(`/api/favorites/${bookId}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Favorite</h1>

    <div v-if="!(favs as any[])?.length" class="text-center py-20 bg-white border border-gray-100 rounded-xl">
      <Icon name="heroicons:heart" class="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p class="text-gray-500">Nu ai nicio carte salvată la favorite.</p>
      <NuxtLink to="/books" class="mt-2 inline-block text-sm text-indigo-600 hover:underline">
        Explorează cărți
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="fav in (favs as any[])"
        :key="fav.id"
        class="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition group relative"
      >
        <button
          @click.prevent="removeFavorite(fav.book.id)"
          class="absolute top-2 right-2 z-10 p-1.5 bg-white/90 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition"
          title="Elimină din favorite"
        >
          <Icon name="heroicons:heart-solid" class="w-4 h-4 text-red-400" />
        </button>

        <NuxtLink :to="`/books/${fav.book.id}`" class="block">
          <div class="relative h-48 bg-gray-50 overflow-hidden">
            <img
              v-if="fav.book.imageUrl"
              :src="fav.book.imageUrl"
              :alt="fav.book.title"
              class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:book-open" class="w-12 h-12 text-gray-200" />
            </div>
            <span
              class="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full"
              :class="fav.book.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'"
            >
              {{ fav.book.status === 'available' ? 'Disponibilă' : 'Împrumutată' }}
            </span>
          </div>

          <div class="p-4">
            <h3 class="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{{ fav.book.title }}</h3>
            <p class="text-xs text-gray-500 mb-2">{{ fav.book.author }}</p>
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{{ fav.book.genre }}</span>
              <span class="text-xs text-gray-400">{{ fav.owner?.name }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
