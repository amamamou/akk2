/** Platform default: Euro (€) for billing, invoices, and pricing UI. */
export const DEFAULT_CURRENCY = "EUR";

export function formatMoney(
  amount: number,
  locale = "fr-FR",
  currency = DEFAULT_CURRENCY
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMoneyLabel(): string {
  return "Amount (EUR)";
}
