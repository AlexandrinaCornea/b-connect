<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { data: session } = useAuth();
const convId = route.params.id as string;

onMounted(() => {
  if (window.innerWidth >= 768) {
    navigateTo(`/messages?conv=${convId}`, { replace: true });
  }
});

const convs = ref<any[]>([]);
onMounted(async () => {
  convs.value = await $fetch<any[]>("/api/conversations");
});

const me = computed(() => (session.value?.user as any)?.id);
const conv = computed(() => convs.value.find((c: any) => c.id === convId));
const other = computed(() => {
  if (!conv.value) return null;
  return conv.value.user1.id === me.value ? conv.value.user2 : conv.value.user1;
});
</script>

<template>
  <div
    class="border border-cream-200 rounded-xl overflow-hidden bg-white"
    style="height: calc(100vh - 10rem)"
  >
    <MessageChat :conv-id="convId" :other="other" :show-back="true" />
  </div>
</template>
