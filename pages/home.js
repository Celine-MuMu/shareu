// =========================================================
// 首頁（R1）：輪播大圖＋標語＋搜尋框、三大場景、熱門物品、怎麼租
// =========================================================

// 輪播大圖：三大場景各一張（圖片來自 Unsplash，可以免費商用）
// 👉 想換成自己的照片：把照片放進 img/ 資料夾，把 image 改成例如 'img/concert.jpg'
const HERO_SLIDES = [
  { scene: 'concert', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600&q=75&auto=format&fit=crop' },
  { scene: 'travel',  image: 'https://images.unsplash.com/photo-1504150558240-0b4fd8946624?w=1600&q=75&auto=format&fit=crop' },
  { scene: 'project', image: 'https://images.unsplash.com/photo-1632187981988-40f3cbaeef5e?w=1600&q=75&auto=format&fit=crop' },
];
const HERO_INTERVAL = 4000;   // 每幾毫秒換一張（4000 = 4 秒）

const HomePage = {

  render: function () {
    // 三大場景的入口
    const scenes = ['concert', 'travel', 'project'].map(function (scene) {
      return '<a class="scene-card scene-' + scene + '" href="#/browse?scene=' + scene + '">' +
        '<div class="scene-icon">' + icon(scene) + '</div>' +
        '<div>' +
          '<div class="scene-name">' + t('scene_' + scene) + '</div>' +
          '<div class="muted small">' + t('scene_' + scene + '_desc') + '</div>' +
        '</div>' +
        icon('arrow') +
      '</a>';
    }).join('');

    // 熱門物品：先挑物主評分最高的 4 個
    // 👉 想自己指定熱門物品，可以改成例如 ['i1', 'i5', 'i10', 'i12'].map(store.getItem, store)
    const featured = store.items().slice()
      .sort(function (a, b) { return store.getUser(b.ownerId).reviewCount - store.getUser(a.ownerId).reviewCount; })
      .slice(0, 4);

    return '' +
      // 上方：輪播大圖，標語和搜尋框疊在上面
      '<section class="hero" id="hero">' +
        '<div class="slides" id="slides">' +
          HERO_SLIDES.map(function (sl, i) {
            return '<a class="slide scene-' + sl.scene + (i === 0 ? ' on' : '') + '" href="#/browse?scene=' + sl.scene + '">' +
              '<div class="slide-img" style="background-image:url(\'' + sl.image + '\')"></div>' +
              '<div class="slide-caption">' +
                '<span class="tag scene-' + sl.scene + '">' + t('scene_' + sl.scene) + '</span>' +
                '<span>' + t('hero_' + sl.scene) + '</span>' +
              '</div>' +
            '</a>';
          }).join('') +
        '</div>' +
        '<div class="hero-content">' +
          '<h1 class="slogan">' + t('home_title') + '</h1>' +
          '<p class="lead">' + t('home_lead') + '</p>' +
          '<form class="search-box" id="homeSearch">' +
            icon('search') +
            '<input type="search" name="q" placeholder="' + t('search_placeholder') + '" autocomplete="off">' +
            '<button class="btn" type="submit">' + t('search_btn') + '</button>' +
          '</form>' +
        '</div>' +
        '<div class="dots" id="dots">' +
          HERO_SLIDES.map(function (sl, i) {
            return '<button type="button" data-go="' + i + '"' + (i === 0 ? ' class="on"' : '') + ' aria-label="' + t('scene_' + sl.scene) + '"></button>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<h2>' + t('scenes_title') + '</h2>' +
      '<div class="scene-grid">' + scenes + '</div>' +

      '<div class="section-head">' +
        '<h2>' + t('featured_title') + '</h2>' +
        '<a href="#/browse" class="link">' + t('see_all') + icon('arrow') + '</a>' +
      '</div>' +
      '<div class="item-grid">' + featured.map(itemCard).join('') + '</div>' +

      '<h2>' + t('how_title') + '</h2>' +
      '<ol class="how">' +
        '<li><span>1</span>' + t('how_1') + '</li>' +
        '<li><span>2</span>' + t('how_2') + '</li>' +
        '<li><span>3</span>' + t('how_3') + '</li>' +
      '</ol>' +

      // 展示用：上台前一鍵恢復資料（R9）
      '<div class="demo-tools">' +
        '<span class="muted small">' + t('demo_title') + '</span>' +
        '<button class="btn secondary small" id="resetBtn">' + icon('reset') + t('reset_data') + '</button>' +
      '</div>';
  },

  timer: null,   // 自動換圖的計時器
  current: 0,    // 現在是第幾張

  // 換到第 n 張
  goTo: function (n) {
    const count = HERO_SLIDES.length;
    this.current = (n + count) % count;
    const slides = document.getElementById('slides');
    if (!slides) return false;   // 已經離開首頁了
    slides.style.transform = 'translateX(-' + (this.current * 100) + '%)';
    slides.querySelectorAll('.slide').forEach(function (el, i) { el.classList.toggle('on', i === HomePage.current); });
    document.querySelectorAll('#dots button').forEach(function (el, i) { el.classList.toggle('on', i === HomePage.current); });
    return true;
  },

  // 重新開始倒數（手動切換之後，從頭算 4 秒）
  restartTimer: function () {
    const self = this;
    clearInterval(this.timer);
    // 系統設定「減少動態效果」的人，就不自動換
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.timer = setInterval(function () {
      if (document.hidden) return;                          // 分頁在背景時不換
      if (!self.goTo(self.current + 1)) clearInterval(self.timer);   // 離開首頁就停
    }, HERO_INTERVAL);
  },

  // 畫完之後綁按鈕
  bind: function () {
    const self = this;

    // 輪播：從第 1 張開始、小圓點可以點、手機可以左右滑
    this.current = 0;
    this.restartTimer();
    document.getElementById('dots').onclick = function (e) {
      const dot = e.target.closest('[data-go]');
      if (!dot) return;
      self.goTo(Number(dot.dataset.go));
      self.restartTimer();
    };
    const hero = document.getElementById('hero');
    let startX = null, moved = false;
    hero.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; moved = false; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) {
        moved = true;
        self.goTo(self.current + (dx < 0 ? 1 : -1));
        self.restartTimer();
      }
      startX = null;
    });
    // 滑動的時候不要順便點進去
    hero.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);

    document.getElementById('homeSearch').onsubmit = function (e) {
      e.preventDefault();
      const q = this.q.value.trim();
      location.hash = '#/browse' + (q ? '?q=' + encodeURIComponent(q) : '');
    };

    document.getElementById('resetBtn').onclick = function () {
      if (confirm(t('reset_confirm'))) {
        store.reset();
        render();
      }
    };
  },
};
