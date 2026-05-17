function authHeaders(session) {
  const token = session?.access_token ?? '';
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function callGenerate(session, body) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: authHeaders(session),
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function callImage(session, body) {
  const res = await fetch('/api/image', {
    method: 'POST',
    headers: authHeaders(session),
    body: JSON.stringify(body),
  });
  return res.json();
}
