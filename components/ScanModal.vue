<template>
    <div v-if="isOpen" class="modal-overlay" @click="close">
        <div class="modal-content" @click.stop>
            <button class="close-button" @click="close">&times;</button>

            <div v-if="currentScan" class="scan-result">
                <div class="product-header">
                    <div class="product-image" v-if="currentScan?.image_front">
                        <img :src="currentScan.image_front" :alt="currentScan.product_name">
                    </div>

                    <div class="product-info">
                        <h2>{{ currentScan?.product_name || 'Без названия' }}</h2>
                        <p class="barcode">Штрих-код: {{ currentScan?.barcode }}</p>
                        <p v-if="currentScan?.manufacturer && currentScan.manufacturer !== 'null'" class="manufacturer">
                            Производитель: {{ currentScan.manufacturer }}
                        </p>
                    </div>
                </div>

                <!-- Оценка продукта -->
                <div v-if="typeof currentScan?.score === 'number'" class="score-section">
                    <div class="score-circle" :class="getScoreClass(currentScan.score)">
                        {{ Math.round(currentScan.score) }}
                    </div>
                    <p class="score-explanation" v-if="currentScan?.extra?.explanation_score">
                        {{ currentScan.extra.explanation_score }}
                    </p>
                </div>

                <!-- Пищевая ценность -->
                <div v-if="currentScan?.nutrition" class="nutrition-section">
                    <h3>Пищевая ценность на 100г:</h3>
                    <div class="nutrition-grid">
                        <div class="nutrition-item">
                            <span class="value">{{ currentScan.nutrition.calories }}</span>
                            <span class="label">ккал</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="value">{{ currentScan.nutrition.proteins }}г</span>
                            <span class="label">белки</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="value">{{ currentScan.nutrition.fats }}г</span>
                            <span class="label">жиры</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="value">{{ currentScan.nutrition.carbohydrates }}г</span>
                            <span class="label">углеводы</span>
                        </div>
                    </div>
                </div>

                <!-- Аллергены -->
                <div v-if="currentScan?.allergens" class="allergens-section">
                    <h3>Аллергены:</h3>
                    <p>{{ currentScan.allergens }}</p>
                </div>

                <!-- Вредные компоненты -->
                <div v-if="currentScan?.extra?.harmful_components" class="harmful-section">
                    <h3>Потенциально вредные компоненты:</h3>
                    <div class="harmful-component" v-for="(component, index) in currentScan.extra.harmful_components"
                        :key="index">
                        <h4>{{ component.name }}</h4>
                        <p class="effect">{{ component.effect }}</p>
                        <p class="recommendation">{{ component.recommendation }}</p>
                    </div>
                </div>

                <!-- Рекомендации -->
                <div v-if="currentScan?.extra" class="recommendations-section">
                    <div v-if="currentScan.extra.recommendedfor" class="recommendation-item">
                        <h3>Рекомендуется для:</h3>
                        <p>{{ currentScan.extra.recommendedfor }}</p>
                    </div>
                    <div v-if="currentScan.extra.frequency" class="recommendation-item">
                        <h3>Рекомендуемая частота употребления:</h3>
                        <p>{{ currentScan.extra.frequency }}</p>
                    </div>
                    <div v-if="currentScan.extra.alternatives" class="recommendation-item">
                        <h3>Альтернативы:</h3>
                        <p>{{ currentScan.extra.alternatives }}</p>
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
import { ref, computed, watch } from 'vue'
import { useScanStore } from '~/stores/scan'

const emit = defineEmits(['close'])
const store = useScanStore()
const isOpen = ref(false)

const currentScan = computed(() => {
    console.log('Store currentScan:', store.currentScan)
    return store.currentScan
})

watch(currentScan, (newVal) => {
    console.log('currentScan changed:', newVal)
}, { deep: true })

const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-high'
    if (score >= 50) return 'score-medium'
    return 'score-low'
}

const open = () => {
    isOpen.value = true
}

const close = () => {
    isOpen.value = false
    store.setCurrentScan(null)
    emit('close')
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
    background-color: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 20px;
    z-index: 1000;
    overflow-y: auto;
}

.modal-content {
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 90%;
    width: 600px;
    margin: auto;
    position: relative;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.close-button {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #333;
    padding: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.close-button:hover {
    background-color: rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
}

.scan-result {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.product-header {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
}

.product-image {
    width: 180px;
    height: 180px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f8f9fa;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.product-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.product-info {
    flex-grow: 1;
}

.product-info h2 {
    margin: 0 0 12px 0;
    font-size: 1.8rem;
    color: #333;
    line-height: 1.2;
}

.barcode {
    color: #666;
    margin-bottom: 12px;
    font-size: 1rem;
    background: #f8f9fa;
    padding: 8px 12px;
    border-radius: 6px;
    display: inline-block;
}

.manufacturer {
    color: #666;
    font-size: 1rem;
    margin: 0;
}

.score-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: #f8f9fa;
    border-radius: 12px;
    text-align: center;
}

.score-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s ease;
}

.score-circle:hover {
    transform: scale(1.05);
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

.score-explanation {
    text-align: center;
    margin: 0;
    color: #666;
    font-size: 1.1rem;
    line-height: 1.5;
}

.nutrition-section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nutrition-section h3 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 1.4rem;
}

.nutrition-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.nutrition-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    transition: transform 0.2s ease;
}

.nutrition-item:hover {
    transform: translateY(-2px);
}

.nutrition-item .value {
    font-size: 1.4rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 4px;
}

.nutrition-item .label {
    font-size: 1rem;
    color: #666;
}

.allergens-section,
.harmful-section,
.recommendations-section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.allergens-section h3,
.harmful-section h3,
.recommendations-section h3 {
    margin: 0 0 16px 0;
    color: #333;
    font-size: 1.4rem;
}

.harmful-component {
    margin-bottom: 20px;
    padding: 16px;
    background: #fff5f5;
    border-radius: 8px;
    border-left: 4px solid #dc3545;
}

.harmful-component:last-child {
    margin-bottom: 0;
}

.harmful-component h4 {
    margin: 0 0 12px 0;
    color: #dc3545;
    font-size: 1.2rem;
}

.harmful-component p {
    margin: 8px 0;
    font-size: 1rem;
    line-height: 1.5;
}

.harmful-component .effect {
    color: #666;
}

.harmful-component .recommendation {
    color: #28a745;
    font-style: italic;
    border-top: 1px solid rgba(40, 167, 69, 0.2);
    padding-top: 8px;
    margin-top: 8px;
}

.recommendation-item {
    margin-bottom: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
}

.recommendation-item:last-child {
    margin-bottom: 0;
}

.recommendation-item h3 {
    font-size: 1.2rem;
    margin: 0 0 12px 0;
    color: #333;
}

.recommendation-item p {
    margin: 0;
    color: #666;
    line-height: 1.5;
}

.no-result {
    text-align: center;
    color: #666;
    padding: 40px 20px;
    font-size: 1.2rem;
}

.debug-info {
    display: none;
    /* Скрываем отладочную информацию */
}

@media (max-width: 640px) {
    .modal-overlay {
        padding: 12px;
    }

    .product-header {
        flex-direction: column;
    }

    .product-image {
        width: 100%;
        height: 200px;
    }

    .nutrition-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>