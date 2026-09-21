/* ===== Shared auth helpers ===== */
const AUTH_KEY = 'stacklyAuth';

function getAuth() {
  try { return JSON.parse(sessionStorage.getItem(AUTH_KEY)); } catch (e) { return null; }
}
function setAuth(data) { sessionStorage.setItem(AUTH_KEY, JSON.stringify(data)); }
function clearAuth() { sessionStorage.removeItem(AUTH_KEY); }
function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
}

/* ===== Guard: run on every dashboard page ===== */
function requireAuth(expectedRole) {
  const auth = getAuth();
  if (!auth || !auth.email || (expectedRole && auth.role !== expectedRole)) {
    window.location.href = 'login.html';
    return null;
  }
  return auth;
}

/* ===== LOGIN PAGE LOGIC ===== */
function initLoginPage() {
  const roleBtns = document.querySelectorAll('.role-toggle button');
  const form = document.getElementById('loginForm');
  const alertBox = document.getElementById('loginAlert');
  let role = 'attendee';

  roleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      roleBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      role = btn.getAttribute('data-role');
      document.getElementById('roleHint').textContent = role === 'attendee'
        ? 'demo@stacklysummit.in / demo1234'
        : 'exhibitor@stacklysummit.in / demo1234';
    });
  });

  if (!form) return;
  const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    alertBox.classList.remove('show');
    const emailField = document.getElementById('loginEmail');
    const passField = document.getElementById('loginPassword');
    const email = emailField.value.trim();
    const pass = passField.value.trim();
    let valid = true;

    if (!EMAIL_RE.test(email)) {
      emailField.classList.add('invalid');
      document.getElementById('emailErr').textContent = 'Enter a valid email address';
      valid = false;
    } else {
      emailField.classList.remove('invalid');
      document.getElementById('emailErr').textContent = '';
    }
    if (pass.length < 4) {
      passField.classList.add('invalid');
      document.getElementById('passErr').textContent = 'Password must be at least 4 characters';
      valid = false;
    } else {
      passField.classList.remove('invalid');
      document.getElementById('passErr').textContent = '';
    }
    if (!valid) return;

    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    setAuth({ role: role, email: email, name: name, loginId: role === 'attendee' ? 'ATD-' + Math.floor(10000 + Math.random() * 89999) : 'EXH-' + Math.floor(10000 + Math.random() * 89999) });

    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Signing in...';
    setTimeout(function () {
      window.location.href = role === 'attendee' ? 'attendee-dashboard.html' : 'exhibitor-dashboard.html';
    }, 500);
  });

  document.querySelectorAll('.pass-toggle').forEach(function (t) {
    t.addEventListener('click', function () {
      const input = document.getElementById('loginPassword');
      input.type = input.type === 'password' ? 'text' : 'password';
      t.textContent = input.type === 'password' ? 'Show' : 'Hide';
    });
  });
}

/* ===== DASHBOARD SHELL LOGIC ===== */
function initDashboardShell(auth) {
  // populate login id pill
  document.querySelectorAll('[data-user-name]').forEach(function (el) { el.textContent = auth.name; });
  document.querySelectorAll('[data-user-loginid]').forEach(function (el) { el.textContent = auth.loginId; });
  document.querySelectorAll('[data-user-email]').forEach(function (el) { el.textContent = auth.email; });
  document.querySelectorAll('[data-user-initials]').forEach(function (el) { el.textContent = initials(auth.name); });

  // sidebar nav switching
  const navBtns = document.querySelectorAll('.dash-nav button[data-section]');
  const sections = document.querySelectorAll('.dash-section');
  const topTitle = document.getElementById('dashSectionTitle');
  navBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      navBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      const key = btn.getAttribute('data-section');
      sections.forEach(function (s) { s.classList.toggle('active', s.getAttribute('data-section') === key); });
      if (topTitle) topTitle.textContent = btn.getAttribute('data-title') || btn.textContent.trim();
      document.querySelector('.dash-sidebar').classList.remove('open');
    });
  });

  // mobile sidebar toggle
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', function () {
      document.querySelector('.dash-sidebar').classList.toggle('open');
    });
  }

  // notification dropdown
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      notifDropdown.classList.toggle('open');
      notifBtn.querySelector('.notif-dot').style.display = 'none';
    });
    document.addEventListener('click', function (e) {
      if (!notifBtn.contains(e.target)) notifDropdown.classList.remove('open');
    });
  }

  // logout
  document.querySelectorAll('.dash-logout').forEach(function (btn) {
    btn.addEventListener('click', function () {
      clearAuth();
      window.location.href = 'login.html';
    });
  });

  // bookmark toggle buttons
  document.querySelectorAll('.bookmark-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.classList.toggle('saved');
      toast(btn.classList.contains('saved') ? 'Session bookmarked' : 'Bookmark removed');
    });
  });

  // ticket download (generates a simple text "ticket" as a downloadable file)
  document.querySelectorAll('[data-action="download-ticket"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const content = 'STACKLY SUMMIT 2026 — E-TICKET\nAttendee: ' + auth.name + '\nLogin ID: ' + auth.loginId + '\nEmail: ' + auth.email + '\nPass: Premium\nDates: 12–14 March 2026\nVenue: BIEC, Bengaluru';
      downloadFile(content, 'stackly-summit-eticket.txt');
      toast('E-ticket downloaded');
    });
  });

  // generic copy-to-clipboard for login id
  document.querySelectorAll('[data-action="copy-loginid"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      navigator.clipboard && navigator.clipboard.writeText(auth.loginId).catch(function () {});
      toast('Login ID copied');
    });
  });

  // profile save (simulated, values persist in sessionStorage)
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      toast('Profile updated successfully');
    });
  }

  // leads table search filter (exhibitor dashboard)
  const leadSearch = document.getElementById('leadSearch');
  if (leadSearch) {
    leadSearch.addEventListener('input', function () {
      const q = leadSearch.value.toLowerCase();
      document.querySelectorAll('#leadsTable tbody tr').forEach(function (row) {
        row.style.display = row.textContent.toLowerCase().indexOf(q) > -1 ? '' : 'none';
      });
    });
  }

  // leads status filter chips
  document.querySelectorAll('.tab-btn[data-lead-filter]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn[data-lead-filter]').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      const val = chip.getAttribute('data-lead-filter');
      document.querySelectorAll('#leadsTable tbody tr').forEach(function (row) {
        row.style.display = (val === 'all' || row.getAttribute('data-status') === val) ? '' : 'none';
      });
    });
  });

  // export leads to CSV
  document.querySelectorAll('[data-action="export-leads"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const rows = [['Name', 'Company', 'Email', 'Status']];
      document.querySelectorAll('#leadsTable tbody tr').forEach(function (tr) {
        const cells = tr.querySelectorAll('td');
        rows.push([cells[0].textContent.trim(), cells[1].textContent.trim(), cells[2].textContent.trim(), cells[3].textContent.trim()]);
      });
      const csv = rows.map(function (r) { return r.map(function (c) { return '"' + c.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
      downloadFile(csv, 'stackly-summit-leads.csv');
      toast('Leads exported as CSV');
    });
  });

  // modal open/close (add team member)
  document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const modal = document.querySelector(btn.getAttribute('data-open-modal'));
      if (modal) modal.classList.add('open');
    });
  });
  document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.modal-overlay').classList.remove('open');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(function (ov) {
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.classList.remove('open'); });
  });

  // add team member form -> appends row + closes modal
  const teamForm = document.getElementById('teamForm');
  if (teamForm) {
    teamForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const nameVal = document.getElementById('teamName').value.trim() || 'New Member';
      const roleVal = document.getElementById('teamRole').value;
      const tbody = document.getElementById('teamList');
      const row = document.createElement('div');
      row.className = 'list-row';
      row.innerHTML = '<div class="lr-main"><div class="lr-icon">' + initials(nameVal) + '</div><div><h4>' + nameVal + '</h4><p class="lr-sub">' + roleVal + ' &bull; Pass generated</p></div></div><span class="track-pill track-tech">Active</span>';
      tbody.prepend(row);
      teamForm.reset();
      document.getElementById('teamModal').classList.remove('open');
      toast('Team member added');
    });
  }
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toast(msg) {
  let t = document.querySelector('.save-toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'save-toast';
    t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg><span></span>';
    document.body.appendChild(t);
  }
  t.querySelector('span').textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.classList.remove('show'); }, 2600);
}