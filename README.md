# 🚀 Web Tabanlı Otonom İndirim Takip Asistanı

> E-ticaret sitelerindeki fiyat değişimlerini otonom olarak takip eden, kullanıcı dostu ve minimalist bir web tabanlı fiyat takip ve alarm sistemi.

---

## 📌 Proje Hakkında
Bu proje; kullanıcıların e-ticaret platformlarındaki (Trendyol, Hepsiburada, Amazon vb.) ürünleri manuel olarak takip etme zahmetini ortadan kaldırmak amacıyla geliştirilmiş tam yığın (Full-Stack) bir web uygulamasıdır. Geliştirilen otonom arka plan servisi sayesinde ürün fiyatları periyodik olarak taranır, veritabanında saklanır ve kullanıcının belirlediği hedef fiyata ulaşıldığında anlık bildirim mekanizması tetiklenir.

---

## 🛠️ Kullanılan Teknolojiler

### **Ön Yüz (Frontend)**
* **HTML5 & CSS3** (Modern ve temiz tasarım)
* **CSS Grid & Flexbox** (Responsive / Esnek yerleşim mimarisi)
* **SCSS / Sass** (Sürdürülebilir stil yönetimi)
* **JavaScript (ES6+)** (Asenkron işlemler ve dinamik arayüz yönetimi)

### **Arka Plan & Veritabanı (Backend & Database)**
* **Python** (Temel programlama dili)
* **Flask** (Hafif ve modüler web çatısı)
* **BeautifulSoup & Requests** (Web Scraping / Veri kazıma modülü)
* **SQLite** (İlişkisel veritabanı ve veri saklama katmanı)

---

## 🏗️ Sistem Mimarisi (3-Tier Architecture)

1. **Sunum Katmanı (Presentation Layer):** Kullanıcının ürün linki ve hedef fiyat girdiği, takip listesini görsel kartlar halinde görüntülediği arayüz.
2. **Uygulama Katmanı (Application Layer):** Python/Flask tabanlı sunucu; gelen istekleri işler, web scraper modülünü yönetir ve fiyat kıyaslama mantığını çalıştırır.
3. **Veri Katmanı (Data Layer):** Kullanıcı bilgileri, ürün detayları, fiyat geçmişi ve bildirim loglarının saklandığı SQLite veritabanı yapısı.

---

## 📊 Sistem Akış Şeması & Veri Mimarisi

* **Kullanıcı (User):** E-posta ve sistem giriş bilgileri.
* **Takip Listesi (Tracking List):** Kullanıcı ile ürün arasındaki ilişkiyi ve hedef fiyatı kuran merkezi köprü.
* **Ürünler (Products):** Takip edilen ürünün adı, URL'si ve platform bilgisi.
* **Fiyat Geçmişi (Price History):** Ürünün zaman içindeki fiyat değişimlerinin loglandığı yapı.
* **Bildirimler (Notifications):** Hedef fiyata ulaşıldığında tetiklenen uyarı mekanizması.

---

