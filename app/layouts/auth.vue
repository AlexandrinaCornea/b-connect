<template>
  <div
    class="min-h-screen relative flex items-center justify-center px-5 md:px-10 lg:px-[60px]"
  >
    <img
      src="/hero-books.webp"
      alt=""
      aria-hidden="true"
      class="fixed inset-0 w-full h-full object-cover blur-sm scale-105 opacity-50 pointer-events-none z-0"
    />
    <div class="fixed inset-0 bg-cream-100/60 pointer-events-none z-0" />

    <div
      class="w-full relative z-10 grid grid-cols-1 md:grid-cols-[minmax(0,260px)_1fr_minmax(0,260px)] items-center gap-10"
    >
      <div
        class="hidden md:flex flex-col justify-center items-end text-right pr-4"
      >
        <Icon
          name="heroicons:book-open"
          class="w-8 h-8 text-sage-400 mb-4 opacity-70"
        />
        <blockquote
          class="text-gray-700 text-lg font-light leading-relaxed italic"
        >
          „În sezonul cărților, arta adevărată nu constă în posesie, ci în
          împărțire."
        </blockquote>
      </div>

      <div class="w-full max-w-md mx-auto">
        <div class="text-center mb-8">
          <NuxtLink to="/" class="inline-flex items-center gap-2">
            <Icon name="heroicons:book-open" class="w-8 h-8 text-sage-500" />
            <span class="text-2xl font-bold text-gray-900">b-connect</span>
          </NuxtLink>
          <p class="mt-2 text-sm text-gray-500">Comunitatea cititorilor</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-cream-200 p-8">
          <slot />
        </div>
      </div>

      <div
        class="hidden md:flex flex-col justify-center items-start text-left pl-4"
      >
        <Icon
          name="heroicons:sparkles"
          class="w-8 h-8 text-sage-400 mb-4 opacity-70"
        />
        <blockquote
          class="text-gray-700 text-lg font-light leading-relaxed italic"
        >
          „În biblioteca comună, fiecare pagină devine o întâlnire."
        </blockquote>
      </div>
    </div>
  </div>
</template>
