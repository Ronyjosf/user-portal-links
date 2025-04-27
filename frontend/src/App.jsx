import React, { useEffect, useState } from 'react';

const api = async (path, opts = {}) => {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return res.json();
};

function App() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState({ username: '', password: '' });
  const [linkForm, setLinkForm] = useState({ url: '', title: '' });
  const [editingLink, setEditingLink] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/user').then(u => { if (u.id) setUser(u); });
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setError('');
    const res = await api('/login', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (res.id) setUser(res);
    else setError(res.error || 'Login failed');
  };

  const register = async (e) => {
    e.preventDefault();
    setError('');
    const res = await api('/register', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (res.id) setUser(res);
    else setError(res.error || 'Registration failed');
  };

  const logout = async () => {
    await api('/logout', { method: 'POST' });
    setUser(null);
    setLinks([]);
  };

  const fetchLinks = async () => {
    const res = await api('/links');
    setLinks(res);
  };

  useEffect(() => {
    if (user) fetchLinks();
  }, [user]);

  const formatUrl = (url) => {
    if (!url) return '';
    // If URL doesn't start with a protocol, add https://
    if (!url.match(/^https?:\/\//)) {
      return `https://${url}`;
    }
    return url;
  };

  const addLink = async (e) => {
    e.preventDefault();
    const formattedUrl = formatUrl(linkForm.url);
    const res = await api('/links', {
      method: 'POST',
      body: JSON.stringify({ ...linkForm, url: formattedUrl }),
    });
    setLinkForm({ url: '', title: '' });
    fetchLinks();
  };

  const deleteLink = async (id) => {
    await api(`/links/${id}`, { method: 'DELETE' });
    fetchLinks();
  };

  const startEditing = (link) => {
    setEditingLink({ ...link });
  };

  const updateLink = async (e) => {
    e.preventDefault();
    const formattedUrl = formatUrl(editingLink.url);
    await api(`/links/${editingLink.id}`, {
      method: 'PUT',
      body: JSON.stringify({ 
        title: editingLink.title,
        url: formattedUrl
      }),
    });
    setEditingLink(null);
    fetchLinks();
  };

  const cancelEdit = () => {
    setEditingLink(null);
  };

  if (!user) {
    return (
      <div className="auth-container">
        <h2>Login or Register</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={login}>
          <input placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          <button type="submit">Login</button>
        </form>
        <form onSubmit={register}>
          <input placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          <button type="submit">Register</button>
        </form>
      </div>
    );
  }

  return (
    <div className="portal-container">
      <h2>Welcome, {user.username}</h2>
      <button onClick={logout}>Logout</button>
      <h3>Your Links</h3>
      <form onSubmit={addLink} className="add-link-form">
        <input placeholder="Title" value={linkForm.title} onChange={e => setLinkForm(f => ({ ...f, title: e.target.value }))} />
        <input placeholder="URL (e.g., google.com or https://google.com)" value={linkForm.url} onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))} />
        <button type="submit">Add Link</button>
      </form>
      <ul className="links-list">
        {links.map(link => (
          <li key={link.id}>
            {editingLink?.id === link.id ? (
              <form onSubmit={updateLink} className="edit-form">
                <input
                  value={editingLink.title}
                  onChange={e => setEditingLink(l => ({ ...l, title: e.target.value }))}
                  placeholder="Link title"
                />
                <input
                  value={editingLink.url}
                  onChange={e => setEditingLink(l => ({ ...l, url: e.target.value }))}
                  placeholder="URL (e.g., google.com or https://google.com)"
                />
                <button type="submit">Save</button>
                <button type="button" onClick={cancelEdit}>Cancel</button>
              </form>
            ) : (
              <>
                <a href={link.url} target="_blank" rel="noopener noreferrer">{link.title || link.url}</a>
                <div className="link-actions">
                  <button onClick={() => startEditing(link)}>Edit</button>
                  <button onClick={() => deleteLink(link.id)}>Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
