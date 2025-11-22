// /assets/js/video-player.js — GLOBAL CINEMATOGRÁFICO (portal full + limelight)
window.playVideo = function(src, options = {}) {
  const {
    useGoldBorder = true,
    pulse = true,
    onEnded = null
  } = options;

  // --- cria overlay igual ao playTransitionVideo ---
  let overlay = document.getElementById('global-video-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-video-overlay';
    overlay.className = 'jp-video-overlay';
    overlay.setAttribute('role', 'dialog');
    document.body.appendChild(overlay);
  }

  // --- cria frame dourado fullscreen ---
  let frame = overlay.querySelector('.jp-video-frame');
  if (!frame) {
    frame = document.createElement('div');
    frame.className = 'jp-video-frame';
    overlay.appendChild(frame);
  }

  // --- vídeo ambiente (limelight) ---
  let ambient = frame.querySelector('.jp-video-ambient');
  if (!ambient) {
    ambient = document.createElement('video');
    ambient.className = 'jp-video-ambient';
    ambient.playsInline = true;
    ambient.controls = false;
    ambient.muted = true;
    ambient.loop = true;
    ambient.preload = 'auto';
    frame.appendChild(ambient);
  }

  // --- vídeo principal ---
  let video = document.getElementById('global-video');
  if (!video) {
    video = document.createElement('video');
    video.id = 'global-video';
    video.playsInline = true;
    video.preload = 'auto';
    frame.appendChild(video);
  }

  video.controls = false;
  video.muted = true;        // autoplay seguro
  video.autoplay = false;

  // Botão “Pular”
  let skip = frame.querySelector('.jp-video-skip');
  if (!skip) {
    skip = document.createElement('button');
    skip.textContent = 'Pular';
    skip.setAttribute('aria-label', 'Pular vídeo');
    skip.className = 'jp-video-skip';
    frame.appendChild(skip);
  }

  // aplica classe de borda/pulso se você quiser manter
  frame.classList.toggle('pulse', !!pulse);
  overlay.classList.toggle('video-clean', !useGoldBorder);

  // cache-buster
  const finalSrc = src + (src.includes('?') ? '&' : '?') + 't=' + Date.now();
  video.src = finalSrc;
  ambient.src = finalSrc;

  // esconde tudo por trás
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('section, div, header, footer').forEach(el => {
    if (el.id !== 'global-video-overlay') el.style.display = 'none';
  });

  // mostra overlay suave
  requestAnimationFrame(() => overlay.classList.add('show'));

  const finish = () => {
    overlay.classList.remove('show');
    overlay.classList.add('hide');

    setTimeout(() => {
      overlay.classList.remove('hide');

      // limpa vídeos
      try { ambient.pause(); } catch {}
      try { video.pause(); } catch {}

      // restaura tela
      document.body.style.overflow = '';
      document.querySelectorAll('section, div, header, footer').forEach(el => {
        el.style.display = '';
      });

      if (onEnded) onEnded();
    }, 360);
  };

  skip.onclick = finish;
  overlay.onclick = (e) => { if (e.target === overlay) finish(); };

  // toca
  const onCanPlay = () => {
    ambient.play().catch(()=>{});
    video.play().catch(() => {
      // fallback caso autoplay bloqueie
      const btn = document.createElement('button');
      btn.textContent = 'Tocar Vídeo';
      btn.style.cssText = `
        position:fixed;top:50%;left:50%;
        transform:translate(-50%,-50%);
        z-index:999999;padding:20px 40px;
        background:#d4af37;color:#000;border:none;
        border-radius:12px;font-weight:bold;
      `;
      document.body.appendChild(btn);
      btn.onclick = () => { video.play(); ambient.play().catch(()=>{}); btn.remove(); };
    });
  };

  video.onended = finish;
  video.onerror = finish;
  video.oncanplaythrough = onCanPlay;
  video.onloadeddata = onCanPlay;

  video.load();
  ambient.load();
};
