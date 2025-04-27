<template>
    <div v-if="isOpen" class="modal-overlay" @click="close">
        <div class="modal-content" @click.stop>
            <button class="close-button" @click="close">&times;</button>

            <div v-if="currentScan" class="scan-result">
                <div class="product-image" v-if="currentScan.image">
                    <img :src="currentScan.image" :alt="currentScan.name">
                </div>

                <div class="product-info">
                    <h2>{{ currentScan.name }}</h2>
                    <p class="barcode">Штрих-код: {{ currentScan.barcode }}</p>

                    <div class="details">
                        <div class="detail-item" v-if="currentScan.brand">
                            <span class="label">Бренд:</span>
                            <span>{{ currentScan.brand }}</span>
                        </div>
                        <div class="detail-item" v-if="currentScan.category">
                            <span class="label">Категория:</span>
                            <span>{{ currentScan.category }}</span>
                        </div>
                        <div class="detail-item" v-if="currentScan.weight">
                            <span class="label">Вес:</span>
                            <span>{{ currentScan.weight }}</span>
                        </div>
                        <div class="detail-item" v-if="currentScan.price">
                            <span class="label">Цена:</span>
                            <span>{{ currentScan.price }} ₸</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="no-result">
                Нет данных для отображения
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScanStore } from '~/stores/scan'

const store = useScanStore()
const isOpen = ref(false)

const currentScan = computed(() => store.currentScan)

const open = () => {
    isOpen.value = true
}

const close = () => {
    isOpen.value = false
    store.setCurrentScan(null)
}

defineExpose({
    open,
    close
})
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 90%;
    width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
}

.close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.close-button:hover {
    background-color: #f0f0f0;
}

.scan-result {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.product-image {
    width: 100%;
    height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f8f9fa;
    border-radius: 4px;
    overflow: hidden;
}

.product-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.product-info h2 {
    margin: 0 0 10px 0;
    font-size: 1.5rem;
    color: #333;
}

.barcode {
    color: #666;
    margin-bottom: 20px;
    font-size: 0.9rem;
}

.details {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
}

.detail-item:last-child {
    border-bottom: none;
}

.label {
    color: #666;
    font-weight: 500;
}

.no-result {
    text-align: center;
    color: #666;
    padding: 20px;
}
</style>