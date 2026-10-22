// =========================================================
// 主程式：用網址 # 後面的部分決定要顯示哪一頁
// 例如  #/                  → 首頁
//       #/browse?scene=...  → 找東西
//       #/item/i3           → 物品 i3 的詳細頁
// =========================================================

const app = document.getElementById('app');
let pageViews = 0;   // 這次打開網站後看了幾頁（物品頁的「返回」會用到）

// ---------- 每一頁 ----------
// 每頁都是一個物件：
//   render(參數, 網址條件) → 回傳要放進畫面的 HTML
//   bind()                 → 畫完之後綁按鈕（可以沒有）
// 頁面的程式放在 pages/ 資料夾
const pages = {
  home: HomePage,
  browse: BrowsePage,
  item: ItemPage,
  login: LoginPage,
  rent: RentPage,
  order: OrderDonePage,
  new: ListItemPage,
  me: MePage,
  about: AboutPage,
};

// 還沒做的頁面：顯示「這一頁會在階段 N 做」
function placeholderPage(phase) {
  return {
    render: function () {
      return '<div class="card placeholder">' +
               icon('hammer') +
               '<p class="muted">' + t('coming_soon', { n: phase }) + '</p>' +
             '</div>';
    },
  };
}

// ---------- 換頁 ----------
// 把網址拆開：'#/browse?scene=concert&q=手機' → { name: 'browse', param: undefined, query: { scene: 'concert', q: '手機' } }
function parseHash() {
  const hash = location.hash.replace(/^#\/?/, '');
  const qIndex = hash.indexOf('?');
  const path = qIndex >= 0 ? hash.slice(0, qIndex) : hash;
  const parts = path.split('/');

  const query = {};
  if (qIndex >= 0) {
    new URLSearchParams(hash.slice(qIndex + 1)).forEach(function (value, key) { query[key] = value; });
  }
  return { name: parts[0] || 'home', param: parts[1], query: query };
}

function render() {
  const route = parseHash();
  const page = pages[route.name] || pages.home;
  app.innerHTML = page.render(route.param, route.query);
  if (page.bind) page.bind();

  // 導覽列：目前這頁的按鈕亮起來（物品、租借頁算在「找東西」底下）
  const navName = ['item', 'rent', 'order'].indexOf(route.name) >= 0 ? 'browse' : route.name;
  document.querySelectorAll('[data-route]').forEach(function (a) {
    a.classList.toggle('active', a.dataset.route === navName);
  });

  pageViews++;
  window.scrollTo(0, 0);
}

// ---------- 右上角：目前登入的人 ----------
function updateUserButton() {
  const me = store.currentUser();
  const btn = document.getElementById('userBtn');
  btn.innerHTML = me
    ? '<span class="avatar mini">' + esc(me.name.charAt(0)) + '</span><span class="user-name">' + esc(me.name) + '</span>'
    : icon('user') + '<span>' + t('login_short') + '</span>';
}

// ---------- 語言切換 ----------
function updateLangLabel() {
  // 按鈕上顯示「要切換過去的語言」
  document.getElementById('langLabel').textContent = currentLang === 'zh' ? 'EN' : '中';
}
document.getElementById('langBtn').onclick = function () {
  setLang(currentLang === 'zh' ? 'en' : 'zh');
  applyI18n();
  updateLangLabel();
  updateUserButton();
  render();   // 重畫目前這一頁
};

// ---------- 開始 ----------
store.load();
drawIcons();
applyI18n();
updateLangLabel();
updateUserButton();
render();
window.addEventListener('hashchange', render);
