<template>
    <nav class="bottom-nav">
        <NuxtLink to="/" class="nav-item" :class="{ active: route.path === '/' }">
            <i class="fa-solid fa-barcode"></i>
            <span>Сканер</span>
        </NuxtLink>
        <NuxtLink to="/history" class="nav-item" :class="{ active: route.path === '/history' }">
            <i class="fa-solid fa-clock-rotate-left"></i>
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
    font-weight: bold;
}

.nav-item svg {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
    stroke: currentColor;
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