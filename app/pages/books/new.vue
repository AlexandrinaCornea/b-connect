<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const router = useRouter();
const config = useRuntimeConfig();
const { uploading, uploadError, uploadImage } = useImageUpload();

const form = reactive({
  title: "",
  author: "",
  genre: "",
  description: "",
  imageUrl: "",
  pageCount: undefined as number | undefined,
  publishedYear: undefined as number | undefined,
});

const imagePreview = ref("");
const submitting = ref(false);
const error = ref("");

// Google Books search
const searchQuery = ref("");
const searchResults = ref<any[]>([]);
const searching = ref(false);
const showDropdown = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const genres = [
  "Roman",
  "SF",
  "Fantasy",
  "Thriller",
  "Mister",
  "Biografie",
  "Istorie",
  "Știință",
  "Dezvoltare personală",
  "Poezie",
  "Altele",
];

async function onSearchInput() {
  const q = searchQuery.value.trim();
  if (q.length < 2) {
    searchResults.value = [];
    showDropdown.value = false;
    return;
  }
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    searching.value = true;
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(q)}&maxResults=6&key=${config.public.googleBooksApiKey}`,
      );
      const data = await res.json();
      searchResults.value = (data.items || []).filter(
        (i: any) => i.volumeInfo?.title,
      );
      showDropdown.value = searchResults.value.length > 0;
    } catch {
      searchResults.value = [];
    } finally {
      searching.value = false;
    }
  }, 400);
}

function selectBook(item: any) {
  const info = item.volumeInfo;
  form.title = info.title || "";
  form.author = (info.authors || []).join(", ");
  form.description = info.description || "";
  form.pageCount = info.pageCount || undefined;
  if (info.publishedDate) {
    const year = parseInt(info.publishedDate.substring(0, 4));
    form.publishedYear = isNaN(year) ? undefined : year;
  }
  if (info.categories?.length) {
    const cat = info.categories[0].toLowerCase();
    if (cat.includes("fiction") || cat.includes("roman")) form.genre = "Roman";
    else if (cat.includes("science fiction") || cat.includes("sf"))
      form.genre = "SF";
    else if (cat.includes("fantasy")) form.genre = "Fantasy";
    else if (cat.includes("thriller") || cat.includes("mystery"))
      form.genre = "Thriller";
    else if (cat.includes("biograph")) form.genre = "Biografie";
    else if (cat.includes("histor")) form.genre = "Istorie";
    else if (cat.includes("science")) form.genre = "Știință";
    else if (cat.includes("poetry")) form.genre = "Poezie";
    else form.genre = "Altele";
  }
  searchQuery.value = form.title;
  showDropdown.value = false;
}

function closeDropdown() {
  setTimeout(() => {
    showDropdown.value = false;
  }, 150);
}

async function handleImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  imagePreview.value = URL.createObjectURL(file);
  const url = await uploadImage(file);
  if (url) form.imageUrl = url;
}

async function handleSubmit() {
  if (!form.title || !form.author || !form.genre || !form.imageUrl) {
    error.value = "Completează toate câmpurile obligatorii.";
    return;
  }
  submitting.value = true;
  error.value = "";
  try {
    const book = await $fetch("/api/books", {
      method: "POST",
      body: form,
    });
    router.push(`/books/${(book as any).id}`);
  } catch (err: any) {
    error.value = err?.data?.message || "A apărut o eroare.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink
        to="/books"
        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition"
      >
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900">Adaugă carte</h1>
    </div>

    <form
      @submit.prevent="handleSubmit"
      class="bg-white border border-gray-100 rounded-xl p-6 space-y-5"
    >
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Caută cartea</label
        >
        <div class="relative">
          <div class="relative">
            <Icon
              name="heroicons:magnifying-glass"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ex: Crimă și pedeapsă"
              class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              @input="onSearchInput"
              @blur="closeDropdown"
            />
            <span
              v-if="searching"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400"
              >Se caută...</span
            >
          </div>
          <div
            v-if="showDropdown"
            class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            <button
              v-for="item in searchResults"
              :key="item.id"
              type="button"
              class="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 text-left transition"
              @mousedown.prevent="selectBook(item)"
            >
              <img
                v-if="item.volumeInfo?.imageLinks?.smallThumbnail"
                :src="item.volumeInfo.imageLinks.smallThumbnail"
                class="w-8 h-10 object-cover rounded shrink-0"
              />
              <div
                v-else
                class="w-8 h-10 bg-gray-100 rounded shrink-0 flex items-center justify-center"
              >
                <Icon
                  name="heroicons:book-open"
                  class="w-4 h-4 text-gray-300"
                />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ item.volumeInfo?.title }}
                </p>
                <p class="text-xs text-gray-500 truncate">
                  {{ (item.volumeInfo?.authors || []).join(", ") }}
                </p>
                <p
                  v-if="item.volumeInfo?.publishedDate"
                  class="text-xs text-gray-400"
                >
                  {{ item.volumeInfo.publishedDate?.substring(0, 4) }}
                </p>
              </div>
            </button>
          </div>
        </div>
        <p class="mt-1 text-xs text-gray-400">
          Selectează din listă pentru a completa automat câmpurile.
        </p>
      </div>

      <div class="border-t border-gray-100 pt-4 space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Copertă <span class="text-red-400">*</span>
          </label>
          <div class="flex gap-4 items-start">
            <div
              class="w-24 h-32 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0"
            >
              <img
                v-if="imagePreview"
                :src="imagePreview"
                class="w-full h-full object-cover"
              />
              <Icon
                v-else
                name="heroicons:photo"
                class="w-8 h-8 text-gray-300"
              />
            </div>
            <div class="flex-1">
              <label
                class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" />
                <span v-if="uploading">Se încarcă...</span>
                <span v-else>Alege imagine</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageChange"
                  :disabled="uploading"
                />
              </label>
              <p class="mt-2 text-xs text-gray-400">JPG, PNG, WebP — max 5MB</p>
              <p v-if="uploadError" class="mt-1 text-xs text-red-500">
                {{ uploadError }}
              </p>
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

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              An publicare
              <span class="text-gray-400 font-normal">(opțional)</span>
            </label>
            <input
              v-model.number="form.publishedYear"
              type="number"
              placeholder="ex: 1866"
              min="1000"
              max="2099"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nr. pagini
              <span class="text-gray-400 font-normal">(opțional)</span>
            </label>
            <input
              v-model.number="form.pageCount"
              type="number"
              placeholder="ex: 671"
              min="1"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Descriere <span class="text-gray-400 font-normal">(opțional)</span>
          </label>
          <textarea
            v-model="form.description"
            rows="6"
            placeholder="Câteva cuvinte despre carte..."
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition resize-none"
          />
        </div>
      </div>

      <div
        v-if="error"
        class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
      >
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
