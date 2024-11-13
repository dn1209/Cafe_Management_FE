 // Function to load users dynamically
 let token = localStorage.getItem('tokenLogin'); // Giả sử token đã được lưu trong localStorage
 let selectedStoreId = '';
 let stores = {};

 document.getElementById('storeDropdown').addEventListener('change', function () {
    selectedStoreId = this.value;
    // fetchProducts(0); // Tải lại sản phẩm khi thay đổi danh mục
    loadUsers();
});

 async function loadUsers() {
    if (!token) {
        showToast("Vui lòng đăng nhập trước khi truy cập trang này.");
        window.location.href = "login.html";
        return;
    }
    try {
        let url = `http://localhost:8085/api/list`;
        const queryParams = [];
        if (selectedStoreId) {
            queryParams.push(`storeId=${encodeURIComponent(selectedStoreId)}`);
        }
        if (queryParams.length > 0) {
            url += `?${queryParams.join("&")}`;
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });
        
        await checkJwtError(response);

        if (!response.ok) throw new Error("Network response was not ok");

        const users = await response.json();
        const userList = document.getElementById('userList');

        if (users.length) {
            userList.innerHTML = users.map(
                user => {
                    const storeName = stores[user.storeId] || 'Không xác định';
                    return `
                        <tr>
                        <td>${user.userId}</td>
                            <td>${user.displayName}</td>
                            <td>${user.userName}</td>
                            <td>${user.createdAt}</td>
                            <td>${user.updatedAt}</td>
                            <td>${storeName}</td>
                            <td>${user.userRole === 0 ? "Admin" : "User"}</td>
                            <td>${user.userStatus === 0 ? "Hoạt động" : "Không hoạt động"}</td>
                            <td>
                                <button class="btn btn-warning" onclick="editUser(${user.userId})">Sửa</button>
                                <button class="btn btn-warning" onclick="editPasswordUser(${user.userId})">Đổi mật khẩu</button>
                                <button class="btn btn-danger" onclick="deleteUser(${user.userId})">Xóa</button>
                            </td>
                        </tr>
                `;
                }).join('');
        } else {
            userList.innerHTML = '<tr><td colspan="5" class="text-center">Không có user nào</td></tr>';
        }
    } catch (error) {
        console.error("Có lỗi xảy ra:", error);

    }
    
}

async function fetchStore() {
    try {
        const response = await fetch('http://localhost:8085/api_store/list', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });
        
        await checkJwtError(response);

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        stores = data.reduce((acc, store) => {
            acc[store.storeId] = store.storeName;
            return acc;
        }, {});

        console.log(stores); // Kiểm tra xem categories đã chứa dữ liệu chưa
        
        // Kiểm tra xem categoryDropdown có được điền đúng không
        const storeDropdown = document.getElementById('storeDropdown');
        storeDropdown.innerHTML = `<option value="">Tất cả sản phẩm</option>`; // Thêm option mặc định

        // Thêm các option vào dropdown
        for (let storeId in stores) {
            const option = document.createElement('option');
            option.value = storeId;
            option.textContent = stores[storeId];
            storeDropdown.appendChild(option);
        }

    } catch (error) {
        console.error("Có lỗi khi tải danh mục:", error);
    }
}

// Function to delete user
function openEditUserModal(userId) {
    // Lưu lại id sản phẩm đang sửa
    currentUserId = userId;

    // Lấy thông tin sản phẩm từ API
    fetchUserDetails(userId).then(user => {
        // Điền thông tin sản phẩm vào các trường trong form
        document.getElementById('userName').value = user.userName;
        document.getElementById('displayName').value = user.displayName;

        // Điền các danh mục vào dropdown trong modal
        const storeDropdownEdit = document.getElementById('storeDropdownEdit');
        storeDropdownEdit.innerHTML = ''; // Xóa các option cũ
        for (let storeId in stores) {
            const option = document.createElement('option');
            option.value = storeId;
            option.textContent = stores[storeId];
            storeDropdownEdit.appendChild(option);
        }

        // Chọn danh mục hiện tại của sản phẩm
        storeDropdownEdit.value = user.storeId;

        const roleDropdownEdit = document.getElementById('roleDropdownEdit');
        roleDropdownEdit.innerHTML = ''; // Xóa các option cũ
        const roles = { 0: "ADMIN", 1: "USER" };

        for (let roleId in roles) {
            const option = document.createElement('option');
            option.value = roleId;
            option.textContent = roles[roleId];
            roleDropdownEdit.appendChild(option);
        }

        // Chọn role hiện tại của user
        roleDropdownEdit.value = user.userRole;



        const statusDropdownEdit = document.getElementById('statusDropdownEdit');
        statusDropdownEdit.innerHTML = ''; // Xóa các option cũ
        const status = { 0: "HOẠT ĐỘNG", 1: "DỪNG HOẠT ĐỘNG" };

        for (let statusId in status) {
            const option = document.createElement('option');
            option.value = statusId;
            option.textContent = status[statusId];
            statusDropdownEdit.appendChild(option);
        }

        // Chọn role hiện tại của user
        statusDropdownEdit.value = user.userStatus;


        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    });
}

function openEditUserPasswordModal(userId) {
    // Lưu lại id sản phẩm đang sửa
    currentUserId = userId;

    // Lấy thông tin sản phẩm từ API
    const modal = new bootstrap.Modal(document.getElementById('editUserPasswordModal'));
    modal.show();
}

document.getElementById('saveUserPasswordButton').addEventListener('click', async () => {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    // Lấy giá trị thực tế (không có dấu .)
    // Kiểm tra nếu các trường không hợp lệ
    if (!oldPassword || !newPassword ) {
        showToast("Vui lòng nhập đầy đủ thông tin");
        return;
    }
    const updatedUser = {
        oldPassword: oldPassword,
        newPassword: newPassword,
        
    };
    console.log(updatedUser);

    try {
        const response = await fetch(`http://localhost:8085/api/change_password/${currentUserId}`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedUser)
        });

        await checkJwtError(response);

        if (!response.ok) throw new Error("Lỗi khi cập nhật sản phẩm");
        showToast("cập nhật mật khẩu thành công");

        // Đóng modal và tải lại sản phẩm
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserPasswordModal'));
        modal.hide();
        loadUsers(); // Tải lại danh sách sản phẩm sau khi cập nhật
    } catch (error) {
        console.error("Có lỗi xảy ra khi lưu thay đổi:", error);
    }
});

async function fetchUserDetails(userId) {
    const response = await fetch(`http://localhost:8085/api/detail/${userId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    });

    await checkJwtError(response);

    if (!response.ok) throw new Error("Không thể lấy thông tin sản phẩm");

    return await response.json();
}



document.getElementById('saveUserButton').addEventListener('click', async () => {
    const userName = document.getElementById('userName').value;
    const displayName = document.getElementById('displayName').value;
    const userStatus = parseInt(document.getElementById('statusDropdownEdit').value);
    const userRole = parseInt(document.getElementById('roleDropdownEdit').value);
    const storeId = parseInt(document.getElementById('storeDropdownEdit').value);
    // Lấy giá trị thực tế (không có dấu .)
    // Kiểm tra nếu các trường không hợp lệ
    if (!userName || !displayName || isNaN(userStatus) || isNaN(userRole) || isNaN(storeId)) {
        showToast("Vui lòng nhập đầy đủ thông tin");
        return;
    }
    const updatedUser = {
        userName: userName,
        storeId: parseInt(storeId), // Chuyển categoryId thành số
        userStatus: parseInt(userStatus),
        userRole: parseInt(userRole),
        displayName: displayName
    };
    console.log(updatedUser);

    try {
        const response = await fetch(`http://localhost:8085/api/update/${currentUserId}`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedUser)
        });

        await checkJwtError(response);

        if (!response.ok) throw new Error("Lỗi khi cập nhật sản phẩm");
        showToast("cập nhật sản phẩm thành công");

        // Đóng modal và tải lại sản phẩm
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modal.hide();
        loadUsers(); // Tải lại danh sách sản phẩm sau khi cập nhật
    } catch (error) {
        console.error("Có lỗi xảy ra khi lưu thay đổi:", error);
    }
});


function editPasswordUser(userId) {
    openEditUserPasswordModal(userId);
}


function editUser(userId) {
    openEditUserModal(userId);
}

// Load users when page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchStore().then(() => {
        loadUsers();
    })
});