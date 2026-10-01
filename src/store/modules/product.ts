import { defineStore } from 'pinia'
import type { Product } from "~/interfaces/productInterfaces"
import type { PageResponse } from "~/interfaces/PageResponse"

function normalizeProductsResponse(res: unknown): Product[] {
    if (Array.isArray(res)) {
        return res
    }

    if (res && typeof res === "object" && "content" in res) {
        return (res as PageResponse<Product>).content ?? []
    }

    return []
}

export const useProductsStore = defineStore('product', {
    state: () => ({
        list: [] as Product[],
        loading: false,
    }),

    getters: {
        products: (state): Product[] => normalizeProductsResponse(state.list),
    },

    actions: {
        async fetchProducts(page = 0, size = 100) {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const res = await $api<Product[] | PageResponse<Product>>('/api/products', {
                    method: 'GET',
                    query: { page, size },
                })
                this.list = normalizeProductsResponse(res)
            } catch (err) {
                console.error('Error al obtener productos:', err)
                this.list = []
            } finally {
                this.loading = false
            }
        },
    },
})
