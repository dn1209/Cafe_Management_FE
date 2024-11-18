document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('tokenLogin');
    if (!token) {
        showToast("Vui lòng đăng nhập trước khi truy cập trang này.");
        window.location.href = "login.html";
        return;
    }

    // Biến toàn cục
    let selectedCategoryId = '';
    let selectedStoreId = '';
    let searchKeyword = '';
    let categories = {};
    let stores = {};
    let currentProductId = null;

    // Khởi tạo
    await fetchCategories();
    await fetchStores();
    updateCategoryDropdownDisplay(selectedStoreId);
    await fetchProducts(0);

    // Gắn sự kiện
    document.getElementById('categoryDropdown').addEventListener('change', function () {
        selectedCategoryId = this.value;
        fetchProducts(0);
    });

    document.getElementById('storeDropdown').addEventListener('change', function () {
        selectedStoreId = this.value;
        selectedCategoryId = '';
        updateCategoryDropdownDisplay(selectedStoreId);
        fetchProducts(0);
    });

    document.getElementById('addProductButton').addEventListener('click', openAddProductModal);
    document.getElementById('addProductForm').addEventListener('submit', addProduct);
    document.getElementById('saveProductButton').addEventListener('click', saveProductChanges);

    // Hàm lấy sản phẩm từ API
    async function fetchProducts(page = 0, size = 10) {
        try {
            let url = `http://localhost:8085/api_products/list?page=${page}&size=${size}`;
            const queryParams = [];

            if (selectedCategoryId) {
                queryParams.push(`categoryId=${encodeURIComponent(selectedCategoryId)}`);
            }
            if (selectedStoreId) {
                queryParams.push(`storeId=${encodeURIComponent(selectedStoreId)}`);
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

            if (!response.ok) throw new Error("Không thể tải danh sách sản phẩm");

            const products = await response.json();
            renderProductList(products);
            renderPagination(products);
        } catch (error) {
            console.error("Có lỗi xảy ra:", error);
        }
    }

    function renderProductList(products) {
        const productList = document.getElementById('productList');
        if (products.content.length) {
            productList.innerHTML = products.content.map(product => {
                const category = categories[product.categoryId];
                const categoryName = category ? category.categoryName : 'Không xác định';
                const storeName = stores[product.storeId] || 'Không xác định';
                const statusButton = product.prdStatus === 1
                    ? `<button class="btn btn-danger me-2" data-action="toggleStatus" data-product-id="${product.productId}">Vô hiệu hóa</button>`
                    : `<button class="btn btn-success me-2" data-action="toggleStatus" data-product-id="${product.productId}">Kích hoạt</button>`;
                return `
                    <tr>
                        <td>${product.productId}</td>
                        <td>${product.productCd}</td>
                        <td>${product.productName}</td>
                        <td>${categoryName}</td>
                        <td>${product.prdSellPrice.toLocaleString()} VND</td>
                        <td>${storeName}</td>
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
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                editProduct(productId);
            });
        });

        document.querySelectorAll('button[data-action="toggleStatus"]').forEach(button => {
            button.addEventListener('click', function() {
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
            prevButton.textContent = 'Trước';
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
            nextButton.textContent = 'Tiếp';
            nextButton.classList.add('btn', 'btn-secondary', 'ms-2');
            nextButton.addEventListener('click', () => {
                fetchProducts(productsPage.number + 1);
            });
            paginationContainer.appendChild(nextButton);
        }
    }

    async function fetchCategories() {
        try {
            const response = await fetch('http://localhost:8085/api_category/list', {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            await checkJwtError(response);

            if (!response.ok) throw new Error("Không thể tải danh sách danh mục");

            const data = await response.json();
            categories = data.reduce((acc, category) => {
                acc[category.categoryId] = {
                    categoryName: category.categoryName,
                    storeId: category.storeId
                };
                return acc;
            }, {});

            updateCategoryDropdownDisplay(selectedStoreId);
        } catch (error) {
            console.error("Có lỗi khi tải danh mục:", error);
        }
    }

    async function fetchStores() {
        try {
            const response = await fetch('http://localhost:8085/api_store/list', {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            await checkJwtError(response);

            if (!response.ok) throw new Error("Không thể tải danh sách cửa hàng");

            const data = await response.json();
            const activeStores = data.filter(store => store.storeStatus === 1);
            stores = activeStores.reduce((acc, store) => {
                acc[store.storeId] = store.storeName;
                return acc;
            }, {});

            const storeDropdown = document.getElementById('storeDropdown');
            storeDropdown.innerHTML = `<option value="">Tất cả cửa hàng</option>`;

            activeStores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.storeId;
                option.textContent = store.storeName;
                storeDropdown.appendChild(option);
            });

        } catch (error) {
            console.error("Có lỗi khi tải danh sách cửa hàng:", error);
        }
    }

    function updateCategoryDropdownDisplay(selectedStoreId) {
        const categoryDropdown = document.getElementById('categoryDropdown');
        categoryDropdown.innerHTML = `<option value="">Tất cả danh mục</option>`;

        for (let categoryId in categories) {
            if (!selectedStoreId || categories[categoryId].storeId === parseInt(selectedStoreId)) {
                const option = document.createElement('option');
                option.value = categoryId;
                option.textContent = categories[categoryId].categoryName;
                categoryDropdown.appendChild(option);
            }
        }
    }

    function openAddProductModal() {
        document.getElementById('productNameAdd').value = '';
        document.getElementById('productSellPriceAdd').value = '';
        const categoryDropdownAdd = document.getElementById('categorySelect');
        const storeDropdownAdd = document.getElementById('storeSelect');

        storeDropdownAdd.innerHTML = '<option value="">Chọn cửa hàng...</option>';
        categoryDropdownAdd.innerHTML = '<option value="">Chọn danh mục...</option>';

        for (let storeId in stores) {
            const option = document.createElement('option');
            option.value = storeId;
            option.textContent = stores[storeId];
            storeDropdownAdd.appendChild(option);
        }

        storeDropdownAdd.addEventListener('change', function () {
            const selectedStoreId = this.value;
            updateCategoryDropdown(selectedStoreId);
        });

        const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
        modal.show();
    }

    function updateCategoryDropdown(storeId) {
        const categoryDropdownAdd = document.getElementById('categorySelect');
        categoryDropdownAdd.innerHTML = '<option value="">Chọn danh mục...</option>';

        for (let categoryId in categories) {
            const category = categories[categoryId];
            if (category.storeId == storeId) {
                const option = document.createElement('option');
                option.value = categoryId;
                option.textContent = category.categoryName;
                categoryDropdownAdd.appendChild(option);
            }
        }
    }

    async function addProduct(event) {
        event.preventDefault();

        const productName = document.getElementById('productNameAdd').value;
        const categoryId = parseInt(document.getElementById('categorySelect').value);
        const productSellPrice = parseFloat(document.getElementById('productSellPriceAdd').value.replace(/\./g, ""));
        const storeId = parseInt(document.getElementById('storeSelect').value);

        if (!productName || isNaN(categoryId) || isNaN(productSellPrice) || isNaN(storeId)) {
            showToast("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        const productData = {
            prdName: productName,
            prdSellPrice: productSellPrice,
            categoryId,
            storeId
        };

        try {
            const response = await fetch('http://localhost:8085/api_products/add_new', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            await checkJwtError(response);

            if (response.ok) {
                showToast('Sản phẩm đã được thêm thành công!');
                bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
                await fetchProducts(0);
            } else {
                showToast('Lỗi khi thêm sản phẩm.');
            }
        } catch (error) {
            console.error('Có lỗi xảy ra:', error);
            showToast('Đã xảy ra lỗi. Vui lòng thử lại!');
        }
    }

    async function editProduct(productId) {
        currentProductId = productId;

        try {
            const product = await fetchProductDetails(productId);

            document.getElementById('productNameEdit').value = product.productName;
            document.getElementById('productSellPriceEdit').value = product.prdSellPrice;

            const categoryDropdownEdit = document.getElementById('categoryDropdownEdit');
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

            const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
            modal.show();
        } catch (error) {
            console.error('Có lỗi khi lấy thông tin sản phẩm:', error);
        }
    }

    async function saveProductChanges() {
        const productName = document.getElementById('productNameEdit').value;
        const categoryId = parseInt(document.getElementById('categoryDropdownEdit').value);
        const productSellPrice = parseFloat(document.getElementById('productSellPriceEdit').value.replace(/\./g, ""));

        if (!productName || isNaN(categoryId) || isNaN(productSellPrice)) {
            showToast("Vui lòng nhập đầy đủ thông tin sản phẩm.");
            return;
        }

        const updatedProduct = {
            prdName: productName,
            categoryId,
            prdSellPrice: productSellPrice,
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

            if (response.ok) {
                showToast("Cập nhật sản phẩm thành công");
                bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
                await fetchProducts(0);
            } else {
                showToast("Lỗi khi cập nhật sản phẩm.");
            }
        } catch (error) {
            console.error("Có lỗi xảy ra khi lưu thay đổi:", error);
            showToast("Có lỗi xảy ra khi lưu thay đổi.");
        }
    }

    async function toggleProductStatus(productId) {
        try {
            const response = await fetch(`http://localhost:8085/api_products/toggle_status/${productId}`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            await checkJwtError(response);

            if (response.ok) {
                showToast("Cập nhật trạng thái sản phẩm thành công");
                await fetchProducts(0);
            } else {
                showToast("Lỗi khi cập nhật trạng thái sản phẩm.");
            }
        } catch (error) {
            console.error("Có lỗi xảy ra khi cập nhật trạng thái sản phẩm:", error);
            showToast("Có lỗi xảy ra khi cập nhật trạng thái sản phẩm.");
        }
    }

    async function fetchProductDetails(productId) {
        const response = await fetch(`http://localhost:8085/api_products/detail/${productId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        await checkJwtError(response);

        if (!response.ok) throw new Error("Không thể lấy thông tin sản phẩm");

        return await response.json();
    }
});
