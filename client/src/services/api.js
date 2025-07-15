const API_URL = import.meta.env.VITE_API_URL;

export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function getStoves() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch stoves');
  return res.json();
}

export async function addStove(data) {
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
  return res.json();
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
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to delete stove');
  return res.json();
}

export async function getLogsByStoveId(stove_id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/stoves/by-stoveid/${stove_id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch logs');
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