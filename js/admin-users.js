 // Function to load users dynamically
 function loadUsers() {
    fetch('http://localhost:8085/api_users/list')
        .then(response => response.json())
        .then(data => {
            const userList = document.getElementById('userList');
            userList.innerHTML = '';  // Clear current list
            data.forEach((user, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td><button class="btn btn-danger" onclick="deleteUser(${user.id})">Xóa</button></td>
                `;
                userList.appendChild(row);
            });
        })
        .catch(err => {
            console.error('Error fetching users:', err);
        });
}

// Function to delete user
function deleteUser(userId) {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
        fetch(`http://localhost:8085/api_users/delete/${userId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert('Người dùng đã được xóa thành công!');
            loadUsers();  // Reload users list
        })
        .catch(err => {
            console.error('Error deleting user:', err);
        });
    }
}

// Load users when page loads
document.addEventListener('DOMContentLoaded', loadUsers);