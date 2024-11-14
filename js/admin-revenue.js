// URL cơ bản của API
const apiUrl = 'http://localhost:8085/api';

// Lấy Bearer Token từ localStorage
const token = localStorage.getItem('tokenLogin');

// Hàm lấy doanh thu cho toàn bộ cửa hàng trong khoảng thời gian
async function getRevenue(startDate, endDate) {
    const url = `${apiUrl}/revenue?startDate=${startDate}&endDate=${endDate}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Dùng token từ localStorage
            }
        });
        return await response.json();
    } catch (error) {
        console.error("Lỗi khi lấy doanh thu:", error);
    }
}

// Hàm hiển thị doanh thu hàng ngày vào bảng
async function loadDailyRevenue() {
    // Đặt ngày bắt đầu và ngày kết thúc
    const startDate = '2024-11-12T00:00:00';
    const endDate = '2024-11-14T23:59:59';
    
    const data = await getRevenue(startDate, endDate);
    const dailyRevenueTable = document.getElementById('dailyRevenueTable');
    dailyRevenueTable.innerHTML = ''; // Xóa dữ liệu cũ

    if (data && data.length > 0) {
        data.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.revenue.toLocaleString()} VND</td>
            `;
            dailyRevenueTable.appendChild(row);
        });
    } else {
        // Nếu không có dữ liệu doanh thu
        dailyRevenueTable.innerHTML = '<tr><td colspan="2">Không có dữ liệu doanh thu trong khoảng thời gian này.</td></tr>';
    }
}

// Hàm khởi tạo để load doanh thu khi trang được tải
window.onload = function() {
    loadDailyRevenue();
};