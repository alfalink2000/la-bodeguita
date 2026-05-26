// helpers/fetchAPIConfig.js
const baseUrl =
  (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api";

const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";

export const fetchAPIConfig = (
  endpoint,
  data,
  method = "GET",
  isFormData = false,
) => {
  const url = `${baseUrl}/${endpoint}`;
  const token = localStorage.getItem("token") || "";

  if (isDevelopment) {
    console.log("🌐 Realizando petición a:", url);
  }

  const config = {
    method,
    headers: {
      "x-token": token,
    },
  };

  // ✅ TIMEOUT AUMENTADO A 60 SEGUNDOS para imágenes grandes
  const timeout = 60000; // 60 segundos

  if (method === "GET") {
    const fetchPromise = fetch(url, config);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout: La petición tardó demasiado")),
        timeout,
      ),
    );

    return Promise.race([fetchPromise, timeoutPromise]).then(
      async (response) => {
        // ✅ Leer el cuerpo de la respuesta como JSON
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.msg || `HTTP error! status: ${response.status}`);
        }

        return body;
      },
    );
  } else {
    if (isFormData) {
      // ✅ NO establecer Content-Type para FormData
      config.body = data;
    } else {
      config.headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(data);
    }

    const fetchPromise = fetch(url, config);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout: La petición tardó demasiado")),
        timeout,
      ),
    );

    return Promise.race([fetchPromise, timeoutPromise]).then(
      async (response) => {
        // ✅ Leer el cuerpo de la respuesta como JSON
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.msg || `HTTP error! status: ${response.status}`);
        }

        return body;
      },
    );
  }
};
