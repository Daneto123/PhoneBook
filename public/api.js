// Talks to the server. Relative URLs, so it works on any host and port.

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function call(method, url, body) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Няма връзка със сървъра.', 0);
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || `Грешка ${response.status}`, response.status, data.fields);
  return data;
}

const contactUrl = (id) => `/api/contacts/${encodeURIComponent(id)}`;

export const api = {
  list: (search = '') => call('GET', `/api/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  get: (id) => call('GET', contactUrl(id)),
  create: (contact) => call('POST', '/api/contacts', contact),
  update: (id, changes) => call('PATCH', contactUrl(id), changes),
  remove: (id) => call('DELETE', contactUrl(id)),
  addPhone: (id, phone) => call('POST', `${contactUrl(id)}/phones`, phone),
  removePhone: (id, number) => call('DELETE', `${contactUrl(id)}/phones/${encodeURIComponent(number)}`),
};
