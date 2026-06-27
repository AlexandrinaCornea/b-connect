<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: session } = useAuth();
const me = computed(() => (session.value?.user as any)?.id);

const activeTab = ref<"incoming" | "outgoing" | "history">("incoming");

const incoming = ref<any[]>([]);
const outgoing = ref<any[]>([]);
const history = ref<any[]>([]);
const actionError = ref("");

async function loadAll() {
  [incoming.value, outgoing.value, history.value] = await Promise.all([
    $fetch<any[]>("/api/loans/incoming"),
    $fetch<any[]>("/api/loans/outgoing"),
    $fetch<any[]>("/api/loans/history"),
  ]);
}

onMounted(loadAll);

async function updateLoan(id: string, status: string) {
  actionError.value = "";
  try {
    await $fetch(`/api/loans/${id}`, { method: "PUT", body: { status } });
    await loadAll();
  } catch (err: any) {
    actionError.value = err?.data?.message || "A apărut o eroare.";
  }
}

async function returnLoan(id: string) {
  actionError.value = "";
  try {
    await $fetch(`/api/loans/${id}/return`, { method: "PUT" });
    await loadAll();
    const returnedLoan = history.value.find((l: any) => l.id === id);
    if (returnedLoan && !returnedLoan.hasReviewed) openReview(returnedLoan);
  } catch (err: any) {
    actionError.value = err?.data?.message || "A apărut o eroare.";
  }
}

// ─── Review ───────────────────────────────────────────────────────────────────
const reviewModal = ref<{ loan: any } | null>(null);
const reviewRating = ref(0);
const reviewComment = ref("");
const reviewHover = ref(0);
const reviewError = ref("");
const reviewSending = ref(false);

function openReview(loan: any) {
  reviewModal.value = { loan };
  reviewRating.value = 0;
  reviewComment.value = "";
  reviewError.value = "";
  reviewHover.value = 0;
}

function closeReview() {
  reviewModal.value = null;
}

async function submitReview() {
  if (!reviewRating.value) {
    reviewError.value = "Selectează un rating.";
    return;
  }
  reviewSending.value = true;
  reviewError.value = "";
  const loan = reviewModal.value!.loan;
  const reviewedUserId =
    loan.borrowerId === me.value ? loan.ownerId : loan.borrowerId;
  try {
    await $fetch("/api/reviews", {
      method: "POST",
      body: {
        loanId: loan.id,
        reviewedUserId,
        rating: reviewRating.value,
        comment: reviewComment.value || undefined,
      },
    });
    closeReview();
    await loadAll();
  } catch (err: any) {
    reviewError.value = err?.data?.message || "A apărut o eroare.";
  } finally {
    reviewSending.value = false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusLabel: Record<string, string> = {
  pending: "În așteptare",
  accepted: "Acceptat",
  active: "Activ",
  returned: "Completat",
  rejected: "Respins",
  cancelled: "Anulat",
};
const statusClass: Record<string, string> = {
  pending: "bg-[#FFFBEA] text-yellow-700",
  accepted: "bg-sage-50 text-sage-700",
  active: "bg-blue-50 text-blue-700",
  returned: "bg-[#DCFCE7] text-green-700",
  rejected: "bg-[#FEE2E2] text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
};

function daysRemaining(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function dueDateProgress(
  startDate: string | null,
  dueDate: string | null,
): number {
  if (!startDate || !dueDate) return 0;
  const total = new Date(dueDate).getTime() - new Date(startDate).getTime();
  const elapsed = Date.now() - new Date(startDate).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}
const tabs = [
  { key: "incoming", label: "Primite", icon: "heroicons:inbox" },
  { key: "outgoing", label: "Trimise", icon: "heroicons:paper-airplane" },
  { key: "history", label: "Istoric", icon: "heroicons:clock" },
];

function formatDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Împrumuturi</h1>

    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key as any"
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition"
        :class="
          activeTab === tab.key
            ? 'bg-sage-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
      >
        <Icon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <div
      v-if="actionError"
      class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
    >
      {{ actionError }}
    </div>

    <div v-if="activeTab === 'incoming'">
      <div
        v-if="!incoming.length"
        class="text-center py-16 bg-white border border-gray-100 rounded-xl space-y-3"
      >
        <Icon name="heroicons:inbox" class="w-12 h-12 text-cream-300 mx-auto" />
        <p class="text-base font-semibold text-gray-700">
          Încă nicio cerere...
        </p>
        <p class="text-sm text-gray-400 italic max-w-sm mx-auto">
          Cărțile tale așteaptă în tăcere. Când cineva va vedea ceva demn de a
          fi citit, cererea va apărea aici.
        </p>
        <NuxtLink
          to="/profile"
          class="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium rounded-xl transition"
        >
          Mergi la cărțile mele
        </NuxtLink>
      </div>
      <div v-else class="space-y-5">
        <div
          v-for="loan in incoming"
          :key="loan.id"
          class="bg-white border border-cream-200 rounded-xl p-5"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex gap-3">
              <div
                class="w-10 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0"
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
                    class="w-4 h-4 text-gray-300"
                  />
                </div>
              </div>
              <div>
                <p class="font-medium text-gray-900 text-sm">
                  {{ loan.book?.title }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  Solicitat de <strong>{{ loan.borrower?.name }}</strong>
                  <span v-if="loan.borrower?.city">
                    · {{ loan.borrower.city }}</span
                  >
                </p>
                <div
                  v-if="loan.startDate || loan.dueDate"
                  class="flex gap-3 mt-1.5"
                >
                  <span
                    v-if="loan.startDate"
                    class="inline-flex items-center gap-1 text-xs text-gray-500"
                  >
                    <Icon name="heroicons:calendar" class="w-3 h-3" />{{
                      formatDate(loan.startDate)
                    }}
                  </span>
                  <span
                    v-if="loan.dueDate"
                    class="inline-flex items-center gap-1 text-xs text-orange-500"
                  >
                    <Icon
                      name="heroicons:arrow-uturn-left"
                      class="w-3 h-3"
                    />până la {{ formatDate(loan.dueDate) }}
                  </span>
                </div>
                <p
                  v-if="loan.message"
                  class="text-xs text-gray-400 mt-1 italic"
                >
                  "{{ loan.message }}"
                </p>
              </div>
            </div>
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
              :class="statusClass[loan.status]"
            >
              {{ statusLabel[loan.status] }}
            </span>
          </div>
          <div
            v-if="loan.status === 'pending'"
            class="flex gap-2 mt-4 pt-4 border-t border-gray-50"
          >
            <button
              @click="updateLoan(loan.id, 'accepted')"
              class="flex-1 py-2 bg-sage-500 hover:bg-sage-600 text-white text-xs font-medium rounded-lg transition"
            >
              Acceptă
            </button>
            <button
              @click="updateLoan(loan.id, 'rejected')"
              class="flex-1 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium rounded-lg transition"
            >
              Respinge
            </button>
          </div>
          <div
            v-if="loan.status === 'accepted'"
            class="mt-4 pt-4 border-t border-gray-50 space-y-2"
          >
            <p class="text-xs text-sage-600 bg-sage-50 rounded-lg px-3 py-2">
              Conversația a fost creată automat. Aranjați întâlnirea, apoi
              confirmați predarea.
            </p>
            <div class="flex gap-2">
              <NuxtLink
                to="/messages"
                class="flex-1 py-2 text-center border border-sage-300 text-sage-600 hover:bg-sage-50 text-xs font-medium rounded-lg transition"
              >
                Mergi la mesaje
              </NuxtLink>
              <button
                @click="updateLoan(loan.id, 'active')"
                class="flex-1 py-2 bg-sage-500 hover:bg-sage-600 text-white text-xs font-medium rounded-lg transition"
              >
                Confirmă predarea
              </button>
            </div>
          </div>
          <div
            v-if="loan.status === 'active'"
            class="mt-4 pt-4 border-t border-gray-50 space-y-3"
          >
            <div v-if="loan.dueDate">
              <div class="flex justify-between items-center mb-1.5">
                <span class="text-xs text-gray-500">Timp rămas</span>
                <span
                  class="text-xs font-medium"
                  :class="
                    (daysRemaining(loan.dueDate) ?? 0) <= 3
                      ? 'text-red-500'
                      : 'text-gray-600'
                  "
                >
                  <template v-if="(daysRemaining(loan.dueDate) ?? 0) > 0">
                    {{ daysRemaining(loan.dueDate) }} zile · până la
                    {{ formatDate(loan.dueDate) }}
                  </template>
                  <template v-else>Termen depășit</template>
                </span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="
                    (daysRemaining(loan.dueDate) ?? 0) <= 3
                      ? 'bg-red-400'
                      : 'bg-sage-400'
                  "
                  :style="{
                    width: dueDateProgress(loan.startDate, loan.dueDate) + '%',
                  }"
                />
              </div>
            </div>
            <button
              @click="returnLoan(loan.id)"
              class="w-full py-2 border border-green-200 text-green-600 hover:bg-green-50 text-xs font-medium rounded-lg transition"
            >
              Marchează returnată
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'outgoing'">
      <div
        v-if="!outgoing.length"
        class="text-center py-16 bg-white border border-gray-100 rounded-xl"
      >
        <Icon
          name="heroicons:paper-airplane"
          class="w-10 h-10 text-gray-200 mx-auto mb-2"
        />
        <p class="text-sm text-gray-500">Nu ai cereri trimise.</p>
      </div>
      <div v-else class="space-y-5">
        <div
          v-for="loan in outgoing"
          :key="loan.id"
          class="bg-white border border-cream-200 rounded-xl p-5"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex gap-3">
              <div
                class="w-10 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0"
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
                    class="w-4 h-4 text-gray-300"
                  />
                </div>
              </div>
              <div>
                <p class="font-medium text-gray-900 text-sm">
                  {{ loan.book?.title }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  Proprietar: <strong>{{ loan.owner?.name }}</strong>
                </p>
                <div
                  v-if="loan.startDate || loan.dueDate"
                  class="flex gap-3 mt-1.5"
                >
                  <span
                    v-if="loan.startDate"
                    class="inline-flex items-center gap-1 text-xs text-gray-500"
                  >
                    <Icon name="heroicons:calendar" class="w-3 h-3" />{{
                      formatDate(loan.startDate)
                    }}
                  </span>
                  <span
                    v-if="loan.dueDate"
                    class="inline-flex items-center gap-1 text-xs text-orange-500"
                  >
                    <Icon
                      name="heroicons:arrow-uturn-left"
                      class="w-3 h-3"
                    />până la {{ formatDate(loan.dueDate) }}
                  </span>
                </div>
              </div>
            </div>
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
              :class="statusClass[loan.status]"
            >
              {{ statusLabel[loan.status] }}
            </span>
          </div>
          <div
            v-if="loan.status === 'pending'"
            class="mt-4 pt-4 border-t border-gray-50"
          >
            <button
              @click="updateLoan(loan.id, 'cancelled')"
              class="w-full py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium rounded-lg transition"
            >
              Anulează cererea
            </button>
          </div>
          <div
            v-if="loan.status === 'accepted'"
            class="mt-4 pt-4 border-t border-gray-50 space-y-2"
          >
            <p class="text-xs text-sage-600 bg-sage-50 rounded-lg px-3 py-2">
              Cererea a fost acceptată! Discutați detaliile întâlnirii în
              mesaje.
            </p>
            <NuxtLink
              to="/messages"
              class="flex items-center justify-center gap-2 w-full py-2 bg-sage-500 hover:bg-sage-600 text-white text-xs font-medium rounded-lg transition"
            >
              <Icon
                name="heroicons:chat-bubble-left-right"
                class="w-3.5 h-3.5"
              />
              Mergi la mesaje
            </NuxtLink>
          </div>
          <div
            v-if="loan.status === 'active' && loan.dueDate"
            class="mt-4 pt-4 border-t border-gray-50"
          >
            <div class="flex justify-between items-center mb-1.5">
              <span class="text-xs text-gray-500">Timp rămas</span>
              <span
                class="text-xs font-medium"
                :class="
                  (daysRemaining(loan.dueDate) ?? 0) <= 3
                    ? 'text-red-500'
                    : 'text-gray-600'
                "
              >
                <template v-if="(daysRemaining(loan.dueDate) ?? 0) > 0">
                  {{ daysRemaining(loan.dueDate) }} zile · până la
                  {{ formatDate(loan.dueDate) }}
                </template>
                <template v-else>Termen depășit</template>
              </span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="
                  (daysRemaining(loan.dueDate) ?? 0) <= 3
                    ? 'bg-red-400'
                    : 'bg-sage-400'
                "
                :style="{
                  width: dueDateProgress(loan.startDate, loan.dueDate) + '%',
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'history'">
      <div
        v-if="!history.length"
        class="text-center py-16 bg-white border border-gray-100 rounded-xl"
      >
        <Icon
          name="heroicons:clock"
          class="w-10 h-10 text-gray-200 mx-auto mb-2"
        />
        <p class="text-sm text-gray-500">Niciun împrumut finalizat.</p>
      </div>
      <div v-else class="space-y-5">
        <div
          v-for="loan in history"
          :key="loan.id"
          class="bg-white border border-cream-200 rounded-xl p-5"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex gap-3">
              <div
                class="w-10 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0"
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
                    class="w-4 h-4 text-gray-300"
                  />
                </div>
              </div>
              <div>
                <p class="font-medium text-gray-900 text-sm">
                  {{ loan.book?.title }}
                </p>
                <p class="text-xs text-gray-500">{{ loan.book?.author }}</p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{
                    loan.borrowerId === me
                      ? `Proprietar: ${loan.owner?.name}`
                      : `Împrumutat de: ${loan.borrower?.name}`
                  }}
                </p>
                <div v-if="loan.dueDate" class="mt-1">
                  <span
                    class="inline-flex items-center gap-1 text-xs text-gray-400"
                  >
                    <Icon
                      name="heroicons:arrow-uturn-left"
                      class="w-3 h-3"
                    />Termen: {{ formatDate(loan.dueDate) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex flex-col items-end gap-2 shrink-0">
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="statusClass[loan.status]"
              >
                {{ statusLabel[loan.status] }}
              </span>
              <button
                v-if="loan.status === 'returned' && !loan.hasReviewed"
                @click="openReview(loan)"
                class="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                <Icon name="heroicons:star" class="w-3.5 h-3.5" />
                Lasă recenzie
              </button>
              <span
                v-else-if="loan.status === 'returned' && loan.hasReviewed"
                class="inline-flex items-center gap-1 text-xs text-gray-400"
              >
                <Icon name="heroicons:check" class="w-3.5 h-3.5" />
                Recenzie trimisă
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="reviewModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-900 mb-1">Lasă o recenzie</h2>
        <p class="text-sm text-gray-500 mb-5">
          pentru
          <strong>{{
            reviewModal.loan.borrowerId === me
              ? reviewModal.loan.owner?.name
              : reviewModal.loan.borrower?.name
          }}</strong>
        </p>

        <div class="flex gap-1 mb-4">
          <button
            v-for="star in 5"
            :key="star"
            @click="reviewRating = star"
            @mouseenter="reviewHover = star"
            @mouseleave="reviewHover = 0"
            class="text-2xl transition"
            :class="
              (reviewHover || reviewRating) >= star
                ? 'text-amber-400'
                : 'text-gray-200'
            "
          >
            ★
          </button>
        </div>

        <textarea
          v-model="reviewComment"
          rows="3"
          placeholder="Comentariu opțional..."
          class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 resize-none mb-3"
        />

        <p v-if="reviewError" class="text-xs text-red-500 mb-3">
          {{ reviewError }}
        </p>

        <div class="flex gap-2">
          <button
            @click="closeReview"
            class="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition"
          >
            Anulează
          </button>
          <button
            @click="submitReview"
            :disabled="reviewSending || !reviewRating"
            class="flex-1 py-2 bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
          >
            <span v-if="reviewSending">Se trimite...</span>
            <span v-else>Trimite</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
