<script setup lang="ts">
import { useForm, useField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

definePageMeta({
  layout: "auth",
  middleware: "guest",
});

const { signIn } = useAuth();
const error = ref("");
const loading = ref(false);

const schema = toTypedSchema(
  z.object({
    name: z.string().min(2, "Numele trebuie să aibă minim 2 caractere"),
    email: z.string().email("Email invalid"),
    password: z.string().min(8, "Parola trebuie să aibă minim 8 caractere"),
    city: z.string().optional(),
  }),
);

const { handleSubmit } = useForm({ validationSchema: schema });
const { value: name, errorMessage: nameError } = useField<string>("name");
const { value: email, errorMessage: emailError } = useField<string>("email");
const { value: password, errorMessage: passwordError } =
  useField<string>("password");
const { value: city } = useField<string>("city");

const onSubmit = handleSubmit(async (values) => {
  loading.value = true;
  error.value = "";

  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: values,
    });

    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    navigateTo("/");
  } catch (err: any) {
    error.value = err?.data?.message || "A apărut o eroare. Încearcă din nou.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-1">Creează cont</h1>
    <p class="text-sm text-gray-500 mb-6">
      Ai deja cont?
      <NuxtLink
        to="/auth/login"
        class="text-indigo-600 hover:underline font-medium"
      >
        Intră în cont
      </NuxtLink>
    </p>

    <form @submit.prevent="onSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Nume complet</label
        >
        <input
          v-model="name"
          type="text"
          placeholder="Ion Popescu"
          class="w-full px-3 py-2 border rounded-lg text-sm outline-none transition"
          :class="
            nameError
              ? 'border-red-400 focus:ring-2 focus:ring-red-200'
              : 'border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'
          "
        />
        <p v-if="nameError" class="mt-1 text-xs text-red-500">
          {{ nameError }}
        </p>
      </div>

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
          placeholder="Minim 8 caractere"
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

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Localitate <span class="text-gray-400 font-normal">(opțional)</span>
        </label>
        <input
          v-model="city"
          type="text"
          placeholder="Cluj-Napoca"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
        />
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
        <span v-if="loading">Se creează contul...</span>
        <span v-else>Creează cont</span>
      </button>
    </form>
  </div>
</template>
