

const API_URL = "http://127.0.0.1:5000/api/products";


document.addEventListener("DOMContentLoaded", () => {
    console.log("Sistem: Dashboard hazır, kontroller başlıyor...");
    
    
    checkAuth();
    fetchProducts();

    
    const modal = document.getElementById("productModal");
    const addBtn = document.querySelector(".add-btn");
    const closeBtn = document.querySelector(".close-btn");
    const productForm = document.getElementById("productForm");

    
    if (addBtn) addBtn.onclick = () => modal.style.display = "flex";
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; }

    
    if (productForm) {
        productForm.onsubmit = async (e) => {
            e.preventDefault();

            
            const submitBtn = document.getElementById('submitBtn');
            const btnText = submitBtn.querySelector('.btn-text');
            const spinner = submitBtn.querySelector('.spinner');

            
            if (submitBtn && btnText && spinner) {
                submitBtn.disabled = true;
                btnText.textContent = "Veriler Çekiliyor...";
                spinner.classList.remove('hidden');
            }

            
            const productData = {
                name: document.getElementById("productName").value,
                category: document.getElementById("category").value,
                price: document.getElementById("desiredPrice").value,
                url: document.getElementById("productUrl").value,
                user_id: localStorage.getItem('user_id') 
            };

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(productData)
                });

                if (response.ok) {
                    productForm.reset();
                    modal.style.display = "none";
                    fetchProducts();
                } else {
                    alert("Ürün eklenirken bir hata oluştu. Linki kontrol edin.");
                }
            } catch (error) {
                console.error("Ürün eklenirken hata:", error);
                alert("Sunucuya bağlanılamadı.");
            } finally {
                
                if(submitBtn && btnText && spinner) {
                    submitBtn.disabled = false;
                    btnText.textContent = "Takibi Başlat";
                    spinner.classList.add('hidden');
                }
            }
        };
    }
});


function checkAuth() {
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('username');

    console.log("Hafıza Verileri:", { userId, userName });

    const guestZone = document.getElementById('guest-zone');
    const userZone = document.getElementById('user-zone');
    const userNameDisplay = document.getElementById('user-name');

    if (userId && userName) {
        console.log("Durum: Giriş yapılmış. Arayüz güncelleniyor...");
        if (guestZone) guestZone.style.display = "none"; 
        if (userZone) userZone.classList.remove('hidden'); 
        if (userNameDisplay) userNameDisplay.textContent = userName; 
    } else {
        console.log("Durum: Giriş yapılmamış.");
        if (guestZone) guestZone.style.display = "block";
        if (userZone) userZone.classList.add('hidden');
    }
}


window.logout = function() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    window.location.href = 'auth.html';
}


async function fetchProducts() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
        
        const response = await fetch(`${API_URL}/${userId}`, { cache: "no-store" });
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error("Hata:", error);
    }
}

function renderProducts(products) {
    const productGrid = document.querySelector(".product-grid");
    if (!productGrid) return;
    productGrid.innerHTML = ""; 

    products.forEach(product => {
        
        let statusBadge = "";
        let currentPriceNum = parseFloat(product.current_price);
        let targetPriceNum = parseFloat(product.price); 
        
        
        let oldPriceNum = parseFloat(product.old_price || currentPriceNum);

        let discountPercent = 0;


        if (targetPriceNum && currentPriceNum <= targetPriceNum) {
            // 1. İstenen fiyata düştüyse: YEŞİL
            statusBadge = `<span class="product-badge badge-green">📉 İstenen Fiyatta!</span>`;
        } else if (currentPriceNum > oldPriceNum) {
            // 2. Fiyat eskiye göre arttıysa: KIRMIZI
            statusBadge = `<span class="product-badge badge-red">🔺 Fiyat Arttı</span>`;
        } else {
            // 3. Fiyat aynıysa veya sadece takip ediliyorsa: SARI
            statusBadge = `<span class="product-badge badge-yellow">⏳ Takipte</span>`;
        }
        
        const favs = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFav = favs.includes(product._id);
        const starIcon = isFav ? "⭐" : "☆";
        const discountBadge =
            discountPercent > 0
            ? `<div class="discount-badge">%${Math.round(discountPercent)} İndirim</div>`
            : '';

        
        const cardHTML = `
            <article class="product-card" data-id="${product._id}">
                ${statusBadge}
                ${discountBadge}

                <div class="product-img-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=Resim+Yuklenemedi'">
                </div>

                <p class="brand">${product.category}</p>
                <h3 class="product-title">${product.name}</h3>
                
                                    <div style="display:flex; flex-direction:column;">
                        <span class="current-price">
                            ${product.current_price || "Hesaplanıyor"} TL
                        </span>

                        ${
                        product.initial_price &&
                        product.initial_price > product.current_price
                            ? `<span class="old-price">${product.initial_price} TL</span>`
                            : ''
                        }

                        <span style="font-size:0.8rem;color:#6c757d;">
                            Hedef: ${targetPriceNum} TL
                        </span>
                    </div>

                <div class="card-footer">
                    <a href="${product.url}" target="_blank" class="store-link">Git →</a>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="toggleFavorite('${product._id}', this)" style="background:none; border:none; font-size:1.2rem; cursor:pointer;" title="Favoriye Ekle/Çıkar">${starIcon}</button>
                        
                        <button onclick="deleteProduct('${product._id}')" class="delete-btn" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">🗑️</button>
                    </div>
                </div>

            </article>
            `;
        productGrid.insertAdjacentHTML('afterbegin', cardHTML);
    });
}


let productToDelete = null; 

window.deleteProduct = function(id) {
    productToDelete = id; 
    const deleteModal = document.getElementById("deleteConfirmModal");
    if (deleteModal) deleteModal.style.display = "flex"; 
};


function openAddModal() {
    const modal = document.getElementById("productModal");

    if (modal) {
        modal.style.display = "flex";
    } else {
        console.error("Hata: productModal bulunamadı!");
    }
}



document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll('.nav-item');
    const productGrid = document.querySelector('.product-grid');
    const analyticsSection = document.getElementById('analytics-section');
    const headerQuickAdd = document.querySelector('.quick-add-container'); // Hızlı ekleme çubuğu

    let mainChart = null; 

    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            
            const productGrid = document.querySelector('.product-grid');
            const analyticsSection = document.getElementById('analytics-section');
            const alarmsSection = document.getElementById('alarms-section');
            const settingsSection = document.getElementById('settings-section');
            const emptyFavState = document.getElementById('emptyFavoritesState');
            const headerQuickAdd = document.querySelector('.quick-add-container');

            
            if (item.textContent.includes('Fiyat Alarmları')) {
                if(productGrid) productGrid.style.display = 'none';
                if(analyticsSection) analyticsSection.style.display = 'none';
                if(headerQuickAdd) headerQuickAdd.style.display = 'none';
                if(emptyFavState) emptyFavState.style.display = 'none';
                if(settingsSection) settingsSection.style.display = 'none';
                
                if(alarmsSection) {
                    alarmsSection.classList.remove('hidden');
                    alarmsSection.style.display = 'block';
                    loadAlarmsData(); 
                }
            } else if (item.textContent.includes('Analizler')) {
                if(productGrid) productGrid.style.display = 'none';
                if(headerQuickAdd) headerQuickAdd.style.display = 'none';
                if(emptyFavState) emptyFavState.style.display = 'none';
                if(alarmsSection) alarmsSection.style.display = 'none';
                if(settingsSection) settingsSection.style.display = 'none';
                
                if(analyticsSection) {
                    analyticsSection.classList.remove('hidden');
                    analyticsSection.style.display = 'block';
                    loadAnalyticsData(); 
                }
            } else if (item.textContent.includes('Favorilerim')) {
                // --- FAVORİLERİM SAYFASI ---
                if(analyticsSection) analyticsSection.style.display = 'none';
                if(headerQuickAdd) headerQuickAdd.style.display = 'none';
                if(alarmsSection) alarmsSection.style.display = 'none';
                if(settingsSection) settingsSection.style.display = 'none';
                
                const favs = JSON.parse(localStorage.getItem('favorites')) || [];
                if (favs.length === 0) {
                    
                    if(productGrid) productGrid.style.display = 'none';
                    if (emptyFavState) {
                        emptyFavState.classList.remove('hidden'); 
                        emptyFavState.style.display = 'block';
                    }
                } else {
                    
                    if(productGrid) productGrid.style.display = ''; 
                    if (emptyFavState) {
                        emptyFavState.classList.add('hidden');
                        emptyFavState.style.display = 'none';
                    }
                    
                    document.querySelectorAll('.product-card').forEach(card => {
                        const cardId = card.getAttribute('data-id');
                        card.style.display = favs.includes(cardId) ? 'block' : 'none';
                    });
                }
            } else if (item.textContent.includes('Ayarlar')) {
                
                if(productGrid) productGrid.style.display = 'none';
                if(analyticsSection) analyticsSection.style.display = 'none';
                if(headerQuickAdd) headerQuickAdd.style.display = 'none';
                if(alarmsSection) alarmsSection.style.display = 'none';
                if(emptyFavState) emptyFavState.style.display = 'none';

                if(settingsSection) {
                    settingsSection.classList.remove('hidden');
                    settingsSection.style.display = 'block';
                }
            } else if (item.textContent.includes('Dashboard')) {
                
                if(analyticsSection) analyticsSection.style.display = 'none';
                if(emptyFavState) emptyFavState.style.display = 'none';
                if(alarmsSection) alarmsSection.style.display = 'none';
                if(settingsSection) settingsSection.style.display = 'none';
                
                if(productGrid) productGrid.style.display = ''; 
                if(headerQuickAdd) headerQuickAdd.style.display = 'flex';
                document.querySelectorAll('.product-card').forEach(card => card.style.display = 'block');
            }
            
            const userHeader = document.getElementById('user-header-actions');
            const profileBtn = document.querySelector('.profile-btn');
            const logoutBtn = document.querySelector('.logout-btn');

            if (userHeader) {
                userHeader.style.display = 'flex'; 
                if (item.textContent.includes('Dashboard')) {
                    if (profileBtn) profileBtn.style.display = 'inline-block';
                    if (logoutBtn) logoutBtn.style.display = 'inline-block';
                } else {
                    if (profileBtn) profileBtn.style.display = 'none';
                    if (logoutBtn) logoutBtn.style.display = 'none';
                }
            }
        });
    });
    

    
    function loadAnalyticsData() {
        
        const productCards = document.querySelectorAll('.product-card');
        const totalProducts = productCards.length;
        const reachedTarget = document.querySelectorAll('.badge-green').length; 
        
        document.getElementById('total-products-stat').textContent = totalProducts;
        document.getElementById('reached-target-stat').textContent = reachedTarget;

        
        const select = document.getElementById('chartProductSelect');
        select.innerHTML = '<option value="">Lütfen bir ürün seçin...</option>'; // Önce temizle
        
        
        productCards.forEach((card, index) => {
            const titleElement = card.querySelector('.product-title');
            const priceElement = card.querySelector('.current-price');
            
            if (titleElement && priceElement) {
                const title = titleElement.textContent;
                
                const currentPrice = parseFloat(priceElement.textContent.replace(/[^0-9.]/g, ''));
                
                const option = document.createElement('option');
                option.value = index; 
                option.dataset.name = title;
                option.dataset.price = currentPrice || 1000; 
                option.textContent = title;
                select.appendChild(option);
            }
        });

        
        const ctx = document.getElementById('mainAnalyticsChart');
        if (!ctx) return;

        
        function drawChart(labels, dataPoints, labelName) {
            if (mainChart) mainChart.destroy(); 
            
            mainChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: labelName,
                        data: dataPoints,
                        borderColor: '#3B82F6', 
                        backgroundColor: 'rgba(59, 130, 246, 0.15)', 
                        borderWidth: 3,
                        tension: 0.4, // Kavisli çizgi
                        fill: true,
                        pointBackgroundColor: '#10B981',
                        pointRadius: 5
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true } 
                    }
                }
            });
        }

        
        drawChart(['1 Hafta Önce', '5 Gün Önce', '3 Gün Önce', 'Dün', 'Bugün'], [0, 0, 0, 0, 0], 'Lütfen listeden bir ürün seçin');

        
        select.onchange = () => {
            const selectedOption = select.options[select.selectedIndex];
            
            
            if (!selectedOption.value) {
                 drawChart(['1 Hafta Önce', '5 Gün Önce', '3 Gün Önce', 'Dün', 'Bugün'], [0, 0, 0, 0, 0], 'Lütfen listeden bir ürün seçin');
                 return;
            }
            
            const pName = selectedOption.dataset.name;
            const pPrice = parseFloat(selectedOption.dataset.price);
            
            
            const p1 = Math.round(pPrice + (pPrice * ((Math.random() * 0.06) - 0.02)));
            const p2 = Math.round(pPrice + (pPrice * ((Math.random() * 0.06) - 0.02)));
            const p3 = Math.round(pPrice + (pPrice * ((Math.random() * 0.06) - 0.02)));
            const p4 = Math.round(pPrice + (pPrice * ((Math.random() * 0.06) - 0.02)));
            
            const mockPrices = [p1, p2, p3, p4, pPrice]; // Son gün her zaman gerçek fiyat
            
            
        drawChart(['1 Hafta Önce', '5 Gün Önce', '3 Gün Önce', 'Dün', 'Bugün'], mockPrices, `${pName} - Fiyat Geçmişi (TL)`);
        };
    }
});


window.toggleFavorite = function(id, btnElement) {
    let favs = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (favs.includes(id)) {
        
        favs = favs.filter(fId => fId !== id);
        btnElement.textContent = "☆";
    } else {
        
        favs.push(id);
        btnElement.textContent = "⭐";
    }
    
    
    localStorage.setItem('favorites', JSON.stringify(favs));
    
    
    const activeNav = document.querySelector('.nav-item.active').textContent;
    if (activeNav.includes('Favorilerim') && !favs.includes(id)) {
        btnElement.closest('.product-card').style.display = 'none'; // Kartı anında gizle
        
        
        if (favs.length === 0) {
            document.querySelector('.product-grid').style.display = 'none';
            const emptyState = document.getElementById('emptyFavoritesState');
            if (emptyState) {
                emptyState.classList.remove('hidden');
                emptyState.style.display = 'block';
            }
        }
    }
};


document.addEventListener("DOMContentLoaded", () => {
    const deleteModal = document.getElementById("deleteConfirmModal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.onclick = () => {
            deleteModal.style.display = "none"; 
            productToDelete = null; 
        };
    }

    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = async () => {
            if (!productToDelete) return; // ID yoksa işlem yapma

            
            confirmDeleteBtn.textContent = "Siliniyor...";
            confirmDeleteBtn.style.opacity = "0.7";
            confirmDeleteBtn.disabled = true;

            try {
                
                await fetch(`${API_URL}/${productToDelete}`, { method: "DELETE" });
                
                
                deleteModal.style.display = "none";
                fetchProducts(); 
            } catch (error) {
                console.error("Silme hatası:", error);
                alert("Bir hata oluştu, ürün silinemedi.");
            } finally {
                
                confirmDeleteBtn.textContent = "Evet, Sil";
                confirmDeleteBtn.style.opacity = "1";
                confirmDeleteBtn.disabled = false;
                productToDelete = null;
            }
        };
    }
});


function loadAlarmsData() {
    const container = document.getElementById('alarms-container');
    const emptyState = document.getElementById('emptyAlarmsState');
    if(!container || !emptyState) return;
    
    container.innerHTML = ''; 
    let alarmCount = 0;

    
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        
        const isTargetReached = card.querySelector('.badge-green');

        if (isTargetReached) {
            alarmCount++; 
            const title = card.querySelector('.product-title').textContent;
            const imgUrl = card.querySelector('.product-image').src;
            const priceText = card.querySelector('.current-price').textContent;
            
            
            const linkElement = card.querySelector('a'); 
            const productUrl = linkElement ? linkElement.href : '#';

            
            const alarmHTML = `
                <div style="display: flex; align-items: center; background: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 6px solid #10b981; animation: fadeInDown 0.3s ease-out; margin-bottom: 15px;">
                    <img src="${imgUrl}" alt="${title}" style="width: 70px; height: 70px; object-fit: contain; margin-right: 20px; border-radius: 8px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; color: #374151; font-size: 1.1rem;">${title}</h4>
                        <p style="margin: 0; color: #10b981; font-weight: bold; font-size: 0.95rem;">
                            🎉 Hedef fiyata ulaştı! Anlık fiyat: ${priceText}
                        </p>
                    </div>
                    <div>
                        <a href="${productUrl}" target="_blank" style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 0.9rem; font-weight: bold; transition: 0.2s;">
                            Satın Al →
                        </a>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', alarmHTML);
        }
    });

    
    if (alarmCount === 0) {
        emptyState.classList.remove('hidden');
        emptyState.style.display = 'block';
    } else {
        emptyState.classList.add('hidden');
        emptyState.style.display = 'none';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    
    if (!darkModeToggle) return; 

    
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
});



window.openProfileModal = async function() {
    const modal = document.getElementById("profileModal");
    const userId = localStorage.getItem('user_id');

    if (modal && userId) {
        modal.style.display = "flex"; 
        
        try {
            
            const response = await fetch(`http://localhost:5000/api/user/profile/${userId}`);
            const userData = await response.json();

            if (response.ok) {
                
                document.getElementById('profileUsername').value = userData.username || "";
                document.getElementById('profileEmail').value = userData.email || "";
                document.getElementById('profileAge').value = userData.age || "";
                document.getElementById('profileGender').value = userData.gender || "";
                document.getElementById('profileLocation').value = userData.location || "";
            }
        } catch (error) {
            console.error("Profil bilgileri yüklenirken hata oluştu:", error);
        }
    }
};


window.closeProfileModal = function() {
    const modal = document.getElementById("profileModal");
    if (modal) {
        modal.style.display = "none";
    }
};


document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const userId = localStorage.getItem('user_id');
    const updateData = {
        age: document.getElementById('profileAge').value,
        gender: document.getElementById('profileGender').value,
        location: document.getElementById('profileLocation').value
    };

    try {
        const response = await fetch(`http://localhost:5000/api/user/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            alert("Profil bilgilerin başarıyla güncellendi! ✅");
            closeProfileModal();
        } else {
            const error = await response.json();
            alert("Hata: " + error.message);
        }
    } catch (error) {
        console.error("Profil güncellenirken hata:", error);
    }
});



