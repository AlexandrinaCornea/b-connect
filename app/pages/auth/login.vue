<script setup lang="ts">
import { useForm, useField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

definePageMeta({
  layout: "auth",
  middleware: "guest",
});

const { signIn } = useAuth();
const route = useRoute();
const error = ref("");
const loading = ref(false);

const schema = toTypedSchema(
  z.object({
    email: z.string().email("Email invalid"),
    password: z.string().min(1, "Parola este obligatorie"),
  }),
);

const { handleSubmit } = useForm({ validationSchema: schema });
const { value: email, errorMessage: emailError } = useField<string>("email");
const { value: password, errorMessage: passwordError } =
  useField<string>("password");

const onSubmit = handleSubmit(async (values) => {
  loading.value = true;
  error.value = "";

  const result = await signIn("credentials", {
    email: values.email,
    password: values.password,
    redirect: false,
  });

  loading.value = false;

  if (result?.error) {
    error.value = "Email sau parolă incorectă";
    return;
  }

  const redirect = route.query.redirect as string | undefined;
  navigateTo(redirect || "/");
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-1">Bine ai revenit</h1>
    <p class="text-sm text-gray-500 mb-6">
      Nu ai cont?
      <NuxtLink
        to="/auth/register"
        class="text-indigo-600 hover:underline font-medium"
      >
        Înregistrează-te
      </NuxtLink>
    </p>

    <form @submit.prevent="onSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Email</label
        >
        <input
          v-model="email"
          type="email"
          placeholder="tu@exemplu.com"
          class="w-full px-3 py-2 border rounded-lg text-sm outline-none transition"
          :class="
            emailError
              ? 'border-red-400 focus:ring-2 focus:ring-red-200'
              : 'border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'
          "
        />
        <p v-if="emailError" class="mt-1 text-xs text-red-500">
          {{ emailError }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Parolă</label
        >
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          class="w-full px-3 py-2 border rounded-lg text-sm outline-none transition"
          :class="
            passwordError
              ? 'border-red-400 focus:ring-2 focus:ring-red-200'
              : 'border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'
          "
        />
        <p v-if="passwordError" class="mt-1 text-xs text-red-500">
          {{ passwordError }}
        </p>
      </div>

      <div
        v-if="error"
        class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
      >
        {{ error }}
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition"
      >
        <span v-if="loading">Se încarcă...</span>
        <span v-else>Intră în cont</span>
      </button>
    </form>
  </div>
</template>
