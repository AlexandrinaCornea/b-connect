<script setup lang="ts">
const props = defineProps<{
  profile: {
    name: string;
    city?: string | null;
    bio?: string | null;
    totalBooks?: number | null;
    ratingSum?: number | null;
    ratingCount?: number | null;
  };
  friendsCount?: number;
}>();

const ratingAvg = computed(() => {
  const { ratingSum, ratingCount } = props.profile;
  if (!ratingCount || ratingCount === 0) return null;
  return Math.round((ratingSum! / ratingCount) * 10) / 10;
});
</script>

<template>
  <div class="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
    <div
      class="flex flex-col items-center text-center gap-2 pb-4 border-b border-gray-100"
    >
      <UserAvatar :name="profile.name" size="lg" />
      <div>
        <h1 class="text-base font-bold text-[#1a2b3d]">{{ profile.name }}</h1>
        <p
          v-if="profile.city"
          class="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1"
        >
          <Icon name="heroicons:map-pin" class="w-3 h-3" />
          {{ profile.city }}
        </p>
      </div>
      <div
        class="flex items-center gap-2 text-xs text-gray-500 flex-wrap justify-center"
      >
        <span
          >{{ profile.totalBooks ?? 0 }}
          {{ (profile.totalBooks ?? 0) === 1 ? "carte" : "cărți" }}</span
        >
        <template v-if="friendsCount !== undefined">
          <span class="text-gray-200">|</span>
          <span>{{ friendsCount }} prieteni</span>
        </template>
        <template v-if="ratingAvg">
          <span class="text-gray-200">|</span>
          <span class="flex items-center gap-0.5">
            <Icon name="heroicons:star-solid" class="w-3 h-3 text-yellow-400" />
            {{ ratingAvg }}
          </span>
        </template>
      </div>
      <p v-if="profile.bio" class="text-xs text-gray-500 leading-relaxed">
        {{ profile.bio }}
      </p>
    </div>

    <div class="pt-4">
      <slot />
    </div>
  </div>
</template>
