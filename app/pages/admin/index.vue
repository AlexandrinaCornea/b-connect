<script setup lang="ts">
definePageMeta({ middleware: "admin" });

const activeTab = ref<"books" | "users">("books");

const { data: books, refresh: refreshBooks } =
  await useFetch("/api/admin/books");
const { data: adminUsers, refresh: refreshUsers } =
  await useFetch("/api/admin/users");

const deleteError = ref("");
const roleError = ref("");

async function deleteBook(id: string, title: string) {
  if (!confirm(`Ștergi cartea "${title}"?`)) return;
  deleteError.value = "";
  try {
    await $fetch(`/api/admin/books/${id}`, { method: "DELETE" });
    await refreshBooks();
  } catch (err: any) {
    deleteError.value = err?.data?.message || "Eroare la ștergere.";
  }
}

async function toggleRole(userId: string, currentRole: string) {
  const newRole = currentRole === "admin" ? "user" : "admin";
  roleError.value = "";
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: { role: newRole },
    });
    await refreshUsers();
  } catch (err: any) {
    roleError.value = err?.data?.message || "Eroare.";
  }
}

const statusLabel: Record<string, string> = {
  available: "Disponibilă",
  borrowed: "Împrumutată",
};

const statusClass: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  borrowed: "bg-orange-100 text-orange-700",
};
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <Icon name="heroicons:shield-check" class="w-7 h-7 text-indigo-600" />
      <h1 class="text-2xl font-bold text-gray-900">Panou Admin</h1>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
      <button
        v-for="tab in [
          { key: 'books', label: 'Cărți', icon: 'heroicons:book-open' },
          { key: 'users', label: 'Utilizatori', icon: 'heroicons:users' },
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
        >
          {{
            tab.key === "books"
              ? ((books as any[])?.length ?? 0)
              : ((adminUsers as any[])?.length ?? 0)
          }}
        </span>
      </button>
    </div>

    <div v-if="activeTab === 'books'">
      <div
        v-if="deleteError"
        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
      >
        {{ deleteError }}
      </div>

      <div class="bg-white border border-gray-100 rounded-xl overflow-hidden">
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
              v-for="book in books as any[]"
              :key="book.id"
              class="hover:bg-gray-50/50 transition"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-11 rounded bg-gray-50 overflow-hidden shrink-0"
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
                  class="text-indigo-600 hover:underline"
                >
                  {{ book.owner.name }}
                </NuxtLink>
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
          v-if="!(books as any[])?.length"
          class="text-center py-12 text-sm text-gray-400"
        >
          Nicio carte în platformă.
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'users'">
      <div
        v-if="roleError"
        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
      >
        {{ roleError }}
      </div>

      <div class="bg-white border border-gray-100 rounded-xl overflow-hidden">
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
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="user in adminUsers as any[]"
              :key="user.id"
              class="hover:bg-gray-50/50 transition"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs"
                  >
                    {{ user.name?.charAt(0).toUpperCase() }}
                  </div>
                  <NuxtLink
                    :to="`/users/${user.id}`"
                    class="font-medium text-gray-900 hover:underline"
                  >
                    {{ user.name }}
                  </NuxtLink>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ user.email }}</td>
              <td class="px-4 py-3 text-gray-500">{{ user.city ?? "—" }}</td>
              <td class="px-4 py-3">
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="
                    user.role === 'admin'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  "
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  @click="toggleRole(user.id, user.role)"
                  class="text-xs px-3 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                >
                  {{
                    user.role === "admin" ? "Retrogradează" : "Promovează admin"
                  }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
