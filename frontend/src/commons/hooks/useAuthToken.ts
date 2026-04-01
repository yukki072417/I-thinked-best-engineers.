import { useState } from "react";

const TOKEN_KEY = "github_access_token";

export function useAuthToken() {
  const [token, setTokenState] = useState<string | null>(
    () => sessionStorage.getItem(TOKEN_KEY)
  );

  const setToken = (t: string) => {
    sessionStorage.setItem(TOKEN_KEY, t);
    setTokenState(t);
  };

  const clearToken = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
  };

  return { token, setToken, clearToken };
}
