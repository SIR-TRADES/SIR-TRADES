document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'kiu-registration-requests';
  const registrationsApi = window.KIU_API_URL || '';
  const usingRemoteStore = Boolean(registrationsApi);
  const adminSessionKey = 'kiu-admin-session';
  const adminUsername = 'SIR TRADES';
  const adminPassword = 'SIRTRADES123';
  const form = document.querySelector('#registrationForm');
  const message = document.querySelector('#registrationMessage');
  const requestList = document.querySelector('#requestList');
  const roleInput = document.querySelector('#registrationRole');
  const toastRegion = document.querySelector('#toastRegion');
  let requests = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const programmeSelect = document.querySelector('#programme');
  programmeSelect.innerHTML = '<option value="">Select programme</option><option value="Bachelor in Software Engineering">Bachelor in Software Engineering</option>';
  const dashboardView = document.querySelector('#dashboard-view');
  const loginMarkup = '<section class="admin-login"><div class="login-mark">K</div><p class="eyebrow">Restricted workspace</p><h1>Admin portal</h1><p class="login-copy">Sign in to review and verify KIU registration requests.</p><form id="adminLoginForm"><label>Admin name<input id="adminUsername" type="text" autocomplete="username" placeholder="Enter admin name" required /></label><label>Password<input id="adminPassword" type="password" autocomplete="current-password" placeholder="Enter password" required /></label><button class="button button-primary full-width" type="submit">Sign in to portal <span class="arrow">-&gt;</span></button><p class="login-message" id="loginMessage" role="alert"></p></form></section>';
  dashboardView.insertAdjacentHTML('afterbegin', loginMarkup);
  Array.from(dashboardView.children).filter((child) => !child.classList.contains('admin-login')).forEach((child) => child.classList.add('admin-protected-content'));
  const loginForm = document.querySelector('#adminLoginForm');
  const loginMessage = document.querySelector('#loginMessage');
  const isAdminSignedIn = () => sessionStorage.getItem(adminSessionKey) === 'true';
  const setAdminState = (signedIn) => { dashboardView.classList.toggle('admin-locked', !signedIn); dashboardView.classList.toggle('admin-login-hidden', signedIn); };
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.querySelector('#adminUsername').value.trim().toUpperCase();
    const password = document.querySelector('#adminPassword').value;
    if (username === adminUsername && password === adminPassword) {
      sessionStorage.setItem(adminSessionKey, 'true');
      loginForm.reset();
      loginMessage.textContent = '';
      setAdminState(true);
      renderRequests();
      return;
    }
    loginMessage.textContent = 'Admin name or password is incorrect.';
  });
  const loadRequests = async () => {
    if (usingRemoteStore) {
      try {
        const response = await fetch(registrationsApi);
        if (!response.ok) throw new Error('Unable to load registrations');
        const payload = await response.json();
        requests = Array.isArray(payload) ? payload : payload.registrations || [];
        return;
      } catch (error) {
        showToast('Shared server unavailable', 'Redeploy this project to Netlify with its netlify folder included.', 'error');
      }
    }
    requests = JSON.parse(localStorage.getItem(storageKey) || '[]');
  };
  const saveRequests = () => localStorage.setItem(storageKey, JSON.stringify(requests));
  const initials = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
  const showToast = (title, text, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : '!'}</span><span><strong>${title}</strong><small>${text}</small></span>`;
    toastRegion.appendChild(toast);
    window.setTimeout(() => { toast.classList.add('leaving'); window.setTimeout(() => toast.remove(), 300); }, 5000);
  };
  const updateRoleFields = (role) => {
    const student = role === 'Student';
    document.querySelector('#studentIdField').classList.toggle('hidden', !student);
    document.querySelector('#staffIdField').classList.toggle('hidden', student);
    document.querySelector('#programmeField').classList.toggle('hidden', !student);
    document.querySelector('#departmentField').classList.toggle('hidden', student);
    document.querySelector('#studentId').required = student;
    document.querySelector('#staffId').required = !student;
    document.querySelector('#programme').required = student;
    document.querySelector('#department').required = !student;
    roleInput.value = role;
  };
  document.querySelectorAll('.role-tab').forEach((tab) => tab.addEventListener('click', () => {
    document.querySelectorAll('.role-tab').forEach((item) => { item.classList.remove('active'); item.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); updateRoleFields(tab.dataset.role);
  }));
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const idField = roleInput.value === 'Student' ? 'studentId' : 'staffId';
    const groupField = roleInput.value === 'Student' ? 'programme' : 'department';
    const request = { id: Date.now().toString(), role: roleInput.value, name: data.get('fullName'), email: data.get('email'), phone: data.get('phone'), reference: data.get(idField), group: data.get(groupField), campus: data.get('campus'), status: 'Pending', submittedAt: new Date().toISOString() };
    if (usingRemoteStore) {
      try {
        const response = await fetch(registrationsApi, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(request) });
        if (!response.ok) throw new Error('Unable to submit registration');
      } catch (error) {
        showToast('Submission failed', 'The shared server is unavailable. Please try again after the site is redeployed.', 'error');
        return;
      }
    } else {
      requests.unshift(request);
      saveRequests();
    }
    form.reset(); updateRoleFields('Student');
    document.querySelectorAll('.role-tab').forEach((item) => { item.classList.toggle('active', item.dataset.role === 'Student'); item.setAttribute('aria-selected', String(item.dataset.role === 'Student')); });
    message.textContent = `Registration received. Your ${request.role.toLowerCase()} profile is now awaiting verification.`; message.className = 'form-message success';
    showToast('Registration submitted', `Thank you, ${request.name}. Your details are now awaiting admin approval.`);
  });
  const renderRequests = async () => {
    await loadRequests();
    const filter = document.querySelector('#requestFilter')?.value || 'all';
    const visible = requests.filter((request) => filter === 'all' || request.status === filter);
    requestList.innerHTML = visible.length ? visible.map((request) => `<article class="request-item"><span class="request-avatar">${initials(request.name)}</span><div class="request-details"><div class="request-title"><div><strong>${escapeHtml(request.name)}</strong><span class="role-label">${request.role}</span></div><span class="status-badge ${request.status.toLowerCase()}">${request.status}</span></div><p>${escapeHtml(request.reference)} <span>·</span> ${escapeHtml(request.group)} <span>·</span> ${escapeHtml(request.campus)}</p><small>${escapeHtml(request.email)} · ${new Date(request.submittedAt).toLocaleDateString()}</small></div><div class="request-actions">${request.status === 'Pending' ? `<button class="button button-approve" data-action="Verified" data-id="${request.id}">Verify</button><button class="text-button reject" data-action="Rejected" data-id="${request.id}">Reject</button>` : '<span class="reviewed-label">Reviewed</span>'}</div></article>`).join('') : '<div class="empty-state"><strong>No registration requests here</strong><span>New student and staff submissions will appear in this queue.</span></div>';
    document.querySelector('#pendingCount').textContent = requests.filter((request) => request.status === 'Pending').length;
    document.querySelector('#verifiedCount').textContent = requests.filter((request) => request.status === 'Verified').length;
    document.querySelector('#studentCount').textContent = requests.filter((request) => request.role === 'Student').length;
    document.querySelector('#staffCount').textContent = requests.filter((request) => request.role === 'Staff').length;
  };
  requestList?.addEventListener('click', async (event) => { const action = event.target.closest('[data-action]'); if (!action) return; const request = requests.find((item) => item.id === action.dataset.id); if (!request) return; request.status = action.dataset.action; if (usingRemoteStore) { await fetch(registrationsApi, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'update', id: request.id, status: request.status }) }); } else saveRequests(); renderRequests(); });
  document.querySelector('#requestFilter')?.addEventListener('change', renderRequests);
  window.addEventListener('storage', (event) => { if (event.key === storageKey) renderRequests(); });
  window.setInterval(() => { if (window.location.hash === '#dashboard' && isAdminSignedIn()) renderRequests(); }, 5000);
  const setView = () => { const admin = window.location.hash === '#dashboard'; document.querySelector('#register-view').classList.toggle('hidden', admin); document.querySelector('#dashboard-view').classList.toggle('hidden', !admin); document.querySelectorAll('.top-nav a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === (admin ? '#dashboard' : '#register'))); setAdminState(isAdminSignedIn()); if (admin && isAdminSignedIn()) renderRequests(); };
  window.addEventListener('hashchange', setView); setView();
  if (window.location.hash !== '#dashboard') window.setTimeout(() => showToast('SIR TRADES TECH GOD', 'Welcome to KIU Connect registration.'), 700);
});
