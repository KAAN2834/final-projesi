


const API_URL = "http://127.0.0.1:5000/api";


document.addEventListener('DOMContentLoaded', () => {
    

    const registerForm = document.querySelector('#registerForm form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const inputs = e.target.querySelectorAll('input');
            const userData = {
                username: inputs[0].value,
                email: inputs[1].value,
                phone: inputs[2].value,
                password: inputs[3].value
            };

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert("Harika! " + result.message);
                    toggleAuth(); 
                } else {
                    alert("Hata: " + result.message);
                }
            } catch (error) {
                console.error("Bağlantı Hatası:", error);
                alert("Sunucuya ulaşılamadı. app.py çalışıyor mu?");
            }
        });
    }

    
    const loginForm = document.querySelector('#loginForm form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const inputs = e.target.querySelectorAll('input');
            const loginData = {
                email: inputs[0].value,
                password: inputs[1].value
            };

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert("Giriş başarılı! Dashboard'a yönlendiriliyorsunuz.");
                    
                    localStorage.setItem('user_id', result.user_id);
                    localStorage.setItem('username', result.username);
                    
                    
                    window.location.href = 'index.html';
                } else {
                    alert("Hata: " + result.message);
                }
            } catch (error) {
                alert("Giriş yapılırken bir sorun oluştu.");
            }
        });
    }
});