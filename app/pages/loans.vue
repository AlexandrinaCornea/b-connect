<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const activeTab = ref<'incoming' | 'outgoing' | 'history'>('incoming')

const { data: incoming, refresh: refreshIncoming } = await useFetch('/api/loans/incoming')
const { data: outgoing, refresh: refreshOutgoing } = await useFetch('/api/loans/outgoing')
const { data: history } = await useFetch('/api/loans/history')

const actionError = ref('')

async function updateLoan(id: string, status: string) {
  actionError.value = ''
  try {
    await $fetch(`/api/loans/${id}`, {
      method: 'PUT',
      body: { status },
    })
    await refreshIncoming()
    await refreshOutgoing()
  } catch (err: any) {
    actionError.value = err?.data?.message || 'A apărut o eroare.'
  }
}

async function returnLoan(id: string) {
  actionError.value = ''
  try {
    await $fetch(`/api/loans/${id}/return`, { method: 'PUT' })
    await refreshIncoming()
    await refreshOutgoing()
  } catch (err: any) {
    actionError.value = err?.data?.message || 'A apărut o eroare.'
  }
}

const statusLabel: Record<string, string> = {
  pending: 'În așteptare',
  active: 'Activ',
  returned: 'Returnat',
  rejected: 'Respins',
  cancelled: 'Anulat',
}

const statusClass: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-blue-100 text-blue-700',
  returned: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const tabs = [
  { key: 'incoming', label: 'Primite', icon: 'heroicons:inbox' },
  { key: 'outgoing', label: 'Trimise', icon: 'heroicons:paper-airplane' },
  { key: 'history', label: 'Istoric', icon: 'heroicons:clock' },
]
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Împrumuturi</h1>

    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key as any"
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition"
        :class="activeTab === tab.key
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'"
      >
        <Icon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <div v-if="actionError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
      {{ actionError }}
    </div>

    <div v-if="activeTab === 'incoming'">
      <div v-if="!incoming?.length" class="text-center py-16 bg-white border border-gray-100 rounded-xl">
        <Icon name="heroicons:inbox" class="w-10 h-10 text-gray-200 mx-auto mb-2" />
        <p class="text-sm text-gray-500">Nu ai cereri primite.</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="loan in incoming"
          :key="loan.id"
          class="bg-white border border-gray-100 rounded-xl p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex gap-3">
              <div class="w-10 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                <img v-if="loan.book?.imageUrl" :src="loan.book.imageUrl" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Icon name="heroicons:book-open" class="w-4 h-4 text-gray-300" />
                </div>
              </div>
              <div>
                <p class="font-medium text-gray-900 text-sm">{{ loan.book?.title }}</p>
                <p class="text-xs text-gray-500">Solicitat de <strong>{{ loan.borrower?.name }}</strong></p>
                <p v-if="loan.message" class="text-xs text-gray-400 mt-1 italic">"{{ loan.message }}"</p>
              </div>
            </div>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" :class="statusClass[loan.status]">
              {{ statusLabel[loan.status] }}
            </span>
          </div>

          <div v-if="loan.status === 'pending'" class="flex gap-2 mt-3 pt-3 border-t border-gray-50">
            <button
              @click="updateLoan(loan.id, 'active')"
              class="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition"
            >
              Acceptă
            </button>
            <button
              @click="updateLoan(loan.id, 'rejected')"
              class="flex-1 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium rounded-lg transition"
            >
              Respinge
            </button>
          </div>
          <div v-if="loan.status === 'active'" class="mt-3 pt-3 border-t border-gray-50">
            <button
              @click="returnLoan(loan.id)"
              class="w-full py-1.5 border border-green-200 text-green-600 hover:bg-green-50 text-xs font-medium rounded-lg transition"
            >
              Marchează returnată
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'outgoing'">
      <div v-if="!outgoing?.length" class="text-center py-16 bg-white border border-gray-100 rounded-xl">
        <Icon name="heroicons:paper-airplane" class="w-10 h-10 text-gray-200 mx-auto mb-2" />
        <p class="text-sm text-gray-500">Nu ai cereri trimise.</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="loan in outgoing"
          :key="loan.id"
          class="bg-white border border-gray-100 rounded-xl p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex gap-3">
              <div class="w-10 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                <img v-if="loan.book?.imageUrl" :src="loan.book.imageUrl" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Icon name="heroicons:book-open" class="w-4 h-4 text-gray-300" />
                </div>
              </div>
              <div>
                <p class="font-medium text-gray-900 text-sm">{{ loan.book?.title }}</p>
                <p class="text-xs text-gray-500">Proprietar: <strong>{{ loan.owner?.name }}</strong></p>
              </div>
            </div>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" :class="statusClass[loan.status]">
              {{ statusLabel[loan.status] }}
            </span>
          </div>

          <div v-if="loan.status === 'pending'" class="mt-3 pt-3 border-t border-gray-50">
            <button
              @click="updateLoan(loan.id, 'cancelled')"
              class="w-full py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium rounded-lg transition"
            >
              Anulează cererea
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'history'">
      <div v-if="!history?.length" class="text-center py-16 bg-white border border-gray-100 rounded-xl">
        <Icon name="heroicons:clock" class="w-10 h-10 text-gray-200 mx-auto mb-2" />
        <p class="text-sm text-gray-500">Niciun împrumut finalizat.</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="loan in history"
          :key="loan.id"
          class="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4"
        >
          <div class="flex gap-3">
            <div class="w-10 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0">
              <img v-if="loan.book?.imageUrl" :src="loan.book.imageUrl" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <Icon name="heroicons:book-open" class="w-4 h-4 text-gray-300" />
              </div>
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm">{{ loan.book?.title }}</p>
              <p class="text-xs text-gray-500">{{ loan.book?.author }}</p>
            </div>
          </div>
          <span class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" :class="statusClass[loan.status]">
            {{ statusLabel[loan.status] }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
