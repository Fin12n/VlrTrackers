/**
 * navbar.js — Shared navbar session logic
 * - Nếu đã login: đổi "Sign In" → "Sign Out" (click = logout)
 * - Tự thêm class "active" vào link tương ứng trang hiện tại
 */
(function () {
    const session = JSON.parse(
        localStorage.getItem('vt_session') ||
        sessionStorage.getItem('vt_session') || 'null'
    );

    const authBtn = document.getElementById('nav-auth');
    if (authBtn) {
        if (session) {
            authBtn.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket"></i> <span>Sign Out</span>';
            authBtn.classList.add('logged');
            authBtn.href = '#';
            authBtn.addEventListener('click', function (e) {
                e.preventDefault();
                localStorage.removeItem('vt_session');
                sessionStorage.removeItem('vt_session');
                window.location.href = './login.html';
            });
        } else {
            authBtn.href = './login.html';
        }
    }

    /* Active link highlight */
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function (a) {
        const href = a.getAttribute('href') || '';
        if (href && href !== '#' && href.split('/').pop() === page) {
            a.classList.add('active');
        }
    });
})();