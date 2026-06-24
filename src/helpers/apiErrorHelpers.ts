export interface ApiErrorBody {
  timestamp?: string
  status?: number
  error?: string
  code?: string
  message?: string
  path?: string
}

const MESSAGE_TRANSLATIONS: Record<string, string> = {
  "The professional already has an appointment in that time slot":
    "El profesional ya tiene una cita activa en ese horario.",
  "User does not belong to the same salon as the client":
    "El profesional no pertenece al mismo salón que el cliente.",
  "Branch does not belong to the same salon as the client":
    "La sucursal no pertenece al mismo salón que el cliente.",
  "Service does not belong to the same salon as the client":
    "El servicio no pertenece al mismo salón que el cliente.",
}

export function parseApiError(err: unknown): ApiErrorBody | null {
  if (!err || typeof err !== "object") return null

  const fetchError = err as {
    data?: ApiErrorBody
    status?: number
    statusCode?: number
  }

  if (!fetchError.data || typeof fetchError.data !== "object") {
    return null
  }

  return {
    ...fetchError.data,
    status:
      fetchError.data.status ?? fetchError.status ?? fetchError.statusCode,
  }
}

function translateMessagePart(message: string): string {
  const trimmed = message.trim()

  for (const [english, spanish] of Object.entries(MESSAGE_TRANSLATIONS)) {
    if (trimmed.includes(english)) {
      return spanish
    }
  }

  const notFoundMatch = trimmed.match(/not found with id:\s*(\d+)/i)
  if (notFoundMatch) {
    return `No se encontró el recurso con id ${notFoundMatch[1]}.`
  }

  return trimmed
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const body = parseApiError(err)

  if (!body?.message) {
    return fallback
  }

  return body.message
    .split(";")
    .map(translateMessagePart)
    .filter(Boolean)
    .join(" ")
}

export function getApiErrorTitle(err: unknown): string {
  const body = parseApiError(err)
  const status = body?.status

  switch (body?.code) {
    case "CONFLICT":
      return "Conflicto de horario"
    case "VALIDATION_ERROR":
      return "Datos inválidos"
    case "BAD_REQUEST":
      return "Solicitud inválida"
    case "NOT_FOUND":
      return "No encontrado"
    case "FORBIDDEN":
      return "Sin permisos"
    case "UNAUTHORIZED":
      return "No autorizado"
  }

  if (status === 409) return "Conflicto de horario"
  if (status === 404) return "No encontrado"
  if (status === 403) return "Sin permisos"
  if (status === 401) return "No autorizado"
  if (status === 400) return "Solicitud inválida"

  return "Error"
}
