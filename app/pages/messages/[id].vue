<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { data: session } = useAuth()
const convId = route.params.id as string

const msgs = ref<any[]>([])
const convs = ref<any[]>([])
const loading = ref(true)

const conv = computed(() => convs.value.find((c: any) => c.id === convId))
const me = computed(() => (session.value?.user as any)?.id)
const other = computed(() => {
  if (!conv.value) return null
  return conv.value.user1.id === me.value ? conv.value.user2 : conv.value.user1
})

const newMessage = ref('')
const sending = ref(false)
const messagesEnd = ref<HTMLElement>()

async function fetchMessages() {
  msgs.value = await $fetch<any[]>(`/api/conversations/${convId}/messages`)
}

onMounted(async () => {
  try {
    ;[msgs.value, convs.value] = await Promise.all([
      $fetch<any[]>(`/api/conversations/${convId}/messages`),
      $fetch<any[]>('/api/conversations'),
    ])
  } finally {
    loading.value = false
  }

  await nextTick()
  messagesEnd.value?.scrollIntoView()

  const timer = setInterval(fetchMessages, 3_000)
  onUnmounted(() => clearInterval(timer))
})

watch(msgs, async () => {
  await nextTick()
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
})

async function send() {
  if (!newMessage.value.trim() || sending.value) return
  sending.value = true
  const content = newMessage.value
  newMessage.value = ''
  try {
    const sent = await $fetch<any>(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      body: { content },
    })
    msgs.value = [
      ...msgs.value,
      { ...sent, sender: { id: me.value, name: session.value?.user?.name, avatarUrl: null } },
    ]
    fetchMessages()
  } finally {
    sending.value = false
  }
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}

const lastReadSentIndex = computed(() => {
  for (let i = msgs.value.length - 1; i >= 0; i--) {
    if (msgs.value[i].senderId === me.value && msgs.value[i].read && msgs.value[i].readAt) return i
  }
  return -1
})
</script>

<template>
  <div class="max-w-2xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
    <div class="flex items-center gap-3 mb-4">
      <NuxtLink to="/messages" class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition">
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div v-if="other" class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
          {{ other.name?.charAt(0).toUpperCase() }}
        </div>
        <NuxtLink :to="`/users/${other.id}`" class="font-semibold text-gray-900 hover:underline text-sm">
          {{ other.name }}
        </NuxtLink>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto bg-white border border-gray-100 rounded-xl p-4 space-y-1">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <p class="text-sm text-gray-400">Se încarcă...</p>
      </div>

      <div v-else-if="!msgs.length" class="flex items-center justify-center h-full">
        <p class="text-sm text-gray-400">Trimite primul mesaj!</p>
      </div>

      <template v-else v-for="(msg, index) in msgs" :key="msg.id">
        <div
          class="flex"
          :class="msg.senderId === me ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[70%] px-4 py-2 rounded-2xl text-sm"
            :class="msg.senderId === me
              ? 'bg-indigo-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'"
          >
            <p>{{ msg.content }}</p>
            <p class="text-xs mt-0.5 opacity-60 text-right">{{ formatTime(msg.createdAt) }}</p>
          </div>
        </div>

        <div
          v-if="msg.senderId === me && index === lastReadSentIndex"
          class="flex justify-end"
        >
          <p class="text-xs text-gray-400 mr-1 -mt-0.5">
            Citit la {{ formatTime(msg.readAt) }}
          </p>
        </div>
      </template>

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
