<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const router = useRouter()
const submitting = ref(false)
const error = ref('')

async function handleSubmit(data: any) {
  submitting.value = true
  error.value = ''
  try {
    const book = await $fetch('/api/books', { method: 'POST', body: data })
    router.push(`/books/${(book as any).id}`)
  } catch (err: any) {
    error.value = err?.data?.message || 'A apărut o eroare.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/books" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition">
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900">Adaugă carte</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{{ error }}</div>

    <BookForm :loading="submitting" submit-label="Adaugă carte" @submit="handleSubmit" @cancel="router.push('/books')" />
  </div>
</template>
