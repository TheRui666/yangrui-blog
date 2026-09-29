const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const menuToggle = document.querySelector('#menuToggle');
const nav = document.querySelector('.nav-links');

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
document.querySelector('#guestbookForm')?.addEventListener('submit', (event) => { event.preventDefault(); const input = document.querySelector('#messageInput'); const messages = readStore('yangrui-messages'); messages.unshift({text: input.value, time: new Date().toLocaleString('zh-CN',{dateStyle:'medium',timeStyle:'short'})}); writeStore('yangrui-messages', messages.slice(0,30)); input.value=''; document.querySelector('#messageCount').textContent='0 / 280'; renderMessages(); });
renderMessages();

const renderGoals = () => { const list = document.querySelector('#goalList'); if (!list) return; list.innerHTML = readStore('yangrui-goals').map((item, index) => `<div class="goal-item"><span>${item.text}</span><span class="goal-tag">${item.type === 'short' ? '短期目标' : '长期目标'}　<button type="button" data-goal="${index}" aria-label="删除目标">×</button></span></div>`).join('') || '<p class="upload-list">还没有目标，写下第一个吧。</p>'; list.querySelectorAll('[data-goal]').forEach((button) => button.addEventListener('click', () => { const goals = readStore('yangrui-goals'); goals.splice(Number(button.dataset.goal),1); writeStore('yangrui-goals', goals); renderGoals(); })); };
document.querySelector('#goalForm')?.addEventListener('submit', (event) => { event.preventDefault(); const input = document.querySelector('#goalInput'); const goals = readStore('yangrui-goals'); goals.push({text: input.value, type: document.querySelector('#goalType').value}); writeStore('yangrui-goals', goals); input.value=''; renderGoals(); });
renderGoals();

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
