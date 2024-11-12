// Hiển thị tab ADMIN DASHBOARD nếu userRole là ADMIN


function checkUserRole() {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'ADMIN') {
        const navbar = document.querySelector('.navbar-nav');
        const adminTab = document.createElement('li');
        adminTab.classList.add('nav-item');
        adminTab.innerHTML = `<a class="pos-nav-link nav-link" href="admin-products.html">ADMIN DASHBOARD</a>`;
        navbar.appendChild(adminTab);
    }
}

// Hiển thị nút Logout nếu đã đăng nhập
function checkLoginStatus() {
    const loginStatus = localStorage.getItem('loginStatus');
    if (loginStatus === 'true') {
        document.getElementById('logoutBtn').style.display = 'block';
    }
}

// Hàm logout để xóa thông tin đăng nhập và chuyển hướng về trang đăng nhập
function logout() {
    localStorage.removeItem('tokenLogin');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('email');
    localStorage.removeItem('userRole');
    localStorage.removeItem('loginStatus');
    window.location.href = 'login.html'; // Chuyển hướng về trang đăng nhập
}

