<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  min?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [string] }>();

const months = [
  "Ian",
  "Feb",
  "Mar",
  "Apr",
  "Mai",
  "Iun",
  "Iul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const day = ref("");
const month = ref("");
const year = ref("");

watch(
  () => props.modelValue,
  (val) => {
    if (val && val.length === 10) {
      const [y, m, d] = val.split("-");
      year.value = y;
      month.value = String(parseInt(m));
      day.value = String(parseInt(d));
    }
  },
  { immediate: true },
);

watch([day, month, year], () => {
  if (day.value && month.value && year.value) {
    const d = day.value.padStart(2, "0");
    const m = month.value.padStart(2, "0");
    emit("update:modelValue", `${year.value}-${m}-${d}`);
  } else {
    emit("update:modelValue", "");
  }
});

const minDate = computed(() => {
  if (!props.min) return null;
  const [y, m, d] = props.min.split("-").map(Number);
  return { year: y, month: m, day: d };
});

const minYear = computed(() => minDate.value?.year ?? new Date().getFullYear());

const daysInMonth = computed(() => {
  if (!month.value || !year.value) return 31;
  return new Date(parseInt(year.value), parseInt(month.value), 0).getDate();
});

const availableDays = computed(() => {
  return Array.from({ length: daysInMonth.value }, (_, i) => i + 1);
});

const availableMonths = computed(() => {
  if (!minDate.value || parseInt(year.value) > minDate.value.year) {
    return months.map((m, i) => ({ label: m, value: i + 1 }));
  }
  return months
    .map((m, i) => ({ label: m, value: i + 1 }))
    .filter((m) => m.value >= (minDate.value?.month ?? 1));
});

const years = computed(() => {
  const y = minYear.value;
  return Array.from({ length: 3 }, (_, i) => y + i);
});

watch(daysInMonth, (max) => {
  if (parseInt(day.value) > max) day.value = String(max);
});
</script>

<template>
  <div class="flex gap-1.5">
    <select
      v-model="day"
      class="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 bg-white"
    >
      <option value="">Zi</option>
      <option v-for="d in availableDays" :key="d" :value="String(d)">
        {{ d }}
      </option>
    </select>
    <select
      v-model="month"
      class="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 bg-white"
    >
      <option value="">Lună</option>
      <option
        v-for="m in availableMonths"
        :key="m.value"
        :value="String(m.value)"
      >
        {{ m.label }}
      </option>
    </select>
    <select
      v-model="year"
      class="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 bg-white"
    >
      <option value="">An</option>
      <option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option>
    </select>
  </div>
</template>
