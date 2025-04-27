<template>
    <div class="history-page">
        <h1>История сканирований</h1>

        <div v-if="history.length === 0" class="empty-state">
            История пуста
        </div>

        <div v-else class="history-list">
            <div v-for="scan in history" :key="scan.barcode" class="history-item" @click="showDetails(scan)">
                <div class="product-info">
                    <h3>{{ scan.name }}</h3>
                    <p class="barcode">{{ scan.barcode }}</p>
                </div>
                <div v-if="scan.image" class="product-image">
                    <img :src="scan.image" alt="Изображение продукта">
                </div>
            </div>
        </div>

        <ScanModal ref="modalRef" />
    </div>
</template>

<script setup lang="ts">
import { useScanStore } from '~/stores/scan'

const store = useScanStore()
const history = computed(() => store.scanHistory)
const modalRef = ref()

const showDetails = (scan: any) => {
    store.setCurrentScan(scan)
    modalRef.value?.open()
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
}
</script>

<style scoped>
.history-page {
    padding: 20px;
    padding-bottom: 80px;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
}

.history-list {
    max-width: 800px;
    margin: 0 auto;
}

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    margin: 10px 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s;
}

.history-item:hover {
    transform: translateY(-2px);
}

.product-info {
    flex: 1;
}

.product-info h3 {
    margin: 0 0 5px;
    font-size: 16px;
}

.barcode {
    color: #666;
    margin: 0;
    font-size: 14px;
}

.timestamp {
    color: #999;
    margin: 5px 0 0;
    font-size: 12px;
}

.product-image {
    width: 60px;
    height: 60px;
    margin-left: 15px;
    flex-shrink: 0;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
}
</style>