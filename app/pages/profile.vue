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
const activeTab = ref<"favorite" | "carti">("carti");
const PAGE_SIZE = 6;
const cartiPage = ref(0);
const favPage = ref(0);

watch(activeTab, () => {
  cartiPage.value = 0;
  favPage.value = 0;
});

const cartiPaged = computed(() => {
  const all = myBooks.value ?? [];
  return all.slice(
    cartiPage.value * PAGE_SIZE,
    (cartiPage.value + 1) * PAGE_SIZE,
  );
});
const cartiTotal = computed(() =>
  Math.ceil((myBooks.value?.length ?? 0) / PAGE_SIZE),
);

const favsPaged = computed(() => {
  const all = (favs.value as any[]) ?? [];
  return all.slice(favPage.value * PAGE_SIZE, (favPage.value + 1) * PAGE_SIZE);
});
const favsTotal = computed(() =>
  Math.ceil(((favs.value as any[])?.length ?? 0) / PAGE_SIZE),
);

const form = reactive({ name: "", city: "", bio: "" });

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
    await $fetch(`/api/users/${userId.value}`, { method: "PUT", body: form });
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
    .map((f: any) =>
      f.requesterId === userId.value ? f.addressee : f.requester,
    );
});

const FRIENDS_PAGE_SIZE = 3;
const friendsPage = ref(0);
const friendsPaged = computed(() =>
  friends.value.slice(
    friendsPage.value * FRIENDS_PAGE_SIZE,
    (friendsPage.value + 1) * FRIENDS_PAGE_SIZE,
  ),
);
const friendsTotal = computed(() =>
  Math.ceil(friends.value.length / FRIENDS_PAGE_SIZE),
);

const { data: myReviews } = await useFetch(
  computed(() => `/api/reviews/${userId.value}`),
);

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
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Profilul meu</h1>

    <div class="grid grid-cols-1 md:grid-cols-[1.4fr_3fr_1.4fr] gap-5">
      <UserProfileCard
        :profile="profile as any"
        :friends-count="friends.length"
      >
        <button
          v-if="!editing"
          @click="editing = true"
          class="w-full py-2 text-sm border border-cream-300 text-gray-600 hover:bg-cream-50 rounded-xl transition"
        >
          Editează profilul
        </button>

        <form v-else @submit.prevent="saveProfile" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >Nume</label
            >
            <input
              v-model="form.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >Localitate</label
            >
            <input
              v-model="form.city"
              type="text"
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >Bio</label
            >
            <textarea
              v-model="form.bio"
              rows="3"
              placeholder="Câteva cuvinte despre tine..."
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition resize-none"
            />
          </div>
          <div
            v-if="saveError"
            class="p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600"
          >
            {{ saveError }}
          </div>
          <div class="flex gap-2">
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 py-2 bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white text-xs font-medium rounded-xl transition"
            >
              {{ saving ? "Se salvează..." : "Salvează" }}
            </button>
            <button
              type="button"
              @click="editing = false"
              class="flex-1 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs rounded-xl transition"
            >
              Anulează
            </button>
          </div>
        </form>
      </UserProfileCard>

      <div
        class="bg-white border border-cream-200 rounded-2xl shadow-sm overflow-hidden"
      >
        <div class="flex border-b border-gray-100">
          <button
            @click="activeTab = 'carti'"
            class="flex-1 py-3 text-sm font-medium transition"
            :class="
              activeTab === 'carti'
                ? 'text-sage-600 border-b-2 border-sage-500'
                : 'text-gray-500 hover:text-gray-700'
            "
          >
            Cărțile mele ({{ myBooks?.length ?? 0 }})
          </button>
          <button
            @click="activeTab = 'favorite'"
            class="flex-1 py-3 text-sm font-medium transition"
            :class="
              activeTab === 'favorite'
                ? 'text-sage-600 border-b-2 border-sage-500'
                : 'text-gray-500 hover:text-gray-700'
            "
          >
            Favorite ({{ (favs as any[])?.length ?? 0 }})
          </button>
        </div>

        <div class="p-4">
          <template v-if="activeTab === 'carti'">
            <div class="flex justify-end mb-3">
              <NuxtLink
                to="/books/new"
                class="text-xs font-medium text-sage-600 hover:text-sage-700 flex items-center gap-1"
              >
                <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
                Adaugă
              </NuxtLink>
            </div>

            <div v-if="!myBooks?.length" class="text-center py-10">
              <Icon
                name="heroicons:book-open"
                class="w-9 h-9 text-cream-300 mx-auto mb-2"
              />
              <p class="text-xs text-gray-500">
                Nu ai adăugat nicio carte încă.
              </p>
              <NuxtLink
                to="/books/new"
                class="mt-1 inline-block text-xs text-sage-600 hover:underline"
                >Adaugă prima carte</NuxtLink
              >
            </div>

            <div v-else>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <BookCard
                  v-for="book in cartiPaged"
                  :key="book.id"
                  :book="book"
                />
              </div>
              <div
                v-if="cartiTotal > 1"
                class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100"
              >
                <button
                  @click="cartiPage--"
                  :disabled="cartiPage === 0"
                  class="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition flex items-center gap-1"
                >
                  <Icon name="heroicons:chevron-left" class="w-3.5 h-3.5" />
                  Înapoi
                </button>
                <span class="text-xs text-gray-400"
                  >{{ cartiPage + 1 }} / {{ cartiTotal }}</span
                >
                <button
                  @click="cartiPage++"
                  :disabled="cartiPage >= cartiTotal - 1"
                  class="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition flex items-center gap-1"
                >
                  Înainte
                  <Icon name="heroicons:chevron-right" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <div v-if="!(favs as any[])?.length" class="text-center py-10">
              <Icon
                name="heroicons:heart"
                class="w-9 h-9 text-cream-300 mx-auto mb-2"
              />
              <p class="text-xs text-gray-500">
                Nu ai cărți salvate la favorite.
              </p>
              <NuxtLink
                to="/books"
                class="mt-1 inline-block text-xs text-sage-600 hover:underline"
                >Explorează cărți</NuxtLink
              >
            </div>

            <div v-else>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div
                  v-for="fav in favsPaged"
                  :key="fav.id"
                  class="relative group"
                >
                  <BookCard :book="fav.book" />
                  <button
                    @click="removeFavorite(fav.book.id)"
                    class="absolute top-1.5 right-1.5 z-10 p-1 bg-white/80 text-red-300 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <Icon name="heroicons:x-mark" class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div
                v-if="favsTotal > 1"
                class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100"
              >
                <button
                  @click="favPage--"
                  :disabled="favPage === 0"
                  class="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition flex items-center gap-1"
                >
                  <Icon name="heroicons:chevron-left" class="w-3.5 h-3.5" />
                  Înapoi
                </button>
                <span class="text-xs text-gray-400"
                  >{{ favPage + 1 }} / {{ favsTotal }}</span
                >
                <button
                  @click="favPage++"
                  :disabled="favPage >= favsTotal - 1"
                  class="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition flex items-center gap-1"
                >
                  Înainte
                  <Icon name="heroicons:chevron-right" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="space-y-5">
        <div
          v-if="pendingRequests.length > 0"
          class="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm"
        >
          <h2
            class="text-sm font-bold text-[#1a2b3d] mb-3 flex items-center gap-2"
          >
            Cereri
            <span
              class="text-xs font-medium text-sage-600 bg-sage-50 px-2 py-0.5 rounded-full"
              >{{ pendingRequests.length }}</span
            >
          </h2>
          <div class="space-y-3">
            <div v-for="req in pendingRequests" :key="req.id" class="space-y-2">
              <div class="flex items-center gap-2 min-w-0">
                <UserAvatar :name="req.requester.name" size="sm" />
                <NuxtLink
                  :to="`/users/${req.requester.id}`"
                  class="text-xs font-medium text-gray-900 hover:underline truncate"
                >
                  {{ req.requester.name }}
                </NuxtLink>
              </div>
              <div class="flex gap-1.5">
                <button
                  @click="respondFriendRequest(req.id, 'accepted')"
                  class="flex-1 py-1 text-xs bg-sage-500 hover:bg-sage-600 text-white rounded-lg transition"
                >
                  Acceptă
                </button>
                <button
                  @click="respondFriendRequest(req.id, 'rejected')"
                  class="flex-1 py-1 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                >
                  Respinge
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
          <h2 class="text-sm font-bold text-[#1a2b3d] mb-3">
            Prieteni ({{ friends.length }})
          </h2>

          <div v-if="!friends.length" class="text-center py-8">
            <Icon
              name="heroicons:user-group"
              class="w-9 h-9 text-cream-300 mx-auto mb-2"
            />
            <p class="text-xs text-gray-500">Nu ai prieteni adăugați încă.</p>
            <NuxtLink
              to="/books"
              class="mt-1 inline-block text-xs text-sage-600 hover:underline"
              >Explorează prin cărți</NuxtLink
            >
          </div>

          <div v-else>
            <div class="space-y-1">
              <NuxtLink
                v-for="friend in friendsPaged"
                :key="friend.id"
                :to="`/users/${friend.id}`"
                class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-cream-50 transition"
              >
                <UserAvatar :name="friend.name" size="sm" />
                <div class="min-w-0">
                  <p class="text-xs font-medium text-gray-900 truncate">
                    {{ friend.name }}
                  </p>
                  <p v-if="friend.city" class="text-xs text-gray-400 truncate">
                    {{ friend.city }}
                  </p>
                </div>
              </NuxtLink>
            </div>
            <div
              v-if="friendsTotal > 1"
              class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100"
            >
              <button
                @click="friendsPage--"
                :disabled="friendsPage === 0"
                class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition"
              >
                <Icon name="heroicons:chevron-left" class="w-4 h-4" />
              </button>
              <span class="text-xs text-gray-400"
                >{{ friendsPage + 1 }} / {{ friendsTotal }}</span
              >
              <button
                @click="friendsPage++"
                :disabled="friendsPage >= friendsTotal - 1"
                class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition"
              >
                <Icon name="heroicons:chevron-right" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="(myReviews as any[])?.length"
          class="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm"
        >
          <h2 class="text-sm font-bold text-[#1a2b3d] mb-3">
            Recenzii ({{ (myReviews as any[]).length }})
          </h2>
          <div class="space-y-3">
            <div
              v-for="rev in myReviews as any[]"
              :key="rev.id"
              class="pb-3 border-b border-gray-50 last:border-0 last:pb-0"
            >
              <div class="flex items-center gap-2 mb-1">
                <UserAvatar :name="rev.reviewer?.name" size="xs" />
                <span class="text-xs font-medium text-gray-900">{{
                  rev.reviewer?.name
                }}</span>
                <StarRating :rating="rev.rating" class="ml-auto" />
              </div>
              <p
                v-if="rev.comment"
                class="text-xs text-gray-500 leading-relaxed"
              >
                {{ rev.comment }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
