<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const router = useRouter()
const { uploading, uploadError, uploadImage } = useImageUpload()

const form = reactive({
  title: '',
  author: '',
  genre: '',
  description: '',
  imageUrl: '',
})

const imagePreview = ref('')
const submitting = ref(false)
const error = ref('')

const genres = [
  'Roman', 'SF', 'Fantasy', 'Thriller', 'Mister', 'Biografie',
  'Istorie', 'Știință', 'Dezvoltare personală', 'Poezie', 'Altele',
]

async function handleImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imagePreview.value = URL.createObjectURL(file)
  const url = await uploadImage(file)
  if (url) form.imageUrl = url
}

async function handleSubmit() {
  if (!form.title || !form.author || !form.genre || !form.imageUrl) {
    error.value = 'Completează toate câmpurile obligatorii.'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    const book = await $fetch('/api/books', {
      method: 'POST',
      body: form,
    })
    router.push(`/books/${(book as any).id}`)
  } catch (err: any) {
    error.value = err?.data?.message || 'A apărut o eroare.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/books" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition">
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900">Adaugă carte</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Copertă <span class="text-red-400">*</span>
        </label>
        <div class="flex gap-4 items-start">
          <div class="w-24 h-32 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
            <Icon v-else name="heroicons:photo" class="w-8 h-8 text-gray-300" />
          </div>
          <div class="flex-1">
            <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" />
              <span v-if="uploading">Se încarcă...</span>
              <span v-else>Alege imagine</span>
              <input type="file" accept="image/*" class="hidden" @change="handleImageChange" :disabled="uploading" />
            </label>
            <p class="mt-2 text-xs text-gray-400">JPG, PNG, WebP — max 5MB</p>
            <p v-if="uploadError" class="mt-1 text-xs text-red-500">{{ uploadError }}</p>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Titlu <span class="text-red-400">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          placeholder="ex: Crimă și pedeapsă"
          class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Autor <span class="text-red-400">*</span>
        </label>
        <input
          v-model="form.author"
          type="text"
          placeholder="ex: Dostoievski"
          class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Gen <span class="text-red-400">*</span>
        </label>
        <select
          v-model="form.genre"
          class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition bg-white"
        >
          <option value="">Selectează genul</option>
          <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Descriere <span class="text-gray-400 font-normal">(opțional)</span>
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="Câteva cuvinte despre carte..."
          class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition resize-none"
        />
      </div>

      <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
        {{ error }}
      </div>

      <div class="flex gap-3 pt-2">
        <NuxtLink
          to="/books"
          class="flex-1 text-center py-2.5 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition"
        >
          Anulează
        </NuxtLink>
        <button
          type="submit"
          :disabled="submitting || uploading"
          class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
        >
          <span v-if="submitting">Se salvează...</span>
          <span v-else>Adaugă carte</span>
        </button>
      </div>
    </form>
  </div>
</template>
