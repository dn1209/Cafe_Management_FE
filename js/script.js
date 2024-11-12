function login() {
    const username = document.getElementById("username").value;
    const parentuser = document.getElementById("parentuser").value;
    const password = document.getElementById("password").value;

    const apiUrl = 'http://localhost:8085/api/login'; // Thay thế với URL API của bạn
    const headers = {
        'Content-Type': 'application/json'
    };

    const body = JSON.stringify({
        username: username,
        parentuser: parentuser,
        password: password
    });
    console.log(body);

    fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: body
    })
    .then(response => response.json())
    .then(data => {
        if (data.tokenLogin) {
            // Lưu các thông tin cần thiết vào localStorage
            localStorage.setItem('tokenLogin', data.tokenLogin);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userName', data.userName);
            localStorage.setItem('email', data.email);
            localStorage.setItem('userRole', data.userRole)
            localStorage.setItem('loginSuccess', 'true');
            localStorage.setItem('loginStatus','true') // Lưu trạng thái đăng nhập thành công
            window.location.href = "index.html";

            // Thay đổi URL phù hợp
        } else {
            showToast("Đăng nhập thất bại. Vui lòng thử lại.");
        }
    })
    .catch(error => {
        console.error('Có lỗi xảy ra:', error);
        showToast("Có lỗi khi kết nối đến API.");
    });
}


document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('jwtError') === 'true') {
        showToast("Token đã hết hạn vui lòng đăng nhập lại");
        localStorage.removeItem('jwtError'); // Xóa trạng thái sau khi hiển thị
    }
});

