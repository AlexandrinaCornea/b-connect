<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { data: session } = useAuth();
const convId = route.params.id as string;

const { data: msgs, refresh } = await useFetch(
  `/api/conversations/${convId}/messages`,
);
const { data: convs } = await useFetch("/api/conversations");

const conv = computed(() =>
  (convs.value as any[])?.find((c: any) => c.id === convId),
);
const me = computed(() => (session.value?.user as any)?.id);
const other = computed(() => {
  if (!conv.value) return null;
  return conv.value.user1.id === me.value ? conv.value.user2 : conv.value.user1;
});

const newMessage = ref("");
const sending = ref(false);
const messagesEnd = ref<HTMLElement>();

async function send() {
  if (!newMessage.value.trim() || sending.value) return;
  sending.value = true;
  try {
    await $fetch(`/api/conversations/${convId}/messages`, {
      method: "POST",
      body: { content: newMessage.value },
    });
    newMessage.value = "";
    await refresh();
    await nextTick();
    messagesEnd.value?.scrollIntoView({ behavior: "smooth" });
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

onMounted(async () => {
  await nextTick();
  messagesEnd.value?.scrollIntoView();
});
</script>

<template>
  <div class="max-w-2xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
    <div class="flex items-center gap-3 mb-4">
      <NuxtLink
        to="/messages"
        class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition"
      >
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div v-if="other" class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm"
        >
          {{ other.name?.charAt(0).toUpperCase() }}
        </div>
        <div>
          <NuxtLink
            :to="`/users/${other.id}`"
            class="font-semibold text-gray-900 hover:underline text-sm"
          >
            {{ other.name }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div
      class="flex-1 overflow-y-auto bg-white border border-gray-100 rounded-xl p-4 space-y-3"
    >
      <div
        v-if="!(msgs as any[])?.length"
        class="flex items-center justify-center h-full"
      >
        <p class="text-sm text-gray-400">Trimite primul mesaj!</p>
      </div>

      <div
        v-for="msg in msgs as any[]"
        :key="msg.id"
        class="flex"
        :class="msg.senderId === me ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[70%] px-4 py-2 rounded-2xl text-sm"
          :class="
            msg.senderId === me
              ? 'bg-indigo-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          "
        >
          <p>{{ msg.content }}</p>
          <p class="text-xs mt-0.5 opacity-60 text-right">
            {{ formatTime(msg.createdAt) }}
          </p>
        </div>
      </div>
      <div ref="messagesEnd" />
    </div>

    <form @submit.prevent="send" class="mt-3 flex gap-2">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Scrie un mesaj..."
        class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
        @keydown.enter.exact.prevent="send"
      />
      <button
        type="submit"
        :disabled="!newMessage.trim() || sending"
        class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition"
      >
        <Icon name="heroicons:paper-airplane" class="w-5 h-5" />
      </button>
    </form>
  </div>
</template>
