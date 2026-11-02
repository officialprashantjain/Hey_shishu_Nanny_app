/**
 * Utilities for resolving and formatting booking dates and times across Nanny App.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a date value (ISO string, date string, or Date object) into "D MMM YYYY" (e.g. "1 Nov 2026").
 * Extracts date parts directly from YYYY-MM-DD strings to prevent UTC timezone date-shifting.
 */
export function formatBookingDate(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      if (!isNaN(day) && month >= 1 && month <= 12 && !isNaN(year)) {
        return `${day} ${MONTHS[month - 1]} ${year}`;
      }
    }
  }

  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Formats a time string (e.g. "09:00", "9:00", "13:30", or ISO date string) into 12-hour AM/PM format (e.g. "9:00 AM", "1:30 PM").
 */
export function formatSlotTime(timeVal) {
  if (!timeVal) return '';

  const str = String(timeVal).trim();

  // Already has AM / PM
  if (/am|pm/i.test(str)) {
    return str;
  }

  // Matches HH:mm
  const match = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hour = parseInt(match[1], 10);
    const minute = match[2];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  }

  // Check if it is a valid date string (e.g. ISO format)
  const d = new Date(timeVal);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return str;
}

/**
 * Resolves accurate date and time schedule strings from a booking document.
 * Correctly prioritizes bookingDate & slots over raw startDateTime/endDateTime UTC timestamps.
 */
export function resolveBookingDateAndSchedule(booking, activeShift = null) {
  if (!booking) {
    return {
      dateStr: '',
      timeStr: '',
      startTimeStr: '',
      endTimeStr: '',
      totalHoursStr: '',
    };
  }

  // 1. Resolve Date
  let dateStr = '';
  if (activeShift?.date) {
    dateStr = formatBookingDate(activeShift.date);
  } else if (booking.bookingMode === 'date_range' && booking.dateRange) {
    const fromStr = formatBookingDate(booking.dateRange?.from || booking.startDateTime);
    const tillStr = formatBookingDate(booking.dateRange?.till || booking.endDateTime);
    dateStr = (fromStr && tillStr && fromStr !== tillStr) ? `${fromStr} – ${tillStr}` : (fromStr || tillStr || '');
  } else {
    // Single day or default
    dateStr = formatBookingDate(booking.bookingDate || booking.startDateTime || booking.date);
  }

  // 2. Resolve Slot Times
  let rawStart = '';
  let rawEnd = '';

  if (Array.isArray(booking.slots) && booking.slots.length > 0) {
    const sorted = [...booking.slots].sort((a, b) =>
      String(a?.startTime || '').localeCompare(String(b?.startTime || ''))
    );
    rawStart = sorted[0]?.startTime || '';
    rawEnd = sorted[sorted.length - 1]?.endTime || '';
  }

  if (!rawStart && booking.startDateTime) {
    rawStart = booking.startDateTime;
  }
  if (!rawEnd && booking.endDateTime) {
    rawEnd = booking.endDateTime;
  }

  const startTimeStr = formatSlotTime(rawStart);
  const endTimeStr = formatSlotTime(rawEnd);
  const timeStr = (startTimeStr && endTimeStr)
    ? `${startTimeStr} – ${endTimeStr}`
    : (startTimeStr || endTimeStr || '');

  // 3. Resolve Duration
  let totalHours = booking.totalSlotHours;
  if (!totalHours && Array.isArray(booking.slots) && booking.slots.length > 0) {
    totalHours = booking.slots.reduce((acc, slot) => {
      if (!slot?.startTime || !slot?.endTime) return acc;
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return acc;
      return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    }, 0);
  }
  if (!totalHours && booking.startDateTime && booking.endDateTime) {
    const diffMs = Math.abs(new Date(booking.endDateTime) - new Date(booking.startDateTime));
    totalHours = Math.round(diffMs / (1000 * 60 * 60));
  }

  const rounded = totalHours ? (totalHours % 1 === 0 ? totalHours : Number(totalHours).toFixed(1)) : 1;
  const totalHoursStr = `${rounded} ${rounded === 1 ? 'Hour' : 'Hours'}`;

  return {
    dateStr,
    timeStr,
    startTimeStr,
    endTimeStr,
    totalHoursStr,
  };
}

/**
 * Resolves both manually entered address fields (flatNumber, landmark, fullAddress)
 * and Google Maps selected location (area, city, pincode) from a booking document.
 */
export function resolveBookingAddress(addressObj) {
  if (!addressObj) {
    return {
      formattedFullAddress: 'Address not specified',
      manualAddress: '',
      mapLocation: '',
      flatNumber: '',
      landmark: '',
      area: '',
      city: '',
      pincode: '',
      fullAddressText: '',
    };
  }

  if (typeof addressObj === 'string') {
    return {
      formattedFullAddress: addressObj,
      manualAddress: addressObj,
      mapLocation: '',
      flatNumber: '',
      landmark: '',
      area: '',
      city: '',
      pincode: '',
      fullAddressText: addressObj,
    };
  }

  const flatNumber = (addressObj.flatNumber || '').trim();
  const landmark = (addressObj.landmark || '').trim();
  const fullAddress = (addressObj.fullAddress || '').trim();
  const area = (addressObj.area || '').trim();
  const city = (addressObj.city || '').trim();
  const pincode = (addressObj.pincode || '').trim();

  // 1. Google Map Location (Area, City, Pincode)
  const mapParts = [];
  if (area) mapParts.push(area);
  if (city) mapParts.push(city);
  if (pincode) mapParts.push(pincode);
  const mapLocation = mapParts.join(', ');

  // 2. Manual Address Details (Flat/House No, Landmark, Full Address note)
  const manualParts = [];
  if (flatNumber) {
    manualParts.push(
      /^(flat|house|apt|apartment|villa|tower|block)\b/i.test(flatNumber)
        ? flatNumber
        : `Flat/House: ${flatNumber}`
    );
  }
  if (landmark) {
    manualParts.push(
      /^(landmark|near)\b/i.test(landmark)
        ? landmark
        : `Landmark: ${landmark}`
    );
  }

  const mapLower = mapLocation.toLowerCase();
  const fullLower = fullAddress.toLowerCase();
  if (fullAddress && fullAddress !== mapLocation && !mapLower.includes(fullLower)) {
    manualParts.push(fullAddress);
  }
  const manualAddress = manualParts.join(', ');

  // 3. Full Combined Address (All parts without redundancy)
  const allParts = [];
  if (flatNumber) allParts.push(flatNumber);
  if (landmark) allParts.push(/^near\b/i.test(landmark) ? landmark : `Near ${landmark}`);
  if (fullAddress && fullAddress !== area && fullAddress !== city && !mapLower.includes(fullLower)) {
    allParts.push(fullAddress);
  }
  if (area && !fullLower.includes(area.toLowerCase())) allParts.push(area);
  if (city && !fullLower.includes(city.toLowerCase())) allParts.push(city);
  if (pincode && !fullLower.includes(pincode.toLowerCase())) allParts.push(pincode);

  let formattedFullAddress = allParts.filter(Boolean).join(', ');
  if (!formattedFullAddress) {
    formattedFullAddress = fullAddress || mapLocation || 'Address not specified';
  }

  return {
    formattedFullAddress,
    manualAddress: manualAddress || fullAddress || '',
    mapLocation: mapLocation || area || city || '',
    flatNumber,
    landmark,
    area,
    city,
    pincode,
    fullAddressText: fullAddress,
  };
}

/**
 * Resolves the accurate dynamic distance string (e.g. "1.8 km") from a booking document.
 * Returns null if no valid distance is available (avoiding static fake placeholders).
 */
export function resolveBookingDistance(booking) {
  if (!booking) return null;

  if (booking.distanceKm != null && !isNaN(Number(booking.distanceKm))) {
    return `${Number(booking.distanceKm)} km`;
  }

  if (typeof booking.distance === 'string' && booking.distance.trim().length > 0 && booking.distance !== '1.8 km') {
    return booking.distance.trim();
  }

  return null;
}


