/**
 * auth.js — SkillSwap Authentication Logic
 * Handles register form, login form, validation.
 */

document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();

  /* ──────────────────────────────
       REGISTER PAGE
  ────────────────────────────── */
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    redirectIfLoggedIn();

    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors();

      const name     = val('reg-name');
      const email    = val('reg-email');
      const password = val('reg-password');
      const confirm  = val('reg-confirm');
      const location = val('reg-location');

      let valid = true;

      if (name.length < 2)          { setError('reg-name',     'Name must be at least 2 characters.');  valid = false; }
      if (!isEmail(email))           { setError('reg-email',    'Enter a valid email address.');          valid = false; }
      if (password.length < 6)       { setError('reg-password', 'Password must be at least 6 chars.');   valid = false; }
      if (password !== confirm)      { setError('reg-confirm',  'Passwords do not match.');              valid = false; }

      if (!valid) return;

      const { user, error } = Storage.createUser({ name, email, password, location });
      if (error) { Toast.show(error, 'error'); return; }

      Storage.setSession(user.id);
      Toast.show('Account created! Welcome to SkillSwap 🎉', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
    });
  }

  /* ──────────────────────────────
       LOGIN PAGE
  ────────────────────────────── */
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    redirectIfLoggedIn();

    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors();

      const email    = val('login-email');
      const password = val('login-password');

      let valid = true;
      if (!isEmail(email))    { setError('login-email',    'Enter a valid email.'); valid = false; }
      if (!password)           { setError('login-password', 'Password is required.'); valid = false; }
      if (!valid) return;

      const user = Storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        Toast.show('Invalid email or password.', 'error');
        return;
      }

      Storage.setSession(user.id);
      Toast.show(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
    });

    /* Demo login button */
    const demoBtn = document.getElementById('demo-login');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        document.getElementById('login-email').value    = 'aisha@demo.com';
        document.getElementById('login-password').value = 'demo123';
        demoBtn.textContent = 'Credentials filled — click Sign In!';
      });
    }
  }

  /* ──────────────────────────────
       HELPERS
  ────────────────────────────── */
  function val(id) {
    return (document.getElementById(id)?.value || '').trim();
  }

  function isEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  function setError(id, msg) {
    const field = document.getElementById(id);
    if (!field) return;
    field.classList.add('input--error');
    const err = document.createElement('span');
    err.className  = 'form__error';
    err.textContent = msg;
    field.closest('.form__group')?.appendChild(err);
  }

  function clearErrors() {
    document.querySelectorAll('.input--error').forEach(el => el.classList.remove('input--error'));
    document.querySelectorAll('.form__error').forEach(el => el.remove());
  }
});
