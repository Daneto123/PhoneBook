import { api, ApiError } from './api.js';
import { renderAvatar, resizeImage } from './avatar.js';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter((c) => c !== null && c !== undefined && c !== false));
  return node;
};

const state = {
  contacts: [],
  filter: 'all', // or 'fav'
  search: '',
  selectedId: null,
};

// ------------------------------------------------------------------ toast

let toastTimer;
function toast(message, kind = 'ok') {
  const t = $('#toast');
  t.textContent = message;
  t.className = `toast ${kind}`;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 3200);
}

function showError(err) {
  toast(err instanceof ApiError ? err.message : 'Нещо се обърка. Опитайте пак.', 'error');
}

// ------------------------------------------------------------------ list

async function load() {
  try {
    state.contacts = await api.list(state.search);
  } catch (err) {
    showError(err);
    state.contacts = [];
  }
  renderList();
  if (state.selectedId) {
    const contact = state.contacts.find((c) => c.id === state.selectedId);
    if (contact) renderDetail(contact);
    else if (!state.search) closeDetail();
  }
}

function visibleContacts() {
  return state.filter === 'fav' ? state.contacts.filter((c) => c.favorite) : state.contacts;
}

function renderList() {
  const list = $('#list');
  const shown = visibleContacts();
  $('#countAll').textContent = state.contacts.length;
  $('#countFav').textContent = state.contacts.filter((c) => c.favorite).length;

  list.replaceChildren(
    ...shown.map((c) => {
      const avatar = el('span');
      renderAvatar(avatar, c);
      const star = el('button', {
        type: 'button',
        className: `star ${c.favorite ? 'on' : ''}`,
        title: c.favorite ? 'Махни от любими' : 'Добави в любими',
        textContent: c.favorite ? '★' : '☆',
      });
      star.setAttribute('aria-label', star.title);
      star.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(c);
      });

      const item = el(
        'li',
        { className: `contact ${c.id === state.selectedId ? 'selected' : ''}`, tabIndex: 0 },
        avatar,
        el('span', { className: 'contact-text' },
          el('span', { className: 'name', textContent: c.fullName }),
          el('span', { className: 'sub', textContent: c.phones[0]?.display ?? '' })),
        star,
      );
      item.addEventListener('click', () => selectContact(c.id));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') selectContact(c.id);
      });
      return item;
    }),
  );

  const empty = $('#empty');
  empty.hidden = shown.length > 0;
  if (state.search) empty.textContent = `Няма резултати за „${state.search}“.`;
  else if (state.filter === 'fav') empty.textContent = 'Още нямате любими. Натиснете ☆ до контакт.';
  else empty.textContent = 'Указателят е празен. Добавете първия контакт с „Нов контакт“.';
}

// ------------------------------------------------------------------ details

function selectContact(id) {
  state.selectedId = id;
  const contact = state.contacts.find((c) => c.id === id);
  if (contact) renderDetail(contact);
  renderList();
}

function closeDetail() {
  state.selectedId = null;
  document.body.classList.remove('show-detail');
  $('#detail').replaceChildren(
    el('div', { className: 'placeholder' },
      el('div', { className: 'placeholder-icon', textContent: '👤' }),
      el('p', { textContent: 'Изберете контакт от списъка' })),
  );
  renderList();
}

function infoRow(icon, label, content) {
  return el('div', { className: 'info-row' },
    el('span', { className: 'info-icon', textContent: icon }),
    el('div', {}, el('div', { className: 'info-label', textContent: label }), content));
}

function renderDetail(c) {
  document.body.classList.add('show-detail');
  const avatar = el('div', { className: 'avatar xl' });
  renderAvatar(avatar, c);

  const back = el('button', { type: 'button', className: 'icon-btn back', textContent: '←', title: 'Назад' });
  back.addEventListener('click', closeDetail);

  const fav = el('button', { type: 'button', className: `btn ${c.favorite ? 'fav-on' : ''}`, textContent: c.favorite ? '★ В любими' : '☆ Добави в любими' });
  fav.addEventListener('click', () => toggleFavorite(c));
  const edit = el('button', { type: 'button', className: 'btn', textContent: '✎ Редактирай' });
  edit.addEventListener('click', () => openForm(c));
  const del = el('button', { type: 'button', className: 'btn danger', textContent: '🗑 Изтрий' });
  del.addEventListener('click', () => deleteContact(c));

  // Phones: call, copy, remove; plus a small form to add one.
  const phones = el('ul', { className: 'phones' },
    ...c.phones.map((p) => {
      const copy = el('button', { type: 'button', className: 'icon-btn', textContent: '⧉', title: 'Копирай' });
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(p.display);
          toast('Номерът е копиран.');
        } catch {
          toast(p.display);
        }
      });
      const remove = el('button', { type: 'button', className: 'icon-btn', textContent: '✕', title: 'Премахни номера' });
      remove.disabled = c.phones.length === 1;
      if (remove.disabled) remove.title = 'Контактът трябва да има поне един номер';
      remove.addEventListener('click', () => removePhone(c, p));
      return el('li', {},
        el('span', { className: 'phone-type', textContent: p.type }),
        el('a', { href: `tel:${p.number}`, className: 'phone-number', textContent: p.display }),
        copy, remove);
    }));

  const typeSelect = el('select', { name: 'type' }, ...['мобилен', 'домашен', 'служебен', 'друг'].map((t) => el('option', { textContent: t })));
  const numberInput = el('input', { name: 'number', type: 'tel', placeholder: 'Нов номер', required: true });
  const phoneError = el('small', { className: 'error' });
  const addForm = el('form', { className: 'add-phone' },
    typeSelect, numberInput, el('button', { type: 'submit', className: 'btn small', textContent: '＋ Добави' }), phoneError);
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    phoneError.textContent = '';
    try {
      const updated = await api.addPhone(c.id, { type: typeSelect.value, number: numberInput.value });
      toast('Номерът е добавен.');
      replaceContact(updated);
    } catch (err) {
      if (err.fields?.number) phoneError.textContent = err.fields.number;
      else showError(err);
    }
  });

  const rows = [
    c.email && infoRow('✉', 'Имейл', el('a', { href: `mailto:${c.email}`, textContent: c.email })),
    c.address && infoRow('⌂', 'Адрес', el('span', { textContent: c.address })),
  ];

  $('#detail').replaceChildren(
    el('article', { className: 'card' },
      el('header', { className: 'card-head' }, back, avatar,
        el('h2', { textContent: c.fullName }),
        el('div', { className: 'actions' }, fav, edit, del)),
      el('section', {}, el('h3', { textContent: 'Телефони' }), phones, addForm),
      ...rows),
  );
}

function replaceContact(updated) {
  const i = state.contacts.findIndex((c) => c.id === updated.id);
  if (i >= 0) state.contacts[i] = updated;
  else state.contacts.push(updated);
  renderList();
  if (state.selectedId === updated.id) renderDetail(updated);
}

async function toggleFavorite(c) {
  try {
    const updated = await api.update(c.id, { favorite: !c.favorite });
    replaceContact(updated);
    toast(updated.favorite ? `${updated.fullName} е в любими.` : `${updated.fullName} не е в любими.`);
  } catch (err) {
    showError(err);
  }
}

async function removePhone(c, phone) {
  if (!confirm(`Да се премахне ли ${phone.display} от ${c.fullName}?`)) return;
  try {
    replaceContact(await api.removePhone(c.id, phone.number));
    toast('Номерът е премахнат.');
  } catch (err) {
    showError(err);
  }
}

async function deleteContact(c) {
  if (!confirm(`Да се изтрие ли ${c.fullName}? Това не може да се върне.`)) return;
  try {
    await api.remove(c.id);
    state.contacts = state.contacts.filter((x) => x.id !== c.id);
    closeDetail();
    toast(`${c.fullName} е изтрит.`);
  } catch (err) {
    showError(err);
  }
}

// ------------------------------------------------------------------ form

const form = $('#contactForm');
const dialog = $('#formDialog');
let editing = null; // contact being edited, or null for a new one
let avatarChange; // undefined = unchanged, null = remove, string = new data URL

function addPhoneRow(phone = { type: 'мобилен', display: '' }) {
  const row = $('#phoneRowTemplate').content.firstElementChild.cloneNode(true);
  row.querySelector('select').value = phone.type;
  if (!row.querySelector('select').value) {
    row.querySelector('select').append(el('option', { textContent: phone.type }));
    row.querySelector('select').value = phone.type;
  }
  row.querySelector('input').value = phone.display ?? '';
  row.querySelector('[data-remove-row]').addEventListener('click', () => {
    if ($('#phoneRows').children.length > 1) row.remove();
    else row.querySelector('input').value = '';
  });
  $('#phoneRows').append(row);
  return row;
}

function showAvatarPreview() {
  const contact = {
    id: editing?.id,
    firstName: form.firstName.value || editing?.firstName || '',
    lastName: form.lastName.value || editing?.lastName || '',
  };
  const src = avatarChange === undefined ? editing?.avatarUrl : avatarChange;
  renderAvatar($('#avatarPreview'), contact, src);
  $('#avatarRemove').hidden = !src;
}

function clearErrors() {
  form.querySelectorAll('.error').forEach((e) => (e.textContent = ''));
  form.querySelectorAll('.invalid').forEach((e) => e.classList.remove('invalid'));
}

function showFieldErrors(fields = {}, message) {
  let first = null;
  for (const [key, text] of Object.entries(fields)) {
    const m = /^phones\.(\d+)$/.exec(key);
    let target;
    let input;
    if (m) {
      const row = $('#phoneRows').children[Number(m[1])];
      target = row?.querySelector('.error');
      input = row?.querySelector('input');
    } else {
      target = form.querySelector(`[data-error="${key}"]`);
      input = form.elements[key];
    }
    if (target) target.textContent = text;
    if (input) {
      input.classList.add('invalid');
      first ??= input;
    }
  }
  if (!Object.keys(fields).length && message) form.querySelector('[data-error="_form"]').textContent = message;
  first?.focus();
}

function openForm(contact = null) {
  editing = contact;
  avatarChange = undefined;
  form.reset();
  clearErrors();
  $('#formTitle').textContent = contact ? `Редакция: ${contact.fullName}` : 'Нов контакт';
  $('#phoneRows').replaceChildren();
  if (contact) {
    for (const key of ['firstName', 'lastName', 'email', 'address']) form.elements[key].value = contact[key] ?? '';
    contact.phones.forEach((p) => addPhoneRow(p));
  } else {
    addPhoneRow();
  }
  showAvatarPreview();
  dialog.showModal();
  form.firstName.focus();
}

function readForm() {
  const data = {
    firstName: form.firstName.value,
    lastName: form.lastName.value,
    email: form.email.value,
    address: form.address.value,
    phones: [...$('#phoneRows').children]
      .map((row) => ({ type: row.querySelector('select').value, number: row.querySelector('input').value.trim() }))
      .filter((p) => p.number),
  };
  if (avatarChange !== undefined) data.avatar = avatarChange;
  return data;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  const save = $('#saveBtn');
  save.disabled = true;
  try {
    const data = readForm();
    const saved = editing ? await api.update(editing.id, data) : await api.create(data);
    dialog.close();
    toast(editing ? 'Промените са запазени.' : `${saved.fullName} е добавен.`);
    state.search = '';
    $('#search').value = '';
    await load();
    selectContact(saved.id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) showFieldErrors(err.fields, err.message);
    else showFieldErrors({}, err.message || 'Грешка при запис.');
  } finally {
    save.disabled = false;
  }
});

$('#avatarInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    avatarChange = await resizeImage(file);
    form.querySelector('[data-error="avatar"]').textContent = '';
    showAvatarPreview();
  } catch (err) {
    form.querySelector('[data-error="avatar"]').textContent = err.message;
  }
});
$('#avatarRemove').addEventListener('click', () => {
  avatarChange = null;
  showAvatarPreview();
});
form.firstName.addEventListener('input', showAvatarPreview);
form.lastName.addEventListener('input', showAvatarPreview);
$('#addPhoneRow').addEventListener('click', () => addPhoneRow().querySelector('input').focus());
dialog.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dialog.close()));

// ------------------------------------------------------------------ top bar

$('#newBtn').addEventListener('click', () => openForm());

let searchTimer;
$('#search').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = e.target.value.trim();
    load();
  }, 200);
});

document.querySelectorAll('.tabs [data-filter]').forEach((tab) =>
  tab.addEventListener('click', () => {
    state.filter = tab.dataset.filter;
    document.querySelectorAll('.tabs [data-filter]').forEach((t) => t.classList.toggle('active', t === tab));
    renderList();
  }),
);

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && !dialog.open) {
    e.preventDefault();
    $('#search').focus();
  }
});

load();
