import axios from "axios";
import https from "https";
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    console.log("Received request body:", {
      hasBarcode: !!body.barcode,
      imagesCount: body.images?.length,
      firstImageLength: body.images?.[0]?.length,
    });

    const { barcode, images } = body;

    if (!barcode || !images || !Array.isArray(images) || images.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Barcode and images are required",
      });
    }

    const url = `https://iscan.store/update/${barcode}?x_api_key=${process.env.API_SECRET_KEY}`;
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    // Подготавливаем данные для отправки
    const boundary =
      "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const chunks = [];

    // Добавляем изображения
    images.forEach((imageData, index) => {
      try {
        const base64Data = imageData.split(",")[1];
        if (!base64Data) {
          throw new Error(`Invalid image data format at index ${index}`);
        }

        const buffer = Buffer.from(base64Data, "base64");
        console.log(`Processing image ${index + 1}:`, {
          originalLength: imageData.length,
          base64Length: base64Data.length,
          bufferLength: buffer.length,
        });

        chunks.push(
          `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="images"; filename="image${
              index + 1
            }.jpg"\r\n` +
            `Content-Type: image/jpeg\r\n\r\n`
        );
        chunks.push(buffer);
        chunks.push("\r\n");
      } catch (error) {
        console.error(`Error processing image ${index + 1}:`, error);
        throw error;
      }
    });

    // Завершаем multipart
    chunks.push(`--${boundary}--\r\n`);

    // Объединяем все части в один буфер
    const requestData = Buffer.concat(
      chunks.map((chunk) =>
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      )
    );

    console.log("Sending update request to:", url);
    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        accept: "application/json",
      },
      httpsAgent,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    console.log("Update API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("API Error:", {
      message: error?.message || "Unknown error",
      stack: error?.stack,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    throw createError({
      statusCode: error?.response?.status || 500,
      message: `Failed to update product: ${error?.message || "Unknown error"}`,
    });
  }
});
