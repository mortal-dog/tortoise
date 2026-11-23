// The script of oauth-silent.html (D-055): posts the answer of Google's silent token renew to the app that framed this
// page. The answer sits in the fragment (`#access_token=…&state=…`) or, when Google refuses, in the fragment or the
// query (`error=login_required`). The app checks the `state` it generated.
;(() => {
  const raw = location.hash.slice(1) || location.search.slice(1)
  const params = Object.fromEntries(new URLSearchParams(raw))
  if (window.parent && window.parent !== window) {
    // The app's own origin only: this page is loaded by the app, nobody else.
    window.parent.postMessage({ source: 'tortoise/oauth-silent', params }, location.origin)
  }
})()
