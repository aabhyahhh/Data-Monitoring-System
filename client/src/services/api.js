export async function login(username, password) {
  const res = await fetch('http://localhost:5000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function getStoves() {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:5000/api/stoves', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch stoves');
  return res.json();
}

export async function addStove(data) {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:5000/api/stoves', {
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
  const res = await fetch(`http://localhost:5000/api/stoves/${id}`, {
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

export async function getLogsByStoveId(stove_id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`http://localhost:5000/api/stoves/by-stoveid/${stove_id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
} 