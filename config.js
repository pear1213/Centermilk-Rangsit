/* =====================================================================
   config.js — ตั้งค่าร้าน (แก้ไฟล์นี้บ่อยสุด)
   ===================================================================== */
const CONFIG = {
  shop: { th: "Center Milk สาขารังสิต", en: "Center Milk Rangsit" },
  tagline: { th: "นมสดคุณภาพ · ขายส่ง-ปลีก", en: "Quality fresh milk · Wholesale & retail" },

  phone: "089-689-2937",           // เบอร์จากเว็บ centermilk.com — เปลี่ยนเป็นเบอร์สาขารังสิต
  promptpay: "089-255-8436",       // ตัวอย่าง — เปลี่ยนเป็นพร้อมเพย์ของร้าน
  promptpayName: "Center Milk สาขารังสิต",

  defaultLang: "th",               // "th" หรือ "en"
  defaultShipFee: 50,              // ค่าส่งเริ่มต้น ถ้าลูกค้าไม่ได้ตั้งค่าส่งประจำไว้

  // ช่วงเวลาที่ลูกค้าเลือกได้ตอนสั่ง
  slots: ["08:00–10:00", "10:00–12:00", "13:00–15:00", "15:00–17:00"],

  // รูปจาก centermilk.com (เปลี่ยนเป็นลิงก์อื่น หรือไฟล์ในโฟลเดอร์ img/ เช่น "img/logo.png")
  logo: "https://centermilk.com/web/image/website/1/logo/Center%20Milk?unique=24eae93",
  banner: "https://centermilk.com/web/image/680-17bf0005/%E0%B8%A3%E0%B8%AD%E0%B8%9A%E0%B8%97%E0%B8%B5%E0%B9%8811.jpg",
  milkPhoto: "https://centermilk.com/web/image/611-844fcb15/271740702_2120638428086455_8958580400360246611_n.jpg"
};
