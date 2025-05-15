import axios from "axios";
import https from "https";

export default defineEventHandler(async (event) => {
  const url = `https://iscan.store/products`;

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "x-api-key": process.env.API_SECRET_KEY,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch products list",
    });
  }
});
