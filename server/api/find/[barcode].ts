import axios from "axios";
import https from "https";

const VALID_BARCODE_LENGTHS = [8, 12, 13, 14];

export default defineEventHandler(async (event) => {
  const barcode = getRouterParam(event, "barcode");

  if (!barcode) {
    throw createError({
      statusCode: 400,
      message: "Barcode is required",
    });
  }

  // Проверяем, что штрих-код состоит только из цифр
  if (!/^\d+$/.test(barcode)) {
    throw createError({
      statusCode: 400,
      message: "Barcode must contain only digits",
    });
  }

  // Проверяем длину штрих-кода
  if (!VALID_BARCODE_LENGTHS.includes(barcode.length)) {
    throw createError({
      statusCode: 400,
      message: `Invalid barcode length. Must be one of: ${VALID_BARCODE_LENGTHS.join(
        ", "
      )} digits`,
    });
  }

  const url = `https://iscan.store/find/${barcode}?x_api_key=${process.env.API_SECRET_KEY}`;

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    console.log("Fetching from:", url);
    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "x-api-key": process.env.API_SECRET_KEY,
      },
      httpsAgent,
    });

    return response.data;
  } catch (error: any) {
    console.error("API Error:", {
      message: error?.message || "Unknown error",
      url: url,
      response: error?.response?.data,
      status: error?.response?.status,
      headers: error?.response?.headers,
      full: error,
    });
    throw createError({
      statusCode: error?.response?.status || 500,
      message: (() => {
        const data = error?.response?.data;
        if (Array.isArray(data?.detail)) {
          return data.detail
            .map((d: any) => d.msg || JSON.stringify(d))
            .join("; ");
        }
        return (
          data?.message || data?.detail || error?.message || "Unknown error"
        );
      })(),
    });
  }
});
