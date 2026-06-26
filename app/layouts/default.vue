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
  (path) => {
    if (path.startsWith("/messages")) unreadMessages.value = 0;
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
  if (isAdmin.value) {
    links.push({
      to: "/admin",
      label: "Admin",
      icon: "heroicons:shield-check",
      badge: 0,
    });
  }
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
  { to: "/profile", label: "Profil", icon: "heroicons:user-circle", badge: 0 },
]);

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
          <template v-if="data">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition"
              :class="
                isActive(link.to)
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              "
            >
              <Icon :name="link.icon" class="w-4 h-4" />
              {{ link.label }}
              <span
                v-if="link.badge > 0"
                class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
              />
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink
              to="/books"
              class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition"
              :class="
                isActive('/books')
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
              class="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition"
              title="Notificări"
            >
              <Icon name="heroicons:bell" class="w-5 h-5" />
              <span
                v-if="unreadNotifs > 0"
                class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
              />
            </NuxtLink>

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
          </template>
          <template v-else>
            <NuxtLink
              to="/auth/login"
              class="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              >Autentifică-te</NuxtLink
            >
            <NuxtLink
              to="/auth/register"
              class="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >Înregistrare</NuxtLink
            >
          </template>
        </div>
      </div>

      <div v-if="data" class="md:hidden border-t border-gray-100 flex">
        <NuxtLink
          v-for="link in mobileLinks"
          :key="link.to"
          :to="link.to"
          class="flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition relative"
          :class="
            isActive(link.to)
              ? 'text-indigo-600'
              : 'text-gray-500 hover:text-gray-900'
          "
        >
          <div class="relative">
            <Icon :name="link.icon" class="w-5 h-5" />
            <span
              v-if="link.badge > 0"
              class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
            />
          </div>
          {{ link.label }}
        </NuxtLink>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>
