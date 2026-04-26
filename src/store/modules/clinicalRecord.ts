import { defineStore } from 'pinia'
import type { ClinicalRecord } from '~/interfaces/clinicalRecordInterfaces';

export const useClinicalRecordsStore = defineStore('clinical-records', {
    state: () => ({
        list: [] as ClinicalRecord[],
        loading: false,
    }),

    actions: {
        async fetchClinicalRecords() {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const res: any = await $api('/api/clinical-records', {
                    method: 'GET',
                })
                this.list = res
            } catch (err) {
                console.error('Error al obtener historiales clínicos:', err)
            } finally {
                this.loading = false
            }
        },
    },
})