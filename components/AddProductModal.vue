<template>
    <div v-if="isOpen" class="modal-overlay" @click="close">
        <div class="modal-content" @click.stop>
            <button class="close-button" @click="close">&times;</button>

            <div class="add-product-form">
                <h2>Добавить новый продукт</h2>
                <p class="barcode">Штрих-код: {{ barcode }}</p>

                <div class="image-upload-section">
                    <div class="image-upload">
                        <h3>Фото продукта</h3>
                        <label class="upload-area" :class="{ 'has-image': productImage }">
                            <input type="file" accept="image/*" @change="handleProductImage" />
                            <div v-if="!productImage" class="upload-placeholder">
                                <span>Нажмите или перетащите фото</span>
                            </div>
                            <img v-else :src="productImage" alt="Preview" class="image-preview" />
                        </label>
                    </div>

                    <div class="image-upload">
                        <h3>Фото состава</h3>
                        <label class="upload-area" :class="{ 'has-image': ingredientsImage }">
                            <input type="file" accept="image/*" @change="handleIngredientsImage" />
                            <div v-if="!ingredientsImage" class="upload-placeholder">
                                <span>Нажмите или перетащите фото</span>
                            </div>
                            <img v-else :src="ingredientsImage" alt="Preview" class="image-preview" />
                        </label>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="submit-button" @click="submitImages" :disabled="!canSubmit">
                        Отправить
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
    barcode: string
}>()

const isOpen = ref(false)
const productImage = ref<string | null>(null)
const ingredientsImage = ref<string | null>(null)

const canSubmit = computed(() => productImage.value && ingredientsImage.value)

const handleProductImage = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            productImage.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }
}

const handleIngredientsImage = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            ingredientsImage.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }
}

const submitImages = async () => {
    try {
        // Здесь будет отправка изображений на сервер
        console.log('Submitting images for barcode:', props.barcode)
        console.log('Product image:', productImage.value)
        console.log('Ingredients image:', ingredientsImage.value)
        close()
    } catch (error) {
        console.error('Error submitting images:', error)
    }
}

const open = () => {
    isOpen.value = true
}

const close = () => {
    isOpen.value = false
    productImage.value = null
    ingredientsImage.value = null
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
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
}

.submit-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.submit-button:not(:disabled):hover {
    background-color: #0056b3;
}

.upload-area.has-image {
    border-style: solid;
    border-color: #28a745;
}
</style>