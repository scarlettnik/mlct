/**
 * Formats seconds into MM:SS string.
 * @param {number} sec 
 * @returns {string}
 */
export const formatTimeMMSS = (sec) => {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
};

/**
 * Formats date string from YYYY-MM-DD to DD.MM.YYYY.
 * @param {string} dateString 
 * @returns {string}
 */
export const formatDate = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateString;
};
