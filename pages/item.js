// =========================================================
// 物品詳細頁（R3）：照片、說明、價格、押金、取件點、物主、評價、已被預約的日期
// 按「我要租」會到 #/rent/物品id（pages/rent.js）
// =========================================================

const ItemPage = {

  render: function (id) {
    const item = store.getItem(id);
    if (!item) {
      return '<div class="card placeholder"><p class="muted">' + t('not_found') + '</p>' +
             '<a class="btn secondary" href="#/browse">' + t('browse_title') + '</a></div>';
    }

    const owner = store.getUser(item.ownerId);

    // 取件點
    const points = item.pickupPoints.map(function (pid) {
      return '<li>' + icon('pin') + esc(tr(store.getPickupPoint(pid).name)) + '</li>';
    }).join('');

    // 已被預約的日期（還沒歸還的訂單）
    const bookings = store.bookingsOfItem(item.id);
    const bookingList = bookings.length
      ? '<ul class="plain-list">' + bookings.map(function (o) {
          return '<li>' + icon('calendar') + o.start + ' → ' + o.end + '</li>';
        }).join('') + '</ul>'
      : '<p class="muted">' + t('no_bookings') + '</p>';

    // 物主收到的評價
    const reviews = store.reviewsOf(owner.id).slice(-3).reverse();   // 最新的 3 則
    const reviewList = reviews.length
      ? reviews.map(reviewHtml).join('')
      : '<p class="muted">' + t('no_reviews') + '</p>';

    return '' +
      '<a class="back-link" href="#/browse" id="backLink">' + icon('back') + t('back') + '</a>' +

      '<div class="detail">' +
        // 左：照片
        '<div class="detail-photo">' + itemPhoto(item, true) + '</div>' +

        // 右：資訊
        '<div class="detail-info">' +
          '<div class="item-tags">' +
            '<span class="tag scene-' + item.scene + '">' + t('scene_' + item.scene) + '</span>' +
            (item.tags || []).map(tagHtml).join('') +
          '</div>' +
          '<h1>' + esc(tr(item.title)) + '</h1>' +

          '<div class="price-row">' +
            '<div><span class="price-big">' + money(item.pricePerDay) + '</span> <span class="muted">' + t('per_day') + '</span></div>' +
            '<div class="muted small">' + icon('shield') +
              (item.deposit ? t('deposit') + ' ' + money(item.deposit) + '（' + t('deposit_note') + '）' : t('no_deposit')) +
            '</div>' +
          '</div>' +
          (item.deposit ? '<p class="muted small">' + t('deposit_discount') + '</p>' : '') +

          (item.minRenterRating ? '<p class="note">' + icon('star') + t('min_rating_note', { n: item.minRenterRating }) + '</p>' : '') +

          // 租借按鈕：沒登入的話，先去登入，登入完再回來租
          '<a class="btn wide" href="#/' + (store.currentUser() ? 'rent/' + item.id : 'login?next=rent/' + item.id) + '">' + t('rent_now') + '</a>' +

          '<h2>' + t('description') + '</h2>' +
          '<p>' + esc(tr(item.desc)) + '</p>' +

          '<h2>' + t('pickup_at') + '</h2>' +
          '<ul class="plain-list">' + points + '</ul>' +

          '<h2>' + t('booked_title') + '</h2>' +
          bookingList +

          '<h2>' + t('owner') + '</h2>' +
          '<div class="owner card">' +
            '<div class="avatar">' + esc(owner.name.charAt(0)) + '</div>' +
            '<div>' +
              '<div class="owner-name">' + esc(owner.name) +
                (owner.verified ? '<span class="verified">' + icon('verified') + t('verified') + '</span>' : '') +
              '</div>' +
              '<div class="muted small">' + esc(tr(owner.dept)) + '</div>' +
              '<div class="small">' + ratingHtml(owner) + '</div>' +
            '</div>' +
          '</div>' +

          '<h2>' + t('reviews_title') + '</h2>' +
          reviewList +
        '</div>' +
      '</div>';
  },

  bind: function () {
    // 返回：從網站裡其他頁點進來的，就回上一頁（篩選條件還在）；直接打開網址的，就去找東西頁
    const back = document.getElementById('backLink');
    if (back) {
      back.onclick = function (e) {
        if (pageViews > 1) {
          e.preventDefault();
          history.back();
        }
      };
    }

  },
};
