toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: "toast-top-right",
    preventDuplicates: true,
    showDuration: 300,
    hideDuration: 1000,
    timeOut: 3000,
    extendedTimeOut: 1000,
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
    tapToDismiss: false,
    target: "body"
}

function toastrSuccess(title, message) {
    toastr.success(message, title);
}

function toastrError(title, message) {
    toastr.error(message, title);
}

function toastrInfo(title, message) {
    toastr.info(message, title);
}

function toastrWarning(title, message) {
    toastr.warning(message, title);
}

function checkJwtError(response) {
    if (response.status === 401) {
        return response.json().then(data => {
            if (data.error === "Invalid or missing JWT token") {
                localStorage.setItem('jwtError', 'true'); // Lưu trạng thái đăng nhập thành công
                toastrError("Lỗi", "Phiên đăng nhập của bạn đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
                // window.location.href = "login.html";
            }
            logout();
            return Promise.reject(data); // Trả về lỗi để xử lý tiếp nếu cần
        });
    }
    return response; // Trả về response nếu không phải lỗi 401
}

async function catchForbidden(error) {
    if (error.message === "Bạn không có quyền truy cập vào trang này") {
        await Swal.fire('Lỗi', error.toString(), 'error').then((res) => {
            if (res.isConfirmed) {
                window.location.href = "index.html";
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const revenueDropdown = document.getElementById('revenue_dropdown');
    const revenueLink = document.querySelector('a[href="#revenue_dropdown"]');
    const currentUrl = window.location.pathname;
    localStorage.setItem('revenueDropdownOpen', 'false');

    // Ưu tiên mở menu nếu URL liên quan đến doanh thu
    if (currentUrl.includes('admin-bill.html') || currentUrl.includes('admin-revenue.html')) {
        revenueDropdown.classList.add('show');
        revenueLink.setAttribute('aria-expanded', 'true');
        localStorage.setItem('revenueDropdownOpen', 'true');
    }
    else if (localStorage.getItem('revenueDropdownOpen') === 'true') {
        // Mở menu nếu trạng thái lưu là mở
        revenueDropdown.classList.add('show');
        revenueLink.setAttribute('aria-expanded', 'true');
    }

    // Lưu trạng thái khi người dùng nhấn vào menu
    if (revenueLink) revenueLink.addEventListener('click', () => {
        const isOpen = revenueDropdown.classList.contains('collapsing');
        localStorage.setItem('revenueDropdownOpen', !isOpen);
    });
});