/**
 * NorthFall Embed Script
 * Usage: <blockquote class="northfall-embed" data-post-id="POST_ID"></blockquote>
 *        <script src="https://www.northfall.blog/js/embed.js" async charset="UTF-8"></script>
 */
(function () {
  var SITE = "https://www.northfall.blog";

  function extractPostId(el) {
    var id = el.getAttribute("data-post-id");
    if (id) return id.trim();
    var a = el.querySelector("a[href]");
    if (!a || !a.href) return null;
    var href = a.href;
    var patterns = [
      /[?&]postId=([^&]+)/i,
      /\/embed\/([^/?#]+)/i,
      /\/post\/([^/?#]+)/i,
      /view=post[^&]*&postId=([^&]+)/i,
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = href.match(patterns[i]);
      if (m && m[1]) return decodeURIComponent(m[1]);
    }
    return null;
  }

  function buildQuery(el) {
    var map = {
      "data-theme": "theme",
      "data-hide-body": "hideBody",
      "data-hide-user": "hideUser",
      "data-hide-img": "hideImg",
      "data-hide-footer": "hideFooter",
      "data-hide-brand": "hideBrand",
      "data-hide-flair": "hideFlair",
      "data-hide-votes": "hideVotes",
      "data-hide-time": "hideTime",
      "data-hide-comm": "hideComm",
      "data-compact": "compact",
      "data-skin": "skin",
      "data-radius": "radius",
      "data-lines": "lines",
    };
    var parts = [];
    Object.keys(map).forEach(function (attr) {
      var val = el.getAttribute(attr);
      if (!val) return;
      if (attr.indexOf("data-hide") === 0 || attr === "data-compact") {
        if (val === "1" || val === "true") parts.push(map[attr] + "=1");
      } else if (attr === "data-theme" && val === "dark") {
        parts.push("theme=dark");
      } else if (val && val !== "0" && val !== "false") {
        parts.push(map[attr] + "=" + encodeURIComponent(val));
      }
    });
    return parts.length ? "?" + parts.join("&") : "";
  }

  function mountEmbed(el) {
    if (el.dataset.nfMounted === "1") return;
    var postId = extractPostId(el);
    if (!postId) return;

    var iframe = document.createElement("iframe");
    iframe.src = SITE + "/embed/" + encodeURIComponent(postId) + buildQuery(el);
    iframe.style.cssText =
      "width:100%;border:none;border-radius:12px;max-width:600px;" +
      "min-height:200px;overflow:hidden;background:transparent;display:block;";
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("title", "NorthFall Embed");
    iframe.dataset.postId = postId;

    el.dataset.nfMounted = "1";
    el.parentNode.replaceChild(iframe, el);
  }

  function init() {
    document.querySelectorAll("blockquote.northfall-embed").forEach(mountEmbed);
  }

  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "nf-embed-resize") return;
    document.querySelectorAll("iframe[data-post-id]").forEach(function (iframe) {
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
