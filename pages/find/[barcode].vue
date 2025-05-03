<template>
    <div class="find-product-page">
        <div v-if="loading" class="loading-block">Загрузка...</div>
        <div v-else-if="!product" class="not-found-block">Товар не найден</div>
        <div v-else class="product-card">
            <div class="product-card-image-wrap">
                <img v-if="product.image_front" :src="product.image_front" :alt="product.product_name"
                    class="product-card-image" />
            </div>
            <div class="product-card-title">{{ product.product_name || 'Без названия' }}</div>
            <div class="product-card-brand" v-if="product.manufacturer && product.manufacturer !== 'null'">{{
                product.manufacturer }}</div>
            <div class="product-card-score">
                <span class="score-dot" :class="getScoreDotClass(product.score)"></span>
                <span class="health-score-numeric" :class="getScoreTextClass(product.score)">{{ typeof product.score ===
                    'number' ? product.score : '—' }}/100</span>
                <span class="score-label" :class="getScoreTextClass(product.score)">{{ getScoreLabel(product.score)
                    }}</span>
            </div>
            <div class="product-card-meta">
                <span v-if="product.barcode"><i class="fa-solid fa-barcode"></i> {{ product.barcode }}</span>
            </div>
            <div class="product-card-content">
                <div class="product-card-params-grid">
                    <div class="param-cell param-calories">
                        <i class="fa-solid fa-fire param-icon-calories"></i>
                        <div class="param-value">{{ product.nutrition?.calories ?? '—' }}</div>
                        <div class="param-label">Калории</div>
                    </div>
                    <div class="param-cell param-proteins">
                        <i class="fa-solid fa-drumstick-bite param-icon-proteins"></i>
                        <div class="param-value">{{ product.nutrition?.proteins ?? '—' }}</div>
                        <div class="param-label">Белки</div>
                    </div>
                    <div class="param-cell param-fats">
                        <i class="fa-solid fa-bacon param-icon-fats"></i>
                        <div class="param-value">{{ product.nutrition?.fats ?? '—' }}</div>
                        <div class="param-label">Жиры</div>
                    </div>
                    <div class="param-cell param-carbs">
                        <i class="fa-solid fa-bread-slice param-icon-carbs"></i>
                        <div class="param-value">{{ product.nutrition?.carbohydrates ?? '—' }}</div>
                        <div class="param-label">Углеводы</div>
                    </div>
                </div>
                <div v-if="product.extra?.explanation_score" class="score-explanation-block">
                    <b><i class="fa-solid fa-circle-question"></i> Оценка</b>
                    <span>{{ product.extra.explanation_score }}</span>
                </div>
                <div v-if="product.allergens" class="info-section allergens-section">
                    <span><i class="fa-solid fa-triangle-exclamation"></i><b>Аллергены:</b></span>
                    <div class="allergen-list">
                        <span v-for="(allergen, idx) in allergenArray" :key="idx" class="allergen-item">
                            <i :class="getAllergenIconClass(allergen)"></i>
                            {{ allergen }}
                        </span>
                    </div>
                </div>
                <div v-if="product.extra?.harmful_components && product.extra.harmful_components.length > 0"
                    class="info-section harmful-section">
                    <i class="fa-solid fa-skull-crossbones"></i>
                    <span><b>Потенциально вредные компоненты</b></span>
                </div>
                <div v-if="product.extra?.harmful_components && product.extra.harmful_components.length > 0"
                    class="harmful-cards">
                    <div class="harmful-card" v-for="(component, index) in product.extra.harmful_components"
                        :key="index">
                        <div class="harmful-title">{{ component.name }}</div>
                        <div class="harmful-effect">{{ component.effect }}</div>
                        <div v-if="component.recommendation" class="harmful-recommend">{{ component.recommendation }}
                        </div>
                    </div>
                </div>
                <div v-if="product.extra && (product.extra.recommendedfor || product.extra.frequency || product.extra.alternatives)"
                    class="recommend-cards">
                    <div v-if="product.extra.recommendedfor" class="recommend-card">
                        <div class="recommend-label"><i class="fa-solid fa-person"></i>Подходит</div>
                        <div class="recommend-value">{{ product.extra.recommendedfor }}</div>
                    </div>
                    <div v-if="product.extra.frequency" class="recommend-card">
                        <div class="recommend-label"><i class="fa-solid fa-wave-square"></i>Частота</div>
                        <div class="recommend-value">{{ product.extra.frequency }}</div>
                    </div>
                    <div v-if="product.extra.alternatives" class="recommend-card">
                        <div class="recommend-label"><i class="fa-solid fa-clone"></i>Альтернативы</div>
                        <div class="recommend-value">{{ product.extra.alternatives }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '#imports'

const route = useRoute()
const barcode = computed(() => route.params.barcode as string)
const loading = ref(true)
const product = ref<any>(null)

const fetchProduct = async () => {
    loading.value = true
    try {
        // Исправлено: теперь правильный эндпоинт
        const res = await fetch(`/api/find/${barcode.value}`)
        if (res.ok) {
            product.value = await res.json()
        } else {
            product.value = null
        }
    } catch (e) {
        product.value = null
    }
    loading.value = false
}

onMounted(() => {
    fetchProduct()
})

// SEO: динамические мета-теги
watch([product, loading], () => {
    if (loading.value) return
    if (!product.value) {
        useHead({
            title: `Товар не найден | Поиск по штрихкоду ${barcode.value}`,
            meta: [
                { name: 'description', content: `Товар со штрихкодом ${barcode.value} не найден в базе.` },
                { property: 'og:title', content: `Товар не найден | Поиск по штрихкоду ${barcode.value}` },
                { property: 'og:description', content: `Товар со штрихкодом ${barcode.value} не найден в базе.` },
                { property: 'og:type', content: 'article' },
                { property: 'og:url', content: `https://yourdomain.ru/find/${barcode.value}` },
            ],
            link: [
                { rel: 'canonical', href: `https://yourdomain.ru/find/${barcode.value}` }
            ]
        })
    } else {
        useHead({
            title: `${product.value.product_name || 'Продукт'}${product.value.manufacturer ? ' — ' + product.value.manufacturer : ''} | Штрихкод: ${product.value.barcode}`,
            meta: [
                { name: 'description', content: `Информация о продукте ${product.value.product_name || ''}${product.value.manufacturer ? ' от ' + product.value.manufacturer : ''}. Штрихкод: ${product.value.barcode}. Оценка: ${typeof product.value.score === 'number' ? product.value.score + '/100' : '—'}.` },
                { property: 'og:title', content: `${product.value.product_name || 'Продукт'}${product.value.manufacturer ? ' — ' + product.value.manufacturer : ''} | Штрихкод: ${product.value.barcode}` },
                { property: 'og:description', content: `Информация о продукте ${product.value.product_name || ''}${product.value.manufacturer ? ' от ' + product.value.manufacturer : ''}. Штрихкод: ${product.value.barcode}. Оценка: ${typeof product.value.score === 'number' ? product.value.score + '/100' : '—'}.` },
                { property: 'og:type', content: 'article' },
                { property: 'og:url', content: `https://yourdomain.ru/find/${product.value.barcode}` },
                ...(product.value.image_front ? [{ property: 'og:image', content: product.value.image_front }] : [])
            ],
            link: [
                { rel: 'canonical', href: `https://yourdomain.ru/find/${product.value.barcode}` }
            ]
        })
    }
})

const allergenArray = computed(() =>
    product.value?.allergens
        ? product.value.allergens.split(',').map((a: string) => a.trim())
        : []
)

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
function getScoreLabel(score: number | undefined) {
    if (typeof score !== 'number') return '—'
    if (score <= 25) return 'Плохое'
    if (score <= 50) return 'Слабое'
    if (score <= 75) return 'Хорошее'
    return 'Отличное'
}
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
    };
    return map[allergen.toLowerCase()] || 'fa-solid fa-exclamation';
}
</script>

<style scoped>
.find-product-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    padding: 32px 8px;
}

.loading-block,
.not-found-block {
    font-size: 1.2rem;
    color: #888;
    padding: 40px 20px;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 2px 12px rgba(60, 60, 120, 0.07);
}

.product-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f3f6ff 100%);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(60, 60, 120, 0.16), 0 2px 8px rgba(60, 60, 120, 0.08);
    max-width: 420px;
    width: 100%;
    margin: auto;
    position: relative;
    padding: 0 0 32px 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
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
}

.product-card-title {
    font-size: 1.35rem;
    font-weight: 900;
    color: #23233a;
    text-align: center;
    margin: 0 0 2px 0;
    letter-spacing: 0.01em;
}

.product-card-brand {
    font-size: 1.01rem;
    color: #888;
    margin-bottom: 0;
    line-height: 1.1;
    text-align: center;
}

.product-card-score {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 0 0;
    justify-content: center;
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
}

.score-label {
    font-size: 1.01rem;
    font-weight: 700;
    color: #888;
    min-width: 70px;
    text-align: right;
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

.product-card-meta {
    display: flex;
    gap: 14px;
    justify-content: center;
    margin: 4px 0 8px 0;
    color: #b0b0c3;
    font-size: 0.98rem;
}

.product-card-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
}

.product-card-params-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 14px;
    width: 100%;
    margin: 10px 0 0 0;
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
    border: 2px solid transparent;
    position: relative;
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
    background: linear-gradient(135deg, #f6f8fa 60%, #f3f6fb 100%);
    border-radius: 12px;
    padding: 10px 14px;
    box-shadow: 0 1px 8px rgba(60, 60, 120, 0.06);
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