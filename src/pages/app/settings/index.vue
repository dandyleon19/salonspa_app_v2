<template>
  <AppTableWrapper>
    <AppPageTitle
      title="Configuración"
      subtitle="Personaliza el nombre y el logo de tu spa"
    />

    <v-card class="app-settings-card" rounded="xl" elevation="0">
      <v-card-text class="pa-5 pa-md-6">
        <v-form
          ref="formRef"
          v-model="isValid"
          class="app-form"
          lazy-validation
          :disabled="loading"
          @submit.prevent="handleSubmit"
        >
          <AppFormSection
            title="Identidad del spa"
            subtitle="El nombre y el logo se muestran en el panel de gestión"
          >
            <div class="app-settings-logo">
              <div class="app-settings-logo__box-wrap">
                <button
                  type="button"
                  class="app-settings-logo__trigger"
                  :disabled="loading"
                  @click="triggerFileInput"
                >
                  <div class="app-settings-logo__box">
                    <img v-if="logoPreview" :src="logoPreview" alt="Logo del spa" class="app-settings-logo__img">
                    <v-icon v-else size="32" color="grey-darken-1">{{ APP_ICONS.store }}</v-icon>
                  </div>
                  <div class="app-settings-logo__overlay">
                    <v-icon size="20">{{ APP_ICONS.imageUpload }}</v-icon>
                    <span>Cambiar logo</span>
                  </div>
                </button>

                <button
                  v-if="logoPreview"
                  type="button"
                  class="app-settings-logo__remove"
                  :disabled="loading"
                  aria-label="Eliminar logo"
                  @click="handleRemoveLogo"
                >
                  <v-icon size="14">{{ APP_ICONS.close }}</v-icon>
                </button>
              </div>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="app-settings-logo__input"
                @change="handleFileChange"
              />
              <p class="app-settings-logo__hint text-caption text-medium-emphasis mb-0">
                PNG, JPG o WEBP. Máximo 2 MB.
              </p>
            </div>

            <v-text-field
              v-model="salonForm.name"
              v-bind="field"
              label="Nombre del spa"
              :rules="[rules.required, rules.maxLength(100)]"
            />
          </AppFormSection>

          <AppFormActions>
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              rounded="lg"
              class="app-form-btn--primary"
              :loading="loading"
            >
              Guardar cambios
            </v-btn>
          </AppFormActions>
        </v-form>
      </v-card-text>
    </v-card>
  </AppTableWrapper>
</template>

<script setup lang="ts">
import { validationRules as rules } from "~/helpers/validationFormRules"
import { resolveUploadUrl } from "~/helpers/assetHelpers"
import { APP_ICONS } from "~/constants/appIcons"
import { useAuthStore } from "~/store/modules/auth"
import { getAccessToken } from "~/composables/useAuthTokens"
import type { Salon } from "~/interfaces/salonInterfaces"

definePageMeta({
  layout: "app",
  middleware: "role",
  allowedRoles: ["ADMIN_USER"],
})

useHead({ title: "Configuración" })

const authStore = useAuthStore()
const { field } = useFormFields()
const { notifyUpdated, notifyDeleted, notifyError } = useApiNotification()

const formRef = ref<any>(null)
const isValid = ref(false)
const loading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const logoPreview = ref<string | undefined>()
const hasSavedLogo = ref(false)

const salonForm = reactive({
  name: "",
  socialReason: "",
  fiscalAddress: "",
  rucNumber: "",
  phone: "",
})

const salonId = computed(() => authStore.user?.salonId)

const loadSalon = async () => {
  if (!salonId.value) return
  const { $api } = useNuxtApp()
  const salon = await $api<Salon>(`/api/salons/${salonId.value}`, { method: "GET" })
  salonForm.name = salon.name ?? ""
  salonForm.socialReason = salon.socialReason ?? ""
  salonForm.fiscalAddress = salon.fiscalAddress ?? ""
  salonForm.rucNumber = salon.rucNumber ?? ""
  salonForm.phone = salon.phone ?? ""
  logoPreview.value = resolveUploadUrl(salon.logoUrl)
  hasSavedLogo.value = Boolean(salon.logoUrl)
}

const triggerFileInput = () => fileInputRef.value?.click()

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    notifyError({}, "seleccionar la imagen", "La imagen no puede pesar más de 2 MB.")
    input.value = ""
    return
  }

  selectedFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

const uploadLogo = async () => {
  if (!selectedFile.value || !salonId.value) return

  const config = useRuntimeConfig()
  const formData = new FormData()
  formData.append("file", selectedFile.value)

  await $fetch(`/api/salons/${salonId.value}/logo`, {
    baseURL: config.public.apiBase as string,
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })

  selectedFile.value = null
  hasSavedLogo.value = true
}

const refreshAuthUser = async () => {
  if (!authStore.user?.id || !authStore.token) return
  const { $api } = useNuxtApp()
  const user = await $api(`/api/users/${authStore.user.id}`, { method: "GET" })
  authStore.setAuth({ token: authStore.token, role: authStore.role, user })
}

const handleRemoveLogo = async () => {
  if (fileInputRef.value) fileInputRef.value.value = ""

  if (!hasSavedLogo.value) {
    selectedFile.value = null
    logoPreview.value = undefined
    return
  }

  if (!salonId.value) return

  loading.value = true
  try {
    const { $api } = useNuxtApp()
    await $api(`/api/salons/${salonId.value}/logo`, { method: "DELETE" })

    selectedFile.value = null
    logoPreview.value = undefined
    hasSavedLogo.value = false

    await refreshAuthUser()
    notifyDeleted("logo del spa")
  } catch (err) {
    notifyError(err, "eliminar el logo")
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid?.valid || !salonId.value) return

  loading.value = true
  try {
    const { $api } = useNuxtApp()

    await $api(`/api/salons/${salonId.value}`, {
      method: "PUT",
      body: { ...salonForm },
    })

    await uploadLogo()
    await refreshAuthUser()

    notifyUpdated("perfil del spa")
  } catch (err) {
    notifyError(err, "guardar los cambios")
  } finally {
    loading.value = false
  }
}

onMounted(loadSalon)
</script>

<style scoped>
.app-settings-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.app-settings-logo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.app-settings-logo__box-wrap {
  position: relative;
  display: inline-flex;
}

.app-settings-logo__trigger {
  position: relative;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
}

.app-settings-logo__trigger:disabled {
  cursor: default;
  opacity: 0.6;
}

.app-settings-logo__box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96px;
  min-width: 96px;
  max-width: 320px;
  padding: 0 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}

.app-settings-logo__img {
  height: 100%;
  max-height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.app-settings-logo__remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgb(var(--v-theme-surface));
  border-radius: 999px;
  background: rgb(var(--v-theme-error));
  color: #fff;
  cursor: pointer;
}

.app-settings-logo__remove:disabled {
  cursor: default;
  opacity: 0.6;
}

.app-settings-logo__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.app-settings-logo__trigger:hover .app-settings-logo__overlay,
.app-settings-logo__trigger:focus-visible .app-settings-logo__overlay {
  opacity: 1;
}

.app-settings-logo__input {
  display: none;
}
</style>
