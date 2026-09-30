const root = document.documentElement;
const SUPABASE_URL = 'https://anxnkqggdqkdvjjvcqjl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1TZGMO2DcgtfG6bAwg249A_rf8M-Dve';
const ADMIN_EMAIL = '2900631800@qq.com';
const TOKEN_KEY = 'yangrui-owner-token';
const IDS_KEY = 'yangrui-owned-message-ids';
const ownerToken = localStorage.getItem(TOKEN_KEY) || (() => { const v = crypto.randomUUID(); localStorage.setItem(TOKEN_KEY, v); return v; })();
const ownedIds = () => JSON.parse(localStorage.getItem(IDS_KEY) || '[]').map(String);
const rememberId = (id) => localStorage.setItem(IDS_KEY, JSON.stringify([...new Set([String(id), ...ownedIds()])].slice(0, 100)));
const forgetId = (id) => localStorage.setItem(IDS_KEY, JSON.stringify(ownedIds().filter((v) => v !== String(id))));
const db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY, { global: { headers: { 'x-owner-token': ownerToken } } });
const themeToggle = document.querySelector('#themeToggle');
const menuToggle = document.querySelector('#menuToggle');
const nav = document.querySelector('.nav-links');
const authButton = document.querySelector('#authButton');
let isAdmin = false;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const fmt = (v) => new Date(v).toLocaleString('zh-CN', { dateStyle:'medium', timeStyle:'short' });
const local = (k) => JSON.parse(localStorage.getItem(k) || '[]');
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const fail = (label, e) => window.alert(`${label}：${e?.message || '网络错误，请稍后重试'}`);
const byId = (items, id) => items.find((x) => String(x.id) === String(id));

// 页面背景只保存在访客自己的浏览器中，不会写入 Supabase，也不会改变其他访客的选择。
const WALLPAPERS = [
  { name: '林俊杰 · JJ20 现场', note: '把热爱唱成光', url: 'https://res.klook.com/image/upload/v1731047956/q8m8bjnodxybvodisxr8.jpg' },
  { name: '林俊杰 · 新加坡演唱会', note: '在夜色里发亮', url: 'https://thescarletsingapore.com/uploads/blog/jj-lin-concert-singapore-2024.webp' },
  { name: '林俊杰 · 舞台光影', note: '让旋律有回声', url: 'https://res.klook.com/image/upload/v1731047956/q8m8bjnodxybvodisxr8.jpg' },
  { name: '林俊杰 · 现场肖像', note: '温柔地抵达', url: 'https://thescarletsingapore.com/uploads/blog/jj-lin-concert-singapore-2024.webp' },
  { name: '林俊杰 · 聚光灯下', note: '和自己相遇', url: 'https://res.klook.com/image/upload/v1731047956/q8m8bjnodxybvodisxr8.jpg' }
];
function setupWallpapers() {
  const wrap = document.querySelector('#wallpaperOptions'); if (!wrap) return;
  const key = 'yangrui-wallpaper'; const selected = localStorage.getItem(key) || '0';
  const apply = (index) => { const item = WALLPAPERS[index] || WALLPAPERS[0]; document.body.style.setProperty('--wallpaper', `url("${item.url}")`); localStorage.setItem(key, String(index)); wrap.querySelectorAll('.wallpaper-option').forEach((b, i) => b.classList.toggle('active', i === index)); };
  wrap.innerHTML = WALLPAPERS.map((item, i) => `<button class="wallpaper-option" type="button" data-wallpaper="${i}" style="background-image:url('${item.url}')" aria-label="选择${esc(item.name)}"><span>${esc(item.name)}<small>${esc(item.note)}</small></span></button>`).join('');
  wrap.querySelectorAll('[data-wallpaper]').forEach((button) => button.addEventListener('click', () => apply(Number(button.dataset.wallpaper))));
  apply(Math.min(Number(selected) || 0, WALLPAPERS.length - 1));
}

async function updateAuthUI() {
  if (!db) return;
  const { data:{ user } } = await db.auth.getUser();
  isAdmin = user?.email === ADMIN_EMAIL;
  document.querySelectorAll('.admin-only').forEach((el) => el.classList.toggle('visible', isAdmin));
  if (authButton) authButton.textContent = isAdmin ? '退出管理员' : '管理员登录';
  renderMessages(window.sharedMessages || []); renderGoals(); renderNow();
}
authButton?.addEventListener('click', async () => {
  const { data:{ user } } = await db.auth.getUser();
  if (user) { await db.auth.signOut(); await updateAuthUI(); await loadSharedData(); return; }
  const email = prompt('管理员邮箱', ADMIN_EMAIL); const password = prompt('管理员密码');
  if (!email || !password) return;
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) fail('登录失败', error); else { await updateAuthUI(); await loadSharedData(); }
});

document.querySelector('#documentInput')?.addEventListener('change', (e) => { const files = [...(e.target.files || [])]; document.querySelector('#uploadList').textContent = files.length ? files.map((f) => `✓ ${f.name}`).join('　') : '还没有上传文档'; });

function renderMessages(messages = window.sharedMessages || []) {
  const list = document.querySelector('#messageList'); if (!list) return;
  if (!db) messages = local('yangrui-messages');
  const mine = ownedIds();
  list.innerHTML = messages.map((m) => { const canDelete = isAdmin || mine.includes(String(m.id)); return `<div class="message-item"><div>${esc(m.content ?? m.text)}</div><div class="message-meta"><span class="message-time">${esc(m.created_at ? fmt(m.created_at) : m.time)}</span>${canDelete ? `<button type="button" class="message-delete" data-delete-message="${esc(m.id)}">删除</button>` : ''}</div></div>`; }).join('') || '<p class="upload-list">还没有留言，欢迎成为第一个留言的人。</p>';
  list.querySelectorAll('[data-delete-message]').forEach((b) => b.addEventListener('click', async () => {
    const id = b.dataset.deleteMessage; if (!confirm('确定删除这条留言吗？')) return;
    try { if (db) { const { error } = await db.from('messages').delete().eq('id', id); if (error) throw error; forgetId(id); await loadSharedData(); } else { save('yangrui-messages', local('yangrui-messages').filter((m) => String(m.id) !== String(id))); renderMessages(); } } catch (e) { fail('留言删除失败', e); }
  }));
}
document.querySelector('#messageInput')?.addEventListener('input', (e) => { document.querySelector('#messageCount').textContent = `${e.target.value.length} / 280`; });
document.querySelector('#guestbookForm')?.addEventListener('submit', async (e) => {
  e.preventDefault(); const input = document.querySelector('#messageInput'); const content = input.value.trim(); if (!content) return; const button = e.currentTarget.querySelector('button[type=submit]'); if (button) button.disabled = true;
  try { if (db) { const { data, error } = await db.from('messages').insert({ content, owner_token: ownerToken }).select('id').single(); if (error) throw error; if (data?.id) rememberId(data.id); await loadSharedData(); } else { const id = String(Date.now()); const items = local('yangrui-messages'); items.unshift({ id, text:content, time:fmt(Date.now()) }); rememberId(id); save('yangrui-messages', items.slice(0,30)); renderMessages(items); } input.value = ''; document.querySelector('#messageCount').textContent = '0 / 280'; } catch (e) { fail('留言发送失败，请稍后重试', e); } finally { if (button) button.disabled = false; }
});

function renderGoals() {
  const list = document.querySelector('#goalList'); if (!list) return; const items = window.sharedGoals || local('yangrui-goals');
  list.innerHTML = items.map((m, i) => `<div class="goal-item"><span>${esc(m.title || m.text)}</span><span class="goal-tag">${(m.goal_type || m.type) === 'short' ? '短期目标' : '长期目标'} ${isAdmin ? `<button type="button" data-edit-goal="${esc(m.id ?? i)}">编辑</button><button type="button" data-goal="${esc(m.id ?? i)}">×</button>` : ''}</span></div>`).join('') || '<p class="upload-list">还没有目标，写下第一个吧。</p>';
  list.querySelectorAll('[data-edit-goal]').forEach((b) => b.addEventListener('click', async () => { const m = byId(items, b.dataset.editGoal) || items[Number(b.dataset.editGoal)]; if (!m) return; const title = prompt('修改目标内容', m.title || m.text || ''); if (!title?.trim()) return; try { if (db && m.id) { const { error } = await db.from('goals').update({ title:title.trim() }).eq('id', m.id); if (error) throw error; } else { m.title = title.trim(); m.text = title.trim(); save('yangrui-goals', items); } await loadSharedData(); } catch (e) { fail('目标修改失败', e); } }));
  list.querySelectorAll('[data-goal]').forEach((b) => b.addEventListener('click', async () => { const m = byId(items, b.dataset.goal) || items[Number(b.dataset.goal)]; if (!m) return; try { if (db && m.id) { const { error } = await db.from('goals').delete().eq('id', m.id); if (error) throw error; } else { items.splice(Number(b.dataset.goal), 1); save('yangrui-goals', items); } await loadSharedData(); } catch (e) { fail('目标删除失败', e); } }));
}
document.querySelector('#goalForm')?.addEventListener('submit', async (e) => { e.preventDefault(); const input = document.querySelector('#goalInput'); const title = input.value.trim(); const goal_type = document.querySelector('#goalType').value; if (!title) return; try { if (db) { const { error } = await db.from('goals').insert({ title, goal_type }); if (error) throw error; } else { const items = local('yangrui-goals'); items.push({ text:title, type:goal_type }); save('yangrui-goals', items); } input.value = ''; await loadSharedData(); } catch (x) { fail('目标添加失败', x); } });

function renderNow() {
  const list = document.querySelector('#nowList'); if (!list) return; const items = window.sharedNow || local('yangrui-now');
  list.innerHTML = items.map((m, i) => `<div class="now-item"><span class="now-index">${String(i+1).padStart(2,'0')}</span><span>${esc(m.content || m)}</span>${isAdmin ? `<button type="button" data-edit-now="${esc(m.id ?? i)}">编辑</button><button type="button" data-now="${esc(m.id ?? i)}">×</button>` : ''}</div>`).join('') || '<p class="upload-list">还没有添加正在做的事。</p>';
  list.querySelectorAll('[data-edit-now]').forEach((b) => b.addEventListener('click', async () => { const m = byId(items, b.dataset.editNow) || items[Number(b.dataset.editNow)]; if (!m) return; const content = prompt('修改正在做的事', m.content || m || ''); if (!content?.trim()) return; try { if (db && m.id) { const { error } = await db.from('now_items').update({ content:content.trim() }).eq('id', m.id); if (error) throw error; } else { items[Number(b.dataset.editNow)] = content.trim(); save('yangrui-now', items); } await loadSharedData(); } catch (x) { fail('正在做的事修改失败', x); } }));
  list.querySelectorAll('[data-now]').forEach((b) => b.addEventListener('click', async () => { const m = byId(items, b.dataset.now) || items[Number(b.dataset.now)]; if (!m) return; try { if (db && m.id) { const { error } = await db.from('now_items').delete().eq('id', m.id); if (error) throw error; } else { items.splice(Number(b.dataset.now), 1); save('yangrui-now', items); } await loadSharedData(); } catch (x) { fail('正在做的事删除失败', x); } }));
}
document.querySelector('#nowForm')?.addEventListener('submit', async (e) => { e.preventDefault(); const input = document.querySelector('#nowInput'); const content = input.value.trim(); if (!content) return; try { if (db) { const { error } = await db.from('now_items').insert({ content }); if (error) throw error; } else { const items = local('yangrui-now'); items.push(content); save('yangrui-now', items.slice(-8)); } input.value = ''; await loadSharedData(); } catch (x) { fail('正在做的事添加失败', x); } });

async function loadSharedData() {
  if (!db) return;
  const [messages, goals, now] = await Promise.all([db.from('messages').select('id,content,created_at').order('created_at', { ascending:false }), db.from('goals').select('id,title,goal_type,created_at,updated_at').order('created_at', { ascending:true }), db.from('now_items').select('id,content,created_at').order('created_at', { ascending:true })]);
  if (messages.error) fail('留言读取失败', messages.error); else { window.sharedMessages = messages.data || []; renderMessages(window.sharedMessages); }
  if (goals.error) fail('目标读取失败', goals.error); else { window.sharedGoals = goals.data || []; renderGoals(); }
  if (now.error) fail('正在做的事读取失败', now.error); else { window.sharedNow = now.data || []; renderNow(); }
}
renderMessages(); renderGoals(); renderNow(); setupWallpapers(); updateAuthUI(); loadSharedData();
themeToggle?.addEventListener('click', () => { root.classList.toggle('dark'); const dark = root.classList.contains('dark'); themeToggle.textContent = dark ? '☾' : '☼'; themeToggle.setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式'); });
menuToggle?.addEventListener('click', () => nav?.classList.toggle('mobile-open'));
document.querySelector('#subscribeForm')?.addEventListener('submit', (e) => { e.preventDefault(); const email = document.querySelector('#email'); if (!email.value.trim()) return; document.querySelector('#formMessage').textContent = '已收到，下一封信见。'; email.value = ''; });

