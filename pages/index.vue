<template>
    <div class="scanner-page">
        <div class="camera-container">
            <video ref="video" autoplay playsinline></video>
            <canvas ref="canvas" style="display: none;"></canvas>
        </div>

        <div class="controls">
            <button @click="startScanning" :disabled="isScanning">
                {{ isScanning ? 'Сканирование...' : 'Начать сканирование' }}
            </button>
            <NuxtLink to="/history" class="history-link">
                История сканирований
            </NuxtLink>
        </div>

        <div v-if="error" class="error-message">
            {{ error }}
        </div>

        <ScanModal ref="modalRef" />
        <AddProductModal ref="addProductModalRef" :barcode="currentBarcode" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useScanStore } from '~/stores/scan'
import Quagga from '@ericblade/quagga2'

const video = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const isScanning = ref(false)
const error = ref('')
const modalRef = ref()
const addProductModalRef = ref()
const isProcessingBarcode = ref(false)
const currentBarcode = ref('')

const store = useScanStore()

const startScanning = async () => {
    try {
        error.value = ''
        isScanning.value = true
        isProcessingBarcode.value = false
        currentBarcode.value = ''

        // Запрашиваем доступ к камере
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 }
            }
        });

        // Подключаем видеопоток
        if (video.value) {
            video.value.srcObject = stream;
            await new Promise((resolve) => {
                video.value!.onloadedmetadata = resolve;
            });
        }

        // Инициализируем Quagga
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: video.value,
                constraints: {
                    facingMode: "environment"
                }
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"]
            }
        }, (err) => {
            if (err) {
                console.error('Quagga initialization error:', err);
                error.value = 'Ошибка инициализации сканера';
                isScanning.value = false;
                return;
            }

            console.log('Quagga initialized successfully');
            Quagga.start();
        });

        Quagga.onDetected(async (result) => {
            const barcode = result.codeResult.code;
            if (barcode && !isProcessingBarcode.value) {
                isProcessingBarcode.value = true;
                currentBarcode.value = barcode;
                try {
                    const response = await $fetch(`/api/find/${barcode}`);
                    if (response.score === null && response.nutrition === null) {
                        addProductModalRef.value?.open();
                    } else {
                        store.setCurrentScan({
                            barcode: response.barcode,
                            name: response.product_name,
                            brand: response.manufacturer || undefined,
                            image: response.image_front || undefined
                        });
                        modalRef.value?.open();
                    }
                    stopScanning();
                } catch (err) {
                    console.error('Error fetching product:', err);
                    error.value = 'Ошибка при получении данных о продукте';
                    isProcessingBarcode.value = false;
                }
            }
        });

    } catch (err) {
        console.error('Camera access error:', err);
        error.value = 'Ошибка доступа к камере. Пожалуйста, убедитесь, что вы дали разрешение на использование камеры.';
        isScanning.value = false;
    }
};

const stopScanning = () => {
    isScanning.value = false;
    isProcessingBarcode.value = false;

    // Останавливаем видеопоток
    if (video.value?.srcObject) {
        const stream = video.value.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }

    // Останавливаем Quagga
    Quagga.stop();
};

onUnmounted(() => {
    stopScanning()
})
</script>

<style scoped>
.scanner-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    min-height: 100vh;
}

.camera-container {
    width: 100%;
    max-width: 640px;
    margin: 0 auto 20px;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    aspect-ratio: 4/3;
}

.camera-container video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
}

.drawingBuffer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 300px;
}

button {
    padding: 12px 24px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.2s;
}

button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

button:not(:disabled):hover {
    background-color: #0056b3;
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
    margin-top: 20px;
    padding: 10px;
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    text-align: center;
}
</style>