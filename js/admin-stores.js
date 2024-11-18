const token = localStorage.getItem('tokenLogin');
let currentStoreId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadStores();

    document.getElementById('addStoreButton').addEventListener('click', openAddStoreModal);
    document.getElementById('addStoreForm').addEventListener('submit', addStore);
    document.getElementById('saveStoreButton').addEventListener('click', saveStoreChanges);
});

async function loadStores() {
    try {
        const url = 'http://localhost:8085/api_store/list';
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        await checkJwtError(response);

        if (!response.ok) throw new Error('Không thể tải danh sách cửa hàng');

        const data = await response.json();
        const storeList = document.getElementById('storeList');
        storeList.innerHTML = '';

        if (data.length === 0) {
            storeList.innerHTML = '<tr><td colspan="7">Không có cửa hàng nào!</td></tr>';
            return;
        }

        data.forEach((store, index) => {
            const statusButton = store.storeStatus === 1
                ? `<button class="btn btn-danger" onclick="toggleStoreStatus(${store.storeId})">Vô hiệu hóa</button>`
                : `<button class="btn btn-success" onclick="toggleStoreStatus(${store.storeId})">Kích hoạt</button>`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${store.storeName}</td>
                <td>${store.storeAddress}</td>
                <td>${store.storeCreatedDate}</td>
                <td>${store.storeUpdatedDate}</td>
                <td>${store.storeStatus === 1 ? "Hoạt động" : "Không hoạt động"}</td>
                <td>
                    <button class="btn btn-warning me-2" onclick="openEditStoreModal(${store.storeId})">Sửa</button>
                    ${statusButton}
                </td>
            `;
            storeList.appendChild(row);
        });
    } catch (err) {
        console.error('Có lỗi khi tải danh sách cửa hàng:', err);
    }
}

async function openEditStoreModal(storeId) {
    currentStoreId = storeId;

    try {
        const store = await fetchStoreDetails(storeId);
        document.getElementById('editStoreName').value = store.storeName;
        document.getElementById('editStoreAddress').value = store.storeAddress;

        const statusDropdownEdit = document.getElementById('statusDropdownEdit');
        statusDropdownEdit.innerHTML = '';
        const statusOptions = { 1: "HOẠT ĐỘNG", 0: "DỪNG HOẠT ĐỘNG" };

        for (let statusId in statusOptions) {
            const option = document.createElement('option');
            option.value = statusId;
            option.textContent = statusOptions[statusId];
            statusDropdownEdit.appendChild(option);
        }

        statusDropdownEdit.value = store.storeStatus;

        const modal = new bootstrap.Modal(document.getElementById('editStoreModal'));
        modal.show();
    } catch (error) {
        console.error('Có lỗi khi mở modal chỉnh sửa cửa hàng:', error);
    }
}

async function fetchStoreDetails(storeId) {
    const response = await fetch(`http://localhost:8085/api_store/detail/${storeId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    await checkJwtError(response);

    if (!response.ok) throw new Error('Không thể lấy thông tin cửa hàng');

    return await response.json();
}

async function saveStoreChanges() {
    const storeName = document.getElementById('editStoreName').value;
    const storeAddress = document.getElementById('editStoreAddress').value;
    const storeStatus = parseInt(document.getElementById('statusDropdownEdit').value);

    if (!storeName || !storeAddress || isNaN(storeStatus)) {
        showToast('Vui lòng nhập đầy đủ thông tin');
        return;
    }

    const updatedStore = { storeName, storeAddress, storeStatus };

    try {
        const response = await fetch(`http://localhost:8085/api_store/update/${currentStoreId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedStore)
        });

        await checkJwtError(response);

        if (!response.ok) throw new Error('Lỗi khi cập nhật cửa hàng');

        showToast('Cập nhật cửa hàng thành công');

        const modal = bootstrap.Modal.getInstance(document.getElementById('editStoreModal'));
        modal.hide();
        await loadStores();
    } catch (error) {
        console.error('Có lỗi xảy ra khi lưu thay đổi:', error);
    }
}

function openAddStoreModal() {
    document.getElementById('storeName').value = '';
    document.getElementById('storeAddress').value = '';

    const statusDropdownAdd = document.getElementById('statusDropdownAdd');
    statusDropdownAdd.innerHTML = '';
    const statusOptions = { 1: "HOẠT ĐỘNG", 0: "DỪNG HOẠT ĐỘNG" };

    for (let statusId in statusOptions) {
        const option = document.createElement('option');
        option.value = statusId;
        option.textContent = statusOptions[statusId];
        statusDropdownAdd.appendChild(option);
    }

    statusDropdownAdd.value = "1";

    const modal = new bootstrap.Modal(document.getElementById('addStoreModal'));
    modal.show();
}

async function addStore(event) {
    event.preventDefault();
    const storeName = document.getElementById('storeName').value;
    const storeAddress = document.getElementById('storeAddress').value;
    const storeStatus = parseInt(document.getElementById('statusDropdownAdd').value);

    if (!storeName || !storeAddress || isNaN(storeStatus)) {
        showToast('Vui lòng nhập đầy đủ thông tin');
        return;
    }

    const storeData = { storeName, storeAddress, storeStatus };

    try {
        const response = await fetch('http://localhost:8085/api_store/register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(storeData)
        });

        await checkJwtError(response);

        if (!response.ok) throw new Error('Lỗi khi thêm cửa hàng');

        showToast('Cửa hàng đã được thêm mới');
        document.getElementById('addStoreForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addStoreModal')).hide();
        await loadStores();
    } catch (err) {
        console.error('Có lỗi khi thêm cửa hàng:', err);
        Swal.fire('Lỗi', 'Đã xảy ra lỗi khi thêm cửa hàng.', 'error');
    }
}

async function toggleStoreStatus(storeId) {
    const confirmAction = confirm('Bạn có chắc chắn muốn thay đổi trạng thái của cửa hàng này không?');
    if (!confirmAction) return;

    try {
        const response = await fetch(`http://localhost:8085/api_store/toggle_status/${storeId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        await checkJwtError(response);

        if (!response.ok) throw new Error('Không thể cập nhật trạng thái cửa hàng');

        showToast('Trạng thái cửa hàng đã được cập nhật');
        await loadStores();
    } catch (error) {
        console.error('Có lỗi xảy ra khi cập nhật trạng thái cửa hàng:', error);
        alert('Có lỗi xảy ra khi cập nhật trạng thái cửa hàng. Vui lòng thử lại.');
    }
}
