<template>
    <div class="history-page">
        <h1>История сканирований</h1>

        <div v-if="history.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <p>История пуста</p>
            <p class="empty-subtitle">Отсканируйте продукт, чтобы он появился здесь</p>
        </div>

        <div v-else class="history-list">
            <div v-for="scan in history" :key="scan.barcode" class="history-item" @click="showDetails(scan)">
                <div class="product-image" v-if="scan.image_front">
                    <img :src="scan.image_front.startsWith('/static/') ? `https://iscan.store${scan.image_front}` : scan.image_front"
                        :alt="scan.product_name">
                </div>
                <div class="product-info">
                    <h3>{{ scan.product_name }}</h3>
                    <p class="barcode">Штрих-код: {{ scan.barcode }}</p>
                    <div class="product-details">
                        <span v-if="scan.manufacturer && scan.manufacturer !== 'null'" class="manufacturer">
                            {{ scan.manufacturer }}
                        </span>
                        <div v-if="typeof scan.score === 'number'" class="score" :class="getScoreClass(scan.score)">
                            {{ Math.round(scan.score) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <ScanModal ref="modalRef" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useScanStore } from '~/stores/scan'

const store = useScanStore()
const history = computed(() => store.scanHistory)
const modalRef = ref()

onMounted(() => {
    store.loadHistoryFromStorage()
})

const showDetails = (scan: any) => {
    store.setCurrentScan(scan)
    modalRef.value?.open()
}

const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-high'
    if (score >= 50) return 'score-medium'
    return 'score-low'
}
</script>

<style scoped>
.history-page {
    padding: 24px;
    padding-bottom: 80px;
    max-width: 800px;
    margin: 0 auto;
}

.history-page h1 {
    font-size: 2rem;
    color: #333;
    margin-bottom: 24px;
    text-align: center;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.empty-subtitle {
    color: #999;
    margin-top: 8px;
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.history-item {
    display: flex;
    gap: 20px;
    padding: 20px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
}

.history-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-image {
    width: 100px;
    height: 100px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.product-info {
    flex: 1;
    min-width: 0;
    /* Для корректного переноса длинного текста */
}

.product-info h3 {
    margin: 0 0 8px;
    font-size: 1.2rem;
    color: #333;
    line-height: 1.3;
}

.barcode {
    color: #666;
    margin: 0 0 12px;
    font-size: 0.9rem;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
}

.product-details {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.manufacturer {
    color: #666;
    font-size: 0.9rem;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
}

.score {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: white;
    font-weight: bold;
    font-size: 0.9rem;
}

.score-high {
    background: linear-gradient(135deg, #28a745, #20c997);
}

.score-medium {
    background: linear-gradient(135deg, #ffc107, #fd7e14);
}

.score-low {
    background: linear-gradient(135deg, #dc3545, #c82333);
}

@media (max-width: 640px) {
    .history-page {
        padding: 16px;
    }

    .history-item {
        padding: 16px;
    }

    .product-image {
        width: 80px;
        height: 80px;
    }

    .product-info h3 {
        font-size: 1.1rem;
    }
}
</style>