document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem('tokenLogin');  // Lấy token từ localStorage

    // Hàm lấy doanh thu hàng ngày từ API
    function fetchDailyRevenue(dateParam = '') {
        let url = 'http://localhost:8085/api_bill/revenue';
        if (dateParam) {
            url += `?date=${dateParam}`;  // Thêm tham số ngày vào URL nếu có
        }

        fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,  // Thêm Bearer token vào header
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(dailyRevenueData => {
            // Xóa các dòng cũ trong bảng
            const dailyRevenueTable = document.getElementById('dailyRevenueTable');
            dailyRevenueTable.innerHTML = ''; // Làm sạch bảng trước khi thêm dữ liệu mới

            dailyRevenueData.forEach(entry => {
                const [date, revenue] = Object.entries(entry)[0]; // Lấy cặp khóa-giá trị đầu tiên
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(date).toLocaleDateString()}</td>  <!-- Định dạng ngày -->
                    <td>${revenue.toLocaleString()} VND</td>          <!-- Định dạng số tiền -->
                `;
                dailyRevenueTable.appendChild(row);
            });
        })
        .catch(error => {
            console.error(error);
            alert('Lỗi khi tải dữ liệu doanh thu hàng ngày');
        });
    }

    // Hàm lấy doanh thu hàng tháng từ API
    function fetchMonthlyRevenue() {
        fetch('http://localhost:8085/api_bill/all-stores', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,  // Thêm Bearer token vào header
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(monthlyRevenueData => {
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
                                    return value.toLocaleString() + ' VND';
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error(error);
            alert('Lỗi khi tải dữ liệu doanh thu hàng tháng');
        });
    }

    // Lắng nghe sự kiện thay đổi ngày từ datepicker
    const dateInput = document.getElementById('datePicker');
    dateInput.addEventListener('change', function () {
        const selectedDate = dateInput.value; // Lấy ngày đã chọn
        if (selectedDate) {
            fetchDailyRevenue(selectedDate); // Gọi API với ngày mới
        } else {
            fetchDailyRevenue(); // Nếu không có ngày chọn, gọi API mặc định
        }
    });

    // Lắng nghe sự kiện click của button "Làm mới"
    const refreshRevenueButton = document.getElementById('refreshRevenueButton');
    refreshRevenueButton.addEventListener('click', function () {
        window.location.reload();  // Tải lại trang để làm mới dữ liệu
    });

    // Lấy dữ liệu doanh thu hàng tháng ngay khi trang tải xong
    fetchMonthlyRevenue();

    // Gọi API doanh thu mặc định nếu không có ngày chọn
    fetchDailyRevenue();
});