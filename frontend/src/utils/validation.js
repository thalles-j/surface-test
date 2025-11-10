export function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function required(v) {
    return String(v ?? "").trim() !== "";
}

export function minLen(v, len) {
    return String(v || "").trim().length >= len;
}

export function passwordMin7(v) {
    return minLen(v, 7);
}

export function onlyDigits(v) {
    return /^\d+$/.test(v);
}

export function phoneMin9Digits(v) {
    const d = (v || "").replace(/\D/g, "");
    return d.length >= 9;
}
