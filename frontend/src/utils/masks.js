export function maskPhone(v = "") {
    const d = v.replace(/\D/g, "").slice(0, 11);

    if (d.length === 11) {
        return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }

    return d.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
}