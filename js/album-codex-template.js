function renderCodexAlbum() {
  const data = window.CODEX_ALBUM_DATA;
  const root = document.querySelector("[data-codex-root]");
  if (!data || !root || !Array.isArray(data.tracks) || data.tracks.length === 0) return;

  const titleEl = root.querySelector("[data-track-title]");
  const descEl = root.querySelector("[data-track-description]");
  const aboutEl = root.querySelector("[data-track-about]");
  const btsEl = root.querySelector("[data-track-bts]");
  const quotesEl = root.querySelector("[data-track-quotes]");
  const lyricsEl = root.querySelector("[data-track-lyrics]");
  const listEl = root.querySelector("[data-track-list]");
  const playerEl = root.querySelector("[data-track-player]");
  const sourceEl = root.querySelector("[data-track-source]");
  const audioNoteEl = root.querySelector("[data-track-audio-note]");
  const fadeTargets = root.querySelectorAll(".codex-fade-target");

  let activeIndex = 0;

  function fadePanels() {
    fadeTargets.forEach((node) => {
      node.classList.remove("is-panel-fading");
      window.requestAnimationFrame(() => node.classList.add("is-panel-fading"));
    });
  }

  function setTrack(index, shouldPlay) {
    const track = data.tracks[index];
    if (!track) return;
    activeIndex = index;

    titleEl.textContent = track.title;
    descEl.textContent = track.description || "Lore entry pending inscription.";
    aboutEl.textContent = track.about || "About entry pending inscription.";
    btsEl.textContent = track.behindTheScenes || "Behind-the-scenes entry pending inscription.";
    lyricsEl.innerHTML = track.lyricsHtml || "<p><em>Lyric archive entry pending inscription.</em></p>";

    quotesEl.innerHTML = "";
    (track.quotes || []).slice(0, 3).forEach((quote) => {
      const li = document.createElement("li");
      li.textContent = quote;
      quotesEl.appendChild(li);
    });
    if (!quotesEl.children.length) {
      const li = document.createElement("li");
      li.textContent = "Quote glyph pending.";
      quotesEl.appendChild(li);
    }

    root.querySelectorAll(".codex-track-btn").forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "true" : "false");
    });

    fadePanels();

    if (track.audioSrc) {
      sourceEl.src = track.audioSrc;
      playerEl.load();
      audioNoteEl.textContent = "";
      if (shouldPlay) {
        playerEl.play().catch(() => {
          audioNoteEl.textContent = "Press play to begin this chapter.";
        });
      }
    } else {
      sourceEl.src = "";
      playerEl.load();
      audioNoteEl.textContent = "Audio for this chapter is not yet inscribed.";
    }
  }

  listEl.innerHTML = "";
  data.tracks.forEach((track, index) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.className = "codex-track-btn";
    button.type = "button";
    button.innerHTML = `<span class="codex-track-number">${index + 1}.</span> <span>${track.title}</span>`;
    button.addEventListener("click", () => setTrack(index, true));
    li.appendChild(button);
    listEl.appendChild(li);
  });

  setTrack(activeIndex, false);
}

renderCodexAlbum();
