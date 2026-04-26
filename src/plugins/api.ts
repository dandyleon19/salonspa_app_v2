export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    const api = $fetch.create({
        baseURL: config.public.apiBase,
        headers: {
            'Content-Type': 'application/json'
        },
        onRequest ({options}) {
            const token : string | null | undefined = useCookie('access_token').value
            if (token) {
                options.headers = {
                    ...options.headers,
                    Authorization: `Bearer ${token}`
                }
            }
        },
        onResponse ({response}) {
            // console.log('API Response:', response._data)
        },
        onResponseError ({response}) {
            // console.error('API Error:', response.status, response._data)
        }
    })

    return {
        provide: {
            api
        }
    }
})