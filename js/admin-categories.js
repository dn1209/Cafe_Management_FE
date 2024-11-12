const token = localStorage.getItem('tokenLogin');

// Hàm tải danh mục
async function loadCategories() {
    try {
        const response = await fetch('http://localhost:8085/api_category/list', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = '';  // Xóa danh sách hiện tại

        // Nếu không có danh mục nào
        if (data.length === 0) {
            categoryList.innerHTML = '<tr><td colspan="3">Không có danh mục nào!</td></tr>';
            return;
        }

        data.forEach((category, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${category.categoryName}</td>
                <td>
                    <button class="btn btn-warning" onclick="editCategory(${category.categoryId}, '${category.categoryName}')">Sửa</button>
                    <button class="btn btn-danger" onclick="deleteCategory(${category.categoryId})">Xóa</button>
                </td>
            `;
            categoryList.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching categories:', err);
    }
}

document.getElementById('addCategoryForm').addEventListener('submit', async function (event) {
    event.preventDefault(); 
    const categoryName = document.getElementById('categoryName').value;

    try {
        const response = await fetch('http://localhost:8085/api_category/add_new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ categoryName })
        });

        if (response.ok) {
            showToast('Danh mục đã được thêm mới');
            document.getElementById('addCategoryForm').reset(); // Xóa dữ liệu trong form
            const addCategoryModal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
            addCategoryModal.hide(); // Đóng modal sau khi thêm
            loadCategories(); // Cập nhật danh sách danh mục
        } else {
            showToast('Có lỗi vui lòng thử lại');
        }
    } catch (err) {
        console.error('Error adding category:', err);
        Swal.fire('Lỗi', 'Đã xảy ra lỗi khi thêm danh mục.', 'error');
    }
});

// Hàm mở modal sửa danh mục
function editCategory(categoryId, categoryName) {
    const editCategoryName = document.getElementById('editCategoryName');
    editCategoryName.value = categoryName;

    const editCategoryForm = document.getElementById('editCategoryForm');
    editCategoryForm.onsubmit = (event) => {
        event.preventDefault();
        updateCategory(categoryId);
    };

    const editCategoryModal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
    editCategoryModal.show();
}

// Hàm cập nhật danh mục
async function updateCategory(categoryId) {
    const categoryName = document.getElementById('editCategoryName').value;

    try {
        const response = await fetch(`http://localhost:8085/api_category/update/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: categoryName
        });

        if (response.ok) {
            showToast('Danh mục đã được cập nhật');
            loadCategories(); // Tải lại danh mục sau khi cập nhật
            const editCategoryModal = bootstrap.Modal.getInstance(document.getElementById('editCategoryModal'));
            editCategoryModal.hide(); // Đóng modal
        } else {
            showToast('Không thể cập nhật danh mục');
        }
    } catch (err) {
        console.error('Error updating category:', err);
    }
}

// Hàm xóa danh mục
async function deleteCategory(categoryId) {
    if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
        try {
            const response = await fetch(`http://localhost:8085/api_category/delete/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showToast('Danh mục đã được xóa thành công');
                loadCategories(); // Reload danh mục sau khi xóa
            } else {
                showToast('Không thể xóa danh mục');
            }
        } catch (err) {
            console.error('Error deleting category:', err);
        }
    }
}

// Tải danh mục khi trang được tải
document.addEventListener('DOMContentLoaded', loadCategories);
