<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { data: notifications, refresh } = await useFetch('/api/notifications')

const markingAll = ref(false)

async function markRead(id: string) {
  try {
    await $fetch(`/api/notifications/${id}`, { method: 'PUT' })
    await refresh()
  } catch {}
}

async function markAllRead() {
  markingAll.value = true
  const unread = notifications.value?.filter((n: any) => !n.read) ?? []
  await Promise.all(unread.map((n: any) => $fetch(`/api/notifications/${n.id}`, { method: 'PUT' })))
  await refresh()
  markingAll.value = false
}

const unreadCount = computed(() => notifications.value?.filter((n: any) => !n.read).length ?? 0)

const typeIcon: Record<string, string> = {
  loan_request: 'heroicons:inbox',
  loan_accepted: 'heroicons:check-circle',
  loan_rejected: 'heroicons:x-circle',
  loan_returned: 'heroicons:arrow-uturn-left',
  due_date_reminder: 'heroicons:clock',
  new_review: 'heroicons:star',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Notificări</h1>
        <p v-if="unreadCount > 0" class="text-sm text-gray-500 mt-1">{{ unreadCount }} necitite</p>
      </div>
      <button
        v-if="unreadCount > 0"
        @click="markAllRead"
        :disabled="markingAll"
        class="text-sm text-indigo-600 hover:underline disabled:opacity-50"
      >
        Marchează toate citite
      </button>
    </div>

    <div v-if="!notifications?.length" class="text-center py-20 bg-white border border-gray-100 rounded-xl">
      <Icon name="heroicons:bell" class="w-10 h-10 text-gray-200 mx-auto mb-2" />
      <p class="text-sm text-gray-500">Nu ai notificări.</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="flex items-start gap-3 p-4 rounded-xl border transition cursor-pointer"
        :class="notif.read
          ? 'bg-white border-gray-100'
          : 'bg-indigo-50 border-indigo-100'"
        @click="!notif.read && markRead(notif.id)"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          :class="notif.read ? 'bg-gray-100' : 'bg-indigo-100'"
        >
          <Icon
            :name="typeIcon[notif.type] ?? 'heroicons:bell'"
            class="w-4 h-4"
            :class="notif.read ? 'text-gray-400' : 'text-indigo-600'"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-800" :class="{ 'font-medium': !notif.read }">
            {{ notif.message }}
          </p>
          <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(notif.createdAt) }}</p>
        </div>
        <div v-if="!notif.read" class="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
      </div>
    </div>
  </div>
</template>
