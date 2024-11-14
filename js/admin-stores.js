
const token = localStorage.getItem('tokenLogin');


async function loadStores() {
    try {
        let url = `http://localhost:8085/api_store/list`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        await checkJwtError(response);

        const data = await response.json();
        const storeList = document.getElementById('storeList');
        storeList.innerHTML = '';  // Xóa danh sách hiện tại

        // Nếu không có danh mục nào
        if (data.length === 0) {
            storeList.innerHTML = '<tr><td colspan="3">Không có cửa hàng nào!</td></tr>';
            return;
        }

        data.forEach((store, index) => {
            const row = document.createElement('tr');
            const buttonHtml = store.storeStatus === 0
                ? `<button class="btn btn-danger" onclick="deleteStore(${store.storeId})">Active</button>`
                : `<button class="btn btn-warning" onclick="deleteStore(${store.storeId})">Unactive</button>`;
            row.innerHTML = `
                <td>${store.storeId}</td>
                <td>${store.storeName}</td>
                <td>${store.storeAddress}</td>
                <td>${store.storeCreatedDate}</td>
                <td>${store.storeUpdatedDate}</td>
                <td>${store.storeStatus === 1 ? "Hoạt động" : "Không hoạt động"}</td>

                <td>
                    <button class="btn btn-warning" onclick="editStore(${store.storeId})">Sửa</button>
                    ${buttonHtml}
                </td>
            `;
            storeList.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching categories:', err);
    }
}


function openEditStoreModal(storeId) {
    // Lưu lại id sản phẩm đang sửa
    currentStoreId = storeId;

    // Lấy thông tin sản phẩm từ API
    fetchStoreDetails(storeId).then(store => {
        // Điền thông tin sản phẩm vào các trường trong form
        document.getElementById('editStoreName').value = store.storeName;
        document.getElementById('editStoreAddress').value = store.storeAddress;

        const statusDropdownEdit = document.getElementById('statusDropdownEdit');
        statusDropdownEdit.innerHTML = ''; // Xóa các option cũ
        const status = { 1: "HOẠT ĐỘNG", 0: "DỪNG HOẠT ĐỘNG" };

        for (let statusId in status) {
            const option = document.createElement('option');
            option.value = statusId;
            option.textContent = status[statusId];
            statusDropdownEdit.appendChild(option);
        }

        // Chọn role hiện tại của user
        statusDropdownEdit.value = store.storeStatus;


        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById('editStoreModal'));
        modal.show();
    });
}

async function fetchStoreDetails(storeId) {
    const response = await fetch(`http://localhost:8085/api_store/detail/${storeId}`, {
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


document.getElementById('saveStoreButton').addEventListener('click', async () => {
    const storeName = document.getElementById('editStoreName').value;
    const storeAddress = document.getElementById('editStoreAddress').value;
    const storeStatus = parseInt(document.getElementById('statusDropdownEdit').value);
 
    // Lấy giá trị thực tế (không có dấu .)
    // Kiểm tra nếu các trường không hợp lệ
    if (!storeName || !storeAddress || isNaN(storeStatus)) {
        showToast("Vui lòng nhập đầy đủ thông tin");
        return;
    }
    const updatedStore = {
        storeName: storeName,
        storeAddress: storeAddress, 
        storeStatus: parseInt(storeStatus)
    };
    console.log(updatedStore);

    try {
        const response = await fetch(`http://localhost:8085/api_store/update/${currentStoreId}`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedStore)
        });

        await checkJwtError(response);

        if (!response.ok) throw new Error("Lỗi khi cập nhật sản phẩm");
        showToast("cập nhật sản phẩm thành công");

        // Đóng modal và tải lại sản phẩm
        const modal = bootstrap.Modal.getInstance(document.getElementById('editStoreModal'));
        modal.hide();
        loadStores(); // Tải lại danh sách sản phẩm sau khi cập nhật
    } catch (error) {
        console.error("Có lỗi xảy ra khi lưu thay đổi:", error);
    }
});

function openAddStoreModal() {
    document.getElementById('storeName').value = '';
    document.getElementById('storeAddress').value = '';

    const statusDropdownAdd = document.getElementById('statusDropdownAdd');
    statusDropdownAdd.innerHTML = '<option value="">Chọn trạng thái</option>'; // Option mặc định
    const status = { 1: "HOẠT ĐỘNG", 0: "DỪNG HOẠT ĐỘNG" };

    // Điền trạng thái vào dropdown
    for (let statusId in status) {
        const option = document.createElement('option');
        option.value = statusId;
        option.textContent = status[statusId];
        statusDropdownAdd.appendChild(option);
    }

    // Đặt trạng thái mặc định là "HOẠT ĐỘNG"
    statusDropdownAdd.value = "1";

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('addStoreModal'));
    modal.show();
}

document.getElementById('addStoreForm').addEventListener('submit', async function (event) {
    event.preventDefault(); 
    const storeName = document.getElementById('storeName').value;
    const storeAddress = document.getElementById('storeAddress').value;
    const statusDropdownAdd = document.getElementById('statusDropdownAdd').value;

    const storeData = {
        storeName: storeName,
        storeAddress: storeAddress,
        storeId : parseInt(statusDropdownAdd)
    };
    try {
        const response = await fetch('http://localhost:8085/api_store/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(storeData)
        });

        if (response.ok) {
            showToast('Cửa hàng đã được thêm mới');
            document.getElementById('addStoreForm').reset(); // Xóa dữ liệu trong form
            const addStoreModal = bootstrap.Modal.getInstance(document.getElementById('addStoreModal'));
            addStoreModal.hide(); // Đóng modal sau khi thêm
            document.querySelector('.modal-backdrop')?.remove();
            loadStores(); // Cập nhật danh sách danh mục
        } else {
            showToast('Có lỗi vui lòng thử lại');
        }
    } catch (err) {
        console.error('Error adding category:', err);
        Swal.fire('Lỗi', 'Đã xảy ra lỗi khi thêm danh mục.', 'error');
    }
});

async function deleteStore(storeId) {

    try {
        // Gửi request xóa sản phẩm đến API
        const response = await fetch(`http://localhost:8085/api_store/delete/${storeId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        await checkJwtError(response); // Kiểm tra lỗi JWT nếu có

        if (!response.ok) throw new Error("Không thể xóa sản phẩm");
        showToast("cập nhật sản phẩm thành công");
        // Sau khi xóa thành công, tải lại danh sách sản phẩm
        loadStores(); // Tải lại sản phẩm sau khi xóa
    } catch (error) {
        console.error("Có lỗi xảy ra khi xóa sản phẩm:", error);
        alert("Có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại.");
    }
}


function closeModal() {
    const modalElement = document.getElementById('addStoreForm');
    const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modalInstance.hide();

    // Xóa backdrop nếu còn tồn đọng
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
}



function editStore(storeId) {
    openEditStoreModal(storeId);
}

document.getElementById('addStoreButton').addEventListener('click', openAddStoreModal);


document.addEventListener('DOMContentLoaded', () => {
    loadStores();
});
