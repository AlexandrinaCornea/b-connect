<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <Icon name="heroicons:book-open" class="w-8 h-8 text-indigo-600" />
          <span class="text-2xl font-bold text-gray-900">b-connect</span>
        </NuxtLink>
        <p class="mt-2 text-sm text-gray-500">Comunitatea cititorilor</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <slot />
      </div>
    </div>
  </div>
</template>
