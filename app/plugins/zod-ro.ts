import { z } from "zod";

export default defineNuxtPlugin(() => {
  z.setErrorMap((issue, ctx) => {
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        if (issue.received === "undefined" || issue.received === "null") {
          return { message: "Câmpul este obligatoriu" };
        }
        return { message: "Valoare invalidă" };

      case z.ZodIssueCode.too_small:
        if (issue.type === "string") {
          if (issue.minimum === 1) return { message: "Câmpul este obligatoriu" };
          return { message: `Minim ${issue.minimum} caractere` };
        }
        if (issue.type === "number") {
          return { message: `Valoarea minimă este ${issue.minimum}` };
        }
        return { message: ctx.defaultError };

      case z.ZodIssueCode.too_big:
        if (issue.type === "string") {
          return { message: `Maxim ${issue.maximum} caractere` };
        }
        return { message: ctx.defaultError };

      case z.ZodIssueCode.invalid_string:
        if (issue.validation === "email") return { message: "Email invalid" };
        if (issue.validation === "url") return { message: "URL invalid" };
        return { message: "Format invalid" };

      default:
        return { message: ctx.defaultError };
    }
  });
});
