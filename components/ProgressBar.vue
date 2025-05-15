<template>
    <div v-if="isGlobalLoading" class="progress-bar-global"></div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore } from '~/stores/ui'
const uiStore = useUiStore()
const { isGlobalLoading } = storeToRefs(uiStore)
</script>

<style scoped>
.progress-bar-global {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #4ec16e 0%, #18863b 100%);
    animation: progress-bar-anim 1.2s linear infinite;
    z-index: 9999;
    border-radius: 0 0 4px 4px;
}

@keyframes progress-bar-anim {
    0% {
        width: 0;
    }

    100% {
        width: 100vw;
    }
}
</style>