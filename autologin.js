// ── Auto-login via URL query params (dari Role Tester) ──
(function() {
  var p = new URLSearchParams(window.location.search);
  if (p.get('autologin') === '1') {
    var email = p.get('email');
    var pw    = p.get('pw');
    if (email && pw) {
      window.addEventListener('load', function() {
        var ef = document.getElementById('login-email');
        var pf = document.getElementById('login-password');
        if (ef && pf) { ef.value = email; pf.value = pw; if(typeof doLogin==='function') doLogin(); }
      });
    }
  }
})();