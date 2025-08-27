/* ============================================
   jornada-typing-font.js — Typewriter + Font
   Expondo: window.JORNADA_TYPO
   ============================================ */
;(function () {
  function typeText(target, text, speed = 25, withCursor = true) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    el.textContent = "";
    let i = 0;
    const cursor = withCursor ? document.createElement("span") : null;
    if (cursor) { cursor.textContent = "▌"; cursor.style.opacity = "0.6"; el.appendChild(cursor); }

    function step() {
      if (i < text.length) {
        el.insertBefore(document.createTextNode(text[i++]), cursor);
        setTimeout(step, speed);
      } else if (cursor) {
        cursor.remove();
      }
    }
    step();
  }

  async function loadFont({ family = "Cardo", weights = ["400"], urls = {} } = {}) {
    if (!("fonts" in document)) return false; // sem API, usa CSS normal
    try {
      const toLoad = [];
      // exemplo: urls["400"] = "/assets/fonts/Cardo-Regular.woff2"
      for (const w of weights) {
        const src = urls[w];
        if (!src) continue;
        const ff = new FontFace(family, `url(${src})`, { weight: w });
        document.fonts.add(ff);
        toLoad.push(ff.load());
      }
      await Promise.all(toLoad);
      document.documentElement.classList.add(`font-${family.toLowerCase()}-loaded`);
      return true;
    } catch {
      return false;
    }
  }

  window.JORNADA_TYPO = { typeText, loadFont };
})();
