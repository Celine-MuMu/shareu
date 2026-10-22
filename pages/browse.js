// =========================================================
// 找東西頁（R2）：搜尋、場景、標籤、取件點、價格篩選、排序
//
// 篩選條件都寫在網址上，例如：
//   #/browse?scene=concert&tags=beginner,accessories&pickup=p1&price=50-150&sort=price-asc&q=手機
// 所以重新整理、或把網址傳給別人，看到的都是一樣的結果
// =========================================================

// 價格下拉選單的選項：[網址上的值, 文字 key, 判斷函式]
const PRICE_BANDS = [
  ['',        'price_any',     function () { return true; }],
  ['0-50',    'price_0_50',    function (p) { return p <= 50; }],
  ['50-150',  'price_50_150',  function (p) { return p > 50 && p <= 150; }],
  ['150-300', 'price_150_300', function (p) { return p > 150 && p < 300; }],
  ['300-',    'price_300_up',  function (p) { return p >= 300; }],
];

const SORTS = [
  ['new',        'sort_new'],
  ['price-asc',  'sort_price_asc'],
  ['price-desc', 'sort_price_desc'],
  ['rating',     'sort_rating'],
];

const BrowsePage = {
  state: null,   // 目前的篩選條件

  // 從網址讀出篩選條件
  readState: function (query) {
    function list(v) { return v ? v.split(',').filter(Boolean) : []; }
    return {
      q: query.q || '',
      scene: query.scene || '',
      tags: list(query.tags),
      pickup: list(query.pickup),
      price: query.price || '',
      sort: query.sort || 'new',
    };
  },

  // 把篩選條件寫回網址（不重畫整頁，只換網址）
  writeState: function () {
    const s = this.state;
    const parts = [];
    if (s.q) parts.push('q=' + encodeURIComponent(s.q));
    if (s.scene) parts.push('scene=' + s.scene);
    if (s.tags.length) parts.push('tags=' + s.tags.join(','));
    if (s.pickup.length) parts.push('pickup=' + s.pickup.join(','));
    if (s.price) parts.push('price=' + s.price);
    if (s.sort !== 'new') parts.push('sort=' + s.sort);
    history.replaceState(null, '', '#/browse' + (parts.length ? '?' + parts.join('&') : ''));
  },

  // 依照篩選條件，算出要顯示哪些物品
  filter: function () {
    const s = this.state;
    const keyword = s.q.toLowerCase();
    const band = PRICE_BANDS.find(function (b) { return b[0] === s.price; }) || PRICE_BANDS[0];

    let items = store.items().filter(function (item) {
      // 場景：要一樣
      if (s.scene && item.scene !== s.scene) return false;
      // 標籤：有勾的標籤，物品只要有其中一個就算（「或」）
      if (s.tags.length && !s.tags.some(function (tg) { return (item.tags || []).indexOf(tg) >= 0; })) return false;
      // 取件點：有勾的地點，物品在其中一個能取件就算（「或」）
      if (s.pickup.length && !s.pickup.some(function (p) { return item.pickupPoints.indexOf(p) >= 0; })) return false;
      // 價格
      if (!band[2](item.pricePerDay)) return false;
      // 關鍵字：比對中英文名稱、說明、標籤、物主名字
      if (keyword) {
        const owner = store.getUser(item.ownerId);
        const text = [
          item.title.zh, item.title.en, item.desc.zh, item.desc.en, owner.name,
        ].concat((item.tags || []).map(function (id) {
          const tag = store.getTag(id);
          return tag ? tag.name.zh + ' ' + tag.name.en : '';
        })).join(' ').toLowerCase();
        if (text.indexOf(keyword) < 0) return false;
      }
      return true;
    });

    // 排序
    if (s.sort === 'new') {
      items = items.slice().reverse();   // 後上架的排前面
    } else if (s.sort === 'price-asc') {
      items.sort(function (a, b) { return a.pricePerDay - b.pricePerDay; });
    } else if (s.sort === 'price-desc') {
      items.sort(function (a, b) { return b.pricePerDay - a.pricePerDay; });
    } else if (s.sort === 'rating') {
      items.sort(function (a, b) { return store.getUser(b.ownerId).rating - store.getUser(a.ownerId).rating; });
    }
    return items;
  },

  // 目前用了幾個篩選（手機版「篩選」按鈕上的數字）
  activeCount: function () {
    const s = this.state;
    return (s.scene ? 1 : 0) + s.tags.length + s.pickup.length + (s.price ? 1 : 0);
  },

  // ---------- 畫面 ----------

  render: function (param, query) {
    this.state = this.readState(query);
    const s = this.state;

    // 場景：單選
    const sceneChips = ['', 'concert', 'travel', 'project'].map(function (scene) {
      return '<button type="button" class="chip' + (s.scene === scene ? ' on' : '') + '" data-scene="' + scene + '">' +
        (scene ? t('scene_' + scene) : t('all')) + '</button>';
    }).join('');

    // 標籤：可以點很多個
    const tagChips = store.tags().map(function (tag) {
      return '<button type="button" class="chip' + (s.tags.indexOf(tag.id) >= 0 ? ' on' : '') + '" data-tag="' + tag.id + '">' +
        esc(tr(tag.name)) + '</button>';
    }).join('');

    // 取件點：勾選
    const pickupChecks = store.pickupPoints().map(function (p) {
      return '<label class="check"><input type="checkbox" value="' + p.id + '"' + (s.pickup.indexOf(p.id) >= 0 ? ' checked' : '') + '>' +
        '<span>' + esc(tr(p.name)) + '</span></label>';
    }).join('');

    // 價格：下拉選單
    const priceOptions = PRICE_BANDS.map(function (b) {
      return '<option value="' + b[0] + '"' + (s.price === b[0] ? ' selected' : '') + '>' + t(b[1]) + '</option>';
    }).join('');

    const sortOptions = SORTS.map(function (o) {
      return '<option value="' + o[0] + '"' + (s.sort === o[0] ? ' selected' : '') + '>' + t(o[1]) + '</option>';
    }).join('');

    return '' +
      '<h1>' + t('browse_title') + '</h1>' +

      '<div class="search-box">' +
        icon('search') +
        '<input type="search" id="q" value="' + esc(s.q) + '" placeholder="' + t('search_placeholder') + '" autocomplete="off">' +
      '</div>' +

      '<div class="browse">' +
        // ----- 篩選（電腦：左邊；手機：點「篩選」才跳出來） -----
        '<aside class="filters" id="filters">' +
          '<div class="filters-head">' +
            '<strong>' + t('filter') + '</strong>' +
            '<button type="button" class="icon-btn" id="closeFilters" aria-label="close">' + icon('close') + '</button>' +
          '</div>' +
          '<div class="filter-group"><div class="filter-label">' + t('filter_scene') + '</div><div class="chips" id="sceneChips">' + sceneChips + '</div></div>' +
          '<div class="filter-group"><div class="filter-label">' + t('filter_tags') + '</div><div class="chips" id="tagChips">' + tagChips + '</div></div>' +
          '<div class="filter-group"><div class="filter-label">' + t('filter_pickup') + '</div><div id="pickupChecks">' + pickupChecks + '</div></div>' +
          '<div class="filter-group"><div class="filter-label">' + t('filter_price') + '</div><select id="price" class="select">' + priceOptions + '</select></div>' +
          '<div class="filters-foot">' +
            '<button type="button" class="btn secondary" id="clearFilters">' + t('clear_filters') + '</button>' +
            '<button type="button" class="btn only-mobile" id="showResults"></button>' +
          '</div>' +
        '</aside>' +

        // ----- 結果 -----
        '<section class="results">' +
          '<div class="results-bar">' +
            '<button type="button" class="btn secondary only-mobile" id="openFilters">' + icon('filter') + t('filter') + '<span class="badge" id="filterBadge"></span></button>' +
            '<span class="muted" id="foundText"></span>' +
            '<select id="sort" class="select" aria-label="' + t('sort') + '">' + sortOptions + '</select>' +
          '</div>' +
          '<div class="item-grid" id="results"></div>' +
        '</section>' +
      '</div>';
  },

  // 重新算結果、更新數字和網址（改篩選條件時呼叫，不重畫整頁，搜尋框才不會跳掉）
  refresh: function () {
    const items = this.filter();
    const n = this.activeCount();

    document.getElementById('results').innerHTML = items.length
      ? items.map(itemCard).join('')
      : '<p class="muted empty">' + t('no_results') + '</p>';
    document.getElementById('foundText').textContent = t('found', { n: items.length });
    document.getElementById('showResults').textContent = t('found', { n: items.length });

    const badge = document.getElementById('filterBadge');
    badge.textContent = n;
    badge.hidden = n === 0;

    this.writeState();
  },

  bind: function () {
    const self = this;
    const s = this.state;

    // 搜尋：打字就更新
    document.getElementById('q').oninput = function () {
      s.q = this.value.trim();
      self.refresh();
    };

    // 場景（單選）
    document.getElementById('sceneChips').onclick = function (e) {
      const chip = e.target.closest('[data-scene]');
      if (!chip) return;
      s.scene = chip.dataset.scene;
      this.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c === chip); });
      self.refresh();
    };

    // 標籤（可多選）：點一下選、再點一下取消
    document.getElementById('tagChips').onclick = function (e) {
      const chip = e.target.closest('[data-tag]');
      if (!chip) return;
      const id = chip.dataset.tag;
      const i = s.tags.indexOf(id);
      if (i >= 0) s.tags.splice(i, 1); else s.tags.push(id);
      chip.classList.toggle('on', i < 0);
      self.refresh();
    };

    // 取件點（勾選）
    document.getElementById('pickupChecks').onchange = function () {
      s.pickup = Array.from(this.querySelectorAll('input:checked')).map(function (el) { return el.value; });
      self.refresh();
    };

    document.getElementById('price').onchange = function () { s.price = this.value; self.refresh(); };
    document.getElementById('sort').onchange = function () { s.sort = this.value; self.refresh(); };

    // 清除篩選（保留搜尋字和排序）
    document.getElementById('clearFilters').onclick = function () {
      location.hash = '#/browse' + (s.q ? '?q=' + encodeURIComponent(s.q) : '');
    };

    // 手機版：打開、關閉篩選面板
    const panel = document.getElementById('filters');
    document.getElementById('openFilters').onclick = function () { panel.classList.add('open'); };
    document.getElementById('closeFilters').onclick = function () { panel.classList.remove('open'); };
    document.getElementById('showResults').onclick = function () { panel.classList.remove('open'); };

    this.refresh();
  },
};
