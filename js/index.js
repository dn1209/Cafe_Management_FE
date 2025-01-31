let selectedCategoryId = null;
let searchKeyword = "";
const token = localStorage.getItem('tokenLogin');

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('loginSuccess') === 'true') {
        toastrSuccess("Thành công", `Đăng nhập thành công với TOKEN là : ${token}`);
        localStorage.removeItem('loginSuccess'); // Xóa trạng thái sau khi hiển thị
    }
});

function onSearchInputChange() {
    searchKeyword = document.getElementById('search_input').value.trim();
    fetchProducts(0);  // Tải lại sản phẩm với trang đầu tiên khi người dùng thay đổi từ khóa tìm kiếm
}

function checkJwtError(response) {
    if (response.status === 401) {
        return response.json().then(data => {
            if (data.error === "Invalid or missing JWT token") {
                localStorage.setItem('jwtError', 'true'); // Lưu trạng thái đăng nhập thành công
                toastrError("Lỗi", "Phiên đăng nhập của bạn đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
                // window.location.href = "login.html";
            }
            logout();
            return Promise.reject(data); // Trả về lỗi để xử lý tiếp nếu cần
        });
    }
    return response; // Trả về response nếu không phải lỗi 401
}

async function fetchProducts(page = 0, size = 12) {
    if (!token) {
        toastrError("Lỗi", "Vui lòng đăng nhập trước khi truy cập trang này.");
        window.location.href = "login.html";
        return;
    }

    try {
        let url = `http://localhost:8085/api-products/list-for-user?page=${page}&size=${size}`;
        const queryParams = [];
        // Thêm categoryId và keyword vào URL nếu có giá trị
        if (selectedCategoryId) {
            queryParams.push(`categoryId=${encodeURIComponent(selectedCategoryId)}`);
        }
        if (searchKeyword) {
            queryParams.push(`keyword=${encodeURIComponent(searchKeyword)}`);
        }
        if (queryParams.length > 0) {
            url += `&${queryParams.join("&")}`;
        }

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

        await response.json().then(products => {
            const categories = JSON.parse(sessionStorage.getItem('categories')); // Lấy danh sách categories từ sessionStorage

            // Hiện các sản phẩm có categoryId chưa bị vô hiệu hóa
            products.content = products.content.filter(product =>
                categories.some(category => category.categoryId === product.categoryId)
            );

            const productList = document.getElementById('product_list');
            if (products.content.length) {
                productList.style.display = "";
                productList.innerHTML = products.content.map(product => `
                <div class="col-md-3 product-card user-select-none">
                    <div class="card" data-id="${product.productId}" onclick="addToOrderSummary(${product.productId})">
                        <div class="card-body text-center">
                            <h6 class="card-title">${product.productName}</h6>
                            <p class="card-text">Đơn giá: ${product.prdSellPrice.toLocaleString()} VND</p>
                        </div>
                    </div>
                </div>
            `).join('');
            } else {
                productList.style.display = "block";
                productList.innerHTML = '<p align="center"><b>Không có sản phẩm nào</b></p>';
            }

            // Hiển thị phân trang
            renderPagination(products);
        });

    } catch (error) {
        console.error("Có lỗi xảy ra:", error);
        toastrError("Lỗi", error);
    }
}

function renderPagination(productsPage) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = `
        ${productsPage.first ? '' : `<button onclick="fetchProducts(${productsPage.number - 1})"><i class="fa-solid fa-circle-chevron-left""></i></button>`}
        <span>Page ${productsPage.numberOfElements !== 0 ? productsPage.number + 1 : 0} of ${productsPage.totalPages}</span>
        ${productsPage.last ? '' : `<button onclick="fetchProducts(${productsPage.number + 1})"><i class="fa-solid fa-circle-chevron-right"></i></button>`}
    `; // Nếu không có sản phẩm, hiển thị số trang là 0

    // Thêm class "active" cho trang hiện tại
    const buttons = paginationContainer.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.textContent === `${productsPage.number + 1}`) {
            button.classList.add('active');
        }
    });
}


async function fetchCategories() {
    try {
        const response = await fetch("http://localhost:8085/api-category/list-for-user", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        // Kiểm tra nếu có lỗi JWT
        await checkJwtError(response);

        if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập vào trang này');
        }

        await response.json().then(categories => {
            sessionStorage.setItem('categories', JSON.stringify(categories)); // Lưu danh sách categories vào sessionStorage
            const categoryList = document.querySelector(".sidebar .nav");

            // Xóa các mục cũ và thêm mục "Tất cả sản phẩm" ở đầu danh sách
            categoryList.innerHTML = '';
            const allCategoryItem = document.createElement("li");
            allCategoryItem.className = "nav-item";
            allCategoryItem.innerHTML = `<a class="nav-link active-category" href="#" onclick="handleCategoryClick('', this)">Tất cả sản phẩm</a>`;
            categoryList.appendChild(allCategoryItem);

            // Thêm các mục category từ API
            categories.forEach(category => {
                if (category.status === 1) { // Chỉ hiển thị các category có status là 1
                    const categoryItem = document.createElement("li");
                    categoryItem.className = "nav-item";
                    categoryItem.innerHTML = `<a class="nav-link" href="#" onclick="handleCategoryClick(${category.categoryId}, this)">${category.categoryName}</a>`;
                    categoryList.appendChild(categoryItem);
                }
            });
        });
    } catch (error) {
        console.error("Có lỗi xảy ra khi lấy danh mục:", error);
    }
}
// Cập nhật phần Order Summary khi nhấn vào sản phẩm
// Cập nhật phần Order Summary khi nhấn vào sản phẩm
function updateOrderSummary() {
    const orderSummaryTable = document.querySelector('.table tbody');
    let totalAmount = 0;
    let totalQuantity = 0;

    // Duyệt qua các hàng trong bảng và tính tổng tiền, tổng số lượng
    Array.from(orderSummaryTable.rows).forEach(row => {
        const qtyCell = row.cells[2]; // Số lượng
        const amountCell = row.cells[4]; // Thành tiền

        const quantity = parseInt(qtyCell.textContent) || 0; // Đảm bảo giá trị số lượng hợp lệ
        const amount = parseInt(amountCell.textContent.replace(/\D/g, '')) || 0; // Thành tiền (loại bỏ các ký tự không phải số)

        totalQuantity += quantity;
        totalAmount += amount;
    });

    // Cập nhật tổng số lượng và tổng tiền
    document.getElementById('total_quantity').textContent = totalQuantity;
    document.getElementById('total_amount').textContent = totalAmount.toLocaleString('vi-VN') + " VND"; // Hiển thị VND
}

// Hàm thêm sản phẩm vào giỏ hàng
async function addToOrderSummary(productId) {
    if (!token) {
        toastrError("Lỗi", "Vui lòng đăng nhập trước khi truy cập trang này.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`http://localhost:8085/api-products/detail/${productId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
        });

        // Kiểm tra nếu có lỗi JWT
        await checkJwtError(response);

        if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập vào trang này');
        }

        const product = await response.json();

        const orderSummaryTable = document.querySelector('.table tbody');
        let existingRow = Array.from(orderSummaryTable.rows).find(row =>
            row.cells[1].textContent === product.productName
        );

        if (existingRow) {
            // Nếu sản phẩm đã tồn tại, tăng số lượng và cập nhật thành tiền
            const qtyCell = existingRow.cells[2];
            const amountCell = existingRow.cells[4];

            const currentQuantity = parseInt(qtyCell.textContent) || 0;
            const price = product.prdSellPrice || 0;
            const newQuantity = currentQuantity + 1;
            const newAmount = newQuantity * price;

            qtyCell.textContent = newQuantity;
            amountCell.textContent = newAmount.toLocaleString('vi-VN') + " VND"; // Định dạng thành tiền
        } else {
            // Nếu sản phẩm chưa tồn tại, thêm một hàng mới
            const newRow = document.createElement('tr');
            const quantity = 1;
            const amount = product.prdSellPrice * quantity;

            newRow.setAttribute('data-id', product.productId); // Lưu productId vào thuộc tính data-id

            newRow.innerHTML = `
                <td>${orderSummaryTable.rows.length + 1}</td>
                <td>${product.productName}</td>
                <td>${quantity}</td>
                <td>${product.prdSellPrice.toLocaleString('vi-VN')} VND</td> <!-- Giá sản phẩm định dạng -->
                <td>${amount.toLocaleString('vi-VN')} VND</td> <!-- Thành tiền định dạng -->
                <td><i class="fa-solid fa-trash-can" onclick="removeFromOrderSummary(this)"></i></td>
                
            `;
            orderSummaryTable.appendChild(newRow);
        }

        // Cập nhật tổng tiền và số lượng sau khi thêm sản phẩm
        updateOrderSummary();
        toastr.success("Thêm sản phẩm vào giỏ hàng thành công!", "Thành công");

    } catch (error) {
        console.error("Có lỗi xảy ra khi thêm sản phẩm vào giỏ:", error);
        toastrError("Lỗi", error);
    }
}
// Hàm xóa sản phẩm khỏi giỏ hàng
function removeFromOrderSummary(button) {
    const row = button.closest('tr');
    const orderSummaryTable = document.querySelector('.table tbody');

    // Lấy số lượng của sản phẩm hiện tại
    const qtyCell = row.cells[2]; // Số lượng
    let quantity = parseInt(qtyCell.textContent) || 0;

    if (quantity > 1) {
        // Nếu sản phẩm có số lượng lớn hơn 1, chỉ giảm số lượng và tính lại thành tiền
        quantity--;
        qtyCell.textContent = quantity;

        const priceCell = row.cells[3]; // Giá sản phẩm
        const price = parseInt(priceCell.textContent.replace(/\D/g, '')) || 0; // Loại bỏ ký tự không phải số
        const amountCell = row.cells[4]; // Thành tiền

        // Tính lại thành tiền
        const newAmount = price * quantity;
        amountCell.textContent = newAmount.toLocaleString('vi-VN') + " VND"; // Định dạng thành tiền
    } else {
        // Nếu sản phẩm chỉ còn 1, xóa dòng sản phẩm
        row.remove();
    }

    // Cập nhật lại số thứ tự cho các hàng trong bảng
    Array.from(orderSummaryTable.rows).forEach((row, index) => {
        row.cells[0].textContent = index + 1; // Cập nhật lại số thứ tự
    });

    // Cập nhật lại tổng tiền và số lượng sau khi xóa hoặc giảm số lượng
    updateOrderSummary();
    toastr.error("Xóa sản phẩm khỏi giỏ hàng thành công!", "Thành công");
}


document.querySelector('.btn-success').addEventListener('click', function () {
    const orderSummaryTable = document.querySelector('.table tbody');
    const products = [];

    // Lấy thông tin từ mỗi hàng trong bảng Order Summary
    Array.from(orderSummaryTable.rows).forEach(row => {
        const productId = row.getAttribute('data-id'); // Lấy productId từ data-id của hàng
        const quantity = parseInt(row.cells[2].textContent);

        // Thêm đối tượng sản phẩm vào mảng
        products.push({
            productId: productId,
            quantity: quantity,
        });
    });

    // In ra JSON của mảng sản phẩm
    console.log(JSON.stringify(products, null, 2));
});

function handleCategoryClick(categoryId, element) {
    selectedCategoryId = categoryId || null; // Cập nhật categoryId đã chọn hoặc null nếu là "Tất cả sản phẩm"
    fetchProducts(); // Gọi API với categoryId và keyword đã lưu

    // Xóa lớp active-category khỏi tất cả các mục
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active-category');
    });

    // Thêm lớp active-category vào mục hiện tại
    element.classList.add('active-category');
}


// Xử lý khi chọn một category
function onCategorySelect(categoryId) {
    selectedCategoryId = categoryId === 'all' ? null : categoryId;
    fetchProducts(); // Gọi API với categoryId đã chọn
}

// Xử lý khi tìm kiếm
document.getElementById("search_input").addEventListener("input", (e) => {
    searchKeyword = e.target.value;
    fetchProducts(); // Gọi API với từ khóa tìm kiếm mới
});


document.addEventListener("DOMContentLoaded", () => {
    fetchCategories(); // Lấy danh sách danh mục
    fetchProducts();   // Gọi tất cả sản phẩm khi mới vào trang
});
// Lắng nghe sự kiện khi người dùng nhập từ khóa tìm kiếm
document.getElementById('search_input').addEventListener('input', function (e) {
    const keyword = e.target.value; // Lấy giá trị người dùng nhập
    fetchProducts(keyword); // Gọi API với keyword khi có giá trị
});




document.getElementById('checkout_btn').addEventListener('click', function () {
    const orderSummaryTable = document.querySelector('.table tbody');
    const checkoutSummaryTable = document.querySelector('#checkout_summary tbody');
    const totalQuantityCheckout = document.getElementById('total_quantity_checkout');
    const totalAmountCheckout = document.getElementById('total_amount_checkout');

    let totalQuantity = 0;
    let totalAmount = 0;

    // Kiểm tra nếu không có sản phẩm trong giỏ hàng
    if (orderSummaryTable.rows.length === 0) {
        toastrWarning("Cảnh báo", "Số lượng sản phẩm không thể bằng 0! Vui lòng thêm sản phẩm vào giỏ trước khi thanh toán.");
        return; // Kết thúc hàm nếu không có sản phẩm
    }


    // Xóa tất cả các dòng trong bảng checkout
    checkoutSummaryTable.innerHTML = '';

    // Duyệt qua các dòng trong bảng giỏ hàng và thêm vào bảng checkout
    Array.from(orderSummaryTable.rows).forEach((row, index) => {
        const productName = row.cells[1].textContent;
        const quantity = parseInt(row.cells[2].textContent) || 0;
        const price = parseInt(row.cells[3].textContent.replace(/\D/g, '')) || 0;
        const amount = quantity * price;

        totalQuantity += quantity;
        totalAmount += amount;

        // Thêm một dòng mới vào bảng checkout
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${index + 1}</td>
            <td>${productName}</td>
            <td>${quantity}</td>
            <td>${price.toLocaleString('vi-VN')} VND</td>
            <td>${amount.toLocaleString('vi-VN')} VND</td>
        `;
        checkoutSummaryTable.appendChild(newRow);
    });

    // Cập nhật tổng số lượng và tổng tiền với định dạng chính xác
    totalQuantityCheckout.textContent = totalQuantity;
    totalAmountCheckout.textContent = totalAmount.toLocaleString('vi-VN') + " VND";

    // Hiển thị modal
    const checkoutModal = new bootstrap.Modal(document.getElementById('checkout_modal'));
    checkoutModal.show();
});

// Hàm đóng modal checkout
function closeCheckoutModal() {
    const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkout_modal'));
    checkoutModal.hide(); // Dùng hide() để đóng modal của Bootstrap
}

// Khi nhấn "Xác nhận thanh toán"
document.getElementById('confirm_checkout').addEventListener('click', async function () {
    const note = document.getElementById('note').value; // Ghi chú
    // Lấy giá trị thực của tiền thu từ khách (không có dấu phân cách nghìn)

    // Kiểm tra xem tiền thu có đủ không
    const totalAmount = parseInt(document.getElementById('total_amount').textContent.replace(" VND", "").replace(/,/g, "")) || 0;

    // Tạo đối tượng đơn hàng
    const order = {
        detailBill: [],
        notes: note,
        orderStatus: 1
    };

    // Lấy thông tin sản phẩm trong giỏ hàng
    const orderSummaryTable = document.querySelector('.table tbody');
    Array.from(orderSummaryTable.rows).forEach(row => {
        const productId = row.getAttribute('data-id');
        const quantity = parseInt(row.cells[2].textContent);
        order.detailBill.push({ productId, quantity });
    });

    // In ra thông tin đơn hàng (có thể gửi lên server ở đây)
    console.log("Đơn hàng:", JSON.stringify(order, null, 2));

    try {
        const response = await fetch(`http://localhost:8085/api-bill/add-new`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(order)
        });
        await checkJwtError(response);

        if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập vào trang này');
        }

        await response.json().then(async data => {
            if (data.message === "USER_NOT_FOUND") {
                throw new Error('Đặt hàng bằng tên người dùng không tồn tại!');
            } else if (data.message === "DETAIL_BILL_NOT_FOUND") {
                throw new Error('Chi tiết hóa đơn không tồn tại!');
            } else if (data.message === "PRODUCT_NOT_FOUND") {
                throw new Error('Sản phẩm không tồn tại!');
            } else if (data.message === "Invalid Product ID format") {
                throw new Error("Định dạng ID sản phẩm không hợp lệ!");
            }

            toastrSuccess("Thành công", "Tạo hóa đơn thành công!");
            orderSummaryTable.innerHTML = ''; // Xóa tất cả các hàng

            // Đặt lại tổng số lượng và tổng tiền về 0
            document.getElementById('total_quantity').textContent = 0;
            document.getElementById('total_amount').textContent = '0 VND';
        });
    } catch (error) {
        console.error('Có lỗi xảy ra:', error);
        toastrError("Lỗi", error);
    }

    // Đóng modal và thực hiện các hành động tiếp theo (gửi đơn hàng, v.v.)
    closeCheckoutModal();
});