document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('tokenLogin');
    if (!token) {
        toastrError("Lỗi", "Vui lòng đăng nhập trước khi truy cập trang này.");
        window.location.href = "login.html";
        return;
    }

    // Biến toàn cục
    let selectedCategoryId = '';
    let searchKeyword = '';
    let categories = {};
    let currentProductId = null;

    // Khởi tạo
    await fetchCategories();
    updateCategoryDropdownDisplay();
    await fetchProducts(0);

    // Gắn sự kiện
    document.getElementById('category_dropdown').addEventListener('change', function () {
        selectedCategoryId = this.value;
        fetchProducts(0);
    });


    document.getElementById('add_product_btn').addEventListener('click', openAddProductModal);
    document.getElementById('add_product_form').addEventListener('submit', addProduct);
    document.getElementById('save_product_btn').addEventListener('click', saveProductChanges);

    // Hàm lấy sản phẩm từ API
    async function fetchProducts(page = 0, size = 10) {
        try {
            let url = `http://localhost:8085/api-products/list?page=${page}&size=${size}`;
            const queryParams = [];

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
                }
            });

            await checkJwtError(response);

            if (response.status === 403) {
                throw new Error('Bạn không có quyền truy cập vào trang này');
            }

            if (!response.ok) throw new Error("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");

            await response.json().then(data => {
                renderProductList(data);
                renderPagination(data);
            });
        } catch (error) {
            console.error("Có lỗi xảy ra:", error);
            catchForbidden(error);
            toastrError("Lỗi", error);
        }
    }

    function renderProductList(products) {
        const productList = document.getElementById('product_list_admin');
        if (products.content.length) {
            productList.innerHTML = products.content.map((product, index) => {
                const category = categories[product.categoryId];
                const categoryName = category ? category.categoryName : 'Không xác định';
                const statusButton = product.prdStatus === 1
                    ? `<button class="btn btn-danger me-2" data-action="toggleStatus" data-product-id="${product.productId}">Vô hiệu hóa</button>`
                    : `<button class="btn btn-success me-2" data-action="toggleStatus" data-product-id="${product.productId}">Kích hoạt</button>`;
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${product.productCd}</td>
                        <td>${product.productName}</td>
                        <td>${categoryName}</td>
                        <td>${product.prdSellPrice.toLocaleString()} VND</td>
                        <td>${product.prdStatus === 1 ? "Hoạt động" : "Không hoạt động"}</td>
                        <td>
                            <button class="btn btn-warning me-2" data-action="edit" data-product-id="${product.productId}">Sửa</button>
                            ${statusButton}
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            productList.innerHTML = '<tr><td colspan="8" class="text-center">Không có sản phẩm nào</td></tr>';
        }

        // Add event listeners to the buttons
        addEventListenersToProductButtons();
    }

    function addEventListenersToProductButtons() {
        document.querySelectorAll('button[data-action="edit"]').forEach(button => {
            button.addEventListener('click', function () {
                const productId = this.getAttribute('data-product-id');
                editProduct(productId);
            });
        });

        document.querySelectorAll('button[data-action="toggleStatus"]').forEach(button => {
            button.addEventListener('click', function () {
                const productId = this.getAttribute('data-product-id');
                toggleProductStatus(productId);
            });
        });
    }

    function renderPagination(productsPage) {
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = ''; // Clear previous pagination

        if (!productsPage.first) {
            const prevButton = document.createElement('button');
            // prevButton.textContent = 'Trước';
            prevButton.innerHTML = `<i class="fa-solid fa-circle-chevron-left"></i>`;
            prevButton.classList.add('btn', 'btn-secondary', 'me-2');
            prevButton.addEventListener('click', () => {
                fetchProducts(productsPage.number - 1);
            });
            paginationContainer.appendChild(prevButton);
        }

        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Trang ${productsPage.number + 1} / ${productsPage.totalPages}`;
        paginationContainer.appendChild(pageInfo);

        if (!productsPage.last) {
            const nextButton = document.createElement('button');
            // nextButton.textContent = 'Tiếp';
            nextButton.innerHTML = `<i class="fa-solid fa-circle-chevron-right"></i>`;
            nextButton.classList.add('btn', 'btn-secondary', 'ms-2');
            nextButton.addEventListener('click', () => {
                fetchProducts(productsPage.number + 1);
            });
            paginationContainer.appendChild(nextButton);
        }
    }

    async function fetchCategories() {
        try {
            const response = await fetch('http://localhost:8085/api-category/list', {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            await checkJwtError(response);

            if (response.status === 403) {
                throw new Error('Bạn không có quyền truy cập vào trang này');
            }

            if (!response.ok) throw new Error("Không thể tải danh sách danh mục. Vui lòng thử lại sau.");

            const data = await response.json();
            categories = data.reduce((acc, category) => {
                acc[category.categoryId] = {
                    categoryName: category.categoryName,
                    storeId: category.storeId
                };
                return acc;
            }, {});
        } catch (error) {
            console.error("Có lỗi khi tải danh mục:", error);
            catchForbidden(error);
            toastrError("Lỗi", error);
        }
    }

    function updateCategoryDropdownDisplay() {
        const categoryDropdown = document.getElementById('category_dropdown');
        categoryDropdown.innerHTML = `<option value="">Tất cả danh mục</option>`;

        for (let categoryId in categories) {
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categories[categoryId].categoryName;
            categoryDropdown.appendChild(option);
        }
    }

    function openAddProductModal() {
        document.getElementById('product_name_add').value = '';
        document.getElementById('product_price_add').value = '';
        const categoryDropdownAdd = document.getElementById('category_select');

        categoryDropdownAdd.innerHTML = '<option value="">Chọn danh mục...</option>';
        for (let categoryId in categories) {
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categories[categoryId].categoryName;
            categoryDropdownAdd.appendChild(option);
        }
        const modal = new bootstrap.Modal(document.getElementById('add_product_modal'));
        modal.show();
    }

    async function addProduct(event) {
        event.preventDefault();

        const productName = document.getElementById('product_name_add').value;
        const categoryId = parseInt(document.getElementById('category_select').value);
        const productSellPrice = parseFloat(document.getElementById('product_price_add').value.replace(/\./g, ""));

        if (!productName || isNaN(categoryId) || isNaN(productSellPrice)) {
            toastrError("Lỗi", "Vui lòng điền đầy đủ thông tin!");
            return;
        }

        const productData = {
            prdName: productName,
            prdSellPrice: productSellPrice,
            categoryId
        };

        try {
            const response = await fetch('http://localhost:8085/api-products/add-new', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            await checkJwtError(response);

            if (response.status === 403) {
                throw new Error('Bạn không có quyền truy cập vào trang này');
            }

            await response.json().then(async data => {
                if (data.message === "PRODUCT_NAME_EXISTED") {
                    toastrError('Lỗi', "Sản phẩm đã tồn tại. Vui lòng chọn tên khác!");
                } else if (data.message === "CATEGORY_NOT_FOUND") {
                    toastrError('Lỗi', "Danh mục không tồn tại. Vui lòng chọn danh mục khác!");
                }
                toastrSuccess('Thành công', 'Sản phẩm đã được thêm thành công!');
                bootstrap.Modal.getInstance(document.getElementById('add_product_modal')).hide();
                await fetchProducts(0);
            });
        } catch (error) {
            console.error('Có lỗi xảy ra:', error);
            catchForbidden(error);
            toastrError('Lỗi', error);
        }
    }

    async function editProduct(productId) {
        currentProductId = productId;

        try {
            const product = await fetchProductDetails(productId);

            document.getElementById('product_name_edit').value = product.productName;
            document.getElementById('product_price_edit').value = product.prdSellPrice;

            const categoryDropdownEdit = document.getElementById('category_dropdown_edit');
            categoryDropdownEdit.innerHTML = '';

            const filteredCategories = Object.keys(categories).filter(categoryId => categories[categoryId].storeId === product.storeId);

            filteredCategories.forEach(categoryId => {
                const category = categories[categoryId];
                const option = document.createElement('option');
                option.value = categoryId;
                option.textContent = category.categoryName;
                categoryDropdownEdit.appendChild(option);
            });

            categoryDropdownEdit.value = product.categoryId;

            const modal = new bootstrap.Modal(document.getElementById('edit_product_modal'));
            modal.show();
        } catch (error) {
            console.error('Có lỗi khi lấy thông tin sản phẩm:', error);
            toastrError('Lỗi', 'Có lỗi khi lấy thông tin sản phẩm. Vui lòng thử lại sau.');
        }
    }

    async function saveProductChanges() {
        const productName = document.getElementById('product_name_edit').value;
        const categoryId = parseInt(document.getElementById('category_dropdown_edit').value);
        const productSellPrice = parseFloat(document.getElementById('product_price_edit').value.replace(/\./g, ""));

        if (!productName || isNaN(categoryId) || isNaN(productSellPrice)) {
            toastrError("Lỗi", "Vui lòng nhập đầy đủ thông tin sản phẩm.");
            return;
        }

        const updatedProduct = {
            prdName: productName,
            categoryId,
            prdSellPrice: productSellPrice,
        };

        try {
            const response = await fetch(`http://localhost:8085/api-products/update/${currentProductId}`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedProduct)
            });

            await checkJwtError(response);

            if (response.status === 403) {
                throw new Error('Bạn không có quyền truy cập vào trang này');
            }

            await response.json().then(async data => {
                if (data.message === "PRODUCT_NOT_FOUND") {
                    toastrError('Lỗi', "Sản phẩm không tồn tại. Vui lòng chọn tên khác!");
                } else if (data.message === "PRODUCT_NAME_EXISTED") {
                    toastrError('Lỗi', "Sản phẩm đã tồn tại. Vui lòng chọn tên khác!");
                } else if (data.message === "CATEGORY_NOT_FOUND") {
                    toastrError('Lỗi', "Danh mục không tồn tại. Vui lòng chọn danh mục khác!");
                }
                toastrSuccess("Thành công", "Cập nhật sản phẩm thành công");
                bootstrap.Modal.getInstance(document.getElementById('edit_product_modal')).hide();
                await fetchProducts(0);
            });
        } catch (error) {
            console.error("Có lỗi xảy ra khi lưu thay đổi:", error);
            catchForbidden(error);
            toastrError("Lỗi", error);
        }
    }

    async function toggleProductStatus(productId) {
        try {
            const response = await fetch(`http://localhost:8085/api-products/toggle-status/${productId}`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            await checkJwtError(response);

            if (response.status === 403) {
                throw new Error('Bạn không có quyền truy cập vào trang này');
            }

            await response.json().then(async data => {
                if (data.message === "PRODUCT_NOT_FOUND") {
                    toastrError('Lỗi', "Sản phẩm không tồn tại. Vui lòng chọn tên khác!");
                }
                toastrSuccess("Thành công", "Cập nhật trạng thái sản phẩm thành công");
                await fetchProducts(0);
            });
        } catch (error) {
            console.error("Có lỗi xảy ra khi cập nhật trạng thái sản phẩm:", error);
            catchForbidden(error);
            toastrError("Lỗi", error);
        }
    }

    async function fetchProductDetails(productId) {
        try {
            const response = await fetch(`http://localhost:8085/api-products/detail/${productId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            await checkJwtError(response);

            if (response.status === 403) {
                throw new Error('Bạn không có quyền truy cập vào trang này');
            }

            if (!response.ok) throw new Error("Không thể lấy thông tin sản phẩm");

            return await response.json();
        } catch (error) {
            console.error("Có lỗi khi lấy thông tin sản phẩm:", error);
            catchForbidden(error);
            toastrError("Lỗi", error);
        }
    }
});
