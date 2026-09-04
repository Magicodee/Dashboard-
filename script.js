// ========================= MAGICODE AI INTEGRATION =========================
// 1) Deploy apps-script/Code.gs as a Google Apps Script Web App.
// 2) Paste its /exec URL below.
// 3) Keep USE_MOCK_DATA = true until the connection is tested.
const MAGICODE_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwM2IQLshVr0o_qSQWEKZajWtpLGD-1IVC1MaI1_2U-t5wFIlifaRoe6ckgePjL3_w_/exec', // Example: https://script.google.com/macros/s/XXXXXXXX/exec
  USE_MOCK_DATA: true,
  POLL_MS: 5000
};

let realData = { conversations: [], customers: [], leads: [], stats: null, business: null };
let lastSync = null;

async function apiGet(action) {
  if (!MAGICODE_CONFIG.API_URL) throw new Error('API URL is not configured');
  const res = await fetch(MAGICODE_CONFIG.API_URL + '?action=' + encodeURIComponent(action), { cache: 'no-store' });
  if (!res.ok) throw new Error('API request failed: ' + res.status);
  return await res.json();
}

async function syncDashboard(silent=false) {
  if (MAGICODE_CONFIG.USE_MOCK_DATA || !MAGICODE_CONFIG.API_URL) return;
  try {
    const data = await apiGet('dashboard');
    realData = data;
    lastSync = new Date();
    if (!silent) toast('Dashboard synced successfully');
    app();
startPolling();
  } catch (e) {
    if (!silent) toast('Failed to sync dashboard');
    console.error(e);
  }
}

function startPolling(){
  if (!MAGICODE_CONFIG.USE_MOCK_DATA && MAGICODE_CONFIG.API_URL) {
    syncDashboard(true);
    setInterval(() => syncDashboard(true), MAGICODE_CONFIG.POLL_MS);
  }
}

function dataConversations(){ return (!MAGICODE_CONFIG.USE_MOCK_DATA && realData.conversations.length) ? realData.conversations : conversations; }
function dataCustomers(){ return (!MAGICODE_CONFIG.USE_MOCK_DATA && realData.customers.length) ? realData.customers : customers; }
function dataLeads(){ return (!MAGICODE_CONFIG.USE_MOCK_DATA && realData.leads.length) ? realData.leads : leads; }
function integrationStatus(){ return MAGICODE_CONFIG.USE_MOCK_DATA ? 'Mock Mode' : (lastSync ? 'Live' : 'Connecting'); }

const state={page:'dashboard',side:false,selected:0,query:''};
const conversations=[{name:'يوسف محمد',id:'123456789',last:'وفيه Personal؟',time:'5 min',msgs:[['in','الاشتراك بكام؟'],['out','العضوية الشهرية بـ 500 جنيه.'],['in','وفيه Personal؟'],['out','أيوه، الـ Personal بـ 1500 جنيه.']]},{name:'أحمد علي',id:'987654321',last:'تمام شكراً',time:'18 min',msgs:[['in','مواعيد الجيم؟'],['out','أهلاً بيك! مواعيد العمل حسب بيانات النشاط.'],['in','تمام شكراً']]},{name:'محمود حسن',id:'555123222',last:'عايز أعرف الأسعار',time:'1 hr',msgs:[['in','عايز أعرف الأسعار'],['out','أكيد، أقدر أساعدك في خدمات الجيم.']]}];
const customers=[['يوسف محمد','123456789','01012345678','Active','Today','8'],['أحمد علي','987654321','01098765432','Active','Today','5'],['محمود حسن','555123222','—','Lead','Yesterday','3'],['سارة أحمد','771234111','01122334455','Active','2 days ago','12']];
const leads=[['يوسف محمد','01012345678','Monthly Membership','New','Yes','Today'],['محمود حسن','—','Personal','Contacted','Yes','Yesterday'],['سارة أحمد','01122334455','Monthly Membership','Qualified','Yes','2 days ago']];
function app(){document.getElementById('app').innerHTML=`<div class="shell"><aside class="side ${state.side?'open':''}"><div class="brand"><span class="logo">M</span> Magicode AI</div><nav class="nav">${nav('dashboard','Dashboard')} ${nav('conversations','Conversations')} ${nav('customers','Customers')} ${nav('leads','Leads')} ${nav('analytics','Analytics')} ${nav('business','Business Data')} ${nav('settings','Settings')}</nav></aside><main class="main"><header class="top"><div class="topRight"><button class="mobileMenu" onclick="toggleSide()">☰</button><h1>${title()}</h1></div><div class="topRight"><span class="status">● Bot Online</span><span>⌕</span><span>🔔</span><span class="avatar">JA</span></div></header><div class="content">${pages()}</div></main></div>`}
function nav(id,label){return `<button class="${state.page===id?'active':''}" onclick="go('${id}')">${icon(id)} ${label}</button>`}function icon(x){return ({dashboard:'▦',conversations:'◧',customers:'◉',leads:'◆',analytics:'▥',business:'▤',settings:'⚙'})[x]||''}function title(){return ({dashboard:'Dashboard',conversations:'Conversations',customers:'Customers',leads:'Leads',analytics:'Analytics',business:'Business Data',settings:'Settings'})[state.page]}
function pages(){if(state.page==='dashboard')return dashboard();if(state.page==='conversations')return conversationsPage();if(state.page==='customers')return tablePage('Customers',dataCustomers(),['Name','Telegram Chat ID','Phone','Status','Last Interaction','Messages']);if(state.page==='leads')return leadsPage();if(state.page==='analytics')return analytics();if(state.page==='business')return business();return settings()}
function dashboard(){const s=realData.stats||{customers:'1,284',leads:'86',messages:'342',replies:'318'};return `<section class="cards">${card('Total Customers',s.customers,'Live customer count')}${card('New Leads',s.leads,'Live lead count')}${card('Messages Today',s.messages,'Customer messages')}${card('AI Replies Today',s.replies,'AI-generated replies')}</section><div class="grid2"><div class="card"><div class="sectionTitle"><h2>Recent Conversations</h2><button class="btn secondary" onclick="go('conversations')">View all</button></div><div class="list">${conversations.map(c=>`<div class="row"><div><strong>${c.name}</strong><div class="muted">${c.last}</div></div><div><span class="pill">${c.time}</span></div></div>`).join('')}</div></div><div class="card"><div class="sectionTitle"><h2>Recent Activity</h2></div><div class="list"><div class="row"><span>AI replied to Yusuf</span><span class="muted">2m</span></div><div class="row"><span>New lead: Mahmoud</span><span class="muted">18m</span></div><div class="row"><span>Customer updated</span><span class="muted">1h</span></div></div></div></div>`}function card(a,b,c){return `<div class="card"><div class="label">${a}</div><div class="value">${b}</div><div class="muted">${c}</div></div>`}
function conversationsPage(){const convs=dataConversations(); let c=convs[state.selected] || convs[0] || {name:'No conversations',id:'—',last:'',time:'',msgs:[]};return `<div class="chat"><div class="chatList">${convs.map((x,i)=>`<div class="chatItem ${i===state.selected?'active':''}" onclick="selectChat(${i})"><div class="chatHead"><strong>${x.name}</strong><small>${x.time}</small></div><div class="muted">${x.last}</div></div>`).join('')}</div><div class="chatWindow"><div class="chatTop"><strong>${c.name}</strong><div class="muted">Telegram • ${c.id}</div></div><div class="messages">${c.msgs.map(m=>`<div class="bubble ${m[0]==='in'?'in':'out'}">${m[1]}</div>`).join('')}</div><div class="composer"><input id="msg" class="input" placeholder="اكتب رسالة..." onkeydown="if(event.key==='Enter')sendMsg()"><button class="btn" onclick="sendMsg()">Send</button></div></div></div>`}
function tablePage(name,data,heads){return `<div class="card"><div class="sectionTitle"><h2>${name}</h2><button class="btn" onclick="toast('Ready for API integration')">+ Add</button></div><div class="toolbar"><input class="input" placeholder="Search..." oninput="filterTable(this.value)"></div><div style="overflow:auto"><table class="table"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody id="tbody">${data.map(r=>`<tr>${r.map((v,i)=>`<td>${i===3?`<span class="pill">${v}</span>`:v}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`}
function leadsPage(){return `<div class="card"><div class="sectionTitle"><h2>Lead Management</h2><button class="btn" onclick="toast('Lead created')">+ New Lead</button></div><div style="overflow:auto"><table class="table"><thead><tr><th>Name</th><th>Phone</th><th>Interest</th><th>Status</th><th>Is Lead</th><th>Last Contact</th></tr></thead><tbody>${dataLeads().map((r,i)=>`<tr>${r.map((v,j)=>`<td>${j===3?`<select class="select" onchange="toast('Status updated')"><option>${v}</option><option>New</option><option>Contacted</option><option>Qualified</option><option>Won</option></select>`:v}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`}
function analytics(){return `<div class="cards">${card('Messages / Day','342','Last 24 hours')}${card('AI Replies','318','93% automated')}${card('New Customers','24','This week')}${card('New Leads','86','This month')}</div><div class="card" style="margin-top:18px"><div class="sectionTitle"><h2>Messages & AI Replies</h2><select class="select"><option>Last 7 days</option><option>Last 30 days</option></select></div><div class="bars">${[55,70,45,82,66,92,78].map(h=>`<div class="bar" style="height:${h}%" title="${h*4} messages"></div>`).join('')}</div></div>`}
function business(){return `<div class="cards">${card('Business Name','Power Gym','From Google Sheets')}${card('Monthly Membership','500 EGP','Active service')}${card('Personal','1,500 EGP','Active service')}${card('One Day','50 EGP','Active service')}</div><div class="grid2"><div class="card"><div class="sectionTitle"><h2>Services & Prices</h2><button class="btn secondary" onclick="toast('Connected to data source')">Sync</button></div><div class="list"><div class="row"><strong>Monthly Membership</strong><span>500 EGP</span></div><div class="row"><strong>Personal Membership</strong><span>1,500 EGP</span></div><div class="row"><strong>One Day</strong><span>50 EGP</span></div></div></div><div class="card"><h2 style="font-size:16px">AI Data Policy</h2><p class="muted" style="line-height:1.8">The AI must use only verified business data supplied by the connected data source and must never invent prices, services, hours, policies or offers.</p></div></div>`}
function settings(){return `<div class="settingsGrid"><div class="card"><h2 style="font-size:16px">Connections</h2>${[['Make',integrationStatus()],['Telegram Bot',integrationStatus()],['AI / Gemini','Managed by Make'],['Incoming Webhook',MAGICODE_CONFIG.API_URL?'Connected':'Not configured']].map(x=>`<div class="setting"><span>${x[0]}</span><span class="status">● ${x[1]}</span></div>`).join('')}<div style="margin-top:18px;display:flex;gap:8px"><button class="btn" onclick="toast('Make connection test successful')">Test Make</button><button class="btn secondary" onclick="toast('Telegram connection test successful')">Test Telegram</button></div></div><div class="card"><h2 style="font-size:16px">System</h2><div class="setting"><span>Mock Data Mode</span><span class="pill">${MAGICODE_CONFIG.USE_MOCK_DATA?'ON':'OFF'}</span></div><div class="setting"><span>Webhook API</span><span class="pill">Ready</span></div><div class="setting"><span>Database</span><span class="pill">Not connected</span></div><p class="muted">Production secrets belong on the server, never in browser JavaScript.</p></div></div>`}
function go(p){state.page=p;state.side=false;app()}function toggleSide(){state.side=!state.side;app()}function selectChat(i){state.selected=i;app()}function sendMsg(){const el=document.getElementById('msg');if(!el||!el.value.trim())return toast('Please enter a message');conversations[state.selected].msgs.push(['out',el.value.trim()]);conversations[state.selected].last=el.value.trim();toast('Message sent successfully (Mock Mode)');app()}function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}function filterTable(q){const rows=[...document.querySelectorAll('#tbody tr')];rows.forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q.toLowerCase())?'':'none')}
app();
