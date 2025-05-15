import axios from "axios";
import https from "https";
import {
  defineEventHandler,
  readBody,
  createError,
  getRequestHeaders,
  getQuery,
} from "h3";
import FormData from "form-data";
import { readMultipartFormData } from "../../utils/multipart";

interface ApiError {
  statusCode?: number;
  message?: string;
  detail?: any;
}

const VALID_BARCODE_LENGTHS = [8, 12, 13, 14];

export default defineEventHandler(async (event) => {
  try {
    const headers = getRequestHeaders(event);
    const contentType = headers["content-type"] || "";
    const query = getQuery(event);

    let barcode: string;
    let images: any[];

    if (contentType.includes("multipart/form-data")) {
      // Обработка multipart/form-data запроса (из iOS)
      const body = await readMultipartFormData(event);
      if (!body) {
        throw createError({
          statusCode: 400,
          message: "Invalid multipart/form-data request",
        });
      }

      // Получаем barcode из query параметров
      barcode = (query.barcode as string) || "";

      // Получаем только файлы изображений
      images = body
        .filter(
          (part) => part.name === "images" && part.type?.startsWith("image/")
        )
        .map((part) => part.data);

      console.log("Received multipart request:", {
        barcode,
        imagesCount: images.length,
        imageSizes: images.map((img) => Math.round(img.length / 1024) + "KB"),
      });
    } else {
      // Обработка JSON запроса (из веб-версии)
      const body = await readBody(event);
      console.log("Received JSON request:", {
        barcode: body.barcode,
        imagesReceived: body.images?.length || 0,
        imageSizes: body.images?.map(
          (img: string) => Math.round(img.length / 1024) + "KB"
        ),
      });

      barcode = body.barcode;
      images = body.images;

      if (!barcode || !images || !Array.isArray(images)) {
        throw createError({
          statusCode: 400,
          message:
            "Invalid request format. Required: barcode (string) and images (array)",
        });
      }

      // Для JSON запросов проверяем и извлекаем base64 данные
      if (
        !images.every(
          (img: string) => typeof img === "string" && img.startsWith("data:")
        )
      ) {
        throw createError({
          statusCode: 400,
          message: "All images must be base64 data URLs",
        });
      }
      images = images.map((img: string) =>
        Buffer.from(img.split(",")[1], "base64")
      );
    }

    // Общие проверки
    if (!barcode) {
      throw createError({
        statusCode: 400,
        message: "Barcode is required",
      });
    }

    if (!/^\d+$/.test(barcode)) {
      throw createError({
        statusCode: 400,
        message: "Barcode must contain only digits",
      });
    }

    if (!VALID_BARCODE_LENGTHS.includes(barcode.length)) {
      throw createError({
        statusCode: 400,
        message: `Invalid barcode length. Must be one of: ${VALID_BARCODE_LENGTHS.join(
          ", "
        )} digits`,
      });
    }

    if (images.length === 0) {
      throw createError({
        statusCode: 400,
        message: "No images provided",
      });
    }

    // Создаем multipart/form-data для отправки на сервер
    const formData = new FormData();

    // Добавляем изображения как отдельные файлы
    images.forEach((imageBuffer, index) => {
      formData.append("images", imageBuffer, {
        filename: `image${index + 1}.jpg`,
        contentType: "image/jpeg",
      });
    });

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    // Логируем данные перед отправкой
    console.log("Preparing request data:", {
      barcode,
      imagesCount: images.length,
      requestURL: `https://iscan.store/update/${barcode}?x_api_key=${process.env.API_SECRET_KEY}`,
    });

    console.log("Sending update request to iscan.store with barcode:", barcode);
    const url = `https://iscan.store/update/${barcode}?x_api_key=${process.env.API_SECRET_KEY}`;
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        accept: "application/json",
      },
      httpsAgent,
    });

    console.log("Update API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Update API Error:", {
      message: error?.message || "Unknown error",
      response: error?.response?.data,
      status: error?.response?.status,
      details: error?.response?.data?.detail,
    });

    // Если это ошибка валидации (422), форматируем сообщение об ошибке
    if (
      error?.response?.status === 422 &&
      Array.isArray(error?.response?.data?.detail)
    ) {
      const validationErrors = error.response.data.detail
        .map((err: any) => err.msg || JSON.stringify(err))
        .join("; ");

      throw createError({
        statusCode: 422,
        message: `Validation error: ${validationErrors}`,
      });
    }

    const errorMessage =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Unknown error";

    throw createError({
      statusCode: error?.response?.status || 500,
      message: `Failed to update product: ${errorMessage}`,
    });
  }
});
