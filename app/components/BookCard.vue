<script setup lang="ts">
const { genreClass } = useGenreColor();

const props = defineProps<{
  book: {
    id: string;
    title: string;
    author: string;
    genre?: string | null;
    imageUrl?: string | null;
    status: string;
    owner?: {
      name?: string | null;
      city?: string | null;
      ratingSum?: number | null;
      ratingCount?: number | null;
    } | null;
  };
}>();

const ownerRating = computed(() => {
  const { ratingSum, ratingCount } = props.book.owner ?? {};
  if (!ratingCount || ratingCount === 0) return null;
  return Math.round((ratingSum! / ratingCount) * 10) / 10;
});
</script>

<template>
  <NuxtLink
    :to="`/books/${book.id}`"
    class="bg-white border border-cream-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-cream-300 transition group block"
  >
    <div class="relative aspect-[2/3] bg-cream-100 overflow-hidden">
      <img
        v-if="book.imageUrl"
        :src="book.imageUrl"
        :alt="book.title"
        class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <Icon name="heroicons:book-open" class="w-12 h-12 text-cream-300" />
      </div>

      <div
        class="absolute bottom-0 inset-x-0 py-1.5 text-center text-xs font-semibold"
        :class="
          book.status === 'available'
            ? 'bg-sage-500/90 text-white'
            : 'bg-warm-400/90 text-white'
        "
      >
        {{ book.status === "available" ? "✓ Disponibilă" : "✗ Împrumutată" }}
      </div>

      <slot name="overlay" />
    </div>

    <div class="p-3">
      <h3
        class="font-heading font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1"
      >
        {{ book.title }}
      </h3>
      <p class="text-xs text-gray-500 mb-2">{{ book.author }}</p>
      <div v-if="book.genre">
        <span
          class="text-xs px-2 py-0.5 rounded-full font-medium"
          :class="genreClass(book.genre)"
        >
          {{ book.genre }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
