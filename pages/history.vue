<template>
    <div class="history-page">
        <h1>История</h1>

        <div v-if="history.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <p>История пуста</p>
            <p class="empty-subtitle">Отсканируйте продукт, чтобы он появился здесь</p>
        </div>

        <div v-else class="history-list">
            <div v-for="scan in history" :key="scan.barcode" class="history-item" @click="showDetails(scan)">
                <div class="product-row">
                    <div class="product-image" v-if="scan.image_front">
                        <img :src="scan.image_front" :alt="scan.product_name">
                    </div>
                    <div class="product-main-info">
                        <h3>{{ scan.product_name }}</h3>
                        <div class="scan-date">
                            <i class="fa-solid fa-calendar"></i>
                            Дата: {{ formatRelativeDate(scan.timestamp) }}
                        </div>
                    </div>
                    <div class="status-block">
                        <div v-if="typeof scan.score === 'number'" class="status-badge"
                            :class="getScoreClass(scan.score)">
                            <i :class="getScoreIcon(scan.score)"></i>
                            <span>{{ getScoreLabel(scan.score) }}</span>
                        </div>
                        <div v-else class="status-badge status-unknown">
                            <i class="fa-solid fa-question-circle"></i> Неизвестно
                        </div>
                    </div>
                    <button class="delete-btn" @click.stop="deleteFromHistory(scan.barcode)" title="Удалить из истории">
                        <i class="fa-solid fa-trash"></i>
                    </button>
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

const deleteFromHistory = (barcode: string) => {
    if (confirm('Удалить этот продукт из истории?')) {
        store.removeFromHistory(barcode)
    }
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

const getScoreClass = (score: number): string => {
    if (score <= 25) return 'score-low';
    if (score <= 50) return 'score-medium';
    if (score <= 75) return 'score-medium';
    return 'score-high';
};

const getScoreLabel = (score: number): string => {
    if (score <= 25) return 'Плохое';
    if (score <= 50) return 'Слабое';
    if (score <= 75) return 'Хорошее';
    return 'Отличное';
};

function getScoreIcon(score: number | undefined) {
    const cls = typeof score === 'number' ? getScoreClass(score) : 'score-unknown';
    if (cls === 'score-high') return 'fa-solid fa-check-circle';
    if (cls === 'score-medium') return 'fa-solid fa-exclamation-circle';
    if (cls === 'score-low') return 'fa-solid fa-exclamation-triangle';
    return 'fa-regular fa-question-circle';
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
    gap: 14px;
}

@keyframes card-fade-in {
    from {
        opacity: 0;
        transform: translateY(24px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.history-item {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 18px;
    padding: 28px 24px 20px 24px;
    background: linear-gradient(120deg, #f8fafc 60%, #f3f6fb 100%);
    border-radius: 20px;
    box-shadow: 0 4px 24px 0 rgba(60, 60, 120, 0.10), 0 1.5px 4px 0 rgba(60, 60, 120, 0.04);
    cursor: pointer;
    transition: box-shadow 0.22s, transform 0.16s;
    position: relative;
    min-height: 80px;
    overflow: hidden;
    animation: card-fade-in 0.6s cubic-bezier(.4, 0, .2, 1);
}

.history-item:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 12px 40px 0 rgba(60, 60, 120, 0.16), 0 4px 16px 0 rgba(60, 60, 120, 0.10);
}

.product-row {
    display: flex;
    align-items: center;
    gap: 18px;
    width: 100%;
}

.product-row i {}

.product-image {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    border-radius: 16px;
    overflow: hidden;
    background: #f6f8fa;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 6px rgba(60, 60, 120, 0.07);
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.product-main-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.product-main-info h3 {
    margin: 0;
    font-size: 1.22rem;
    color: #23233a;
    font-weight: 800;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.01em;
}

.scan-date {
    font-size: 1.01rem;
    color: #b0b0c3;
    margin: 0;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
}

.scan-date:before {
    content: '\f073';
    font-family: 'Font Awesome 5 Free', 'FontAwesome', Arial, sans-serif;
    font-weight: 900;
    font-size: 1em;
    color: #b0b0c3;
    margin-right: 2px;
}

.status-block {
    min-width: 90px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
}

.status-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    font-size: 1.1rem;
    font-weight: 500;
    color: #fff;
    box-shadow: 0 2px 8px rgba(60, 60, 120, 0.10);
    border: none;
    background: #e0e0e0;
    position: relative;
    margin-bottom: 0;
    transition: background 0.2s, box-shadow 0.2s;
    padding: 0;
    gap: 0.4em;
}

.status-badge.score-high {
    background: #E6F4EA;
    color: #219150;
}

.status-badge.score-medium {
    background: #FFF9E6;
    color: #B8860B;
}

.status-badge.score-low {
    background: #FFF4E6;
    color: #A65C00;
}

.status-badge.score-unknown {
    background: #F2F2F2;
    color: #888;
}

.status-badge i {
    margin: 0;
    font-size: 1.3em;
    color: inherit;
    vertical-align: middle;
}

.status-badge span {
    margin-left: 0.5em;
    font-size: 1em;
    color: inherit;
    font-weight: 500;
    letter-spacing: 0.01em;
}

.status-label {
    font-size: 0.92rem;
    color: #b0b0c3;
    font-weight: 600;
    text-align: center;
    margin-top: 0;
    margin-bottom: 0;
    line-height: 1.1;
}

.delete-btn {
    margin-left: 12px;
    align-self: flex-start;
    background: #f6f8fa;
    border: none;
    color: #b0b0c3;
    font-size: 22px;
    border-radius: 50%;
    width: 38px;
    height: 38px;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, transform 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px rgba(60, 60, 120, 0.06);
}

.delete-btn:hover {
    background: #ffeaea;
    color: #dc3545;
    transform: scale(1.08);
}

.delete-btn:before {
    content: '\f2ed';
    font-family: 'Font Awesome 5 Free', 'FontAwesome', Arial, sans-serif;
    font-weight: 900;
    font-size: 1.1em;
}

@media (max-width: 640px) {
    .product-row {
        flex-wrap: wrap;
        gap: 10px;
    }

    .product-main-info {
        min-width: 120px;
    }

    .status-block {
        min-width: 60px;
    }

    .delete-btn {
        margin-left: 6px;
    }
}

.status-badge i {
    margin-right: 6px;
    font-size: 1.2em;
    vertical-align: middle;
}

.scan-date i {
    margin-right: 6px;
    font-size: 1em;
    color: #b0b0c3;
    vertical-align: middle;
}

.delete-btn i {
    font-size: 1.1em;
    vertical-align: middle;
}
</style>