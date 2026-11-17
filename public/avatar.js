// Profile pictures: resized in the browser to a small square JPEG, so even a
// 10 MB photo from a phone becomes ~30 KB before it is sent.

const SIZE = 256;

export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Изберете изображение (JPEG, PNG, WebP…).'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Crop the middle square, like a profile picture.
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; // transparent PNGs get a white background
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Снимката не може да се отвори.'));
    };
    img.src = url;
  });
}

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#4f46e5', '#b45309'];

/** Fills `el` with the picture, or with coloured initials when there is none. */
export function renderAvatar(el, contact, src = contact.avatarUrl) {
  el.replaceChildren();
  el.classList.add('avatar');
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    el.append(img);
    el.style.background = '';
    return;
  }
  const initials = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .map((n) => n[0].toLocaleUpperCase('bg'))
    .join('')
    .slice(0, 2);
  el.textContent = initials || '?';
  let hash = 0;
  for (const ch of contact.id || contact.firstName || '') hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  el.style.background = COLORS[hash % COLORS.length];
}
