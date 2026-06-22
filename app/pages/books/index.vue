<script setup lang="ts">
const search = ref("");
const genre = ref("");
const status = ref("");
const sortBy = ref("createdAt");
const order = ref("desc");

const {
  data: books,
  pending,
  refresh,
} = await useFetch("/api/books", {
  query: computed(() => ({
    search: search.value || undefined,
    genre: genre.value || undefined,
    status: status.value || undefined,
    sortBy: sortBy.value,
    order: order.value,
  })),
});

const genres = [
  "Roman",
  "SF",
  "Fantasy",
  "Thriller",
  "Mister",
  "Biografie",
  "Istorie",
  "Știință",
  "Dezvoltare personală",
  "Poezie",
  "Altele",
];

function resetFilters() {
  search.value = "";
  genre.value = "";
  status.value = "";
  sortBy.value = "createdAt";
  order.value = "desc";
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Cărți disponibile</h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ books?.length ?? 0 }}
          {{ books?.length === 1 ? "carte" : "cărți" }} găsite
        </p>
      </div>
      <NuxtLink
        to="/books/new"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
      >
        <Icon name="heroicons:plus" class="w-4 h-4" />
        Adaugă carte
      </NuxtLink>
    </div>

    <div class="bg-white border border-gray-100 rounded-xl p-4 mb-6 space-y-3">
      <div class="relative">
        <Icon
          name="heroicons:magnifying-glass"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        />
        <input
          v-model="search"
          type="text"
          placeholder="Caută după titlu, autor sau gen..."
          class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
        />
      </div>

      <div class="flex flex-wrap gap-3">
        <select
          v-model="genre"
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition bg-white"
        >
          <option value="">Toate genurile</option>
          <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
        </select>

        <select
          v-model="status"
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition bg-white"
        >
          <option value="">Toate statusurile</option>
          <option value="available">Disponibile</option>
          <option value="borrowed">Împrumutate</option>
        </select>

        <select
          v-model="sortBy"
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition bg-white"
        >
          <option value="createdAt">Data adăugării</option>
          <option value="title">Titlu</option>
        </select>

        <select
          v-model="order"
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition bg-white"
        >
          <option value="desc">Descrescător</option>
          <option value="asc">Crescător</option>
        </select>

        <button
          @click="resetFilters"
          class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition"
        >
          Resetează
        </button>
      </div>
    </div>

    <div
      v-if="pending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="i in 8"
        :key="i"
        class="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse"
      >
        <div class="h-48 bg-gray-100" />
        <div class="p-4 space-y-2">
          <div class="h-4 bg-gray-100 rounded w-3/4" />
          <div class="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>

    <div v-else-if="!books?.length" class="text-center py-20">
      <Icon
        name="heroicons:book-open"
        class="w-12 h-12 text-gray-200 mx-auto mb-3"
      />
      <p class="text-gray-500">Nicio carte găsită.</p>
      <button
        @click="resetFilters"
        class="mt-2 text-sm text-indigo-600 hover:underline"
      >
        Resetează filtrele
      </button>
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <NuxtLink
        v-for="book in books"
        :key="book.id"
        :to="`/books/${book.id}`"
        class="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-200 transition group"
      >
        <div class="relative h-48 bg-gray-50 overflow-hidden">
          <img
            v-if="book.imageUrl"
            :src="book.imageUrl"
            :alt="book.title"
            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Icon name="heroicons:book-open" class="w-12 h-12 text-gray-200" />
          </div>
          <span
            class="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full"
            :class="
              book.status === 'available'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            "
          >
            {{ book.status === "available" ? "Disponibilă" : "Împrumutată" }}
          </span>
        </div>

        <div class="p-4">
          <h3
            class="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1"
          >
            {{ book.title }}
          </h3>
          <p class="text-xs text-gray-500 mb-2">{{ book.author }}</p>
          <div class="flex items-center justify-between">
            <span
              class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full"
            >
              {{ book.genre }}
            </span>
            <span class="text-xs text-gray-400">{{ book.owner?.name }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
