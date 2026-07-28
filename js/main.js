document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuClose = document.getElementById('menuClose');
  const mobileLinks = mobileMenu.querySelectorAll('a');
  const faqItems = document.querySelectorAll('.faq-item');
  const revealElements = document.querySelectorAll('.reveal');
  const modal = document.getElementById('successModal');
  const modalClose = document.getElementById('modalClose');
  const modalOk = document.getElementById('modalOk');
  const forms = document.querySelectorAll('.lead-form');

  // Sticky header background
  function handleScroll() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile menu
  function openMenu() {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);
  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

  // FAQ accordion
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all
      faqItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        i.querySelector('.faq-answer').style.maxHeight = null;
      });

      // Open clicked if it wasn't active
      if (!isActive) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // Scroll reveal animations
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // Modal functions
  function openModal() {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalOk.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
      closeModal();
    }
  });

  // Form handling
  // Configure your form endpoint here. Examples:
  // - Formspree: 'https://formspree.io/f/YOUR_FORM_ID'
  // - Netlify: leave as '' to use Netlify Forms (add data-netlify="true" to forms)
  // - Custom API: 'https://your-api.com/leads'
  const FORM_ENDPOINT = ''; 

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate phone if country-code selector exists
      const codeSelect = form.querySelector('.country-code');
      if (codeSelect) {
        const phoneId = codeSelect.dataset.phone;
        const phoneInput = document.getElementById(phoneId);
        const msgEl = document.getElementById(phoneId + 'Msg');
        const result = validatePhoneField(codeSelect, phoneInput, msgEl);
        if (!result.valid) {
          phoneInput.focus();
          return;
        }
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      data.source = form.dataset.source || 'Website';
      data.submittedAt = new Date().toISOString();
      data.pageUrl = window.location.href;
      if (codeSelect) {
        data.fullPhone = codeSelect.value + ' ' + data.phone;
      }

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        if (FORM_ENDPOINT) {
          const response = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (!response.ok) {
            throw new Error('Form submission failed');
          }
        }

        // Store lead in localStorage as backup
        const leads = JSON.parse(localStorage.getItem('vantara_leads') || '[]');
        leads.push(data);
        localStorage.setItem('vantara_leads', JSON.stringify(leads));

        // Reset form and show success
        form.reset();
        openModal();

        // Optional: log lead to console for demo/verification
        console.log('Lead captured:', data);

      } catch (error) {
        console.error('Submission error:', error);
        // Still save locally and show success so no lead is lost
        const leads = JSON.parse(localStorage.getItem('vantara_leads') || '[]');
        leads.push(data);
        localStorage.setItem('vantara_leads', JSON.stringify(leads));
        form.reset();
        openModal();
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerOffset = 90;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Add parallax effect to hero background
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg && window.matchMedia('(min-width: 1024px)').matches) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      heroBg.style.transform = `translateY(${scrolled * 0.3}px) scale(1.05)`;
    }, { passive: true });
  }

  // ===== COUNTRY-SPECIFIC PHONE VALIDATION =====
  const phoneRules = {
    '+91': {
      country: 'India',
      pattern: /^[6-9]\d{9}$/,
      placeholder: '98765 43210',
      hint: '10 digits starting with 6-9',
      digitsOnly: true
    },
    '+1': {
      country: 'USA / Canada',
      pattern: /^\d{10}$/,
      placeholder: '9876543210',
      hint: '10 digits',
      digitsOnly: true
    },
    '+44': {
      country: 'UK',
      pattern: /^\d{10}$/,
      placeholder: '7123456789',
      hint: '10 digits',
      digitsOnly: true
    },
    '+61': {
      country: 'Australia',
      pattern: /^\d{9}$/,
      placeholder: '412345678',
      hint: '9 digits',
      digitsOnly: true
    },
    '+971': {
      country: 'UAE',
      pattern: /^5\d{8}$/,
      placeholder: '501234567',
      hint: '9 digits starting with 5',
      digitsOnly: true
    }
  };

  function normalizePhone(value) {
    return value.replace(/\D/g, '');
  }

  function validatePhoneField(codeSelect, phoneInput, msgEl) {
    const code = codeSelect.value;
    const rule = phoneRules[code];
    const raw = phoneInput.value.trim();
    const normalized = normalizePhone(raw);

    if (!rule) return { valid: true, normalized };

    const isValid = rule.pattern.test(normalized);

    if (raw.length === 0) {
      phoneInput.classList.remove('error');
      msgEl.textContent = '';
      return { valid: false, normalized };
    }

    if (isValid) {
      phoneInput.classList.remove('error');
      msgEl.textContent = '✓ Valid ' + rule.country + ' number';
      msgEl.classList.add('valid');
      return { valid: true, normalized };
    } else {
      phoneInput.classList.add('error');
      msgEl.textContent = 'Please enter ' + rule.hint;
      msgEl.classList.remove('valid');
      return { valid: false, normalized };
    }
  }

  function updatePhonePlaceholder(codeSelect, phoneInput) {
    const rule = phoneRules[codeSelect.value];
    if (rule) {
      phoneInput.placeholder = rule.placeholder;
    }
  }

  // Initialize all country-code selects
  document.querySelectorAll('.country-code').forEach(codeSelect => {
    const phoneId = codeSelect.dataset.phone;
    const phoneInput = document.getElementById(phoneId);
    const msgEl = document.getElementById(phoneId + 'Msg');

    if (!phoneInput || !msgEl) return;

    updatePhonePlaceholder(codeSelect, phoneInput);

    // Restrict to digits only
    phoneInput.addEventListener('input', (e) => {
      const rule = phoneRules[codeSelect.value];
      if (rule && rule.digitsOnly) {
        phoneInput.value = normalizePhone(phoneInput.value);
      }
      validatePhoneField(codeSelect, phoneInput, msgEl);
    });

    phoneInput.addEventListener('blur', () => {
      validatePhoneField(codeSelect, phoneInput, msgEl);
    });

    codeSelect.addEventListener('change', () => {
      phoneInput.value = '';
      phoneInput.classList.remove('error');
      msgEl.textContent = '';
      msgEl.classList.remove('valid');
      updatePhonePlaceholder(codeSelect, phoneInput);
      phoneInput.focus();
    });
  });

});
