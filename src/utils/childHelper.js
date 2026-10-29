/**
 * Helpers for resolving child details consistently across Nanny App
 */

export const getChildAgeText = (child) => {
  if (!child) return '';
  if (child.age != null && child.age !== '') {
    return `${child.age} Years Old`;
  }
  if (child.dateOfBirth) {
    const dob = new Date(child.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${Math.max(0, age)} Years Old`;
  }
  return '';
};

export const getChildPhotoSource = (child) => {
  if (child?.photo) {
    return { uri: child.photo };
  }
  const gender = (child?.gender || '').toLowerCase();
  if (gender === 'female' || gender === 'girl') {
    return require('../../assets/icons/polly.svg');
  }
  return require('../../assets/icons/jack.svg');
};

export const resolveChildName = (childIds, fallback = 'Child') => {
  if (!childIds) return fallback;
  const list = Array.isArray(childIds) ? childIds : [childIds];
  const names = list
    .map((c) => {
      if (typeof c === 'string') return '';
      const fullName = `${c?.firstName || ''} ${c?.lastName || ''}`.trim();
      return fullName || c?.firstName || '';
    })
    .filter(Boolean);

  if (names.length === 0) return fallback;
  return names.join(', ');
};

export const resolveChildAge = (childIds) => {
  if (!childIds) return '';
  const list = Array.isArray(childIds) ? childIds : [childIds];
  const firstChild = list[0];
  return getChildAgeText(firstChild);
};

export const resolveChildPhoto = (childIds) => {
  if (!childIds) return require('../../assets/icons/jack.svg');
  const list = Array.isArray(childIds) ? childIds : [childIds];
  const firstChild = list[0];
  return getChildPhotoSource(firstChild);
};

export const resolveChildList = (childIds) => {
  if (!childIds) return [];
  const list = Array.isArray(childIds) ? childIds : [childIds];
  return list
    .filter((c) => c && typeof c === 'object')
    .map((c) => {
      const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.firstName || 'Child';
      const ageText = getChildAgeText(c);
      const photoSource = getChildPhotoSource(c);
      const allergiesList = Array.isArray(c.allergies)
        ? c.allergies.filter(Boolean)
        : typeof c.allergies === 'string' && c.allergies.trim()
        ? c.allergies.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      return {
        _id: c._id || c.id,
        name,
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        gender: c.gender || '',
        dateOfBirth: c.dateOfBirth,
        age: c.age,
        ageText,
        photo: c.photo || null,
        photoSource,
        allergies: allergiesList,
        specialNeeds: c.specialNeeds || '',
        medicalNotes: c.medicalNotes || '',
      };
    });
};
