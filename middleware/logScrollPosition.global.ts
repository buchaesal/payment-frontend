export default defineNuxtRouteMiddleware((to, from) => {
    if (window) {
        const scrollPosition = window.scrollY;
        console.log('이전 페이지의 스크롤 위치:', scrollPosition);
    }
})