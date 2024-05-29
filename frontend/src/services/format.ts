export const toCurrencyDisplay = (value: number|string) => {
    let valueToConvert: number;
    if (typeof value === 'string') {
        valueToConvert = parseInt(value);
    } else {
        valueToConvert = value;
    }
    return '$' + new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((valueToConvert / 100));
}

export const toCents = (amount: number): number => {
    let cents = amount * 100;
    return Math.round(cents);
}
