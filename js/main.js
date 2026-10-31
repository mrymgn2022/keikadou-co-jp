/* けいか堂飲料店 公式サイト 共通スクリプト（依存ライブラリなし） */
(function () {
  'use strict';

  /* ---- 埋め込み（iframe）表示のときだけ、必ず先頭から表示する。
          通常の閲覧では「戻る」ボタンでのスクロール位置の復元をブラウザに任せる ---- */
  var embedded = false;
  try { embedded = window.self !== window.top; } catch (e) { embedded = true; }
  if (embedded && !location.hash) {
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    var toTop = function () { window.scrollTo(0, 0); };
    toTop();
    document.addEventListener('DOMContentLoaded', toTop);
    window.addEventListener('load', toTop);
    window.addEventListener('pageshow', toTop);
    setTimeout(toTop, 50);
    setTimeout(toTop, 300);
  }

  var isEn = (document.documentElement.lang || 'ja').indexOf('en') === 0;

  /* ---- モバイルメニュー ---- */
  var toggle = document.getElementById('menuToggle');
  var menu = document.querySelector('#gMenu .menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'CLOSE' : 'MENU';
    });
    /* リンクを押したら閉じる（同一ページ内リンク用） */
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a') && menu.classList.contains('open')) {
        menu.classList.remove('open'); toggle.textContent = 'MENU'; toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- 現在ページのナビをハイライト ---- */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#gMenu .menu > li > a, #footMenu a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').split('#')[0];
    if (href && href === here) {
      var li = a.closest('li');
      if (li && li.parentNode.classList.contains('menu')) { li.classList.add('current'); a.setAttribute('aria-current', 'page'); }
    }
  });

  /* ---- トップのスライダー ---- */
  var slider = document.querySelector('.slider');
  if (slider) {
    var slides = slider.querySelectorAll('.slide');
    var dotsWrap = document.querySelector('.sliderDots');
    var idx = 0, timer;
    var paused = false;
    /* 「動きを減らす」設定の端末では自動再生しない（手動で送れる） */
    var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var show = function (n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        s.classList.toggle('active', i === idx);
        s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      });
      if (dotsWrap) dotsWrap.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('active', i === idx); b.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
    };
    var restart = function () {
      clearInterval(timer);
      if (paused || reduceMotion) return;
      timer = setInterval(function () { show(idx + 1); }, 5000);
    };
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', isEn ? ('Slide ' + (i + 1)) : ((i + 1) + '枚目'));
        b.addEventListener('click', function () { show(i); restart(); });
        dotsWrap.appendChild(b);
      });
    }
    /* 一時停止／再生（自動で動くものは止められるように） */
    var pauseBtn = slider.parentNode.querySelector('.sliderPause');
    if (pauseBtn) {
      var setPauseUI = function () {
        pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        pauseBtn.textContent = paused ? (isEn ? '▶ Play' : '▶ 再生') : (isEn ? '❚❚ Pause' : '❚❚ 一時停止');
        pauseBtn.setAttribute('aria-label', paused ? (isEn ? 'Resume slideshow' : 'スライドの自動再生を再開') : (isEn ? 'Pause slideshow' : 'スライドの自動再生を一時停止'));
      };
      if (reduceMotion) paused = true;
      setPauseUI();
      pauseBtn.addEventListener('click', function () {
        paused = !paused; setPauseUI();
        if (paused) clearInterval(timer); else restart();
      });
    }
    var prev = slider.parentNode.querySelector('.sliderNav.prev');
    var next = slider.parentNode.querySelector('.sliderNav.next');
    if (prev) prev.addEventListener('click', function () { show(idx - 1); restart(); });
    if (next) next.addEventListener('click', function () { show(idx + 1); restart(); });
    /* マウスを乗せている間・キーボードで操作している間は止める */
    slider.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.addEventListener('mouseleave', restart);
    slider.parentNode.addEventListener('focusin', function () { clearInterval(timer); });
    slider.parentNode.addEventListener('focusout', restart);
    /* スマホのスワイプ */
    var sx = null;
    slider.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) { show(dx < 0 ? idx + 1 : idx - 1); restart(); }
    }, { passive: true });
    /* 画面に見えていない間は止める（省電力） */
    document.addEventListener('visibilitychange', function () { document.hidden ? clearInterval(timer) : restart(); });
    show(0); restart();
  }

  /* ---- ギャラリー（簡易ライトボックス） ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.photoGrid a, a.lb'));
  if (links.length) {
    var lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', isEn ? 'Photo' : '写真の拡大表示');
    lb.innerHTML = '<button type="button" class="close" aria-label="' + (isEn ? 'Close' : '閉じる') + '">×</button>' +
      '<button type="button" class="lbNav prev" aria-label="' + (isEn ? 'Previous' : '前へ') + '">‹</button>' +
      '<img alt="">' +
      '<button type="button" class="lbNav next" aria-label="' + (isEn ? 'Next' : '次へ') + '">›</button>' +
      '<div class="cap"></div>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), cap = lb.querySelector('.cap'), cur = 0, lastFocus = null;
    var closeLb = function () { lb.classList.remove('open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); };
    var open = function (i) {
      cur = (i + links.length) % links.length;
      img.src = links[cur].getAttribute('href');
      var text = links[cur].getAttribute('data-cap') || (links[cur].querySelector('img') ? links[cur].querySelector('img').alt : '') || '';
      img.alt = text;
      cap.textContent = text;
      lb.classList.add('open');
      lb.querySelector('.close').focus();
    };
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); lastFocus = a; open(i); });
    });
    lb.querySelector('.close').addEventListener('click', closeLb);
    lb.querySelector('.prev').addEventListener('click', function () { open(cur - 1); });
    lb.querySelector('.next').addEventListener('click', function () { open(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    var lx = null;
    lb.addEventListener('touchstart', function (e) { lx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (lx === null) return;
      var dx = e.changedTouches[0].clientX - lx; lx = null;
      if (Math.abs(dx) > 40) open(dx < 0 ? cur + 1 : cur - 1);
    }, { passive: true });
    /* 隣の写真を先読み */
    var preload = function (i) { var a = links[(i + links.length) % links.length]; if (a) { var im = new Image(); im.src = a.getAttribute('href'); } };
    var _open = open; open = function (i) { _open(i); preload(i + 1); preload(i - 1); };
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') open(cur - 1);
      if (e.key === 'ArrowRight') open(cur + 1);
    });
  }

  /* ---- PAGETOP ---- */
  var pt = document.getElementById('pagetop');
  if (pt) {
    window.addEventListener('scroll', function () { pt.classList.toggle('show', window.scrollY > 400); }, { passive: true });
    pt.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---- 本日の営業表示（日曜定休。店舗ページは data-hours / data-fri で店ごとの時間） ---- */
  document.querySelectorAll('[data-today]').forEach(function (el) {
    var d = new Date(), day = d.getDay();
    var hours = el.getAttribute('data-hours');
    var fri = el.getAttribute('data-fri');
    if (day === 0) { el.textContent = '本日（日曜）は定休日です'; el.classList.add('closed'); if (!hours) el.style.color = '#e9a84b'; return; }
    if (hours) { el.textContent = '本日の営業 ' + ((day === 5 && fri) ? fri + '（金曜）' : hours) + ' ／ 日曜定休'; }
    else { el.textContent = '本日 18:00 より営業（日曜定休）'; el.style.color = '#f0ece4'; }
  });

  /* ---- URLをコピー（店舗ページの共有ボタン） ---- */
  document.querySelectorAll('.copyUrl').forEach(function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-url') || location.href;
      var done = function () { var t = b.textContent; b.textContent = 'コピーしました'; b.classList.add('done'); setTimeout(function () { b.textContent = t; b.classList.remove('done'); }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(u).then(done, function () { window.prompt('URLをコピーしてください', u); }); }
      else { window.prompt('URLをコピーしてください', u); }
    });
  });
})();
