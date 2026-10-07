/**
 * ABDUSEE TIPS — script.js
 * Premium Tech Education Platform
 * Author: Abdusalam Ahmed Kasim
 * Version: 2.0.0
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & STATE
═══════════════════════════════════════════════════════════════ */
const SITE_DATA = {
  articles: [
    { title: "How to Build Your Own AI Chatbot with ChatGPT API", tags: ["ai", "python", "chatgpt"], section: "#blog" },
    { title: "React 19 Features Every Developer Needs to Know", tags: ["react", "web", "javascript"], section: "#blog" },
    { title: "5 Ways to Earn $1,000/Month as a Developer", tags: ["income", "freelancing", "money"], section: "#income" },
    { title: "Flutter vs React Native in 2025", tags: ["mobile", "flutter", "react native"], section: "#blog" },
    { title: "Python Automation Scripts That Save 10 Hours a Week", tags: ["python", "automation", "programming"], section: "#blog" },
    { title: "Land Your First Upwork Client with Zero Reviews", tags: ["freelancing", "upwork", "income"], section: "#income" },
    { title: "n8n Automation: Build a Business Without Code", tags: ["ai", "automation", "n8n"], section: "#ai-tools" },
    { title: "ChatGPT Full Tutorial: From Basics to API", tags: ["ai", "chatgpt", "tutorial"], section: "#ai-tools" },
    { title: "Cursor AI: Code 5x Faster with AI Editor", tags: ["ai", "cursor", "coding"], section: "#ai-tools" },
    { title: "Web Development Roadmap 2025", tags: ["web", "html", "css", "javascript"], section: "#tutorials" },
    { title: "Full Stack Development with Node.js and React", tags: ["web", "node", "react"], section: "#tutorials" },
    { title: "Make Money with Midjourney: Freelance Design Guide", tags: ["ai", "midjourney", "income"], section: "#income" },
  ]
};

let deferredInstallPrompt = null;
let statsAnimated = false;

/* ═══════════════════════════════════════════════════════════════
   DOM READY
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initMobileMenu();
  initSearch();
  initScrollProgress();
  initBackToTop();
  initAnimations();
  initStatsCounter();
  initNewsletterForm();
  initContactForm();
  initCookieBanner();
  initFooterYear();
  initPWA();
  initLazyLoading();
});

/* ═══════════════════════════════════════════════════════════════
   1. THEME TOGGLE (Dark / Light) with LocalStorage
═══════════════════════════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('at-theme') || 'dark';
  applyTheme(saved);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('at-theme', next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  const moonIcon = btn.querySelector('.icon-moon');
  const sunIcon = btn.querySelector('.icon-sun');

  if (theme === 'light') {
    moonIcon.style.display = 'none';
    sunIcon.style.display = 'block';
    btn.setAttribute('aria-label', 'Switch to dark mode');
    btn.setAttribute('aria-pressed', 'true');
  } else {
    moonIcon.style.display = 'block';
    sunIcon.style.display = 'none';
    btn.setAttribute('aria-label', 'Switch to light mode');
    btn.setAttribute('aria-pressed', 'false');
  }
}

/* ═══════════════════════════════════════════════════════════════
   2. STICKY NAVBAR — shadow on scroll
═══════════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    // Navbar shadow
    if (window.scrollY > 20) {
      navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.15)';
    } else {
      navbar.style.boxShadow = 'none';
    }

    // Active nav link highlight
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) {
        current = section.getAttribute('id');
      }
    });
    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════════
   3. MOBILE HAMBURGER MENU
═══════════════════════════════════════════════════════════════ */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
      closeMobileMenu();
    }
  });
}

function closeMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  menu.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
}

// Make global for inline onclick
window.closeMobileMenu = closeMobileMenu;

/* ═══════════════════════════════════════════════════════════════
   4. SEARCH — real-time filtering
═══════════════════════════════════════════════════════════════ */
function initSearch() {
  const toggleBtn = document.getElementById('searchToggle');
  const overlay = document.getElementById('searchOverlay');
  const closeBtn = document.getElementById('searchClose');
  const input = document.getElementById('searchInput');
  const resultsEl = document.getElementById('searchResults');

  // Post cards for in-page filtering
  const postCards = document.querySelectorAll('.post-card');
  const noResults = document.getElementById('noResults');

  toggleBtn.addEventListener('click', () => {
    const isOpen = overlay.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    overlay.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) {
      setTimeout(() => input.focus(), 50);
    }
  });

  closeBtn.addEventListener('click', closeSearch);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeSearch();
    }
  });

  // Live search
  input.addEventListener('input', debounce(() => {
    const query = input.value.trim().toLowerCase();

    // 1. Filter post cards in the blog section
    if (query.length > 1) {
      let visibleCount = 0;
      postCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const tags = (card.dataset.tags || '').toLowerCase();
        const matches = text.includes(query) || tags.includes(query);
        card.classList.toggle('hidden', !matches);
        if (matches) visibleCount++;
      });
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    } else {
      postCards.forEach(c => c.classList.remove('hidden'));
      noResults.style.display = 'none';
    }

    // 2. Show inline search suggestions
    if (query.length >= 2) {
      const matches = SITE_DATA.articles.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.tags.some(t => t.includes(query))
      ).slice(0, 5);

      if (matches.length > 0) {
        resultsEl.innerHTML = matches.map(m => `
          <div class="search-result-item" role="listitem" onclick="navigateTo('${m.section}')">
            <span class="sri-tag">${m.tags[0]}</span>
            <span class="sri-title">${highlightMatch(m.title, query)}</span>
          </div>
        `).join('');
      } else {
        resultsEl.innerHTML = `<div class="search-result-item"><span class="sri-title" style="color:var(--text-2)">No results for "${query}"</span></div>`;
      }
    } else {
      resultsEl.innerHTML = '';
    }
  }, 150));
}

function closeSearch() {
  const overlay = document.getElementById('searchOverlay');
  const toggleBtn = document.getElementById('searchToggle');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  toggleBtn.setAttribute('aria-expanded', 'false');
}

function navigateTo(section) {
  closeSearch();
  const el = document.querySelector(section);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
window.navigateTo = navigateTo;

function highlightMatch(text, query) {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark style="background:rgba(14,165,233,0.2);color:var(--accent);border-radius:2px">$1</mark>');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ═══════════════════════════════════════════════════════════════
   5. SCROLL PROGRESS BAR
═══════════════════════════════════════════════════════════════ */
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');

  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    bar.style.width = `${pct.toFixed(1)}%`;
  }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════════
   6. BACK TO TOP BUTTON
═══════════════════════════════════════════════════════════════ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ═══════════════════════════════════════════════════════════════
   7. SCROLL ANIMATIONS (IntersectionObserver)
═══════════════════════════════════════════════════════════════ */
function initAnimations() {
  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-animate]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('animate-in'), delay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
}

/* ═══════════════════════════════════════════════════════════════
   8. STATS COUNTER ANIMATION
═══════════════════════════════════════════════════════════════ */
function initStatsCounter() {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !statsAnimated) {
        statsAnimated = true;
        counters.forEach(counter => animateCounter(counter));
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.querySelector('.stats-section');
  if (statsSection) observer.observe(statsSection);
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 2000;
  const step = 16;
  const increment = target / (duration / step);
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current) + suffix;
  }, step);
}

/* ═══════════════════════════════════════════════════════════════
   9. NEWSLETTER FORM
═══════════════════════════════════════════════════════════════ */
function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('nlEmail').value.trim();
    const btn = document.getElementById('nlBtn');
    const msg = document.getElementById('nlMsg');

    if (!isValidEmail(email)) {
      showFormMsg(msg, '⚠️ Please enter a valid email address.', 'error');
      return;
    }

    // Check for duplicate (localStorage)
    const subscribers = JSON.parse(localStorage.getItem('at-subscribers') || '[]');
    if (subscribers.includes(email)) {
      showFormMsg(msg, '✅ You\'re already subscribed! Check your inbox.', 'success');
      return;
    }

    // Simulate submission
    setLoading(btn, true);
    await simulateRequest(1200);
    setLoading(btn, false);

    subscribers.push(email);
    localStorage.setItem('at-subscribers', JSON.stringify(subscribers));

    showFormMsg(msg, '🎉 Welcome aboard! Your first tip arrives Tuesday.', 'success');
    form.reset();
  });
}

/* ═══════════════════════════════════════════════════════════════
   10. CONTACT FORM VALIDATION
═══════════════════════════════════════════════════════════════ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Real-time validation
  form.querySelectorAll('input, textarea, select').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => clearError(field));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('cfBtn');
    const msg = document.getElementById('cfMsg');

    const name = document.getElementById('cfName');
    const email = document.getElementById('cfEmail');
    const subject = document.getElementById('cfSubject');
    const message = document.getElementById('cfMessage');

    // Validate all
    const valid = [
      validateField(name),
      validateField(email),
      validateField(subject),
      validateField(message),
    ].every(Boolean);

    if (!valid) return;

    setLoading(btn, true);
    await simulateRequest(1500);
    setLoading(btn, false);

    showFormMsg(msg, '✅ Message sent! Abdusalam will reply within 24 hours.', 'success');
    form.reset();
  });
}

function validateField(field) {
  const errId = `${field.id}Err`;
  const errEl = document.getElementById(errId);
  let error = '';

  if (!field.value.trim()) {
    error = `${getFieldLabel(field)} is required.`;
  } else if (field.type === 'email' && !isValidEmail(field.value)) {
    error = 'Please enter a valid email address.';
  } else if (field.tagName === 'TEXTAREA' && field.value.trim().length < 20) {
    error = 'Message must be at least 20 characters.';
  }

  if (errEl) errEl.textContent = error;
  field.style.borderColor = error ? '#f87171' : '';
  return !error;
}

function clearError(field) {
  const errId = `${field.id}Err`;
  const errEl = document.getElementById(errId);
  if (errEl) errEl.textContent = '';
  field.style.borderColor = '';
}

function getFieldLabel(field) {
  const label = document.querySelector(`label[for="${field.id}"]`);
  return label ? label.textContent.replace('*', '').trim() : 'Field';
}

/* ═══════════════════════════════════════════════════════════════
   11. COOKIE BANNER (LocalStorage)
═══════════════════════════════════════════════════════════════ */
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const consent = localStorage.getItem('at-cookie-consent');

  if (!consent) {
    setTimeout(() => banner.classList.add('show'), 2000);
  }

  document.getElementById('cookieAccept').addEventListener('click', () => {
    localStorage.setItem('at-cookie-consent', 'accepted');
    banner.classList.remove('show');
  });

  document.getElementById('cookieDecline').addEventListener('click', () => {
    localStorage.setItem('at-cookie-consent', 'declined');
    banner.classList.remove('show');
  });
}

/* ═══════════════════════════════════════════════════════════════
   12. FOOTER YEAR
═══════════════════════════════════════════════════════════════ */
function initFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ═══════════════════════════════════════════════════════════════
   13. PWA — Service Worker & Install Prompt
═══════════════════════════════════════════════════════════════ */
function initPWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  }

  // Capture install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) installBtn.style.display = 'inline-flex';
  });

  // Install button handler
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.style.display = 'none';
        deferredInstallPrompt = null;
      }
    });
  }

  // Hide install btn if already installed
  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'none';
    deferredInstallPrompt = null;
  });
}

/* ═══════════════════════════════════════════════════════════════
   14. LAZY LOADING (IntersectionObserver)
═══════════════════════════════════════════════════════════════ */
function initLazyLoading() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"], [data-lazy]');
  if (!lazyImages.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.dataset.src) el.src = el.dataset.src;
        if (el.dataset.srcset) el.srcset = el.dataset.srcset;
        el.removeAttribute('data-lazy');
        io.unobserve(el);
      }
    });
  }, { rootMargin: '200px 0px' });

  lazyImages.forEach(img => io.observe(img));
}

/* ═══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
═══════════════════════════════════════════════════════════════ */

/** Email validation */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Debounce */
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/** Simulate async request */
function simulateRequest(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Toggle loading state on a button */
function setLoading(btn, loading) {
  const text = btn.querySelector('.btn-text');
  const loadingEl = btn.querySelector('.btn-loading');
  btn.disabled = loading;
  if (text) text.style.display = loading ? 'none' : '';
  if (loadingEl) loadingEl.style.display = loading ? 'inline' : 'none';
}

/** Show form message */
function showFormMsg(el, msg, type) {
  el.textContent = msg;
  el.className = `form-msg ${type}`;
  setTimeout(() => {
    el.textContent = '';
    el.className = 'form-msg';
  }, 5000);
}
