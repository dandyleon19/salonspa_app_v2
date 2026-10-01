<template>
  <AppTable
      title="Categorías de Producto"
      subtitle="Lista de Categorías de Producto registradas"
      :headers="headers"
      :rowOptions="rowOptions"
      :filters="tableFilters"
      :items="productCategoriesList"
      :chip-columns="productCategoryChipColumns"
      :loading="loadingProductCategoriesList"
      :page="currentPage"
      :items-per-page="itemsPerPage"
      :total-items="totalItems"
      server-search
      @update:pagination="handlePagination"
      @handle-create-button="handleCreateButton"
      @handle-row-action-button="handleRowActionButton"
      @handle-update-search="handleApplySearch"
  />

  <AppDrawer
      v-model="openProductCategoryDrawer"
      title="Gestión de Categorías de Producto"
      :loading="loading"
      size="large"
      location="end"
      :temporary="true"
      @close="closeProductCategoryDrawer"
  >
    <ProductCategoryForm
        :data-modal-form="dataModalForm"
        @create="handleCreateProductCategory"
        @update="handleUpdateProductCategory"
    />
  </AppDrawer>

  <AppDrawer
      v-model="openProductDrawer"
      title="Gestión de Productos"
      :loading="loading"
      size="large"
      location="end"
      :temporary="true"
      @close="closeProductCategoryDrawer"
  >
    <ManageProducts
        :data-modal-form="dataModalForm"
    />
  </AppDrawer>

  <ConfirmationModal
      v-model="showDeleteDialog"
      title="Eliminar categoría"
      message="¿Deseas eliminar esta categoría de producto? Esta acción no se puede deshacer."
      :require-text="false"
      @confirm="handleDeleteProductCategory"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FilterOption, TableChipColumn, TableHeader, TableRowOption } from "~/interfaces/tableInterfaces";
import type { ProductCategory, productCategoryDataModalForm } from "~/interfaces/productCategoryInterfaces";
import {
  formatProductCategoryProductsCount,
  getProductCategoryProductsCount,
} from "~/interfaces/productCategoryInterfaces";
import { useProductCategoriesStore } from "~/store";
import ManageProducts from "~/components/app/product-categories/ManageProducts.vue";
import {
  areTableSearchEqual,
  normalizeTableSearch,
} from "~/helpers/tableSearchHelpers";

definePageMeta({
  layout: 'app',
  middleware: 'role',
  allowedRoles: ['ADMIN_USER'],
})

// Composables
const productCategoriesStore = useProductCategoriesStore();

// Variables
const loading = ref<boolean>(false);
const openProductCategoryDrawer = ref<boolean>(false);
const openProductDrawer = ref<boolean>(false)
const showDeleteDialog = ref<boolean>(false)
const productCategoryToRemove = ref<ProductCategory>()
const currentPage = ref(1)
const itemsPerPage = ref(10)
const activeSearch = ref("")

const headers = ref<Array<TableHeader>>([
  { title: "ID", key: "id" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Descripción Larga", key: "longDescription" },
  { title: "Productos", key: "productsCountLabel" },
  { title: "Acciones", key: "actions", sortable: false },
]);

const productCategoryChipColumns: TableChipColumn[] = [
  {
    key: "productsCountLabel",
    color: "primary",
    icon: "tabler:package",
  },
];

const rowOptions = ref<Array<TableRowOption>>([
  {
    action: 'update',
    color: 'primary',
    icon: 'tabler:pencil',
  },
  {
    action: 'products',
    color: 'primary',
    icon: 'tabler:git-branch',
  },
  {
    action: 'delete',
    color: 'error',
    icon: 'tabler:trash',
  },
]);

const tableFilters = ref<FilterOption[]>([]);

const dataModalForm = ref<productCategoryDataModalForm>({
  action: "create",
});

// Computed
const productCategoriesList = computed(() => {
  return (productCategoriesStore.data?.content ?? []).map((category: ProductCategory) => {
    const productsCount = getProductCategoryProductsCount(category)

    return {
      ...category,
      productsCount,
      productsCountLabel: formatProductCategoryProductsCount(productsCount),
    }
  });
});

const totalItems = computed(() => {
  return productCategoriesStore.data?.totalElements ?? 0
})

const loadingProductCategoriesList = computed(() => {
  return productCategoriesStore.loading;
});

const fetchProductCategories = async () => {
  await productCategoriesStore.fetchProductCategories(
    currentPage.value - 1,
    itemsPerPage.value,
    activeSearch.value
  )
}

const handleApplySearch = (value: string) => {
  const nextSearch = normalizeTableSearch(value)

  if (areTableSearchEqual(activeSearch.value, nextSearch)) {
    return
  }

  activeSearch.value = nextSearch
  currentPage.value = 1
  fetchProductCategories()
}

// Methods
const handleCreateButton = (): void => {
  dataModalForm.value.action = 'create'
  openProductCategoryDrawer.value = true;
};

const handleRowActionButton = (productCategory: ProductCategory, action: string): void => {
  switch (action) {
    case 'update':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = productCategory.id
      openProductCategoryDrawer.value = true;
      break;

    case 'products':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = productCategory.id
      dataModalForm.value.products = productCategory.products
      openProductDrawer.value = true
      break;

    case 'delete':
      showDeleteDialog.value = true
      productCategoryToRemove.value = productCategory
      break;

    default:
      break;
  }
};

const closeProductCategoryDrawer = () => {
  openProductCategoryDrawer.value = false;
  openProductDrawer.value = false;
  fetchProductCategories();
};

const { notifyCreated, notifyUpdated, notifyDeleted, notifyError } = useApiNotification()

const handleCreateProductCategory = async (productCategory: ProductCategory) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api("/api/product-categories", {
      method: "POST",
      body: { ...productCategory },
    });
    notifyCreated("categoría de producto");
    closeProductCategoryDrawer();
  } catch (err) {
    notifyError(err, "crear la categoría de producto");
  } finally {
    loading.value = false;
  }
};

const handleUpdateProductCategory = async (productCategory: ProductCategory) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/product-categories/${productCategory.id}`, {
      method: "PUT",
      body: {
        name: productCategory.name,
        description: productCategory.description,
        longDescription: productCategory.longDescription,
      },
    });
    notifyUpdated("categoría de producto");
    closeProductCategoryDrawer();
  } catch (err) {
    notifyError(err, "actualizar la categoría de producto");
  } finally {
    loading.value = false;
  }
};

const handleDeleteProductCategory = async () => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/product-categories/${productCategoryToRemove.value?.id}`, {
      method: "DELETE",
    });
    notifyDeleted("categoría de producto");
    await fetchProductCategories();
  } catch (err) {
    notifyError(err, "eliminar la categoría de producto");
  } finally {
    loading.value = false;
  }
}

const handlePagination = async ({
  page,
  itemsPerPage: newItemsPerPage,
}: {
  page: number
  itemsPerPage: number
}) => {
  currentPage.value = page
  itemsPerPage.value = newItemsPerPage

  await fetchProductCategories()
}

// Mounted
onMounted(() => {
  fetchProductCategories();
});
</script>
