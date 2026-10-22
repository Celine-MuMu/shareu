// =========================================================
// 問物主（R13，模擬聊天室）
//   #/chat/i10            → 我（租客）問物品 i10 的物主
//   #/chat/i10?with=u3    → 我（物主）回覆 u3 問的問題
//
// 真的即時聊天需要後端，展示版的訊息存在瀏覽器裡。
// 物主不在（現在登入的不是物主）時，約 1 秒後會自動回一句跟問題有關的話。
// =========================================================

// 快速問題按鈕（文字 key）
const QUICK_QUESTIONS = ['quick_teach', 'quick_pickup', 'quick_discount', 'quick_available'];

const AUTO_REPLY_DELAY = 1000;   // 自動回覆要等幾毫秒

const ChatPage = {
  item: null,
  askerId: null,

  render: function (itemId, query) {
    const me = store.currentUser();
    const item = store.getItem(itemId);
    if (!item) return ItemPage.render(itemId);
    if (!me) {
      return '<div class="card placeholder narrow">' + icon('info') +
        '<p>' + t('chat_login_needed') + '</p>' +
        '<a class="btn" href="#/login?next=chat/' + item.id + '">' + t('login_title') + '</a></div>';
    }

    const iAmOwner = me.id === item.ownerId;
    // 物主要知道在回誰；租客就是自己在問
    const askerId = iAmOwner ? query.with : me.id;
    if (!askerId || !store.getUser(askerId)) {
      return '<div class="card placeholder narrow">' + icon('message') +
        '<p>' + t('chat_owner_hint') + '</p>' +
        '<a class="btn secondary" href="#/me?tab=messages">' + t('my_messages') + '</a></div>';
    }
    this.item = item;
    this.askerId = askerId;

    const other = store.getUser(iAmOwner ? askerId : item.ownerId);

    // 快速問題只給發問的人用
    const quick = iAmOwner ? '' :
      '<div class="quick" id="quick">' + QUICK_QUESTIONS.map(function (k) {
        return '<button type="button" class="chip" data-quick="' + k + '">' + t(k) + '</button>';
      }).join('') + '</div>';

    return '<div class="narrow chat-page">' +
      '<a class="back-link" href="#/item/' + item.id + '" id="chatBack">' + icon('back') + t('back') + '</a>' +

      // 上方：對方是誰、在問哪個物品
      '<div class="card chat-head">' +
        '<div class="avatar">' + esc(other.name.charAt(0)) + '</div>' +
        '<div class="grow">' +
          '<div class="owner-name">' + esc(other.name) +
            (other.verified ? '<span class="verified">' + icon('verified') + t('verified') + '</span>' : '') +
          '</div>' +
          '<a class="muted small ellipsis chat-item" href="#/item/' + item.id + '">' + esc(tr(item.title)) + '</a>' +
        '</div>' +
        '<span class="tag">' + t(iAmOwner ? 'chat_role_renter' : 'owner') + '</span>' +
      '</div>' +

      '<div class="card chat-box">' +
        '<div class="messages" id="messages">' + this.messagesHtml() + '</div>' +
        quick +
        '<form class="chat-input" id="chatForm" autocomplete="off">' +
          '<input name="text" maxlength="200" placeholder="' + t('chat_placeholder') + '">' +
          '<button class="btn" type="submit" aria-label="' + t('chat_send') + '">' + icon('send') + '</button>' +
        '</form>' +
        '<p class="muted small center">' + t('chat_demo_note') + '</p>' +
      '</div>' +
    '</div>';
  },

  // 所有訊息泡泡
  messagesHtml: function () {
    const me = store.currentUser();
    const list = store.thread(this.item.id, this.askerId);
    if (!list.length) return '<p class="muted small center chat-empty">' + t('chat_empty') + '</p>';
    return list.map(function (m) {
      const mine = m.fromId === me.id;
      return '<div class="bubble-row' + (mine ? ' mine' : '') + '">' +
        '<div class="bubble">' + esc(m.text) + '</div>' +
        '<div class="bubble-meta">' + (m.auto ? t('chat_auto') + ' · ' : '') + chatTime(m.createdAt) + '</div>' +
      '</div>';
    }).join('');
  },

  // 重畫訊息、捲到最下面
  refresh: function (typing) {
    const box = document.getElementById('messages');
    if (!box) return;   // 已經離開聊天室
    box.innerHTML = this.messagesHtml() +
      (typing ? '<div class="bubble-row"><div class="bubble typing"><span></span><span></span><span></span></div></div>' : '');
    box.scrollTop = box.scrollHeight;
  },

  // 送出一則訊息
  send: function (text) {
    const self = this;
    text = text.trim();
    if (!text) return;
    const me = store.currentUser();
    const item = this.item;
    const askerId = this.askerId;

    store.addMessage({ itemId: item.id, askerId: askerId, fromId: me.id, text: text, auto: false });
    this.refresh();

    // 我不是物主 → 物主「不在線上」，過一下自動回覆
    if (me.id !== item.ownerId) {
      setTimeout(function () { self.refresh(true); }, 300);   // 先顯示「輸入中…」
      setTimeout(function () {
        store.addMessage({ itemId: item.id, askerId: askerId, fromId: item.ownerId, text: autoReply(text, item), auto: true });
        if (self.item === item) self.refresh();
      }, AUTO_REPLY_DELAY);
    }
  },

  bind: function () {
    const self = this;
    const form = document.getElementById('chatForm');
    if (!form) return;

    this.refresh();

    form.onsubmit = function (e) {
      e.preventDefault();
      self.send(form.text.value);
      form.text.value = '';
    };

    const quick = document.getElementById('quick');
    if (quick) {
      quick.onclick = function (e) {
        const btn = e.target.closest('[data-quick]');
        if (btn) self.send(t(btn.dataset.quick));
      };
    }

    // 從「我的 → 訊息」進來的，返回就回上一頁
    document.getElementById('chatBack').onclick = function (e) {
      if (pageViews > 1) { e.preventDefault(); history.back(); }
    };
  },
};

// 依問題的關鍵字挑一句自動回覆（docs/design.md 第 7 節）
function autoReply(text, item) {
  const q = text.toLowerCase();
  function has(words) { return words.some(function (w) { return q.indexOf(w) >= 0; }); }

  if (has(['教', '怎麼用', '設定', 'teach', 'how to', 'set up', 'setup'])) {
    return t('auto_teach');
  }
  if (has(['取', '地點', '置物櫃', '面交', '哪裡', '圖書館', '宿舍', '學生會', 'pickup', 'pick up', 'pick it up', 'locker', 'where', 'meet'])) {
    const points = item.pickupPoints.map(function (pid) { return tr(store.getPickupPoint(pid).name); }).join('、');
    return t('auto_pickup', { points: points });
  }
  if (has(['便宜', '折扣', '長租', '算便宜', 'discount', 'cheaper', 'long'])) {
    return t('auto_discount');
  }
  if (has(['還有', '有空', '日期', '可以租', '什麼時候', 'available', 'free', 'date', 'when'])) {
    return t('auto_available');
  }
  return t('auto_default');
}

// 訊息時間：今天的只顯示 14:02，其他天加上 10/21
function chatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  return d.toDateString() === now.toDateString() ? hm : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + hm;
}
