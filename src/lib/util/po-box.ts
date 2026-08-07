// Detects PO Box / Post Office Box style addresses so they can be rejected
// as a shipping address (prescriptions require a physical street address).
// Google Places autocomplete only pre-fills address_1 — the customer can
// still overwrite it by hand, or put the PO Box in address_2 ("Apartment,
// suite, unit, etc.") instead, so every caller must check both fields.
export function isPoBoxAddress(value?: string | null): boolean {
  if (!value) return false
  const normalized = value.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim()
  return /\b(p\s?o\s?box|post\s?office\s?box|p\s?o\s?b|box\s?#?\s?\d+)\b/.test(normalized)
}

// Checks both street-address lines — a PO Box in either one should be rejected.
export function hasPoBoxAddress(address1?: string | null, address2?: string | null): boolean {
  return isPoBoxAddress(address1) || isPoBoxAddress(address2)
}
