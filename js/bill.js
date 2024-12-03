// Lấy token từ localStorage
const token = localStorage.getItem('tokenLogin');
const userName = localStorage.getItem('userName');
// Hàm fetchBills để lấy và hiển thị danh sách hóa đơn
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

// Hàm fetch hóa đơn với phân trang
async function fetchBills(pageNumber = 0) {
    const token = localStorage.getItem('tokenLogin');
    if (!token) {
        toastrError("Lỗi", "Vui lòng đăng nhập trước khi truy cập trang này.");
        window.location.href = "login.html";
        return;
    }

    try {
        const url = `http://localhost:8085/api-bill/list-for-user?page=${pageNumber}&size=10`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        
        // Render hóa đơn (dữ liệu được trả về từ API)
        renderBills(data.content);
        
        // Render phân trang
        renderPagination(data);

    } catch (error) {
        console.error("Có lỗi xảy ra:", error);
        toastrError("Lỗi", "Lỗi khi tải hóa đơn, vui lòng thử lại.");
    }
}

// Hàm hiển thị danh sách hóa đơn
function renderBills(bills) {
    const billList = document.getElementById('invoice-table-body');
    billList.innerHTML = bills.length ? bills.map((bill, index) => `
        <tr>
            <td>${bill.billId}</td>
            <td>#${bill.billId}</td>
            <td>${bill.sellDate}</td>
            <td>${bill.totalQuantity}</td>
            <td>${bill.saleName}</td>
            <td>${bill.totalPrice.toLocaleString()} VND</td>
            <td>${bill.notes || 'Không có ghi chú'}</td>
            <td>
                <button class="btn btn-custom" data-bs-toggle="modal" data-bs-target="#invoice-detail-modal-${bill.billId}">
                    Chi tiết
                </button>
                <button class="btn btn-custom btn-demo" data-index="${index}">
                     Hóa đơn
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="9" class="text-center">Không có hóa đơn nào</td></tr>';

    // Thêm event listener cho từng nút "Xem hóa đơn demo"
    document.querySelectorAll('.btn-demo').forEach((button) => {
        const index = button.getAttribute('data-index');
        button.addEventListener('click', () => renderBillForDemo(bills[index]));
    });

    // Tạo modal cho từng hóa đơn để hiển thị chi tiết hóa đơn
    bills.forEach(bill => {
        const modalContent = `
            <div class="modal fade" id="invoice-detail-modal-${bill.billId}" tabindex="-1" aria-labelledby="invoice-detail-modal-label-${bill.billId}" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="invoice-detail-modal-label-${bill.billId}">Chi tiết hóa đơn #${bill.billId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Tên sản phẩm</th>
                                        <th>Số lượng</th>
                                        <th>Giá</th>
                                        <th>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bill.detailBill.map(detail => `
                                        <tr>
                                            <td>${detail.productName}</td>
                                            <td>${detail.quantity}</td>
                                            <td>${(detail.price / detail.quantity).toLocaleString()} VND</td>
                                            <td>${(detail.price).toLocaleString()} VND</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('modal-container').insertAdjacentHTML('beforeend', modalContent);
    });
}


function renderBillForDemo(bill) {
    // Tạo modal nội dung hóa đơn demo
    const modalContent = `
        <div class="modal fade" id="demo-bill-modal-${bill.billId}" tabindex="-1" aria-labelledby="demo-bill-modal-label-${bill.billId}" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="demo-bill-modal-label-${bill.billId}">Hóa đơn #${bill.billId}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div style="font-family: Arial, sans-serif;">
                            <h1 style="text-align: center;">CAFE POS</h1>
                            <h2 style="text-align: center;">HÓA ĐƠN #${bill.billId}</h2>
                            <p><strong>Ngày bán:</strong> ${bill.sellDate}</p>
                            <p><strong>Người bán:</strong> ${bill.saleName}</p>
                            <p><strong>Tổng số lượng:</strong> ${bill.totalQuantity}</p>
                            <p><strong>Tổng tiền:</strong> ${bill.totalPrice.toLocaleString()} VND</p>
                            <p><strong>Ghi chú:</strong> ${bill.notes || 'Không có ghi chú'}</p>
                            
                            <h3>Chi tiết hóa đơn:</h3>
                            <table border="1" cellpadding="5" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th>Tên sản phẩm</th>
                                        <th>Số lượng</th>
                                        <th>Giá</th>
                                        <th>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bill.detailBill.map(detail => `
                                        <tr>
                                            <td>${detail.productName}</td>
                                            <td>${detail.quantity}</td>
                                            <td>${( detail.price / detail.quantity).toLocaleString()} VND</td>
                                            <td>${( detail.price).toLocaleString()} VND</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Chèn modal vào #modal-container thay vì body
    document.getElementById('modal-container').insertAdjacentHTML('beforeend', modalContent);

    // Hiển thị modal
    const demoBillModal = new bootstrap.Modal(document.getElementById(`demo-bill-modal-${bill.billId}`));
    demoBillModal.show();
}

// Gọi hàm fetchBills khi trang được tải
document.addEventListener('DOMContentLoaded', () => fetchBills(0)); 





