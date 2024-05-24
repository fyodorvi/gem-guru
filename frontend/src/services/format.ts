export const toCurrencyDisplay = (value: number) => {
    return '$' + new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((value / 100));
}

export const toCents = (amount: number): number => {
    let cents = amount * 100;
    return Math.round(cents);
}
