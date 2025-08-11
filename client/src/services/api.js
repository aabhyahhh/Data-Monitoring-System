const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Login failed:', res.status, errorText);
    throw new Error(`Login failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getStoves() {
  console.log('getStoves API call');
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    if (res.status === 401) {
      // Token is invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
      return;
    }
    throw new Error('Failed to fetch stoves');
  }
  const result = await res.json();
  console.log('getStoves API response count:', result.length);
  return result;
}

export async function addStove(data) {
  console.log('addStove API call with data:', data);
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add stove');
  const result = await res.json();
  console.log('addStove API response:', result);
  return result;
}

export async function updateStove(id, data) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update stove');
  return res.json();
}

export async function deleteStove(id) {
  console.log('deleteStove API call with id:', id);
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    console.error('Delete stove failed:', res.status, res.statusText);
    throw new Error('Failed to delete stove');
  }
  const result = await res.json();
  console.log('deleteStove API response:', result);
  return result;
}

export async function getLogsByStoveId(stove_id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves/by-stoveid/${stove_id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    if (res.status === 401) {
      // Token is invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
      return;
    }
    throw new Error('Failed to fetch logs');
  }
  return res.json();
}

export async function getCookingSessionsLast24h() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves/logs/last24h/count`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch cooking sessions count');
  return res.json();
}

export async function getTotalCookingMinutes() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves/logs/total-cooking-minutes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch total cooking minutes');
  return res.json();
}

export async function getTotalLogsCount() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves/logs/total-count`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch total logs count');
  return res.json();
} 