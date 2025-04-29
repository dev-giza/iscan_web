<template>
    <nav class="bottom-nav">
        <NuxtLink to="/" class="nav-item" :class="{ active: route.path === '/' }">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Сканер</span>
        </NuxtLink>
        <NuxtLink to="/history" class="nav-item" :class="{ active: route.path === '/history' }">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
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
    stroke: currentColor;
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