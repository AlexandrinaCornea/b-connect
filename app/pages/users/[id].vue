<script setup lang="ts">
const route = useRoute();
const { data: session } = useAuth();
const userId = route.params.id as string;

const { data: profile } = await useFetch(`/api/users/${userId}`);
const { data: friendsData, refresh: refreshFriends } =
  await useFetch("/api/friends");
const { data: userFriends } = await useFetch(`/api/users/${userId}/friends`);
const { data: userBooks } = await useFetch("/api/books", {
  query: computed(() => ({ ownerId: userId })),
});
const { data: userReviews } = await useFetch(`/api/reviews/${userId}`);
const { data: userFavs } = await useFetch(`/api/users/${userId}/favorites`);

const activeTab = ref<"carti" | "favorite" | "recenzii">("carti");
const PAGE_SIZE = 6;
const cartiPage = ref(0);
const favPage = ref(0);

const cartiPaged = computed(() => {
  const all = (userBooks.value as any[]) ?? [];
  return all.slice(
    cartiPage.value * PAGE_SIZE,
    (cartiPage.value + 1) * PAGE_SIZE,
  );
});
const cartiTotal = computed(() =>
  Math.ceil(((userBooks.value as any[])?.length ?? 0) / PAGE_SIZE),
);

const favsPaged = computed(() => {
  const all = (userFavs.value as any[]) ?? [];
  return all.slice(favPage.value * PAGE_SIZE, (favPage.value + 1) * PAGE_SIZE);
});
const favsTotal = computed(() =>
  Math.ceil(((userFavs.value as any[])?.length ?? 0) / PAGE_SIZE),
);

watch(activeTab, () => {
  cartiPage.value = 0;
  favPage.value = 0;
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

const isSelf = computed(() => (session.value?.user as any)?.id === userId);

const friendStatus = computed(() => {
  if (!friendsData.value || !session.value) return null;
  const me = (session.value.user as any)?.id;
  return (
    (friendsData.value as any[]).find(
      (f: any) =>
        (f.requesterId === me && f.addresseeId === userId) ||
        (f.requesterId === userId && f.addresseeId === me),
    ) ?? null
  );
});

const friends = computed(() => (userFriends.value as any[]) ?? []);

const sendingRequest = ref(false);
const actionError = ref("");

async function sendFriendRequest() {
  sendingRequest.value = true;
  actionError.value = "";
  try {
    await $fetch("/api/friends", {
      method: "POST",
      body: { addresseeId: userId },
    });
    await refreshFriends();
  } catch (err: any) {
    actionError.value = err?.data?.message || "Eroare.";
  } finally {
    sendingRequest.value = false;
  }
}

async function respondFriendRequest(
  id: string,
  status: "accepted" | "rejected",
) {
  try {
    await $fetch(`/api/friends/${id}`, { method: "PUT", body: { status } });
    await refreshFriends();
  } catch (err: any) {
    actionError.value = err?.data?.message || "Eroare.";
  }
}

async function startChat() {
  const conv = await $fetch("/api/conversations", {
    method: "POST",
    body: { otherUserId: userId },
  });
  navigateTo(`/messages/${(conv as any).id}`);
}
</script>

<template>
  <div>
    <NuxtLink
      to="/books"
      class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition mb-6"
    >
      <Icon name="heroicons:arrow-left" class="w-4 h-4" />
      Înapoi
    </NuxtLink>

    <div
      v-if="profile"
      class="grid grid-cols-1 md:grid-cols-[1.4fr_3fr_1.4fr] gap-5"
    >
      <UserProfileCard :profile="profile as any">
        <div v-if="!isSelf && session" class="space-y-2">
          <template v-if="!friendStatus">
            <button
              @click="sendFriendRequest"
              :disabled="sendingRequest"
              class="w-full py-2 text-sm bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Icon name="heroicons:user-plus" class="w-4 h-4" />
              Adaugă prieten
            </button>
          </template>
          <template
            v-else-if="
              friendStatus.status === 'pending' &&
              friendStatus.addresseeId === (session?.user as any)?.id
            "
          >
            <div class="flex gap-2">
              <button
                @click="respondFriendRequest(friendStatus.id, 'accepted')"
                class="flex-1 py-2 text-xs bg-sage-500 hover:bg-sage-600 text-white rounded-xl transition"
              >
                Acceptă
              </button>
              <button
                @click="respondFriendRequest(friendStatus.id, 'rejected')"
                class="flex-1 py-2 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition"
              >
                Respinge
              </button>
            </div>
          </template>
          <template v-else-if="friendStatus.status === 'pending'">
            <div
              class="w-full py-2 text-sm text-center text-gray-400 border border-gray-100 rounded-xl"
            >
              Cerere trimisă
            </div>
          </template>
          <template v-else-if="friendStatus.status === 'accepted'">
            <div
              class="w-full py-2 text-sm text-center text-sage-600 border border-sage-100 bg-sage-50 rounded-xl flex items-center justify-center gap-1"
            >
              <Icon name="heroicons:check" class="w-4 h-4" /> Prieteni
            </div>
          </template>

          <button
            @click="startChat"
            class="w-full py-2 text-sm border border-cream-300 text-gray-600 hover:bg-cream-50 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Icon name="heroicons:chat-bubble-left" class="w-4 h-4" />
            Trimite mesaj
          </button>
        </div>

        <div
          v-if="actionError"
          class="mt-2 p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600"
        >
          {{ actionError }}
        </div>
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
            Cărți ({{ (userBooks as any[])?.length ?? 0 }})
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
            Favorite ({{ (userFavs as any[])?.length ?? 0 }})
          </button>
        </div>

        <div class="p-4">
          <template v-if="activeTab === 'carti'">
            <div v-if="!(userBooks as any[])?.length" class="text-center py-10">
              <Icon
                name="heroicons:book-open"
                class="w-9 h-9 text-cream-300 mx-auto mb-2"
              />
              <p class="text-xs text-gray-500">Nicio carte adăugată.</p>
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

          <template v-else-if="activeTab === 'favorite'">
            <div v-if="!(userFavs as any[])?.length" class="text-center py-10">
              <Icon
                name="heroicons:heart"
                class="w-9 h-9 text-cream-300 mx-auto mb-2"
              />
              <p class="text-xs text-gray-500">Nicio carte la favorite.</p>
            </div>
            <div v-else>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <BookCard
                  v-for="fav in favsPaged"
                  :key="fav.id"
                  :book="fav.book"
                />
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
        <div class="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
          <h2 class="text-sm font-bold text-[#1a2b3d] mb-3">
            Prieteni ({{ friends.length }})
          </h2>
          <div v-if="!friends.length" class="text-center py-8">
            <Icon
              name="heroicons:user-group"
              class="w-9 h-9 text-cream-300 mx-auto mb-2"
            />
            <p class="text-xs text-gray-400">Niciun prieten.</p>
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
          v-if="(userReviews as any[])?.length"
          class="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm"
        >
          <h2 class="text-sm font-bold text-[#1a2b3d] mb-3">
            Recenzii ({{ (userReviews as any[]).length }})
          </h2>
          <div class="space-y-3">
            <div
              v-for="rev in userReviews as any[]"
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
