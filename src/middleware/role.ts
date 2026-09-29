import { useAuthStore} from "~/store/modules/auth";

export default defineNuxtRouteMiddleware((to) => {
    const allowedRoles = to.meta.allowedRoles as string[] | undefined;
    if ( !allowedRoles || allowedRoles.length === 0 ) return;

    const authstore = useAuthStore();
    const role = authstore.role;

    if (!role || !allowedRoles.includes(role)) {
        return navigateTo("/app");
    }
})