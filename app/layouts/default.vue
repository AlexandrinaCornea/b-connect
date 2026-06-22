<script setup lang="ts">
const { data, signOut } = useAuth();
const route = useRoute();

const navLinks = [
  { to: "/books", label: "Cărți", icon: "heroicons:book-open" },
  {
    to: "/loans",
    label: "Împrumuturi",
    icon: "heroicons:arrow-path-rounded-square",
  },
  { to: "/notifications", label: "Notificări", icon: "heroicons:bell" },
];

const isActive = (path: string) => route.path.startsWith(path);

async function handleSignOut() {
  await signOut({ callbackUrl: "/auth/login" });
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div
        class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between"
      >
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-bold text-gray-900 text-lg"
        >
          <Icon name="heroicons:book-open" class="w-6 h-6 text-indigo-600" />
          b-connect
        </NuxtLink>

        <div class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition"
            :class="
              isActive(link.to)
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            "
          >
            <Icon :name="link.icon" class="w-4 h-4" />
            {{ link.label }}
          </NuxtLink>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink
            to="/profile"
            class="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition"
          >
            <div
              class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs"
            >
              {{ data?.user?.name?.charAt(0).toUpperCase() }}
            </div>
            <span class="hidden md:block font-medium">{{
              data?.user?.name
            }}</span>
          </NuxtLink>

          <button
            @click="handleSignOut"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition"
            title="Deconectare"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="md:hidden border-t border-gray-100 flex">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition"
          :class="
            isActive(link.to)
              ? 'text-indigo-600'
              : 'text-gray-500 hover:text-gray-900'
          "
        >
          <Icon :name="link.icon" class="w-5 h-5" />
          {{ link.label }}
        </NuxtLink>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>
