(() => {
  const PASSWORD = "4004";
  const STORAGE_KEY = "zg_pass_ok";

  const applyStyles = () => {
    const style = document.createElement("style");
    style.textContent = `
      html.gate-locked body > *:not(.gate-overlay) { filter: blur(12px); pointer-events: none; user-select: none; }
      html.gate-locked .gate-overlay { pointer-events: auto; }
      .gate-overlay { position: fixed; inset: 0; background: rgba(10,12,18,0.82); backdrop-filter: blur(10px); display: grid; place-items: center; z-index: 9999; }
      .gate-card { background: rgba(24,27,41,0.9); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 22px; width: min(420px, 92vw); box-shadow: 0 20px 50px rgba(0,0,0,0.45); color: #e7ecf4; font-family: "Space Grotesk", "Helvetica Neue", Arial, sans-serif; }
      .gate-card h2 { margin: 0 0 8px; font-size: 22px; }
      .gate-card p { margin: 0 0 12px; color: #a4acbc; }
      .gate-input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.06); color: #e7ecf4; font-size: 16px; outline: none; }
      .gate-input:focus { border-color: rgba(77,208,225,0.6); box-shadow: 0 0 0 6px rgba(77,208,225,0.12); }
      .gate-actions { display: flex; gap: 10px; margin-top: 14px; align-items: center; }
      .gate-btn { padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.16); background: linear-gradient(135deg, #ff9a3c, #4dd0e1); color: #0f111a; font-weight: 700; cursor: pointer; }
      .gate-error { color: #ff9a3c; font-weight: 600; min-height: 18px; }
    `;
    document.head.appendChild(style);
  };

  const unlock = () => {
    // Remember for this tab only; cleared when the tab closes.
    sessionStorage.setItem(STORAGE_KEY, "1");
    document.documentElement.classList.remove("gate-locked");
    const overlay = document.querySelector(".gate-overlay");
    if (overlay) overlay.remove();
  };

  const renderOverlay = () => {
    document.documentElement.classList.add("gate-locked");
    const overlay = document.createElement("div");
    overlay.className = "gate-overlay";

    const card = document.createElement("div");
    card.className = "gate-card";
    card.innerHTML = `
      <h2>Enter Password</h2>
      <p>This site is locked. Please enter the password.</p>
      <input class="gate-input" type="password" placeholder="Password" autocomplete="off" />
      <div class="gate-actions">
        <button class="gate-btn" type="button">Unlock</button>
        <span class="gate-error"></span>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const input = card.querySelector(".gate-input");
    const button = card.querySelector(".gate-btn");
    const error = card.querySelector(".gate-error");

    const submit = () => {
      if (input.value === PASSWORD) {
        unlock();
      } else {
        error.textContent = "Incorrect password";
      }
    };

    button.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });

    input.focus();
  };

  const init = () => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    applyStyles();
    if (document.body) {
      renderOverlay();
    } else {
      document.addEventListener("DOMContentLoaded", renderOverlay);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
