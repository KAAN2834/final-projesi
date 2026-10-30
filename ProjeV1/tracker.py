import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
import time
import schedule
import json
from urllib.parse import urljoin
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from bson.objectid import ObjectId
import re


MONGO_URI = "mongodb+srv://projev1:Alikaan123@alikaan.ljowhvw.mongodb.net/?appName=AliKaan"
SENDER_EMAIL = "projehesabiv01@gmail.com"      
APP_PASSWORD = "sjvh mgou thpw bkdi"        


client = MongoClient(MONGO_URI)
db = client.fiyat_takip_db
products_collection = db.products
users_collection = db.users 


def send_discount_email(receiver_email, product_name, current_price, target_price, product_url, product_image):
    subject = f"🔥 İndirim Yakalandı: {product_name}!"
    
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- ÜRÜN RESMİ -->
        <div style="text-align: center; margin-bottom: 20px; padding: 10px; background-color: #f9fafb; border-radius: 8px;">
            <img src="{product_image}" alt="{product_name}" style="max-width: 100%; height: auto; max-height: 250px; object-fit: contain; border-radius: 8px;">
        </div>

        <h2 style="color: #10B981; text-align: center; margin-top: 0;">Beklediğin İndirim Geldi! 🎉</h2>
        <p style="text-align: center; color: #4b5563;">Takip ettiğin <strong>{product_name}</strong> ürünü, istediğin fiyatın altına düştü.</p>
        
        <!-- FİYAT KUTUSU -->
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">🎯 Hedefin: <span style="font-weight: bold; color: #374151;">{target_price} TL</span></p>
            <p style="margin: 5px 0; color: #374151; font-size: 16px;">💰 Güncel Fiyat: <strong style="color: #EF4444; font-size: 22px;">{current_price} TL</strong></p>
        </div>
        
        <!-- BUTON -->
        <div style="text-align: center;">
            <a href="{product_url}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">Hemen Mağazaya Git</a>
        </div>
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 25px;">Bu mail <strong>FiyatTakip</strong> asistanın tarafından otomatik olarak gönderilmiştir.</p>
    </div>
    """
    
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_body, 'html'))

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, receiver_email, msg.as_string())
        return True
    except Exception as e:
        print(f"❌ Mail Hatası: {e}")
        return False


def get_product_image(url, soup):
    image_url = None
    og_tag = soup.find("meta", {"property": "og:image"})
    if og_tag: image_url = og_tag.get("content")
        
    if not image_url:
        if "vatanbilgisayar.com" in url:
            img = soup.find("img", {"id": "main-img"})
            if img: image_url = img.get("data-src") or img.get("src")
        elif "itopya.com" in url:
            img = soup.find("img", {"id": "product-main-img"})
            if img: image_url = img.get("src") or img.get("data-src")
    
    if image_url and not image_url.startswith("http"):
        image_url = urljoin(url, image_url)
    return image_url

def get_current_price_from_soup(url, soup):
    try:
        price_text = None

        if "trendyol.com" in url:
            
            import re, json
            match = re.search(r'window\.__INITIAL_STATE__\s*=\s*({.*?});', str(soup), re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group(1))
                    price_info = data.get('product', {}).get('product', {}).get('price', {})
                    
                    price = price_info.get('discountedPrice') or price_info.get('sellingPrice')
                    if price: return float(price)
                except: pass

            
            container = soup.find("div", {"class": "product-price-container"})
            if container:
                tag = container.find("span", {"class": "prc-dsc"}) or container.find("span", {"class": "prc-slg"})
                if tag: price_text = tag.get_text()
            else:
                tag = soup.find("span", {"class": "prc-dsc"})
                if tag: price_text = tag.get_text()

        elif "hepsiburada.com" in url:
            tag = soup.find("span", {"data-bind": "markupText:'currentPriceBeforePoint'"})
            if not tag: tag = soup.find("span", {"class": "price"})
            if tag: price_text = tag.get_text()
            
        elif "vatanbilgisayar.com" in url:
            tag = soup.find("span", {"class": "product-list__price"})
            if tag: price_text = tag.get_text()
            
        elif "itopya.com" in url:
            tag = soup.find("div", {"class": "price"})
            if not tag: tag = soup.find("span", {"class": "new-price"})
            if tag: price_text = tag.get_text()

        
        if not price_text:
            json_specs = soup.find_all("script", {"type": "application/ld+json"})
            for spec in json_specs:
                try:
                    import json
                    data = json.loads(spec.string)
                    if isinstance(data, list): data = data[0]
                    if "offers" in data:
                        offers = data.get("offers")
                        if isinstance(offers, list): offers = offers[0]
                        p = offers.get("price")
                        if p: return float(str(p).replace(",", "."))
                except: continue

        
        if price_text:
            clean_price = "".join(c for c in price_text if c.isdigit() or c == "," or c == ".")
            if "." in clean_price and "," in clean_price:
                clean_price = clean_price.replace(".", "").replace(",", ".")
            elif "," in clean_price:
                clean_price = clean_price.replace(",", ".")
            if clean_price:
                return float(clean_price)

    except Exception as e:
        print(f"❌ Fiyat çekme hatası ({url}): {e}")
    
    return None


def update_prices():
    print(f"\n[{time.strftime('%H:%M:%S')}] Operasyon Başlatıldı...")
    products = list(products_collection.find())
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    }
    
    

    for product in products:
        try:
            print(f"⏳ Kontrol ediliyor: {product['name']}...")
            response = requests.get(product['url'], headers=headers, timeout=10)
            
            
            if response.status_code != 200: 
                print(f"🚫 Site Engelledi (Hata: {response.status_code}) -> {product['name']}")
                continue
                
            soup = BeautifulSoup(response.text, 'html.parser')
            current_price = get_current_price_from_soup(product['url'], soup)
            
            
            if current_price is None:
                
                baslik = soup.title.text.strip() if soup.title else "Başlık Bulunamadı"
                print(f"⚠️ Fiyat okunamadı -> {product['name']}")
                print(f"   🔍 Botun Gördüğü Sayfa: {baslik}")

            image_url = get_product_image(product['url'], soup)
            
            update_data = {}
            
            
            final_image = product.get('image', '')
            if image_url and ("placeholder" in final_image or not final_image):
                update_data["image"] = image_url
                final_image = image_url

            
            if not final_image or "placeholder" in final_image:
                final_image = "https://via.placeholder.com/300x200?text=Resim+Yuklenemedi"

            if current_price:
                update_data["current_price"] = current_price
                
                target_price = float(product.get('price', 0)) 
                is_notified = product.get('is_notified', False) 
                user_id = product.get('user_id')

                if target_price > 0 and current_price <= target_price:
                    if not is_notified and user_id:
                        user = users_collection.find_one({"_id": ObjectId(user_id)})
                        
                        if user and user.get("email"):
                            print(f"🚨 {product['name']} hedefe ulaştı! Mail gönderiliyor...")
                            
                            mail_sent = send_discount_email(user["email"], product['name'], current_price, target_price, product['url'], final_image)
                            
                            if mail_sent:
                                update_data["is_notified"] = True
                                
                elif target_price > 0 and current_price > target_price and is_notified:
                     update_data["is_notified"] = False

            if update_data:
                products_collection.update_one({"_id": product['_id']}, {"$set": update_data})
                print(f"✅ {product['name']} güncellendi.")

        except Exception as e:
            print(f"❌ Hata ({product['name']}): {e}")


schedule.every(5).minutes.do(update_prices)

if __name__ == "__main__":
    update_prices()
    while True:
        schedule.run_pending()
        time.sleep(1)