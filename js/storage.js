/**
 * storage.js — SkillSwap LocalStorage Utility
 * Centralized data layer simulating a backend database.
 */

const Storage = (() => {

  /* ─── Keys ─── */
  const KEYS = {
    USERS:    'ss_users',
    SESSION:  'ss_session',
    REQUESTS: 'ss_requests',
  };

  /* ─── Helpers ─── */
  const read  = key => JSON.parse(localStorage.getItem(key) || 'null');
  const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  /* ══════════════════════════════
       USERS
  ══════════════════════════════ */

  function getUsers() {
    return read(KEYS.USERS) || [];
  }

  function saveUsers(users) {
    write(KEYS.USERS, users);
  }

  function getUserById(id) {
    return getUsers().find(u => u.id === id) || null;
  }

  function getUserByEmail(email) {
    return getUsers().find(u => u.email === email.toLowerCase()) || null;
  }

  function createUser({ name, email, password, location = '', bio = '' }) {
    const users = getUsers();
    if (getUserByEmail(email)) return { error: 'Email already registered.' };

    const user = {
      id:         crypto.randomUUID(),
      name,
      email:      email.toLowerCase(),
      password,               // plain-text — simulation only
      location,
      bio,
      avatar:     `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(email)}`,
      skillsOffer: [],
      skillsWant:  [],
      createdAt:  Date.now(),
    };

    users.push(user);
    saveUsers(users);
    return { user };
  }

  function updateUser(id, patch) {
    const users = getUsers();
    const idx   = users.findIndex(u => u.id === id);
    if (idx === -1) return { error: 'User not found.' };
    users[idx] = { ...users[idx], ...patch };
    saveUsers(users);
    return { user: users[idx] };
  }

  /* ══════════════════════════════
       SESSION
  ══════════════════════════════ */

  function getSession() {
    return read(KEYS.SESSION);
  }

  function setSession(userId) {
    write(KEYS.SESSION, { userId, loggedAt: Date.now() });
  }

  function clearSession() {
    localStorage.removeItem(KEYS.SESSION);
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    return getUserById(session.userId);
  }

  /* ══════════════════════════════
       REQUESTS
  ══════════════════════════════ */

  function getRequests() {
    return read(KEYS.REQUESTS) || [];
  }

  function saveRequests(reqs) {
    write(KEYS.REQUESTS, reqs);
  }

  function createRequest({ fromId, toId, offeredSkill, wantedSkill, message = '' }) {
    const reqs = getRequests();

    // Prevent duplicate pending requests between same pair
    const dupe = reqs.find(
      r => r.fromId === fromId && r.toId === toId && r.status === 'pending'
    );
    if (dupe) return { error: 'You already have a pending request with this user.' };

    const req = {
      id:           crypto.randomUUID(),
      fromId,
      toId,
      offeredSkill,
      wantedSkill,
      message,
      status:       'pending',   // pending | accepted | rejected
      createdAt:    Date.now(),
    };

    reqs.push(req);
    saveRequests(reqs);
    return { request: req };
  }

  function updateRequest(id, patch) {
    const reqs = getRequests();
    const idx  = reqs.findIndex(r => r.id === id);
    if (idx === -1) return { error: 'Request not found.' };
    reqs[idx] = { ...reqs[idx], ...patch };
    saveRequests(reqs);
    return { request: reqs[idx] };
  }

  function getRequestsForUser(userId) {
    const reqs = getRequests();
    return {
      sent:     reqs.filter(r => r.fromId === userId),
      received: reqs.filter(r => r.toId   === userId),
    };
  }

  /* ══════════════════════════════
       SEED DATA (first load)
  ══════════════════════════════ */

  function seedIfEmpty() {
    if (getUsers().length > 0) return;

    const seeds = [
      { name: 'Aisha Rahman',   email: 'aisha@demo.com',   password: 'demo123', location: 'Dhaka, BD',    bio: 'Full-stack dev & yoga teacher.', skillsOffer: ['Python','React','Yoga'], skillsWant: ['Guitar','Cooking'] },
      { name: 'Carlos Ruiz',    email: 'carlos@demo.com',  password: 'demo123', location: 'Madrid, ES',   bio: 'Guitarist and cooking enthusiast.', skillsOffer: ['Guitar','Spanish','Cooking'], skillsWant: ['Python','Photography'] },
      { name: 'Priya Sharma',   email: 'priya@demo.com',   password: 'demo123', location: 'Mumbai, IN',   bio: 'UX designer & Kathak dancer.', skillsOffer: ['UI/UX','Kathak','Figma'], skillsWant: ['React','Hindi tutoring'] },
      { name: 'James Okafor',   email: 'james@demo.com',   password: 'demo123', location: 'Lagos, NG',    bio: 'Entrepreneur & chess coach.', skillsOffer: ['Chess','Business','Public Speaking'], skillsWant: ['Video Editing','Excel'] },
      { name: 'Mei Lin',        email: 'mei@demo.com',     password: 'demo123', location: 'Shanghai, CN', bio: 'Illustrator and calligraphy artist.', skillsOffer: ['Illustration','Calligraphy','Mandarin'], skillsWant: ['Music Production','Photography'] },
      { name: 'Lena Müller',    email: 'lena@demo.com',    password: 'demo123', location: 'Berlin, DE',   bio: 'Photographer & cycling coach.', skillsOffer: ['Photography','Cycling','German'], skillsWant: ['Illustration','Yoga'] },
    ];

    seeds.forEach(s => {
      const { user } = createUser(s);
      if (user) updateUser(user.id, { skillsOffer: s.skillsOffer, skillsWant: s.skillsWant });
    });
  }

  /* ─── Public API ─── */
  return {
    getUsers, getUserById, getUserByEmail, createUser, updateUser,
    getSession, setSession, clearSession, getCurrentUser,
    createRequest, updateRequest, getRequestsForUser,
    seedIfEmpty,
  };

})();
