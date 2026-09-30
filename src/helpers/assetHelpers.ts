export const resolveUploadUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path

  const config = useRuntimeConfig()
  const base = (config.public.apiBase as string | undefined)?.replace(/\/$/, "") ?? ""
  return `${base}${path}`
}
