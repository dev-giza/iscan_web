<template>
    <nav class="bottom-nav">
        <NuxtLink to="/" class="nav-item" :class="{ active: route.path === '/' }">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span>Сканер</span>
        </NuxtLink>
        <NuxtLink to="/history" class="nav-item" :class="{ active: route.path === '/history' }">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path
                    d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                </path>
            </svg>
            <span>История</span>
        </NuxtLink>
    </nav>
</template>

<script setup>
const route = useRoute()
</script>

<style scoped>
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 1000;
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.3s ease;
    padding: 8px 16px;
}

.nav-item svg {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
}

.nav-item span {
    font-size: 12px;
    font-weight: 500;
}

.nav-item.active {
    color: #fff;
}

.nav-item:hover {
    color: #fff;
}

/* Для iOS безопасной зоны */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
    .bottom-nav {
        height: calc(60px + env(safe-area-inset-bottom));
        padding-bottom: env(safe-area-inset-bottom);
    }
}
</style>