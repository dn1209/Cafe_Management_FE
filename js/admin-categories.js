const token = localStorage.getItem('tokenLogin');
let selectedStoreId = '';
 let stores = {};


 document.getElementById('storeDropdown').addEventListener('change', function () {
    selectedStoreId = this.value;
    // fetchProducts(0); // Tải lại sản phẩm khi thay đổi danh mục
    loadCategories();
});
// Hàm tải danh mục
async function loadCategories() {
    try {
        let url = `http://localhost:8085/api_category/list`;
        const queryParams = [];
        if (selectedStoreId) {
            queryParams.push(`storeId=${encodeURIComponent(selectedStoreId)}`);
        }
        if (queryParams.length > 0) {
            url += `?${queryParams.join("&")}`;
        }
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        await checkJwtError(response);

        const data = await response.json();
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = '';  // Xóa danh sách hiện tại

        // Nếu không có danh mục nào
        if (data.length === 0) {
            categoryList.innerHTML = '<tr><td colspan="3">Không có danh mục nào!</td></tr>';
            return;
        }

        data.forEach((category, index) => {
            const storeName = stores[category.storeId] || 'Không xác định';
            const buttonHtml = category.status === 0
                ? `<button class="btn btn-danger" onclick="deleteCategory(${category.categoryId})">Active</button>`
                : `<button class="btn btn-warning" onclick="deleteCategory(${category.categoryId})">Unactive</button>`;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${category.categoryName}</td>
                <td>${storeName}</td>
                <td>${category.status === 1 ? "Hoạt động" : "Không hoạt động"}</td>

                <td>
                    <button class="btn btn-warning" onclick="editCategory(${category.categoryId}, '${category.categoryName}')">Sửa</button>
                    ${buttonHtml}
                </td>
            `;
            categoryList.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching categories:', err);
    }
}
function openAddCategoryModal() {
    document.getElementById('categoryName').value = '';
    const storeDropdownAdd = document.getElementById('storeDropdownAdd');
    storeDropdownAdd.innerHTML = '<option value="">Chọn store...</option>'; // Option mặc định

    // Điền danh mục vào dropdown (đảm bảo `categories` đã có giá trị)
    if (typeof stores === 'object' && stores !== null) {
        for (let storeId in stores) {
            const option = document.createElement('option');
            option.value = storeId;
            option.textContent = stores[storeId];
            storeDropdownAdd.appendChild(option);
        }
    } else {
        console.error("Categories is not defined or is not an object.");
    }

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
    modal.show();
}

document.getElementById('addCategoryForm').addEventListener('submit', async function (event) {
    event.preventDefault(); 
    const categoryName = document.getElementById('categoryName').value;
    const storeDropdownAdd = document.getElementById('storeDropdownAdd').value;
    const CategoryData = {
        categoryName: categoryName,
        storeId : parseInt(storeDropdownAdd)
    };
    try {
        const response = await fetch('http://localhost:8085/api_category/add_new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(CategoryData)
        });

        if (response.ok) {
            showToast('Danh mục đã được thêm mới');
            document.getElementById('addCategoryForm').reset(); // Xóa dữ liệu trong form
            const addCategoryModal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
            addCategoryModal.hide(); // Đóng modal sau khi thêm
            document.querySelector('.modal-backdrop')?.remove();
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
    try {
        const response = await fetch(`http://localhost:8085/api_category/delete/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showToast('Danh mục đã được cập nhật thành công');
            loadCategories(); // Reload danh mục sau khi xóa
        } else {
            showToast('Không thể xóa danh mục');
        }
    } catch (err) {
        console.error('Error deleting category:', err);
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

        const activeStores = data.filter(store => store.storeStatus === 1);

        stores = activeStores.reduce((acc, store) => {
            acc[store.storeId] = store.storeName;
            return acc;
        }, {});

        console.log(stores); // Kiểm tra xem categories đã chứa dữ liệu chưa
        
        // Kiểm tra xem categoryDropdown có được điền đúng không
        const storeDropdown = document.getElementById('storeDropdown');
        storeDropdown.innerHTML = `<option value="">Tất cả store</option>`; // Thêm option mặc định

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
function closeModal() {
    const modalElement = document.getElementById('addCategoryForm');
    const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modalInstance.hide();

    // Xóa backdrop nếu còn tồn đọng
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
}

// Tải danh mục khi trang được tải
document.getElementById('addCategoryButton').addEventListener('click', openAddCategoryModal);

document.addEventListener('DOMContentLoaded', () => {
    fetchStore().then(() => {
        loadCategories();
    })
});
