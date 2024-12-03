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
                window.location.href = "login.html";
            }
            return Promise.reject(data); // Trả về lỗi để xử lý tiếp nếu cần
        });
    }
    return response; // Trả về response nếu không phải lỗi 401
}

const collapseElementList = document.querySelectorAll('.collapse')
const collapseList = [...collapseElementList].map(collapseEl => new bootstrap.Collapse(collapseEl));

document.addEventListener('DOMContentLoaded', () => {
    const revenueDropdown = document.getElementById('revenueDropdown');
    const revenueLink = document.querySelector('a[href="#revenueDropdown"]');
    const currentUrl = window.location.pathname;

    // Ưu tiên mở menu nếu URL liên quan đến doanh thu
    if (currentUrl.includes('admin-bill.html') || currentUrl.includes('admin-revenue-statistics.html')) {
        revenueDropdown.classList.add('show');
        revenueLink.setAttribute('aria-expanded', 'true');
        localStorage.setItem('revenueDropdownOpen', 'true');
    }
    // else if (localStorage.getItem('revenueDropdownOpen') === 'true') {
    //     // Mở menu nếu trạng thái lưu là mở
    //     revenueDropdown.classList.add('show');
    //     revenueLink.setAttribute('aria-expanded', 'true');
    // }

    // Lưu trạng thái khi người dùng nhấn vào menu
    if (revenueLink) revenueLink.addEventListener('click', () => {
        const isOpen = revenueDropdown.classList.contains('collapsing');
        console.log(isOpen);
        // localStorage.setItem('revenueDropdownOpen', !isOpen);
    });
});