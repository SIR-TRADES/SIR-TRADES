import { getStore } from '@netlify/blobs';

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

export default async (request) => {
  if (request.method.toUpperCase() === 'OPTIONS') return new Response(null, { status: 204, headers });

  try {
    const store = getStore('kiu-registration-requests');
    const method = request.method.toUpperCase();
    const requests = (await store.get('all', { type: 'json' })) || [];

    if (method === 'GET') return json({ ok: true, registrations: requests });

    if (method === 'POST') {
      const registration = await request.json();
      if (!registration.id || !registration.name || !registration.email) return json({ error: 'Registration is missing required details.' }, 400);
      const nextRequests = [registration, ...requests];
      await store.setJSON('all', nextRequests);
      return json(registration, 201);
    }

    if (method === 'PATCH') {
      const update = await request.json();
      const nextRequests = requests.map((item) => item.id === update.id ? { ...item, status: update.status } : item);
      await store.setJSON('all', nextRequests);
      return json(nextRequests.find((item) => item.id === update.id) || null);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return json({ error: 'Registration service is not configured on this Netlify site.', detail: error.message }, 500);
  }
};
