<template>
    <div class="loading-overlay">
        <div class="loading-content">
            <div class="scanner-animation">
                <div class="scanner-line"></div>
            </div>
            <p class="loading-text">{{ text }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    text: string
}>()
</script>

<style scoped>
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.loading-content {
    text-align: center;
}

.scanner-animation {
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    margin-bottom: 20px;
}

.scanner-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg,
            transparent 0%,
            #2196f3 20%,
            #2196f3 80%,
            transparent 100%);
    animation: scan 2s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(33, 150, 243, 0.8);
}

@keyframes scan {
    0% {
        top: 0;
    }

    50% {
        top: 200px;
    }

    100% {
        top: 0;
    }
}

.loading-text {
    color: white;
    font-size: 18px;
    margin: 0;
    font-weight: 500;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>