// ========================= MAGICODE AI INTEGRATION =========================
// 1) Deploy apps-script/Code.gs as a Google Apps Script Web App (doGet + doPost).
// 2) Paste its /exec URL below.
// 3) Set USE_MOCK_DATA = true only while testing without a live backend.
//
// doPost(e) on the Apps Script side must accept JSON bodies shaped like:
//   { action: 'sendMessage', chatId, text }
//   { action: 'addCustomer', name, phone }
//   { action: 'addLead', name, phone, interest }
//   { action: 'updateLeadStatus', id, status }
// and return JSON, e.g. ContentService.createTextOutput(JSON.stringify({ok:true})).
const MAGICODE_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwM2IQLshVr0o_qSQWEKZajWtpLGD-1IVC1MaI1_2U-t5wFIlifaRoe6ckgePjL3_w_/exec',
  USE_MOCK_DATA: false,
  POLL_MS: 5000
};

let realData = { conversations: [], customers: [], leads: [], stats: null, business: null };
let lastSync = null;
let hasSynced = false;   // becomes true after the first successful real fetch
let syncFailed = false;  // true when the last sync attempt failed
let pollingStarted = false;

async function apiGet(action) {
  if (!MAGICODE_CONFIG.API_URL) throw new Error('API URL is not configured');
  const res = await fetch(MAGICODE_CONFIG.API_URL + '?action=' + encodeURIComponent(action), { cache: 'no-store' });
  if (!res.ok) throw new Error('API request failed: ' + res.status);
  return await res.json();
}

// text/plain content-type avoids a CORS preflight against Apps Script web apps.
async function apiPost(action, payload) {
  if (!MAGICODE_CONFIG.API_URL) throw new Error('API URL is not configured');
  const res = await fetch(MAGICODE_CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  });
  if (!res.ok) throw new Error('API POST failed: ' + res.status);
  const data = await res.json().catch(() => ({ ok: true }));
  if (data && data.ok === false) throw new Error(data.error || 'API rejected the request');
  return data;
}

async function syncDashboard(silent = false) {
  if (MAGICODE_CONFIG.USE_MOCK_DATA || !MAGICODE_CONFIG.API_URL) return;
  try {
    const data = await apiGet('dashboard');
    realData = {
      conversations: data.conversations || [],
      customers: data.customers || [],
      leads: data.leads || [],
      stats: data.stats || null,
      business: data.business || null
    };
    lastSync = new Date();
    hasSynced = true;
    syncFailed = false;
    if (!silent) toast('تم تحديث البيانات');
    app();
  } catch (e) {
    syncFailed = true;
    if (!silent) toast('تعذر تحديث البيانات، تحقق من الاتصال');
    console.error(e);
  }
}

function startPolling() {
  if (pollingStarted || MAGICODE_CONFIG.USE_MOCK_DATA || !MAGICODE_CONFIG.API_URL) return;
  pollingStarted = true;
  syncDashboard(true);
  setInterval(() => syncDashboard(true), MAGICODE_CONFIG.POLL_MS);
}

// Mock arrays are placeholder demo content shown only before the first real
// sync completes (or when USE_MOCK_DATA is on for local testing). Once a real
// sync has happened, the real (possibly empty) data is shown — no more fake rows.
function dataConversations() { return (MAGICODE_CONFIG.USE_MOCK_DATA || !hasSynced) && !realData.conversations.length ? conversations : realData.conversations; }
function dataCustomers() { return (MAGICODE_CONFIG.USE_MOCK_DATA || !hasSynced) && !realData.customers.length ? customers : realData.customers; }
function dataLeads() { return (MAGICODE_CONFIG.USE_MOCK_DATA || !hasSynced) && !realData.leads.length ? leads : realData.leads; }
function integrationStatus() {
  if (MAGICODE_CONFIG.USE_MOCK_DATA) return 'Mock Mode';
  if (!MAGICODE_CONFIG.API_URL) return 'Not configured';
  if (!hasSynced) return 'Connecting';
  return syncFailed ? 'Offline' : 'Live';
}

const state = { page: 'dashboard', side: false, selected: 0, query: '' };
const conversations = [{ name: 'يوسف محمد', id: '123456789', last: 'وفيه Personal؟', time: '5 min', msgs: [['in', 'الاشتراك بكام؟'], ['out', 'العضوية الشهرية بـ 500 جنيه.'], ['in', 'وفيه Personal؟'], ['out', 'أيوه، الـ Personal بـ 1500 جنيه.']] }, { name: 'أحمد علي', id: '987654321', last: 'تمام شكراً', time: '18 min', msgs: [['in', 'مواعيد الجيم؟'], ['out', 'أهلاً بيك! مواعيد العمل حسب بيانات النشاط.'], ['in', 'تمام شكراً']] }, { name: 'محمود حسن', id: '555123222', last: 'عايز أعرف الأسعار', time: '1 hr', msgs: [['in', 'عايز أعرف الأسعار'], ['out', 'أكيد، أقدر أساعدك في خدمات الجيم.']] }];
const customers = [['يوسف محمد', '123456789', '01012345678', 'Active', 'Today', '8'], ['أحمد علي', '987654321', '01098765432', 'Active', 'Today', '5'], ['محمود حسن', '555123222', '—', 'Lead', 'Yesterday', '3'], ['سارة أحمد', '771234111', '01122334455', 'Active', '2 days ago', '12']];
const leads = [['يوسف محمد', '01012345678', 'Monthly Membership', 'New', 'Yes', 'Today'], ['محمود حسن', '—', 'Personal', 'Contacted', 'Yes', 'Yesterday'], ['سارة أحمد', '01122334455', 'Monthly Membership', 'Qualified', 'Yes', '2 days ago']];

function app() { document.getElementById('app').innerHTML = `<div class="shell"><aside class="side ${state.side ? 'open' : ''}"><div class="brand"><span class="logo">M</span> Magicode AI</div><nav class="nav">${nav('dashboard', 'Dashboard')} ${nav('conversations', 'Conversations')} ${nav('customers', 'Customers')} ${nav('leads', 'Leads')} ${nav('analytics', 'Analytics')} ${nav('business', 'Business Data')} ${nav('settings', 'Settings')}</nav></aside><main class="main"><header class="top"><div class="topRight"><button class="mobileMenu" onclick="toggleSide()">☰</button><h1>${title()}</h1></div><div class="topRight"><span class="status">${integrationStatus() === 'Live' ? '● Bot Online' : integrationStatus() === 'Offline' ? '● Offline' : '● Connecting'}</span><span>⌕</span><span>🔔</span><span class="avatar">JA</span></div></header><div class="content">${pages()}</div></main></div>` }
function nav(id, label) { return `<button class="${state.page === id ? 'active' : ''}" onclick="go('${id}')">${icon(id)} ${label}</button>` } function icon(x) { return ({ dashboard: '▦', conversations: '◧', customers: '◉', leads: '◆', analytics: '▥', business: '▤', settings: '⚙' })[x] || '' } function title() { return ({ dashboard: 'Dashboard', conversations: 'Conversations', customers: 'Customers', leads: 'Leads', analytics: 'Analytics', business: 'Business Data', settings: 'Settings' })[state.page] }
function pages() { if (state.page === 'dashboard') return dashboard(); if (state.page === 'conversations') return conversationsPage(); if (state.page === 'customers') return customersPage(); if (state.page === 'leads') return leadsPage(); if (state.page === 'analytics') return analytics(); if (state.page === 'business') return business(); return settings() }
function dashboard() { const s = realData.stats || { customers: '—', leads: '—', messages: '—', replies: '—' }; const convs = dataConversations(); return `<section class="cards">${card('Total Customers', s.customers, 'Live customer count')}${card('New Leads', s.leads, 'Live lead count')}${card('Messages Today', s.messages, 'Customer messages')}${card('AI Replies Today', s.replies, 'AI-generated replies')}</section><div class="grid2"><div class="card"><div class="sectionTitle"><h2>Recent Conversations</h2><button class="btn secondary" onclick="go('conversations')">View all</button></div><div class="list">${convs.length ? convs.map(c => `<div class="row"><div><strong>${c.name}</strong><div class="muted">${c.last}</div></div><div><span class="pill">${c.time}</span></div></div>`).join('') : `<div class="muted">لا توجد محادثات بعد</div>`}</div></div><div class="card"><div class="sectionTitle"><h2>Connection</h2></div><div class="list"><div class="row"><span>Backend</span><span class="pill">${integrationStatus()}</span></div><div class="row"><span>Last sync</span><span class="muted">${lastSync ? lastSync.toLocaleTimeString() : '—'}</span></div></div></div></div>` } function card(a, b, c) { return `<div class="card"><div class="label">${a}</div><div class="value">${b}</div><div class="muted">${c}</div></div>` }
function conversationsPage() { const convs = dataConversations(); let c = convs[state.selected] || convs[0] || { name: 'No conversations', id: '—', last: '', time: '', msgs: [] }; return `<div class="chat"><div class="chatList">${convs.length ? convs.map((x, i) => `<div class="chatItem ${i === state.selected ? 'active' : ''}" onclick="selectChat(${i})"><div class="chatHead"><strong>${x.name}</strong><small>${x.time}</small></div><div class="muted">${x.last}</div></div>`).join('') : `<div class="muted" style="padding:16px">لا توجد محادثات</div>`}</div><div class="chatWindow"><div class="chatTop"><strong>${c.name}</strong><div class="muted">Telegram • ${c.id}</div></div><div class="messages">${c.msgs.map(m => `<div class="bubble ${m[0] === 'in' ? 'in' : 'out'}">${m[1]}</div>`).join('')}</div><div class="composer"><input id="msg" class="input" placeholder="اكتب رسالة..." onkeydown="if(event.key==='Enter')sendMsg()"><button class="btn" onclick="sendMsg()">Send</button></div></div></div>` }
function customersPage() { const data = dataCustomers(); return `<div class="card"><div class="sectionTitle"><h2>Customers</h2><button class="btn" onclick="addCustomer()">+ Add</button></div><div class="toolbar"><input class="input" placeholder="Search..." oninput="filterTable(this.value)"></div><div style="overflow:auto"><table class="table"><thead><tr>${['Name', 'Telegram Chat ID', 'Phone', 'Status', 'Last Interaction', 'Messages'].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody id="tbody">${data.length ? data.map(r => `<tr>${r.map((v, i) => `<td>${i === 3 ? `<span class="pill">${v}</span>` : v}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="6" class="muted">لا يوجد عملاء بعد</td></tr>`}</tbody></table></div></div>` }
function leadsPage() { const data = dataLeads(); return `<div class="card"><div class="sectionTitle"><h2>Lead Management</h2><button class="btn" onclick="addLead()">+ New Lead</button></div><div style="overflow:auto"><table class="table"><thead><tr><th>Name</th><th>Phone</th><th>Interest</th><th>Status</th><th>Is Lead</th><th>Last Contact</th></tr></thead><tbody>${data.length ? data.map((r, i) => `<tr>${r.map((v, j) => `<td>${j === 3 ? `<select class="select" onchange="updateLeadStatus(${i}, this.value)"><option${v === 'New' ? ' selected' : ''}>New</option><option${v === 'Contacted' ? ' selected' : ''}>Contacted</option><option${v === 'Qualified' ? ' selected' : ''}>Qualified</option><option${v === 'Won' ? ' selected' : ''}>Won</option></select>` : v}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="6" class="muted">لا توجد عملاء محتملين بعد</td></tr>`}</tbody></table></div></div>` }
function analytics() { const s = realData.stats || {}; return `<div class="cards">${card('Messages / Day', s.messages || '—', 'Last 24 hours')}${card('AI Replies', s.replies || '—', 'Automated replies')}${card('New Customers', s.newCustomers || '—', 'This week')}${card('New Leads', s.leads || '—', 'This month')}</div><div class="card" style="margin-top:18px"><div class="sectionTitle"><h2>Messages & AI Replies</h2></div><div class="muted" style="padding:20px">Chart data connects once your analytics endpoint returns a daily series.</div></div>` }
function business() { const b = realData.business || {}; return `<div class="cards">${card('Business Name', b.name || '—', 'From connected data source')}${(b.services || []).slice(0, 3).map(s => card(s.name, s.price, 'Active service')).join('')}</div><div class="grid2"><div class="card"><div class="sectionTitle"><h2>Services & Prices</h2><button class="btn secondary" onclick="syncDashboard(false)">Sync</button></div><div class="list">${(b.services || []).length ? b.services.map(s => `<div class="row"><strong>${s.name}</strong><span>${s.price}</span></div>`).join('') : `<div class="muted">لا توجد بيانات خدمات متصلة بعد</div>`}</div></div><div class="card"><h2 style="font-size:16px">AI Data Policy</h2><p class="muted" style="line-height:1.8">The AI must use only verified business data supplied by the connected data source and must never invent prices, services, hours, policies or offers.</p></div></div>` }
function settings() { return `<div class="settingsGrid"><div class="card"><h2 style="font-size:16px">Connections</h2>${[['Make', integrationStatus()], ['Telegram Bot', integrationStatus()], ['AI / Gemini', 'Managed by Make'], ['Incoming Webhook', MAGICODE_CONFIG.API_URL ? 'Connected' : 'Not configured']].map(x => `<div class="setting"><span>${x[0]}</span><span class="status">● ${x[1]}</span></div>`).join('')}<div style="margin-top:18px;display:flex;gap:8px"><button class="btn" onclick="testConnection('Make')">Test Make</button><button class="btn secondary" onclick="testConnection('Telegram')">Test Telegram</button></div></div><div class="card"><h2 style="font-size:16px">System</h2><div class="setting"><span>Mock Data Mode</span><span class="pill">${MAGICODE_CONFIG.USE_MOCK_DATA ? 'ON' : 'OFF'}</span></div><div class="setting"><span>Webhook API</span><span class="pill">${MAGICODE_CONFIG.API_URL ? 'Configured' : 'Not configured'}</span></div><div class="setting"><span>Last sync</span><span class="pill">${lastSync ? lastSync.toLocaleTimeString() : '—'}</span></div><p class="muted">Production secrets belong on the server, never in browser JavaScript.</p></div></div>` }

function go(p) { state.page = p; state.side = false; app() }
function toggleSide() { state.side = !state.side; app() }
function selectChat(i) { state.selected = i; app() }

async function sendMsg() {
  const el = document.getElementById('msg');
  if (!el || !el.value.trim()) return toast('اكتب رسالة أولاً');
  const text = el.value.trim();
  const convs = dataConversations();
  const c = convs[state.selected];
  if (!c) return toast('اختر محادثة أولاً');
  try {
    await apiPost('sendMessage', { chatId: c.id, text });
    c.msgs.push(['out', text]);
    c.last = text;
    app();
    syncDashboard(true);
  } catch (e) {
    toast('تعذر إرسال الرسالة، تحقق من الاتصال');
    console.error(e);
  }
}

async function addCustomer() {
  const name = prompt('اسم العميل؟');
  if (!name) return;
  const phone = prompt('رقم الهاتف؟ (اختياري)') || '';
  try {
    await apiPost('addCustomer', { name, phone });
    toast('تمت إضافة العميل');
    syncDashboard(true);
  } catch (e) {
    toast('تعذرت إضافة العميل، تحقق من الاتصال');
    console.error(e);
  }
}

async function addLead() {
  const name = prompt('اسم العميل المحتمل؟');
  if (!name) return;
  const phone = prompt('رقم الهاتف؟ (اختياري)') || '';
  const interest = prompt('مهتم بإيه؟ (اختياري)') || '';
  try {
    await apiPost('addLead', { name, phone, interest });
    toast('تمت إضافة العميل المحتمل');
    syncDashboard(true);
  } catch (e) {
    toast('تعذرت الإضافة، تحقق من الاتصال');
    console.error(e);
  }
}

async function updateLeadStatus(i, status) {
  const lead = dataLeads()[i];
  if (!lead) return;
  try {
    await apiPost('updateLeadStatus', { id: lead[1] || lead[0], status });
    toast('تم تحديث الحالة');
    syncDashboard(true);
  } catch (e) {
    toast('تعذر تحديث الحالة، تحقق من الاتصال');
    console.error(e);
  }
}

async function testConnection(label) {
  try {
    await apiGet('dashboard');
    toast(label + ': الاتصال شغال');
  } catch (e) {
    toast(label + ': فشل الاتصال');
    console.error(e);
  }
}

function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2200) }
function filterTable(q) { const rows = [...document.querySelectorAll('#tbody tr')]; rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(q.toLowerCase()) ? '' : 'none') }

app();
startPolling();
