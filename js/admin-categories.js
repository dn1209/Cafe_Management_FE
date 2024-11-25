const token = localStorage.getItem('tokenLogin');
let selectedStoreId = '';
let stores = {};
let currentEditCategoryId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchStores();
    await loadCategories();

    document.getElementById('storeDropdown').addEventListener('change', async () => {
        selectedStoreId = document.getElementById('storeDropdown').value;
        await loadCategories();
    });

    document.getElementById('addCategoryButton').addEventListener('click', openAddCategoryModal);
    document.getElementById('addCategoryForm').addEventListener('submit', addCategory);
    document.getElementById('editCategoryForm').addEventListener('submit', submitEditCategory);
});

async function fetchStores() {
    try {
        const response = await fetch('http://localhost:8085/api_store/list', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        await checkJwtError(response);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        stores = data
            .filter(store => store.storeStatus === 1)
            .reduce((acc, store) => ({ ...acc, [store.storeId]: store.storeName }), {});

        const storeDropdown = document.getElementById('storeDropdown');
        storeDropdown.innerHTML = `<option value="">Tất cả cửa hàng</option>`;

        Object.entries(stores).forEach(([storeId, storeName]) => {
            const option = document.createElement('option');
            option.value = storeId;
            option.textContent = storeName;
            storeDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Có lỗi khi tải danh sách cửa hàng:', error);
    }
}

async function loadCategories() {
    try {
        let url = 'http://localhost:8085/api_category/list';
        if (selectedStoreId) url += `?storeId=${encodeURIComponent(selectedStoreId)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        await checkJwtError(response);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = '';

        if (data.length === 0) {
            categoryList.innerHTML = '<tr><td colspan="5">Không có danh mục nào!</td></tr>';
            return;
        }

        data.forEach((category, index) => {
            const storeName = stores[category.storeId] || 'Không xác định';
            const statusButton = category.status === 1
                ? `<button class="btn btn-danger" onclick="toggleCategoryStatus(${category.categoryId})">Vô hiệu hóa</button>`
                : `<button class="btn btn-success" onclick="toggleCategoryStatus(${category.categoryId})">Kích hoạt</button>`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${category.categoryName}</td>
                <td>${storeName}</td>
                <td>${category.status === 1 ? 'Hoạt động' : 'Không hoạt động'}</td>
                <td>
                    <button class="btn btn-warning me-2" onclick="editCategory(${category.categoryId}, '${category.categoryName}', ${category.storeId})">Sửa</button>
                    ${statusButton}
                </td>
            `;
            categoryList.appendChild(row);
        });
    } catch (err) {
        console.error('Có lỗi khi tải danh mục:', err);
        toastrError('Lỗi', 'Có lỗi xảy ra khi tải danh mục.');
    }
}

function openAddCategoryModal() {
    document.getElementById('categoryName').value = '';
    const storeDropdownAdd = document.getElementById('storeDropdownAdd');
    storeDropdownAdd.innerHTML = '<option value="">Chọn cửa hàng...</option>';

    Object.entries(stores).forEach(([storeId, storeName]) => {
        const option = document.createElement('option');
        option.value = storeId;
        option.textContent = storeName;
        storeDropdownAdd.appendChild(option);
    });

    const modal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
    modal.show();
}

async function addCategory(event) {
    event.preventDefault();
    const categoryName = document.getElementById('categoryName').value;
    const storeId = parseInt(document.getElementById('storeDropdownAdd').value);
    const categoryData = { categoryName, storeId };

    try {
        const response = await fetch('http://localhost:8085/api_category/add_new', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });

        if (response.ok) {
            toastrSuccess('Thành công', 'Danh mục đã được thêm mới');
            document.getElementById('addCategoryForm').reset();
            bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
            await loadCategories();
        } else {
            toastrError('Lỗi', 'Có lỗi vui lòng thử lại');
        }
    } catch (err) {
        console.error('Có lỗi khi thêm danh mục:', err);
        Swal.fire('Lỗi', 'Đã xảy ra lỗi khi thêm danh mục.', 'error');
    }
}

function editCategory(categoryId, categoryName, storeId) {
    currentEditCategoryId = categoryId;
    document.getElementById('editCategoryName').value = categoryName;
    const storeDropdownEdit = document.getElementById('storeDropdownEdit');
    storeDropdownEdit.innerHTML = '<option value="">Chọn cửa hàng...</option>';

    Object.entries(stores).forEach(([id, name]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        if (id == storeId) option.selected = true;
        storeDropdownEdit.appendChild(option);
    });

    const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
    modal.show();
}

async function submitEditCategory(event) {
    event.preventDefault();
    const categoryName = document.getElementById('editCategoryName').value;
    const storeId = parseInt(document.getElementById('storeDropdownEdit').value);

    try {
        const response = await fetch(`http://localhost:8085/api_category/update/${currentEditCategoryId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: categoryName
        });

        if (response.ok) {
            toastrSuccess('Thành công', 'Danh mục đã được cập nhật');
            bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
            await loadCategories();
        } else {
            toastrError('Lỗi', 'Không thể cập nhật danh mục');
        }
    } catch (err) {
        console.error('Có lỗi khi cập nhật danh mục:', err);
    }
}

async function toggleCategoryStatus(categoryId) {
    const confirmAction = confirm('Bạn có chắc chắn muốn thay đổi trạng thái của danh mục này không?');
    if (!confirmAction) return;

    try {
        const response = await fetch(`http://localhost:8085/api_category/toggle_status/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            toastrSuccess('Thành công', 'Trạng thái danh mục đã được cập nhật');
            await loadCategories();
        } else {
            toastrError('Lỗi', 'Không thể cập nhật trạng thái danh mục');
        }
    } catch (err) {
        console.error('Có lỗi khi cập nhật trạng thái danh mục:', err);
    }
}
