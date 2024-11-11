function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function injectToastStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .toast-message {
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 250px;
            padding: 15px;
            border-radius: 5px;
            background-color: #ffcc00;
            color: #333;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 2000; /* Đảm bảo cao hơn modal */
            opacity: 0;
            transition: opacity 0.3s ease, top 0.3s ease;
        }
        .toast-message.show {
            opacity: 1;
            top: 20px;
        }
    `;
    document.head.appendChild(style);
}

// Gọi hàm injectToastStyles() một lần để thêm các style vào đầu tài liệu
injectToastStyles();
