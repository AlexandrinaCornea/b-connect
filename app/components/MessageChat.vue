<script setup lang="ts">
const props = defineProps<{
  convId: string;
  other: { id: string; name: string; avatarUrl?: string | null } | null;
  showBack?: boolean;
}>();

const { data: session } = useAuth();
const msgs = ref<any[]>([]);
const loading = ref(true);
const newMessage = ref("");
const sending = ref(false);
const messagesEnd = ref<HTMLElement>();

const me = computed(() => (session.value?.user as any)?.id);

async function fetchMessages() {
  msgs.value = await $fetch<any[]>(
    `/api/conversations/${props.convId}/messages`,
  );
}

onMounted(async () => {
  try {
    msgs.value = await $fetch<any[]>(
      `/api/conversations/${props.convId}/messages`,
    );
    await $fetch(`/api/conversations/${props.convId}/read`, { method: "PUT" });
  } finally {
    loading.value = false;
  }
  await nextTick();
  messagesEnd.value?.scrollIntoView();
  const timer = setInterval(fetchMessages, 3_000);
  onUnmounted(() => clearInterval(timer));
});

watch(msgs, async () => {
  await nextTick();
  messagesEnd.value?.scrollIntoView({ behavior: "smooth" });
});

watch(
  () => props.convId,
  async () => {
    loading.value = true;
    msgs.value = [];
    try {
      msgs.value = await $fetch<any[]>(
        `/api/conversations/${props.convId}/messages`,
      );
      await $fetch(`/api/conversations/${props.convId}/read`, {
        method: "PUT",
      });
    } finally {
      loading.value = false;
    }
    await nextTick();
    messagesEnd.value?.scrollIntoView();
  },
);

async function send() {
  if (!newMessage.value.trim() || sending.value) return;
  sending.value = true;
  const content = newMessage.value;
  newMessage.value = "";
  try {
    const sent = await $fetch<any>(
      `/api/conversations/${props.convId}/messages`,
      {
        method: "POST",
        body: { content },
      },
    );
    msgs.value = [
      ...msgs.value,
      {
        ...sent,
        sender: {
          id: me.value,
          name: session.value?.user?.name,
          avatarUrl: null,
        },
      },
    ];
    fetchMessages();
  } finally {
    sending.value = false;
  }
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayLabel(dt: string) {
  const d = new Date(dt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDay.getTime() === today.getTime()) return "Azi";
  if (msgDay.getTime() === yesterday.getTime()) return "Ieri";
  return d.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const lastReadSentId = computed(() => {
  const mine = msgs.value.filter((m) => m.senderId === me.value && m.read);
  return mine.length ? mine[mine.length - 1].id : null;
});

const groupedMsgs = computed(() => {
  const groups: { label: string; messages: any[] }[] = [];
  let currentLabel = "";
  for (const msg of msgs.value) {
    const label = dayLabel(msg.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, messages: [] });
    }
    groups[groups.length - 1].messages.push(msg);
  }
  return groups;
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-cream-200 bg-white shrink-0"
    >
      <NuxtLink
        v-if="showBack"
        to="/messages"
        class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition"
      >
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div v-if="other" class="flex items-center gap-3">
        <UserAvatar :name="other.name" size="sm" />
        <NuxtLink
          :to="`/users/${other.id}`"
          class="font-semibold text-gray-900 hover:underline text-sm"
        >
          {{ other.name }}
        </NuxtLink>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto bg-white p-4 space-y-4 min-h-0">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <p class="text-sm text-gray-400">Se încarcă...</p>
      </div>
      <div
        v-else-if="!msgs.length"
        class="flex items-center justify-center h-full"
      >
        <p class="text-sm text-gray-400">Trimite primul mesaj!</p>
      </div>
      <template v-else v-for="group in groupedMsgs" :key="group.label">
        <div class="flex items-center gap-3 my-2">
          <div class="flex-1 h-px bg-gray-100" />
          <span class="text-xs text-gray-400 font-medium px-2">{{
            group.label
          }}</span>
          <div class="flex-1 h-px bg-gray-100" />
        </div>
        <template v-for="msg in group.messages" :key="msg.id">
          <div
            class="flex gap-2"
            :class="
              msg.senderId === me ? 'justify-end' : 'justify-start items-end'
            "
          >
            <div v-if="msg.senderId !== me" class="shrink-0 mb-0.5">
              <UserAvatar :name="other?.name" size="xs" />
            </div>
            <div
              class="max-w-[70%] px-4 py-2 rounded-2xl text-sm"
              :class="
                msg.senderId === me
                  ? 'bg-sage-500 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
              "
            >
              <p>{{ msg.content }}</p>
              <p class="text-xs mt-0.5 opacity-60 text-right">
                {{ formatTime(msg.createdAt) }}
              </p>
            </div>
          </div>
          <div
            v-if="
              msg.senderId === me && msg.id === lastReadSentId && msg.readAt
            "
            class="text-right text-[11px] text-gray-400 -mt-2 pr-1"
          >
            Citit la {{ formatTime(msg.readAt) }}
          </div>
        </template>
      </template>
      <div ref="messagesEnd" />
    </div>

    <form
      @submit.prevent="send"
      class="px-4 py-3 border-t border-cream-200 bg-white flex gap-2 shrink-0"
    >
      <input
        v-model="newMessage"
        type="text"
        placeholder="Scrie un mesaj..."
        class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
        @keydown.enter.exact.prevent="send"
      />
      <button
        type="submit"
        :disabled="!newMessage.trim() || sending"
        class="px-4 py-2.5 bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white rounded-xl transition"
      >
        <Icon name="heroicons:paper-airplane" class="w-5 h-5" />
      </button>
    </form>
  </div>
</template>
