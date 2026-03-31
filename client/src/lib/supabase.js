const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://awrcddifemfclgezrszn.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  'sb_publishable_k1cxhlJV8nmwpczDmnUALQ_vU5L8lwi';

const STORAGE_KEY = 'applyiq_supabase_session';

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

function buildHeaders(accessToken, extra = {}) {
  const headers = {
    apikey: supabaseAnonKey,
    'Content-Type': 'application/json',
    ...extra
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.msg || data?.message || data?.error_description || data?.error || 'Request failed');
  }

  return data;
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function signInWithPassword({ email, password }) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, password })
  });

  const data = await parseResponse(response);
  saveSession(data);
  return data;
}

export async function signUp({ email, password, fullName }) {
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      email,
      password,
      data: { full_name: fullName }
    })
  });

  const data = await parseResponse(response);
  if (data?.access_token) {
    saveSession(data);
  }
  return data;
}

export async function signOut() {
  const session = getStoredSession();
  if (session?.access_token) {
    try {
      await fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: buildHeaders(session.access_token)
      });
    } catch {
      // ignore logout request failures
    }
  }
  clearSession();
}

export async function getUser(accessToken) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: buildHeaders(accessToken)
  });
  return parseResponse(response);
}

export async function getProfile(userId, accessToken) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=full_name,email&id=eq.${encodeURIComponent(userId)}&limit=1`,
    { headers: buildHeaders(accessToken) }
  );
  const data = await parseResponse(response);
  return data?.[0] ?? null;
}

export async function listApplications(userId, accessToken) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/applications?select=id,company,role,status,applied_date,job_link,notes,location,salary_range,created_at&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`,
    { headers: buildHeaders(accessToken) }
  );
  return parseResponse(response);
}

export async function listJobDescriptions(userId, applicationIds, accessToken) {
  if (!applicationIds.length) return [];
  const inClause = applicationIds.map((id) => `"${id}"`).join(',');
  const response = await fetch(
    `${supabaseUrl}/rest/v1/job_descriptions?select=id,application_id,content,created_at&user_id=eq.${encodeURIComponent(userId)}&application_id=in.(${encodeURIComponent(inClause)})&order=created_at.desc`,
    { headers: buildHeaders(accessToken) }
  );
  return parseResponse(response);
}

export async function createApplication(payload, accessToken) {
  const response = await fetch(`${supabaseUrl}/rest/v1/applications`, {
    method: 'POST',
    headers: buildHeaders(accessToken, { Prefer: 'return=representation' }),
    body: JSON.stringify(payload)
  });
  const data = await parseResponse(response);
  return data?.[0] ?? null;
}

export async function updateApplication(id, userId, payload, accessToken) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/applications?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: buildHeaders(accessToken, { Prefer: 'return=representation' }),
      body: JSON.stringify(payload)
    }
  );
  const data = await parseResponse(response);
  return data?.[0] ?? null;
}

export async function deleteApplication(id, userId, accessToken) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/applications?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
      headers: buildHeaders(accessToken)
    }
  );
  return parseResponse(response);
}

export async function upsertJobDescription({ applicationId, userId, content }, accessToken) {
  const existing = await listJobDescriptions(userId, [applicationId], accessToken);

  if (!content?.trim()) {
    if (existing[0]?.id) {
      await fetch(
        `${supabaseUrl}/rest/v1/job_descriptions?id=eq.${encodeURIComponent(existing[0].id)}&user_id=eq.${encodeURIComponent(userId)}`,
        { method: 'DELETE', headers: buildHeaders(accessToken) }
      );
    }
    return null;
  }

  if (existing[0]?.id) {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/job_descriptions?id=eq.${encodeURIComponent(existing[0].id)}&user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: buildHeaders(accessToken, { Prefer: 'return=representation' }),
        body: JSON.stringify({ content })
      }
    );
    const data = await parseResponse(response);
    return data?.[0] ?? null;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/job_descriptions`, {
    method: 'POST',
    headers: buildHeaders(accessToken, { Prefer: 'return=representation' }),
    body: JSON.stringify({ application_id: applicationId, user_id: userId, content })
  });
  const data = await parseResponse(response);
  return data?.[0] ?? null;
}
