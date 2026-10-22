// =========================================================
// 存取資料（R9）
// 目前資料存在瀏覽器的 localStorage，不用資料庫
// 其他程式都只透過這裡拿資料、存資料
// → 之後要換成真的資料庫，只要改這個檔案就好（原則 4）
// =========================================================

// 資料在瀏覽器裡的名字。data.js 的格式有大改時把數字加 1，
// 瀏覽器就會丟掉舊格式、重新載入新的假資料（v2：物品加了標籤；v3：多了評價；v4：押金降低；v5：多了贊助；v6：成色、年份、訊息）
const STORE_KEY = 'shareu-data-v6';

const store = {
  data: null,   // 目前所有資料：{ users, items, orders, reviews, pickupPoints, currentUserId }

  // 打開網站時呼叫：瀏覽器裡有資料就讀出來，沒有就載入 data.js 的假資料
  load: function () {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        this.data = JSON.parse(saved);
        return;
      }
    } catch (e) {
      // 讀不到（例如無痕模式）就用假資料，只是重新整理後不會記住
    }
    this.reset();
  },

  // 把目前的資料存回瀏覽器
  save: function () {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  },

  // 恢復成 data.js 的假資料（「重設展示資料」按鈕）
  reset: function () {
    // 複製一份，避免改到 SEED 本身
    this.data = JSON.parse(JSON.stringify(SEED));
    this.data.currentUserId = null;   // 一開始沒有登入
    this.save();
  },

  // ---------- 讀資料 ----------
  items: function () { return this.data.items; },
  users: function () { return this.data.users; },
  pickupPoints: function () { return this.data.pickupPoints; },
  tags: function () { return this.data.tags; },
  donations: function () { return this.data.donations || []; },
  messages: function () { return this.data.messages || []; },

  // 一段對話的所有訊息（同一個物品＋同一個發問的人）
  thread: function (itemId, askerId) {
    return this.messages().filter(function (m) { return m.itemId === itemId && m.askerId === askerId; });
  },

  // 跟某人有關的所有對話（他是發問的人，或他是物主），最新的在前面
  // 回傳 [{ itemId, askerId, last }]
  threadsOf: function (userId) {
    const self = this;
    const map = {};
    this.messages().forEach(function (m) {
      const item = self.getItem(m.itemId);
      if (!item) return;
      if (m.askerId !== userId && item.ownerId !== userId) return;
      map[m.itemId + '|' + m.askerId] = { itemId: m.itemId, askerId: m.askerId, last: m };
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return a.last.createdAt < b.last.createdAt ? 1 : -1; });
  },
  getTag: function (id) { return this.data.tags.find(function (x) { return x.id === id; }); },

  getItem: function (id) { return this.data.items.find(function (x) { return x.id === id; }); },
  getUser: function (id) { return this.data.users.find(function (x) { return x.id === id; }); },
  getPickupPoint: function (id) { return this.data.pickupPoints.find(function (x) { return x.id === id; }); },

  // 某個物品的訂單（之後用來判斷哪些日期被租走了）
  ordersOfItem: function (itemId) {
    return this.data.orders.filter(function (o) { return o.itemId === itemId; });
  },

  // 還沒歸還的訂單（物品頁顯示「已被預約的日期」）
  bookingsOfItem: function (itemId) {
    return this.ordersOfItem(itemId).filter(function (o) { return o.status !== 'returned'; });
  },

  // 某個人收到的評價
  reviewsOf: function (userId) {
    return this.data.reviews.filter(function (r) { return r.toId === userId; });
  },

  // 目前登入的人（沒登入回傳 null）
  currentUser: function () {
    return this.data.currentUserId ? this.getUser(this.data.currentUserId) : null;
  },

  getUserByEmail: function (email) {
    email = email.toLowerCase();
    return this.data.users.find(function (x) { return x.email.toLowerCase() === email; });
  },

  getOrder: function (id) { return this.data.orders.find(function (x) { return x.id === id; }); },

  // 某人租過的訂單（新的在前面）
  ordersOfRenter: function (userId) {
    return this.data.orders.filter(function (o) { return o.renterId === userId; }).reverse();
  },

  // 某人上架的物品（新的在前面）
  itemsOfOwner: function (userId) {
    return this.data.items.filter(function (x) { return x.ownerId === userId; }).reverse();
  },

  // 這筆訂單，某人評過了沒
  hasReviewed: function (orderId, fromId) {
    return this.data.reviews.some(function (r) { return r.orderId === orderId && r.fromId === fromId; });
  },

  // ---------- 寫資料 ----------

  // 登入／切換身分（R5、R9）
  login: function (userId) {
    this.data.currentUserId = userId;
    this.save();
  },

  logout: function () {
    this.data.currentUserId = null;
    this.save();
  },

  // 第一次用學校信箱登入的人，幫他建一個帳號（已認證、還沒有評價）
  addUser: function (user) {
    user.id = 'u' + Date.now();
    this.data.users.push(user);
    this.save();
    return user;
  },

  // 成立訂單（R4）
  addOrder: function (order) {
    order.id = 'o' + Date.now();
    order.status = 'pending';
    order.createdAt = new Date().toISOString();
    this.data.orders.push(order);
    this.save();
    return order;
  },

  // 上架物品（R6）
  addItem: function (item) {
    item.id = 'i' + Date.now();
    this.data.items.push(item);
    this.save();
    return item;
  },

  // 訂單往下一個狀態走：待取件 → 租借中 → 已歸還（R7，展示用）
  advanceOrder: function (orderId) {
    const order = this.getOrder(orderId);
    const next = { pending: 'active', active: 'returned' }[order.status];
    if (next) {
      order.status = next;
      this.save();
    }
    return order;
  },

  // 送出一則訊息（R13）
  addMessage: function (message) {
    message.id = 'm' + Date.now() + Math.floor(Math.random() * 1000);
    message.createdAt = new Date().toISOString();
    if (!this.data.messages) this.data.messages = [];
    this.data.messages.push(message);
    this.save();
    return message;
  },

  // 贊助（R12，模擬）
  addDonation: function (donation) {
    donation.id = 'd' + Date.now();
    donation.createdAt = new Date().toISOString();
    if (!this.data.donations) this.data.donations = [];
    this.data.donations.push(donation);
    this.save();
    return donation;
  },

  // 留評價（R8），同時更新被評的人的平均分數
  addReview: function (review) {
    review.id = 'r' + Date.now();
    this.data.reviews.push(review);

    const user = this.getUser(review.toId);
    user.rating = (user.rating * user.reviewCount + review.stars) / (user.reviewCount + 1);
    user.reviewCount += 1;

    this.save();
    return review;
  },
};
