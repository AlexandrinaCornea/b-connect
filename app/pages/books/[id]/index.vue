<script setup lang="ts">
const { genreClass } = useGenreColor();
const route = useRoute();
const { data: session } = useAuth();
const id = route.params.id as string;

const { data: book, pending, error } = await useFetch(`/api/books/${id}`);

const requesting = ref(false);
const requestError = ref("");
const requestSuccess = ref(false);
const showToast = ref(false);

const isOwner = computed(
  () => (session.value?.user as any)?.id === (book.value as any)?.ownerId,
);

const isFavorite = ref(false);
const favLoading = ref(false);

if (session.value) {
  const { data: favCheck } = await useFetch("/api/favorites/check", {
    query: { bookId: id },
  });
  isFavorite.value = (favCheck.value as any)?.isFavorite ?? false;
}

async function toggleFavorite() {
  if (!session.value) return navigateTo("/auth/login");
  favLoading.value = true;
  try {
    if (isFavorite.value) {
      await $fetch(`/api/favorites/${id}`, { method: "DELETE" });
      isFavorite.value = false;
    } else {
      await $fetch("/api/favorites", { method: "POST", body: { bookId: id } });
      isFavorite.value = true;
    }
  } finally {
    favLoading.value = false;
  }
}

const showLoanForm = ref(false);
const loanStartDate = ref("");
const loanDueDate = ref("");
const loanMessage = ref("");

const today = new Date().toISOString().split("T")[0];

const loanDays = computed(() => {
  if (!loanStartDate.value || !loanDueDate.value) return 0;
  const diff =
    new Date(loanDueDate.value).getTime() -
    new Date(loanStartDate.value).getTime();
  return Math.round(diff / 86400000);
});

const dueDateMin = computed(() => {
  if (!loanStartDate.value) return today;
  const d = new Date(loanStartDate.value);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
});

function setDuration(days: number) {
  if (!loanStartDate.value) loanStartDate.value = today;
  const d = new Date(loanStartDate.value);
  d.setDate(d.getDate() + days);
  loanDueDate.value = d.toISOString().split("T")[0];
}

const ownerRating = computed(() => {
  const owner = (book.value as any)?.owner;
  if (!owner?.ratingCount || owner.ratingCount === 0) return null;
  return Math.round((owner.ratingSum / owner.ratingCount) * 10) / 10;
});

async function requestLoan() {
  if (!session.value) return navigateTo("/auth/login");
  if (!loanStartDate.value || !loanDueDate.value) {
    requestError.value = "Completează datele de început și returnare.";
    return;
  }
  if (loanStartDate.value < today) {
    requestError.value = "Data de început nu poate fi în trecut.";
    return;
  }
  if (loanDueDate.value <= loanStartDate.value) {
    requestError.value = "Data returnare trebuie să fie după data de început.";
    return;
  }
  requesting.value = true;
  requestError.value = "";
  try {
    await $fetch("/api/loans", {
      method: "POST",
      body: {
        bookId: id,
        startDate: loanStartDate.value,
        dueDate: loanDueDate.value,
        message: loanMessage.value || undefined,
      },
    });
    requestSuccess.value = true;
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
      navigateTo("/loans");
    }, 2500);
  } catch (err: any) {
    requestError.value = err?.data?.message || "A apărut o eroare.";
  } finally {
    requesting.value = false;
  }
}
</script>

<template>
  <div>
    <Transition name="toast">
      <div
        v-if="showToast"
        class="fixed top-6 right-6 z-50 flex items-center gap-3 bg-sage-500 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium"
      >
        <Icon name="heroicons:check-circle" class="w-5 h-5 shrink-0" />
        Cererea a fost trimisă! Te redirecționăm...
      </div>
    </Transition>

    <NuxtLink
      to="/books"
      class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
    >
      <Icon name="heroicons:arrow-left" class="w-4 h-4" />
      Înapoi la cărți
    </NuxtLink>

    <div v-if="pending" class="animate-pulse space-y-4">
      <div class="h-8 bg-gray-100 rounded w-1/2" />
      <div class="h-64 bg-gray-100 rounded-xl" />
    </div>

    <div v-else-if="error" class="text-center py-20">
      <p class="text-gray-500">Cartea nu a fost găsită.</p>
    </div>

    <div v-else-if="book" class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="md:col-span-1">
        <div class="rounded-xl overflow-hidden bg-cream-100">
          <img
            v-if="book.imageUrl"
            :src="book.imageUrl"
            :alt="book.title"
            class="w-full h-auto block"
          />
          <div v-else class="aspect-[2/3] flex items-center justify-center">
            <Icon name="heroicons:book-open" class="w-20 h-20 text-gray-200" />
          </div>
        </div>
      </div>

      <div class="md:col-span-2 space-y-6">
        <div>
          <div class="flex items-start justify-between gap-4 mb-2">
            <h1 class="text-2xl font-bold text-gray-900">{{ book.title }}</h1>
            <div class="flex items-center gap-2 shrink-0">
              <button
                @click="toggleFavorite"
                :disabled="favLoading"
                class="p-2 rounded-lg border transition"
                :class="
                  isFavorite
                    ? 'border-red-200 bg-red-50 text-red-500'
                    : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'
                "
                :title="
                  isFavorite ? 'Elimină din favorite' : 'Adaugă la favorite'
                "
              >
                <Icon
                  :name="
                    isFavorite ? 'heroicons:heart-solid' : 'heroicons:heart'
                  "
                  class="w-5 h-5"
                />
              </button>
              <span
                class="text-sm font-medium px-3 py-1 rounded-full"
                :class="
                  book.status === 'available'
                    ? 'bg-sage-100 text-sage-700'
                    : 'bg-warm-100 text-warm-600'
                "
              >
                {{
                  book.status === "available" ? "Disponibilă" : "Împrumutată"
                }}
              </span>
            </div>
          </div>
          <p class="text-gray-600">{{ book.author }}</p>
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            <span
              v-if="book.genre"
              class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="genreClass(book.genre)"
            >
              {{ book.genre }}
            </span>
            <span
              v-if="(book as any).publishedYear"
              class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full"
            >
              {{ (book as any).publishedYear }}
            </span>
            <span
              v-if="(book as any).pageCount"
              class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full"
            >
              {{ (book as any).pageCount }} pagini
            </span>
          </div>
        </div>

        <p
          v-if="book.description"
          class="text-gray-600 text-sm leading-relaxed"
        >
          {{ book.description }}
        </p>

        <NuxtLink
          v-if="!isOwner"
          :to="`/users/${book.owner?.id}`"
          class="flex items-center gap-4 p-4 bg-cream-50 border border-cream-200 rounded-xl hover:bg-cream-100 transition"
        >
          <UserAvatar :name="book.owner?.name" size="md" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900">
              {{ book.owner?.name }}
            </p>
            <div class="flex items-center gap-3 mt-0.5 flex-wrap">
              <span
                v-if="book.owner?.city"
                class="flex items-center gap-1 text-xs text-gray-500"
              >
                <Icon name="heroicons:map-pin" class="w-3 h-3" />
                {{ book.owner.city }}
              </span>
              <span
                v-if="ownerRating"
                class="flex items-center gap-1 text-xs text-amber-500 font-medium"
              >
                <Icon name="heroicons:star-solid" class="w-3 h-3" />
                {{ ownerRating }} rating
              </span>
              <span v-else class="text-xs text-gray-400"
                >Nicio recenzie încă</span
              >
            </div>
          </div>
          <span class="text-xs text-sage-600 font-medium shrink-0"
            >Mergi la profil →</span
          >
        </NuxtLink>

        <div v-if="!isOwner">
          <div
            v-if="requestSuccess"
            class="p-5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 space-y-1"
          >
            <p class="font-semibold flex items-center gap-2">
              <Icon name="heroicons:check-circle" class="w-5 h-5" />
              Cererea a fost trimisă!
            </p>
            <p class="text-green-600">
              Proprietarul va fi notificat și îți va răspunde în curând. Te
              redirecționăm la Împrumuturi...
            </p>
          </div>
          <div v-else>
            <div
              v-if="requestError"
              class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
            >
              {{ requestError }}
            </div>
            <div v-if="!session">
              <NuxtLink
                to="/auth/login"
                class="block w-full py-3 px-4 text-center font-medium rounded-xl transition text-sm bg-sage-500 hover:bg-sage-600 text-white"
              >
                Autentifică-te pentru a solicita împrumut
              </NuxtLink>
            </div>
            <div
              v-else-if="book.status !== 'available'"
              class="w-full py-3 px-4 font-medium rounded-xl text-sm text-center bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              Carte indisponibilă momentan
            </div>
            <div v-else>
              <button
                v-if="!showLoanForm"
                @click="showLoanForm = true"
                class="w-full py-3 px-4 font-medium rounded-xl transition text-sm bg-sage-500 hover:bg-sage-600 text-white"
              >
                Solicită împrumut
              </button>
              <Teleport to="body">
                <Transition name="modal">
                  <div
                    v-if="showLoanForm"
                    class="fixed inset-0 z-50 flex items-center justify-center p-4"
                  >
                    <div
                      class="absolute inset-0 bg-black/40 backdrop-blur-sm"
                      @click="showLoanForm = false"
                    />
                    <div
                      class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
                    >
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-semibold text-gray-800">
                          Detalii împrumut
                        </p>
                        <button
                          @click="showLoanForm = false"
                          class="text-gray-400 hover:text-gray-600 transition"
                        >
                          <Icon name="heroicons:x-mark" class="w-5 h-5" />
                        </button>
                      </div>

                      <div
                        class="flex gap-2 p-3 bg-sage-50 border border-sage-100 rounded-lg text-xs text-sage-700"
                      >
                        <Icon
                          name="heroicons:information-circle"
                          class="w-4 h-4 shrink-0 mt-0.5"
                        />
                        <span
                          >După trimitere, proprietarul primește o notificare și
                          poate accepta sau respinge cererea. Vei vedea statusul
                          în <strong>Împrumuturi mele</strong>.</span
                        >
                      </div>

                      <div>
                        <p class="text-xs text-gray-500 mb-2">
                          Durate sugerate
                        </p>
                        <div class="flex gap-2">
                          <button
                            v-for="d in [7, 14, 30]"
                            :key="d"
                            type="button"
                            @click="setDuration(d)"
                            class="flex-1 py-1.5 text-xs font-medium border rounded-lg transition"
                            :class="
                              loanDays === d
                                ? 'bg-sage-500 border-sage-500 text-white'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            "
                          >
                            {{ d }} zile
                          </button>
                        </div>
                      </div>

                      <div class="space-y-3">
                        <div>
                          <label class="text-xs text-gray-500 mb-1 block"
                            >Data început</label
                          >
                          <DateInput v-model="loanStartDate" :min="today" />
                        </div>
                        <div>
                          <label class="text-xs text-gray-500 mb-1 block"
                            >Data returnare</label
                          >
                          <DateInput v-model="loanDueDate" :min="dueDateMin" />
                        </div>
                      </div>

                      <div
                        v-if="loanDays > 30"
                        class="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"
                      >
                        <Icon
                          name="heroicons:exclamation-triangle"
                          class="w-4 h-4 shrink-0 mt-0.5"
                        />
                        <span
                          >Durata de <strong>{{ loanDays }} zile</strong> este
                          mai lungă decât de obicei. Asigură-te că proprietarul
                          este de acord.</span
                        >
                      </div>

                      <div
                        v-if="requestError"
                        class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600"
                      >
                        {{ requestError }}
                      </div>

                      <div>
                        <label class="text-xs text-gray-500 mb-1 block"
                          >Mesaj pentru proprietar
                          <span class="text-gray-400">(opțional)</span></label
                        >
                        <textarea
                          v-model="loanMessage"
                          rows="2"
                          placeholder="Ex: Pot ridica cartea marți după ora 17..."
                          class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 resize-none"
                        />
                      </div>

                      <div
                        class="flex gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 border-t border-gray-100"
                      >
                        <Icon
                          name="heroicons:shield-check"
                          class="w-4 h-4 shrink-0 text-sage-500 mt-0.5"
                        />
                        <span
                          >Cartea trebuie returnată în aceeași stare. Detaliile
                          de ridicare sau expediere se stabilesc cu proprietarul
                          prin mesaje.</span
                        >
                      </div>

                      <div class="flex gap-2">
                        <button
                          @click="showLoanForm = false"
                          class="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition"
                        >
                          Anulează
                        </button>
                        <button
                          @click="requestLoan"
                          :disabled="
                            requesting || !loanStartDate || !loanDueDate
                          "
                          class="flex-1 py-2.5 bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
                        >
                          <span v-if="requesting">Se trimite...</span>
                          <span v-else>Trimite cererea</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Transition>
              </Teleport>
            </div>
          </div>
        </div>

        <div v-else class="flex gap-3">
          <NuxtLink
            :to="`/books/${id}/edit`"
            class="flex-1 text-center py-2.5 bg-white border border-cream-300 text-sm font-medium text-gray-700 hover:bg-cream-100 rounded-xl transition shadow-sm"
          >
            Editează
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
