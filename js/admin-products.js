let token = localStorage.getItem('tokenLogin'); // Giả sử token đã được lưu trong localStorage
let selectedCategoryId = ''; // Biến lưu chọn category
let searchKeyword = '';
let categories = {};
let currentProductId = null;

// Hàm xử lý thay đổi lựa chọn danh mục
document.getElementById('categoryDropdown').addEventListener('change', function () {
    selectedCategoryId = this.value;
    fetchProducts(0); // Tải lại sản phẩm khi thay đổi danh mục
});

// Hàm lấy sản phẩm từ API
async function fetchProducts(page = 0, size = 10) {
    if (!token) {
        showToast("Vui lòng đăng nhập trước khi truy cập trang này.");
        window.location.href = "login.html";
        return;
    }

    try {
        let url = `http://localhost:8085/api_products/list?page=${page}&size=${size}`;
        const queryParams = [];

        // Thêm tham số category nếu có
        if (selectedCategoryId) {
            queryParams.push(`categoryId=${encodeURIComponent(selectedCategoryId)}`);
        }
        // Thêm tham số keyword nếu có
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
        
        await checkJwtError(response);

        if (!response.ok) throw new Error("Network response was not ok");

        const products = await response.json();
        console.log(products); // In ra dữ liệu trả về để kiểm tra

        const productList = document.getElementById('productList');
        if (products.content.length) {
            productList.innerHTML = products.content.map(product => {
                const categoryName = categories[product.categoryId] || 'Không xác định'; // Tra cứu categoryName từ categories
                return `
                    <tr>
                        <td>${product.productId}</td>
                        <td>${product.productCd}</td>
                        <td>${product.productName}</td>
                        <td>${categoryName}</td>
                        <td>${product.prdSellPrice.toLocaleString()} VND</td>
                        <td>${product.prdOriginalPrice.toLocaleString()} VND</td>
                        <td>
                            <button class="btn btn-warning" onclick="editProduct(${product.productId})">Sửa</button>
                            <button class="btn btn-danger" onclick="deleteProduct(${product.productId})">Xóa</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            productList.innerHTML = '<tr><td colspan="5" class="text-center">Không có sản phẩm nào</td></tr>';
        }

        renderPagination(products);
    } catch (error) {
        console.error("Có lỗi xảy ra:", error);
    }
}

// Hàm render phân trang
// Hàm render phân trang
function renderPagination(productsPage) {
    const paginationContainer = document.getElementById('pagination');
    
    // Kiểm tra xem có phải trang đầu tiên và trang cuối cùng không
    const prevButton = productsPage.first ? '' : `<button onclick="fetchProducts(${productsPage.number - 1})">Previous</button>`;
    const nextButton = productsPage.last ? '' : `<button onclick="fetchProducts(${productsPage.number + 1})">Next</button>`;
    
    paginationContainer.innerHTML = `
        ${prevButton}
        <span>Page ${productsPage.number + 1} of ${productsPage.totalPages}</span>
        ${nextButton}
    `;
}
// Hàm lấy danh mục và điền vào dropdown
async function fetchCategories() {
    try {
        const response = await fetch('http://localhost:8085/api_category/list', {
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
        categories = data.reduce((acc, category) => {
            acc[category.categoryId] = category.categoryName;
            return acc;
        }, {});

        console.log(categories); // Kiểm tra xem categories đã chứa dữ liệu chưa
        
        // Kiểm tra xem categoryDropdown có được điền đúng không
        const categoryDropdown = document.getElementById('categoryDropdown');
        categoryDropdown.innerHTML = `<option value="">Tất cả sản phẩm</option>`; // Thêm option mặc định

        // Thêm các option vào dropdown
        for (let categoryId in categories) {
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categories[categoryId];
            categoryDropdown.appendChild(option);
        }

    } catch (error) {
        console.error("Có lỗi khi tải danh mục:", error);
    }
}

function openEditProductModal(productId) {
    // Lưu lại id sản phẩm đang sửa
    currentProductId = productId;

    // Lấy thông tin sản phẩm từ API
    fetchProductDetails(productId).then(product => {
        // Điền thông tin sản phẩm vào các trường trong form
        document.getElementById('productName').value = product.productName;
        document.getElementById('productSellPrice').value = product.prdSellPrice;
        document.getElementById('productOriginalPrice').value = product.prdOriginalPrice;

        // Điền các danh mục vào dropdown trong modal
        const categoryDropdownEdit = document.getElementById('categoryDropdownEdit');
        categoryDropdownEdit.innerHTML = ''; // Xóa các option cũ
        for (let categoryId in categories) {
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categories[categoryId];
            categoryDropdownEdit.appendChild(option);
        }

        // Chọn danh mục hiện tại của sản phẩm
        categoryDropdownEdit.value = product.categoryId;

        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
        modal.show();
    });
}

// Hàm lấy chi tiết sản phẩm từ API
async function fetchProductDetails(productId) {
    const response = await fetch(`http://localhost:8085/api_products/detail/${productId}`, {
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

// Hàm để format giá trị nhập vào (thêm dấu . khi nhập)
function formatPriceInput(input) {
    let value = input.value;
    value = value.replace(/\D/g, ""); // Loại bỏ tất cả ký tự không phải số
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Thêm dấu . mỗi ba chữ số

    input.value = value;
}


document.getElementById('saveProductButton').addEventListener('click', async () => {
    const productName = document.getElementById('productName').value;
    const categoryId = document.getElementById('categoryDropdownEdit').value;

    // Lấy giá trị thực tế (không có dấu .)
    const productSellPrice = parseFloat(document.getElementById('productSellPrice').value.replace(/\./g, ""));
    const productOriginalPrice = parseFloat(document.getElementById('productOriginalPrice').value.replace(/\./g, ""));

    // Kiểm tra nếu các trường không hợp lệ
    if (!productName || !categoryId || isNaN(productSellPrice) || isNaN(productOriginalPrice)) {
        alert("Vui lòng nhập đầy đủ thông tin sản phẩm, bao gồm tên sản phẩm, danh mục, giá bán và giá gốc.");
        return;
    }
    const updatedProduct = {
        prdName: productName,
        categoryId: parseInt(categoryId), // Chuyển categoryId thành số
        prdSellPrice: productSellPrice,
        prdOriginPrice: productOriginalPrice
    };

    try {
        const response = await fetch(`http://localhost:8085/api_products/update/${currentProductId}`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedProduct)
        });

        await checkJwtError(response);

        if (!response.ok) throw new Error("Lỗi khi cập nhật sản phẩm");
        showToast("cập nhật sản phẩm thành công");

        // Đóng modal và tải lại sản phẩm
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        modal.hide();
        fetchProducts(0); // Tải lại danh sách sản phẩm sau khi cập nhật
    } catch (error) {
        console.error("Có lỗi xảy ra khi lưu thay đổi:", error);
    }
});

// Hàm xóa sản phẩm
async function deleteProduct(productId) {
    // Xác nhận hành động xóa
    const isConfirmed = confirm("Bạn có chắc chắn muốn xóa sản phẩm này?");
    if (!isConfirmed) return;

    try {
        // Gửi request xóa sản phẩm đến API
        const response = await fetch(`http://localhost:8085/api_products/delete/${productId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        await checkJwtError(response); // Kiểm tra lỗi JWT nếu có

        if (!response.ok) throw new Error("Không thể xóa sản phẩm");
        showToast("xóa sản phẩm thành công");
        // Sau khi xóa thành công, tải lại danh sách sản phẩm
        fetchProducts(0); // Tải lại sản phẩm sau khi xóa
    } catch (error) {
        console.error("Có lỗi xảy ra khi xóa sản phẩm:", error);
        alert("Có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại.");
    }
}

// Hàm mở modal thêm sản phẩm
// Hàm mở modal thêm sản phẩm
// Hàm mở modal thêm sản phẩm
function openAddProductModal() {
    document.getElementById('productName').value = '';
    document.getElementById('productSellPrice').value = '';
    document.getElementById('productOriginalPrice').value = '';
    const categoryDropdownAdd = document.getElementById('categorySelect');
    categoryDropdownAdd.innerHTML = '<option value="">Chọn danh mục...</option>'; // Option mặc định

    // Điền danh mục vào dropdown (đảm bảo `categories` đã có giá trị)
    if (typeof categories === 'object' && categories !== null) {
        for (let categoryId in categories) {
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categories[categoryId];
            categoryDropdownAdd.appendChild(option);
        }
    } else {
        console.error("Categories is not defined or is not an object.");
    }

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
    modal.show();
}

const addProductForm = document.getElementById('addProductForm');
addProductForm.addEventListener('submit',async function(event) {
    event.preventDefault();  // Ngừng hành động submit mặc định

    // Lấy dữ liệu từ các trường trong form
    const productName = addProductForm.querySelector('#productName').value;
    const categorySelect = addProductForm.querySelector('#categorySelect').value;
    const productSellPrice = addProductForm.querySelector('#productSellPrice').value;
    const productOriginalPrice = addProductForm.querySelector('#productOriginalPrice').value;

    console.log("Product Name:", productName);
    console.log("Category ID:", categorySelect);
    console.log("Product Sell Price:", productSellPrice);
    console.log("Product Original Price:", productOriginalPrice);

    if (!productName || !categorySelect || !productSellPrice || !productOriginalPrice) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }
    
    // Chuyển các giá trị giá thành số
    
    const parsedCategoriId = parseFloat(categorySelect);
    
   
    
    // Dữ liệu sẽ được gửi lên API
    const productData = {
        prdName: productName, // Chuỗi
        prdOriginPrice: String(productOriginalPrice), // Số
        prdSellPrice: String(productSellPrice), // Số
        categoryId: parsedCategoriId, // Chuỗi
    };
    
    console.log(productData);

    // Dữ liệu sẽ được gửi lên API (có thể là code gửi API ở đây)

    try {
        const response = await fetch('http://localhost:8085/api_products/add_new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('tokenLogin')}` // Thêm token nếu cần thiết
            },
            body: JSON.stringify(productData)
        });
        await checkJwtError(response); // Kiểm tra lỗi JWT nếu có

        if (response.ok) {
            showToast('Sản phẩm đã được thêm thành công!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            modal.hide();   
            document.querySelector('.modal-backdrop')?.remove(); // Xóa lớp nền mờ nếu có
         // reloadProductsList();  // Nếu có hàm reload danh sách sản phẩm
        } else {
            showToast('Lỗi khi thêm sản phẩm: ' );
        }
    } catch (error) {
        console.error('Có lỗi xảy ra:', error);
        showToast('Đã xảy ra lỗi. Vui lòng thử lại!');
    }
});

function closeModal() {
    const modalElement = document.getElementById('addProductModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modalInstance.hide();

    // Xóa backdrop nếu còn tồn đọng
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
}

// Hàm xử lý thêm sản phẩm mới


// Đăng ký sự kiện mở modal
document.getElementById('addProductButton').addEventListener('click', openAddProductModal);

// Lắng nghe sự kiện submit của form
// Chỉnh sửa sản phẩm
function editProduct(productId) {
    openEditProductModal(productId);
}

// Gọi fetchCategories khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories().then(() => {
        fetchProducts();
    });
});
