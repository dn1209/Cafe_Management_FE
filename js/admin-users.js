const token = localStorage.getItem('tokenLogin');
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        toastrError("Lỗi", "Vui lòng đăng nhập trước khi truy cập trang này.");
        window.location.href = "login.html";
        return;
    }

    await loadUsers();

    document.getElementById('add_user_btn').addEventListener('click', openAddUserModal);
    document.getElementById('add_user_form').addEventListener('submit', addUser);
    document.getElementById('save_user_btn').addEventListener('click', saveUserChanges);
    document.getElementById('save_user_password_btn').addEventListener('click', saveUserPassword);
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

        if (response.status === 403) {
            throw Error('Bạn không có quyền truy cập vào trang này');
        }

        if (!response.ok) throw Error("Không thể tải danh sách người dùng");

        await response.json().then(users => {
            const userList = document.getElementById('user_list');

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
        });

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
        catchForbidden(error);
        toastrError("Lỗi", error);
    }
}

async function editUser(userId) {
    try {
        const user = await fetchUserDetails(userId);

        document.getElementById('user_name_edit').value = user.userName;
        document.getElementById('display_name_edit').value = user.displayName;
        document.getElementById('user_phone_edit').value = user.userPhone;

        const roleDropdownEdit = document.getElementById('role_dropdown_edit');
        roleDropdownEdit.innerHTML = '';
        const roles = { 0: "ADMIN", 1: "USER" };

        for (let roleId in roles) {
            const option = document.createElement('option');
            option.value = roleId;
            option.textContent = roles[roleId];
            roleDropdownEdit.appendChild(option);
        }

        roleDropdownEdit.value = user.userRole;

        const statusDropdownEdit = document.getElementById('status_dropdown_edit');
        statusDropdownEdit.innerHTML = '';
        const statuses = { 1: "HOẠT ĐỘNG", 0: "DỪNG HOẠT ĐỘNG" };

        for (let statusId in statuses) {
            const option = document.createElement('option');
            option.value = statusId;
            option.textContent = statuses[statusId];
            statusDropdownEdit.appendChild(option);
        }

        statusDropdownEdit.value = user.userStatus;

        const modal = new bootstrap.Modal(document.getElementById('edit_user_modal'));
        modal.show();
    } catch (error) {
        console.error('Có lỗi khi tải thông tin người dùng:', error);
    }
}

async function editPasswordUser(userId) {
    currentUserId = userId;
    const modal = new bootstrap.Modal(document.getElementById('edit_user_password_modal'));
    modal.show();
}

async function fetchUserDetails(userId) {
    currentUserId = userId;

    try {
        const response = await fetch(`http://localhost:8085/api/detail/${userId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        });

        await checkJwtError(response);

        if (response.status === 403) {
            throw Error('Bạn không có quyền truy cập vào trang này');
        } else if (response.status === 404) {
            throw Error('Người dùng không tồn tại');
        }

        if (!response.ok) throw Error("Không thể lấy thông tin người dùng");

        return await response.json();
    } catch (error) {
        console.error("Có lỗi xảy ra khi tải thông tin người dùng:", error);
        catchForbidden(error);
        toastrError("Lỗi", error);
    }
}

async function saveUserChanges() {
    const userName = document.getElementById('user_name_edit').value;
    const displayName = document.getElementById('display_name_edit').value;
    const userStatus = parseInt(document.getElementById('status_dropdown_edit').value);
    const userRole = parseInt(document.getElementById('role_dropdown_edit').value);
    const userPhone = document.getElementById('user_phone_edit').value;

    if (!userName || !displayName || isNaN(userStatus) || isNaN(userRole) || !userPhone) {
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

        if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập vào trang này');
        } else if (response.status === 404) {
            throw new Error('Người dùng không tồn tại');
        }

        await response.json().then(async () => {
            toastrSuccess("Thành công", "Cập nhật người dùng thành công");
            bootstrap.Modal.getInstance(document.getElementById('edit_user_modal')).hide();
            await loadUsers();
        });
    } catch (error) {
        console.error("Có lỗi xảy ra khi lưu thay đổi:", error);
        catchForbidden(error);
        toastrError("Lỗi", error);
    }
}

async function saveUserPassword() {
    const oldPassword = document.getElementById('old_password').value;
    const newPassword = document.getElementById('new_password').value;

    if (!oldPassword || !newPassword) {
        toastrError("Lỗi", "Vui lòng nhập đầy đủ thông tin");
        return;
    }

    const passwordData = {
        oldPassword,
        newPassword
    };

    try {
        const response = await fetch(`http://localhost:8085/api/change-password/${currentUserId}`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(passwordData)
        });

        await checkJwtError(response);

        if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập vào trang này');
        } else if (response.status === 404) {
            throw new Error('Người dùng không tồn tại');
        }

        await response.json().then(async data => {
            if (data.message === "INVALID_PASSWORD") {
                throw new Error('Mật khẩu cũ không đúng. Vui lòng thử lại');
            }
            toastrSuccess("Thành công", "Cập nhật mật khẩu thành công");
            bootstrap.Modal.getInstance(document.getElementById('edit_user_password_modal')).hide();
            await loadUsers();
        });
    } catch (error) {
        console.error("Có lỗi xảy ra khi cập nhật mật khẩu:", error);
        catchForbidden(error);
        toastrError("Lỗi", error);
    }
}

function openAddUserModal() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('display_name').value = '';
    document.getElementById('user_phone').value = '';

    const roleDropdownAdd = document.getElementById('role_dropdown_add');

    roleDropdownAdd.innerHTML = '';
    const roles = { 0: "ADMIN", 1: "USER" };

    for (let roleId in roles) {
        const option = document.createElement('option');
        option.value = roleId;
        option.textContent = roles[roleId];
        roleDropdownAdd.appendChild(option);
    }

    roleDropdownAdd.value = "1";

    const modal = new bootstrap.Modal(document.getElementById('add_user_modal'));
    modal.show();
}

async function addUser(event) {
    event.preventDefault();
    const userName = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const displayName = document.getElementById('display_name').value;
    const userRole = parseInt(document.getElementById('role_dropdown_add').value);
    const userPhone = document.getElementById('user_phone').value;

    if (!userName || !password || !displayName || isNaN(userRole) || !userPhone) {
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

        if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập vào trang này');
        }

        await response.json().then(async data => {
            if (data.message === "USER_ALREADY_EXISTS") {
                throw new Error('Người dùng đã tồn tại. Vui lòng thử lại!');
            }
            toastrSuccess("Thành công", "Người dùng đã được thêm mới.");
            document.getElementById('add_user_form').reset();
            bootstrap.Modal.getInstance(document.getElementById('add_user_modal')).hide();
            await loadUsers();
        });
    } catch (err) {
        console.error('Có lỗi khi thêm người dùng:', err);
        catchForbidden(err);
        toastrError('Lỗi', err);
    }
}
