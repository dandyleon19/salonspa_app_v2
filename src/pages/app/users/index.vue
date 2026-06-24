<template>
  <AppTable
    title="Usuarios"
    subtitle="Lista de usuarios registrados"
    :headers="headers"
    :row-options="rowOptions"
    :get-row-options="getUserRowOptions"
    :filters="tableFilters"
    :items="usersList"
    :chip-columns="userChipColumns"
    :loading="loadingUsersList"
    :page="currentPage"
    :items-per-page="itemsPerPage"
    :total-items="totalItems"
    server-search
    @update:pagination="handlePagination"
    @handle-create-button="handleCreateButton"
    @handle-export-button="handleExportData"
    @handle-row-action-button="handleRowActionButton"
    @handle-update-filters="handleApplyFilters"
    @handle-update-search="handleApplySearch"
  />

  <AppDrawer
    v-model="openUserDrawer"
    title="Gestión de Usuarios"
    :loading="loading"
    size="large"
    location="end"
    :temporary="true"
    @close="closeUserDrawer"
  >
    <UserForm
      :data-modal-form="dataModalForm"
      @create="handleCreateUser"
      @update="handleUpdateUser"
      @change-password="handleChangePassword"
      @change-branch-offices="handleChangeBranchOffices"
    />
  </AppDrawer>

  <UserActionModal
    v-model="showUserActionDialog"
    :action="pendingUserAction?.action"
    :user-summary="pendingUserSummary"
    @confirm="handleConfirmUserAction"
  />

  <UserRoleChangeModal
    v-model="showUserRoleDialog"
    :current-role="userForRoleChange?.role"
    :user-summary="roleChangeUserSummary"
    @confirm="handleConfirmRoleChange"
  />

  <ConfirmationModal
    v-model="showDeleteDialog"
    title="Eliminar usuario"
    message="¿Deseas eliminar este usuario? Esta acción no se puede deshacer."
    :require-text="false"
    @confirm="handleDeleteUser"
  />
</template>

<script setup lang="ts">
import { ref } from "vue"
import type {
  FilterOption,
  TableChipColumn,
  TableHeader,
  TableRowOption,
} from "~/interfaces/tableInterfaces"
import type {
  User,
  UserFilters,
  UserRole,
  UserTableAction,
  userDataModalForm,
} from "~/interfaces/userInterfaces"
import {
  USER_ROLE_FILTER_OPTIONS,
  getUserActionColor,
  getUserActionIcon,
  getUserActionLabel,
  getUserRoleColor,
  getUserRoleLabel,
  getUserStatusColor,
  getUserStatusLabel,
  getUserTableActions,
} from "~/interfaces/userInterfaces"
import {
  areUserFiltersEqual,
  buildUpdateUserPayload,
  normalizeUserFilters,
} from "~/helpers/userHelpers"
import { normalizeTableSearch } from "~/helpers/tableSearchHelpers"
import { useUsersStore } from "~/store"

definePageMeta({
  layout: "app",
})

const usersStore = useUsersStore()

const loading = ref(false)
const openUserDrawer = ref(false)
const showDeleteDialog = ref(false)
const showUserActionDialog = ref(false)
const showUserRoleDialog = ref(false)
const userToRemove = ref<User>()
const userForRoleChange = ref<User>()
const pendingUserAction = ref<{
  user: User
  action: UserTableAction
} | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const activeFilters = ref<UserFilters>({})

const headers = ref<TableHeader[]>([
  { title: "ID", key: "id" },
  { title: "Nombre", key: "fullName" },
  { title: "Email", key: "email" },
  { title: "Rol", key: "roleLabel" },
  { title: "Estado", key: "statusLabel" },
  { title: "% Comisión", key: "commissionPercentageLabel" },
  { title: "Acciones", key: "actions", sortable: false },
])

const userChipColumns: TableChipColumn[] = [
  {
    key: "roleLabel",
    color: (item) => getUserRoleColor(item.role),
  },
  {
    key: "statusLabel",
    color: (item) => getUserStatusColor(item.isActive),
  },
]

const rowOptions: TableRowOption[] = []

const getUserRowOptions = (item: User & { tableActions?: UserTableAction[] }) => {
  const dynamicActions: TableRowOption[] = (item.tableActions ?? []).map(
    (action) => ({
      action,
      icon: getUserActionIcon(action),
      color: getUserActionColor(action),
      title: getUserActionLabel(action),
    })
  )

  return [
    ...dynamicActions,
    {
      action: "update",
      color: "primary",
      icon: "mdi-pencil",
      title: "Editar",
    },
    {
      action: "changePassword",
      color: "warning",
      icon: "mdi-lock-reset",
      title: "Cambiar contraseña",
    },
    {
      action: "delete",
      color: "error",
      icon: "mdi-delete",
      title: "Eliminar",
    },
  ]
}

const tableFilters = ref<FilterOption[]>([
  {
    type: "select",
    label: "Estado",
    key: "isActive",
    items: [
      { title: "Activo", value: "true" },
      { title: "Inactivo", value: "false" },
    ],
  },
  {
    type: "select",
    label: "Rol",
    key: "role",
    items: USER_ROLE_FILTER_OPTIONS.map((option) => ({
      title: option.label,
      value: option.value,
    })),
  },
])

const dataModalForm = ref<userDataModalForm>({
  action: "create",
})

const usersList = computed(() => {
  return (usersStore.data?.content ?? []).map((user: User) => ({
    ...user,
    fullName: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
    roleLabel: getUserRoleLabel(user.role),
    statusLabel: getUserStatusLabel(user.isActive),
    tableActions: getUserTableActions(user),
    commissionPercentageLabel:
      user.commissionPercentage != null && user.commissionPercentage !== ""
        ? `${user.commissionPercentage}%`
        : "—",
  }))
})

const pendingUserSummary = computed(() => {
  const pending = pendingUserAction.value
  if (!pending) return ""

  const name =
    pending.user.fullName ||
    `${pending.user.firstName} ${pending.user.lastName}`.trim()

  return `(${name})`
})

const roleChangeUserSummary = computed(() => {
  if (!userForRoleChange.value) return ""

  return (
    userForRoleChange.value.fullName ||
    `${userForRoleChange.value.firstName} ${userForRoleChange.value.lastName}`.trim()
  )
})

const totalItems = computed(() => usersStore.data?.totalElements ?? 0)
const loadingUsersList = computed(() => usersStore.loading)

const fetchUsers = async () => {
  await usersStore.fetchUsers(
    currentPage.value - 1,
    itemsPerPage.value,
    activeFilters.value
  )
}

const handleCreateButton = () => {
  dataModalForm.value.action = "create"
  openUserDrawer.value = true
}

const handleExportData = () => {
  console.log("Exportar")
}

const handleRowActionButton = (user: User, action: string) => {
  if (action === "role:change") {
    userForRoleChange.value = user
    showUserRoleDialog.value = true
    return
  }

  if (action.startsWith("status:")) {
    pendingUserAction.value = {
      user,
      action: action as UserTableAction,
    }
    showUserActionDialog.value = true
    return
  }

  switch (action) {
    case "update":
    case "changePassword":
      dataModalForm.value.action = action
      dataModalForm.value.rowId = user.id
      openUserDrawer.value = true
      break

    case "delete":
      userToRemove.value = user
      showDeleteDialog.value = true
      break

    default:
      break
  }
}

const handleApplyFilters = (values: Record<string, unknown>) => {
  const nextFilters = normalizeUserFilters(values)

  if (areUserFiltersEqual(activeFilters.value, nextFilters)) {
    return
  }

  activeFilters.value = {
    ...nextFilters,
    search: activeFilters.value.search,
  }
  currentPage.value = 1
  fetchUsers()
}

const handleApplySearch = (value: string) => {
  const nextSearch = normalizeTableSearch(value)
  const nextFilters: UserFilters = {
    ...activeFilters.value,
    search: nextSearch || undefined,
  }

  if (!nextSearch) {
    delete nextFilters.search
  }

  if (areUserFiltersEqual(activeFilters.value, nextFilters)) {
    return
  }

  activeFilters.value = nextFilters
  currentPage.value = 1
  fetchUsers()
}

const closeUserDrawer = () => {
  openUserDrawer.value = false
  fetchUsers()
}

const { notifyCreated, notifyUpdated, notifyDeleted, notifyError } =
  useApiNotification()

const applyUserAction = async (user: User, action: UserTableAction) => {
  if (!user.id) return

  let payload = buildUpdateUserPayload(user)

  if (action === "status:activate") {
    payload = buildUpdateUserPayload(user, { isActive: true })
  }

  if (action === "status:deactivate") {
    payload = buildUpdateUserPayload(user, { isActive: false })
  }

  await usersStore.updateUser(user.id, payload)
}

const handleConfirmRoleChange = async (role: UserRole) => {
  const user = userForRoleChange.value
  if (!user?.id) return

  try {
    loading.value = true
    await usersStore.updateUser(user.id, buildUpdateUserPayload(user, { role }))
    notifyUpdated("rol del usuario")
    await fetchUsers()
  } catch (err) {
    notifyError(err, "cambiar el rol del usuario")
  } finally {
    loading.value = false
    userForRoleChange.value = undefined
  }
}

watch(showUserRoleDialog, (open) => {
  if (!open) userForRoleChange.value = undefined
})

const handleConfirmUserAction = async () => {
  const pending = pendingUserAction.value
  if (!pending?.user.id) return

  try {
    loading.value = true
    await applyUserAction(pending.user, pending.action)
    notifyUpdated("usuario")
    await fetchUsers()
  } catch (err) {
    notifyError(err, "actualizar el usuario")
  } finally {
    loading.value = false
    pendingUserAction.value = null
  }
}

watch(showUserActionDialog, (open) => {
  if (!open) pendingUserAction.value = null
})

const handleCreateUser = async (user: User) => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    await $api("/api/auth/register", {
      method: "POST",
      body: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
        role: user.role ?? "STAFF_USER",
        commissionPercentage: Number(user.commissionPercentage),
      },
    })
    notifyCreated("usuario")
    closeUserDrawer()
  } catch (err) {
    notifyError(err, "crear el usuario")
  } finally {
    loading.value = false
  }
}

const handleUpdateUser = async (user: User) => {
  try {
    loading.value = true
    await usersStore.updateUser(user.id!, buildUpdateUserPayload(user))
    notifyUpdated("usuario")
    closeUserDrawer()
  } catch (err) {
    notifyError(err, "actualizar el usuario")
  } finally {
    loading.value = false
  }
}

const handleDeleteUser = async () => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    await $api(`/api/users/${userToRemove.value?.id}`, {
      method: "DELETE",
    })
    notifyDeleted("usuario")
    await fetchUsers()
  } catch (err) {
    notifyError(err, "eliminar el usuario")
  } finally {
    loading.value = false
  }
}

const handleChangePassword = () => {}

const handleChangeBranchOffices = () => {}

const handlePagination = async ({
  page,
  itemsPerPage: newItemsPerPage,
}: {
  page: number
  itemsPerPage: number
}) => {
  currentPage.value = page
  itemsPerPage.value = newItemsPerPage
  await fetchUsers()
}

onMounted(() => {
  fetchUsers()
})
</script>
