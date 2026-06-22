export function useImageUpload() {
  const uploading = ref(false)
  const uploadError = ref('')

  async function uploadImage(file: File): Promise<string | null> {
    uploading.value = true
    uploadError.value = ''
    try {
      const formData = new FormData()
      formData.append('image', file)
      const result = await $fetch<{ url: string }>('/api/upload/image', {
        method: 'POST',
        body: formData,
      })
      return result.url
    } catch (err: any) {
      uploadError.value = err?.data?.message || 'Eroare la încărcarea imaginii.'
      return null
    } finally {
      uploading.value = false
    }
  }

  return { uploading, uploadError, uploadImage }
}
