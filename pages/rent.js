// =========================================================
// 租借流程（R4）
//   #/rent/i1    → 租借表單：日期、取件點、損壞保障、費用明細
//   #/order/o123 → 下單成功：取件資訊
//
// 計價規則（docs/design.md 第 8 節）：
//   租金     = 每日租金 × 天數
//   服務費   = 租金 × 5%（租客付）
//   損壞保障 = 租金 × 10%，最低 NT$30（可選）
//   押金     = 原本押金，評分 4.5 以上 × 0.5，加購保障再 × 0.5（歸還後退回）
// =========================================================

const RentPage = {
  item: null,
  form: null,   // { start, end, pickup, protection }

  render: function (id) {
    const item = store.getItem(id);
    if (!item) return ItemPage.render(id);   // 找不到物品：沿用物品頁的「找不到」畫面
    this.item = item;

    const me = store.currentUser();
    const back = '<a class="back-link" href="#/item/' + item.id + '">' + icon('back') + t('back') + '</a>';

    // ----- 不能租的情況 -----
    if (!me) {
      return back + this.blocked(t('login_needed'),
        '<a class="btn" href="#/login?next=rent/' + item.id + '">' + t('login_title') + '</a>');
    }
    if (me.id === item.ownerId) {
      return back + this.blocked(t('own_item'), '');
    }
    if (item.minRenterRating && me.rating < item.minRenterRating) {
      return back + this.blocked(
        t('rating_too_low', { n: item.minRenterRating, mine: me.reviewCount ? me.rating.toFixed(1) : t('new_user') }),
        '<a class="btn secondary" href="#/browse?scene=' + item.scene + '">' + t('see_similar') + '</a>');
    }

    // ----- 表單 -----
    // 預設：明天取、後天還（2 天）、第一個取件點、不加購保障
    this.form = { start: addDays(1), end: addDays(3), pickup: item.pickupPoints[0], protection: false };
    const f = this.form;

    const pickupRadios = item.pickupPoints.map(function (pid) {
      return '<label class="check"><input type="radio" name="pickup" value="' + pid + '"' + (pid === f.pickup ? ' checked' : '') + '>' +
        '<span>' + esc(tr(store.getPickupPoint(pid).name)) + '</span></label>';
    }).join('');

    const bookings = store.bookingsOfItem(item.id);
    const bookedNote = bookings.length
      ? '<p class="muted small">' + icon('calendar') + t('booked_title') + '：' +
          bookings.map(function (o) { return o.start + ' → ' + o.end; }).join('、') + '</p>'
      : '';

    return back +
      '<div class="narrow">' +
        '<h1>' + t('rent_title') + '</h1>' +

        // 租什麼
        '<div class="card rent-item">' +
          itemPhoto(item) +
          '<div>' +
            '<div class="item-title">' + esc(tr(item.title)) + '</div>' +
            '<div class="item-price"><strong>' + money(item.pricePerDay) + '</strong> <span class="muted">' + t('per_day') + '</span></div>' +
          '</div>' +
        '</div>' +

        '<form class="card form" id="rentForm" novalidate>' +
          // 1. 日期
          '<div class="form-step">1. ' + t('rent_dates') + '</div>' +
          '<div class="date-row">' +
            '<label class="field"><span>' + t('pickup_date') + '</span><input type="date" name="start" value="' + f.start + '" min="' + addDays(0) + '"></label>' +
            '<label class="field"><span>' + t('return_date') + '</span><input type="date" name="end" value="' + f.end + '" min="' + addDays(1) + '"></label>' +
          '</div>' +
          bookedNote +
          '<p class="error" id="dateError" hidden></p>' +

          // 2. 取件點
          '<div class="form-step">2. ' + t('pickup_at') + '</div>' +
          pickupRadios +

          // 3. 損壞保障
          '<div class="form-step">3. ' + t('protection') + '</div>' +
          '<label class="check protection"><input type="checkbox" name="protection">' +
            '<span><strong>' + t('protection_add') + '</strong><br><span class="muted small">' + t('protection_desc') + '</span></span>' +
          '</label>' +

          // 費用明細（會跟著上面的選擇更新）
          '<div class="form-step">' + t('fee_detail') + '</div>' +
          '<div id="breakdown"></div>' +

          '<button class="btn wide" type="submit" id="payBtn">' + t('go_pay') + '</button>' +
        '</form>' +
      '</div>' +

      // 模擬付款的確認視窗
      '<div class="modal" id="payModal" hidden>' +
        '<div class="modal-box">' +
          '<h2>' + t('mock_pay_title') + '</h2>' +
          '<p class="muted">' + t('mock_pay_desc') + '</p>' +
          '<div class="pay-total" id="payTotal"></div>' +
          '<div class="modal-actions">' +
            '<button class="btn secondary" type="button" id="payCancel">' + t('cancel') + '</button>' +
            '<button class="btn" type="button" id="payConfirm">' + t('confirm_pay') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  },

  // 不能租的時候顯示的卡片
  blocked: function (message, action) {
    return '<div class="card placeholder narrow">' + icon('info') + '<p>' + message + '</p>' + action + '</div>';
  },

  // 依目前的表單算出所有費用；日期有問題時回傳 error
  calc: function () {
    const f = this.form;
    const item = this.item;
    const me = store.currentUser();
    const days = daysBetween(f.start, f.end);

    let error = '';
    if (!f.start || !f.end) error = t('err_no_date');
    else if (f.start < addDays(0)) error = t('err_past');
    else if (days < 1) error = t('err_end_before_start');
    else if (store.bookingsOfItem(item.id).some(function (o) { return overlaps(f.start, f.end, o.start, o.end); })) error = t('err_booked');

    const rent = item.pricePerDay * Math.max(days, 0);
    const protectionFee = f.protection ? protectionFeeFor(rent) : 0;
    const serviceFee = serviceFeeFor(rent);
    const deposit = depositFor(item.deposit, me.rating, f.protection);

    return {
      error: error, days: days, rent: rent, serviceFee: serviceFee,
      protectionFee: protectionFee, deposit: deposit,
      total: rent + serviceFee + protectionFee + deposit,
    };
  },

  // 更新費用明細
  refresh: function () {
    const c = this.calc();
    const item = this.item;
    const me = store.currentUser();

    const err = document.getElementById('dateError');
    err.textContent = c.error;
    err.hidden = !c.error;
    document.getElementById('payBtn').disabled = !!c.error;

    if (c.error) {
      document.getElementById('breakdown').innerHTML = '<p class="muted small">' + t('fix_dates_first') + '</p>';
      return;
    }

    // 押金打了哪些折
    const reasons = [];
    if (item.deposit && me.rating >= 4.5) reasons.push(t('deposit_off_rating'));
    if (item.deposit && this.form.protection) reasons.push(t('deposit_off_protection'));
    const depositCell = !item.deposit
      ? t('no_deposit')
      : (c.deposit < item.deposit ? '<s class="muted">' + money(item.deposit) + '</s> ' : '') + money(c.deposit);

    function row(label, value, cls) {
      return '<div class="fee-row' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><span>' + value + '</span></div>';
    }

    document.getElementById('breakdown').innerHTML =
      '<div class="fees">' +
        row(t('fee_rent', { price: money(item.pricePerDay), days: c.days }), money(c.rent)) +
        row(t('fee_service'), money(c.serviceFee)) +
        (this.form.protection ? row(t('protection'), money(c.protectionFee)) : '') +
        row(t('deposit') + ' <span class="muted small">（' + t('deposit_note') + '）</span>', depositCell) +
        (reasons.length ? '<div class="fee-reason">' + icon('shield') + reasons.join('、') + '</div>' : '') +
        row(t('fee_total'), money(c.total), 'total') +
      '</div>';
  },

  bind: function () {
    const self = this;
    const form = document.getElementById('rentForm');
    if (!form) return;   // 不能租的畫面沒有表單

    // 表單有任何改變，就更新費用
    form.oninput = form.onchange = function () {
      self.form.start = form.start.value;
      self.form.end = form.end.value;
      self.form.pickup = form.querySelector('input[name="pickup"]:checked').value;
      self.form.protection = form.protection.checked;
      self.refresh();
    };

    // 按「前往付款」：跳出模擬付款視窗
    const modal = document.getElementById('payModal');
    form.onsubmit = function (e) {
      e.preventDefault();
      const c = self.calc();
      if (c.error) return;
      document.getElementById('payTotal').textContent = money(c.total);
      modal.hidden = false;
    };
    document.getElementById('payCancel').onclick = function () { modal.hidden = true; };

    // 確認付款：成立訂單，跳到成功頁
    document.getElementById('payConfirm').onclick = function () {
      const c = self.calc();
      const order = store.addOrder({
        itemId: self.item.id,
        renterId: store.currentUser().id,
        start: self.form.start,
        end: self.form.end,
        pickupPoint: self.form.pickup,
        protection: self.form.protection,
        rent: c.rent,
        serviceFee: c.serviceFee,
        protectionFee: c.protectionFee,
        deposit: c.deposit,
        pickupCode: String(Math.floor(100000 + Math.random() * 900000)),   // 置物櫃取件碼（6 位數）
      });
      location.hash = '#/order/' + order.id;
    };

    this.refresh();
  },
};


// ---------- 下單成功頁 ----------
const OrderDonePage = {
  render: function (id) {
    const order = store.getOrder(id);
    if (!order) return '<div class="card placeholder"><p class="muted">' + t('not_found') + '</p></div>';

    const item = store.getItem(order.itemId);
    const point = store.getPickupPoint(order.pickupPoint);
    const total = order.rent + order.serviceFee + order.protectionFee + order.deposit;

    return '<div class="narrow">' +
      '<div class="card done">' +
        '<div class="done-icon">' + icon('verified') + '</div>' +
        '<h1>' + t('order_done') + '</h1>' +
        '<p class="muted">' + t('order_done_desc') + '</p>' +

        (order.pickupCode
          ? '<div class="pickup-code"><span class="muted small">' + t('pickup_code') + '</span><strong>' + order.pickupCode + '</strong></div>'
          : '') +

        '<div class="fees">' +
          '<div class="fee-row"><span>' + t('col_item') + '</span><span>' + esc(tr(item.title)) + '</span></div>' +
          '<div class="fee-row"><span>' + t('rent_dates') + '</span><span>' + order.start + ' → ' + order.end + '</span></div>' +
          '<div class="fee-row"><span>' + t('pickup_at') + '</span><span>' + esc(tr(point.name)) + '</span></div>' +
          '<div class="fee-row"><span>' + t('protection') + '</span><span>' + (order.protection ? t('yes') : t('no')) + '</span></div>' +
          '<div class="fee-row total"><span>' + t('fee_paid') + '</span><span>' + money(total) + '</span></div>' +
        '</div>' +

        '<div class="modal-actions">' +
          '<a class="btn secondary" href="#/browse">' + t('keep_browsing') + '</a>' +
          '<a class="btn" href="#/me">' + t('my_rentals') + '</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  },
};
