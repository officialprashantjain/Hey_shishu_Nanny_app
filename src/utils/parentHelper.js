/**
 * Resolves a friendly display name for the parent.
 * Priority:
 * 1. parent.fullName (if valid non-empty string)
 * 2. parent.name
 * 3. Fallback to "Parent (<last 4 digits>)" if phone is available
 * 4. Fallback to "Parent"
 *
 * Eliminates all static placeholder names (like "Sneha Sharma").
 */
export const resolveParentName = (parent, bookingContact) => {
  if (parent && typeof parent === 'object') {
    if (parent.fullName && typeof parent.fullName === 'string' && parent.fullName.trim()) {
      return parent.fullName.trim();
    }
    if (parent.name && typeof parent.name === 'string' && parent.name.trim()) {
      return parent.name.trim();
    }
  } else if (typeof parent === 'string' && parent.trim() && parent !== 'Sneha Sharma') {
    return parent.trim();
  }

  const phone = (parent && typeof parent === 'object' && parent.phoneNumber) || bookingContact;
  if (phone) {
    const digits = String(phone).replace(/[^0-9]/g, '');
    if (digits.length >= 4) {
      return `Parent (${digits.slice(-4)})`;
    }
  }
  return 'Parent';
};

/**
 * Resolves the parent contact/phone number formatted for display.
 */
export const resolveParentPhone = (parent, bookingContact) => {
  let raw = '';
  let countryCode = '+91';

  if (parent && typeof parent === 'object') {
    raw = parent.phoneNumber || bookingContact || '';
    if (parent.countryCode) {
      countryCode = parent.countryCode;
    }
  } else {
    raw = bookingContact || (typeof parent === 'string' && /^\+?[0-9\s-]+$/.test(parent) ? parent : '');
  }

  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('+')) {
    return trimmed;
  }
  return `${countryCode} ${trimmed}`;
};

/**
 * Resolves a clean phone number string suitable for Linking.openURL(`tel:${cleanPhone}`)
 */
export const getCleanPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return cleaned;
};
