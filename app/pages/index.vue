<script setup lang="ts"></script>

<template>
  <div class="text-center py-20">
    <Icon
      name="heroicons:book-open"
      class="w-16 h-16 text-indigo-300 mx-auto mb-4"
    />
    <h1 class="text-3xl font-bold text-gray-900 mb-2">
      Bine ai venit pe b-connect
    </h1>
    <p class="text-gray-500 mb-8">
      Comunitatea cititorilor — împrumută și schimbă cărți cu alții
    </p>
    <NuxtLink
      to="/books"
      class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition"
    >
      <Icon name="heroicons:magnifying-glass" class="w-5 h-5" />
      Explorează cărțile
    </NuxtLink>
  </div>
</template>
