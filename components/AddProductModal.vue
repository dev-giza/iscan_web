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
    <transition name="fade">
        <div v-if="showSentToast" class="sent-toast">
            Данные отправлены! Они будут обработаны в ближайшее время.
        </div>
    </transition>
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
const showSentToast = ref(false)

const canSubmit = computed(() => productImage.value && ingredientsImage.value && !isLoading.value)

function compressImage(file: File, maxWidth = 1200, quality = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        img.onload = () => {
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Не удалось получить 2D контекст canvas'));
                return;
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showSentNotification() {
    showSentToast.value = true
    setTimeout(() => {
        showSentToast.value = false
    }, 3000)
}

const handleProductImage = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        productImage.value = await compressImage(file, 1200, 0.85);
        if (productImage.value && ingredientsImage.value) {
            submitImages();
            close();
            showSentNotification();
        }
    }
}

const handleIngredientsImage = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        ingredientsImage.value = await compressImage(file, 1200, 0.85);
        if (productImage.value && ingredientsImage.value) {
            submitImages();
            close();
            showSentNotification();
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

.sent-toast {
    position: fixed;
    left: 50%;
    bottom: 32px;
    transform: translateX(-50%);
    background: #23233a;
    color: #fff;
    padding: 14px 28px;
    border-radius: 12px;
    box-shadow: 0 4px 18px rgba(60, 60, 120, 0.13);
    font-size: 1.08rem;
    z-index: 2000;
    opacity: 0.97;
    pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>