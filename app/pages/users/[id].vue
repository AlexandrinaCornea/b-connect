<script setup lang="ts">
const route = useRoute();
const { data: session } = useAuth();
const userId = route.params.id as string;

const { data: profile } = await useFetch(`/api/users/${userId}`);
const { data: myBooks } = await useFetch("/api/books/my");

const { data: friendsData, refresh: refreshFriends } =
  await useFetch("/api/friends");

const friendStatus = computed(() => {
  if (!friendsData.value || !session.value) return null;
  const me = (session.value.user as any)?.id;
  const f = (friendsData.value as any[]).find(
    (f: any) =>
      (f.requesterId === me && f.addresseeId === userId) ||
      (f.requesterId === userId && f.addresseeId === me),
  );
  return f ?? null;
});

const isSelf = computed(() => (session.value?.user as any)?.id === userId);

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

const ratingAvg = computed(() => {
  if (!profile.value) return null;
  const { ratingSum, ratingCount } = profile.value as any;
  return ratingCount > 0
    ? Math.round((ratingSum / ratingCount) * 10) / 10
    : null;
});

const { data: userBooks } = await useFetch(`/api/books`, {
  query: computed(() => ({ ownerId: userId })),
});

const { data: userReviews } = await useFetch(`/api/reviews/${userId}`);

function starsFill(rating: number, star: number) {
  return star <= rating ? "text-amber-400" : "text-gray-200";
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <NuxtLink
      to="/books"
      class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
    >
      <Icon name="heroicons:arrow-left" class="w-4 h-4" />
      Înapoi
    </NuxtLink>

    <div v-if="profile" class="bg-white border border-gray-100 rounded-xl p-6">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl"
          >
            {{ (profile as any).name?.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">
              {{ (profile as any).name }}
            </h1>
            <p v-if="(profile as any).city" class="text-sm text-gray-500">
              {{ (profile as any).city }}
            </p>
            <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span>{{ (profile as any).totalBooks ?? 0 }} cărți</span>
              <span v-if="ratingAvg" class="flex items-center gap-1">
                <Icon
                  name="heroicons:star-solid"
                  class="w-4 h-4 text-yellow-400"
                />
                {{ ratingAvg }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="session && !isSelf" class="flex gap-2">
          <template v-if="!friendStatus">
            <button
              @click="sendFriendRequest"
              :disabled="sendingRequest"
              class="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-60"
            >
              <Icon name="heroicons:user-plus" class="w-4 h-4 inline mr-1" />
              Adaugă prieten
            </button>
          </template>
          <template
            v-else-if="
              friendStatus.status === 'pending' &&
              friendStatus.addresseeId === (session?.user as any)?.id
            "
          >
            <button
              @click="respondFriendRequest(friendStatus.id, 'accepted')"
              class="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              Acceptă
            </button>
            <button
              @click="respondFriendRequest(friendStatus.id, 'rejected')"
              class="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              Respinge
            </button>
          </template>
          <template v-else-if="friendStatus.status === 'pending'">
            <span
              class="px-3 py-1.5 text-sm text-gray-400 border border-gray-100 rounded-lg"
              >Cerere trimisă</span
            >
          </template>
          <template v-else-if="friendStatus.status === 'accepted'">
            <span
              class="px-3 py-1.5 text-sm text-green-600 border border-green-100 bg-green-50 rounded-lg"
            >
              <Icon
                name="heroicons:check"
                class="w-4 h-4 inline mr-1"
              />Prieteni
            </span>
          </template>

          <button
            @click="startChat"
            class="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
          >
            <Icon
              name="heroicons:chat-bubble-left"
              class="w-4 h-4 inline mr-1"
            />
            Mesaj
          </button>
        </div>
      </div>

      <p v-if="(profile as any).bio" class="text-sm text-gray-600 mt-4">
        {{ (profile as any).bio }}
      </p>

      <div
        v-if="actionError"
        class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
      >
        {{ actionError }}
      </div>
    </div>

    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        Cărțile lui {{ (profile as any)?.name }}
      </h2>

      <div
        v-if="!(userBooks as any[])?.length"
        class="text-center py-12 bg-white border border-gray-100 rounded-xl"
      >
        <Icon
          name="heroicons:book-open"
          class="w-10 h-10 text-gray-200 mx-auto mb-2"
        />
        <p class="text-sm text-gray-500">Nicio carte adăugată.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NuxtLink
          v-for="book in userBooks as any[]"
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

    <div v-if="(userReviews as any[])?.length">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Recenzii</h2>
      <div class="space-y-3">
        <div
          v-for="rev in userReviews as any[]"
          :key="rev.id"
          class="bg-white border border-gray-100 rounded-xl p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs shrink-0"
              >
                {{ rev.reviewer?.name?.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ rev.reviewer?.name }}
                </p>
                <div class="flex gap-0.5 mt-0.5">
                  <span
                    v-for="s in 5"
                    :key="s"
                    class="text-sm"
                    :class="starsFill(rev.rating, s)"
                    >★</span
                  >
                </div>
              </div>
            </div>
            <p class="text-xs text-gray-400 shrink-0">
              {{
                new Date(rev.createdAt).toLocaleDateString("ro-RO", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              }}
            </p>
          </div>
          <p v-if="rev.comment" class="text-sm text-gray-600 mt-2 ml-10">
            {{ rev.comment }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
