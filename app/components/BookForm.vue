<script setup lang="ts">
const { genreClass } = useGenreColor();

const props = defineProps<{
  initialData?: {
    title?: string;
    author?: string;
    genre?: string;
    description?: string;
    imageUrl?: string;
    pageCount?: number | null;
    publishedYear?: number | null;
  };
  submitLabel?: string;
  showDelete?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    data: {
      title: string;
      author: string;
      genre: string;
      description: string;
      imageUrl: string;
      pageCount: number;
      publishedYear: number;
    },
  ];
  delete: [];
  cancel: [];
}>();

const isEditMode = computed(() => !!props.initialData?.title);

// ─── Steps ────────────────────────────────────────────────────────────────────
const currentStep = ref(1);
const steps = [
  { number: 1, label: "Caută & Copertă" },
  { number: 2, label: "Informații" },
  { number: 3, label: "Detalii" },
];

// ─── Form state ───────────────────────────────────────────────────────────────
const { uploading, uploadError, uploadImage } = useImageUpload();
const config = useRuntimeConfig();

const form = reactive({
  title: props.initialData?.title ?? "",
  author: props.initialData?.author ?? "",
  genre: props.initialData?.genre ?? "",
  description: props.initialData?.description ?? "",
  imageUrl: props.initialData?.imageUrl ?? "",
  pageCount: props.initialData?.pageCount ?? (undefined as number | undefined),
  publishedYear:
    props.initialData?.publishedYear ?? (undefined as number | undefined),
});

const imagePreview = ref(props.initialData?.imageUrl ?? "");
const error = ref("");

watch(
  () => props.initialData,
  (val) => {
    if (!val) return;
    form.title = val.title ?? "";
    form.author = val.author ?? "";
    form.genre = val.genre ?? "";
    form.description = val.description ?? "";
    form.imageUrl = val.imageUrl ?? "";
    form.pageCount = val.pageCount ?? undefined;
    form.publishedYear = val.publishedYear ?? undefined;
    imagePreview.value = val.imageUrl ?? "";
  },
  { immediate: false },
);

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

// ─── Google Books search ───────────────────────────────────────────────────────
const searchQuery = ref("");
const searchResults = ref<any[]>([]);
const searching = ref(false);
const showDropdown = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

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

function clearSearch() {
  searchQuery.value = "";
  searchResults.value = [];
  showDropdown.value = false;
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

// ─── Image upload ─────────────────────────────────────────────────────────────
async function handleImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  imagePreview.value = URL.createObjectURL(file);
  const url = await uploadImage(file);
  if (url) form.imageUrl = url;
}

// ─── Duplicate check ──────────────────────────────────────────────────────────
const { data: myBooks } = !isEditMode.value
  ? await useFetch("/api/books/my")
  : { data: ref(null) };

const isDuplicate = computed(() => {
  if (!form.title || !myBooks.value) return false;
  return (myBooks.value as any[]).some(
    (b: any) =>
      b.title.toLowerCase().trim() === form.title.toLowerCase().trim(),
  );
});

// ─── Step navigation ──────────────────────────────────────────────────────────
function nextStep() {
  error.value = "";
  if (currentStep.value === 1) {
    if (!form.imageUrl) {
      error.value = "Te rugăm să adaugi o copertă.";
      return;
    }
  }
  if (currentStep.value === 2) {
    if (!form.title || !form.author || !form.genre) {
      error.value = "Completează titlul, autorul și genul.";
      return;
    }
  }
  currentStep.value++;
}

function prevStep() {
  error.value = "";
  currentStep.value--;
}

// ─── Cancel confirmation ──────────────────────────────────────────────────────
const showCancelConfirm = ref(false);

const hasData = computed(
  () => form.title || form.author || form.imageUrl || form.description,
);

function handleCancel() {
  if (hasData.value && !isEditMode.value) {
    showCancelConfirm.value = true;
  } else {
    emit("cancel");
  }
}

// ─── Submit ───────────────────────────────────────────────────────────────────
function handleSubmit() {
  if (!form.title || !form.author || !form.genre || !form.imageUrl) {
    error.value = "Completează toate câmpurile obligatorii.";
    return;
  }
  if (!form.publishedYear || !form.pageCount || !form.description?.trim()) {
    error.value =
      "Completează anul de publicare, numărul de pagini și descrierea.";
    return;
  }
  error.value = "";
  emit("submit", { ...form });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center lg:w-2/3">
      <template v-for="(step, i) in steps" :key="step.number">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition shrink-0"
            :class="
              currentStep > step.number
                ? 'bg-sage-500 text-white'
                : currentStep === step.number
                  ? 'bg-sage-500 text-white ring-4 ring-sage-100'
                  : 'bg-gray-100 text-gray-400'
            "
          >
            <Icon
              v-if="currentStep > step.number"
              name="heroicons:check"
              class="w-4 h-4"
            />
            <span v-else>{{ step.number }}</span>
          </div>
          <span
            class="text-sm font-medium hidden sm:block"
            :class="
              currentStep === step.number ? 'text-gray-900' : 'text-gray-400'
            "
          >
            {{ step.label }}
          </span>
        </div>
        <div
          v-if="i < steps.length - 1"
          class="flex-1 h-px mx-2 sm:mx-3"
          :class="currentStep > step.number ? 'bg-sage-400' : 'bg-gray-200'"
        />
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-10 items-stretch">
      <div class="lg:col-span-2 lg:col-start-1 order-2 lg:order-1">
        <div
          class="bg-white border border-cream-200 rounded-2xl p-5 md:p-7 lg:p-10 space-y-5"
        >
          <div v-show="currentStep === 1" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Caută cartea</label
              >
              <div class="relative">
                <Icon
                  name="heroicons:magnifying-glass"
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="ex: Crimă și pedeapsă"
                  class="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
                  @input="onSearchInput"
                  @blur="closeDropdown"
                />
                <button
                  v-if="searchQuery"
                  type="button"
                  @click="clearSearch"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <Icon name="heroicons:x-mark" class="w-4 h-4" />
                </button>
                <span
                  v-if="searching"
                  class="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-gray-400"
                  >Se caută...</span
                >
                <div
                  v-if="showDropdown"
                  class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                >
                  <button
                    v-for="item in searchResults"
                    :key="item.id"
                    type="button"
                    class="w-full flex items-center gap-3 px-4 py-3 hover:bg-sage-50 text-left transition"
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
                    class="w-full h-full object-contain"
                  />
                  <Icon
                    v-else
                    name="heroicons:photo"
                    class="w-8 h-8 text-gray-300"
                  />
                </div>
                <div class="flex-1 pt-2">
                  <label
                    class="cursor-pointer inline-flex items-center gap-2 text-sm text-sage-600 hover:text-sage-700 font-medium transition"
                  >
                    <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" />
                    <span v-if="uploading">Se încarcă...</span>
                    <span v-else>{{
                      imagePreview ? "Schimbă imaginea" : "Alege imagine"
                    }}</span>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleImageChange"
                      :disabled="uploading"
                    />
                  </label>
                  <p class="mt-1 text-xs text-gray-400">
                    JPG, PNG, WebP — max 5MB
                  </p>
                  <p v-if="uploadError" class="mt-1 text-xs text-red-500">
                    {{ uploadError }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-show="currentStep === 2" class="space-y-5">
            <div
              v-if="isDuplicate"
              class="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700"
            >
              <Icon
                name="heroicons:exclamation-triangle"
                class="w-4 h-4 shrink-0 mt-0.5"
              />
              <span
                >Ai deja această carte în lista ta. Poți continua, dar vei avea
                duplicate.</span
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Titlu <span class="text-red-400">*</span></label
              >
              <input
                v-model="form.title"
                type="text"
                placeholder="ex: Crimă și pedeapsă"
                class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Autor <span class="text-red-400">*</span></label
              >
              <input
                v-model="form.author"
                type="text"
                placeholder="ex: Dostoievski"
                class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Gen <span class="text-red-400">*</span></label
              >
              <select
                v-model="form.genre"
                class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition bg-white"
              >
                <option value="">Selectează genul</option>
                <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
          </div>

          <div v-show="currentStep === 3" class="space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >An publicare <span class="text-red-400">*</span></label
                >
                <input
                  v-model.number="form.publishedYear"
                  type="number"
                  placeholder="ex: 1866"
                  min="1000"
                  max="2099"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Nr. pagini <span class="text-red-400">*</span></label
                >
                <input
                  v-model.number="form.pageCount"
                  type="number"
                  placeholder="ex: 671"
                  min="1"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Descriere <span class="text-red-400">*</span></label
              >
              <textarea
                v-model="form.description"
                rows="6"
                placeholder="Câteva cuvinte despre carte..."
                class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition resize-none"
              />
            </div>
          </div>

          <div
            v-if="error"
            class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
          >
            {{ error }}
          </div>

          <div
            class="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-50"
          >
            <button
              v-if="showDelete"
              type="button"
              @click="emit('delete')"
              class="sm:order-first px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium rounded-xl transition"
            >
              Șterge
            </button>

            <button
              type="button"
              @click="handleCancel"
              class="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition"
            >
              Anulează
            </button>

            <div class="flex-1 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                v-if="currentStep > 1"
                type="button"
                @click="prevStep"
                class="px-5 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-xl transition"
              >
                ← Înapoi
              </button>

              <button
                v-if="currentStep < 3"
                type="button"
                @click="nextStep"
                class="px-5 py-2.5 bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium rounded-xl transition"
              >
                Continuă →
              </button>

              <button
                v-else
                type="button"
                @click="handleSubmit"
                :disabled="loading || uploading"
                class="px-5 py-2.5 bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
              >
                <span v-if="loading">Se salvează...</span>
                <span v-else>{{ submitLabel ?? "Salvează" }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="hidden lg:block lg:col-span-1 lg:col-start-3 order-1 lg:order-2"
      >
        <p
          class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3"
        >
          Previzualizare
        </p>
        <div
          class="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm max-w-[220px]"
        >
          <div class="relative bg-cream-100">
            <img
              v-if="imagePreview"
              :src="imagePreview"
              class="w-full h-auto block"
            />
            <div v-else class="aspect-[2/3] flex items-center justify-center">
              <Icon name="heroicons:photo" class="w-16 h-16 text-cream-300" />
            </div>
            <div
              class="absolute bottom-0 inset-x-0 py-1.5 text-center text-xs font-semibold bg-sage-500/90 text-white"
            >
              ✓ Disponibilă
            </div>
          </div>
          <div class="p-3 space-y-1">
            <h3
              class="font-heading font-semibold text-gray-900 text-sm leading-tight line-clamp-2"
            >
              {{ form.title || "Titlul cărții" }}
            </h3>
            <p class="text-xs text-gray-500">{{ form.author || "Autor" }}</p>
            <div class="flex items-center gap-2 flex-wrap pt-1">
              <span
                v-if="form.genre"
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="genreClass(form.genre)"
              >
                {{ form.genre }}
              </span>
              <span
                v-if="form.publishedYear"
                class="text-xs text-gray-600 bg-cream-100 px-2 py-0.5 rounded-full"
              >
                {{ form.publishedYear }}
              </span>
              <span
                v-if="form.pageCount"
                class="text-xs text-gray-600 bg-cream-100 px-2 py-0.5 rounded-full"
              >
                {{ form.pageCount }} pag.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showCancelConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="showCancelConfirm = false"
        />
        <div
          class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0"
            >
              <Icon
                name="heroicons:exclamation-triangle"
                class="w-5 h-5 text-amber-600"
              />
            </div>
            <div>
              <p class="font-semibold text-gray-900 text-sm">
                O clipă, dragă...
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                Sigur doriți să plecați? Pagina va pierde toate datele pe care
                le-ați introdus cu grijă.
              </p>
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button
              @click="showCancelConfirm = false"
              class="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Rămân pe pagină
            </button>
            <button
              @click="emit('cancel')"
              class="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition"
            >
              Da, plec
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
