export function parsePositiveInteger(value: unknown): number | null {
    if (typeof value === "number") {
        return Number.isInteger(value) && value > 0 && value <= 2147483647 ? value : null;
    }

    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
        return null;
    }

    const parsedValue = Number(value);
    return Number.isSafeInteger(parsedValue) && parsedValue <= 2147483647 ? parsedValue : null;
}
