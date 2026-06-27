<script setup lang="ts">
const search = ref("");
const genre = ref("");
const status = ref("");
const ownerId = ref("");
const sort = ref("createdAt_desc");

const sortBy = computed(() => sort.value.split("_")[0]);
const order = computed(() => sort.value.split("_")[1]);

const {
  data: books,
  pending,
  refresh,
} = await useFetch("/api/books", {
  query: computed(() => ({
    search: search.value || undefined,
    genre: genre.value || undefined,
    status: status.value || undefined,
    ownerId: ownerId.value || undefined,
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

const uniqueOwners = computed(() => {
  if (!books.value) return [];
  const seen = new Set<string>();
  return (books.value as any[]).reduce((acc: any[], b: any) => {
    if (b.owner?.id && !seen.has(b.owner.id)) {
      seen.add(b.owner.id);
      acc.push({ id: b.owner.id, name: b.owner.name });
    }
    return acc;
  }, []);
});

function resetFilters() {
  search.value = "";
  genre.value = "";
  status.value = "";
  ownerId.value = "";
  sort.value = "createdAt_desc";
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Descoperă următoarea ta lectură
        </h1>
        <p class="text-sm text-gray-400 mt-0.5 hidden sm:block italic">
          "Explorează cărțile împărtășite de comunitate și găsește povestea
          perfectă pentru următoarea ta aventură."
        </p>
        <p class="text-sm text-gray-500 mt-1">
          {{ books?.length ?? 0 }}
          {{ books?.length === 1 ? "carte găsită" : "cărți găsite" }}
        </p>
      </div>
      <NuxtLink
        to="/books/new"
        class="flex items-center gap-2 px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium rounded-xl transition"
      >
        <Icon name="heroicons:plus" class="w-4 h-4" />
        Adaugă carte
      </NuxtLink>
    </div>

    <div class="bg-white border border-cream-200 rounded-xl p-4 mb-6 space-y-3">
      <div class="relative">
        <Icon
          name="heroicons:magnifying-glass"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        />
        <input
          v-model="search"
          type="text"
          placeholder="Caută după titlu, autor sau gen..."
          class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
        />
      </div>

      <div class="flex flex-wrap gap-3">
        <select
          v-model="genre"
          class="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition bg-white"
        >
          <option value="">Toate genurile</option>
          <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
        </select>
        <select
          v-model="status"
          class="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition bg-white"
        >
          <option value="">Toate statusurile</option>
          <option value="available">Disponibile</option>
          <option value="borrowed">Împrumutate</option>
        </select>
        <select
          v-model="sort"
          class="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition bg-white"
        >
          <option value="createdAt_desc">Cele mai recent adăugate</option>
          <option value="createdAt_asc">Cele mai vechi adăugate</option>
          <option value="title_asc">Titlu A → Z</option>
          <option value="title_desc">Titlu Z → A</option>
        </select>
        <button
          @click="resetFilters"
          class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition"
        >
          Resetează
        </button>
      </div>
    </div>

    <div
      v-if="pending"
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
    >
      <div
        v-for="i in 8"
        :key="i"
        class="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse"
      >
        <div class="aspect-[2/3] bg-gray-100" />
        <div class="p-4 space-y-2">
          <div class="h-4 bg-gray-100 rounded w-3/4" />
          <div class="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>

    <div v-else-if="!books?.length" class="text-center py-24 px-6 bg-white border border-cream-200 rounded-2xl">
      <Icon name="heroicons:book-open" class="w-20 h-20 text-sage-200 mx-auto mb-6" />
      <p class="text-lg font-heading font-semibold text-gray-700 mb-2">Nicio carte în vedere...</p>
      <p class="text-sm text-gray-400 italic max-w-xs mx-auto mb-6">"Uneori chiar și gusturile rafinate nu găsesc ceea ce caută."</p>
      <button @click="resetFilters" class="px-5 py-2 bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium rounded-xl transition">
        Resetează filtrele
      </button>
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
    >
      <BookCard v-for="book in books" :key="book.id" :book="book" />
    </div>
  </div>
</template>
