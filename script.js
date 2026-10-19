"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const page = document.getElementById("page");
  const opener = document.getElementById("open-envelope");
  const greeting = document.getElementById("greeting");
  const subtitle = document.getElementById("subtitle");
  const tapHint = document.getElementById("tap-hint");

  const copyButton = document.getElementById("copy-wish");
  const replayButton = document.getElementById("replay");

  const wishText = document.getElementById("wish-text");
  const copyStatus = document.getElementById("copy-status");

  const particleContainer = document.getElementById("particle-container");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let isOpen = false;
  let particleTimeouts = [];

  /*
   * Read the visible greeting from the HTML.
   * This keeps the copied text synchronized with the displayed message.
   */
  function getWishText() {
    const title = document.getElementById("greeting-title").innerText;
    const date = document.querySelector(".greeting-date").innerText;
    const paragraphs = Array.from(wishText.querySelectorAll("p")).map(
      (paragraph) => paragraph.innerText.trim(),
    );

    const closing = document.querySelector(".closing p").innerText;

    return [
      title.replace(/\n/g, " "),
      "",
      date,
      "",
      ...paragraphs,
      "",
      closing,
    ].join("\n");
  }

  /*
   * Create a small burst of floating hearts.
   */
  function createHeartBurst() {
    if (reducedMotion.matches) {
      return;
    }

    const symbols = ["♡", "♥", "✿", "✨", "💕"];
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 20; i++) {
      const heart = document.createElement("span");

      heart.className = "floating-heart";
      heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];

      heart.style.left = `${Math.random() * 100}%`;
      heart.style.fontSize = `${14 + Math.random() * 20}px`;

      const duration = 2.5 + Math.random() * 2.5;

      heart.style.setProperty("--duration", `${duration}s`);

      fragment.appendChild(heart);

      const timeoutId = window.setTimeout(
        () => {
          heart.remove();
        },
        duration * 1000 + 100,
      );

      particleTimeouts.push(timeoutId);
    }

    particleContainer.appendChild(fragment);
  }

  /*
   * Remove existing particles and their pending cleanup timers.
   */
  function clearParticles() {
    particleTimeouts.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });

    particleTimeouts = [];
    particleContainer.replaceChildren();
  }

  /*
   * Open the envelope and reveal the greeting.
   */
  function openLetter() {
    if (isOpen) {
      return;
    }

    isOpen = true;

    page.classList.add("is-open");

    opener.setAttribute("aria-expanded", "true");
    greeting.setAttribute("aria-hidden", "false");
    greeting.inert = false;

    subtitle.setAttribute("aria-hidden", "true");
    tapHint.setAttribute("aria-hidden", "true");

    createHeartBurst();

    /*
     * Move the revealed message into view on smaller screens.
     */
    window.setTimeout(() => {
      greeting.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "center",
      });
    }, 450);
  }

  /*
   * Return the page to its original unopened state.
   */
  function replayLetter() {
    isOpen = false;

    page.classList.remove("is-open");

    opener.setAttribute("aria-expanded", "false");
    greeting.setAttribute("aria-hidden", "true");
    greeting.inert = true;

    subtitle.setAttribute("aria-hidden", "false");
    tapHint.setAttribute("aria-hidden", "false");

    copyStatus.textContent = "";

    clearParticles();

    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });

    opener.focus({
      preventScroll: true,
    });
  }

  /*
   * Copy the greeting to the clipboard.
   * Use a fallback for browsers without Clipboard API access.
   */
  async function copyWish() {
    const text = getWishText();

    copyButton.disabled = true;
    copyStatus.textContent = "";

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }

      copyStatus.textContent = "Đã sao chép lời chúc thành công! ♡";
      copyButton.innerHTML = "<span aria-hidden='true'>✓</span> Đã sao chép!";
    } catch (error) {
      console.error("Could not copy the greeting:", error);

      copyStatus.textContent =
        "Không thể sao chép tự động. Bạn hãy thử lại nhé!";
    } finally {
      copyButton.disabled = false;

      window.setTimeout(() => {
        copyButton.innerHTML =
          "<span aria-hidden='true'>♡</span> Sao chép lời chúc";
      }, 2200);
    }
  }

  /*
   * Legacy clipboard fallback.
   */
  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.setAttribute("readonly", "");

    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let copied = false;

    try {
      copied = document.execCommand("copy");
    } finally {
      textarea.remove();
    }

    if (!copied) {
      throw new Error("Clipboard copy was unsuccessful.");
    }
  }

  /*
   * Event listeners.
   */
  opener.addEventListener("click", openLetter);
  replayButton.addEventListener("click", replayLetter);
  copyButton.addEventListener("click", copyWish);

  /*
   * Prevent leftover timers when the page is being unloaded.
   */
  window.addEventListener("pagehide", clearParticles);
});
