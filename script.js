const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const menuToggle = document.querySelector('#menuToggle');
const nav = document.querySelector('.nav-links');

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
