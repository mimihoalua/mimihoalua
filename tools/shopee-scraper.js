/**
 * MIMIHOALUA - SMART SHOPEE IMPORTER v7.1 (FIX 404)
 * ------------------------------------------
 */

const { chromium } = require('playwright');
const admin = require('firebase-admin');
const axios = require('axios');
const slugify = require('slugify');

// --- 1. CẤU HÌNH HỆ THỐNG ---
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "esomar-vnn.firebasestorage.app"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// --- 2. XỬ LÝ ĐẦU VÀO ---
const TARGET_URL = process.argv[2];
const TARGET_CATEGORY_NAME = process.argv[3];

if (!TARGET_URL || !TARGET_CATEGORY_NAME) {
  console.error('\n❌ Lỗi: Thiếu tham số đầu vào.');
  process.exit(1);
}

const createSlug = (text) => slugify(text, { lower: true, strict: true, locale: 'vi', replacement: '-' });
const TARGET_CATEGORY_ID = createSlug(TARGET_CATEGORY_NAME);
const SEO_PREFIX = 'MimiFlower - ';

console.clear();
console.log('================================================');
console.log('      🤖 MIMIHOALUA IMPORT AGENT v7.1');
console.log('================================================');
console.log(`🔗 Link:     ${TARGET_URL.substring(0, 60)}...`);
console.log(`📂 Danh mục: "${TARGET_CATEGORY_NAME}"`);
console.log('================================================\n');

// --- 3. HÀM HỖ TRỢ UPLOAD ---
async function processImage(imageUrl, productName, index) {
  try {
    process.stdout.write(`   ⏳ Upload ảnh ${index + 1}... `);
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
    const buffer = Buffer.from(response.data, 'binary');
    const safeName = createSlug(productName).substring(0, 50);
    const fileName = `products/${Date.now()}-${safeName}-${index}.jpg`;
    const file = bucket.file(fileName);

    await file.save(buffer, { metadata: { contentType: 'image/jpeg' }, public: true });
    
    // Link public vĩnh viễn
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
    console.log(`✅ OK`);
    return publicUrl;
  } catch (error) {
    console.log(`❌ Lỗi (Bỏ qua)`);
    return null;
  }
}

// --- 4. CHƯƠNG TRÌNH CHÍNH ---
(async () => {
  // A. ĐỒNG BỘ DANH MỤC
  try {
      const catRef = db.collection('categories').doc(TARGET_CATEGORY_ID);
      const catSnap = await catRef.get();
      if (!catSnap.exists) {
          await catRef.set({ name: TARGET_CATEGORY_NAME, active: true, createdAt: admin.firestore.FieldValue.serverTimestamp() });
          console.log(`✨ Đã tạo danh mục mới: "${TARGET_CATEGORY_NAME}"\n`);
      }
  } catch (e) {
      console.error('❌ Lỗi kết nối Firebase:', e.message); process.exit(1);
  }

  // B. KHỞI ĐỘNG TRÌNH DUYỆT
  console.log('🚀 Đang mở Shopee...');
  const browser = await chromium.launch({ headless: false }); 
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }, // Giả lập màn hình Laptop
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  let foundData = null;

  // Bắt gói tin API
  page.on('response', async (response) => {
    const url = response.url();
    if ((url.includes('api/v4/item/get') || url.includes('api/v2/item/get')) && response.status() === 200) {
      try {
        const json = await response.json();
        if (json.data && !foundData) {
          console.log('🎯 ĐÃ TÌM THẤY DỮ LIỆU GỐC!');
          foundData = json.data;
        }
      } catch (e) {}
    }
  });

  try {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // KIỂM TRA LỖI 404 TRÊN GIAO DIỆN
    const pageTitle = await page.title();
    if (pageTitle.includes("404") || pageTitle.includes("không tìm thấy")) {
        console.error('\n❌ LỖI NGHIÊM TRỌNG: Link sản phẩm này đã CHẾT hoặc KHÔNG TỒN TẠI trên Shopee.');
        console.error('👉 Vui lòng kiểm tra lại link và thử link khác.');
        await browser.close();
        return;
    }

    console.log('📜 Đang đọc dữ liệu...');
    
    // Cuộn từ từ để kích hoạt API
    for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(1000);
        if (foundData) break; // Nếu bắt được rồi thì dừng cuộn
    }
    
    // Chờ thêm chút nếu mạng chậm
    if (!foundData) await page.waitForTimeout(3000);

  } catch (err) {
    console.error('❌ Lỗi tải trang:', err.message);
  }

  if (!foundData) {
    console.error('\n⚠️  KHÔNG LẤY ĐƯỢC DỮ LIỆU. Nguyên nhân có thể:');
    console.error('   1. Link sản phẩm sai/chết.');
    console.error('   2. Shopee yêu cầu đăng nhập (Captcha).');
    console.error('👉 Hãy thử lại với một link sản phẩm khác hoạt động bình thường.');
    await browser.close();
    return;
  }

  // C. XỬ LÝ & LƯU
  console.log('\n⚙️ Đang xử lý...');
  const rawName = foundData.name || "Sản phẩm MimiFlower";
  const finalName = SEO_PREFIX + rawName;
  const rawPrice = foundData.price_min || foundData.price || 0;
  const finalPrice = rawPrice / 100000; 

  const imageIds = foundData.images || [];
  // Lấy ảnh độ phân giải cao nhất (_tn là thumbnail, bỏ qua)
  const shopeeImageUrls = imageIds.slice(0, 8).map(id => `https://down-vn.img.susercontent.com/file/${id}`);

  const rawDesc = foundData.description || "";
  const finalDesc = `${rawDesc}\n\n---\n🌿 Phân phối bởi Mimihoalua Studio.`;

  console.log(`📸 Đang upload ${shopeeImageUrls.length} ảnh...`);
  const firebaseImageUrls = [];
  for (let i = 0; i < shopeeImageUrls.length; i++) {
    const newUrl = await processImage(shopeeImageUrls[i], finalName, i);
    if (newUrl) firebaseImageUrls.push(newUrl);
  }

  const productData = {
    name: finalName,
    basePrice: finalPrice,
    category: TARGET_CATEGORY_ID,
    description: finalDesc,
    images: firebaseImageUrls,
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    importedFrom: 'shopee_v7.1',
    originalLink: TARGET_URL
  };

  try {
    await db.collection('products').add(productData);
    console.log('\n🎉🎉🎉 NHẬP KHO THÀNH CÔNG! 🎉🎉🎉');
    console.log(`🏷️  ${productData.name.substring(0, 50)}...`);
    console.log(`💰 ${new Intl.NumberFormat('vi-VN').format(productData.basePrice)} đ`);
  } catch (error) {
    console.error('❌ Lỗi Firestore:', error);
  }

  await browser.close();
})();
