import { defineStore } from 'pinia'
import type { ProductCategory } from "~/interfaces/productCategoryInterfaces";
import type { PageResponse } from "~/interfaces/PageResponse";
import { normalizeTableSearch } from "~/helpers/tableSearchHelpers"

export const useProductCategoriesStore = defineStore('product-categories', {
    state: () => ({
        data: null as PageResponse<ProductCategory> | null,
        loading: true,
    }),

    actions: {
        async fetchProductCategories(page = 0, size = 10, search = "") {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const query: Record<string, number | string> = {
                    page,
                    size,
                }

                const normalizedSearch = normalizeTableSearch(search)
                if (normalizedSearch) {
                    query.search = normalizedSearch
                }

                this.data = await $api<PageResponse<ProductCategory>>('/api/product-categories', {
                    method: 'GET',
                    query,
                })
            } catch (err) {
                console.error('Error al obtener categorías de productos:', err)
            } finally {
                this.loading = false
            }
        },
    },
})
