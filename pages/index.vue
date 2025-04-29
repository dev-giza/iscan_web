<template>
    <div class="scanner-page">
        <div class="camera-container">
            <div id="interactive" class="viewport">
                <video ref="video" autoplay playsinline></video>
            </div>
            <div class="scan-overlay">
                <div class="scan-frame"></div>
            </div>
            <div class="scan-hint" v-if="isScanning">
                Наведите камеру на штрих-код
            </div>
        </div>

        <div class="controls">
            <NuxtLink to="/history" class="history-link">
                История сканирований
            </NuxtLink>
        </div>

        <div v-if="error" class="error-message">
            {{ error }}
            <button @click="retryScanning" class="retry-button">Повторить</button>
        </div>

        <LoadingOverlay v-if="loadingText" :text="loadingText" />
        <ScanModal ref="modalRef" @close="restartScanning" />
        <AddProductModal ref="addProductModalRef" :barcode="currentBarcode" @productAdded="handleProductAdded"
            @close="restartScanning" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
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

// Добавляем новые переменные для валидации сканирования
const lastScannedBarcode = ref('')
const scanAttempts = ref(0)
const scanStartTime = ref(0)
const MIN_SCAN_TIME = 1000 // Минимальное время сканирования в мс
const MIN_SCAN_ATTEMPTS = 3 // Минимальное количество попыток
const MAX_SCAN_ATTEMPTS = 6 // Максимальное количество попыток

const store = useScanStore()

const startScanning = async () => {
    try {
        error.value = ''
        isScanning.value = true
        isProcessingBarcode.value = false
        currentBarcode.value = ''
        lastScannedBarcode.value = ''
        scanAttempts.value = 0
        scanStartTime.value = Date.now()

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
                area: {
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
            if (!barcode || isProcessingBarcode.value) return

            console.log('Barcode detected:', barcode)

            // Проверяем длину баркода
            const validLengths = [8, 12, 13] // EAN-8, UPC-A, EAN-13
            if (!validLengths.includes(barcode.length)) {
                console.log('Invalid barcode length:', barcode.length)
                return
            }

            // Проверяем, прошло ли достаточно времени с начала сканирования
            const scanTime = Date.now() - scanStartTime.value
            if (scanTime < MIN_SCAN_TIME) {
                console.log('Scan time too short:', scanTime)
                return
            }

            // Проверяем, совпадает ли текущий баркод с предыдущим
            if (barcode === lastScannedBarcode.value) {
                scanAttempts.value++
                console.log('Same barcode detected, attempts:', scanAttempts.value)
            } else {
                scanAttempts.value = 1
                lastScannedBarcode.value = barcode
                console.log('New barcode detected, resetting attempts')
            }

            // Если достигнуто минимальное количество попыток, обрабатываем баркод
            if (scanAttempts.value >= MIN_SCAN_ATTEMPTS) {
                isProcessingBarcode.value = true
                currentBarcode.value = barcode
                loadingText.value = 'Поиск информации о продукте...'
                try {
                    const response = await $fetch(`/api/find/${barcode}`)
                    console.log('Scan response:', response)

                    if (response.score === null && response.nutrition === null) {
                        console.log('Product not found, opening add modal')
                        currentBarcode.value = barcode
                        addProductModalRef.value?.open()
                    } else {
                        console.log('Product found, opening scan modal')
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

const stopScanning = async () => {
    console.log('Stopping scanning...')
    try {
        // Останавливаем Quagga
        if (Quagga) {
            Quagga.stop()
            // Очищаем все обработчики
            Quagga.offDetected()
            Quagga.offProcessed()
        }

        // Останавливаем видео поток
        if (video.value) {
            const stream = video.value.srcObject as MediaStream
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
                video.value.srcObject = null
            }
        }

        isScanning.value = false
        isProcessingBarcode.value = false
        lastScannedBarcode.value = ''
        scanAttempts.value = 0
        scanStartTime.value = 0
    } catch (err) {
        console.error('Error stopping scanner:', err)
    }
}

const retryScanning = () => {
    error.value = ''
    startScanning()
}

const handleProductAdded = (productData: any) => {
    console.log('Product added successfully:', productData);
    // Останавливаем сканирование
    stopScanning();
    // Сохраняем данные в store
    store.setCurrentScan(productData);
    // Показываем модальное окно с деталями продукта
    modalRef.value?.open();
}

const restartScanning = async () => {
    console.log('Restarting scanning...')
    try {
        // Полностью останавливаем сканирование
        await stopScanning()

        // Очищаем все состояния
        isScanning.value = false
        isProcessingBarcode.value = false
        lastScannedBarcode.value = ''
        scanAttempts.value = 0
        scanStartTime.value = 0
        error.value = ''

        // Даем время на освобождение ресурсов
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Запускаем сканирование заново
        await startScanning()
    } catch (err) {
        console.error('Error restarting scanner:', err)
        error.value = 'Ошибка перезапуска сканера'
    }
}

onMounted(() => {
    startScanning()
})

onUnmounted(() => {
    stopScanning()
})

// Добавляем обработчики активации/деактивации страницы
onActivated(() => {
    console.log('Page activated, restarting scanner')
    restartScanning()
})

onDeactivated(() => {
    console.log('Page deactivated, stopping scanner')
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

.scan-hint {
    position: absolute;
    bottom: 20%;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 1.2rem;
    text-align: center;
    background: rgba(0, 0, 0, 0.6);
    padding: 10px 20px;
    border-radius: 20px;
    white-space: nowrap;
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
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.retry-button {
    background: white;
    color: red;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
}

.retry-button:hover {
    background: #f0f0f0;
}
</style>