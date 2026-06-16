import { v2 as cloudinary } from "cloudinary";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  });

  const formData = await readFormData(event);
  const file = formData.get("image") as File;

  if (!file) {
    throw createError({
      statusCode: 400,
      message: "Imaginea este obligatorie",
    });
  }

  if (!file.type.startsWith("image/")) {
    throw createError({
      statusCode: 400,
      message: "Fișierul trebuie să fie o imagine",
    });
  }

  if (file.size > 5 * 1024 * 1024) {
    throw createError({
      statusCode: 400,
      message: "Imaginea nu poate depăși 5MB",
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "b-connect/books", resource_type: "image" },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result);
          },
        )
        .end(buffer);
    },
  );

  return { url: result.secure_url };
});
