<template>
  <DrawerItemList
    :form-mode="formMode"
    :form-title="formMode === 'create' ? 'Nuevo producto' : 'Editar producto'"
    create-label="Nuevo producto"
    :search-term="searchTerm"
    search-placeholder="Buscar producto..."
    :items="filteredProducts"
    :filtered-count="filteredProducts.length"
    :total-count="products.length"
    item-label="producto"
    empty-label="Sin productos"
    no-results-label="No se encontraron productos"
    empty-hint="Agrega el primer producto con el botón de arriba"
    empty-icon="tabler:package"
    :loading="loading"
    @create="handleOpenCreate"
    @edit="handleOpenEdit"
    @delete="handleOpenDelete"
    @cancel-form="handleCloseProductForm"
    @update:search-term="searchTerm = $event"
  >
    <template #form>
      <v-form
        ref="productFormRef"
        v-model="isValid"
        class="app-form"
        lazy-validation
        :disabled="loading"
        @submit.prevent="handleSubmit"
      >
        <AppFormSection title="Producto" subtitle="Información, precio y stock">
          <div class="product-image">
            <div class="product-image__box-wrap">
              <button
                type="button"
                class="product-image__trigger"
                :disabled="loading"
                @click="triggerFileInput"
              >
                <div class="product-image__box">
                  <img v-if="imagePreview" :src="imagePreview" alt="Imagen del producto" class="product-image__img">
                  <v-icon v-else size="28" color="grey-darken-1">tabler:photo</v-icon>
                </div>
                <div class="product-image__overlay">
                  <v-icon size="18">tabler:photo-plus</v-icon>
                  <span>{{ imagePreview ? "Cambiar" : "Subir" }}</span>
                </div>
              </button>

              <button
                v-if="imagePreview"
                type="button"
                class="product-image__remove"
                :disabled="loading"
                aria-label="Eliminar imagen"
                @click="handleRemoveImage"
              >
                <v-icon size="14">tabler:x</v-icon>
              </button>
            </div>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="product-image__input"
              @change="handleFileChange"
            />
            <p class="text-caption text-medium-emphasis mb-0">
              Opcional. PNG, JPG o WEBP. Máximo 2 MB.
            </p>
          </div>

          <v-text-field
            v-model="productFormData.name"
            v-bind="field"
            label="Nombre del producto"
            :rules="[rules.required, rules.maxLength(150)]"
          />

          <v-textarea
            v-model="productFormData.description"
            v-bind="textarea"
            label="Descripción corta"
            rows="2"
            :rules="[rules.maxLength(300)]"
          />

          <v-textarea
            v-model="productFormData.longDescription"
            v-bind="textarea"
            label="Descripción detallada"
            rows="4"
            :rules="[rules.maxLength(2000)]"
          />

          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="productFormData.price"
                v-bind="field"
                label="Precio"
                type="number"
                prefix="S/"
                :rules="[rules.required, rules.decimal, rules.positiveNumber, rules.money]"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="productFormData.stockQuantity"
                v-bind="field"
                label="Stock disponible"
                type="number"
                min="0"
                :rules="[rules.required, rules.onlyNumbers, rules.positiveNumber]"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="productFormData.lowStockThreshold"
                v-bind="field"
                label="Alerta de stock bajo"
                type="number"
                min="0"
                hint="Se marca como 'stock bajo' en o por debajo de este número"
                persistent-hint
                :rules="[rules.required, rules.onlyNumbers, rules.positiveNumber]"
              />
            </v-col>
            <v-col cols="12" class="d-flex align-center">
              <v-switch
                v-model="productFormData.isActive"
                label="Producto activo"
                color="primary"
                inset
                hide-details
              />
            </v-col>
          </v-row>
        </AppFormSection>

        <AppFormActions>
          <v-btn
            variant="outlined"
            color="primary"
            rounded="lg"
            @click="handleCloseProductForm"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            rounded="lg"
            class="app-form-btn--primary"
            :loading="loading"
          >
            {{ formMode === "create" ? "Crear" : "Guardar" }}
          </v-btn>
        </AppFormActions>
      </v-form>
    </template>

    <template #item="{ item: product }">
      <div class="d-flex align-center flex-wrap ga-2 mb-1">
        <p class="text-body-1 font-weight-bold mb-0">{{ product.name }}</p>
        <v-chip
          size="x-small"
          :color="product.isActive ? 'success' : 'error'"
          variant="tonal"
        >
          {{ product.isActive ? "Activo" : "Inactivo" }}
        </v-chip>
      </div>
      <p v-if="product.description" class="text-body-2 text-medium-emphasis mb-2">
        {{ product.description }}
      </p>
      <div class="d-flex flex-wrap ga-2">
        <v-chip size="x-small" variant="tonal" color="primary" prepend-icon="tabler:currency-dollar">
          S/ {{ formatPrice(product.price) }}
        </v-chip>
        <v-chip
          size="x-small"
          variant="tonal"
          :color="getProductStockStatusColor(getProductStockStatus(product))"
          prepend-icon="tabler:package"
        >
          {{ getProductStockStatusLabel(product) }}
        </v-chip>
        <v-btn
          size="x-small"
          variant="text"
          color="primary"
          prepend-icon="tabler:plus"
          @click="openStockDialog(product)"
        >
          Stock
        </v-btn>
      </div>
    </template>
  </DrawerItemList>

  <ProductStockDialog
    v-model="showStockDialog"
    :product="stockDialogProduct"
    @updated="handleStockUpdated"
  />

  <ConfirmationModal
    v-model="showDeleteDialog"
    title="Eliminar producto"
    message="¿Seguro que deseas eliminar este producto?"
    :require-text="false"
    @confirm="handleDelete"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { resolveUploadUrl } from "~/helpers/assetHelpers"
import { getAccessToken } from "~/composables/useAuthTokens"
import {
  getProductStockStatus,
  getProductStockStatusColor,
  getProductStockStatusLabel,
} from "~/interfaces/productInterfaces"

const { field, textarea } = useFormFields()
const { notifyCreated, notifyUpdated, notifyDeleted, notifyError } = useApiNotification()
import type { Product } from "~/interfaces/productInterfaces"
import type { productCategoryDataModalForm } from "~/interfaces/productCategoryInterfaces"

const props = defineProps<{
  dataModalForm: productCategoryDataModalForm
}>()

const loading = ref(false)
const products = ref<Product[]>([])
const isValid = ref(false)
const productFormRef = ref<any>(null)
const showDeleteDialog = ref(false)
const productToRemove = ref<Product>()
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedImageFile = ref<File | null>(null)
const imagePreview = ref<string | undefined>()
const hasSavedImage = ref(false)
const showStockDialog = ref(false)
const stockDialogProduct = ref<Product | null>(null)

watch(
  () => props.dataModalForm,
  (newVal) => {
    products.value = newVal?.products || []
  },
  { immediate: true, deep: true }
)

const formMode = ref<"create" | "edit" | null>(null)
const editingId = ref<number | string | undefined>()
const searchTerm = ref("")

const productFormData = reactive<Product>({
  name: "",
  description: "",
  longDescription: "",
  price: null,
  stockQuantity: 0,
  lowStockThreshold: 5,
  isActive: true,
  imageUrl: null,
})

const filteredProducts = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query) return products.value

  return products.value.filter((product) => {
    const haystack = [
      product.name,
      product.description,
      product.longDescription,
      String(product.price ?? ""),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return haystack.includes(query)
  })
})

const formatPrice = (price?: number | null) => {
  if (price === null || price === undefined) return "0.00"
  return Number(price).toFixed(2)
}

const resetProductForm = () => {
  Object.assign(productFormData, {
    name: "",
    description: "",
    longDescription: "",
    price: null,
    stockQuantity: 0,
    lowStockThreshold: 5,
    isActive: true,
    imageUrl: null,
  })
}

const resetImageState = () => {
  if (fileInputRef.value) fileInputRef.value.value = ""
  selectedImageFile.value = null
  imagePreview.value = undefined
  hasSavedImage.value = false
}

const handleOpenCreate = () => {
  formMode.value = "create"
  editingId.value = undefined
  resetProductForm()
  resetImageState()
}

const handleOpenEdit = (product: Product) => {
  formMode.value = "edit"
  editingId.value = product.id
  Object.assign(productFormData, product, {
    stockQuantity: product.stockQuantity ?? 0,
    lowStockThreshold: product.lowStockThreshold ?? 5,
  })
  selectedImageFile.value = null
  imagePreview.value = resolveUploadUrl(product.imageUrl)
  hasSavedImage.value = Boolean(product.imageUrl)
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

  selectedImageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

const uploadProductImage = async (productId: number | string) => {
  if (!selectedImageFile.value) return

  const config = useRuntimeConfig()
  const formData = new FormData()
  formData.append("file", selectedImageFile.value)

  await $fetch(`/api/products/${productId}/image`, {
    baseURL: config.public.apiBase as string,
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })

  selectedImageFile.value = null
  hasSavedImage.value = true
}

const handleRemoveImage = async () => {
  if (!hasSavedImage.value || !editingId.value) {
    resetImageState()
    return
  }

  try {
    loading.value = true
    const { $api } = useNuxtApp()
    await $api(`/api/products/${editingId.value}/image`, { method: "DELETE" })
    resetImageState()
    notifyDeleted("imagen del producto")
  } catch (err) {
    notifyError(err, "eliminar la imagen")
  } finally {
    loading.value = false
  }
}

const handleOpenDelete = (product: Product) => {
  showDeleteDialog.value = true
  productToRemove.value = product
}

const openStockDialog = (product: Product) => {
  stockDialogProduct.value = product
  showStockDialog.value = true
}

const handleStockUpdated = (updated: Product) => {
  const index = products.value.findIndex((p) => p.id === updated.id)
  if (index !== -1) {
    products.value[index] = { ...products.value[index], stockQuantity: updated.stockQuantity }
  }
  stockDialogProduct.value = updated
}

const handleCloseProductForm = () => {
  formMode.value = null
  editingId.value = undefined
}

const handleCreateProduct = async (product: Product) => {
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    const created = await $api("/api/products", {
      method: "POST",
      body: {
        name: product.name,
        description: product.description,
        longDescription: product.longDescription,
        isActive: product.isActive,
        price: product.price,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        categoryId: props.dataModalForm.rowId,
      },
    })
    notifyCreated("producto")
    return created
  } catch (err) {
    notifyError(err, "crear el producto")
    return null
  } finally {
    loading.value = false
  }
}

const handleUpdateProduct = async (product: Product) => {
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    await $api(`/api/products/${product.id}`, {
      method: "PUT",
      body: {
        name: product.name,
        description: product.description,
        longDescription: product.longDescription,
        isActive: product.isActive,
        price: product.price,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
      },
    })
    notifyUpdated("producto")
    return true
  } catch (err) {
    notifyError(err, "actualizar el producto")
    return false
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await productFormRef.value?.validate()
  if (!valid.valid) return

  if (formMode.value === "create") {
    const created = await handleCreateProduct(productFormData)
    if (created) {
      let finalProduct = created as Product
      if (selectedImageFile.value && finalProduct.id != null) {
        try {
          await uploadProductImage(finalProduct.id)
          finalProduct = { ...finalProduct, imageUrl: imagePreview.value }
        } catch (err) {
          notifyError(err, "subir la imagen del producto")
        }
      }
      products.value.push(finalProduct)
      handleCloseProductForm()
    }
    return
  }

  if (formMode.value === "edit" && editingId.value) {
    const updated = await handleUpdateProduct(productFormData)
    if (updated) {
      if (selectedImageFile.value) {
        try {
          await uploadProductImage(editingId.value)
          productFormData.imageUrl = imagePreview.value
        } catch (err) {
          notifyError(err, "subir la imagen del producto")
        }
      }
      const index = products.value.findIndex((p) => p.id === editingId.value)
      if (index !== -1) {
        products.value[index] = { ...products.value[index], ...productFormData }
      }
      handleCloseProductForm()
    }
  }
}

const handleDelete = async () => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    await $api(`/api/products/${productToRemove.value?.id}`, {
      method: "DELETE",
    })
    products.value = products.value.filter(
      (p) => p.id !== productToRemove.value?.id
    )
    notifyDeleted("producto")
  } catch (err) {
    notifyError(err, "eliminar el producto")
  } finally {
    loading.value = false
    showDeleteDialog.value = false
  }
}
</script>

<style scoped>
.product-image {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.product-image__box-wrap {
  position: relative;
  display: inline-flex;
}

.product-image__trigger {
  position: relative;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
}

.product-image__trigger:disabled {
  cursor: default;
  opacity: 0.6;
}

.product-image__box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  width: 80px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}

.product-image__img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.product-image__remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgb(var(--v-theme-surface));
  border-radius: 999px;
  background: rgb(var(--v-theme-error));
  color: #fff;
  cursor: pointer;
}

.product-image__remove:disabled {
  cursor: default;
  opacity: 0.6;
}

.product-image__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.product-image__trigger:hover .product-image__overlay,
.product-image__trigger:focus-visible .product-image__overlay {
  opacity: 1;
}

.product-image__input {
  display: none;
}
</style>
