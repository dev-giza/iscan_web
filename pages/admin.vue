<template>
    <div class="admin-page">
        <h1>Панель управления</h1>
        <div class="search-bar">
            <input v-model="search" type="text" placeholder="Поиск по названию или штрихкоду..." class="search-input" />
        </div>
        <div v-if="loading" class="loading">Загрузка...</div>
        <div v-else>
            <div v-if="filteredProducts.length === 0" class="empty">Нет продуктов</div>
            <div class="products-list">
                <div v-for="product in filteredProducts" :key="product.barcode" class="product-card"
                    @click="openModal(product)" style="cursor:pointer">
                    <img v-if="product.image_front" :src="product.image_front" alt="Фото" class="product-img" />
                    <div class="product-info">
                        <div class="product-title">{{ product.product_name || 'Без названия' }}</div>
                        <div class="product-barcode">Штрихкод: {{ product.barcode }}</div>
                        <div class="product-manufacturer" v-if="product.manufacturer">{{ product.manufacturer }}</div>
                        <div class="product-score">
                            <span :class="['score-badge', getScoreColor(product.score)]">
                                <i :class="getScoreIcon(product.score)" /> {{ product.score }}
                            </span>
                            <span v-if="product.allergens" class="product-allergens">Аллергены: {{ product.allergens
                            }}</span>
                        </div>
                        <div class="product-nutrition">
                            <span v-if="product.nutrition?.calories || product.nutrition?.kcal">Ккал: {{
                                product.nutrition.kcal || product.nutrition.calories }}</span>
                            <span v-if="product.nutrition?.proteins">Б: {{ product.nutrition.proteins }}</span>
                            <span v-if="product.nutrition?.fats">Ж: {{ product.nutrition.fats }}</span>
                            <span v-if="product.nutrition?.carbohydrates">У: {{ product.nutrition.carbohydrates
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Модальное окно -->
        <transition name="modal-fade">
            <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal-card">
                    <button class="modal-close" @click="closeModal">×</button>
                    <div class="modal-images">
                        <img v-if="selectedProduct?.image_front" :src="selectedProduct.image_front" alt="Фото продукта"
                            @click.stop="enlargeImage(selectedProduct.image_front)" style="cursor:zoom-in" />
                        <img v-if="selectedProduct?.image_ingredients" :src="selectedProduct.image_ingredients"
                            alt="Фото состава" @click.stop="enlargeImage(selectedProduct.image_ingredients)"
                            style="cursor:zoom-in" />
                    </div>
                    <div class="modal-info">
                        <h2>{{ selectedProduct.product_name || 'Без названия' }}</h2>
                        <div class="modal-barcode">Штрихкод: {{ selectedProduct.barcode }}</div>
                        <div v-if="selectedProduct.manufacturer">Производитель: {{ selectedProduct.manufacturer }}</div>
                        <div v-if="selectedProduct.score !== undefined" class="modal-score">
                            <span :class="['score-badge', getScoreColor(selectedProduct.score)]">
                                <i :class="getScoreIcon(selectedProduct.score)" /> {{ selectedProduct.score }}
                            </span>
                        </div>
                        <div v-if="selectedProduct.allergens" class="modal-allergens">Аллергены: {{
                            selectedProduct.allergens }}</div>
                        <div class="modal-nutrition">
                            <span v-if="selectedProduct.nutrition?.calories || selectedProduct.nutrition?.kcal">Ккал: {{
                                selectedProduct.nutrition.kcal || selectedProduct.nutrition.calories }}</span>
                            <span v-if="selectedProduct.nutrition?.proteins">Б: {{ selectedProduct.nutrition.proteins
                            }}</span>
                            <span v-if="selectedProduct.nutrition?.fats">Ж: {{ selectedProduct.nutrition.fats }}</span>
                            <span v-if="selectedProduct.nutrition?.carbohydrates">У: {{
                                selectedProduct.nutrition.carbohydrates }}</span>
                        </div>
                        <div v-if="selectedProduct.extra?.ingredients" class="modal-ingredients">
                            <b>Состав:</b> {{ selectedProduct.extra.ingredients }}
                        </div>
                        <div v-if="selectedProduct.extra?.explanation_score" class="modal-explanation">
                            <b>Пояснение к оценке:</b> {{ selectedProduct.extra.explanation_score }}
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Просмотр увеличенного изображения -->
        <transition name="modal-fade">
            <div v-if="enlargedImage" class="image-viewer-overlay" @click.self="closeEnlargedImage">
                <img :src="enlargedImage" class="image-viewer-img" alt="Увеличенное фото" />
                <button class="image-viewer-close" @click="closeEnlargedImage">×</button>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'

const products = ref([])
const loading = ref(true)
const search = ref('')

const showModal = ref(false)
const selectedProduct = ref(null)

const enlargedImage = ref(null)

function openModal(product) {
    selectedProduct.value = product
    showModal.value = true
}
function closeModal() {
    showModal.value = false
    selectedProduct.value = null
}
function enlargeImage(src) {
    enlargedImage.value = src
    document.addEventListener('keydown', escListener)
}
function closeEnlargedImage() {
    enlargedImage.value = null
    document.removeEventListener('keydown', escListener)
}
function escListener(e) {
    if (e.key === 'Escape') closeEnlargedImage()
}

// Запрет скролла body при открытом модальном окне или увеличении фото
watch([showModal, enlargedImage], ([modal, img]) => {
    if (modal || img) {
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = ''
    }
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', escListener)
})

const fetchProducts = async () => {
    loading.value = true
    try {
        const res = await $fetch('/api/products')
        products.value = Array.isArray(res) ? res : (res.products || [])
    } catch (e) {
        products.value = []
    } finally {
        loading.value = false
    }
}

onMounted(fetchProducts)

const filteredProducts = computed(() => {
    if (!search.value.trim()) return products.value
    const q = search.value.trim().toLowerCase()
    return products.value.filter(
        p =>
            (p.product_name && p.product_name.toLowerCase().includes(q)) ||
            (p.barcode && p.barcode.toString().includes(q))
    )
})

function getScoreColor(score) {
    if (score >= 80) return 'score-green'
    if (score >= 50) return 'score-yellow'
    return 'score-red'
}

function getScoreIcon(score) {
    if (score >= 80) return 'fa fa-check-circle'
    if (score >= 50) return 'fa fa-exclamation-circle'
    return 'fa fa-times-circle'
}
</script>

<style scoped>
.admin-page {
    max-width: 700px;
    margin: 0 auto;
    padding: 24px 8px 48px;
    font-family: 'Inter', Arial, sans-serif;
}

h1 {
    font-size: 2rem;
    margin-bottom: 18px;
    font-weight: 700;
    letter-spacing: 0.01em;
}

.search-bar {
    margin-bottom: 18px;
}

.search-input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 18px;
    border: 1px solid #e0e0e0;
    font-size: 1rem;
    background: #fafbfc;
    box-shadow: 0 1px 4px 0 #0001;
    outline: none;
    transition: border 0.2s;
}

.search-input:focus {
    border: 1.5px solid #a0c4ff;
}

.loading {
    text-align: center;
    color: #888;
    margin: 32px 0;
}

.empty {
    text-align: center;
    color: #bbb;
    margin: 32px 0;
}

.products-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.product-card {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 2px 12px 0 #0001;
    padding: 12px 16px;
    gap: 16px;
    transition: box-shadow 0.2s;
}

.product-card:hover {
    box-shadow: 0 4px 18px 0 #a0c4ff33;
}

.product-img {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 12px;
    background: #f0f4fa;
}

.product-info {
    flex: 1;
    min-width: 0;
}

.product-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 2px;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.product-barcode {
    font-size: 0.97rem;
    color: #888;
}

.product-manufacturer {
    font-size: 0.97rem;
    color: #666;
    margin-bottom: 2px;
}

.product-score {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 4px 0 2px 0;
}

.score-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 12px;
    padding: 2px 10px 2px 7px;
    background: #f5f5f5;
}

.score-green {
    color: #219150;
    background: #e6fbe9;
}

.score-yellow {
    color: #bfa100;
    background: #fffbe6;
}

.score-red {
    color: #d32f2f;
    background: #ffeaea;
}

.product-allergens {
    font-size: 0.93rem;
    color: #b71c1c;
    margin-left: 8px;
}

.product-nutrition {
    display: flex;
    gap: 12px;
    font-size: 0.97rem;
    color: #555;
    margin-top: 2px;
}

/* Модальное окно */
.modal-overlay {
    position: fixed;
    z-index: 1001;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s;
    /* Для мобильных: */
    padding: 0 4px;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.22s cubic-bezier(.4, 1.6, .6, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-card {
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 8px 32px 0 #0002;
    max-width: 420px;
    width: 96vw;
    padding: 28px 18px 22px 18px;
    position: relative;
    animation: modalPop 0.22s cubic-bezier(.4, 1.6, .6, 1);
    max-height: 90vh;
    overflow-y: auto;
    overscroll-behavior: contain;
}

@keyframes modalPop {
    from {
        transform: scale(0.95);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}

.modal-close {
    position: absolute;
    top: 10px;
    right: 16px;
    font-size: 2rem;
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    transition: color 0.2s;
}

.modal-close:hover {
    color: #d32f2f;
}

.modal-images {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 16px;
}

.modal-images img {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 14px;
    background: #f0f4fa;
    box-shadow: 0 2px 8px 0 #0001;
}

.modal-info h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 6px;
}

.modal-barcode {
    font-size: 1rem;
    color: #888;
    margin-bottom: 2px;
}

.modal-score {
    margin: 8px 0 4px 0;
}

.modal-allergens {
    color: #b71c1c;
    font-size: 0.97rem;
    margin-bottom: 4px;
}

.modal-nutrition {
    display: flex;
    gap: 10px;
    font-size: 0.97rem;
    color: #555;
    margin-bottom: 6px;
}

.modal-ingredients,
.modal-explanation {
    font-size: 0.97rem;
    color: #444;
    margin-bottom: 6px;
}

/* Просмотр увеличенного изображения */
.image-viewer-overlay {
    position: fixed;
    z-index: 2000;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s;
}

.image-viewer-img {
    max-width: 92vw;
    max-height: 92vh;
    border-radius: 18px;
    box-shadow: 0 4px 32px 0 #0008;
    background: #fff;
}

.image-viewer-close {
    position: fixed;
    top: 24px;
    right: 36px;
    font-size: 2.5rem;
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    z-index: 2100;
    transition: color 0.2s;
}

.image-viewer-close:hover {
    color: #d32f2f;
}

@media (max-width: 700px) {
    .admin-page {
        padding: 10px 2vw 32px;
    }

    .product-card {
        padding: 10px 8px;
        gap: 10px;
    }

    .product-img {
        width: 44px;
        height: 44px;
    }

    .modal-card {
        padding: 16px 4px 14px 4px;
        max-width: 98vw;
        max-height: 94vh;
    }

    .modal-images img {
        width: 90px;
        height: 90px;
    }
}
</style>