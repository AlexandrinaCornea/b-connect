<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: session } = useAuth();

const convs = ref<any[]>([]);
const search = ref("");
const selectedConvId = ref<string | null>(null);

async function fetchConvs() {
  convs.value = await $fetch<any[]>("/api/conversations");
}

onMounted(async () => {
  await fetchConvs();
  const timer = setInterval(fetchConvs, 5_000);
  onUnmounted(() => clearInterval(timer));
  if (route.query.conv) {
    selectedConvId.value = route.query.conv as string;
  }
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

const route = useRoute();
const isMobile = ref(false);
onMounted(() => {
  isMobile.value = window.innerWidth < 768;
  window.addEventListener("resize", () => {
    isMobile.value = window.innerWidth < 768;
  });
});

const selectedConv = computed(
  () => convs.value.find((c) => c.id === selectedConvId.value) ?? null,
);

const selectedOther = computed(() =>
  selectedConv.value ? getOther(selectedConv.value) : null,
);

function selectConv(convId: string) {
  selectedConvId.value = convId;
  const c = convs.value.find((c) => c.id === convId);
  if (c) c.unreadCount = 0;
}

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
  <div
    class="flex gap-0 border border-cream-200 rounded-xl overflow-hidden bg-white"
    style="height: calc(100vh - 10rem)"
  >
    <div
      class="w-full md:w-80 shrink-0 flex flex-col border-r border-cream-200"
    >
      <div class="px-4 pt-4 pb-3 border-b border-cream-100">
        <h1 class="text-lg font-bold text-gray-900 mb-3">Mesaje</h1>
        <div class="relative">
          <Icon
            name="heroicons:magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Caută în mesaje..."
            class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div
          v-if="!convs.length"
          class="flex flex-col items-center justify-center h-full gap-2 text-center px-4"
        >
          <Icon
            name="heroicons:chat-bubble-left-right"
            class="w-10 h-10 text-cream-300"
          />
          <p class="font-semibold text-gray-700 text-sm">Nicio conversație</p>
          <p class="text-xs text-gray-400">Mesajele tale vor apărea aici.</p>
        </div>

        <div v-else-if="!filtered.length" class="p-4 text-center">
          <p class="text-sm text-gray-400">
            Niciun rezultat pentru „{{ search }}"
          </p>
        </div>

        <div
          v-for="conv in filtered"
          :key="conv.id"
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 text-left cursor-pointer"
          :class="
            selectedConvId === conv.id
              ? 'bg-sage-50 border-l-2 border-l-sage-400'
              : ''
          "
          @click="
            isMobile ? navigateTo(`/messages/${conv.id}`) : selectConv(conv.id)
          "
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
              <p class="font-medium text-gray-900 text-sm truncate">
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
        </div>
      </div>
    </div>

    <div class="hidden md:flex md:flex-col flex-1 min-w-0">
      <MessageChat
        v-if="selectedConvId"
        :key="selectedConvId"
        :conv-id="selectedConvId"
        :other="selectedOther"
      />
      <div
        v-else
        class="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8"
      >
        <Icon
          name="heroicons:chat-bubble-left-right"
          class="w-14 h-14 text-cream-200"
        />
        <p class="font-semibold text-gray-500">Selectează o conversație</p>
        <p class="text-sm text-gray-400">
          Alege o conversație din lista din stânga pentru a începe.
        </p>
      </div>
    </div>
  </div>
</template>
