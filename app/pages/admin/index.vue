<script setup lang="ts">
definePageMeta({ middleware: "admin" });

const activeTab = ref<"books" | "users" | "loans">("users");

const { data: stats, refresh: refreshStats } =
  await useFetch("/api/admin/stats");
const { data: books, refresh: refreshBooks } =
  await useFetch("/api/admin/books");
const { data: adminUsers, refresh: refreshUsers } =
  await useFetch("/api/admin/users");
const { data: loans } = await useFetch("/api/admin/loans");

const searchBooks = ref("");
const searchUsers = ref("");
const searchLoans = ref("");

const filteredBooks = computed(() => {
  const q = searchBooks.value.toLowerCase();
  return ((books.value as any[]) ?? []).filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.owner?.name?.toLowerCase().includes(q),
  );
});

const filteredUsers = computed(() => {
  const q = searchUsers.value.toLowerCase();
  return ((adminUsers.value as any[]) ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );
});

const filteredLoans = computed(() => {
  const q = searchLoans.value.toLowerCase();
  return ((loans.value as any[]) ?? []).filter(
    (l) =>
      l.book?.title?.toLowerCase().includes(q) ||
      l.borrower?.name?.toLowerCase().includes(q) ||
      l.owner?.name?.toLowerCase().includes(q),
  );
});

const deleteError = ref("");
const actionError = ref("");

async function deleteBook(id: string, title: string) {
  if (!confirm(`Ștergi cartea "${title}"?`)) return;
  deleteError.value = "";
  try {
    await $fetch(`/api/admin/books/${id}`, { method: "DELETE" });
    await refreshBooks();
    await refreshStats();
  } catch (err: any) {
    deleteError.value = err?.data?.message || "Eroare la ștergere.";
  }
}

async function toggleRole(userId: string, currentRole: string) {
  const newRole = currentRole === "admin" ? "user" : "admin";
  actionError.value = "";
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: { role: newRole },
    });
    await refreshUsers();
  } catch (err: any) {
    actionError.value = err?.data?.message || "Eroare.";
  }
}

async function toggleBan(userId: string, currentBanned: boolean) {
  actionError.value = "";
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: { banned: !currentBanned },
    });
    await refreshUsers();
    await refreshStats();
  } catch (err: any) {
    actionError.value = err?.data?.message || "Eroare.";
  }
}

const statusLabel: Record<string, string> = {
  available: "Disponibilă",
  borrowed: "Împrumutată",
  pending: "În așteptare",
  accepted: "Acceptat",
  active: "Activ",
  returned: "Completat",
  rejected: "Respins",
  cancelled: "Anulat",
};

const statusClass: Record<string, string> = {
  available: "bg-sage-50 text-sage-700",
  borrowed: "bg-orange-50 text-orange-700",
  pending: "bg-yellow-50 text-yellow-700",
  accepted: "bg-sage-50 text-sage-700",
  active: "bg-blue-50 text-blue-700",
  returned: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
};

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <Icon name="heroicons:shield-check" class="w-7 h-7 text-sage-600" />
      <h1 class="text-2xl font-bold text-gray-900">Panou Admin</h1>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
        <p class="text-xs text-gray-400 mb-1">Utilizatori</p>
        <p class="text-3xl font-bold text-[#1a2b3d]">
          {{ (stats as any)?.totalUsers ?? 0 }}
        </p>
      </div>
      <div class="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
        <p class="text-xs text-gray-400 mb-1">Cărți</p>
        <p class="text-3xl font-bold text-[#1a2b3d]">
          {{ (stats as any)?.totalBooks ?? 0 }}
        </p>
      </div>
      <div class="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
        <p class="text-xs text-gray-400 mb-1">Împrumuturi active</p>
        <p class="text-3xl font-bold text-[#1a2b3d]">
          {{ (stats as any)?.activeLoans ?? 0 }}
        </p>
      </div>
      <div class="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
        <p class="text-xs text-gray-400 mb-1">Utilizatori blocați</p>
        <p class="text-3xl font-bold text-red-500">
          {{ (stats as any)?.bannedUsers ?? 0 }}
        </p>
      </div>
    </div>

    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      <button
        v-for="tab in [
          {
            key: 'users',
            label: 'Utilizatori',
            icon: 'heroicons:users',
            count: (adminUsers as any[])?.length ?? 0,
          },
          {
            key: 'books',
            label: 'Cărți',
            icon: 'heroicons:book-open',
            count: (books as any[])?.length ?? 0,
          },
          {
            key: 'loans',
            label: 'Împrumuturi',
            icon: 'heroicons:arrow-path-rounded-square',
            count: (loans as any[])?.length ?? 0,
          },
        ]"
        :key="tab.key"
        @click="activeTab = tab.key as any"
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition"
        :class="
          activeTab === tab.key
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
      >
        <Icon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
        <span
          class="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full"
          >{{ tab.count }}</span
        >
      </button>
    </div>

    <div v-if="activeTab === 'users'">
      <div
        v-if="actionError"
        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
      >
        {{ actionError }}
      </div>

      <div
        class="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm"
      >
        <div class="p-4 border-b border-gray-100">
          <div class="relative">
            <Icon
              name="heroicons:magnifying-glass"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              v-model="searchUsers"
              type="text"
              placeholder="Caută după nume sau email..."
              class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
            />
          </div>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Utilizator
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Email
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Localitate
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Status
              </th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="hover:bg-gray-50/50 transition"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <UserAvatar :name="user.name" size="sm" />
                  <NuxtLink
                    :to="`/users/${user.id}`"
                    class="font-medium text-gray-900 hover:underline"
                    >{{ user.name }}</NuxtLink
                  >
                </div>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ user.email }}</td>
              <td class="px-4 py-3 text-gray-500">{{ user.city ?? "—" }}</td>
              <td class="px-4 py-3">
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="
                    user.role === 'admin'
                      ? 'bg-sage-100 text-sage-700'
                      : 'bg-gray-100 text-gray-600'
                  "
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="
                    user.banned
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-700'
                  "
                >
                  {{ user.banned ? "Blocat" : "Activ" }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="toggleRole(user.id, user.role)"
                    class="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                  >
                    {{ user.role === "admin" ? "Retrogradează" : "Promovează" }}
                  </button>
                  <button
                    @click="toggleBan(user.id, user.banned)"
                    class="text-xs px-2.5 py-1 rounded-lg transition border"
                    :class="
                      user.banned
                        ? 'border-green-200 text-green-700 hover:bg-green-50'
                        : 'border-red-200 text-red-600 hover:bg-red-50'
                    "
                  >
                    {{ user.banned ? "Deblochează" : "Blochează" }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!filteredUsers.length"
          class="text-center py-10 text-sm text-gray-400"
        >
          {{ searchUsers ? "Niciun rezultat." : "Niciun utilizator." }}
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'books'">
      <div
        v-if="deleteError"
        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
      >
        {{ deleteError }}
      </div>

      <div
        class="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm"
      >
        <div class="p-4 border-b border-gray-100">
          <div class="relative">
            <Icon
              name="heroicons:magnifying-glass"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              v-model="searchBooks"
              type="text"
              placeholder="Caută după titlu, autor sau proprietar..."
              class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
            />
          </div>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Carte
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Proprietar
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Status
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Gen</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="book in filteredBooks"
              :key="book.id"
              class="hover:bg-gray-50/50 transition"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-11 rounded bg-cream-100 overflow-hidden shrink-0"
                  >
                    <img
                      v-if="book.imageUrl"
                      :src="book.imageUrl"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center"
                    >
                      <Icon
                        name="heroicons:book-open"
                        class="w-4 h-4 text-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 line-clamp-1">
                      {{ book.title }}
                    </p>
                    <p class="text-xs text-gray-400">{{ book.author }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <NuxtLink
                  :to="`/users/${book.owner.id}`"
                  class="text-sage-600 hover:underline"
                  >{{ book.owner.name }}</NuxtLink
                >
                <p class="text-xs text-gray-400">{{ book.owner.email }}</p>
              </td>
              <td class="px-4 py-3">
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="statusClass[book.status]"
                >
                  {{ statusLabel[book.status] }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ book.genre ?? "—" }}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink
                    :to="`/books/${book.id}`"
                    class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Icon name="heroicons:eye" class="w-4 h-4" />
                  </NuxtLink>
                  <button
                    @click="deleteBook(book.id, book.title)"
                    class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Icon name="heroicons:trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!filteredBooks.length"
          class="text-center py-10 text-sm text-gray-400"
        >
          {{ searchBooks ? "Niciun rezultat." : "Nicio carte în platformă." }}
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'loans'">
      <div
        class="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm"
      >
        <div class="p-4 border-b border-gray-100">
          <div class="relative">
            <Icon
              name="heroicons:magnifying-glass"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              v-model="searchLoans"
              type="text"
              placeholder="Caută după carte, împrumutător sau proprietar..."
              class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 transition"
            />
          </div>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Carte
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Împrumutător
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Proprietar
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Status
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                Data
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="loan in filteredLoans"
              :key="loan.id"
              class="hover:bg-gray-50/50 transition"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-11 rounded bg-cream-100 overflow-hidden shrink-0"
                  >
                    <img
                      v-if="loan.book?.imageUrl"
                      :src="loan.book.imageUrl"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center"
                    >
                      <Icon
                        name="heroicons:book-open"
                        class="w-4 h-4 text-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 line-clamp-1">
                      {{ loan.book?.title }}
                    </p>
                    <p class="text-xs text-gray-400">{{ loan.book?.author }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <NuxtLink
                  :to="`/users/${loan.borrower?.id}`"
                  class="text-sage-600 hover:underline"
                  >{{ loan.borrower?.name }}</NuxtLink
                >
                <p class="text-xs text-gray-400">{{ loan.borrower?.email }}</p>
              </td>
              <td class="px-4 py-3">
                <NuxtLink
                  :to="`/users/${loan.owner?.id}`"
                  class="text-sage-600 hover:underline"
                  >{{ loan.owner?.name }}</NuxtLink
                >
                <p class="text-xs text-gray-400">{{ loan.owner?.email }}</p>
              </td>
              <td class="px-4 py-3">
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="statusClass[loan.status]"
                >
                  {{ statusLabel[loan.status] }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">
                {{ formatDate(loan.requestedAt) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!filteredLoans.length"
          class="text-center py-10 text-sm text-gray-400"
        >
          {{ searchLoans ? "Niciun rezultat." : "Niciun împrumut." }}
        </div>
      </div>
    </div>
  </div>
</template>
