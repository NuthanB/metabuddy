const state = {
  data: null,
};

const el = (id) => document.getElementById(id);

const isFrameworkScript = (script) => {
  // Check if src exists and contains the nextjs specific path
  return (
    script.src &&
    (script.src.includes("/_next/static/") ||
      script.src.includes("/_next/static/chunks/"))
  );
};

const truncate = (str, length = 120) => {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
};

function renderMeta(metaTags) {
  const container = el("metaList");
  if (!metaTags?.length) {
    container.textContent = "No meta tags found in <head>.";
    container.classList.add("empty");
    return;
  }

  container.innerHTML = "";
  container.classList.remove("empty");

  metaTags.forEach((tag) => {
    const item = document.createElement("div");
    item.className = "list-item";

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = tag.name || "(unnamed)";

    const content = document.createElement("p");
    content.className = "content";
    content.textContent = tag.content || "—";

    item.append(name, content);
    container.appendChild(item);
  });
}

function renderTrackers(trackers) {
  const container = el("trackerList");
  if (!trackers?.length) {
    container.textContent = "No pixels or trackers detected in <head>.";
    container.classList.add("empty");
    return;
  }

  container.innerHTML = "";
  container.classList.remove("empty");

  trackers.forEach((tracker) => {
    const item = document.createElement("div");
    item.className = "list-item";

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = tracker.label;

    if (tracker.detail) {
      const detail = document.createElement("p");
      detail.className = "content";

      // Determine the text content
      const rawSrc =
        tracker.detail === "inline" ? "Inline Tracker" : tracker.detail;

      // Apply truncation here (limit set to 60 chars, adjust as needed)
      detail.textContent = truncate(rawSrc, 80);

      // Optional: Add the full URL as a tooltip so users can still see it on hover
      if (tracker.detail !== "inline") {
        detail.title = tracker.detail;
      }

      item.appendChild(detail);
    }

    container.appendChild(item);
  });
}

function renderScripts(scripts) {
  const container = el("scriptList");
  if (!scripts?.length) {
    container.textContent = "No scripts found in <head>.";
    container.classList.add("empty");
    return;
  }

  container.innerHTML = "";
  container.classList.remove("empty");

  scripts.slice(0, 12).forEach((script) => {
    const item = document.createElement("div");
    item.className = "list-item";

    const name = document.createElement("p");
    name.className = "name";

    // Determine the text content
    const rawSrc = script.src === "inline" ? "Inline script" : script.src;

    // Apply truncation here (limit set to 60 chars, adjust as needed)
    name.textContent = truncate(rawSrc, 80);

    // Optional: Add the full URL as a tooltip so users can still see it on hover
    if (script.src !== "inline") {
      name.title = script.src;
    }

    const type = document.createElement("p");
    type.className = "content";
    type.textContent = `Type: ${script.type}`;

    item.append(name, type);
    container.appendChild(item);
  });
}

function renderJson(jsonLd) {
  const container = el("jsonList");
  if (!jsonLd?.length) {
    container.textContent = "No JSON-LD detected.";
    return;
  }

  container.textContent = jsonLd.map((entry) => entry.trim()).join("\n\n");
}

function renderNoScripts(noScripts) {
  const container = el("noscriptList");
  if (!noScripts?.length) {
    container.textContent = "No noscript fallbacks found.";
    container.classList.add("empty");
    return;
  }

  container.innerHTML = "";
  container.classList.remove("empty");

  noScripts.forEach((ns) => {
    const item = document.createElement("div");
    item.className = "list-item";

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = `Location: ${ns.location}`;

    const content = document.createElement("p");
    content.className = "content";
    content.textContent = ns.html || "(empty noscript)";

    item.append(name, content);
    container.appendChild(item);
  });
}

function renderGtm(gtm) {
  const statusEl = el("gtmStatus");
  const idEl = el("gtmId");
  const detailsEl = el("gtmDetails");

  if (!gtm?.found) {
    statusEl.textContent = "Not found";
    idEl.textContent = "No GTM container detected";
    detailsEl.textContent = "No GTM loader script found on this page.";
    return;
  }

  statusEl.textContent = "Detected";
  idEl.textContent = gtm.containerId
    ? `Container: ${gtm.containerId}`
    : "Container id not in URL";
  detailsEl.textContent =
    gtm.snippet || gtm.src || "GTM present (snippet unavailable)";
}

function renderSummary(data, tab) {
  const host = (() => {
    try {
      return new URL(tab.url).host;
    } catch (e) {
      return tab.url || "Current tab";
    }
  })();

  el("tabHost").textContent = host;
  el("titleStat").textContent = data.title || "No title";
  el("canonicalStat").textContent = data.canonical || "Not set";
  el("metaCount").textContent = data.metaTags?.length || 0;
  el("linkCount").textContent = `${data.linkTags?.length || 0} links`;

  const trackerCount = data.trackers?.length || 0;
  el("trackerCount").textContent = trackerCount;
  el("trackerSummary").textContent = trackerCount
    ? "Pixels or analytics detected"
    : "No trackers in head";

  const nsCount = data.noScripts?.length || 0;
  el("noscriptCount").textContent = nsCount;
  el("noscriptHint").textContent = nsCount
    ? "Fallback present"
    : "No noscripts found";

  el("metaHint").textContent = `${data.metaTags?.length || 0} meta tags read`;
}

function copyRawJson() {
  if (!state.data) return;
  const btn = el("copyJson");
  navigator.clipboard
    .writeText(JSON.stringify(state.data, null, 2))
    .then(() => {
      el("copyStatus").textContent = "Copied";
      btn.disabled = true;
      setTimeout(() => {
        btn.disabled = false;
        el("copyStatus").textContent = "";
      }, 1400);
    });
}

function renderData(data, tab) {
  renderSummary(data, tab);
  renderMeta(data.metaTags);
  renderTrackers(data.trackers);

  const cleanScripts = data.scripts.filter(
    (script) => !isFrameworkScript(script)
  );
  renderScripts(cleanScripts);

  renderJson(data.jsonLd);
  renderNoScripts(data.noScripts);
  renderGtm(data.gtm);
}

function handleError(message) {
  ["metaList", "trackerList", "scriptList", "jsonList"].forEach((id) => {
    const target = el(id);
    target.textContent = message;
    target.classList.add("empty");
  });
  el("metaHint").textContent = "Unable to load data";
  el("trackerSummary").textContent = "Unable to load data";
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  chrome.tabs.sendMessage(tab.id, { type: "GET_SEO_DATA" }, (res) => {
    if (chrome.runtime.lastError) {
      handleError("Permission error: open the extension on a normal page.");
      return;
    }
    if (!res) {
      handleError("No data returned from page.");
      return;
    }
    state.data = res;
    renderData(res, tab);
  });
});

el("copyJson").addEventListener("click", copyRawJson);
