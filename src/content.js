function detectTrackers(metaTags, scripts) {
  const trackers = [];
  const add = (label, detail) => {
    if (!trackers.some(t => t.label === label && t.detail === detail)) {
      trackers.push({ label, detail });
    }
  };

  scripts.forEach(s => {
    const src = s.src || "";
    const content = s.textContent || "";

    if (/googletagmanager\.com\/gtm\.js/i.test(src) || /GTM-[A-Z0-9]+/.test(content)) {
      add("Google Tag Manager", src || "inline snippet");
    }

    if (/googletagmanager\.com\/gtag\/js/i.test(src) || /\bgtag\(/.test(content)) {
      add("Google Analytics 4 (gtag)", src || "inline snippet");
    }

    if (/google-analytics\.com\/(analytics|ga)\.js/i.test(src) || /\bga\(/.test(content)) {
      add("Google Analytics (UA)", src || "inline snippet");
    }

    if (/connect\.facebook\.net\/.*(fbevents\.js|signals\/config)/i.test(src) || /\bfbq\(/.test(content)) {
      add("Facebook Pixel", src || "inline snippet");
    }

    if (/snap\.licdn\.com\/li\.lms-analytics/i.test(src)) {
      add("LinkedIn Insight", src);
    }

    if (/static\.hotjar\.com/i.test(src) || /hotjar\.com/i.test(content)) {
      add("Hotjar", src || "inline snippet");
    }

    if (/clarity\.ms\/tag/i.test(src) || /\bclarity\(/.test(content)) {
      add("Microsoft Clarity", src || "inline snippet");
    }
  });

  metaTags.forEach(tag => {
    const name = (tag.name || "").toLowerCase();
    if (name === "facebook-domain-verification") {
      add("Facebook Domain Verification", `content: ${tag.content}`);
    }
    if (name === "google-site-verification") {
      add("Google Site Verification", `content: ${tag.content}`);
    }
    if (name === "p:domain_verify" || name === "pinterest-domain-verification") {
      add("Pinterest Verification", `content: ${tag.content}`);
    }
  });

  return trackers;
}

function findGtmScript(scripts) {
  const gtmScript = scripts.find(s => /googletagmanager\.com\/gtm\.js/i.test(s.src || ""));
  if (!gtmScript) {
    return { found: false, src: null, containerId: null, snippet: null };
  }

  let containerId = null;
  try {
    const url = new URL(gtmScript.src);
    containerId = url.searchParams.get("id");
  } catch (e) {
    containerId = null;
  }

  return {
    found: true,
    src: gtmScript.src || "inline GTM loader",
    containerId,
    snippet: (gtmScript.outerHTML || "").trim()
  };
}

function getSEOData() {
  const metaTags = [...document.getElementsByTagName("meta")].map(m => ({
    name: m.getAttribute("name") || m.getAttribute("property"),
    content: m.getAttribute("content")
  }));

  const linkTags = [...document.querySelectorAll("head link")].map(l => ({
    rel: l.getAttribute("rel"),
    href: l.getAttribute("href")
  }));

  const allScripts = [...document.querySelectorAll("script")];
  const headScripts = allScripts.filter(s => s.closest("head"));

  const scripts = headScripts.map(s => ({
    src: s.src || "inline",
    type: s.type || "text/javascript"
  }));

  const jsonLd = [...document.querySelectorAll(
    'script[type="application/ld+json"]'
  )].map(s => s.innerText);

  const noScripts = [...document.querySelectorAll("noscript")].map(n => ({
    location: n.closest("head") ? "head" : "body",
    html: (n.innerHTML || "").trim()
  }));

  const trackers = detectTrackers(metaTags, allScripts);
  const gtm = findGtmScript(allScripts);

  return {
    title: document.title,
    canonical: document.querySelector("link[rel='canonical']")?.href,
    metaTags,
    linkTags,
    scripts,
    jsonLd,
    noScripts,
    trackers,
    gtm
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_SEO_DATA") {
    sendResponse(getSEOData());
  }
});
