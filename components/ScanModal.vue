<template>
    <div v-if="isOpen" class="modal-overlay" @click="close">
        <div class="modal-card animated-modal" @click.stop>
            <button class="close-button" @click="close">&times;</button>
            <div v-if="currentScan" class="product-card">
                <div class="product-card-image-wrap">
                    <img v-if="currentScan?.image_front" :src="currentScan.image_front" :alt="currentScan.product_name"
                        class="product-card-image" />
                </div>
                <div class="product-card-content">
                    <h2 class="product-card-title">{{ currentScan?.product_name || 'Без названия' }}</h2>
                    <div class="product-card-date">
                        <i class="fa-regular fa-calendar"></i>
                        {{ formatRelativeDate(currentScan?.timestamp) }}
                    </div>
                    <div class="product-card-meta">
                        <span v-if="currentScan?.barcode" class="meta-item">
                            <i class="fa-solid fa-barcode"></i> {{ currentScan.barcode }}
                        </span>
                        <span v-if="currentScan?.manufacturer && currentScan.manufacturer !== 'null'" class="meta-item">
                            <i class="fa-solid fa-industry"></i> {{ currentScan.manufacturer }}
                        </span>
                    </div>
                    <div class="product-card-params-grid">
                        <div class="param-cell param-calories">
                            <i class="fa-solid fa-fire param-icon-calories"></i>
                            <div class="param-value">{{ currentScan?.nutrition?.calories ?? '—' }}</div>
                            <div class="param-label">Калории</div>
                        </div>
                        <div class="param-cell param-proteins">
                            <i class="fa-solid fa-drumstick-bite param-icon-proteins"></i>
                            <div class="param-value">{{ currentScan?.nutrition?.proteins ?? '—' }}</div>
                            <div class="param-label">Белки</div>
                        </div>
                        <div class="param-cell param-fats">
                            <i class="fa-solid fa-bacon param-icon-fats"></i>
                            <div class="param-value">{{ currentScan?.nutrition?.fats ?? '—' }}</div>
                            <div class="param-label">Жиры</div>
                        </div>
                        <div class="param-cell param-carbs">
                            <i class="fa-solid fa-bread-slice param-icon-carbs"></i>
                            <div class="param-value">{{ currentScan?.nutrition?.carbohydrates ?? '—' }}</div>
                            <div class="param-label">Углеводы</div>
                        </div>
                    </div>
                    <div class="product-card-status">
                        <span class="health-score-label">Оценка:</span>
                        <div class="health-score-bar">
                            <div class="health-score-bar-inner"
                                :style="{ width: healthScoreBarWidth, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }">
                            </div>
                        </div>
                        <span class="health-score-numeric">{{ typeof currentScan?.score === 'number' ? currentScan.score
                            : '—' }}/100</span>
                        <span class="health-score-value">{{ getScoreLabel(typeof currentScan?.score === 'number' ?
                            currentScan.score : undefined) }}</span>
                    </div>
                    <div v-if="currentScan?.extra?.explanation_score" class="score-explanation-block">
                        <i class="fa-regular fa-circle-question"></i>
                        <span>{{ currentScan.extra.explanation_score }}</span>
                    </div>
                    <div v-if="currentScan?.allergens" class="info-section allergens-section">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span><b>Аллергены:</b> {{ currentScan.allergens }}</span>
                    </div>
                    <div v-if="currentScan?.extra?.harmful_components && currentScan.extra.harmful_components.length > 0"
                        class="info-section harmful-section">
                        <i class="fa-solid fa-skull-crossbones"></i>
                        <span><b>Потенциально вредные компоненты:</b></span>
                    </div>
                    <div v-if="currentScan?.extra?.harmful_components && currentScan.extra.harmful_components.length > 0"
                        class="harmful-cards">
                        <div class="harmful-card" v-for="(component, index) in currentScan.extra.harmful_components"
                            :key="index">
                            <div class="harmful-title">{{ component.name }}</div>
                            <div class="harmful-effect">{{ component.effect }}</div>
                            <div v-if="component.recommendation" class="harmful-recommend">{{ component.recommendation
                            }}</div>
                        </div>
                    </div>
                    <div v-if="currentScan?.extra && (currentScan.extra.recommendedfor || currentScan.extra.frequency || currentScan.extra.alternatives)"
                        class="info-section recommendations-section">
                        <i class="fa-solid fa-lightbulb"></i>
                        <span><b>Рекомендации:</b></span>
                    </div>
                    <div v-if="currentScan?.extra && (currentScan.extra.recommendedfor || currentScan.extra.frequency || currentScan.extra.alternatives)"
                        class="recommend-cards">
                        <div v-if="currentScan.extra.recommendedfor" class="recommend-card">
                            <div class="recommend-label">Рекомендуется для:</div>
                            <div class="recommend-value">{{ currentScan.extra.recommendedfor }}</div>
                        </div>
                        <div v-if="currentScan.extra.frequency" class="recommend-card">
                            <div class="recommend-label">Частота:</div>
                            <div class="recommend-value">{{ currentScan.extra.frequency }}</div>
                        </div>
                        <div v-if="currentScan.extra.alternatives" class="recommend-card">
                            <div class="recommend-label">Альтернативы:</div>
                            <div class="recommend-value">{{ currentScan.extra.alternatives }}</div>
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useScanStore } from '~/stores/scan'

const emit = defineEmits(['close'])
const store = useScanStore()
const isOpen = ref(false)

const currentScan = computed(() => store.currentScan)

const healthScoreBarWidth = ref('0%')

watch(currentScan, async (newVal) => {
    if (newVal && typeof newVal.score === 'number') {
        await nextTick()
        healthScoreBarWidth.value = '0%'
        setTimeout(() => {
            healthScoreBarWidth.value = typeof newVal.score === 'number' ? Math.max(0, Math.min(100, newVal.score)) + '%' : '0%'
        }, 80)
    } else {
        healthScoreBarWidth.value = '0%'
    }
}, { immediate: true })

const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-high'
    if (score >= 50) return 'score-medium'
    return 'score-low'
}

const getScoreLabel = (score: number | undefined) => {
    if (typeof score !== 'number') return '—'
    if (score <= 25) return 'Плохое'
    if (score <= 50) return 'Слабое'
    if (score <= 75) return 'Хорошее'
    return 'Отличное'
}

function formatRelativeDate(timestamp?: number): string {
    if (!timestamp) return '—';
    const now = new Date();
    const date = new Date(Number(timestamp));
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'сегодня';
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 14) return 'неделю назад';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    if (diffDays < 60) return 'месяц назад';
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} мес. назад`;
    return `${Math.floor(diffDays / 365)} г. назад`;
}

const open = () => { isOpen.value = true }
const close = () => { isOpen.value = false; store.setCurrentScan(null); emit('close') }
defineExpose({ open, close })
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(30, 32, 50, 0.82);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 32px 8px 32px 8px;
    z-index: 1000;
    overflow-y: auto;
    animation: modal-fade-in 0.25s cubic-bezier(.4, 0, .2, 1);
}

@keyframes modal-fade-in {
    from {
        opacity: 0;
        transform: translateY(40px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.modal-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f3f6ff 100%);
    border-radius: 28px;
    box-shadow: 0 12px 48px rgba(60, 60, 120, 0.18), 0 2px 8px rgba(60, 60, 120, 0.08);
    max-width: 420px;
    width: 100%;
    margin: auto;
    position: relative;
    padding: 0 0 32px 0;
    overflow: hidden;
    animation: modal-fade-in 0.25s cubic-bezier(.4, 0, .2, 1);
}

.animated-modal {
    animation: modal-zoom-fade-in 0.55s cubic-bezier(.4, 0, .2, 1);
}

@keyframes modal-zoom-fade-in {
    from {
        opacity: 0;
        transform: scale(0.92) translateY(40px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.close-button {
    position: absolute;
    top: 18px;
    right: 18px;
    background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #b0b0c3;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s;
    z-index: 2;
    box-shadow: 0 2px 8px rgba(60, 60, 120, 0.08);
}

.close-button:hover {
    background: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%);
    color: #dc3545;
    transform: scale(1.12);
    box-shadow: 0 4px 18px rgba(60, 60, 120, 0.13);
}

.product-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 24px;
}

.product-card-image-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: 32px;
    margin-bottom: 18px;
}

.product-card-image {
    width: 160px;
    height: 160px;
    object-fit: cover;
    border-radius: 24px;
    box-shadow: 0 4px 24px rgba(60, 60, 120, 0.10);
    background: #f6f8fa;
}

.product-card-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
}

.product-card-title {
    font-size: 1.55rem;
    font-weight: 900;
    color: #23233a;
    text-align: center;
    margin: 0 0 4px 0;
    letter-spacing: 0.2px;
}

.product-card-date {
    color: #b0b0c3;
    font-size: 1.01rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
}

.product-card-date i {
    margin-right: 6px;
    font-size: 1em;
    color: #b0b0c3;
}

.product-card-meta {
    display: flex;
    gap: 18px;
    justify-content: center;
    margin: 4px 0 8px 0;
    color: #b0b0c3;
    font-size: 0.98rem;
}

.product-card-meta .meta-item i {
    margin-right: 4px;
    color: #b0b0c3;
}

.product-card-params-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 18px;
    width: 100%;
    margin: 12px 0 0 0;
}

.param-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 22px;
    padding: 16px 0 14px 0;
    box-shadow: 0 2px 10px rgba(60, 60, 120, 0.07);
    min-width: 0;
    transition: box-shadow 0.2s, transform 0.2s, border 0.2s;
    animation: fade-in 0.5s cubic-bezier(.4, 0, .2, 1);
    border: 2px solid transparent;
}

.param-cell:hover {
    box-shadow: 0 4px 18px rgba(60, 60, 120, 0.13), 0 0 0 4px #e0e7ff;
    transform: translateY(-2px) scale(1.04);
    border: 2px solid #e0e7ff;
}

.param-cell i {
    transition: transform 0.18s, color 0.18s;
}

.param-cell:hover i {
    transform: scale(1.18);
    filter: drop-shadow(0 2px 6px rgba(60, 60, 120, 0.10));
}

.param-cell.param-calories {
    background: #fff4e0;
}

.param-cell.param-proteins {
    background: #ffe6ea;
}

.param-cell.param-fats {
    background: #e6f0ff;
}

.param-cell.param-carbs {
    background: #f7f5e6;
}

.param-cell i.param-icon-calories {
    color: #ff9800;
}

.param-cell i.param-icon-proteins {
    color: #e57373;
}

.param-cell i.param-icon-fats {
    color: #42a5f5;
}

.param-cell i.param-icon-carbs {
    color: #bdb76b;
}

.param-value {
    font-size: 1.22rem;
    font-weight: 800;
    color: #23233a;
    margin-bottom: 2px;
    letter-spacing: 0.5px;
}

.param-label {
    font-size: 0.93rem;
    color: #a0a0b3;
    font-weight: 500;
    margin-top: 2px;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.product-card-status {
    width: 100%;
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: center;
}

.health-score-label {
    color: #b0b0c3;
    font-size: 1.01rem;
    font-weight: 600;
}

.health-score-bar {
    flex: 1;
    height: 10px;
    background: #f2f2f2;
    border-radius: 6px;
    overflow: hidden;
    margin: 0 8px;
    min-width: 80px;
    max-width: 160px;
}

.health-score-bar-inner {
    height: 100%;
    background: linear-gradient(90deg, #ff4e50, #ffe066 50%, #4ec16e 100%);
    border-radius: 6px;
    transition: width 0.5s cubic-bezier(.4, 0, .2, 1);
}

.health-score-numeric {
    font-size: 0.99rem;
    color: #b0b0c3;
    font-weight: 700;
    min-width: 48px;
    text-align: right;
    margin-left: 4px;
    margin-right: 2px;
    letter-spacing: 0.2px;
}

.health-score-value {
    font-size: 1.01rem;
    font-weight: 700;
    color: #23233a;
    min-width: 70px;
    text-align: right;
}

.score-explanation-block {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: #f6f8fa;
    border-radius: 12px;
    padding: 10px 14px;
    color: #666;
    font-size: 0.98rem;
    margin-top: 8px;
}

.score-explanation-block i {
    color: #b0b0c3;
    font-size: 1.1em;
    margin-top: 2px;
}

.info-section {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #f6f8fa;
    border-radius: 12px;
    padding: 10px 14px;
    color: #666;
    font-size: 0.98rem;
    margin-top: 10px;
}

.info-section i {
    color: #b0b0c3;
    font-size: 1.1em;
    margin-top: 2px;
}

.harmful-cards,
.recommend-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 6px;
}

.harmful-card,
.recommend-card {
    background: #f6f8fa;
    border-radius: 12px;
    padding: 10px 14px;
    box-shadow: 0 1px 4px rgba(60, 60, 120, 0.04);
    color: #666;
    font-size: 0.98rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.harmful-title {
    font-weight: 700;
    color: #dc3545;
}

.harmful-effect {
    font-size: 0.97rem;
}

.harmful-recommend {
    color: #28a745;
    font-size: 0.95rem;
    font-style: italic;
}

.recommend-label {
    font-weight: 600;
    color: #23233a;
    margin-bottom: 2px;
}

.recommend-value {
    color: #666;
    font-size: 0.97rem;
}

.no-result {
    text-align: center;
    color: #888;
    padding: 40px 20px;
    font-size: 1.08rem;
}

@media (max-width: 640px) {
    .modal-card {
        max-width: 98vw;
        border-radius: 16px;
        padding: 0 0 18px 0;
    }

    .product-card {
        padding: 0 6px;
    }

    .product-card-image {
        width: 110px;
        height: 110px;
        border-radius: 14px;
    }

    .product-card-content {
        gap: 12px;
    }

    .product-card-params-grid {
        gap: 8px 8px;
    }

    .param-cell {
        padding: 10px 0 8px 0;
        border-radius: 14px;
    }

    .harmful-cards,
    .recommend-cards {
        gap: 6px;
    }

    .harmful-card,
    .recommend-card {
        padding: 7px 8px;
        font-size: 0.95rem;
    }

    .health-score-bar {
        min-width: 50px;
        max-width: 100px;
    }

    .health-score-value {
        min-width: 40px;
        font-size: 0.95rem;
    }

    .health-score-numeric {
        min-width: 32px;
        font-size: 0.93rem;
    }
}
</style>