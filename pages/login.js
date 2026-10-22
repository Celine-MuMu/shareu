// =========================================================
// 學校信箱認證（R5，模擬）＋快速切換身分（R9）
// 展示用：不用密碼，只要是學校信箱（結尾是 .edu.tw）就算通過認證
//
// 網址可以帶 next，登入後跳回原本要去的地方，例如：
//   #/login?next=rent/i1  → 登入後去租 i1
// =========================================================

const LoginPage = {
  next: '',

  render: function (param, query) {
    this.next = query.next || '';
    const me = store.currentUser();

    // 已經登入：顯示目前是誰＋登出
    const current = me
      ? '<div class="card owner">' +
          '<div class="avatar">' + esc(me.name.charAt(0)) + '</div>' +
          '<div class="grow">' +
            '<div class="owner-name">' + esc(me.name) +
              (me.verified ? '<span class="verified">' + icon('verified') + t('verified') + '</span>' : '') +
            '</div>' +
            '<div class="muted small">' + esc(me.email) + '</div>' +
          '</div>' +
          '<button class="btn secondary small" id="logoutBtn">' + t('logout') + '</button>' +
        '</div>'
      : '';

    // 四位 persona：點一下就切換成他
    const personas = store.users().filter(function (u) { return u.persona; }).map(function (u) {
      return '<button type="button" class="persona' + (me && me.id === u.id ? ' on' : '') + '" data-user="' + u.id + '">' +
        '<div class="avatar">' + esc(u.name.charAt(0)) + '</div>' +
        '<div>' +
          '<div class="owner-name">' + esc(u.name) + ' <span class="tag">' + t('persona_role_' + u.id) + '</span></div>' +
          '<div class="muted small">' + t('persona_story_' + u.id) + '</div>' +
        '</div>' +
      '</button>';
    }).join('');

    return '' +
      '<div class="narrow">' +
        (this.next ? '<p class="note">' + icon('info') + t('login_needed') + '</p>' : '') +
        '<h1>' + t(me ? 'account_title' : 'login_title') + '</h1>' +
        current +

        '<form class="card form" id="loginForm" novalidate>' +
          '<label class="field">' +
            '<span>' + t('school_email') + '</span>' +
            '<input type="email" name="email" placeholder="yourname@nccu.edu.tw" autocomplete="email" required>' +
          '</label>' +
          '<p class="error" id="loginError" hidden></p>' +
          '<button class="btn wide" type="submit">' + icon('verified') + t('login_btn') + '</button>' +
          '<p class="muted small">' + t('login_demo_note') + '</p>' +
        '</form>' +

        '<h2>' + t('switch_persona') + '</h2>' +
        '<p class="muted small">' + t('switch_persona_desc') + '</p>' +
        '<div class="persona-list" id="personas">' + personas + '</div>' +
      '</div>';
  },

  // 登入成功後：有 next 就去 next，沒有就回首頁
  done: function () {
    location.hash = '#/' + this.next;
    updateUserButton();
  },

  bind: function () {
    const self = this;

    document.getElementById('loginForm').onsubmit = function (e) {
      e.preventDefault();
      const email = this.email.value.trim().toLowerCase();
      const error = document.getElementById('loginError');

      // 檢查是不是學校信箱：要有 @，而且結尾是 .edu.tw
      if (!/^[^@\s]+@[^@\s]+\.edu\.tw$/.test(email)) {
        error.textContent = t('login_error');
        error.hidden = false;
        return;
      }

      // 已經有這個人就直接登入，沒有就幫他建帳號
      let user = store.getUserByEmail(email);
      if (!user) {
        const name = email.split('@')[0];
        user = store.addUser({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          dept: { zh: '學生', en: 'Student' },
          email: email,
          verified: true,
          rating: 0,
          reviewCount: 0,
        });
      }
      store.login(user.id);
      self.done();
    };

    document.getElementById('personas').onclick = function (e) {
      const btn = e.target.closest('[data-user]');
      if (!btn) return;
      store.login(btn.dataset.user);
      self.done();
    };

    const logout = document.getElementById('logoutBtn');
    if (logout) {
      logout.onclick = function () {
        store.logout();
        updateUserButton();
        render();
      };
    }
  },
};
