<script setup lang="ts">
const { data, signOut } = useAuth();
const route = useRoute();

const isAdmin = computed(() => (data.value?.user as any)?.role === "admin");
const isActive = (path: string) => route.path.startsWith(path);

const unreadNotifs = ref(0);
const unreadMessages = ref(0);

async function fetchCounts() {
  if (!data.value) return;
  try {
    const [notifs, msgs] = await Promise.all([
      $fetch<any[]>("/api/notifications"),
      $fetch<{ count: number }>("/api/messages/unread"),
    ]);
    unreadNotifs.value = notifs.filter((n) => !n.read).length;
    unreadMessages.value = msgs.count;
  } catch {}
}

let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (data.value) {
    fetchCounts();
    timer = setInterval(fetchCounts, 5_000);
  } else {
    const stop = watch(data, (val) => {
      if (val) {
        fetchCounts();
        timer = setInterval(fetchCounts, 5_000);
        stop();
      }
    });
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

watch(
  () => route.path,
  () => {
    fetchCounts();
  },
);

const navLinks = computed(() => {
  const links = [
    { to: "/books", label: "Cărți", icon: "heroicons:book-open", badge: 0 },
    {
      to: "/loans",
      label: "Împrumuturi",
      icon: "heroicons:arrow-path-rounded-square",
      badge: 0,
    },
    {
      to: "/messages",
      label: "Mesaje",
      icon: "heroicons:chat-bubble-left-right",
      badge: unreadMessages.value,
    },
  ];
  if (isAdmin.value)
    links.push({
      to: "/admin",
      label: "Admin",
      icon: "heroicons:shield-check",
      badge: 0,
    });
  return links;
});

const mobileLinks = computed(() => [
  { to: "/books", label: "Cărți", icon: "heroicons:book-open", badge: 0 },
  {
    to: "/loans",
    label: "Împrumuturi",
    icon: "heroicons:arrow-path-rounded-square",
    badge: 0,
  },
  {
    to: "/messages",
    label: "Mesaje",
    icon: "heroicons:chat-bubble-left-right",
    badge: unreadMessages.value,
  },
]);

async function handleSignOut() {
  await signOut({ callbackUrl: "/auth/login" });
}
</script>

<template>
  <div class="min-h-screen relative">
    <img
      src="/hero-books.webp"
      alt=""
      aria-hidden="true"
      class="fixed inset-0 w-full h-full object-cover blur-sm scale-105 opacity-50 pointer-events-none z-0"
    />
    <div class="fixed inset-0 bg-cream-100/60 pointer-events-none z-0" />
    <nav
      class="bg-white/80 backdrop-blur-md border-b border-cream-200 sticky top-0 z-50 relative"
    >
      <div
        class="w-full px-5 md:px-10 lg:px-[60px] h-16 flex items-center justify-between"
      >
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-heading font-bold text-gray-900 text-lg"
        >
          <Icon name="heroicons:book-open" class="w-6 h-6 text-sage-500" />
          b-connect
        </NuxtLink>

        <div class="hidden md:flex items-center gap-1">
          <template v-if="data">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition"
              :class="
                isActive(link.to)
                  ? 'bg-sage-50 text-sage-600'
                  : 'text-gray-600 hover:bg-cream-200 hover:text-gray-900'
              "
            >
              <Icon :name="link.icon" class="w-4 h-4" />
              {{ link.label }}
              <span
                v-if="link.badge > 0"
                class="absolute top-1.5 right-1.5 w-2 h-2 bg-warm-400 rounded-full"
              />
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink
              to="/books"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition"
              :class="
                isActive('/books')
                  ? 'bg-sage-50 text-sage-600'
                  : 'text-gray-600 hover:bg-cream-200 hover:text-gray-900'
              "
            >
              <Icon name="heroicons:book-open" class="w-4 h-4" />
              Cărți
            </NuxtLink>
          </template>
        </div>

        <div class="flex items-center gap-2">
          <template v-if="data">
            <NuxtLink
              to="/notifications"
              class="relative p-2 text-gray-400 hover:text-sage-600 rounded-xl hover:bg-cream-200 transition"
              title="Notificări"
            >
              <Icon name="heroicons:bell" class="w-5 h-5" />
              <span
                v-if="unreadNotifs > 0"
                class="absolute top-1 right-1 w-2 h-2 bg-warm-400 rounded-full"
              />
            </NuxtLink>

            <NuxtLink
              to="/profile"
              class="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition"
            >
              <UserAvatar :name="data?.user?.name" size="sm" />
              <span class="hidden md:block font-medium">{{
                data?.user?.name
              }}</span>
            </NuxtLink>

            <button
              @click="handleSignOut"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-cream-200 transition"
              title="Deconectare"
            >
              <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/auth/login"
              class="px-4 py-2 text-sm font-medium text-sage-600 hover:bg-sage-50 rounded-xl transition"
            >
              Autentifică-te
            </NuxtLink>
            <NuxtLink
              to="/auth/register"
              class="px-4 py-2 text-sm font-medium bg-sage-500 hover:bg-sage-600 text-white rounded-xl transition"
            >
              Înregistrare
            </NuxtLink>
          </template>
        </div>
      </div>

      <div v-if="data" class="md:hidden border-t border-cream-200 flex">
        <NuxtLink
          v-for="link in mobileLinks"
          :key="link.to"
          :to="link.to"
          class="flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition relative"
          :class="
            isActive(link.to)
              ? 'text-sage-600'
              : 'text-gray-500 hover:text-gray-900'
          "
        >
          <div class="relative">
            <Icon :name="link.icon" class="w-5 h-5" />
            <span
              v-if="link.badge > 0"
              class="absolute -top-1 -right-1 w-2 h-2 bg-warm-400 rounded-full"
            />
          </div>
          {{ link.label }}
        </NuxtLink>
      </div>
    </nav>

    <main
      class="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-10 lg:px-[60px] py-8 md:py-10 lg:py-12"
    >
      <slot />
    </main>
  </div>
</template>
