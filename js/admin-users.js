const token = localStorage.getItem('tokenLogin');
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        toastrError("Lỗi", "Vui lòng đăng nhập trước khi truy cập trang này.");
        window.location.href = "login.html";
        return;
    }

    await loadUsers();

    document.getElementById('addUserButton').addEventListener('click', openAddUserModal);
    document.getElementById('addUserForm').addEventListener('submit', addUser);
    document.getElementById('saveUserButton').addEventListener('click', saveUserChanges);
    document.getElementById('saveUserPasswordButton').addEventListener('click', saveUserPassword);
});

async function loadUsers() {
    try {
        let url = `http://localhost:8085/api/list`;
        

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        });
        
        await checkJwtError(response);

        if (!response.ok) throw new Error("Không thể tải danh sách người dùng");

        const users = await response.json();
        const userList = document.getElementById('userList');

        if (users.length) {
            userList.innerHTML = users.map(user => {
                return `
                    <tr>
                        <td>${user.userId}</td>
                        <td>${user.displayName}</td>
                        <td>${user.userName}</td>
                        <td>${user.userPhone}</td>
                        <td>${user.createdAt}</td>
                        <td>${user.updatedAt}</td>
                        <td>${user.userRole === 0 ? "Admin" : "User"}</td>
                        <td>${user.userStatus === 1 ? "Hoạt động" : "Không hoạt động"}</td>
                        <td>
                            <button class="btn btn-warning me-2" data-user-id="${user.userId}" data-action="edit">Sửa</button>
                            <button class="btn btn-info" data-user-id="${user.userId}" data-action="change-password">Đổi mật khẩu</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            userList.innerHTML = '<tr><td colspan="10" class="text-center">Không có người dùng nào</td></tr>';
        }

        // Thêm sự kiện cho các nút hành động
        document.querySelectorAll('button[data-action="edit"]').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.getAttribute('data-user-id');
                editUser(userId);
            });
        });

        document.querySelectorAll('button[data-action="change-password"]').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.getAttribute('data-user-id');
                editPasswordUser(userId);
            });
        });

    } catch (error) {
        console.error("Có lỗi xảy ra khi tải danh sách người dùng:", error);
    }
}

async function editUser(userId) {
    currentUserId = userId;

    try {
        const user = await fetchUserDetails(userId);

        document.getElementById('userNameEdit').value = user.userName;
        document.getElementById('displayNameEdit').value = user.displayName;
        document.getElementById('userPhoneEdit').value = user.userPhone;

        

        const roleDropdownEdit = document.getElementById('roleDropdownEdit');
        roleDropdownEdit.innerHTML = '';
        const roles = { 0: "ADMIN", 1: "USER" };

        for (let roleId in roles) {
            const option = document.createElement('option');
            option.value = roleId;
            option.textContent = roles[roleId];
            roleDropdownEdit.appendChild(option);
        }

        roleDropdownEdit.value = user.userRole;

        const statusDropdownEdit = document.getElementById('statusDropdownEdit');
        statusDropdownEdit.innerHTML = '';
        const statuses = { 1: "HOẠT ĐỘNG", 0: "DỪNG HOẠT ĐỘNG" };

        for (let statusId in statuses) {
            const option = document.createElement('option');
            option.value = statusId;
            option.textContent = statuses[statusId];
            statusDropdownEdit.appendChild(option);
        }

        statusDropdownEdit.value = user.userStatus;

        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    } catch (error) {
        console.error('Có lỗi khi tải thông tin người dùng:', error);
    }
}

async function editPasswordUser(userId) {
    currentUserId = userId;
    const modal = new bootstrap.Modal(document.getElementById('editUserPasswordModal'));
    modal.show();
}

async function fetchUserDetails(userId) {
    const response = await fetch(`http://localhost:8085/api/detail/${userId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    });

    await checkJwtError(response);

    if (!response.ok) throw new Error("Không thể lấy thông tin người dùng");

    return await response.json();
}

async function saveUserChanges() {
    const userName = document.getElementById('userNameEdit').value;
    const displayName = document.getElementById('displayNameEdit').value;
    const userStatus = parseInt(document.getElementById('statusDropdownEdit').value);
    const userRole = parseInt(document.getElementById('roleDropdownEdit').value);
    const userPhone = document.getElementById('userPhoneEdit').value;

    if (!userName || !displayName || isNaN(userStatus) || isNaN(userRole) || !userPhone ) {
        toastrError("Lỗi", "Vui lòng nhập đầy đủ thông tin");
        return;
    }

    const updatedUser = {
        userName,
        userStatus,
        userRole,
        displayName,
        userPhone
    };

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

        if (!response.ok) throw new Error("Lỗi khi cập nhật người dùng");
        toastrSuccess("Thành công", "Cập nhật người dùng thành công");

        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
        await loadUsers();
    } catch (error) {
        console.error("Có lỗi xảy ra khi lưu thay đổi:", error);
    }
}

async function saveUserPassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    if (!oldPassword || !newPassword ) {
        toastrError("Lỗi", "Vui lòng nhập đầy đủ thông tin");
        return;
    }

    const passwordData = {
        oldPassword,
        newPassword
    };

    try {
        const response = await fetch(`http://localhost:8085/api/change_password/${currentUserId}`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(passwordData)
        });

        await checkJwtError(response);

        if (!response.ok) throw new Error("Lỗi khi cập nhật mật khẩu");
        toastrSuccess("Thành công", "Cập nhật mật khẩu thành công");

        bootstrap.Modal.getInstance(document.getElementById('editUserPasswordModal')).hide();
        await loadUsers();
    } catch (error) {
        console.error("Có lỗi xảy ra khi cập nhật mật khẩu:", error);
    }
}

function openAddUserModal() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('displayName').value = '';
    document.getElementById('userPhone').value = '';

    const roleDropdownAdd = document.getElementById('roleDropdownAdd');

    

    roleDropdownAdd.innerHTML = '';
    const roles = { 0: "ADMIN", 1: "USER" };

    for (let roleId in roles) {
        const option = document.createElement('option');
        option.value = roleId;
        option.textContent = roles[roleId];
        roleDropdownAdd.appendChild(option);
    }

    roleDropdownAdd.value = "1";

    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
}

async function addUser(event) {
    event.preventDefault(); 
    const userName = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const displayName = document.getElementById('displayName').value;
    const userRole = parseInt(document.getElementById('roleDropdownAdd').value);
    const userPhone = document.getElementById('userPhone').value;

    if (!username || !password || !displayName || isNaN(userRole)  || !userPhone ) {
        toastrError("Lỗi", "Vui lòng nhập đầy đủ thông tin");
        return;
    }

    const userData = {
        userName,
        password,
        displayName,
        userRole,
        userPhone
    };

    try {
        const response = await fetch('http://localhost:8085/api/register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        await checkJwtError(response);

        if (response.ok) {
            toastrSuccess("Thành công", "Người dùng đã được thêm mới.");
            document.getElementById('addUserForm').reset();
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            await loadUsers();
        } else {
            toastrError("Lỗi", "Có lỗi vui lòng thử lại.");
        }
    } catch (err) {
        console.error('Có lỗi khi thêm người dùng:', err);
        Swal.fire('Lỗi', 'Đã xảy ra lỗi khi thêm người dùng.', 'error');
    }
}
