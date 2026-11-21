let inMemoryToken: string | null = null;

export function setInMemorySessionToken(token: string | null) {
  inMemoryToken = token;
}

export function getInMemorySessionToken(): string | null {
  return inMemoryToken;
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'X-Requested-With': 'AppleCardApp',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (inMemoryToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${inMemoryToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { success: false, error: 'Unexpected server response.' };
  }

  if (!res.ok && data.success === undefined) {
    data.success = false;
  }
  return data as T;
}
