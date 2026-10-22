// =========================================================
// 關於我們＋贊助（R12）
//   我們想解決什麼 → 怎麼讓大家安心 → 團隊 → 贊助我們（模擬，不會真的收錢）
//   不放商業模式（requirements 已決定）
// =========================================================

// 👉 團隊成員：名字、職位、介紹都可以改（T5.2）
//    name 留空的會顯示「待補」
const TEAM = [
  { name: 'Cecilia', role: 'CEO', bio: { zh: '政大', en: 'NCCU MIS' } },
  { name: 'Celine', role: 'CTO', bio: { zh: '政大資管系', en: 'NCCU MIS' } },
  { name: 'Cecilia', role: 'COO', bio: { zh: '政大財管系', en: 'NCCU Finance' } },
  { name: 'Rita', role: 'CFO', bio: { zh: '政大', en: 'NCCU MIS' } },
  { name: 'Jessica', role: 'CMO', bio: { zh: '政大', en: 'NCCU MIS' } },
];

// 贊助金額的選項（NT$）
const DONATE_AMOUNTS = [50, 100, 300, 500];

const AboutPage = {
  amount: 100,   // 目前選的金額

  render: function () {
    this.amount = 100;

    // 我們想解決的三個問題
    const problems = [
      ['concert', 'about_p1_title', 'about_p1_desc'],
      ['luggage', 'about_p2_title', 'about_p2_desc'],
      ['camera', 'about_p3_title', 'about_p3_desc'],
    ].map(function (p) {
      return '<div class="card about-point">' +
        '<div class="about-icon">' + icon(p[0]) + '</div>' +
        '<div><strong>' + t(p[1]) + '</strong><p class="muted small">' + t(p[2]) + '</p></div>' +
        '</div>';
    }).join('');

    // 怎麼讓大家安心
    const trust = [
      ['verified', 'trust_1'],
      ['star', 'trust_2'],
      ['shield', 'trust_3'],
      ['pin', 'trust_4'],
    ].map(function (x) {
      return '<li>' + icon(x[0]) + '<span>' + t(x[1]) + '</span></li>';
    }).join('');

    // 團隊
    const team = TEAM.map(function (m) {
      const name = m.name || t('tbd');
      return '<div class="card member">' +
        '<div class="avatar big">' + esc(m.name ? m.name.charAt(0) : '?') + '</div>' +
        '<div class="member-name">' + esc(name) + '</div>' +
        '<div class="tag">' + esc(m.role) + '</div>' +
        '<div class="muted small">' + esc(tr(m.bio)) + '</div>' +
        '</div>';
    }).join('');

    // 贊助金額按鈕
    const amounts = DONATE_AMOUNTS.map(function (n) {
      return '<button type="button" class="chip' + (n === 100 ? ' on' : '') + '" data-amount="' + n + '">' + money(n) + '</button>';
    }).join('');

    const total = store.donations().reduce(function (sum, d) { return sum + d.amount; }, 0);

    return '<div class="narrow about">' +
      '<h1>' + t('about_title') + '</h1>' +
      '<p class="about-mission">' + t('about_mission') + '</p>' +

      '<h2>' + t('about_problem_title') + '</h2>' +
      '<div class="about-points">' + problems + '</div>' +

      '<h2>' + t('about_trust_title') + '</h2>' +
      '<ul class="card trust-list">' + trust + '</ul>' +

      '<h2>' + t('about_team_title') + '</h2>' +
      '<div class="team-grid">' + team + '</div>' +

      // ----- 贊助 -----
      '<h2 id="donate">' + t('donate_title') + '</h2>' +
      '<div class="card donate" id="donateBox">' +
      '<p class="muted">' + t('donate_desc') + '</p>' +
      '<div class="donate-stats">' +
      '<div><strong id="donateCount">' + store.donations().length + '</strong><span class="muted small">' + t('donate_people') + '</span></div>' +
      '<div><strong id="donateTotal">' + money(total) + '</strong><span class="muted small">' + t('donate_raised') + '</span></div>' +
      '</div>' +
      '<div class="chips" id="amounts">' + amounts + '</div>' +
      '<label class="field"><span>' + t('donate_custom') + '</span><input type="number" id="customAmount" min="1" step="1" inputmode="numeric" placeholder="1000"></label>' +
      '<label class="field"><span>' + t('donate_name') + '</span><input id="donorName" maxlength="20" placeholder="' + t('donate_name_ph') + '"></label>' +
      '<label class="field"><span>' + t('donate_msg') + '</span><input id="donorMsg" maxlength="60" placeholder="' + t('donate_msg_ph') + '"></label>' +
      '<p class="error" id="donateError" hidden></p>' +
      '<button type="button" class="btn wide" id="donateBtn"></button>' +
      '</div>' +

      // 最近的支持者
      '<div id="supporters">' + this.supportersHtml() + '</div>' +
      '</div>' +

      // 模擬付款視窗（跟租借用一樣的樣式）
      '<div class="modal" id="donateModal" hidden>' +
      '<div class="modal-box">' +
      '<h2>' + t('mock_pay_title') + '</h2>' +
      '<p class="muted">' + t('mock_pay_desc') + '</p>' +
      '<div class="pay-total" id="donateModalTotal"></div>' +
      '<div class="modal-actions">' +
      '<button class="btn secondary" type="button" id="donateCancel">' + t('cancel') + '</button>' +
      '<button class="btn" type="button" id="donateConfirm">' + t('confirm_pay') + '</button>' +
      '</div>' +
      '</div>' +
      '</div>';
  },

  // 最近 5 位支持者
  supportersHtml: function () {
    const list = store.donations().slice(-5).reverse();
    if (!list.length) return '';
    return '<h2>' + t('donate_recent') + '</h2>' +
      list.map(function (d) {
        return '<div class="review">' +
          '<div class="review-head"><strong>' + esc(d.name || t('donate_anonymous')) + '</strong><span class="price-small">' + money(d.amount) + '</span></div>' +
          (d.message ? '<p>' + esc(d.message) + '</p>' : '') +
          '</div>';
      }).join('');
  },

  // 按鈕上的字：「贊助 NT$100」
  updateButton: function () {
    document.getElementById('donateBtn').textContent = t('donate_btn', { n: money(this.amount) });
  },

  bind: function () {
    const self = this;
    const modal = document.getElementById('donateModal');
    const error = document.getElementById('donateError');
    this.updateButton();

    // 選金額
    document.getElementById('amounts').onclick = function (e) {
      const chip = e.target.closest('[data-amount]');
      if (!chip) return;
      self.amount = Number(chip.dataset.amount);
      document.getElementById('customAmount').value = '';
      this.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c === chip); });
      error.hidden = true;
      self.updateButton();
    };

    // 自己輸入金額：上面的選項就取消
    document.getElementById('customAmount').oninput = function () {
      self.amount = Math.round(Number(this.value)) || 0;
      document.querySelectorAll('#amounts .chip').forEach(function (c) { c.classList.remove('on'); });
      error.hidden = true;
      self.updateButton();
    };

    // 按「贊助」：檢查金額，跳出模擬付款
    document.getElementById('donateBtn').onclick = function () {
      if (!(self.amount >= 1)) {
        error.textContent = t('donate_err');
        error.hidden = false;
        return;
      }
      document.getElementById('donateModalTotal').textContent = money(self.amount);
      modal.hidden = false;
    };
    document.getElementById('donateCancel').onclick = function () { modal.hidden = true; };

    // 確認：記下這筆贊助，顯示感謝
    document.getElementById('donateConfirm').onclick = function () {
      const name = document.getElementById('donorName').value.trim();
      store.addDonation({
        amount: self.amount,
        name: name,
        message: document.getElementById('donorMsg').value.trim(),
      });
      modal.hidden = true;

      const total = store.donations().reduce(function (sum, d) { return sum + d.amount; }, 0);
      document.getElementById('donateBox').innerHTML =
        '<div class="done">' +
        '<div class="done-icon">' + icon('verified') + '</div>' +
        '<h2>' + t('donate_thanks', { name: esc(name || t('donate_friend')) }) + '</h2>' +
        '<p class="muted">' + t('donate_thanks_desc', { n: money(self.amount) }) + '</p>' +
        '<div class="donate-stats">' +
        '<div><strong>' + store.donations().length + '</strong><span class="muted small">' + t('donate_people') + '</span></div>' +
        '<div><strong>' + money(total) + '</strong><span class="muted small">' + t('donate_raised') + '</span></div>' +
        '</div>' +
        '<button type="button" class="btn secondary" id="donateAgain">' + t('donate_again') + '</button>' +
        '</div>';
      document.getElementById('supporters').innerHTML = self.supportersHtml();
      document.getElementById('donateAgain').onclick = function () { render(); };
    };
  },
};
