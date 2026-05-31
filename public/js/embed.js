/**
 * NorthFall Embed Script
 * Usage: <blockquote class="northfall-embed" data-post-id="POST_ID"></blockquote>
 *        <script src="https://www.northfall.blog/js/embed.js" async charset="UTF-8"></script>
 */
(function () {
  var SITE = "https://www.northfall.blog";

  function init() {
    var embeds = document.querySelectorAll("blockquote.northfall-embed");
    embeds.forEach(function (el) {
      var postId = el.getAttribute("data-post-id");
      if (!postId) return;

      var iframe = document.createElement("iframe");
      iframe.src = SITE + "/embed/" + encodeURIComponent(postId);
      iframe.style.cssText =
        "width:100%;border:none;border-radius:10px;max-width:600px;" +
        "min-height:200px;overflow:hidden;background:#181818;display:block;";
      iframe.setAttribute("scrolling", "no");
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("title", "NorthFall Embed");
      iframe.dataset.postId = postId;

      el.parentNode.replaceChild(iframe, el);
    });
  }

  // Auto-resize iframes based on postMessage from embed page
  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "nf-embed-resize") return;
    var iframes = document.querySelectorAll("iframe[data-post-id]");
    iframes.forEach(function (iframe) {
      if (iframe.dataset.postId === e.data.postId) {
        iframe.style.height = e.data.height + "px";
      }
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
