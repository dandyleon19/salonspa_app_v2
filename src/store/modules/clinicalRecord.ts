import { defineStore } from 'pinia'
import type { ClinicalRecord } from '~/interfaces/clinicalRecordInterfaces';
import type { PageResponse } from '~/interfaces/PageResponse';

export const useClinicalRecordsStore = defineStore('clinical-records', {
    state: () => ({
        data: null as PageResponse<ClinicalRecord> | null,
        loading: true,
    }),

    actions: {
        async fetchClinicalRecords(page = 0, size = 10) {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                this.data = await $api<PageResponse<ClinicalRecord>>('/api/clinical-records', {
                    method: 'GET',
                    query: { page, size },
                })
            } catch (err) {
                console.error('Error al obtener historiales clínicos:', err)
            } finally {
                this.loading = false
            }
        },

        async fetchClinicalRecordById(id: number | string) {
            const { $api } = useNuxtApp()
            return $api<ClinicalRecord>(`/api/clinical-records/${id}`, {
                method: 'GET',
            })
        },
    },
})
