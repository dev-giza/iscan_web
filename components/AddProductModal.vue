<template>
    <div v-if="isOpen" class="modal-overlay" @click="close">
        <div class="modal-content" @click.stop>
            <button class="close-button" @click="close" :disabled="isLoading">&times;</button>

            <div class="add-product-form">
                <h2>Добавить новый продукт</h2>
                <p class="barcode">Штрих-код: {{ barcode }}</p>

                <div class="image-upload-section">
                    <div class="image-upload">
                        <h3>Фото продукта</h3>
                        <label class="upload-area" :class="{ 'has-image': productImage, 'is-loading': isLoading }">
                            <input type="file" accept="image/*" @change="handleProductImage" :disabled="isLoading" />
                            <div v-if="!productImage" class="upload-placeholder">
                                <span>Нажмите или перетащите фото</span>
                            </div>
                            <img v-else :src="productImage" alt="Preview" class="image-preview" />
                            <div v-if="isLoading" class="loading-overlay">
                                <div class="loading-spinner"></div>
                            </div>
                        </label>
                    </div>

                    <div class="image-upload">
                        <h3>Фото состава</h3>
                        <label class="upload-area" :class="{ 'has-image': ingredientsImage, 'is-loading': isLoading }">
                            <input type="file" accept="image/*" @change="handleIngredientsImage"
                                :disabled="isLoading" />
                            <div v-if="!ingredientsImage" class="upload-placeholder">
                                <span>Нажмите или перетащите фото</span>
                            </div>
                            <img v-else :src="ingredientsImage" alt="Preview" class="image-preview" />
                            <div v-if="isLoading" class="loading-overlay">
                                <div class="loading-spinner"></div>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="submit-button" @click="submitImages" :disabled="!canSubmit || isLoading">
                        {{ isLoading ? 'Отправка...' : 'Отправить' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScanStore } from '~/stores/scan'

const props = defineProps<{
    barcode: string
}>()

const emit = defineEmits(['productAdded', 'close'])
const store = useScanStore()

const isOpen = ref(false)
const isLoading = ref(false)
const productImage = ref<string | null>(null)
const ingredientsImage = ref<string | null>(null)

const canSubmit = computed(() => productImage.value && ingredientsImage.value && !isLoading.value)

interface CompressionOptions {
    maxWidth: number;
    maxHeight: number;
    quality: number;
}

const compressImage = async (base64Image: string, isIngredients = false): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')

        img.onerror = () => {
            canvas.width = 0
            canvas.height = 0
            reject(new Error('Ошибка загрузки изображения'))
        }

        img.onload = () => {
            try {
                let width = img.width
                let height = img.height

                // Определяем параметры сжатия
                const options: CompressionOptions = {
                    maxWidth: isIngredients ? 1600 : 1200,
                    maxHeight: isIngredients ? 1600 : 1200,
                    quality: isIngredients ? 0.95 : 0.8
                }

                // Если изображение маленькое, повышаем качество
                if (width * height < 800 * 800) {
                    options.quality = Math.min(options.quality + 0.05, 0.95)
                }

                // Если изображение уже меньше максимальных размеров, не увеличиваем его
                if (width <= options.maxWidth && height <= options.maxHeight) {
                    width = img.width
                    height = img.height
                } else {
                    // Calculate new dimensions while maintaining aspect ratio
                    if (width > height) {
                        if (width > options.maxWidth) {
                            height = Math.round((height * options.maxWidth) / width)
                            width = options.maxWidth
                        }
                    } else {
                        if (height > options.maxHeight) {
                            width = Math.round((width * options.maxHeight) / height)
                            height = options.maxHeight
                        }
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    throw new Error('Не удалось создать контекст canvas')
                }
                ctx.drawImage(img, 0, 0, width, height)

                const compressedBase64 = canvas.toDataURL('image/jpeg', options.quality)

                // Проверяем размер сжатого изображения
                const compressedSize = Math.round((compressedBase64.length * 3) / 4)

                // Если размер все еще слишком большой, пробуем сильнее сжать
                if (compressedSize > 1024 * 1024) { // больше 1MB
                    const newQuality = Math.max(0.6, options.quality - 0.1)
                    const newCompressedBase64 = canvas.toDataURL('image/jpeg', newQuality)
                    canvas.width = 0
                    canvas.height = 0
                    resolve(newCompressedBase64)
                } else {
                    canvas.width = 0
                    canvas.height = 0
                    resolve(compressedBase64)
                }
            } catch (error) {
                canvas.width = 0
                canvas.height = 0
                reject(error)
            }
        }

        img.src = base64Image
    })
}

const handleProductImage = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
        const file = input.files[0]

        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите изображение')
            return
        }

        // Проверяем размер файла
        if (file.size > 10 * 1024 * 1024) { // больше 10MB
            alert('Изображение слишком большое. Пожалуйста, выберите файл меньше 10MB.')
            return
        }

        try {
            isLoading.value = true
            const reader = new FileReader()

            reader.onerror = () => {
                throw new Error('Ошибка чтения файла')
            }

            reader.onload = async (e) => {
                if (e.target?.result) {
                    const base64Image = e.target.result as string
                    const compressedImage = await compressImage(base64Image, false)
                    productImage.value = compressedImage
                }
            }
            reader.readAsDataURL(file)
        } catch (error) {
            console.error('Error processing image:', error)
            alert('Произошла ошибка при обработке изображения')
        } finally {
            isLoading.value = false
        }
    }
}

const handleIngredientsImage = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
        const file = input.files[0]

        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите изображение')
            return
        }

        // Проверяем размер файла
        if (file.size > 10 * 1024 * 1024) { // больше 10MB
            alert('Изображение слишком большое. Пожалуйста, выберите файл меньше 10MB.')
            return
        }

        try {
            isLoading.value = true
            const reader = new FileReader()

            reader.onerror = () => {
                throw new Error('Ошибка чтения файла')
            }

            reader.onload = async (e) => {
                if (e.target?.result) {
                    const base64Image = e.target.result as string
                    const compressedImage = await compressImage(base64Image, true)
                    ingredientsImage.value = compressedImage
                }
            }
            reader.readAsDataURL(file)
        } catch (error) {
            console.error('Error processing image:', error)
            alert('Произошла ошибка при обработке изображения')
        } finally {
            isLoading.value = false
        }
    }
}

const submitImages = async () => {
    if (!productImage.value || !ingredientsImage.value) return;

    isLoading.value = true;
    try {
        // Отправляем полные base64 строки
        const images = [
            productImage.value,
            ingredientsImage.value
        ];

        console.log('Sending images to server:', {
            barcode: props.barcode,
            imagesCount: images.length,
            imagesSizes: images.map(img => Math.round(img.length / 1024) + 'KB')
        });

        const response = await $fetch('/api/update', {
            method: 'POST',
            body: {
                barcode: props.barcode,
                images: images
            }
        });

        if (!response) {
            throw new Error('Ошибка при отправке изображений');
        }

        // Сохраняем данные в store
        store.setCurrentScan(response);
        emit('productAdded', response);
        close();

    } catch (error) {
        console.error('Error submitting images:', error);
        alert('Произошла ошибка при отправке изображений. Пожалуйста, попробуйте еще раз.');
    } finally {
        isLoading.value = false;
    }
}

const open = () => {
    isOpen.value = true
}

const close = () => {
    if (isLoading.value) return;
    isOpen.value = false
    productImage.value = null
    ingredientsImage.value = null
    emit('close')
}

defineExpose({
    open,
    close
})
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 90%;
    width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
}

.close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.close-button:hover {
    background-color: #f0f0f0;
}

.add-product-form h2 {
    margin: 0 0 20px 0;
    text-align: center;
}

.barcode {
    text-align: center;
    color: #666;
    margin-bottom: 20px;
}

.image-upload-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.image-upload h3 {
    margin: 0 0 10px 0;
    font-size: 1rem;
}

.upload-area {
    border: 2px dashed #ddd;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.3s;
    position: relative;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.upload-area:hover {
    border-color: #007bff;
}

.upload-area input[type="file"] {
    display: none;
}

.upload-placeholder {
    color: #666;
}

.image-preview {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.form-actions {
    text-align: center;
}

.submit-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
}

.submit-button:hover:not(:disabled) {
    background-color: #0056b3;
}

.submit-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.upload-area.has-image {
    border-style: solid;
    border-color: #28a745;
}

.upload-area.is-loading {
    pointer-events: none;
    opacity: 0.7;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.form-actions {
    margin-top: 20px;
}
</style>