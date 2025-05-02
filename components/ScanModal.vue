<template>
    <div v-if="isOpen" class="modal-overlay" @click="close">
        <div class="modal-card animated-modal" @click.stop>
            <button class="close-button" @click="close">&times;</button>
            <div v-if="currentScan" class="product-card product-card-row">
                <div class="product-card-image-row">
                    <img v-if="currentScan?.image_front" :src="currentScan.image_front" :alt="currentScan.product_name"
                        class="product-card-image-row-img" />
                </div>
                <div class="product-card-maininfo-row">
                    <div class="product-card-title-row">{{ currentScan?.product_name || 'Без названия' }}</div>
                    <div class="product-card-brand-row"
                        v-if="currentScan?.manufacturer && currentScan.manufacturer !== 'null'">{{
                            currentScan.manufacturer }}</div>
                    <div class="product-card-score-row">
                        <span class="score-dot-row"
                            :class="getScoreDotClass(typeof currentScan?.score === 'number' ? currentScan.score : undefined)"></span>
                        <span class="score-numeric-row"
                            :class="getScoreTextClass(typeof currentScan?.score === 'number' ? currentScan.score : undefined)">{{
                                typeof currentScan?.score === 'number' ? currentScan.score : '—' }}/100</span>
                        <span class="score-label-row"
                            :class="getScoreTextClass(typeof currentScan?.score === 'number' ? currentScan.score : undefined)">{{
                                getScoreLabel(typeof currentScan?.score === 'number' ? currentScan.score : undefined)
                            }}</span>
                    </div>
                    <div class="product-card-meta-row">
                        <span v-if="currentScan?.timestamp" class="meta-row"><i class="fa-regular fa-calendar"></i> {{
                            formatRelativeDate(currentScan?.timestamp) }}</span>
                        <span v-if="currentScan?.barcode" class="meta-row"><i class="fa-solid fa-barcode"></i> {{
                            currentScan.barcode }}</span>
                    </div>
                </div>
            </div>
            <div v-else class="no-result">
                Нет данных для отображения
            </div>
            <div class="product-card-content">
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
                <div v-if="currentScan?.extra?.explanation_score" class="score-explanation-block">
                    <b>
                        <i class="fa-solid fa-circle-question"></i>
                        Оценка
                    </b>
                    <span>{{ currentScan.extra.explanation_score }}</span>
                </div>
                <div v-if="currentScan?.allergens" class="info-section allergens-section">
                    <span><i class="fa-solid fa-triangle-exclamation"></i><b>Аллергены:</b></span>
                    <div class="allergen-list">
                        <span v-for="(allergen, idx) in allergenArray" :key="idx" class="allergen-item">
                            <i :class="getAllergenIconClass(allergen)"></i>
                            {{ allergen }}
                        </span>
                    </div>
                </div>
                <div v-if="currentScan?.extra?.harmful_components && currentScan.extra.harmful_components.length > 0"
                    class="info-section harmful-section">
                    <i class="fa-solid fa-skull-crossbones"></i>
                    <span><b>Потенциально вредные компоненты</b></span>
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
                    class="recommend-cards">
                    <div v-if="currentScan.extra.recommendedfor" class="recommend-card">
                        <div class="recommend-label"><i class="fa-solid fa-person"></i>Подходит</div>
                        <div class="recommend-value">{{ currentScan.extra.recommendedfor }}</div>
                    </div>
                    <div v-if="currentScan.extra.frequency" class="recommend-card">
                        <div class="recommend-label"><i class="fa-solid fa-wave-square"></i>Частота</div>
                        <div class="recommend-value">{{ currentScan.extra.frequency }}</div>
                    </div>
                    <div v-if="currentScan.extra.alternatives" class="recommend-card">
                        <div class="recommend-label"><i class="fa-solid fa-clone"></i>Альтернативы</div>
                        <div class="recommend-value">{{ currentScan.extra.alternatives }}</div>
                    </div>
                </div>
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

const positives = computed(() => [
    currentScan.value?.nutrition?.proteins ? {
        icon: 'fa-solid fa-drumstick-bite',
        title: 'Белки',
        desc: 'Содержит белок',
        value: currentScan.value.nutrition.proteins + 'г'
    } : null,
    currentScan.value?.nutrition?.calories ? {
        icon: 'fa-solid fa-fire',
        title: 'Калории',
        desc: 'Низкая калорийность',
        value: currentScan.value.nutrition.calories + ' ккал'
    } : null
].filter(Boolean))

const negatives = computed(() => [
    (currentScan.value?.nutrition && 'sugar' in currentScan.value.nutrition && currentScan.value.nutrition.sugar) ? {
        icon: 'fa-solid fa-cube',
        title: 'Сахар',
        desc: 'Содержит сахар',
        value: currentScan.value.nutrition.sugar + 'г'
    } : null,
    (currentScan.value?.nutrition && 'sodium' in currentScan.value.nutrition && currentScan.value.nutrition.sodium) ? {
        icon: 'fa-solid fa-salt-shaker',
        title: 'Соль',
        desc: 'Содержит соль',
        value: currentScan.value.nutrition.sodium + 'мг'
    } : null
].filter(Boolean))

function getScoreDotClass(score: number | undefined) {
    if (typeof score !== 'number') return 'dot-unknown';
    if (score <= 25) return 'dot-bad';
    if (score <= 50) return 'dot-medium';
    if (score <= 75) return 'dot-good';
    return 'dot-excellent';
}

function getScoreTextClass(score: number | undefined) {
    if (typeof score !== 'number') return 'score-text-unknown';
    if (score <= 25) return 'score-text-bad';
    if (score <= 50) return 'score-text-medium';
    if (score <= 75) return 'score-text-good';
    return 'score-text-excellent';
}

const allergenArray = computed(() =>
    currentScan.value?.allergens
        ? currentScan.value.allergens.split(',').map(a => a.trim())
        : []
);

function getAllergenIconClass(allergen: string) {
    const map: Record<string, string> = {
        'молоко': 'fa-solid fa-cow',
        'молочные продукты': 'fa-solid fa-cow',
        'рыба': 'fa-solid fa-fish',
        'орехи': 'fa-solid fa-seedling',
        'арахис': 'fa-solid fa-peanut',
        'яйцо': 'fa-solid fa-egg',
        'яйца': 'fa-solid fa-egg',
        'глютен': 'fa-solid fa-bread-slice',
        'пшеница': 'fa-solid fa-bread-slice',
        'соя': 'fa-solid fa-leaf',
        'мед': 'fa-solid fa-jar',
        'креветки': 'fa-solid fa-shrimp',
        'ракообразные': 'fa-solid fa-shrimp',
        'семена': 'fa-solid fa-seedling',
        'кунжут': 'fa-solid fa-seedling',
        'горчица': 'fa-solid fa-seedling',
        'сельдерей': 'fa-solid fa-seedling',
        'лук': 'fa-solid fa-onion',
        'чеснок': 'fa-solid fa-onion',
        // fallback
    };
    return map[allergen.toLowerCase()] || 'fa-solid fa-exclamation';
}
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
    z-index: 1001;
    overflow-y: auto;
    animation: modal-fade-in 0.35s cubic-bezier(.4, 0, .2, 1);
}

@keyframes modal-fade-in {
    from {
        opacity: 0;
        transform: translateY(40px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.modal-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f3f6ff 100%);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(60, 60, 120, 0.16), 0 2px 8px rgba(60, 60, 120, 0.08);
    max-width: 420px;
    width: 100%;
    margin: auto;
    position: relative;
    padding: 0 0 32px 0;
    overflow: hidden;
    animation: modal-fade-in 0.35s cubic-bezier(.4, 0, .2, 1);
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
    padding: 0 18px;
    animation: fade-in-card 0.6s cubic-bezier(.4, 0, .2, 1);
}

@keyframes fade-in-card {
    from {
        opacity: 0;
        transform: translateY(24px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.product-card-image-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: 28px;
    margin-bottom: 14px;
}

.product-card-image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 18px;
    box-shadow: 0 4px 24px rgba(60, 60, 120, 0.10);
    background: #f6f8fa;
    animation: fade-in-card 0.7s cubic-bezier(.4, 0, .2, 1);
}

.product-card-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
}

.product-card-title {
    font-size: 1.35rem;
    font-weight: 900;
    color: #23233a;
    text-align: center;
    margin: 0 0 2px 0;
    letter-spacing: 0.01em;
    animation: fade-in-card 0.7s cubic-bezier(.4, 0, .2, 1);
}

.product-card-date {
    color: #b0b0c3;
    font-size: 1.01rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
}

.product-card-meta {
    display: flex;
    gap: 14px;
    justify-content: center;
    margin: 4px 0 8px 0;
    color: #b0b0c3;
    font-size: 0.98rem;
}

.product-card-status {
    width: 100%;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: center;
    animation: fade-in-card 0.8s cubic-bezier(.4, 0, .2, 1);
}

.score-dot {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-shadow: 0 0 8px 2px rgba(76, 193, 110, 0.12);
    transition: box-shadow 0.3s;
}

.dot-bad {
    background: #e74c3c;
    box-shadow: 0 0 8px 2px #e74c3c33;
}

.dot-medium {
    background: #ffb300;
    box-shadow: 0 0 8px 2px #ffb30033;
}

.dot-good {
    background: #4ec16e;
    box-shadow: 0 0 8px 2px #4ec16e33;
}

.dot-excellent {
    background: #18863b;
    box-shadow: 0 0 8px 2px #18863b33;
}

.dot-unknown {
    background: #bbb;
}

.health-score-numeric {
    font-size: 1.22rem;
    font-weight: 800;
    color: #23233a;
    letter-spacing: 0.2px;
    animation: fade-in-card 0.9s cubic-bezier(.4, 0, .2, 1);
}

.allergens-section>span {
    display: flex;
    gap: 8px;
}

.health-score-value {
    font-size: 1.01rem;
    font-weight: 700;
    color: #888;
    min-width: 70px;
    text-align: right;
    animation: fade-in-card 1s cubic-bezier(.4, 0, .2, 1);
}

.product-card-params-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 14px;
    width: 100%;
    margin: 10px 0 0 0;
    animation: fade-in-card 1.1s cubic-bezier(.4, 0, .2, 1);
}

.param-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(135deg, #f6f8fa 60%, #f3f6fb 100%);
    border-radius: 16px;
    padding: 12px 0 10px 0;
    box-shadow: 0 1px 8px rgba(60, 60, 120, 0.06);
    min-width: 0;
    transition: box-shadow 0.2s, transform 0.2s;
    animation: fade-in-card 1.2s cubic-bezier(.4, 0, .2, 1);
    border: 2px solid transparent;
    position: relative;
}

.param-cell:hover {
    box-shadow: 0 4px 18px rgba(60, 60, 120, 0.13);
    transform: translateY(-2px) scale(1.03);
    border: 2px solid #e0e7ff;
}

.param-cell i {
    background: #fff;
    border-radius: 50%;
    padding: 8px;
    margin-bottom: 2px;
    font-size: 1.3em;
    box-shadow: 0 2px 8px rgba(60, 60, 120, 0.08);
    transition: background 0.18s, color 0.18s, box-shadow 0.18s;
}

.param-cell.param-calories i {
    color: #ff9800;
    background: #fff4e0;
}

.param-cell.param-proteins i {
    color: #4ec16e;
    background: #e6fbe9;
}

.param-cell.param-fats i {
    color: #42a5f5;
    background: #e6f0ff;
}

.param-cell.param-carbs i {
    color: #bdb76b;
    background: #f7f5e6;
}

.param-value {
    font-size: 1.13rem;
    font-weight: 700;
    color: #23233a;
    margin-bottom: 2px;
}

.param-label {
    font-size: 0.97rem;
    color: #888;
    font-weight: 500;
}

.score-explanation-block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    background: #f6f8fa;
    border-radius: 12px;
    padding: 10px 14px;
    color: #666;
    font-size: 0.98rem;
    margin-top: 8px;
    animation: fade-in-card 1.3s cubic-bezier(.4, 0, .2, 1);
}

.info-section {
    display: flex;
    flex-direction: column;
    width: 95%;
    align-items: flex-start;
    gap: 10px;
    background: #f6f8fa;
    border-radius: 12px;
    padding: 10px 14px;
    color: #666;
    font-size: 0.98rem;
    margin-top: 10px;
    animation: fade-in-card 1.4s cubic-bezier(.4, 0, .2, 1);
}

.harmful-cards,
.recommend-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 6px;
    animation: fade-in-card 1.5s cubic-bezier(.4, 0, .2, 1);
}

.harmful-card,
.recommend-card {
    background: linear-gradient(135deg, #f6f8fa 60%, #f3f6fb 100%);
    border-radius: 12px;
    padding: 10px 14px;
    box-shadow: 0 1px 8px rgba(60, 60, 120, 0.06);
    color: #666;
    font-size: 0.98rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: box-shadow 0.2s, transform 0.2s;
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
    display: flex;
    gap: 8px;
    font-weight: 600;
    color: #666;
    margin-bottom: 2px;
    font-weight: bold;
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
        padding: 0 4px;
        align-items: center;
    }

    .product-card-row {
        flex-direction: row;
        align-items: flex-start;
        gap: 10px;
        margin-top: 12px;
        background: none;
        box-shadow: none;
        padding: 0 2px;
        width: 100%;
    }

    .product-card-image-row {
        width: auto;
        min-width: 70px;
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        margin-bottom: 0;
    }

    .product-card-image-row-img {
        width: 70px;
        height: 70px;
        border-radius: 10px;
        margin-bottom: 0;
        margin-top: 0;
        box-shadow: 0 2px 8px rgba(60, 60, 120, 0.08);
    }

    .product-card-maininfo-row {
        width: 100%;
        margin: 0;
        background: none;
        border-radius: 0;
        box-shadow: none;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0;
        gap: 2px;
        margin-top: 0;
    }

    .product-card-title-row,
    .product-card-brand-row,
    .product-card-score-row,
    .product-card-meta-row {
        width: 100%;
        text-align: left;
    }

    .product-card-title-row {
        font-size: 1.02rem;
        font-weight: 900;
        margin-bottom: 2px;
        word-break: break-word;
    }

    .product-card-brand-row {
        font-size: 0.93rem;
        color: #888;
        margin-bottom: 0;
    }

    .product-card-score-row {
        justify-content: flex-start;
        margin: 6px 0 0 0;
        gap: 6px;
    }

    .score-dot-row {
        width: 10px;
        height: 10px;
    }

    .score-numeric-row {
        font-size: 0.97rem;
    }

    .score-label-row {
        font-size: 0.93rem;
        min-width: 32px;
        text-align: left;
    }

    .product-card-meta-row {
        justify-content: flex-start;
        gap: 6px;
    }

    .meta-row {
        justify-content: flex-start;
        gap: 4px;
    }

    .product-card-content {
        gap: 10px;
        align-items: center;
        width: 100%;
        padding: 0 2px;
    }

    .product-card-params-grid {
        gap: 8px 8px;
        width: 100%;
    }

    .param-cell {
        padding: 8px 0 7px 0;
    }

    .harmful-cards,
    .recommend-cards {
        gap: 6px;
    }

    .harmful-card,
    .recommend-card {
        padding: 10px;
        font-size: 0.95rem;
    }

    .health-score-numeric {
        font-size: 1.01rem;
    }

    .health-score-value {
        min-width: 40px;
        font-size: 0.95rem;
    }
}

.product-card-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 18px;
    width: 100%;
    padding: 5px 15px;
    background: none;
    box-shadow: none;
    margin-top: 24px;
    margin-bottom: 10px;
}

.product-card-image-row {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
}

.product-card-image-row-img {
    width: 110px;
    height: 110px;
    border-radius: 18px;
    object-fit: cover;
    background: linear-gradient(135deg, #f6f8fa 60%, #f3f6fb 100%);
    box-shadow: 0 4px 18px rgba(60, 60, 120, 0.10), 0 1.5px 4px rgba(60, 60, 120, 0.04);
    border: 1.5px solid #f3f6fb;
    transition: box-shadow 0.2s, border 0.2s;
    animation: fade-in-card 0.7s cubic-bezier(.4, 0, .2, 1);
}

.product-card-image-row-img:hover {
    box-shadow: 0 8px 32px rgba(60, 60, 120, 0.16);
    border: 1.5px solid #e0e7ff;
}

.product-card-maininfo-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 2px;
    width: 100%;
}

.product-card-title-row {
    font-size: 1.25rem;
    font-weight: 900;
    color: #23233a;
    margin: 0 0 2px 0;
    letter-spacing: 0.01em;
    line-height: 1.18;
    text-align: left;
}

.product-card-brand-row {
    font-size: 1.01rem;
    color: #888;
    margin-bottom: 0;
    line-height: 1.1;
    text-align: left;
}

.product-card-score-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 0 0;
    justify-content: flex-start;
}

.score-dot-row {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-shadow: 0 0 8px 2px rgba(76, 193, 110, 0.12);
    transition: box-shadow 0.3s;
}

.dot-bad {
    background: #e74c3c;
    box-shadow: 0 0 8px 2px #e74c3c33;
}

.dot-medium {
    background: #ffb300;
    box-shadow: 0 0 8px 2px #ffb30033;
}

.dot-good {
    background: #4ec16e;
    box-shadow: 0 0 8px 2px #4ec16e33;
}

.dot-excellent {
    background: #18863b;
    box-shadow: 0 0 8px 2px #18863b33;
}

.dot-unknown {
    background: #bbb;
}

.score-numeric-row {
    font-size: 1.18rem;
    font-weight: 800;
    color: #23233a;
    letter-spacing: 0.2px;
}

.score-label-row {
    font-size: 1.01rem;
    font-weight: 700;
    color: #888;
    min-width: 70px;
    text-align: right;
}

.product-card-meta-row {
    display: flex;
    gap: 14px;
    justify-content: flex-start;
    margin: 8px 0 0 0;
    color: #b0b0c3;
    font-size: 0.98rem;
}

.meta-row {
    display: flex;
    align-items: center;
    gap: 4px;
}

@media (max-width: 640px) {
    .product-card-row {
        flex-direction: row;
        align-items: flex-start;
        gap: 10px;
        margin-top: 12px;
        background: none;
        box-shadow: none;
        padding: 10px;
        width: 100%;
    }

    .product-card-image-row {
        width: auto;
        min-width: 70px;
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        margin-bottom: 0;
    }

    .product-card-image-row-img {
        width: 70px;
        height: 70px;
        border-radius: 10px;
        margin-bottom: 0;
        margin-top: 0;
        box-shadow: 0 2px 8px rgba(60, 60, 120, 0.08);
    }

    .product-card-maininfo-row {
        width: 100%;
        margin: 0;
        background: none;
        border-radius: 0;
        box-shadow: none;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0;
        gap: 2px;
        margin-top: 0;
    }

    .product-card-title-row,
    .product-card-brand-row,
    .product-card-score-row,
    .product-card-meta-row {
        width: 100%;
        text-align: left;
    }

    .product-card-title-row {
        font-size: 1.02rem;
        font-weight: 900;
        margin-bottom: 2px;
        word-break: break-word;
    }

    .product-card-brand-row {
        font-size: 0.93rem;
        color: #888;
        margin-bottom: 0;
    }

    .product-card-score-row {
        justify-content: flex-start;
        margin: 6px 0 0 0;
        gap: 6px;
    }

    .score-dot-row {
        width: 10px;
        height: 10px;
    }

    .score-numeric-row {
        font-size: 0.97rem;
    }

    .score-label-row {
        font-size: 0.93rem;
        min-width: 32px;
        text-align: left;
    }

    .product-card-meta-row {
        justify-content: flex-start;
        gap: 6px;
        font-size: 0.91rem;
        margin: 4px 0 0 0;
    }
}

.score-text-bad {
    color: #e74c3c;
    font-weight: 700;
}

.score-text-medium {
    color: #ffb300;
    font-weight: 700;
}

.score-text-good {
    color: #4ec16e;
    font-weight: 700;
}

.score-text-excellent {
    color: #18863b;
    font-weight: 700;
}

.score-text-unknown {
    color: #bbb;
    font-weight: 700;
}

.allergen-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-top: 4px;
}

.allergen-item {
    display: flex;
    align-items: center;
    gap: 5px;
    background: #f6f8fa;
    border-radius: 8px;
    padding: 4px 10px 4px 7px;
    font-size: 0.97rem;
    color: #b85c00;
    font-weight: 600;
}

.allergen-item i {
    font-size: 1.1em;
    color: #b85c00;
}
</style>