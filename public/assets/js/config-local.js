<script src="/assets/js/config.js"></script>
<script>
  (function () {
    const wantLocal = location.hostname === "localhost" || location.search.includes("useLocalApi=1");
    if (wantLocal) {
      const s = document.createElement("script");
      s.src = "/assets/js/config.local.js";
      s.onload = () => console.log("config.local.js carregado");
      s.onerror = () => console.warn("Sem config.local.js — usando config.js (prod)");
      document.head.appendChild(s);
      window.APP_CONFIG = Object.assign(window.APP_CONFIG || {}, {
        API_BASE: "http://localhost:3000/api",
        ENV: "dev"
      });
    }
  })();
</script>
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
