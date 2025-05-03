<template>
    <div class="search-page">
        <div class="search-block">
            <input v-model="query" @keyup.enter="onSearch" class="search-input" type="text"
                placeholder="Введите штрихкод или название продукта..." autofocus />
            <button class="search-btn" @click="onSearch">
                <i class="fa-solid fa-search"></i>
                Найти
            </button>
        </div>
        <div v-if="loading" class="loading-block">Загрузка...</div>
        <div v-else-if="error" class="error-block">{{ error }}</div>
        <div v-else-if="result" class="result-block">
            <div class="product-card">
                <div class="product-card-image-wrap">
                    <img v-if="result.image_front" :src="result.image_front" :alt="result.product_name"
                        class="product-card-image" />
                </div>
                <div class="product-card-title">{{ result.product_name || 'Без названия' }}</div>
                <div class="product-card-brand" v-if="result.manufacturer && result.manufacturer !== 'null'">{{
                    result.manufacturer }}</div>
                <div class="product-card-score">
                    <span class="score-dot" :class="getScoreDotClass(result.score)"></span>
                    <span class="health-score-numeric" :class="getScoreTextClass(result.score)">{{ typeof result.score
                        === 'number' ? result.score : '—' }}/100</span>
                    <span class="score-label" :class="getScoreTextClass(result.score)">{{ getScoreLabel(result.score)
                    }}</span>
                </div>
                <div class="product-card-meta">
                    <span v-if="result.barcode"><i class="fa-solid fa-barcode"></i> {{ result.barcode }}</span>
                </div>
                <NuxtLink :to="`/find/${result.barcode}`" class="open-link">Подробнее</NuxtLink>
            </div>
        </div>
        <div v-else-if="searched" class="not-found-block">Товар не найден</div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const query = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<any>(null)
const searched = ref(false)
const router = useRouter()

const onSearch = async () => {
    error.value = ''
    result.value = null
    searched.value = false
    if (!query.value.trim()) return
    loading.value = true
    let url = ''
    if (/^\d{8,14}$/.test(query.value.trim())) {
        url = `/api/find/${query.value.trim()}`
    } else {
        url = `/api/search?q=${encodeURIComponent(query.value.trim())}`
    }
    try {
        const res = await fetch(url)
        if (res.ok) {
            const data = await res.json()
            if (data && (data.barcode || data.product_name)) {
                result.value = data
            } else {
                searched.value = true
            }
        } else {
            searched.value = true
        }
    } catch (e) {
        error.value = 'Ошибка поиска. Попробуйте позже.'
    }
    loading.value = false
}

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
</script>

<style scoped>
.search-page {
    min-height: 100vh;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 8px 80px 8px;
}

.search-block {
    display: flex;
    gap: 10px;
    margin-bottom: 32px;
    width: 100%;
    max-width: 420px;
}

.search-input {
    flex: 1;
    padding: 12px 16px;
    border-radius: 14px;
    border: 1.5px solid #e0e7ef;
    font-size: 1.1rem;
    outline: none;
    transition: border 0.2s;
    background: #fff;
}

.search-input:focus {
    border: 1.5px solid #4ec16e;
}

.search-btn {
    background: linear-gradient(135deg, #4ec16e 0%, #18863b 100%);
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 0 18px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(60, 60, 120, 0.08);
}

.search-btn:hover {
    background: linear-gradient(135deg, #18863b 0%, #4ec16e 100%);
}

.loading-block,
.error-block,
.not-found-block {
    font-size: 1.1rem;
    color: #888;
    padding: 32px 20px;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 2px 12px rgba(60, 60, 120, 0.07);
    margin-top: 24px;
}

.result-block {
    width: 100%;
    max-width: 420px;
    margin-top: 24px;
}

.product-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f3f6ff 100%);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(60, 60, 120, 0.16), 0 2px 8px rgba(60, 60, 120, 0.08);
    width: 100%;
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

.open-link {
    margin-top: 18px;
    color: #4ec16e;
    font-weight: 700;
    text-decoration: underline;
    font-size: 1.08rem;
    transition: color 0.18s;
}

.open-link:hover {
    color: #18863b;
}
</style>
