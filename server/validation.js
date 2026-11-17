'use strict';

// Checks and cleans what the user sends. Messages are in Bulgarian because
// the web page shows them as they are.

const PHONE_TYPES = ['мобилен', 'домашен', 'служебен', 'друг'];

const NAME_RE = /^[\p{L}][\p{L}\p{M} .'’-]*$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ValidationError extends Error {
  constructor(fields) {
    super(Object.values(fields)[0]);
    this.fields = fields;
  }
}

/**
 * Brings a phone number to one form, so "0888 123 456", "+359 888 123 456"
 * and "00359888123456" are the same number: "+359888123456".
 * Returns null if it is not a phone number.
 */
function normalizePhone(input) {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  let text = String(input).trim();
  if (!/^[+\d][\d\s().\/-]*$/.test(text)) return null;
  const plus = text.startsWith('+');
  let digits = text.replace(/\D/g, '');

  if (plus || digits.startsWith('00')) {
    if (digits.startsWith('00')) digits = digits.slice(2);
    return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : null;
  }
  // Bulgarian number with a leading 0: 0888 123 456 (mobile), 02 123 4567 (Sofia).
  if (digits.startsWith('0') && digits.length >= 8 && digits.length <= 10) {
    return `+359${digits.slice(1)}`;
  }
  // Short numbers such as 112 or a local number without an area code.
  return digits.length >= 3 && digits.length <= 15 ? digits : null;
}

/** "+359888123456" -> "0888 123 456"; other numbers are shown as stored. */
function formatPhone(number) {
  const m = /^\+359(\d+)$/.exec(number);
  if (!m) return number;
  const rest = m[1];
  if (rest.length === 9) return `0${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  if (rest.length === 8 && rest.startsWith('2')) return `02 ${rest.slice(1, 4)} ${rest.slice(4)}`;
  if (rest.length === 8) return `0${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
  return `0${rest}`;
}

/** Only the digits, for searching: "+359888123456" also matches "0888". */
function phoneSearchText(number) {
  const national = /^\+359/.test(number) ? `0${number.slice(4)}` : '';
  return `${number.replace(/\D/g, '')} ${national}`;
}

function cleanText(value, field, label, { required = false, max = 100, pattern, patternMessage } = {}, errors) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') {
    errors[field] = `${label}: невалидна стойност.`;
    return undefined;
  }
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text) {
    if (required) errors[field] = `Въведете ${label.toLowerCase()}.`;
    return '';
  }
  if (text.length > max) errors[field] = `${label}: най-много ${max} знака.`;
  else if (pattern && !pattern.test(text)) errors[field] = patternMessage;
  return text;
}

function cleanPhone(raw, errors, key) {
  if (!raw || typeof raw !== 'object') {
    errors[key] = 'Невалиден телефон.';
    return null;
  }
  const number = normalizePhone(raw.number ?? raw.phone ?? '');
  if (!number) {
    errors[key] = 'Невалиден телефонен номер. Пример: 0888 123 456 или +359 888 123 456.';
    return null;
  }
  let type = typeof raw.type === 'string' ? raw.type.trim().toLowerCase() : '';
  if (!type) type = 'мобилен';
  if (type.length > 20) {
    errors[key] = 'Видът на телефона е твърде дълъг.';
    return null;
  }
  return { type, number };
}

/**
 * Checks a whole contact (partial = only the fields that are sent, for edits).
 * Returns the cleaned data or throws ValidationError with a message per field.
 */
function validateContact(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError({ body: 'Липсват данни за контакта.' });
  }
  const errors = {};
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || has('firstName')) {
    out.firstName = cleanText(body.firstName, 'firstName', 'Име', {
      required: true,
      max: 50,
      pattern: NAME_RE,
      patternMessage: 'Името може да съдържа само букви (и кирилица), интервал, тире и апостроф.',
    }, errors);
  }
  if (!partial || has('lastName')) {
    out.lastName = cleanText(body.lastName, 'lastName', 'Фамилия', {
      max: 50,
      pattern: NAME_RE,
      patternMessage: 'Фамилията може да съдържа само букви, интервал, тире и апостроф.',
    }, errors);
  }
  if (!partial || has('email')) {
    out.email = cleanText(body.email, 'email', 'Имейл', {
      max: 254,
      pattern: EMAIL_RE,
      patternMessage: 'Невалиден имейл адрес.',
    }, errors);
    if (out.email) out.email = out.email.toLowerCase();
  }
  if (!partial || has('address')) {
    out.address = cleanText(body.address, 'address', 'Адрес', { max: 200 }, errors);
  }
  if (!partial || has('phones')) {
    if (!Array.isArray(body.phones) || body.phones.length === 0) {
      errors.phones = 'Добавете поне един телефонен номер.';
    } else if (body.phones.length > 10) {
      errors.phones = 'Най-много 10 телефона на контакт.';
    } else {
      const seen = new Set();
      out.phones = [];
      body.phones.forEach((p, i) => {
        const phone = cleanPhone(p, errors, `phones.${i}`);
        if (!phone) return;
        if (seen.has(phone.number)) {
          errors[`phones.${i}`] = 'Този номер вече е въведен.';
          return;
        }
        seen.add(phone.number);
        out.phones.push(phone);
      });
    }
  }
  if (has('favorite')) {
    if (typeof body.favorite !== 'boolean') errors.favorite = 'favorite трябва да е true или false.';
    else out.favorite = body.favorite;
  }

  if (Object.keys(errors).length) throw new ValidationError(errors);
  return out;
}

function validatePhone(body) {
  const errors = {};
  const phone = cleanPhone(body, errors, 'number');
  if (!phone) throw new ValidationError(errors);
  return phone;
}

// ------------------------------------------------------------------ avatars

const MAX_AVATAR_BYTES = 300 * 1024;
const IMAGE_SIGNATURES = [
  { type: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: 'image/webp', test: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
];

/**
 * Profile picture sent as a data URL ("data:image/jpeg;base64,...").
 * The real file type is checked from its bytes, not trusted from the text,
 * so nothing but JPEG/PNG/WebP images can be stored.
 */
function parseAvatar(dataUrl) {
  if (typeof dataUrl !== 'string') throw new ValidationError({ avatar: 'Невалидна снимка.' });
  const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new ValidationError({ avatar: 'Снимката трябва да е JPEG, PNG или WebP.' });
  const data = Buffer.from(m[1], 'base64');
  if (data.length > MAX_AVATAR_BYTES) {
    throw new ValidationError({ avatar: `Снимката е твърде голяма (максимум ${MAX_AVATAR_BYTES / 1024} KB).` });
  }
  const kind = IMAGE_SIGNATURES.find((s) => data.length > 12 && s.test(data));
  if (!kind) throw new ValidationError({ avatar: 'Файлът не е изображение.' });
  return { data, type: kind.type };
}

module.exports = {
  PHONE_TYPES,
  MAX_AVATAR_BYTES,
  ValidationError,
  normalizePhone,
  formatPhone,
  phoneSearchText,
  validateContact,
  validatePhone,
  parseAvatar,
};
