// Lấy token từ localStorage
const token = localStorage.getItem('tokenLogin');

// Hàm fetch hóa đơn
async function fetchBills(pageNumber = 0, storeId = null) {
    try {
        let url = `http://localhost:8085/api-bill/list?page=${pageNumber}&size=10`;
        if (storeId) url += `&storeId=${storeId}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        console.log(response);

        await checkJwtError(response);

        if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập vào trang này');
        }

        if (!response.ok) throw new Error("Không thể tải danh sách hóa đơn. Vui lòng thử lại.");

        // Xử lý phản hồi
        await response.json().then(data => {
            // Kiểm tra nếu phản hồi là "No bills found"
            if (data.message === "No bills found") {
                toastrError("Lỗi", "Không tìm thấy hóa đơn nào");
                const billList = document.getElementById('bill_list');
                const pagination = document.getElementById('pagination');

                // Hiển thị thông báo không có hóa đơn
                billList.innerHTML = '<tr><td colspan="8" class="text-center">Không có hóa đơn nào</td></tr>';
                pagination.innerHTML = ''; // Xóa phân trang
                return;
            }

            // Nếu không phải "No bills found", parse JSON và xử lý
            renderBills(data.content);
            renderPagination(data);
        });
    } catch (error) {
        console.error("Error fetching bills:", error);
        catchForbidden(error);
        toastrError("Lỗi", error);
    }
}

function renderPagination(pageResponse) {
    const paginationContainer = document.getElementById('pagination');

    // Xóa nội dung phân trang cũ
    paginationContainer.innerHTML = '';

    // Tạo nút "Previous"
    const prevButton = document.createElement('button');
    // prevButton.textContent = "Previous";
    prevButton.innerHTML = `<i class="fa-solid fa-circle-chevron-left"></i>`;
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
    // nextButton.textContent = "Next";
    nextButton.innerHTML = `<i class="fa-solid fa-circle-chevron-right"></i>`;
    nextButton.disabled = pageResponse.last; // Nếu là trang cuối cùng, vô hiệu hóa nút
    if (!pageResponse.last) {
        nextButton.onclick = () => fetchBills(pageResponse.number + 1); // Lấy trang tiếp theo
    }
    paginationContainer.appendChild(nextButton);
}

// Hàm hiển thị danh sách hóa đơn
function renderBills(bills) {
    const billList = document.getElementById('bill_list');
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
                <i class="fa-solid fa-circle-info" data-bs-toggle="modal" data-bs-target="#invoice_detail_modal_${bill.billId}"></i>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="8" class="text-center">Không có hóa đơn nào</td></tr>';

    // Tạo modal cho từng hóa đơn để hiển thị chi tiết hóa đơn
    bills.forEach(bill => {
        const modalContent = `
            <div class="modal fade" id="invoice_detail_modal_${bill.billId}" tabindex="-1" aria-labelledby="invoice_detail_modal_label-${bill.billId}" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="invoice_detail_modal_label-${bill.billId}">Chi tiết hóa đơn #${bill.billId}</h5>
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
        document.getElementById('modal_container').insertAdjacentHTML('beforeend', modalContent);
    });
}

// Hàm hiển thị chi tiết hóa đơn


function renderBillDetails(details) {
    const billDetailList = document.getElementById('bill_detail_list');
    billDetailList.innerHTML = details.map(detail => `
        <tr>
            <td>${detail.productName}</td>
            <td>${detail.quantity}</td>
            <td>${(detail.price).toLocaleString()} VND</td>
            <td>${(detail.price * detail.quantity).toLocaleString()} VND</td>
        </tr>
    `).join('');
}


// Gọi fetchBills khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    fetchBills(0);
});

