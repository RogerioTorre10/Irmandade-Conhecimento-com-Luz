/* video-player.js — GLOBAL */
window.playVideo = function(src, options = {}) {
  const {
    useGoldBorder = true,
    pulse = true,
    onEnded = null
  } = options;

  let video = document.getElementById('global-video');
  if (!video) {
    video = document.createElement('video');
    video.id = 'global-video';
    video.playsInline = true;
    video.preload = 'auto';
    document.body.appendChild(video);
  }

  video.src = src;

  // APLICA CLASSE CERTA
  video.className = useGoldBorder ? 
    `video-gold-frame ${pulse ? 'pulse' : ''}` : 
    'video-clean';

  // Esconde tudo
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('section, div, header, footer').forEach(el => {
    if (el.id !== 'global-video') el.style.display = 'none';
  });

  // Toca
  video.play().catch(() => {
    const btn = document.createElement('button');
    btn.textContent = 'Tocar Vídeo';
    btn.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999999;padding:20px 40px;background:#d4af37;color:#000;border:none;border-radius:12px;font-weight:bold;';
    document.body.appendChild(btn);
    btn.onclick = () => { video.play(); btn.remove(); };
  });

  // Ao terminar
  video.onended = () => {
    video.remove();
    document.body.style.overflow = '';
    document.querySelectorAll('section, div, header, footer').forEach(el => {
      el.style.display = '';
    });
    if (onEnded) onEnded();
  };
};
