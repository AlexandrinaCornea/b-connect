<script setup lang="ts">
const route = useRoute();
const { data: session } = useAuth();
const id = route.params.id as string;

const { data: book, pending, error } = await useFetch(`/api/books/${id}`);

const requesting = ref(false);
const requestError = ref("");
const requestSuccess = ref(false);

const isOwner = computed(
  () => (session.value?.user as any)?.id === book.value?.ownerId,
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

async function requestLoan() {
  if (!session.value) return navigateTo("/auth/login");
  requesting.value = true;
  requestError.value = "";
  try {
    await $fetch("/api/loans", {
      method: "POST",
      body: { bookId: id },
    });
    requestSuccess.value = true;
  } catch (err: any) {
    requestError.value = err?.data?.message || "A apărut o eroare.";
  } finally {
    requesting.value = false;
  }
}
</script>

<template>
  <div>
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
        <div
          class="rounded-xl overflow-hidden bg-gray-50 aspect-[3/4] flex items-center justify-center"
        >
          <img
            v-if="book.imageUrl"
            :src="book.imageUrl"
            :alt="book.title"
            class="w-full h-full object-cover"
          />
          <Icon
            v-else
            name="heroicons:book-open"
            class="w-20 h-20 text-gray-200"
          />
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
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                "
              >
                {{
                  book.status === "available" ? "Disponibilă" : "Împrumutată"
                }}
              </span>
            </div>
          </div>
          <p class="text-gray-600">{{ book.author }}</p>
          <span
            v-if="book.genre"
            class="inline-block mt-2 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full"
          >
            {{ book.genre }}
          </span>
        </div>

        <p
          v-if="book.description"
          class="text-gray-600 text-sm leading-relaxed"
        >
          {{ book.description }}
        </p>

        <NuxtLink
          :to="`/users/${book.owner?.id}`"
          class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
        >
          <div
            class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold"
          >
            {{ book.owner?.name?.charAt(0).toUpperCase() }}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">
              {{ book.owner?.name }}
            </p>
            <p v-if="book.owner?.city" class="text-xs text-gray-500">
              {{ book.owner.city }}
            </p>
          </div>
          <Icon
            name="heroicons:chevron-right"
            class="w-4 h-4 text-gray-400 ml-auto"
          />
        </NuxtLink>

        <div v-if="!isOwner">
          <div
            v-if="requestSuccess"
            class="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700"
          >
            <Icon name="heroicons:check-circle" class="w-4 h-4 inline mr-1" />
            Cererea de împrumut a fost trimisă!
          </div>
          <div v-else>
            <div
              v-if="requestError"
              class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
            >
              {{ requestError }}
            </div>

            <div v-if="!session" class="space-y-2">
              <NuxtLink
                to="/auth/login"
                class="block w-full py-3 px-4 text-center font-medium rounded-xl transition text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Autentifică-te pentru a solicita împrumut
              </NuxtLink>
            </div>

            <button
              v-else
              :disabled="book.status !== 'available' || requesting"
              @click="requestLoan"
              class="w-full py-3 px-4 font-medium rounded-xl transition text-sm"
              :class="
                book.status === 'available'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              "
            >
              <span v-if="requesting">Se trimite cererea...</span>
              <span v-else-if="book.status !== 'available'"
                >Carte indisponibilă</span
              >
              <span v-else>Solicită împrumut</span>
            </button>
          </div>
        </div>

        <div v-else class="flex gap-3">
          <NuxtLink
            :to="`/books/${id}/edit`"
            class="flex-1 text-center py-2.5 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition"
          >
            Editează
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
