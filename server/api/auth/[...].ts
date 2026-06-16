import { NuxtAuthHandler } from "#auth";
import CredentialsProvider from "next-auth/providers/credentials";

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider.default({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        // adaug logica pe urma
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
});
