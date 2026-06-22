<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data: session } = useAuth()
const { data: convs, refresh } = await useFetch('/api/conversations')

function getOther(conv: any) {
  const me = (session.value?.user as any)?.id
  return conv.user1.id === me ? conv.user2 : conv.user1
}

function formatTime(dt: string) {
  const d = new Date(dt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ieri'
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Mesaje</h1>

    <div v-if="!(convs as any[])?.length" class="text-center py-20 bg-white border border-gray-100 rounded-xl">
      <Icon name="heroicons:chat-bubble-left-right" class="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p class="text-gray-500">Nicio conversație încă.</p>
      <p class="text-sm text-gray-400 mt-1">Mergi la profilul unui utilizator și apasă "Mesaj".</p>
    </div>

    <div v-else class="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
      <NuxtLink
        v-for="conv in (convs as any[])"
        :key="conv.id"
        :to="`/messages/${conv.id}`"
        class="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
      >
        <div class="relative shrink-0">
          <div class="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
            {{ getOther(conv).name?.charAt(0).toUpperCase() }}
          </div>
          <span v-if="conv.unreadCount > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {{ conv.unreadCount }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="font-medium text-gray-900 text-sm">{{ getOther(conv).name }}</p>
            <span v-if="conv.lastMessage" class="text-xs text-gray-400 shrink-0 ml-2">
              {{ formatTime(conv.lastMessage.createdAt) }}
            </span>
          </div>
          <p v-if="conv.lastMessage" class="text-xs text-gray-500 truncate mt-0.5">
            <span v-if="conv.lastMessage.senderId === (session?.user as any)?.id" class="text-gray-400">Tu: </span>
            {{ conv.lastMessage.content }}
          </p>
          <p v-else class="text-xs text-gray-400 mt-0.5 italic">Niciun mesaj încă</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
