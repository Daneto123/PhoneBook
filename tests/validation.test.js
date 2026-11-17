'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ValidationError,
  formatPhone,
  normalizePhone,
  parseAvatar,
  validateContact,
} = require('../server/validation');

test('phone numbers in every common form become the same number', () => {
  for (const input of ['0888 123 456', '0888123456', '+359 888 123 456', '00359888123456', '+359 (888) 12-34-56']) {
    assert.equal(normalizePhone(input), '+359888123456', input);
  }
  assert.equal(normalizePhone('02 987 6543'), '+35929876543'); // Sofia landline
  assert.equal(normalizePhone('+44 20 7946 0958'), '+442079460958');
  assert.equal(normalizePhone('112'), '112');
  for (const bad of ['', 'abc', '08a8', '12', '+123', '0888 123 456 789 012 345', null, {}]) {
    assert.equal(normalizePhone(bad), null, String(bad));
  }
});

test('phones are shown the Bulgarian way', () => {
  assert.equal(formatPhone('+359888123456'), '0888 123 456');
  assert.equal(formatPhone('+35929876543'), '02 987 6543');
  assert.equal(formatPhone('+35932123456'), '032 123 456');
  assert.equal(formatPhone('+442079460958'), '+442079460958');
});

test('Cyrillic and Latin names are accepted, other text is not', () => {
  const ok = validateContact({
    firstName: '  Йордан ',
    lastName: "O'Brien-Павлов",
    email: 'Yordan@Example.COM',
    phones: [{ number: '0888 123 456' }],
  });
  assert.equal(ok.firstName, 'Йордан');
  assert.equal(ok.lastName, "O'Brien-Павлов");
  assert.equal(ok.email, 'yordan@example.com');
  assert.deepEqual(ok.phones, [{ type: 'мобилен', number: '+359888123456' }]);
  assert.equal(ok.address, '');

  assert.throws(() => validateContact({ firstName: 'R2D2', phones: [{ number: '112' }] }), (e) => 'firstName' in e.fields);
  assert.throws(() => validateContact({ firstName: '<script>', phones: [{ number: '112' }] }), ValidationError);
});

test('every problem is reported per field', () => {
  try {
    validateContact({ firstName: '', email: 'not-an-email', phones: [{ number: 'x' }, { number: '0888123456' }, { number: '+359888123456' }] });
    assert.fail('should throw');
  } catch (e) {
    assert.ok(e instanceof ValidationError);
    assert.deepEqual(Object.keys(e.fields).sort(), ['email', 'firstName', 'phones.0', 'phones.2']);
    assert.match(e.fields['phones.2'], /вече е въведен/); // same number written differently
  }
  assert.throws(() => validateContact({ firstName: 'Ана', phones: [] }), (e) => 'phones' in e.fields);
  assert.throws(() => validateContact(null), ValidationError);
});

test('partial validation only looks at the fields that are sent', () => {
  assert.deepEqual(validateContact({ favorite: true }, { partial: true }), { favorite: true });
  assert.throws(() => validateContact({ favorite: 'yes' }, { partial: true }), ValidationError);
  assert.throws(() => validateContact({ firstName: '' }, { partial: true }), ValidationError);
});

test('avatars must really be images and small', () => {
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex');
  const ok = parseAvatar(`data:image/png;base64,${png.toString('base64')}`);
  assert.equal(ok.type, 'image/png');
  assert.equal(ok.data.length, png.length);

  // Says "jpeg" but is a PNG: the bytes win.
  assert.equal(parseAvatar(`data:image/jpeg;base64,${png.toString('base64')}`).type, 'image/png');

  const html = Buffer.from('<html><script>alert(1)</script></html>').toString('base64');
  assert.throws(() => parseAvatar(`data:image/png;base64,${html}`), /не е изображение/);
  assert.throws(() => parseAvatar(`data:text/html;base64,${html}`), /JPEG, PNG или WebP/);
  const huge = Buffer.concat([png, Buffer.alloc(400 * 1024)]).toString('base64');
  assert.throws(() => parseAvatar(`data:image/png;base64,${huge}`), /твърде голяма/);
});
