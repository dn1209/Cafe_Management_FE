// Hàm kiểm tra trạng thái đăng ký
function checkRegisterStatus() {
    const apiUrl = 'http://localhost:8085/api/checking-register'; // Thay URL API của bạn

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const registerButton = document.getElementById('register_button');
            if (data === true) {
                // Hiển thị nút đăng ký nếu chưa có tài khoản admin
                registerButton.style.display = 'block';
            } else {
                // Ẩn nút đăng ký nếu đã có tài khoản admin
                registerButton.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Không thể kiểm tra trạng thái đăng ký admin:', error);
            toastrError("Lỗi", `Không thể kiểm tra trạng thái đăng ký admin. Vui lòng thử lại.`);
        });
}

// Hàm đăng nhập
function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const apiUrl = 'http://localhost:8085/api/login'; // Thay URL API của bạn
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*'
    };

    const body = JSON.stringify({
        userName: username,
        password: password
    });

    fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: body
    })
    .then(response => {
        console.log(response);
        return response.json();
    })
    .then(data => {
        if (data.token) {
            // Lưu các thông tin cần thiết vào localStorage
            localStorage.setItem('tokenLogin', data.token);
            localStorage.setItem('userId', data.id);
            localStorage.setItem('userName', data.username);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('loginSuccess', 'true');
            localStorage.setItem('loginStatus', 'true'); // Lưu trạng thái đăng nhập thành công
            window.location.href = "index.html";
        } else {
            toastrError("Lỗi", "Đăng nhập thất bại. Vui lòng thử lại.");

        }
    })
    .catch(error => {
        console.error('Có lỗi xảy ra:', error);
        toastrError("Lỗi", "Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.");
    });
}

// Hàm đăng ký
function registerAdmin() {
    const username = document.getElementById('reg_username').value;
    const password = document.getElementById('reg_password').value;

    const apiUrl = 'http://localhost:8085/api/registerHidden'; // Thay URL API của bạn
    const headers = {
        'Content-Type': 'application/json'
    };

    const body = JSON.stringify({
        userName: username,
        password: password
    });

    fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: body
    })
    .then(response => {
        if (response.status === 200) {
            return response.json(); // Nếu status = 200, xử lý tiếp
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    })
    .then(data => {
        // Kiểm tra nếu phản hồi có userId
        if (data.userId) {
            toastrSuccess("Thành công", "Đăng ký thành công!");
            checkRegisterStatus(); // Cập nhật trạng thái sau khi đăng ký
        } else {
            toastrError("Lỗi", "Đăng ký thất bại. Vui lòng thử lại.");
        }
    })
    .catch(error => {
        console.error('Lỗi khi đăng ký:', error);
        toastrError("Lỗi", "Đăng ký thất bại. Vui lòng thử lại.");
    });
}

// Kiểm tra trạng thái khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    checkRegisterStatus();

    // Gắn sự kiện keydown cho các ô nhập liệu
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                login();
            }
        });
    });
});
