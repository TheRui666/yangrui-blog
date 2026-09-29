const root = document.documentElement;
const SUPABASE_URL = 'https://anxnkqggdqkdvjjvcqjl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1TZGMO2DcgtfG6bAwg249A_rf8M-Dve';
const db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN_EMAIL = '2900631800@qq.com';
const themeToggle = document.querySelector('#themeToggle');
const menuToggle = document.querySelector('#menuToggle');
const nav = document.querySelector('.nav-links');
const authButton = document.querySelector('#authButton');
let isAdmin = false;
const updateAuthUI = async () => { if (!db) return; const {data:{user}} = await db.auth.getUser(); isAdmin = user?.email === ADMIN_EMAIL; document.querySelectorAll('.admin-only').forEach((el)=>el.classList.toggle('visible', isAdmin)); if (authButton) authButton.textContent = isAdmin ? '退出管理员' : '管理员登录'; renderGoals(); renderNow(); };
authButton?.addEventListener('click', async () => { const {data:{user}} = await db.auth.getUser(); if (user) { await db.auth.signOut(); updateAuthUI(); return; } const email = window.prompt('管理员邮箱', ADMIN_EMAIL); const password = window.prompt('管理员密码'); if (email && password) { const {error} = await db.auth.signInWithPassword({email,password}); if (error) window.alert('登录失败：' + error.message); updateAuthUI(); } });

const readStore = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const documentInput = document.querySelector('#documentInput');
documentInput?.addEventListener('change', () => {
  const files = Array.from(documentInput.files || []);
  document.querySelector('#uploadList').textContent = files.length ? files.map((file) => `✓ ${file.name}`).join('　') : '还没有上传文档';
});

const renderMessages = () => {
  const list = document.querySelector('#messageList'); if (!list) return;
  list.innerHTML = readStore('yangrui-messages').map((item) => `<div class="message-item">${item.text.replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}<span class="message-time">${item.time}</span></div>`).join('') || '<p class="upload-list">还没有留言，欢迎成为第一个留言的人。</p>';
};
document.querySelector('#messageInput')?.addEventListener('input', (event) => { document.querySelector('#messageCount').textContent = `${event.target.value.length} / 280`; });
document.querySelector('#guestbookForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const input = document.querySelector('#messageInput'); const content = input.value.trim(); if (!content) return; const submitButton = event.currentTarget.querySelector('button[type=submit]'); if (submitButton) submitButton.disabled = true; try { if (db) { const { error } = await db.from('messages').insert({content}); if (error) throw error; await loadSharedData(); } else { const messages = readStore('yangrui-messages'); messages.unshift({text: content, time: new Date().toLocaleString('zh-CN',{dateStyle:'medium',timeStyle:'short'})}); writeStore('yangrui-messages', messages.slice(0,30)); renderMessages(); } input.value=''; document.querySelector('#messageCount').textContent='0 / 280'; } catch (error) { window.alert('留言发送失败，请稍后重试：' + (error.message || '网络错误')); } finally { if (submitButton) submitButton.disabled = false; } });
renderMessages();

const loadSharedData = async () => {
  if (!db) return;
  const [{data: messages}, {data: goals}, {data: nowItems}] = await Promise.all([
    db.from('messages').select('*').order('created_at', {ascending:false}),
    db.from('goals').select('*').order('created_at', {ascending:true}),
    db.from('now_items').select('*').order('created_at', {ascending:true})
  ]);
  if (messages && document.querySelector('#messageList')) { document.querySelector('#messageList').innerHTML = messages.map((item) => `<div class="message-item">${item.content.replace(/[&<>]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}<span class="message-time">${new Date(item.created_at).toLocaleString('zh-CN',{dateStyle:'medium',timeStyle:'short'})}</span></div>`).join('') || '<p class="upload-list">还没有留言，欢迎成为第一个留言的人。</p>'; }
  if (goals && document.querySelector('#goalList')) { window.sharedGoals = goals; renderGoals(); }
  if (nowItems && document.querySelector('#nowList')) { window.sharedNow = nowItems; renderNow(); }
};
loadSharedData();

const renderGoals = () => { const list = document.querySelector('#goalList'); if (!list) return; const items = window.sharedGoals || readStore('yangrui-goals'); list.innerHTML = items.map((item,index) => `<div class="goal-item"><span>${item.title || item.text}</span><span class="goal-tag">${(item.goal_type || item.type)==='short'?'短期目标':'长期目标'} ${isAdmin?`<button type="button" data-edit-goal="${item.id||index}" aria-label="编辑目标">编辑</button><button type="button" data-goal="${item.id||index}" aria-label="删除目标">×</button>`:''}</span></div>`).join('') || '<p class="upload-list">还没有目标，写下第一个吧。</p>'; list.querySelectorAll('[data-edit-goal]').forEach((b)=>b.addEventListener('click',async()=>{const item=itemById(items,b.dataset.editGoal); if(!item)return; const title=window.prompt('修改目标内容',item.title||item.text||''); if(!title?.trim())return; if(db&&item.id) await db.from('goals').update({title:title.trim()}).eq('id',item.id); else {item.title=title.trim(); item.text=title.trim(); writeStore('yangrui-goals',items);} await loadSharedData();})); list.querySelectorAll('[data-goal]').forEach((b)=>b.addEventListener('click',async()=>{if(db&&itemById(items,b.dataset.goal)) await db.from('goals').delete().eq('id',b.dataset.goal); else {items.splice(Number(b.dataset.goal),1);writeStore('yangrui-goals',items);} await loadSharedData();})); };
const itemById = (items,id) => items.find((x)=>String(x.id)===String(id));
document.querySelector('#goalForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const input = document.querySelector('#goalInput'); const type = document.querySelector('#goalType').value; if (db) await db.from('goals').insert({title:input.value,goal_type:type}); else { const goals = readStore('yangrui-goals'); goals.push({text:input.value,type}); writeStore('yangrui-goals',goals); } input.value=''; await loadSharedData(); });
renderGoals();

const renderNow = () => { const list = document.querySelector('#nowList'); if (!list) return; const items = window.sharedNow || readStore('yangrui-now'); list.innerHTML = items.map((item,index) => `<div class="now-item"><span class="now-index">${String(index+1).padStart(2,'0')}</span><span>${item.content || item}</span>${isAdmin?`<button type="button" data-edit-now="${item.id||index}" aria-label="编辑正在做的事">编辑</button><button type="button" data-now="${item.id||index}" aria-label="删除正在做的事">×</button>`:''}</div>`).join('') || '<p class="upload-list">还没有添加正在做的事。</p>'; list.querySelectorAll('[data-edit-now]').forEach((b)=>b.addEventListener('click',async()=>{const item=itemById(items,b.dataset.editNow); if(!item)return; const content=window.prompt('修改正在做的事',item.content||item||''); if(!content?.trim())return; if(db&&item.id) await db.from('now_items').update({content:content.trim()}).eq('id',item.id); else {items[Number(b.dataset.editNow)]=content.trim(); writeStore('yangrui-now',items);} await loadSharedData();})); list.querySelectorAll('[data-now]').forEach((b)=>b.addEventListener('click',async()=>{if(db&&itemById(items,b.dataset.now)) await db.from('now_items').delete().eq('id',b.dataset.now); else {items.splice(Number(b.dataset.now),1);writeStore('yangrui-now',items);} await loadSharedData();})); };
document.querySelector('#nowForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const input = document.querySelector('#nowInput'); if (db) await db.from('now_items').insert({content:input.value}); else { const items = readStore('yangrui-now'); items.push(input.value); writeStore('yangrui-now',items.slice(-8)); } input.value=''; await loadSharedData(); });
renderNow();
updateAuthUI();

themeToggle?.addEventListener('click', () => {
  root.classList.toggle('dark');
  const isDark = root.classList.contains('dark');
  themeToggle.textContent = isDark ? '☾' : '☼';
  themeToggle.setAttribute('aria-label', isDark ? '切换浅色模式' : '切换深色模式');
});

menuToggle?.addEventListener('click', () => {
  nav?.classList.toggle('mobile-open');
});

document.querySelectorAll('.filter-chip').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    document.querySelectorAll('.article-card').forEach((card) => {
      card.style.display = filter === 'all' || card.dataset.category === filter ? 'grid' : 'none';
    });
  });
});

document.querySelector('#subscribeForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formMessage = document.querySelector('#formMessage');
  const email = document.querySelector('#email');
  if (!email.value.trim()) return;
  formMessage.textContent = '已收到，下一封信见。';
  email.value = '';
});

document.querySelector('.load-more')?.addEventListener('click', (event) => {
  event.currentTarget.textContent = '已经到底啦 · 新文章很快见';
});

