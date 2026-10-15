# 🎯 Valorant Checkers Bot

> **Discord Bot tracking Valorant stats, match analysis with Gemini AI & next-gen Discord Components V2.**

---

## ✨ Features

- 👤 **/account**: Tra cứu hồ sơ người chơi Valorant, hiển thị rank, elo, level, card và thống kê gần nhất.
- 📊 **/match-analyze**: Phân tích chi tiết trận đấu vừa bắn bằng **Google Gemini AI** (đánh giá MVP, phong độ, highlight, góc cần cải thiện).
- 🌾 **/lucky-blessing**: Xin vía may mắn từ linh vật **Miền Tây Tếu** trước khi leo rank (lời gáy hào sảng, tiếp lửa leo rank).
- 🔗 **/link & /unlink**: Liên kết tài khoản Riot ID với Discord user để tra cứu nhanh gọn không cần gõ lại Riot ID.
- 🎨 **Discord Components V2**: Giao diện trực quan, tương tác mượt mà với Button, Select Menu, Container và ActionRow hiện đại.
- ⚡ **Drizzle ORM & Postgres**: Lưu trữ dữ liệu liên kết và bộ nhớ đệm (Cache) tốc độ cao, giảm tải gọi Henrik API.

---

## 🛠️ Tech Stack

- **Runtime & Language**: Node.js, TypeScript 5+, `tsx`
- **Discord Framework**: `discord.js` (dev branch with Components V2), `@discordjs/builders`
- **Valorant Data Provider**: [Henrik API](https://docs.henrikdev.xyz/)
- **AI Engine**: Google Gen AI SDK (`@google/genai`) - Gemini 2.5 / Flash
- **Database & ORM**: PostgreSQL, [Drizzle ORM](https://orm.drizzle.team/)
- **Package Manager**: `pnpm`

---

## 🚀 Cài đặt & Khởi chạy

### 1. Cài đặt Dependencies

```bash
pnpm install
```

### 2. Thiết lập Biến Môi Trường

Tạo file `.env` từ file mẫu `.env.example`:

```bash
cp .env.example .env
```

Điền các thông tin cần thiết vào `.env`:

```env
# Discord Bot
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id # (Tuỳ chọn: deploy lệnh nhanh cho server test)

# API Keys
HENRIK_API_KEY=your_henrik_api_key
GEMINI_API_KEY=your_gemini_api_key

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/valorant_checkers
```

### 3. Khởi tạo Database

```bash
pnpm run drizzle-kit push
```

### 4. Triển khai Slash Commands

```bash
pnpm run deploy
```

### 5. Chạy Bot

- **Chế độ Development (hot reload)**:
  ```bash
  pnpm run dev
  ```
- **Chế độ Production**:
  ```bash
  pnpm run build
  pnpm run start
  ```

---

## 🧪 Testing

Kiểm tra kết nối Database & Preview UI:

```bash
pnpm run test:all
# hoặc kiểm tra riêng lẻ:
pnpm run test:ui
pnpm run test:db
```

---

## 📝 License

Dự án phát hành dưới giấy phép [MIT](LICENSE).
