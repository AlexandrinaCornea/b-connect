<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: session } = useAuth();

const convs = ref<any[]>([]);
const search = ref("");

async function fetchConvs() {
  convs.value = await $fetch<any[]>("/api/conversations");
}

onMounted(() => {
  fetchConvs();
  const timer = setInterval(fetchConvs, 5_000);
  onUnmounted(() => clearInterval(timer));
});

function getOther(conv: any) {
  const me = (session.value?.user as any)?.id;
  return conv.user1.id === me ? conv.user2 : conv.user1;
}

const filtered = computed(() => {
  if (!search.value.trim()) return convs.value;
  const q = search.value.toLowerCase();
  return convs.value.filter((c) => getOther(c).name?.toLowerCase().includes(q));
});

function formatTime(dt: string) {
  const d = new Date(dt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Ieri";
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Mesaje</h1>

    <div class="relative mb-4">
      <Icon
        name="heroicons:magnifying-glass"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
      />
      <input
        v-model="search"
        type="text"
        placeholder="Caută în mesaje..."
        class="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition bg-white"
      />
    </div>

    <div
      v-if="!convs.length"
      class="text-center py-20 bg-white border border-cream-200 rounded-xl space-y-2"
    >
      <Icon
        name="heroicons:chat-bubble-left-right"
        class="w-12 h-12 text-cream-300 mx-auto"
      />
      <p class="font-semibold text-gray-700">Nicio conversație...</p>
      <p class="text-sm text-gray-400">Mesajele tale vor apărea aici.</p>
    </div>

    <div
      v-else-if="!filtered.length"
      class="text-center py-12 bg-white border border-cream-200 rounded-xl"
    >
      <p class="text-sm text-gray-400">Niciun rezultat pentru „{{ search }}"</p>
    </div>

    <div
      v-else
      class="bg-white border border-cream-200 rounded-xl overflow-hidden divide-y divide-gray-50"
    >
      <NuxtLink
        v-for="conv in filtered"
        :key="conv.id"
        :to="`/messages/${conv.id}`"
        class="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
      >
        <div class="relative shrink-0">
          <UserAvatar :name="getOther(conv).name" size="md" />
          <span
            v-if="conv.unreadCount > 0"
            class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-sage-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {{ conv.unreadCount }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="font-medium text-gray-900 text-sm">
              {{ getOther(conv).name }}
            </p>
            <span
              v-if="conv.lastMessage"
              class="text-xs text-gray-400 shrink-0 ml-2"
            >
              {{ formatTime(conv.lastMessage.createdAt) }}
            </span>
          </div>
          <p
            v-if="conv.lastMessage"
            class="text-xs text-gray-500 truncate mt-0.5"
          >
            <span
              v-if="conv.lastMessage.senderId === (session?.user as any)?.id"
              class="text-gray-400"
              >Tu:
            </span>
            {{ conv.lastMessage.content }}
          </p>
          <p v-else class="text-xs text-gray-400 mt-0.5 italic">
            Niciun mesaj încă
          </p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
