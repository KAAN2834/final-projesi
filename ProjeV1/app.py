from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import requests
from bs4 import BeautifulSoup
from werkzeug.security import generate_password_hash, check_password_hash


from tracker import get_current_price_from_soup 

app = Flask(__name__)
CORS(app)


MONGO_URI = "mongodb+srv://projev1:Alikaan123@alikaan.ljowhvw.mongodb.net/?appName=AliKaan"
client = MongoClient(MONGO_URI)
db = client.fiyat_takip_db
products_collection = db.products
users_collection = db.users



def get_product_details(url):
    """Ürün eklendiği saniye hem resmi hem de GÜNCEL FİYATI çeker"""
    image_url = "https://via.placeholder.com/300x200?text=Resim+Bulunamadi"
    current_price = None

    try:
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1'
        }
        
        response = requests.get(url, headers=headers, timeout=12)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            
            if "amazon.com.tr" in url:
                img_tag = soup.find("img", {"id": "landingImage"}) or soup.find("img", {"id": "main-image"})
                if img_tag and img_tag.get("src"): image_url = img_tag["src"]
            else:
                og_image = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
                if og_image and og_image.get("content"): image_url = og_image["content"]
                elif "n11.com" in url:
                    n11_img = soup.find("img", {"class": "det-img-360"}) or (soup.find("div", {"id": "p-view"}) and soup.find("div", {"id": "p-view"}).find("img"))
                    if n11_img: image_url = n11_img.get("src")

            
            current_price = get_current_price_from_soup(url, soup)

    except Exception as e:
        print(f"app.py Veri Çekme Hatası: {e}")
        
    return image_url, current_price



@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if users_collection.find_one({"email": data.get('email')}):
        return jsonify({"message": "Bu e-posta adresi zaten kullanılıyor!"}), 400
    
    user_data = {
        "username": data.get('username'),
        "email": data.get('email'),
        "phone": data.get('phone', ''), 
        "password": generate_password_hash(data.get('password'))
    }
    
    users_collection.insert_one(user_data)
    return jsonify({"message": "Kayıt işlemi başarıyla tamamlandı."}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = users_collection.find_one({"email": data.get('email')})
    
    if not user or not check_password_hash(user['password'], data.get('password')):
        return jsonify({"message": "E-posta veya şifre hatalı!"}), 401
    
    return jsonify({
        "message": "Giriş başarılı",
        "user_id": str(user['_id']),
        "username": user['username']
    }), 200



@app.route('/api/products/<user_id>', methods=['GET'])
def get_user_products(user_id):
    user_products = []
    for doc in products_collection.find({"user_id": user_id}):
        doc['_id'] = str(doc['_id'])
        user_products.append(doc)
    return jsonify(user_products)

@app.route('/api/products', methods=['POST'])
def add_product():
    """Yeni ürün ekler ve anında fiyatını çeker."""
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"message": "Hata: Kullanıcı bilgisi eksik!"}), 400

    
    image_url, current_price = get_product_details(data.get('url'))
    
    data['image'] = image_url
    
    
    if current_price:
        data['current_price'] = current_price
        data['initial_price'] = current_price
        
        data['old_price'] = current_price 

    result = products_collection.insert_one(data)
    return jsonify({"_id": str(result.inserted_id), "message": "Ürün kaydedildi"}), 201

@app.route('/api/products/<id>', methods=['DELETE'])
def delete_product(id):
    products_collection.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Ürün başarıyla silindi"})



@app.route('/api/user/profile/<user_id>', methods=['PUT'])
def update_profile(user_id):
    data = request.json
    
    update_data = {
        "age": data.get('age'),
        "gender": data.get('gender'),
        "location": data.get('location')
    }
    
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    return jsonify({"message": "Profil başarıyla güncellendi."}), 200


@app.route('/api/user/profile/<user_id>', methods=['GET'])
def get_profile(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        return jsonify({
            "username": user.get('username'),
            "email": user.get('email'),
            "age": user.get('age', ''),
            "gender": user.get('gender', ''),
            "location": user.get('location', '')
        }), 200
    return jsonify({"message": "Kullanıcı bulunamadı"}), 404



if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)