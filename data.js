// =========================================================
// 展示用的假資料（R9）
// 第一次打開網站時，store.js 會把這些複製到瀏覽器裡
// 之後網站上的新增、修改都存在瀏覽器，這個檔案本身不會被改
//
// 👉 這個檔案很適合你來改：物品、價格、說明、取件點都可以換
//    改完之後，到網站按「重設展示資料」才會看到新的內容
//
// 價格都是新台幣（NT$），pricePerDay = 每天租金、deposit = 原本押金
// 押金大約是物品價值的 5–10%，0 = 免押金。實際押金會依租客信用打折（見 docs/design.md 計價規則）
// =========================================================

const SEED = {

  // ---------- 取件點 ----------
  pickupPoints: [
    { id: 'p1', name: { zh: '中正圖書館 智慧置物櫃', en: 'Chung-Cheng Library Smart Lockers' } },
    { id: 'p2', name: { zh: '達賢圖書館 智慧置物櫃', en: 'Dah Hsian Library Smart Lockers' } },
    { id: 'p3', name: { zh: '學生活動中心 學生會辦公室', en: 'Student Union Office, Activity Center' } },
    { id: 'p4', name: { zh: '自強宿舍區 置物櫃', en: 'Tzu-Chiang Dorm Lockers' } },
  ],

  // ---------- 標籤（R2）----------
  // 每個物品的 tags 裡放這裡的 id；想加新標籤就在這裡加一行
  tags: [
    { id: 'beginner',    name: { zh: '新手友善', en: 'Beginner friendly' } },
    { id: 'accessories', name: { zh: '附配件',   en: 'Accessories included' } },
    { id: 'long-term',   name: { zh: '可長租',   en: 'Long-term OK' } },
    { id: 'tutorial',    name: { zh: '可教學',   en: 'Owner can teach' } },
    { id: 'near-dorm',   name: { zh: '近宿舍',   en: 'Near dorms' } },
    { id: 'official',    name: { zh: 'ShareU 官方', en: 'ShareU Official' } },
  ],

  // ---------- 使用者 ----------
  // 前四位是 persona，展示時可以切換成他們
  // verified = 有沒有通過學校信箱認證；rating = 平均評分；reviewCount = 評價數
  users: [
    { id: 'u1', name: 'Mia',   dept: { zh: '新聞系 大二', en: 'Journalism, Year 2' },  email: 'mia@nccu.edu.tw',   verified: true, rating: 4.9, reviewCount: 8,  persona: true },
    { id: 'u2', name: 'Kevin', dept: { zh: '企管系 大三', en: 'Business, Year 3' },    email: 'kevin@nccu.edu.tw', verified: true, rating: 4.7, reviewCount: 5,  persona: true },
    { id: 'u3', name: 'Amy',   dept: { zh: '大一', en: 'Freshman' },                    email: 'amy@nccu.edu.tw',   verified: true, rating: 0,   reviewCount: 0,  persona: true },
    { id: 'u4', name: 'Jason', dept: { zh: '應屆畢業生', en: 'Graduating Senior' },     email: 'jason@nccu.edu.tw', verified: true, rating: 4.8, reviewCount: 23, persona: true },

    // 其他物主
    { id: 'u5', name: 'Ethan', dept: { zh: '廣電系 大四', en: 'Radio & TV, Year 4' },   email: 'ethan@nccu.edu.tw', verified: true, rating: 4.9, reviewCount: 31 },
    { id: 'u6', name: 'Lin',   dept: { zh: '外交系 應屆畢業生', en: 'Diplomacy, Graduating Senior' }, email: 'lin@nccu.edu.tw', verified: true, rating: 4.6, reviewCount: 12 },

    // 平台自己（演唱會手機的物主）
    { id: 'shareu', name: 'ShareU', dept: { zh: '官方', en: 'Official' }, email: 'hello@shareu.tw', verified: true, rating: 5.0, reviewCount: 46, official: true },
  ],

  // ---------- 物品 ----------
  // scene：concert 演唱會 / travel 出國交換與旅行 / project 課業作品
  // category：phone 手機 / optics 望遠鏡 / power 電源 / luggage 行李箱 / adapter 轉接頭
  //           action-cam 運動攝影機 / camera 相機 / audio 收音 / light 燈光 / support 腳架穩定器 / drone 空拍機
  // official：true = ShareU 平台自己的（R2「ShareU 官方」標籤）
  // minRenterRating：物主設定「只租給評分幾分以上的人」，0 = 不限（R6）
  // tags：標籤 id，對應上面的 tags 清單
  // photo：之後放照片的檔名（放在 img/），空的就先顯示類別 icon
  items: [
    // 演唱會
    { id: 'i1', ownerId: 'shareu', scene: 'concert', category: 'phone', official: true,
      title: { zh: 'Samsung Galaxy S25 Ultra 百倍變焦手機', en: 'Samsung Galaxy S25 Ultra (100x zoom)' },
      desc:  { zh: '後排也能拍清楚舞台。附原廠充電線和手機殼，出租前都會重置。', en: 'Clear stage shots even from the back rows. Comes with charger and case, factory reset before every rental.' },
      pricePerDay: 350, deposit: 2000, pickupPoints: ['p1', 'p3'], minRenterRating: 0, tags: ['official', 'accessories', 'beginner'], photo: '' },
    { id: 'i2', ownerId: 'shareu', scene: 'concert', category: 'phone', official: true,
      title: { zh: 'vivo X200 Pro 長焦手機', en: 'vivo X200 Pro (telephoto)' },
      desc:  { zh: '演唱會神機，夜拍和長焦都很強。附行動電源一顆。', en: 'Great telephoto and night shots. Includes one power bank.' },
      pricePerDay: 300, deposit: 2000, pickupPoints: ['p1', 'p3'], minRenterRating: 0, tags: ['official', 'accessories'], photo: '' },
    { id: 'i3', ownerId: 'u6', scene: 'concert', category: 'optics',
      title: { zh: 'Nikon 10x25 望遠鏡', en: 'Nikon 10x25 Binoculars' },
      desc:  { zh: '輕巧好帶，看偶像表情剛剛好。', en: 'Light and compact, perfect for seeing faces on stage.' },
      pricePerDay: 60, deposit: 200, pickupPoints: ['p2'], minRenterRating: 0, tags: ['beginner'], photo: '' },
    { id: 'i4', ownerId: 'u2', scene: 'concert', category: 'power',
      title: { zh: 'Anker 20000mAh 行動電源', en: 'Anker 20000mAh Power Bank' },
      desc:  { zh: '可以充手機兩到三次，演唱會排隊整天也不怕。', en: 'Charges a phone 2–3 times. Good for a full day of queueing.' },
      pricePerDay: 30, deposit: 0, pickupPoints: ['p4'], minRenterRating: 0, tags: ['near-dorm'], photo: '' },

    // 出國交換與旅行
    { id: 'i5', ownerId: 'u6', scene: 'travel', category: 'luggage',
      title: { zh: '28 吋大行李箱', en: '28" Large Suitcase' },
      desc:  { zh: '去年交換用過一次，輪子很順，有 TSA 鎖。適合一學期的長租。', en: 'Used once for my exchange. Smooth wheels, TSA lock. Good for a full semester.' },
      pricePerDay: 15, deposit: 300, pickupPoints: ['p2', 'p3'], minRenterRating: 0, tags: ['long-term'], photo: '' },
    { id: 'i6', ownerId: 'u4', scene: 'travel', category: 'luggage',
      title: { zh: '24 吋登機行李箱', en: '24" Carry-on Suitcase' },
      desc:  { zh: '短程旅行剛好，很輕。', en: 'Light, great for short trips.' },
      pricePerDay: 12, deposit: 300, pickupPoints: ['p1'], minRenterRating: 0, tags: ['long-term'], photo: '' },
    { id: 'i7', ownerId: 'u6', scene: 'travel', category: 'adapter',
      title: { zh: '萬國旅行轉接頭（含 USB-C）', en: 'Universal Travel Adapter (with USB-C)' },
      desc:  { zh: '歐洲、日本、美國都能用。', en: 'Works in Europe, Japan and the US.' },
      pricePerDay: 5, deposit: 0, pickupPoints: ['p2', 'p3'], minRenterRating: 0, tags: ['long-term', 'beginner'], photo: '' },
    { id: 'i8', ownerId: 'u4', scene: 'travel', category: 'action-cam',
      title: { zh: 'GoPro HERO13 Black', en: 'GoPro HERO13 Black' },
      desc:  { zh: '附防水殼、自拍棒和兩顆電池。', en: 'Includes waterproof housing, selfie stick and two batteries.' },
      pricePerDay: 150, deposit: 1000, pickupPoints: ['p1'], minRenterRating: 4, tags: ['accessories', 'tutorial'], photo: '' },
    { id: 'i9', ownerId: 'u5', scene: 'travel', category: 'action-cam',
      title: { zh: 'Insta360 X4 全景相機', en: 'Insta360 X4 360° Camera' },
      desc:  { zh: '拍旅行 vlog 超方便，事後再選角度。', en: 'Shoot first, choose the angle later. Great for travel vlogs.' },
      pricePerDay: 180, deposit: 1000, pickupPoints: ['p1', 'p2'], minRenterRating: 0, tags: ['tutorial'], photo: '' },

    // 課業作品
    { id: 'i10', ownerId: 'u4', scene: 'project', category: 'camera',
      title: { zh: 'Sony A7 IV 全片幅相機＋24-70mm 鏡頭', en: 'Sony A7 IV + 24-70mm Lens' },
      desc:  { zh: '社團活動用的主力機，保養得很好。只租給評價好的同學。', en: 'My main camera from club events, well kept. Only for renters with good reviews.' },
      pricePerDay: 450, deposit: 3000, pickupPoints: ['p1'], minRenterRating: 4, tags: ['accessories'], photo: '' },
    { id: 'i11', ownerId: 'u5', scene: 'project', category: 'camera',
      title: { zh: 'Canon EOS R50 入門相機', en: 'Canon EOS R50 (entry level)' },
      desc:  { zh: '新手也好上手，可以問我怎麼用。', en: 'Easy for beginners. Happy to show you how to use it.' },
      pricePerDay: 250, deposit: 1500, pickupPoints: ['p2'], minRenterRating: 0, tags: ['beginner', 'tutorial'], photo: '' },
    { id: 'i12', ownerId: 'u5', scene: 'project', category: 'audio',
      title: { zh: 'RODE Wireless GO II 無線麥克風', en: 'RODE Wireless GO II Mic' },
      desc:  { zh: '一對二，訪談、短片收音都很清楚。', en: 'Dual channel. Clear sound for interviews and short films.' },
      pricePerDay: 120, deposit: 500, pickupPoints: ['p2'], minRenterRating: 0, tags: ['tutorial'], photo: '' },
    { id: 'i13', ownerId: 'u5', scene: 'project', category: 'light',
      title: { zh: 'Godox LED 補光燈（含燈架）', en: 'Godox LED Light (with stand)' },
      desc:  { zh: '可調色溫，室內拍片必備。', en: 'Adjustable color temperature. Essential for indoor shoots.' },
      pricePerDay: 80, deposit: 300, pickupPoints: ['p2', 'p3'], minRenterRating: 0, tags: ['accessories'], photo: '' },
    { id: 'i14', ownerId: 'u1', scene: 'project', category: 'support',
      title: { zh: '相機三腳架', en: 'Camera Tripod' },
      desc:  { zh: '最高 160 公分，手機夾也附上了。', en: 'Up to 160 cm, phone clamp included.' },
      pricePerDay: 30, deposit: 0, pickupPoints: ['p4'], minRenterRating: 0, tags: ['near-dorm', 'accessories', 'beginner'], photo: '' },
    { id: 'i15', ownerId: 'u2', scene: 'project', category: 'support',
      title: { zh: 'DJI Osmo Mobile 手機穩定器', en: 'DJI Osmo Mobile Gimbal' },
      desc:  { zh: '用手機拍也能很穩。', en: 'Smooth footage, even on a phone.' },
      pricePerDay: 80, deposit: 300, pickupPoints: ['p4'], minRenterRating: 0, tags: ['near-dorm'], photo: '' },
    { id: 'i16', ownerId: 'u4', scene: 'project', category: 'drone',
      title: { zh: 'DJI Mini 4 Pro 空拍機', en: 'DJI Mini 4 Pro Drone' },
      desc:  { zh: '畢展、社團影片的空拍鏡頭。需要評分 4.5 以上。', en: 'Aerial shots for grad shows and club videos. Rating 4.5+ required.' },
      pricePerDay: 400, deposit: 2500, pickupPoints: ['p1'], minRenterRating: 4.5, tags: ['accessories'], photo: '' },
  ],

  // ---------- 訂單 ----------
  // status：pending 待取件 / active 租借中 / returned 已歸還
  // 天數 = 結束日 − 開始日（例如週五取、週日還 = 2 天）
  // deposit 是打折後實際收的押金（例：GoPro 原本 1,000，Kevin 4.7 分 × 0.5、加購保障再 × 0.5 = 250）
  // o1：已經完成的一筆，讓評價有東西可以顯示
  // o2：Mia 已經預約了演唱會手機，物品頁會顯示這段日期被預約
  orders: [
    { id: 'o1', itemId: 'i8', renterId: 'u2', start: '2026-09-01', end: '2026-09-08', pickupPoint: 'p1',
      protection: true, rent: 1050, serviceFee: 53, protectionFee: 105, deposit: 250, status: 'returned' },
    { id: 'o2', itemId: 'i1', renterId: 'u1', start: '2026-10-30', end: '2026-11-01', pickupPoint: 'p1',
      protection: true, rent: 700, serviceFee: 35, protectionFee: 70, deposit: 500, status: 'pending' },
  ],

  // ---------- 評價 ----------
  reviews: [
    { id: 'r1', orderId: 'o1', fromId: 'u2', toId: 'u4', stars: 5,
      text: { zh: 'GoPro 很新，學長還教我怎麼設定，超推！', en: 'GoPro was like new and he showed me the settings. Highly recommend!' } },
    { id: 'r2', orderId: 'o1', fromId: 'u4', toId: 'u2', stars: 5,
      text: { zh: '準時歸還，東西保持得很好。', en: 'Returned on time and in great condition.' } },

    // 下面這些是「以前的評價」，讓物主頁面不會空空的（orderId 是 null，因為沒有對應的訂單）
    { id: 'r3', orderId: null, fromId: 'u1', toId: 'shareu', stars: 5,
      text: { zh: '後排也拍得到偶像的表情，置物櫃取件超方便！', en: 'Got clear shots from the back row. Locker pickup was so easy!' } },
    { id: 'r4', orderId: null, fromId: 'u3', toId: 'shareu', stars: 5,
      text: { zh: '手機很乾淨，電池也很耐用。', en: 'Phone was spotless and the battery lasted all night.' } },
    { id: 'r5', orderId: null, fromId: 'u1', toId: 'u5', stars: 5,
      text: { zh: 'Ethan 很有耐心教我怎麼收音，作業順利完成。', en: 'Ethan patiently showed me how to record audio. Project done!' } },
    { id: 'r6', orderId: null, fromId: 'u2', toId: 'u6', stars: 5,
      text: { zh: '行李箱很新，學姊還分享了交換的經驗。', en: 'Suitcase was like new, and she shared tips about exchange life.' } },
    { id: 'r7', orderId: null, fromId: 'u5', toId: 'u4', stars: 4,
      text: { zh: '相機狀況很好，交接時間有點難約。', en: 'Camera in great shape, just a bit hard to schedule the handover.' } },
    { id: 'r8', orderId: null, fromId: 'u4', toId: 'u2', stars: 4,
      text: { zh: '溝通順利，下次還會租給他。', en: 'Easy to work with. Would rent to him again.' } },
  ],

  // ---------- 贊助（R12，模擬）----------
  // 先放幾筆，「關於我們」頁的支持人數才不會是 0
  donations: [
    { id: 'd1', amount: 100, name: '大一新生', message: '加油！期待上線' },
    { id: 'd2', amount: 300, name: 'Lin',      message: '畢業前終於可以把行李箱租出去了' },
    { id: 'd3', amount: 50,  name: '',         message: '' },
    { id: 'd4', amount: 500, name: '熱音社',    message: '社團器材也想上架！' },
  ],
};