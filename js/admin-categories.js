const token = localStorage.getItem('tokenLogin');
let currentEditCategoryId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();

    document.getElementById('add_category_btn').addEventListener('click', openAddCategoryModal);
    document.getElementById('add_category_form').addEventListener('submit', addCategory);
    document.getElementById('edit_category_form').addEventListener('submit', submitEditCategory);
});

async function loadCategories() {
    try {
        let url = 'http://localhost:8085/api-category/list';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        await checkJwtError(response);

        if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập vào trang này');
        }

        await response.json().then(data => {
            const categoryList = document.getElementById('category_list');
            categoryList.innerHTML = '';

            if (data.length === 0) {
                categoryList.innerHTML = '<tr><td colspan="5">Không có danh mục nào!</td></tr>';
                return;
            }

            data.forEach((category, index) => {
                const statusButton = category.status === 1
                    ? `<button class="btn btn-warning me-2" onclick="toggleCategoryStatus(${category.categoryId})">Vô hiệu hóa</button>`
                    : `<button class="btn btn-success me-2" onclick="toggleCategoryStatus(${category.categoryId})">Kích hoạt</button>`;

                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${index + 1}</td>
                <td>${category.categoryName}</td>
                <td>${category.status === 1 ? 'Hoạt động' : 'Không hoạt động'}</td>
                <td style="width: 400px">
                    <button class="btn btn-info me-2" onclick="editCategory(${category.categoryId}, '${category.categoryName}')">Sửa</button>
                    ${statusButton}
                </td>
            `;
                categoryList.appendChild(row);
            });
        });
    } catch (err) {
        console.error('Có lỗi khi tải danh mục:', err);
        catchForbidden(err);
        toastrError('Lỗi', err);
    }
}

function openAddCategoryModal() {
    document.getElementById('category_name').value = '';
    const modal = new bootstrap.Modal(document.getElementById('add_category_modal'));
    modal.show();
}

async function addCategory(event) {
    event.preventDefault();
    const categoryName = document.getElementById('category_name').value;
    const categoryData = { categoryName };

    try {
        const response = await fetch('http://localhost:8085/api-category/add-new', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });

        await checkJwtError(response);

        if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập vào trang này');
        }

        await response.json().then(async data => {
            if (data.message === "CATEGORY_NAME_EXISTED") {
                throw new Error('Danh mục đã tồn tại. Vui lòng chọn tên khác!');
            }
            toastrSuccess('Thành công', 'Danh mục đã được thêm mới');
            document.getElementById('add_category_form').reset();
            bootstrap.Modal.getInstance(document.getElementById('add_category_modal')).hide();
            await loadCategories();
        });
    } catch (err) {
        console.error('Có lỗi khi thêm danh mục:', err);
        catchForbidden(err);
        toastrError('Lỗi', err);
    }
}

function editCategory(categoryId, categoryName) {
    currentEditCategoryId = categoryId;
    document.getElementById('edit_category_name').value = categoryName;

    const modal = new bootstrap.Modal(document.getElementById('edit_category_modal'));
    modal.show();
}

async function submitEditCategory(event) {
    event.preventDefault();
    const categoryName = document.getElementById('edit_category_name').value;
    const categoryData = { categoryName };
    try {
        const response = await fetch(`http://localhost:8085/api-category/update/${currentEditCategoryId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });

        await checkJwtError(response);

        if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập vào trang này');
        }

        await response.json().then(async data => {
            if (data.message === "CATEGORY_NAME_EXISTED") {
                throw new Error('Danh mục đã tồn tại. Vui lòng chọn tên khác!');
            } else if (data.message === "CATEGORY_NOT_FOUND") {
                throw new Error('Danh mục không tồn tại. Vui lòng thử lại!');
            }
            toastrSuccess('Thành công', 'Danh mục đã được cập nhật');
            bootstrap.Modal.getInstance(document.getElementById('edit_category_modal')).hide();
            await loadCategories();
        });
    } catch (err) {
        console.error('Có lỗi khi cập nhật danh mục:', err);
        catchForbidden(err);
        toastrError('Lỗi', err);
    }
}

async function toggleCategoryStatus(categoryId) {
    Swal.fire({
        title: 'Bạn có chắc chắn muốn thay đổi trạng thái của danh mục này không?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`http://localhost:8085/api-category/toggle-status/${categoryId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                await checkJwtError(response);

                if (response.status === 403) {
                    throw new Error('Bạn không có quyền truy cập vào trang này');
                }

                await response.json().then(async data => {
                    if (data.message === "CATEGORY_NOT_FOUND") {
                        throw new Error('Danh mục không tồn tại. Vui lòng thử lại!');
                    }
                    toastrSuccess('Thành công', 'Trạng thái danh mục đã được cập nhật');
                    await loadCategories();
                });
            } catch (err) {
                console.error('Có lỗi khi cập nhật trạng thái danh mục:', err);
                catchForbidden(err);
                toastrError('Lỗi', err);
            }
        }
    });


}