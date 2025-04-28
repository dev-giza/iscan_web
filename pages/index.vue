<template>
    <div class="scanner-page">
        <div class="camera-container">
            <div id="interactive" class="viewport">
                <video ref="video" autoplay playsinline></video>
            </div>
            <div class="scan-overlay">
                <div class="scan-frame"></div>
            </div>
            <button @click="startScanning" :disabled="isScanning" class="scan-button">
                {{ isScanning ? 'Сканирование...' : 'Начать сканирование' }}
            </button>
        </div>

        <div class="controls">
            <NuxtLink to="/history" class="history-link">
                История сканирований
            </NuxtLink>
        </div>

        <div v-if="error" class="error-message">
            {{ error }}
        </div>

        <LoadingOverlay v-if="loadingText" :text="loadingText" />
        <ScanModal ref="modalRef" />
        <AddProductModal ref="addProductModalRef" :barcode="currentBarcode" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useScanStore } from '~/stores/scan'
import Quagga from '@ericblade/quagga2'
import LoadingOverlay from '~/components/LoadingOverlay.vue'

const video = ref(null)
const isScanning = ref(false)
const error = ref('')
const modalRef = ref()
const addProductModalRef = ref()
const isProcessingBarcode = ref(false)
const currentBarcode = ref('')
const loadingText = ref('')

const store = useScanStore()

const startScanning = async () => {
    try {
        error.value = ''
        isScanning.value = true
        isProcessingBarcode.value = false
        currentBarcode.value = ''

        // Инициализируем Quagga
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector("#interactive"),
                constraints: {
                    facingMode: "environment",
                    aspectRatio: { min: 1, max: 2 },
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 }
                },
                area: { // Определяем область сканирования
                    top: "25%",
                    right: "15%",
                    left: "15%",
                    bottom: "25%",
                },
            },
            decoder: {
                readers: [
                    "ean_reader",
                    "ean_8_reader",
                    "code_128_reader",
                    "code_39_reader",
                    "upc_reader",
                    "upc_e_reader"
                ],
                debug: {
                    drawBoundingBox: true,
                    showPattern: true,
                    showCanvas: true
                },
                multiple: false,
                frequency: 10,
                patternTimeout: 100
            },
            locate: true,
            locator: {
                halfSample: true,
                patchSize: "medium",
                debug: {
                    showCanvas: true,
                    showPatches: true,
                    showFoundPatches: true,
                    showSkeleton: true,
                    showLabels: true,
                    showPatchLabels: true,
                    showRemainingPatchLabels: true,
                    boxFromPatches: {
                        showTransformed: true,
                        showTransformedBox: true,
                        showBB: true
                    }
                }
            }
        }, function (err) {
            if (err) {
                console.error('Quagga initialization error:', err)
                error.value = 'Ошибка инициализации сканера'
                isScanning.value = false
                return
            }

            console.log('Quagga initialized successfully')
            Quagga.start()
        })

        // Добавляем обработчик результатов
        Quagga.onDetected(async (result) => {
            const barcode = result.codeResult.code
            if (barcode && !isProcessingBarcode.value) {
                console.log('Barcode detected:', barcode)

                // Проверяем длину баркода
                const validLengths = [8, 12, 13] // EAN-8, UPC-A, EAN-13
                if (!validLengths.includes(barcode.length)) {
                    console.log('Invalid barcode length:', barcode.length)
                    return
                }

                isProcessingBarcode.value = true
                currentBarcode.value = barcode
                loadingText.value = 'Поиск информации о продукте...'
                try {
                    const response = await $fetch(`/api/find/${barcode}`)
                    if (response.score === null && response.nutrition === null) {
                        addProductModalRef.value?.open()
                    } else {
                        store.setCurrentScan(response)
                        modalRef.value?.open()
                    }
                    stopScanning()
                } catch (err) {
                    console.error('Error fetching product:', err)
                    error.value = 'Ошибка при получении данных о продукте'
                    isProcessingBarcode.value = false
                } finally {
                    loadingText.value = ''
                }
            }
        })

    } catch (err) {
        console.error('Scanner initialization error:', err)
        error.value = err instanceof Error ? err.message : 'Ошибка доступа к камере'
        isScanning.value = false
    }
}

const stopScanning = () => {
    isScanning.value = false
    isProcessingBarcode.value = false
    Quagga.stop()
}

onUnmounted(() => {
    stopScanning()
})
</script>

<style scoped>
.scanner-page {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #000;
    display: flex;
    flex-direction: column;
}

.camera-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.viewport {
    width: 100%;
    height: 100%;
}

.viewport>video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.viewport>canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.scan-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.scan-frame {
    width: 80%;
    max-width: 300px;
    aspect-ratio: 1;
    border: 2px solid #fff;
    border-radius: 20px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}

.scan-button {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    border: none;
    padding: 15px 30px;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 500;
    color: #000;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
}

.scan-button:disabled {
    background: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
}

.controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 300px;
}

.history-link {
    display: block;
    text-align: center;
    padding: 12px 24px;
    background-color: #6c757d;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.history-link:hover {
    background-color: #5a6268;
}

.error-message {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    max-width: 90%;
    text-align: center;
    z-index: 10;
}
</style>