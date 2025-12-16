chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  chrome.tabs.sendMessage(tab.id, { type: "GET_SEO_DATA" }, (res) => {
    document.getElementById("output").textContent =
      JSON.stringify(res, null, 2);
  });
});
