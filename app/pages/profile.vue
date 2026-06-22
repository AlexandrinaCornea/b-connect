<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { data: session } = useAuth();
const userId = computed(() => (session.value?.user as any)?.id);

const { data: profile, refresh: refreshProfile } = await useFetch(
  computed(() => `/api/users/${userId.value}`),
);

const { data: myBooks } = await useFetch("/api/books/my");
const { data: friendsData, refresh: refreshFriends } =
  await useFetch("/api/friends");
const { data: favs, refresh: refreshFavs } = await useFetch("/api/favorites");

async function removeFavorite(bookId: string) {
  await $fetch(`/api/favorites/${bookId}`, { method: "DELETE" });
  await refreshFavs();
}

const editing = ref(false);
const saving = ref(false);
const saveError = ref("");

const form = reactive({
  name: "",
  city: "",
  bio: "",
});

watch(
  profile,
  (val) => {
    if (!val) return;
    form.name = val.name;
    form.city = val.city ?? "";
    form.bio = val.bio ?? "";
  },
  { immediate: true },
);

async function saveProfile() {
  saving.value = true;
  saveError.value = "";
  try {
    await $fetch(`/api/users/${userId.value}`, {
      method: "PUT",
      body: form,
    });
    await refreshProfile();
    editing.value = false;
  } catch (err: any) {
    saveError.value = err?.data?.message || "A apărut o eroare.";
  } finally {
    saving.value = false;
  }
}

const ratingAvg = computed(() => {
  if (!profile.value) return null;
  const { ratingSum, ratingCount } = profile.value;
  return ratingCount > 0
    ? Math.round((ratingSum / ratingCount) * 10) / 10
    : null;
});

const friends = computed(() => {
  if (!friendsData.value || !userId.value) return [];
  return (friendsData.value as any[])
    .filter((f: any) => f.status === "accepted")
    .map((f: any) => {
      const isRequester = f.requesterId === userId.value;
      return isRequester ? f.addressee : f.requester;
    });
});

const pendingRequests = computed(() => {
  if (!friendsData.value || !userId.value) return [];
  return (friendsData.value as any[]).filter(
    (f: any) => f.status === "pending" && f.addresseeId === userId.value,
  );
});

async function respondFriendRequest(
  id: string,
  status: "accepted" | "rejected",
) {
  await $fetch(`/api/friends/${id}`, { method: "PUT", body: { status } });
  await refreshFriends();
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="bg-white border border-gray-100 rounded-xl p-6">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl"
          >
            {{ profile?.name?.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">{{ profile?.name }}</h1>
            <p v-if="profile?.city" class="text-sm text-gray-500">
              {{ profile.city }}
            </p>
            <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span>{{ profile?.totalBooks ?? 0 }} cărți</span>
              <span v-if="ratingAvg" class="flex items-center gap-1">
                <Icon
                  name="heroicons:star-solid"
                  class="w-4 h-4 text-yellow-400"
                />
                {{ ratingAvg }}
              </span>
              <span>{{ friends.length }} prieteni</span>
            </div>
          </div>
        </div>
        <button
          @click="editing = !editing"
          class="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
        >
          {{ editing ? "Anulează" : "Editează" }}
        </button>
      </div>

      <p v-if="!editing && profile?.bio" class="text-sm text-gray-600">
        {{ profile.bio }}
      </p>

      <form
        v-if="editing"
        @submit.prevent="saveProfile"
        class="space-y-4 mt-4 pt-4 border-t border-gray-100"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Nume</label
          >
          <input
            v-model="form.name"
            type="text"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Localitate</label
          >
          <input
            v-model="form.city"
            type="text"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Bio</label
          >
          <textarea
            v-model="form.bio"
            rows="3"
            placeholder="Câteva cuvinte despre tine..."
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition resize-none"
          />
        </div>
        <div
          v-if="saveError"
          class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
        >
          {{ saveError }}
        </div>
        <button
          type="submit"
          :disabled="saving"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
        >
          <span v-if="saving">Se salvează...</span>
          <span v-else>Salvează</span>
        </button>
      </form>
    </div>

    <div v-if="pendingRequests.length > 0">
      <h2 class="text-lg font-semibold text-gray-900 mb-3">
        Cereri de prietenie
      </h2>
      <div class="space-y-2">
        <div
          v-for="req in pendingRequests"
          :key="req.id"
          class="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm"
            >
              {{ req.requester.name?.charAt(0).toUpperCase() }}
            </div>
            <NuxtLink
              :to="`/users/${req.requester.id}`"
              class="text-sm font-medium text-gray-900 hover:underline"
            >
              {{ req.requester.name }}
            </NuxtLink>
          </div>
          <div class="flex gap-2">
            <button
              @click="respondFriendRequest(req.id, 'accepted')"
              class="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
            >
              Acceptă
            </button>
            <button
              @click="respondFriendRequest(req.id, 'rejected')"
              class="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              Respinge
            </button>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-3">
        Prieteni ({{ friends.length }})
      </h2>
      <div
        v-if="!friends.length"
        class="text-center py-10 bg-white border border-gray-100 rounded-xl"
      >
        <Icon
          name="heroicons:user-group"
          class="w-10 h-10 text-gray-200 mx-auto mb-2"
        />
        <p class="text-sm text-gray-500">Nu ai prieteni adăugați încă.</p>
        <NuxtLink
          to="/books"
          class="mt-1 inline-block text-sm text-indigo-600 hover:underline"
          >Explorează utilizatori prin cărți</NuxtLink
        >
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NuxtLink
          v-for="friend in friends"
          :key="friend.id"
          :to="`/users/${friend.id}`"
          class="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:shadow-sm hover:border-gray-200 transition"
        >
          <div
            class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0"
          >
            {{ friend.name?.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ friend.name }}
            </p>
            <p v-if="friend.city" class="text-xs text-gray-500 truncate">
              {{ friend.city }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-3">
        Favorite ({{ (favs as any[])?.length ?? 0 }})
      </h2>

      <div
        v-if="!(favs as any[])?.length"
        class="text-center py-10 bg-white border border-gray-100 rounded-xl"
      >
        <Icon
          name="heroicons:heart"
          class="w-10 h-10 text-gray-200 mx-auto mb-2"
        />
        <p class="text-sm text-gray-500">Nu ai cărți salvate la favorite.</p>
        <NuxtLink
          to="/books"
          class="mt-1 inline-block text-sm text-indigo-600 hover:underline"
          >Explorează cărți</NuxtLink
        >
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="fav in favs as any[]"
          :key="fav.id"
          class="flex gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm hover:border-gray-200 transition group relative"
        >
          <NuxtLink
            :to="`/books/${fav.book.id}`"
            class="flex gap-3 flex-1 min-w-0"
          >
            <div
              class="w-12 h-16 rounded-lg bg-gray-50 overflow-hidden shrink-0"
            >
              <img
                v-if="fav.book.imageUrl"
                :src="fav.book.imageUrl"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
              >
                <Icon
                  name="heroicons:book-open"
                  class="w-5 h-5 text-gray-200"
                />
              </div>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ fav.book.title }}
              </p>
              <p class="text-xs text-gray-500">{{ fav.book.author }}</p>
              <span
                class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                :class="
                  fav.book.status === 'available'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                "
              >
                {{
                  fav.book.status === "available"
                    ? "Disponibilă"
                    : "Împrumutată"
                }}
              </span>
            </div>
          </NuxtLink>
          <button
            @click="removeFavorite(fav.book.id)"
            class="shrink-0 p-1 text-red-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
            title="Elimină din favorite"
          >
            <Icon name="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Cărțile mele</h2>
        <NuxtLink
          to="/books/new"
          class="text-sm text-indigo-600 hover:underline"
          >+ Adaugă</NuxtLink
        >
      </div>

      <div
        v-if="!myBooks?.length"
        class="text-center py-12 bg-white border border-gray-100 rounded-xl"
      >
        <Icon
          name="heroicons:book-open"
          class="w-10 h-10 text-gray-200 mx-auto mb-2"
        />
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
            <img
              v-if="book.imageUrl"
              :src="book.imageUrl"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:book-open" class="w-5 h-5 text-gray-200" />
            </div>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ book.title }}
            </p>
            <p class="text-xs text-gray-500">{{ book.author }}</p>
            <span
              class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
              :class="
                book.status === 'available'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              "
            >
              {{ book.status === "available" ? "Disponibilă" : "Împrumutată" }}
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
