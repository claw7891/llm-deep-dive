// === LLM Deep Dive: Navigation & Scroll Effects ===

(function() {
  const TOTAL = 8;
  const KEY = 'llm-dd-completed';

  // Drawer
  const menuBtn = document.querySelector('.menu-btn');
  const drawer = document.querySelector('.lesson-drawer');
  const overlay = document.querySelector('.drawer-overlay');
  const closeBtn = document.querySelector('.drawer-close');

  function openDrawer() {
    drawer?.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  menuBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  drawer?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => setTimeout(closeDrawer, 150))
  );
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  // Lesson completion
  const currentLesson = parseInt(document.body.dataset.lesson || '0');

  function getCompleted() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }
  function setCompleted(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }
  function toggleCurrent() {
    const c = getCompleted();
    const idx = c.indexOf(currentLesson);
    if (idx === -1) c.push(currentLesson); else c.splice(idx, 1);
    setCompleted(c);
    updateUI();
  }

  function updateUI() {
    const c = getCompleted();
    const box = document.querySelector('.completion-box');
    if (box) {
      if (c.includes(currentLesson)) {
        box.classList.add('checked');
        box.querySelector('.check-text').textContent = 'Lesson completed ✓';
      } else {
        box.classList.remove('checked');
        box.querySelector('.check-text').textContent = 'Mark as complete';
      }
    }
    document.querySelectorAll('.lesson-check').forEach(el => {
      const n = parseInt(el.dataset.lesson);
      if (c.includes(n)) el.classList.add('done'); else el.classList.remove('done');
    });
    const bar = document.querySelector('.progress-bar-fill');
    if (bar) bar.style.width = `${(c.length / TOTAL) * 100}%`;
  }

  document.querySelector('.completion-box')?.addEventListener('click', toggleCurrent);
  updateUI();

  // Scroll reveal
  function handleReveals() {
    const reveals = document.querySelectorAll('.reveal');
    const wh = window.innerHeight;
    reveals.forEach(el => {
      if (el.getBoundingClientRect().top < wh - 80) el.classList.add('visible');
    });
  }
  window.addEventListener('load', handleReveals);
  window.addEventListener('scroll', handleReveals);

  // Active section highlight
  function updateActive() {
    const sections = document.querySelectorAll('[id]');
    const links = document.querySelectorAll('.lesson-list a');
    let currentId = '';
    sections.forEach(s => { if (s.getBoundingClientRect().top <= 120) currentId = s.id; });
    links.forEach(l => {
      if (l.getAttribute('href') === '#' + currentId) l.classList.add('active');
      else l.classList.remove('active');
    });
  }
  window.addEventListener('scroll', updateActive);
  window.addEventListener('load', updateActive);
})();