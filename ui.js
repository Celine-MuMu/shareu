// =========================================================
// 好幾頁都會用到的小零件：物品卡片、評分、價格、標籤
// =========================================================

// 把文字裡的 < > & " 換掉，避免使用者輸入的內容（例如上架的物品名稱）被當成 HTML
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 價格：1050 → 「NT$1,050」
function money(n) {
  return 'NT$' + Number(n).toLocaleString('en-US');
}

// 實際押金（R4）：評分 4.5 以上打 5 折，加購損壞保障再打 5 折
// 例：depositFor(2000, 4.9, true) → 500
function depositFor(baseDeposit, renterRating, protection) {
  let d = baseDeposit;
  if (renterRating >= 4.5) d = d * 0.5;
  if (protection) d = d * 0.5;
  return Math.round(d);
}

// 損壞保障（R4）：租金的 10%，最低 NT$30
function protectionFeeFor(rent) {
  return Math.max(30, Math.round(rent * 0.1));
}

// 服務費（租客付）：租金的 5%
function serviceFeeFor(rent) {
  return Math.round(rent * 0.05);
}

// ---------- 日期 ----------
// 日期都用 '2026-10-30' 這種文字存

// 兩個日期差幾天：daysBetween('2026-10-30', '2026-11-01') → 2
function daysBetween(start, end) {
  return Math.round((Date.parse(end) - Date.parse(start)) / 86400000);
}

// 今天往後加幾天：addDays(1) → 明天的 '2026-10-23'
function addDays(n, from) {
  const d = from ? new Date(from + 'T00:00:00') : new Date();
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// 兩段日期有沒有重疊（還東西那天，下一個人可以來拿）
function overlaps(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

// 評分：★ 4.8 (23)；沒有評價的顯示「新用戶」
function ratingHtml(user) {
  if (!user.reviewCount) return '<span class="rating muted">' + t('new_user') + '</span>';
  return '<span class="rating">' + icon('star') + user.rating.toFixed(1) +
         '<span class="muted">(' + user.reviewCount + ')</span></span>';
}

// 一個標籤
function tagHtml(tagId) {
  const tag = store.getTag(tagId);
  if (!tag) return '';
  return '<span class="tag' + (tagId === 'official' ? ' official' : '') + '">' + esc(tr(tag.name)) + '</span>';
}

// 物品的圖：有照片放照片，沒有就用類別 icon
function itemPhoto(item, big) {
  // 上架時自己上傳的照片（存成圖片資料）
  if (item.photoData) {
    return '<div class="photo' + (big ? ' big' : '') + '"><img src="' + item.photoData + '" alt=""></div>';
  }
  if (item.photo) {
    return '<div class="photo' + (big ? ' big' : '') + '"><img src="img/' + esc(item.photo) + '" alt=""></div>';
  }
  return '<div class="photo scene-' + item.scene + (big ? ' big' : '') + '">' + icon(item.category) + '</div>';
}

// 物品卡片（首頁、找東西頁共用）
function itemCard(item) {
  const owner = store.getUser(item.ownerId);
  const firstPoint = store.getPickupPoint(item.pickupPoints[0]);
  const morePoints = item.pickupPoints.length - 1;

  return '<a class="item-card" href="#/item/' + item.id + '">' +
    itemPhoto(item) +
    '<div class="item-body">' +
      '<div class="item-title">' + esc(tr(item.title)) + '</div>' +
      '<div class="item-price"><strong>' + money(item.pricePerDay) + '</strong> <span class="muted">' + t('per_day') + '</span></div>' +
      '<div class="item-meta">' +
        '<span>' + esc(owner.name) + '</span>' + ratingHtml(owner) +
      '</div>' +
      '<div class="item-meta muted">' + icon('pin') +
        '<span class="ellipsis">' + esc(tr(firstPoint.name)) + (morePoints > 0 ? ' ' + t('more_points', { n: morePoints }) : '') + '</span>' +
      '</div>' +
      '<div class="item-tags">' + (item.tags || []).slice(0, 3).map(tagHtml).join('') + '</div>' +
    '</div>' +
  '</a>';
}

// 一則評價（物品頁、我的頁共用）
function reviewHtml(r) {
  const from = store.getUser(r.fromId);
  return '<div class="review">' +
    '<div class="review-head"><strong>' + esc(from.name) + '</strong>' +
      '<span class="stars">' + '★'.repeat(r.stars) + '<span class="muted">' + '★'.repeat(5 - r.stars) + '</span></span>' +
    '</div>' +
    (tr(r.text) ? '<p>' + esc(tr(r.text)) + '</p>' : '') +
  '</div>';
}
