/**
 * dashboard.js — SkillSwap App Pages Logic
 * Handles: Dashboard, Profile, Browse, Request pages.
 */

document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
  const page = location.pathname.split('/').pop() || '';

  if (page === 'dashboard.html') initDashboard();
  if (page === 'profile.html')   initProfile();
  if (page === 'browse.html')    initBrowse();
  if (page === 'request.html')   initRequest();
});


/* ══════════════════════════════
     DASHBOARD PAGE
══════════════════════════════ */

function initDashboard() {
  const user = requireAuth();
  if (!user) return;
  initNav(user);

  /* Profile card */
  document.getElementById('dash-name').textContent     = user.name;
  document.getElementById('dash-email').textContent    = user.email;
  document.getElementById('dash-location').textContent = user.location || 'Location not set';
  document.getElementById('dash-avatar').src           = user.avatar;
  document.getElementById('dash-offer-count').textContent = (user.skillsOffer || []).length;
  document.getElementById('dash-want-count').textContent  = (user.skillsWant  || []).length;

  /* Skill pills */
  renderPills('dash-offer-pills', user.skillsOffer || [], 'offer');
  renderPills('dash-want-pills',  user.skillsWant  || [], 'want');

  /* Requests */
  const { sent, received } = Storage.getRequestsForUser(user.id);

  document.getElementById('dash-sent-count').textContent     = sent.length;
  document.getElementById('dash-received-count').textContent = received.length;
  document.getElementById('dash-pending-count').textContent  = received.filter(r => r.status === 'pending').length;

  renderRequests('dash-received-list', received, 'received', user);
  renderRequests('dash-sent-list',     sent,     'sent',     user);

  /* Tab switching */
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('[data-tab-panel]').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`[data-tab-panel="${tab.dataset.tab}"]`)?.classList.add('active');
    });
  });
}

function renderPills(containerId, skills, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!skills.length) {
    el.innerHTML = `<span class="pill pill--empty">None added yet</span>`;
    return;
  }
  el.innerHTML = skills.map(s =>
    `<span class="pill pill--${type}">${esc(s)}</span>`
  ).join('');
}

function renderRequests(containerId, requests, mode, currentUser) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!requests.length) {
    el.innerHTML = `<div class="empty-state"><p>No requests ${mode === 'sent' ? 'sent' : 'received'} yet.</p></div>`;
    return;
  }

  el.innerHTML = requests.map(req => {
    const otherId = mode === 'sent' ? req.toId : req.fromId;
    const other   = Storage.getUserById(otherId);
    const statusClass = { pending: 'warning', accepted: 'success', rejected: 'danger' }[req.status] || 'info';

    const actions = (mode === 'received' && req.status === 'pending')
      ? `<div class="req-actions">
           <button class="btn btn--sm btn--success" onclick="handleRequest('${req.id}','accepted')">Accept</button>
           <button class="btn btn--sm btn--danger"  onclick="handleRequest('${req.id}','rejected')">Reject</button>
         </div>`
      : '';

    return `
      <div class="req-card" id="req-${req.id}">
        <img class="req-avatar" src="${other?.avatar || ''}" alt="${esc(other?.name || 'User')}">
        <div class="req-body">
          <div class="req-header">
            <strong>${esc(other?.name || 'Unknown')}</strong>
            <span class="badge badge--${statusClass}">${req.status}</span>
          </div>
          <p class="req-meta">
            Offering <em>${esc(req.offeredSkill)}</em> for <em>${esc(req.wantedSkill)}</em>
          </p>
          ${req.message ? `<p class="req-message">"${esc(req.message)}"</p>` : ''}
          <span class="req-time">${timeAgo(req.createdAt)}</span>
          ${actions}
        </div>
      </div>`;
  }).join('');
}

window.handleRequest = function(reqId, status) {
  const { error } = Storage.updateRequest(reqId, { status });
  if (error) { Toast.show(error, 'error'); return; }
  Toast.show(`Request ${status}!`, status === 'accepted' ? 'success' : 'info');
  setTimeout(() => location.reload(), 600);
};


/* ══════════════════════════════
     PROFILE PAGE
══════════════════════════════ */

function initProfile() {
  const user = requireAuth();
  if (!user) return;
  initNav(user);

  /* Populate fields */
  setVal('prof-name',     user.name);
  setVal('prof-email',    user.email);
  setVal('prof-location', user.location || '');
  setVal('prof-bio',      user.bio      || '');
  document.getElementById('prof-avatar').src = user.avatar;

  let offerSkills = [...(user.skillsOffer || [])];
  let wantSkills  = [...(user.skillsWant  || [])];

  renderEditPills('offer-pills', offerSkills, 'offer');
  renderEditPills('want-pills',  wantSkills,  'want');

  /* Add skill — Offer */
  document.getElementById('add-offer-btn')?.addEventListener('click', () => {
    const input = document.getElementById('add-offer-input');
    const skill = input.value.trim();
    if (!skill) return;
    if (offerSkills.includes(skill)) { Toast.show('Skill already added.', 'warning'); return; }
    if (offerSkills.length >= 10)    { Toast.show('Maximum 10 skills allowed.', 'warning'); return; }
    offerSkills.push(skill);
    input.value = '';
    renderEditPills('offer-pills', offerSkills, 'offer');
  });

  /* Add skill — Want */
  document.getElementById('add-want-btn')?.addEventListener('click', () => {
    const input = document.getElementById('add-want-input');
    const skill = input.value.trim();
    if (!skill) return;
    if (wantSkills.includes(skill)) { Toast.show('Skill already added.', 'warning'); return; }
    if (wantSkills.length >= 10)    { Toast.show('Maximum 10 skills allowed.', 'warning'); return; }
    wantSkills.push(skill);
    input.value = '';
    renderEditPills('want-pills', wantSkills, 'want');
  });

  /* Enter key for inputs */
  ['add-offer-input', 'add-want-input'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById(id.replace('input','btn'))?.click();
      }
    });
  });

  /* Save profile */
  document.getElementById('profile-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const patch = {
      name:        getVal('prof-name'),
      location:    getVal('prof-location'),
      bio:         getVal('prof-bio'),
      skillsOffer: offerSkills,
      skillsWant:  wantSkills,
    };
    const { error } = Storage.updateUser(user.id, patch);
    if (error) { Toast.show(error, 'error'); return; }
    Toast.show('Profile saved!', 'success');
  });

  function renderEditPills(containerId, skills, type) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!skills.length) {
      el.innerHTML = `<span class="pill pill--empty">None yet</span>`;
      return;
    }
    el.innerHTML = skills.map((s, i) => `
      <span class="pill pill--${type} pill--removable">
        ${esc(s)}
        <button class="pill__remove" data-index="${i}" data-type="${type}" title="Remove">×</button>
      </span>`
    ).join('');

    el.querySelectorAll('.pill__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx  = parseInt(btn.dataset.index);
        const kind = btn.dataset.type;
        if (kind === 'offer') { offerSkills.splice(idx, 1); renderEditPills('offer-pills', offerSkills, 'offer'); }
        else                  { wantSkills.splice(idx,  1); renderEditPills('want-pills',  wantSkills,  'want');  }
      });
    });
  }

  function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }
  function getVal(id)    { return (document.getElementById(id)?.value || '').trim(); }
}


/* ══════════════════════════════
     BROWSE PAGE
══════════════════════════════ */

function initBrowse() {
  const user = requireAuth();
  if (!user) return;
  initNav(user);

  const allUsers    = Storage.getUsers().filter(u => u.id !== user.id);
  const grid        = document.getElementById('users-grid');
  const searchInput = document.getElementById('browse-search');
  const filterSkill = document.getElementById('filter-skill');

  /* Populate skill filter */
  const allSkills = [...new Set(allUsers.flatMap(u => [...(u.skillsOffer||[]), ...(u.skillsWant||[])]))].sort();
  if (filterSkill) {
    filterSkill.innerHTML = `<option value="">All skills</option>` +
      allSkills.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  }

  renderUsers(allUsers);

  /* Search + filter */
  function filterAndRender() {
    const q     = (searchInput?.value || '').toLowerCase();
    const skill = filterSkill?.value || '';
    const filtered = allUsers.filter(u => {
      const matchQ = !q || u.name.toLowerCase().includes(q) ||
        (u.skillsOffer||[]).some(s => s.toLowerCase().includes(q)) ||
        (u.skillsWant ||[]).some(s => s.toLowerCase().includes(q));
      const matchS = !skill ||
        (u.skillsOffer||[]).includes(skill) ||
        (u.skillsWant ||[]).includes(skill);
      return matchQ && matchS;
    });
    renderUsers(filtered);
  }

  searchInput?.addEventListener('input',  filterAndRender);
  filterSkill?.addEventListener('change', filterAndRender);

  function renderUsers(users) {
    if (!grid) return;
    if (!users.length) {
      grid.innerHTML = `<div class="empty-state"><p>No users found matching your criteria.</p></div>`;
      return;
    }
    grid.innerHTML = users.map(u => `
      <div class="user-card">
        <div class="user-card__top">
          <img class="user-card__avatar" src="${u.avatar}" alt="${esc(u.name)}">
          <div>
            <h3 class="user-card__name">${esc(u.name)}</h3>
            <p class="user-card__loc">${esc(u.location || 'Worldwide')}</p>
          </div>
        </div>
        ${u.bio ? `<p class="user-card__bio">${esc(u.bio)}</p>` : ''}
        <div class="user-card__section">
          <span class="label">Offers</span>
          <div class="pill-row">
            ${(u.skillsOffer||[]).map(s=>`<span class="pill pill--offer">${esc(s)}</span>`).join('') || '<span class="pill pill--empty">—</span>'}
          </div>
        </div>
        <div class="user-card__section">
          <span class="label">Wants</span>
          <div class="pill-row">
            ${(u.skillsWant||[]).map(s=>`<span class="pill pill--want">${esc(s)}</span>`).join('') || '<span class="pill pill--empty">—</span>'}
          </div>
        </div>
        <a class="btn btn--primary btn--full" href="request.html?to=${u.id}">Request Exchange</a>
      </div>`
    ).join('');
  }
}


/* ══════════════════════════════
     REQUEST PAGE
══════════════════════════════ */

function initRequest() {
  const currentUser = requireAuth();
  if (!currentUser) return;
  initNav(currentUser);

  const params = new URLSearchParams(location.search);
  const toId   = params.get('to');
  const target  = toId ? Storage.getUserById(toId) : null;

  const targetInfo = document.getElementById('req-target-info');
  const form       = document.getElementById('request-form');

  if (!target || target.id === currentUser.id) {
    if (targetInfo) targetInfo.innerHTML = `<p class="error-text">Invalid request target.</p>`;
    if (form) form.style.display = 'none';
    return;
  }

  /* Render target info */
  if (targetInfo) {
    targetInfo.innerHTML = `
      <img class="req-page-avatar" src="${target.avatar}" alt="${esc(target.name)}">
      <div>
        <h2>${esc(target.name)}</h2>
        <p>${esc(target.location || 'Worldwide')}</p>
      </div>`;
  }

  /* Populate offered skill dropdown (my skills) */
  const offeredSel = document.getElementById('req-offered');
  if (offeredSel) {
    const mySkills = currentUser.skillsOffer || [];
    offeredSel.innerHTML = mySkills.length
      ? mySkills.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')
      : `<option value="">— No skills added yet —</option>`;
  }

  /* Populate wanted skill dropdown (target's offered skills) */
  const wantedSel = document.getElementById('req-wanted');
  if (wantedSel) {
    const theirSkills = target.skillsOffer || [];
    wantedSel.innerHTML = theirSkills.length
      ? theirSkills.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')
      : `<option value="">— They have no skills listed —</option>`;
  }

  /* Submit */
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const offeredSkill = offeredSel?.value;
    const wantedSkill  = wantedSel?.value;
    const message      = (document.getElementById('req-message')?.value || '').trim();

    if (!offeredSkill) { Toast.show('Please select a skill you can offer.', 'warning'); return; }
    if (!wantedSkill)  { Toast.show('Please select a skill you want.', 'warning'); return; }

    const { request, error } = Storage.createRequest({
      fromId: currentUser.id,
      toId:   target.id,
      offeredSkill,
      wantedSkill,
      message,
    });

    if (error) { Toast.show(error, 'error'); return; }
    Toast.show('Exchange request sent! 🤝', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
  });
}
