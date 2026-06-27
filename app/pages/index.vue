<script setup lang="ts">
definePageMeta({ layout: "home" });
const { data: session } = useAuth();
</script>

<template>
  <div>
    <section
      class="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden"
    >
      <img
        src="/hero-books.webp"
        alt=""
        class="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
        aria-hidden="true"
      />
      <div class="absolute inset-0 bg-cream-100/70" />

      <div
        class="relative z-10 text-center px-5 md:px-10 lg:px-[60px] w-full max-w-5xl mx-auto space-y-10 md:space-y-10 lg:space-y-[60px] py-[60px] md:py-[80px] lg:py-[100px]"
      >
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/70 text-sage-700 text-xs font-semibold rounded-full backdrop-blur-sm"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-sage-500 animate-pulse" />
          Comunitatea cititorilor
        </div>

        <h1
          class="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
        >
          Bine ați venit în biblioteca<br />
          <span class="text-sage-600">celor conectați</span>
        </h1>

        <p
          class="text-base text-gray-600 italic leading-relaxed border-l-2 border-sage-300 pl-4 text-left max-w-2xl mx-auto"
        >
          "În sezonul cărților, arta adevărată nu constă în posesie, ci în
          împărțire. Aici, fiecare pagină găsește un cititor care o merită."
        </p>

        <p class="text-sm text-gray-500">Împrumută, schimbă, conectează-te.</p>

        <div class="flex flex-wrap gap-3 justify-center pt-2">
          <NuxtLink
            to="/books"
            class="inline-flex items-center gap-2 px-6 py-3 bg-sage-500 hover:bg-sage-600 text-white font-semibold rounded-xl transition shadow-sm"
          >
            <Icon name="heroicons:magnifying-glass" class="w-5 h-5" />
            Explorează cărțile
          </NuxtLink>
          <NuxtLink
            v-if="!session"
            to="/auth/register"
            class="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-sage-300 text-sage-700 hover:bg-white font-semibold rounded-xl transition"
          >
            Alătură-te comunității
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
