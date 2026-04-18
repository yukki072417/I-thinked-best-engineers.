import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://example.com/api",
  timeout: 5000,
});

// 共通のリクエスト/レスポンス処理
apiClient.interceptors.request.use((config) => {
  // 例: 認証トークンを自動付与
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    throw error;
  }
);
