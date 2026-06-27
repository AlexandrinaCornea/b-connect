<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { data: session } = useAuth()
const id = route.params.id as string

const { data: book, pending } = await useFetch(`/api/books/${id}`)

watch(book, (val) => {
  if (!val) return
  if ((session.value?.user as any)?.id !== (val as any).ownerId) {
    router.push(`/books/${id}`)
  }
}, { immediate: true })

const submitting = ref(false)
const error = ref('')

async function handleSubmit(data: any) {
  submitting.value = true
  error.value = ''
  try {
    await $fetch(`/api/books/${id}`, { method: 'PUT', body: data })
    router.push(`/books/${id}`)
  } catch (err: any) {
    error.value = err?.data?.message || 'A apărut o eroare.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!confirm('Ești sigur că vrei să ștergi această carte?')) return
  try {
    await $fetch(`/api/books/${id}`, { method: 'DELETE' })
    router.push('/books')
  } catch (err: any) {
    error.value = err?.data?.message || 'Eroare la ștergere.'
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink :to="`/books/${id}`" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition">
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900">Editează carte</h1>
    </div>

    <div v-if="pending" class="animate-pulse space-y-4">
      <div class="h-10 bg-gray-100 rounded" />
      <div class="h-10 bg-gray-100 rounded" />
      <div class="h-32 bg-gray-100 rounded" />
    </div>

    <template v-else>
      <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{{ error }}</div>

      <BookForm
        :initial-data="book as any"
        :loading="submitting"
        :show-delete="true"
        submit-label="Salvează"
        @submit="handleSubmit"
        @delete="handleDelete"
        @cancel="router.push(`/books/${id}`)"
      />
    </template>
  </div>
</template>
