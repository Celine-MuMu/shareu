// =========================================================
// 上架物品（R6）
// 填好表單 → 物品馬上出現在「找東西」，而且排在最前面（最新上架）
// 照片可以不放，不放就用類別的 icon 當圖
// =========================================================

const ListItemPage = {
  photoData: '',   // 使用者選的照片（縮小後的圖片資料）

  render: function () {
    const me = store.currentUser();
    if (!me) {
      return '<div class="card placeholder narrow">' + icon('info') +
        '<p>' + t('list_login_needed') + '</p>' +
        '<a class="btn" href="#/login?next=new">' + t('login_title') + '</a></div>';
    }
    this.photoData = '';

    const sceneOptions = ['concert', 'travel', 'project'].map(function (s) {
      return '<option value="' + s + '">' + t('scene_' + s) + '</option>';
    }).join('');

    // 類別：內建的＋大家打過的自訂類別＋最後一個「其他（自己輸入）」（R14）
    const categoryOptions = CATEGORIES.map(function (c) {
      return '<option value="' + c + '">' + t('cat_' + c) + '</option>';
    }).join('') + customCategories().map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
    }).join('') + '<option value="__other">' + t('cat_other') + '</option>';

    // 成色、購入年份（R15）
    const conditionOptions = CONDITIONS.map(function (c) {
      return '<option value="' + c + '"' + (c === '90' ? ' selected' : '') + '>' + t('cond_' + c) + '</option>';
    }).join('');
    const thisYear = new Date().getFullYear();
    let yearOptions = '';
    for (let y = thisYear; y > thisYear - 10; y--) {
      yearOptions += '<option value="' + y + '">' + t('year_n', { n: y }) + '</option>';
    }
    yearOptions += '<option value="older">' + t('year_older') + '</option>';

    const pickupChecks = store.pickupPoints().map(function (p) {
      return '<label class="check"><input type="checkbox" name="pickup" value="' + p.id + '">' +
        '<span>' + esc(tr(p.name)) + '</span></label>';
    }).join('');

    // 「ShareU 官方」只有平台能用，一般同學不能勾
    const tagChips = store.tags().filter(function (tag) { return tag.id !== 'official'; }).map(function (tag) {
      return '<label class="chip-check"><input type="checkbox" name="tags" value="' + tag.id + '"><span class="chip">' + esc(tr(tag.name)) + '</span></label>';
    }).join('');

    return '<div class="narrow">' +
      '<h1>' + t('list_title') + '</h1>' +
      '<p class="muted">' + t('list_desc') + '</p>' +

      '<form class="card form" id="listForm" novalidate>' +
        // 照片
        '<div class="form-step">' + t('list_photo') + '</div>' +
        '<label class="photo-pick" id="photoPick">' +
          '<div class="photo-preview" id="photoPreview">' + icon('camera') + '<span class="small">' + t('list_photo_hint') + '</span></div>' +
          '<input type="file" name="photo" accept="image/*" hidden>' +
        '</label>' +

        // 基本資料
        '<label class="field"><span>' + t('list_name') + '</span><input name="title" maxlength="60" placeholder="' + t('list_name_ph') + '"></label>' +
        '<div class="date-row">' +
          '<label class="field"><span>' + t('filter_scene') + '</span><select name="scene" class="select">' + sceneOptions + '</select></label>' +
          '<label class="field"><span>' + t('list_category') + '</span><select name="category" class="select">' + categoryOptions + '</select></label>' +
        '</div>' +
        // 選「其他」才會出現的文字框
        '<label class="field" id="customCatField" hidden><span>' + t('cat_custom') + '</span><input name="customCategory" maxlength="12" placeholder="' + t('cat_custom_ph') + '"></label>' +
        '<div class="date-row">' +
          '<label class="field"><span>' + t('condition') + '</span><select name="condition" class="select">' + conditionOptions + '</select></label>' +
          '<label class="field"><span>' + t('purchase_year') + '</span><select name="year" class="select">' + yearOptions + '</select></label>' +
        '</div>' +
        '<label class="field"><span>' + t('description') + '</span><textarea name="desc" rows="3" maxlength="300" placeholder="' + t('list_desc_ph') + '"></textarea></label>' +

        // 價格
        '<div class="date-row">' +
          '<label class="field"><span>' + t('list_price') + '</span><input name="price" type="number" min="1" step="1" inputmode="numeric" placeholder="100"></label>' +
          '<label class="field"><span>' + t('list_deposit') + '</span><input name="deposit" type="number" min="0" step="10" inputmode="numeric" placeholder="0"></label>' +
        '</div>' +
        '<p class="muted small" id="incomeHint"></p>' +

        // 取件點
        '<div class="form-step">' + t('pickup_at') + '</div>' +
        '<div id="pickupChecks">' + pickupChecks + '</div>' +

        // 標籤
        '<div class="form-step">' + t('filter_tags') + '</div>' +
        '<div class="chips">' + tagChips + '</div>' +

        // 只租給評分幾分以上
        '<label class="field"><span>' + t('list_min_rating') + '</span>' +
          '<select name="minRating" class="select">' +
            '<option value="0">' + t('list_min_any') + '</option>' +
            '<option value="4">' + t('list_min_n', { n: 4 }) + '</option>' +
            '<option value="4.5">' + t('list_min_n', { n: 4.5 }) + '</option>' +
          '</select>' +
        '</label>' +

        '<p class="error" id="listError" hidden></p>' +
        '<button class="btn wide" type="submit">' + t('list_submit') + '</button>' +
      '</form>' +
    '</div>';
  },

  bind: function () {
    const self = this;
    const form = document.getElementById('listForm');
    if (!form) return;

    // 輸入租金時，顯示「你每天實拿多少」（扣掉 10% 平台抽成）
    form.price.oninput = function () {
      const p = Number(this.value);
      document.getElementById('incomeHint').textContent = p > 0 ? t('list_income_hint', { n: money(Math.round(p * 0.9)) }) : '';
    };

    // 選照片：縮小成最長邊 800px 再存，避免塞爆瀏覽器的儲存空間
    form.photo.onchange = function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          const scale = Math.min(1, 800 / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          self.photoData = canvas.toDataURL('image/jpeg', 0.8);
          document.getElementById('photoPreview').innerHTML = '<img src="' + self.photoData + '" alt="">';
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    };

    // 類別選「其他」時，顯示文字框讓人自己打
    form.category.onchange = function () {
      const other = this.value === '__other';
      document.getElementById('customCatField').hidden = !other;
      if (other) form.customCategory.focus();
    };

    form.onsubmit = function (e) {
      e.preventDefault();
      const category = form.category.value === '__other' ? form.customCategory.value.trim() : form.category.value;
      const title = form.title.value.trim();
      const desc = form.desc.value.trim();
      const price = Number(form.price.value);
      const deposit = Number(form.deposit.value || 0);
      const pickups = Array.from(form.querySelectorAll('input[name="pickup"]:checked')).map(function (x) { return x.value; });
      const tags = Array.from(form.querySelectorAll('input[name="tags"]:checked')).map(function (x) { return x.value; });

      // 檢查必填
      let error = '';
      if (!title) error = t('list_err_title');
      else if (!(price >= 1)) error = t('list_err_price');
      else if (deposit < 0) error = t('list_err_deposit');
      else if (!category) error = t('list_err_category');
      else if (!pickups.length) error = t('list_err_pickup');

      const errEl = document.getElementById('listError');
      if (error) {
        errEl.textContent = error;
        errEl.hidden = false;
        return;
      }

      // 使用者只會寫一種語言，中英文先放一樣的
      const item = store.addItem({
        ownerId: store.currentUser().id,
        scene: form.scene.value,
        category: category,
        condition: form.condition.value,
        purchaseYear: form.year.value === 'older' ? 'older' : Number(form.year.value),
        title: { zh: title, en: title },
        desc: { zh: desc, en: desc },
        pricePerDay: Math.round(price),
        deposit: Math.round(deposit),
        pickupPoints: pickups,
        minRenterRating: Number(form.minRating.value),
        tags: tags,
        photo: '',
        photoData: self.photoData,
      });
      location.hash = '#/item/' + item.id;
    };
  },
};
