<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { data: session } = useAuth()
const userId = computed(() => (session.value?.user as any)?.id)

const { data: profile, refresh: refreshProfile } = await useFetch(
  computed(() => `/api/users/${userId.value}`)
)

const { data: myBooks } = await useFetch('/api/books/my')

const editing = ref(false)
const saving = ref(false)
const saveError = ref('')

const form = reactive({
  name: '',
  city: '',
  bio: '',
})

watch(profile, (val) => {
  if (!val) return
  form.name = val.name
  form.city = val.city ?? ''
  form.bio = val.bio ?? ''
}, { immediate: true })

async function saveProfile() {
  saving.value = true
  saveError.value = ''
  try {
    await $fetch(`/api/users/${userId.value}`, {
      method: 'PUT',
      body: form,
    })
    await refreshProfile()
    editing.value = false
  } catch (err: any) {
    saveError.value = err?.data?.message || 'A apărut o eroare.'
  } finally {
    saving.value = false
  }
}

const ratingAvg = computed(() => {
  if (!profile.value) return null
  const { ratingSum, ratingCount } = profile.value
  return ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="bg-white border border-gray-100 rounded-xl p-6">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
            {{ profile?.name?.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">{{ profile?.name }}</h1>
            <p v-if="profile?.city" class="text-sm text-gray-500">{{ profile.city }}</p>
            <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span>{{ profile?.totalBooks ?? 0 }} cărți</span>
              <span v-if="ratingAvg" class="flex items-center gap-1">
                <Icon name="heroicons:star-solid" class="w-4 h-4 text-yellow-400" />
                {{ ratingAvg }}
              </span>
            </div>
          </div>
        </div>
        <button
          @click="editing = !editing"
          class="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
        >
          {{ editing ? 'Anulează' : 'Editează' }}
        </button>
      </div>

      <p v-if="!editing && profile?.bio" class="text-sm text-gray-600">{{ profile.bio }}</p>

      <form v-if="editing" @submit.prevent="saveProfile" class="space-y-4 mt-4 pt-4 border-t border-gray-100">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nume</label>
          <input v-model="form.name" type="text" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Localitate</label>
          <input v-model="form.city" type="text" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea v-model="form.bio" rows="3" placeholder="Câteva cuvinte despre tine..." class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition resize-none" />
        </div>
        <div v-if="saveError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{{ saveError }}</div>
        <button type="submit" :disabled="saving" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
          <span v-if="saving">Se salvează...</span>
          <span v-else>Salvează</span>
        </button>
      </form>
    </div>

    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Cărțile mele</h2>
        <NuxtLink to="/books/new" class="text-sm text-indigo-600 hover:underline">+ Adaugă</NuxtLink>
      </div>

      <div v-if="!myBooks?.length" class="text-center py-12 bg-white border border-gray-100 rounded-xl">
        <Icon name="heroicons:book-open" class="w-10 h-10 text-gray-200 mx-auto mb-2" />
        <p class="text-sm text-gray-500">Nu ai adăugat nicio carte încă.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NuxtLink
          v-for="book in myBooks"
          :key="book.id"
          :to="`/books/${book.id}`"
          class="flex gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm hover:border-gray-200 transition"
        >
          <div class="w-12 h-16 rounded-lg bg-gray-50 overflow-hidden shrink-0">
            <img v-if="book.imageUrl" :src="book.imageUrl" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:book-open" class="w-5 h-5 text-gray-200" />
            </div>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ book.title }}</p>
            <p class="text-xs text-gray-500">{{ book.author }}</p>
            <span
              class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
              :class="book.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'"
            >
              {{ book.status === 'available' ? 'Disponibilă' : 'Împrumutată' }}
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
