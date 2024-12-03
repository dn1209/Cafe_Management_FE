document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('tokenLogin');  // Lấy token từ localStorage

    // Kiểm tra token
    if (!token) {
        toastrError('Lỗi', 'Vui lòng đăng nhập trước khi truy cập trang này.');
        window.location.href = 'login.html';
        return;
    }

    // Lấy dữ liệu doanh thu hàng tháng ngay khi trang tải xong
    await fetchMonthlyRevenue();

    // Gọi API doanh thu với ngày hiện tại mặc định
    await fetchDailyRevenue(getCurrentDate());

    // Lắng nghe sự kiện thay đổi ngày từ datepicker
    const dateInput = document.getElementById('datePicker');
    dateInput.addEventListener('change', async function () {
        const selectedDate = dateInput.value; // Lấy ngày đã chọn
        await fetchDailyRevenue(selectedDate); // Gọi API với ngày mới
    });

    // Lắng nghe sự kiện click của button "Làm mới"
    const refreshRevenueButton = document.getElementById('refreshRevenueButton');
    refreshRevenueButton.addEventListener('click', function () {
        window.location.reload();  // Tải lại trang để làm mới dữ liệu
    });

    // Hàm lấy doanh thu hàng ngày từ API
    async function fetchDailyRevenue(dateParam) {
        try {
            let url = 'http://localhost:8085/api-bill/revenue';
            if (dateParam) {
                url += `?date=${encodeURIComponent(dateParam)}`;  // Thêm tham số ngày vào URL nếu có
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,  // Thêm Bearer token vào header
                    "Content-Type": "application/json"
                }
            });
            await checkJwtError(response);

            if (!response.ok) {
                throw new Error('Lỗi khi tải dữ liệu doanh thu hàng ngày');
            }

            const dailyRevenueData = await response.json();

            // Xóa các dòng cũ trong bảng
            const dailyRevenueTable = document.getElementById('dailyRevenueTable');
            dailyRevenueTable.innerHTML = ''; // Làm sạch bảng trước khi thêm dữ liệu mới

            dailyRevenueData.forEach(entry => {
                const [date, revenue] = Object.entries(entry)[0]; // Lấy cặp khóa-giá trị đầu tiên

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(date).toLocaleDateString('vi-VN')}</td>  <!-- Định dạng ngày -->
                    <td>${revenue.toLocaleString('vi-VN')} VND</td>          <!-- Định dạng số tiền -->
                `;
                dailyRevenueTable.appendChild(row);
            });

        } catch (error) {
            console.error(error);
            toastrError('Lỗi', error.message);
        }
    }

    // Hàm lấy doanh thu hàng tháng từ API
    async function fetchMonthlyRevenue() {
        try {
            const response = await fetch('http://localhost:8085/api-bill/all-stores', {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,  // Thêm Bearer token vào header
                    "Content-Type": "application/json"
                }
            });
            await checkJwtError(response);

            if (!response.ok) {
                throw new Error('Lỗi khi tải dữ liệu doanh thu hàng tháng');
            }

            const monthlyRevenueData = await response.json();

            // Chuẩn bị labels và data cho biểu đồ từ dữ liệu trả về
            const labels = monthlyRevenueData.map(entry => `Tháng ${entry.month}`);
            const data = monthlyRevenueData.map(entry => entry.revenue);

            // Cập nhật biểu đồ doanh thu hàng tháng
            const ctx = document.getElementById('monthlyRevenueChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,  // Dữ liệu tháng
                    datasets: [{
                        label: 'Doanh Thu (VND)',
                        data: data,  // Dữ liệu doanh thu
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString('vi-VN') + ' VND';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error(error);
            toastrError('Lỗi', error.message);
        }
    }

    // Hàm lấy ngày hiện tại theo định dạng yyyy-MM-dd (cùng định dạng mà datepicker sử dụng)
    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});


