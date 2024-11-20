// Lấy token từ localStorage
const token = localStorage.getItem('tokenLogin');

// Hàm fetch hóa đơn
async function fetchBills(pageNumber = 0, storeId = null) {
    try {
        let url = `http://localhost:8085/api_bill/list?page=${pageNumber}&size=10`;
        if (storeId) url += `&storeId=${storeId}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error("Failed to fetch bills");

        // Xử lý phản hồi
        const responseText = await response.text();

        // Kiểm tra nếu phản hồi là "No bills found"
        if (responseText === "No bills found") {
            const billList = document.getElementById('billList');
            const pagination = document.getElementById('pagination');

            // Hiển thị thông báo không có hóa đơn
            billList.innerHTML = '<tr><td colspan="8" class="text-center">Không có hóa đơn nào</td></tr>';
            pagination.innerHTML = ''; // Xóa phân trang
            return;
        }

        // Nếu không phải "No bills found", parse JSON và xử lý
        const data = JSON.parse(responseText);
        renderBills(data.content);
        renderPagination(data);
    } catch (error) {
        console.error("Error fetching bills:", error);
        alert("Không thể tải danh sách hóa đơn. Vui lòng thử lại.");
    }
}

function renderPagination(pageResponse) {
    const paginationContainer = document.getElementById('pagination');
    
    // Xóa nội dung phân trang cũ
    paginationContainer.innerHTML = '';

    // Tạo nút "Previous"
    const prevButton = document.createElement('button');
    prevButton.textContent = "Previous";
    prevButton.disabled = pageResponse.first; // Nếu là trang đầu tiên, vô hiệu hóa nút
    if (!pageResponse.first) {
        prevButton.onclick = () => fetchBills(pageResponse.number - 1); // Lấy trang trước
    }
    paginationContainer.appendChild(prevButton);

    // Hiển thị số trang hiện tại và tổng số trang
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${pageResponse.number + 1} of ${pageResponse.totalPages}`;
    paginationContainer.appendChild(pageInfo);

    // Tạo nút "Next"
    const nextButton = document.createElement('button');
    nextButton.textContent = "Next";
    nextButton.disabled = pageResponse.last; // Nếu là trang cuối cùng, vô hiệu hóa nút
    if (!pageResponse.last) {
        nextButton.onclick = () => fetchBills(pageResponse.number + 1); // Lấy trang tiếp theo
    }
    paginationContainer.appendChild(nextButton);
}

async function loadStores() {
    try {
        const url = `http://localhost:8085/api_store/list`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error("Failed to fetch stores");

        const stores = await response.json();

        const storeDropdown = document.getElementById('storeDropdown');
        storeDropdown.innerHTML = stores.map(store => `
            <option value="${store.storeId}">${store.storeName}</option>
        `).join('');

        // Tự động tải hóa đơn cho cửa hàng đầu tiên
        if (stores.length > 0) {
            fetchBills(0, stores[0].storeId);
        }
    } catch (error) {
        console.error("Error loading stores:", error);
        alert("Không thể tải danh sách cửa hàng. Vui lòng thử lại.");
    }
}

// Hàm hiển thị danh sách hóa đơn
function renderBills(bills) {
    const billList = document.getElementById('billList');
    billList.innerHTML = bills.length ? bills.map((bill, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${bill.billId}</td>
            <td>${bill.sellDate}</td>
            <td>${bill.totalQuantity}</td>
            <td>${bill.saleName}</td>
            <td>${bill.totalPrice.toLocaleString()} VND</td>
            <td>${bill.notes || 'Không có ghi chú'}</td>
            <td>
                <button class="btn btn-primary" onclick="fetchBillDetails(${bill.billId})" data-bs-toggle="modal" data-bs-target="#billDetailModal">
                    Xem chi tiết
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="8" class="text-center">Không có hóa đơn nào</td></tr>';
}

// Hàm hiển thị chi tiết hóa đơn
async function fetchBillDetails(billId) {
    try {
        const url = `http://localhost:8085/api_bill/details/${billId}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error("Failed to fetch bill details");

        const details = await response.json();
        renderBillDetails(details);
    } catch (error) {
        console.error("Error fetching bill details:", error);
        alert("Không thể tải chi tiết hóa đơn. Vui lòng thử lại.");
    }
}

function renderBillDetails(details) {
    const billDetailList = document.getElementById('billDetailList');
    billDetailList.innerHTML = details.map(detail => `
        <tr>
            <td>${detail.productName}</td>
            <td>${detail.quantity}</td>
            <td>${detail.price.toLocaleString()} VND</td>
            <td>${(detail.quantity * detail.price).toLocaleString()} VND</td>
        </tr>
    `).join('');
}
document.addEventListener('DOMContentLoaded', () => {
    loadStores(); // Tải danh sách cửa hàng khi trang được tải

    // Thêm sự kiện thay đổi cửa hàng
    const storeDropdown = document.getElementById('storeDropdown');
    storeDropdown.addEventListener('change', () => {
        const selectedStoreId = storeDropdown.value;
        fetchBills(0, selectedStoreId); // Gọi lại API với storeId mới
    });

    document.getElementById('refreshBillButton').addEventListener('click', () => {
        const selectedStoreId = storeDropdown.value;
        fetchBills(0, selectedStoreId); // Làm mới hóa đơn với storeId đã chọn
    });
});

// Gọi fetchBills khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    fetchBills(0);
    document.getElementById('refreshBillButton').addEventListener('click', () => fetchBills(0));
});
