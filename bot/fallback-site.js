/**
 * Встроенный запасной сайт.
 * Используется, если в public/ нет файла index.html.
 * Получает данные через /api/rooms, /api/gallery, /api/contacts.
 */

const SITE_HTML = `<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>🏡 Гостевой дом Голубицкая — отдых у Азовского моря</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --amber:#f59e0b;--amber-dark:#d97706;--amber-light:#fef3c7;
    --dark:#0d1b2a;--text:#1e293b;--muted:#64748b;--bg:#faf8f5;
  }
  html{scroll-behavior:smooth}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased}
  img{max-width:100%;display:block}
  a{color:inherit;text-decoration:none}

  /* HEADER */
  header{position:fixed;top:0;left:0;right:0;z-index:50;
    background:rgba(255,255,255,.95);backdrop-filter:blur(20px);
    box-shadow:0 1px 0 rgba(0,0,0,.05);transition:.3s}
  header.transparent{background:transparent;box-shadow:none}
  header.transparent .nav-link,header.transparent .logo{color:#fff}
  .nav-inner{max-width:1200px;margin:0 auto;padding:18px 24px;
    display:flex;align-items:center;justify-content:space-between}
  .logo{font-weight:700;font-size:18px;color:var(--text);transition:.3s}
  .nav-links{display:flex;gap:32px;align-items:center}
  .nav-link{font-size:14px;font-weight:500;color:var(--muted);cursor:pointer;transition:.3s}
  .nav-link:hover{color:var(--amber)}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;
    border-radius:999px;font-weight:600;font-size:14px;cursor:pointer;
    border:none;transition:.3s;text-transform:uppercase;letter-spacing:.05em}
  .btn-primary{background:var(--amber);color:#fff;box-shadow:0 4px 16px rgba(245,158,11,.3)}
  .btn-primary:hover{background:var(--amber-dark);transform:translateY(-2px);box-shadow:0 8px 24px rgba(245,158,11,.4)}
  .btn-ghost{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.4);backdrop-filter:blur(10px)}
  .btn-ghost:hover{background:rgba(255,255,255,.2)}
  .burger{display:none;background:none;border:none;color:var(--text);cursor:pointer;font-size:24px}

  /* HERO */
  .hero{position:relative;height:100vh;min-height:600px;display:flex;align-items:center;
    justify-content:center;overflow:hidden;color:#fff;text-align:center;padding:0 20px}
  .hero::before{content:"";position:absolute;inset:0;
    background:linear-gradient(135deg,#0d1b2a 0%,#1b3a4b 100%);z-index:-2}
  .hero img.hero-bg{position:absolute;inset:0;width:100%;height:100%;
    object-fit:cover;z-index:-2;opacity:.5;animation:zoom 20s ease-in-out infinite alternate}
  .hero::after{content:"";position:absolute;inset:0;
    background:linear-gradient(to bottom,rgba(13,27,42,.6) 0%,rgba(13,27,42,.3) 50%,rgba(13,27,42,.85) 100%);z-index:-1}
  @keyframes zoom{from{transform:scale(1)}to{transform:scale(1.15)}}
  .hero-content{max-width:900px;animation:fadeUp 1s cubic-bezier(.16,1,.3,1)}
  @keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
  .badge{display:inline-block;padding:8px 20px;border-radius:999px;
    border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);
    font-size:12px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;backdrop-filter:blur(10px)}
  .hero h1{font-size:clamp(40px,8vw,96px);font-weight:700;line-height:1.05;
    letter-spacing:-.04em;margin:24px 0}
  .hero h1 .accent{background:linear-gradient(90deg,#fcd34d,#fbbf24,#f59e0b);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .hero p{font-size:clamp(16px,2vw,22px);color:rgba(255,255,255,.85);max-width:640px;margin:0 auto 32px}
  .hero-buttons{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
  .scroll-down{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);
    color:rgba(255,255,255,.5);font-size:32px;animation:bounce 2s infinite}
  @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-10px)}}

  /* SECTIONS */
  section{padding:100px 24px;opacity:0;transform:translateY(40px);transition:1s cubic-bezier(.16,1,.3,1)}
  section.visible{opacity:1;transform:translateY(0)}
  .container{max-width:1200px;margin:0 auto}
  .section-tag{font-size:12px;font-weight:700;color:var(--amber);letter-spacing:.3em;text-transform:uppercase}
  .section-title{font-size:clamp(32px,5vw,56px);font-weight:700;letter-spacing:-.04em;
    margin:16px 0 24px;line-height:1.1}
  .section-desc{font-size:18px;color:var(--muted);max-width:600px;margin:0 auto}

  /* ABOUT */
  .about{background:var(--bg)}
  .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
  .about-img{position:relative}
  .about-img img{aspect-ratio:4/5;object-fit:cover;border-radius:24px;
    box-shadow:0 24px 48px rgba(0,0,0,.15)}
  .rating-badge{position:absolute;bottom:-20px;left:-20px;background:#fff;
    padding:20px;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.1)}
  .rating-badge .rate{font-size:18px;font-weight:700;color:var(--amber)}
  .stats{display:flex;gap:32px;margin-top:32px}
  .stat .num{font-size:32px;font-weight:700;color:var(--amber)}
  .stat .lbl{font-size:14px;color:var(--muted)}

  /* AMENITIES */
  .amenities{background:#fff}
  .amenities-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
    gap:24px;margin-top:60px}
  .amenity{padding:32px;background:var(--bg);border-radius:20px;
    transition:.4s;border:1px solid transparent}
  .amenity:hover{transform:translateY(-8px);box-shadow:0 24px 48px rgba(245,158,11,.15);
    border-color:rgba(245,158,11,.2)}
  .amenity .icon{font-size:40px;margin-bottom:20px}
  .amenity h3{font-size:20px;font-weight:700;margin-bottom:12px}
  .amenity p{color:var(--muted);font-size:15px}

  /* ROOMS */
  .rooms{background:var(--bg)}
  .rooms-header{display:flex;justify-content:space-between;align-items:end;flex-wrap:wrap;gap:24px;margin-bottom:60px}
  .rooms-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px}
  .room-card{background:#fff;border-radius:24px;overflow:hidden;
    box-shadow:0 4px 16px rgba(0,0,0,.06);transition:.4s;display:flex;flex-direction:column;cursor:pointer}
  .room-card:hover{transform:translateY(-8px);box-shadow:0 24px 48px rgba(0,0,0,.12)}
  .room-img{position:relative;aspect-ratio:4/3;overflow:hidden}
  .room-img img{width:100%;height:100%;object-fit:cover;transition:.6s}
  .room-card:hover .room-img img{transform:scale(1.08)}
  .room-status{position:absolute;top:16px;right:16px;padding:6px 14px;
    border-radius:999px;font-size:12px;font-weight:700;color:#fff;backdrop-filter:blur(10px)}
  .room-status.free{background:#10b981}
  .room-status.busy{background:#f43f5e}
  .room-capacity{position:absolute;top:16px;left:16px;padding:6px 14px;
    border-radius:999px;font-size:12px;font-weight:700;
    background:rgba(255,255,255,.9);color:var(--text);backdrop-filter:blur(10px)}
  .room-body{padding:24px;flex:1;display:flex;flex-direction:column}
  .room-body h3{font-size:20px;font-weight:700;margin-bottom:8px}
  .room-body .desc{color:var(--muted);font-size:14px;flex:1;margin-bottom:16px;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .room-amenities{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
  .room-amenities span{padding:4px 10px;background:var(--amber-light);
    color:var(--amber-dark);font-size:11px;font-weight:600;border-radius:999px}
  .room-footer{display:flex;justify-content:space-between;align-items:end;border-top:1px solid #f1f5f9;padding-top:16px}
  .room-price{font-size:24px;font-weight:700;color:var(--amber)}
  .room-price small{font-size:12px;font-weight:400;color:var(--muted);display:block}
  .room-book{padding:10px 20px;background:var(--dark);color:#fff;border:none;
    border-radius:999px;font-weight:600;font-size:13px;cursor:pointer;transition:.3s}
  .room-book:hover{background:var(--amber)}
  .room-book:disabled{background:#cbd5e1;color:#fff;cursor:not-allowed}

  /* GALLERY */
  .gallery{background:#fff}
  .gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:60px}
  .gallery-item{position:relative;aspect-ratio:4/3;overflow:hidden;border-radius:20px;
    box-shadow:0 4px 16px rgba(0,0,0,.06);cursor:pointer}
  .gallery-item:first-child{grid-column:span 2;aspect-ratio:16/8}
  @media(max-width:640px){.gallery-item:first-child{grid-column:span 1;aspect-ratio:4/3}}
  .gallery-item img{width:100%;height:100%;object-fit:cover;transition:.6s}
  .gallery-item:hover img{transform:scale(1.06)}
  .gallery-item .caption{position:absolute;inset:auto 0 0 0;padding:20px;color:#fff;
    background:linear-gradient(transparent,rgba(0,0,0,.7));font-weight:600;
    opacity:0;transition:.3s}
  .gallery-item:hover .caption{opacity:1}

  /* CONTACTS */
  .contacts{background:var(--dark);color:#fff;padding-bottom:40px}
  .contacts .section-tag{color:#fbbf24}
  .contacts-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
  .contact-item{display:flex;align-items:center;gap:16px;padding:16px 0}
  .contact-item .ic{font-size:28px}
  .contact-item a{font-weight:600;font-size:18px}
  .contact-item a:hover{color:var(--amber)}
  .map-box{aspect-ratio:4/3;background:rgba(255,255,255,.05);border-radius:24px;overflow:hidden}
  .map-box iframe{width:100%;height:100%;border:0;filter:invert(.9) hue-rotate(180deg)}

  /* CTA */
  .cta{background:linear-gradient(135deg,#fbbf24,#d97706);color:#fff;text-align:center;
    padding:100px 24px;position:relative;overflow:hidden}
  .cta::before,.cta::after{content:"";position:absolute;border-radius:50%;background:rgba(255,255,255,.1)}
  .cta::before{width:400px;height:400px;top:-200px;left:-200px}
  .cta::after{width:500px;height:500px;bottom:-250px;right:-250px}
  .cta-inner{position:relative;max-width:700px;margin:0 auto}
  .cta h2{font-size:clamp(32px,5vw,56px);font-weight:700;margin-bottom:16px}
  .cta p{font-size:18px;opacity:.9;margin-bottom:32px}
  .btn-white{background:#fff;color:var(--text);padding:18px 36px;font-size:14px}
  .btn-white:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,.2)}

  /* FOOTER */
  footer{background:var(--dark);padding:32px 24px;text-align:center;
    color:rgba(255,255,255,.4);font-size:14px;border-top:1px solid rgba(255,255,255,.05)}
  footer a{color:rgba(255,255,255,.6)}
  footer a:hover{color:var(--amber)}

  /* MODAL */
  .modal-bg{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.7);
    backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:20px}
  .modal-bg.open{display:flex}
  .modal{background:#fff;border-radius:24px;padding:40px;max-width:440px;width:100%;
    position:relative;animation:scaleIn .3s cubic-bezier(.16,1,.3,1)}
  @keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
  .modal-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;
    background:#f1f5f9;border:none;font-size:18px;cursor:pointer;transition:.3s}
  .modal-close:hover{background:#e2e8f0}
  .modal-icon{width:60px;height:60px;border-radius:18px;background:var(--amber);
    display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 20px}
  .modal h3{text-align:center;font-size:24px;font-weight:700;margin-bottom:8px}
  .modal .room-title{text-align:center;color:var(--amber);font-weight:600;font-size:14px;margin-bottom:8px}
  .modal-text{text-align:center;color:var(--muted);font-size:14px;margin-bottom:24px}
  .contact-channels{display:flex;flex-direction:column;gap:12px}
  .channel{display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:16px;
    color:#fff;text-decoration:none;transition:.3s;font-weight:600}
  .channel:hover{transform:scale(1.02)}
  .channel.phone{background:#10b981}
  .channel.wa{background:#22c55e}
  .channel.tg{background:#0ea5e9}
  .channel.vk{background:#2563eb}
  .channel .ic{font-size:24px}
  .channel .info{flex:1}
  .channel .info b{display:block}
  .channel .info small{opacity:.85;font-size:13px;font-weight:400}

  /* MOBILE */
  @media(max-width:768px){
    .nav-links{display:none}
    .burger{display:block}
    .nav-links.open{display:flex;position:absolute;top:100%;left:0;right:0;
      background:#fff;flex-direction:column;padding:24px;gap:16px;align-items:flex-start;
      box-shadow:0 8px 24px rgba(0,0,0,.1)}
    header.transparent .nav-links.open .nav-link{color:var(--text)}
    .about-grid,.contacts-grid{grid-template-columns:1fr;gap:40px}
    .rating-badge{left:auto;right:-10px;bottom:-10px}
    section{padding:60px 20px}
  }
</style>
</head>
<body>

<header id="header" class="transparent">
  <div class="nav-inner">
    <a class="logo" href="#hero">🏡 Гостевой дом</a>
    <nav class="nav-links" id="navLinks">
      <a class="nav-link" onclick="scrollTo2('#about')">О доме</a>
      <a class="nav-link" onclick="scrollTo2('#rooms')">Номера</a>
      <a class="nav-link" onclick="scrollTo2('#gallery')">Галерея</a>
      <a class="nav-link" onclick="scrollTo2('#contacts')">Контакты</a>
      <button class="btn btn-primary" onclick="openBooking()">Забронировать</button>
    </nav>
    <button class="burger" onclick="toggleMenu()">☰</button>
  </div>
</header>

<section class="hero" id="hero">
  <img class="hero-bg" src="/images/hero.jpg" alt="" onerror="this.style.display='none'">
  <div class="hero-content">
    <span class="badge">Станица Голубицкая · Азовское море</span>
    <h1>Гостевой дом<br><span class="accent">у самого моря</span></h1>
    <p>Семейный отдых на Азовском побережье. Уютные номера, бассейн, детская площадка и тёплое море в нескольких минутах ходьбы.</p>
    <div class="hero-buttons">
      <button class="btn btn-primary" onclick="scrollTo2('#rooms')">Посмотреть номера →</button>
      <button class="btn btn-ghost" onclick="openBooking()">📞 Связаться</button>
    </div>
  </div>
  <div class="scroll-down">⌄</div>
</section>

<section class="about" id="about">
  <div class="container">
    <div class="about-grid">
      <div>
        <span class="section-tag">О гостевом доме</span>
        <h2 class="section-title">Ваш идеальный<br>отдых на Азовском<br>побережье</h2>
        <p style="font-size:18px;color:var(--muted);margin-bottom:16px">
          Наш гостевой дом расположен в живописной станице Голубицкая — одном из лучших курортов Азовского моря.
          Здесь вас ждут комфортабельные номера, благоустроенная территория и по-настоящему домашняя атмосфера.
        </p>
        <p style="font-size:18px;color:var(--muted)">
          Тёплое море, песчано-ракушечные пляжи, знаменитые грязевые вулканы и свежий морской воздух — всё это в шаговой доступности.
        </p>
        <div class="stats">
          <div class="stat"><div class="num">100 м</div><div class="lbl">до моря</div></div>
          <div class="stat"><div class="num" id="statRooms">—</div><div class="lbl">номеров</div></div>
          <div class="stat"><div class="num">4.9</div><div class="lbl">рейтинг</div></div>
        </div>
      </div>
      <div class="about-img">
        <img src="/images/guest-house.jpg" alt="Гостевой дом" onerror="this.src='https://images.pexels.com/photos/6032280/pexels-photo-6032280.jpeg?auto=compress&cs=tinysrgb&w=800'">
        <div class="rating-badge">
          <div class="rate">★ 4.9 / 5.0</div>
          <div style="font-size:12px;color:var(--muted)">Оценка гостей</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="amenities">
  <div class="container">
    <div style="text-align:center;max-width:640px;margin:0 auto">
      <span class="section-tag">Удобства</span>
      <h2 class="section-title">Всё для комфортного отдыха</h2>
      <p class="section-desc">Мы позаботились о том, чтобы ваш отпуск прошёл без забот.</p>
    </div>
    <div class="amenities-grid">
      <div class="amenity"><div class="icon">🌊</div><h3>Море рядом</h3><p>Пляж в пешей доступности — тёплое Азовское море и песчано-ракушечный берег.</p></div>
      <div class="amenity"><div class="icon">🛏️</div><h3>Уютные номера</h3><p>Кондиционер, ТВ, холодильник, собственная ванная в каждом номере.</p></div>
      <div class="amenity"><div class="icon">🍳</div><h3>Общая кухня</h3><p>Всё необходимое для приготовления еды: плита, посуда, микроволновая печь.</p></div>
      <div class="amenity"><div class="icon">🏊</div><h3>Бассейн</h3><p>Открытый бассейн с шезлонгами — идеально для жарких летних дней.</p></div>
      <div class="amenity"><div class="icon">🚗</div><h3>Парковка</h3><p>Бесплатная охраняемая парковка на территории.</p></div>
      <div class="amenity"><div class="icon">👶</div><h3>Для семей</h3><p>Детская площадка, спокойная территория, всё для отдыха с детьми.</p></div>
    </div>
  </div>
</section>

<section class="rooms" id="rooms">
  <div class="container">
    <div class="rooms-header">
      <div>
        <span class="section-tag">Наши номера</span>
        <h2 class="section-title">Выберите идеальный номер</h2>
      </div>
    </div>
    <div class="rooms-grid" id="roomsGrid">Загрузка...</div>
  </div>
</section>

<section class="gallery" id="gallery">
  <div class="container">
    <div style="text-align:center;max-width:640px;margin:0 auto">
      <span class="section-tag">Галерея</span>
      <h2 class="section-title">Посмотрите, как у нас красиво</h2>
    </div>
    <div class="gallery-grid" id="galleryGrid">Загрузка...</div>
  </div>
</section>

<section class="cta">
  <div class="cta-inner">
    <h2>Готовы к отпуску?</h2>
    <p>Забронируйте номер прямо сейчас и начните планировать свой идеальный отдых на Азовском море!</p>
    <button class="btn btn-white" onclick="openBooking()">📞 Забронировать →</button>
  </div>
</section>

<section class="contacts" id="contacts">
  <div class="container">
    <div class="contacts-grid">
      <div>
        <span class="section-tag">Контакты</span>
        <h2 class="section-title">Свяжитесь с нами</h2>
        <p style="color:rgba(255,255,255,.7);margin-bottom:24px">
          Есть вопросы? Мы всегда на связи и поможем с выбором номера.
        </p>
        <div id="contactList">
          <div class="contact-item"><div class="ic">📍</div><div>Краснодарский край,<br>Темрюкский район, ст. Голубицкая</div></div>
        </div>
      </div>
      <div class="map-box">
        <iframe loading="lazy" src="https://yandex.ru/map-widget/v1/?ll=37.2730%2C45.3324&z=13&pt=37.2730,45.3324,pm2rdm"></iframe>
      </div>
    </div>
  </div>
</section>

<footer>
  <p>© 2026 Гостевой дом Голубицкая ·
    <a href="https://tvil.ru/city/golubickaya/hotels/1170033/" target="_blank">TVIL объект №1170033</a>
  </p>
</footer>

<div class="modal-bg" id="bookingModal" onclick="if(event.target===this)closeBooking()">
  <div class="modal">
    <button class="modal-close" onclick="closeBooking()">✕</button>
    <div class="modal-icon">🏡</div>
    <h3>Забронировать</h3>
    <div class="room-title" id="modalRoomTitle"></div>
    <p class="modal-text">Свяжитесь с нами любым удобным способом — поможем с выбором и подтвердим бронь.</p>
    <div class="contact-channels" id="modalChannels"></div>
  </div>
</div>

<script>
  let contactsCache = {};
  let currentRoom = null;

  function toggleMenu(){
    document.getElementById('navLinks').classList.toggle('open');
  }
  function scrollTo2(sel){
    document.querySelector(sel)?.scrollIntoView({behavior:'smooth'});
    document.getElementById('navLinks').classList.remove('open');
  }

  // Header transparency on scroll
  window.addEventListener('scroll',()=>{
    const h = document.getElementById('header');
    if(window.scrollY > 80) h.classList.remove('transparent');
    else h.classList.add('transparent');
  });

  // Reveal sections on scroll
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible') });
  },{threshold:.1,rootMargin:'0px 0px -60px 0px'});
  document.querySelectorAll('section').forEach(s=>obs.observe(s));

  // Load data
  async function loadAll(){
    try{
      const [rooms,gallery,contacts] = await Promise.all([
        fetch('/api/rooms').then(r=>r.json()),
        fetch('/api/gallery').then(r=>r.json()),
        fetch('/api/contacts').then(r=>r.json())
      ]);
      contactsCache = contacts || {};
      renderRooms(rooms||[]);
      renderGallery(gallery||[]);
      renderContacts(contacts||{});
      document.getElementById('statRooms').textContent = (rooms||[]).length;
    }catch(e){
      console.error('load failed',e);
      document.getElementById('roomsGrid').innerHTML = '<p style="color:var(--muted)">Не удалось загрузить номера.</p>';
    }
  }

  function renderRooms(rooms){
    const grid = document.getElementById('roomsGrid');
    if(!rooms.length){ grid.innerHTML='<p style="color:var(--muted)">Номеров пока нет.</p>'; return; }
    grid.innerHTML = rooms.map(r=>\`
      <article class="room-card">
        <div class="room-img">
          <img src="\${r.image||'/images/room.jpg'}" alt="\${escapeHtml(r.title)}"
               onerror="this.src='https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=600'">
          <span class="room-capacity">до \${r.capacity} гостей</span>
          <span class="room-status \${r.status==='free'?'free':'busy'}">
            \${r.status==='free'?'● Свободен':'● Занят'}
          </span>
        </div>
        <div class="room-body">
          <h3>\${escapeHtml(r.title)}</h3>
          <p class="desc">\${escapeHtml(r.description||'')}</p>
          <div class="room-amenities">
            \${(r.amenities||[]).slice(0,3).map(a=>'<span>'+escapeHtml(a)+'</span>').join('')}
            \${(r.amenities||[]).length>3?'<span style="background:#f1f5f9;color:#64748b">+'+((r.amenities||[]).length-3)+'</span>':''}
          </div>
          <div class="room-footer">
            <div class="room-price">\${Number(r.price).toLocaleString('ru-RU')} ₽<small>в сутки</small></div>
            <button class="room-book" \${r.status==='busy'?'disabled':''} onclick='bookRoom(\${JSON.stringify(r.title)})'>
              \${r.status==='free'?'Бронь':'Занят'}
            </button>
          </div>
        </div>
      </article>
    \`).join('');
  }

  function renderGallery(items){
    const grid = document.getElementById('galleryGrid');
    if(!items.length){ grid.innerHTML='<p style="color:var(--muted)">Галерея пуста.</p>'; return; }
    grid.innerHTML = items.map(g=>\`
      <div class="gallery-item">
        <img src="\${g.src}" alt="\${escapeHtml(g.alt||'')}"
             onerror="this.src='https://images.pexels.com/photos/261395/pexels-photo-261395.jpeg?auto=compress&cs=tinysrgb&w=600'">
        <div class="caption">\${escapeHtml(g.alt||'')}</div>
      </div>
    \`).join('');
  }

  function renderContacts(c){
    const list = document.getElementById('contactList');
    let html = '<div class="contact-item"><div class="ic">📍</div><div>Краснодарский край, Темрюкский район,<br>ст. Голубицкая</div></div>';
    if(c.phone) html += '<div class="contact-item"><div class="ic">📞</div><a href="tel:'+escapeAttr(c.phone)+'">'+escapeHtml(c.phone)+'</a></div>';
    if(c.telegram) html += '<div class="contact-item"><div class="ic">✈️</div><a href="https://t.me/'+escapeAttr(c.telegram)+'" target="_blank">@'+escapeHtml(c.telegram)+'</a></div>';
    if(c.whatsapp) html += '<div class="contact-item"><div class="ic">💬</div><a href="https://wa.me/'+escapeAttr(c.whatsapp)+'" target="_blank">WhatsApp</a></div>';
    list.innerHTML = html;
  }

  function bookRoom(title){
    currentRoom = title;
    openBooking();
  }
  function openBooking(){
    const c = contactsCache;
    document.getElementById('modalRoomTitle').textContent = currentRoom || '';
    const ch = document.getElementById('modalChannels');
    let html = '';
    if(c.phone) html += \`<a class="channel phone" href="tel:\${escapeAttr(c.phone)}">
      <div class="ic">📞</div><div class="info"><b>Позвонить</b><small>\${escapeHtml(c.phone)}</small></div></a>\`;
    if(c.whatsapp) html += \`<a class="channel wa" href="https://wa.me/\${escapeAttr(c.whatsapp)}" target="_blank">
      <div class="ic">💬</div><div class="info"><b>WhatsApp</b><small>Написать сообщение</small></div></a>\`;
    if(c.telegram) html += \`<a class="channel tg" href="https://t.me/\${escapeAttr(c.telegram)}" target="_blank">
      <div class="ic">✈️</div><div class="info"><b>Telegram</b><small>@\${escapeHtml(c.telegram)}</small></div></a>\`;
    if(c.vk) html += \`<a class="channel vk" href="\${escapeAttr(c.vk)}" target="_blank">
      <div class="ic">🟦</div><div class="info"><b>ВКонтакте</b><small>Написать сообщение</small></div></a>\`;
    if(!html) html = '<p style="text-align:center;color:var(--muted)">Контакты пока не настроены.</p>';
    ch.innerHTML = html;
    document.getElementById('bookingModal').classList.add('open');
  }
  function closeBooking(){
    currentRoom = null;
    document.getElementById('bookingModal').classList.remove('open');
  }

  function escapeHtml(s){ return String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
  function escapeAttr(s){ return escapeHtml(s).replace(/'/g,'&#39;'); }

  loadAll();
  setInterval(loadAll, 8000); // обновляем данные каждые 8 секунд
</script>
</body>
</html>`;

module.exports = { SITE_HTML };
