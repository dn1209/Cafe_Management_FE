async function fetchProducts() {
    const token = localStorage.getItem('tokenLogin'); // Lấy token từ localStorage

    if (!token) {
        alert("Vui lòng đăng nhập trước khi truy cập trang này.");
        window.location.href = "login.html"; // Điều hướng về trang đăng nhập nếu token không tồn tại
        return;
    }

    try {
        console.log("Bắt đầu lấy danh sách sản phẩm...");
        const response = await fetch("http://localhost:8085/api_products/list", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json" // Yêu cầu dữ liệu trả về ở dạng JSON
            },
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const products = await response.json();

        // Kiểm tra nếu không có sản phẩm nào
        if (products.length === 0) {
            const productList = document.getElementById('product-list');
            productList.innerHTML = '<p>No products available</p>';
            return;
        }

        // Hiển thị sản phẩm trong phần tử 'product-list'
        const productList = document.getElementById('product-list');
        productList.innerHTML = ''; // Xóa nội dung cũ

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'col-md-3';
            productCard.innerHTML = `
                <div class="card">
                    <img src="https://via.placeholder.com/100" class="card-img-top" alt="${product.productName}">
                    <div class="card-body text-center">
                        <h6 class="card-title">${product.productName}</h6>
                        <p class="card-text">Price: ${product.prdSellPrice.toLocaleString()} VND</p>
                    </div>
                </div>
            `;
            productList.appendChild(productCard);
        });
        console.log("Lấy dữ liệu thành công!");
    } catch (error) {
        console.error("Error fetching products:", error);
        alert("Có lỗi xảy ra khi lấy dữ liệu sản phẩm.");
    }
}

// Gọi hàm fetchProducts khi tải trang
document.addEventListener("DOMContentLoaded", fetchProducts);