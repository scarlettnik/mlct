const API_BASE = "https://itelma-api.tadpole-sirius.ts.net";

const normalizeBaseUrl = (value = API_BASE) => {
    const raw = String(value || API_BASE)
        .trim()
        .replace(/^['"]|['"]$/g, "")
        .replace(/\/+$/g, "");

    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
};

export const API_BASE_URL = normalizeBaseUrl(API_BASE);

export const apiUrl = (path = "") => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};

export const websocketUrl = (path = "") => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL.replace(/^http/i, "ws")}${normalizedPath}`;
};
