/**
 * Currency formatting utilities for Rwandan Francs (RWF)
 */

/**
 * Format a number as Rwandan Francs
 * @param amount - The amount to format
 * @param includeDecimals - Whether to include decimal places (default: false for RWF)
 * @returns Formatted currency string
 */
export function formatRWF(amount: number, includeDecimals: boolean = false): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return 'FRw 0';
    }

    const fixedAmount = includeDecimals ? amount.toFixed(2) : Math.round(amount).toString();

    // Format with space as thousand separator
    const parts = fixedAmount.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    if (includeDecimals && parts[1]) {
        return `FRw ${integerPart}.${parts[1]}`;
    }

    return `FRw ${integerPart}`;
}

/**
 * Parse a RWF formatted string back to a number
 * @param formattedAmount - The formatted currency string
 * @returns The numeric value
 */
export function parseRWF(formattedAmount: string): number {
    if (!formattedAmount) return 0;

    // Remove currency symbol and spaces
    const cleaned = formattedAmount.replace(/FRw/g, '').replace(/\s/g, '').trim();
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convert USD to RWF (approximate rate)
 * @param usdAmount - Amount in USD
 * @returns Amount in RWF
 */
export function usdToRWF(usdAmount: number): number {
    const EXCHANGE_RATE = 1300; // Approximate USD to RWF rate
    return Math.round(usdAmount * EXCHANGE_RATE);
}
