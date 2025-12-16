function getSEOData() {
  const metaTags = [...document.getElementsByTagName("meta")].map(m => ({
    name: m.getAttribute("name") || m.getAttribute("property"),
    content: m.getAttribute("content")
  }));

  const scripts = [...document.querySelectorAll("head script")].map(s => ({
    src: s.src || "inline",
    type: s.type || "text/javascript"
  }));

  const jsonLd = [...document.querySelectorAll(
    'script[type="application/ld+json"]'
  )].map(s => s.innerText);

  return {
    title: document.title,
    canonical: document.querySelector("link[rel='canonical']")?.href,
    metaTags,
    scripts,
    jsonLd
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_SEO_DATA") {
    sendResponse(getSEOData());
  }
});
