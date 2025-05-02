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
                <div class="history-row">
                    <div class="history-img-wrap" v-if="scan.image_front">
                        <img :src="scan.image_front" :alt="scan.product_name">
                    </div>
                    <div class="history-main-info">
                        <div class="history-title">{{ scan.product_name }}</div>
                        <div class="history-brand" v-if="scan.manufacturer">{{ scan.manufacturer }}</div>
                        <div class="history-status-date">
                            <span class="status-dot"
                                :class="getStatusDotClass(typeof scan.score === 'number' ? scan.score : undefined)"></span>
                            <span class="status-text">{{ getScoreLabel(typeof scan.score === 'number' ? scan.score :
                                undefined) }}</span>
                            <span class="history-date"><i class="fa-regular fa-clock"></i> {{
                                formatRelativeDate(scan.timestamp) }}</span>
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

const getScoreLabel = (score: number | undefined): string => {
    if (score === undefined) return 'Неизвестно';
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

function getStatusDotClass(score: number | undefined) {
    if (typeof score !== 'number') return 'dot-unknown';
    if (score <= 25) return 'dot-bad';
    if (score <= 50) return 'dot-medium';
    if (score <= 75) return 'dot-good';
    return 'dot-excellent';
}
</script>

<style scoped>
.history-page {
    padding: 8px 0 70px 0;
    max-width: 600px;
    margin: 0 auto;
}

.history-page h1 {
    font-size: 2rem;
    color: #23233a;
    margin: 12px 0 18px 16px;
    text-align: left;
    font-weight: 900;
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
    gap: 0;
}

.history-item {
    background: #fff;
    border-bottom: 1px solid #ececec;
    padding: 0 0 0 0;
    cursor: pointer;
    transition: background 0.18s;
}

.history-item:active {
    background: #f6f8fa;
}

.history-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 8px 10px 8px;
}

.history-img-wrap {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    background: #f6f8fa;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.history-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.history-main-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.history-title {
    font-size: 1.08rem;
    font-weight: 700;
    color: #23233a;
    line-height: 1.18;
    margin-bottom: 0;
    white-space: normal;
    word-break: break-word;
}

.history-brand {
    font-size: 0.97rem;
    color: #888;
    margin-bottom: 0;
    line-height: 1.1;
}

.history-status-date {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
}

.status-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 2px;
}

.dot-bad {
    background: #e74c3c;
}

.dot-medium {
    background: #ffb300;
}

.dot-good {
    background: #4ec16e;
}

.dot-excellent {
    background: #2196f3;
}

.dot-unknown {
    background: #bbb;
}

.status-text {
    font-size: 0.99rem;
    color: #23233a;
    font-weight: 500;
}

.history-date {
    font-size: 0.97rem;
    color: #b0b0c3;
    display: flex;
    align-items: center;
    gap: 2px;
}

.history-date i {
    font-size: 1em;
    color: #b0b0c3;
    margin-right: 2px;
}

.delete-btn {
    background: none;
    border: none;
    color: #b0b0c3;
    font-size: 20px;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, transform 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 6px;
}

.delete-btn:hover {
    background: #ffeaea;
    color: #dc3545;
    transform: scale(1.08);
}

@media (max-width: 480px) {
    .history-row {
        gap: 6px;
        padding: 8px 2px 8px 2px;
    }

    .history-img-wrap {
        width: 38px;
        height: 38px;
        border-radius: 6px;
    }

    .history-title {
        font-size: 0.99rem;
    }

    .history-brand {
        font-size: 0.91rem;
    }

    .status-dot {
        width: 8px;
        height: 8px;
    }

    .delete-btn {
        width: 26px;
        height: 26px;
        font-size: 16px;
        margin-left: 2px;
    }
}
</style>