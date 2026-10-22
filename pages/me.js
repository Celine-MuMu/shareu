// =========================================================
// 我的（R7、R8）
//   上方：我的資料、評分
//   分頁「我的租借」：我租的東西、狀態、取件碼；歸還後可以評物主
//   分頁「我的上架」：我的物品、被誰租、預計收入；歸還後可以評租客
//   最下面：我收到的評價
//
// 網址 #/me?tab=listings 會直接打開「我的上架」
// 展示用：每筆訂單都有「下一步」按鈕，可以手動把狀態往前推
// =========================================================

const STATUS_STEPS = ['pending', 'active', 'returned'];

const MePage = {
  tab: 'rentals',

  render: function (param, query) {
    const me = store.currentUser();
    if (!me) {
      return '<div class="card placeholder narrow">' + icon('info') +
        '<p>' + t('me_login_needed') + '</p>' +
        '<a class="btn" href="#/login?next=me">' + t('login_title') + '</a></div>';
    }
    this.tab = query.tab === 'listings' ? 'listings' : 'rentals';

    // 我收到的評價
    const reviews = store.reviewsOf(me.id).slice().reverse();
    const reviewList = reviews.length
      ? reviews.map(reviewHtml).join('')
      : '<p class="muted">' + t('no_reviews') + '</p>';

    return '<div class="narrow">' +
      // 我的資料
      '<div class="card owner">' +
        '<div class="avatar">' + esc(me.name.charAt(0)) + '</div>' +
        '<div class="grow">' +
          '<div class="owner-name">' + esc(me.name) +
            (me.verified ? '<span class="verified">' + icon('verified') + t('verified') + '</span>' : '') +
          '</div>' +
          '<div class="muted small">' + esc(tr(me.dept)) + '</div>' +
          '<div class="small">' + ratingHtml(me) + '</div>' +
        '</div>' +
        '<a class="btn secondary small" href="#/login">' + t('switch_short') + '</a>' +
      '</div>' +

      // 分頁按鈕
      '<div class="tabs" id="meTabs">' +
        '<button type="button" data-tab="rentals"' + (this.tab === 'rentals' ? ' class="on"' : '') + '>' + t('my_rentals') + '</button>' +
        '<button type="button" data-tab="listings"' + (this.tab === 'listings' ? ' class="on"' : '') + '>' + t('my_listings') + '</button>' +
      '</div>' +
      '<div id="meBody">' + (this.tab === 'rentals' ? this.rentalsHtml(me) : this.listingsHtml(me)) + '</div>' +

      '<h2>' + t('reviews_received') + '</h2>' +
      reviewList +
    '</div>';
  },

  // ---------- 我的租借 ----------
  rentalsHtml: function (me) {
    const orders = store.ordersOfRenter(me.id);
    if (!orders.length) {
      return emptyHtml(t('no_rentals'), '#/browse', t('nav_browse'));
    }
    return orders.map(function (o) {
      const item = store.getItem(o.itemId);
      const owner = store.getUser(item.ownerId);
      const point = store.getPickupPoint(o.pickupPoint);
      const total = o.rent + o.serviceFee + o.protectionFee + o.deposit;

      return '<div class="card order">' +
        orderHead(o, item) +
        '<div class="order-info muted small">' +
          '<div>' + icon('calendar') + o.start + ' → ' + o.end + '</div>' +
          '<div>' + icon('pin') + esc(tr(point.name)) + '</div>' +
          '<div>' + icon('user') + t('owner') + '：' + esc(owner.name) + '</div>' +
        '</div>' +
        (o.status === 'pending' && o.pickupCode
          ? '<div class="code-line">' + t('pickup_code') + ' <strong>' + o.pickupCode + '</strong></div>' : '') +
        '<div class="fee-row"><span class="muted small">' + t('fee_paid') + '（' + t('deposit') + ' ' + money(o.deposit) + ' ' + t('deposit_note') + '）</span><span>' + money(total) + '</span></div>' +
        orderActions(o, me.id, owner) +
      '</div>';
    }).join('');
  },

  // ---------- 我的上架 ----------
  listingsHtml: function (me) {
    const items = store.itemsOfOwner(me.id);
    if (!items.length) {
      return emptyHtml(t('no_listings'), '#/new', t('list_title'));
    }

    // 所有訂單加起來的收入（扣掉 10% 平台抽成）
    let totalIncome = 0;

    const cards = items.map(function (item) {
      const orders = store.ordersOfItem(item.id).slice().reverse();
      const orderRows = orders.length
        ? orders.map(function (o) {
            const renter = store.getUser(o.renterId);
            const income = Math.round(o.rent * 0.9);
            totalIncome += income;
            return '<div class="sub-order">' +
              '<div class="order-head">' +
                '<span>' + esc(renter.name) + ' · ' + o.start + ' → ' + o.end + '</span>' +
                statusBadge(o.status) +
              '</div>' +
              '<div class="fee-row small"><span class="muted">' + t('income_after_fee') + '</span><span>' + money(income) + '</span></div>' +
              orderActions(o, me.id, renter) +
            '</div>';
          }).join('')
        : '<p class="muted small">' + t('no_orders_yet') + '</p>';

      return '<div class="card order">' +
        '<a class="listing-head" href="#/item/' + item.id + '">' +
          itemPhoto(item) +
          '<div>' +
            '<div class="item-title">' + esc(tr(item.title)) + '</div>' +
            '<div class="item-price"><strong>' + money(item.pricePerDay) + '</strong> <span class="muted">' + t('per_day') + '</span></div>' +
          '</div>' +
        '</a>' +
        orderRows +
      '</div>';
    }).join('');

    return '<div class="income-box">' +
        '<span class="muted small">' + t('income_total') + '</span>' +
        '<strong>' + money(totalIncome) + '</strong>' +
        '<span class="muted small">' + t('income_note') + '</span>' +
      '</div>' +
      '<a class="btn secondary wide" href="#/new">' + icon('plus') + t('list_title') + '</a>' +
      cards;
  },

  bind: function () {
    const self = this;
    if (!document.getElementById('meTabs')) return;

    // 切換分頁（改網址，重新整理也會停在同一個分頁）
    document.getElementById('meTabs').onclick = function (e) {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      history.replaceState(null, '', '#/me' + (btn.dataset.tab === 'listings' ? '?tab=listings' : ''));
      render();
    };

    // 訂單上的按鈕：下一步、打開評價表、選星星、送出評價
    document.getElementById('meBody').onclick = function (e) {
      const advance = e.target.closest('[data-advance]');
      if (advance) {
        store.advanceOrder(advance.dataset.advance);
        render();
        return;
      }

      const open = e.target.closest('[data-review-open]');
      if (open) {
        open.hidden = true;
        document.getElementById('rv-' + open.dataset.reviewOpen).hidden = false;
        return;
      }

      const star = e.target.closest('[data-star]');
      if (star) {
        const box = star.closest('.review-form');
        box.dataset.stars = star.dataset.star;
        box.querySelectorAll('[data-star]').forEach(function (s) {
          s.classList.toggle('on', Number(s.dataset.star) <= Number(star.dataset.star));
        });
        return;
      }

      const send = e.target.closest('[data-review-send]');
      if (send) {
        const box = send.closest('.review-form');
        const stars = Number(box.dataset.stars || 0);
        const text = box.querySelector('input').value.trim();
        const err = box.querySelector('.error');
        if (!stars) {
          err.textContent = t('review_err_stars');
          err.hidden = false;
          return;
        }
        store.addReview({
          orderId: box.dataset.order,
          fromId: store.currentUser().id,
          toId: box.dataset.to,
          stars: stars,
          text: { zh: text, en: text },
        });
        render();
      }
    };
  },
};

// ---------- 小零件 ----------

function statusBadge(status) {
  return '<span class="status status-' + status + '">' + t('status_' + status) + '</span>';
}

function orderHead(o, item) {
  return '<a class="order-head" href="#/item/' + item.id + '">' +
    '<strong>' + esc(tr(item.title)) + '</strong>' + statusBadge(o.status) +
  '</a>';
}

// 訂單下面的按鈕：還沒還 → 「下一步」；已歸還 → 評價對方（或「已評價」）
function orderActions(o, myId, other) {
  if (o.status !== 'returned') {
    const nextLabel = o.status === 'pending' ? t('mark_picked_up') : t('mark_returned');
    return '<div class="order-actions">' +
      '<button type="button" class="btn secondary small" data-advance="' + o.id + '">' + nextLabel + '</button>' +
      '<span class="muted small">' + t('demo_only') + '</span>' +
    '</div>';
  }
  if (store.hasReviewed(o.id, myId)) {
    return '<div class="order-actions muted small">' + icon('verified') + t('reviewed') + '</div>';
  }
  return '<div class="order-actions">' +
      '<button type="button" class="btn small" data-review-open="' + o.id + '">' + icon('star') + t('review_who', { name: esc(other.name) }) + '</button>' +
    '</div>' +
    '<div class="review-form" id="rv-' + o.id + '" data-order="' + o.id + '" data-to="' + other.id + '" hidden>' +
      '<div class="star-pick">' + [1, 2, 3, 4, 5].map(function (n) {
        return '<button type="button" data-star="' + n + '" aria-label="' + n + '">' + icon('star') + '</button>';
      }).join('') + '</div>' +
      '<input class="review-input" maxlength="100" placeholder="' + t('review_ph') + '">' +
      '<p class="error" hidden></p>' +
      '<button type="button" class="btn small" data-review-send>' + t('review_send') + '</button>' +
    '</div>';
}

function emptyHtml(message, href, label) {
  return '<div class="card placeholder">' +
    '<p class="muted">' + message + '</p>' +
    '<a class="btn secondary" href="' + href + '">' + label + '</a>' +
  '</div>';
}
