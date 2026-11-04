# MARKET MAYHEM – CHIẾN TRƯỜNG THỊ TRƯỜNG

**Chơi ngay:** https://market-mayhem-hfuo.onrender.com · [Phạm vi bản phát hành và kiểm tra chơi thử](docs/PLAYTEST_RELEASE.md).

**Phản hồi và tổng kết:** thông báo chiếm đất/cắt đuôi/vượt hạng, âm thanh tùy chọn; thống kê diện tích lớn nhất, giao tranh, câu hỏi và nguồn thu. Chơi lại nhanh giữ nhân vật; online cần xác nhận sẵn sàng mới. [Chi tiết](docs/FEEDBACK_AND_RESULTS.md).

**Cuộc đua điểm:** HUD hiện hạng, khoảng cách dẫn đầu và nguồn thu. Bốn khu xuất phát cùng 2 điểm/ô/giây; tài chính không lãi kép theo điểm. [Luật cân bằng và mô phỏng 8 phút](docs/ECONOMY_BALANCE.md).

**Điều khiển:** WASD/mũi tên + giữ Space; điện thoại có phím hướng và nút CHẠY. Phaser chỉ tải khi vào trận. CI kiểm tra build, tests và container production trên mỗi lần push `main`.

**Chuyển động online:** phản hồi ngay bằng dự đoán hình ảnh nhân vật, hiệu chỉnh theo server; đối thủ được nội suy qua bộ đệm 120ms. Server vẫn quyết định va chạm, đất và điểm. [Cơ chế và kiểm thử](docs/ONLINE_MOVEMENT.md).

**Câu hỏi cạnh tranh:** tiến độ trả lời độc lập, không chờ cả phòng; trả lời sai phải chờ đủ hình phạt trước khi đi tiếp. Người đang làm bài đứng yên và được bảo vệ khỏi bị cắt đuôi; bot/đối thủ và đồng hồ vẫn chạy. Popup giới thiệu vùng có trong cả local và online, không khóa di chuyển.

**Thưởng/phạt tri thức:** Mỗi người 10 câu không trùng/trận, 2 câu/chủ đề từ ngân hàng 75 câu. Phát từ 1:00, mỗi 40 giây đến 7:00. Đúng: khiên 5 giây từ lúc đi tiếp và hồi tối đa 20 nộ. Sai: phải chờ 5 giây, không nộ, xóa khiên cũ khi đi tiếp. Không chờ cả phòng. Lobby có quảng trường pixel art, bốn vị trí chờ và bảng mã mời. [Ngân hàng câu hỏi và giải thích](docs/LEARNING_QUESTIONS.md).

**Cập nhật:** đã có phòng online 2–4 người, server điều khiển trận đấu, tăng tốc bằng Space và trạm câu hỏi đồng bộ. Hướng dẫn chạy, chơi thử và các giới hạn xem [docs/MULTIPLAYER.md](docs/MULTIPLAYER.md). Các mục “Phase 1” bên dưới là ghi chép giai đoạn ban đầu.

**Bản chơi thử:** trận 8 phút, bắt buộc đặt tên, 6 nhân vật và 8 màu để chọn. Docker/Render và cách phát hành xem [docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md).

> **Game thể loại:** 2D Top-Down Multiplayer Territory-Control Party Game (Paper.io x Splatoon).  
> **Chủ đề giáo dục:** Các hình thức biểu hiện của Giá trị Thặng dư trong Nền kinh tế Thị trường (Kinh tế Chính trị Mác – Lênin).

---

## 1. Cấu Trúc Dự Án (Project Structure)

Dự án được tổ chức theo mô hình **Monorepo** chuẩn với **npm/pnpm workspaces**:

```
market-mayhem/
  apps/
    client/                       # Frontend React 18 + Vite + Phaser 3 + Tailwind CSS
      src/
        components/               # UI components tái sử dụng
        pages/                    # Trang chính (HomePage, Lobby)
        game/                     # Tích hợp Phaser 3 Engine
          scenes/                 # Phaser Scenes (MainScene, BootScene)
          entities/               # Game objects (Player, Trail)
          systems/                # Input, Camera, Interpolation
          rendering/              # GridRenderer, ZoneRenderer
          PhaserGame.tsx          # Reusable React wrapper cho Phaser Canvas
        networking/               # Socket.IO client kết nối thời gian thực
        styles/                   # Tailwind CSS & global styles
    server/                       # Backend Node.js + Express + Socket.IO
      src/
        rooms/                    # Quản lý vòng đời phòng và trạng thái trận đấu
        game/                     # Game Engine & fixed-timestep loop
          systems/                # Movement, Territory, Economic systems
        networking/               # Socket.IO gateway, ping/pong, disconnect handling
        config/                   # Cấu hình môi trường (port, cors, timeouts)
        server.ts                 # Entry point Express HTTP & GET /health endpoint
  packages/
    shared/                       # Thư viện dùng chung 100% Type definitions & constants
      src/
        types/                    # PlayerState, GridCell, ZoneType, Protocol
        constants/                # Tick rate (20Hz), Map bounds, 4 Phân khu kinh tế
  docs/                           # Tài liệu thiết kế kiến trúc và mô hình kinh tế
```

---

## 2. Yêu Cầu Môi Trường (Prerequisites)

- **Node.js:** phiên bản `18.x` trở lên (Khuyên dùng `20.x` hoặc `24.x`).
- **Trình quản lý gói:** `pnpm` (khuyên dùng) hoặc `npm`.

---

## 3. Cài Đặt (Installation)

1. Clone mã nguồn và mở thư mục gốc `market-mayhem`:
   ```bash
   cd "d:/Semester 8/mln-game"
   ```

2. Cài đặt toàn bộ dependencies cho tất cả packages:
   ```bash
   pnpm install
   # Hoặc nếu dùng npm:
   # npm install
   ```

3. Nếu pnpm thông báo về build script của `esbuild`, chạy:
   ```bash
   pnpm approve-builds --all
   ```

---

## 4. Chạy Phát Triển (Development)

### Chạy song song cả Server và Client (Khuyên dùng):
```bash
pnpm run dev
# hoặc: npm run dev
```

- **Client Vite (React + Phaser):** Mở tại [http://localhost:5173](http://localhost:5173)
- **Server Express + Socket.IO:** Mở tại [http://localhost:3001](http://localhost:3001)
- **Health Check Endpoint:** [http://localhost:3001/health](http://localhost:3001/health)

### Chạy riêng biệt từng dịch vụ:
- **Server:**
  ```bash
  pnpm run dev:server
  ```
- **Client:**
  ```bash
  pnpm run dev:client
  ```

---

## 5. Biên Dịch (Build Production)

Biên dịch tuần tự tất cả packages (`shared` -> `server` -> `client`):
```bash
pnpm run build
# hoặc: npm run build
```

---

## 6. Tiêu Chí Nghiệm Thu Giai Đoạn 1 (Phase 1 Acceptance Criteria)

- [x] Cài đặt `pnpm install` / `npm install` thành công 100%.
- [x] Client khởi động không lỗi trên Vite + React + Tailwind CSS.
- [x] Server Express khởi động thành công, lắng nghe tại cổng `3001`.
- [x] Endpoint `GET /health` trả về JSON `status: ok` với đầy đủ timestamp và uptime.
- [x] Client tự động kết nối Socket.IO đến máy chủ, đo và hiển thị độ trễ ping thời gian thực.
- [x] Khởi tạo Phaser 3 thành công bên trong React component tái sử dụng (`<PhaserGame />`).
- [x] Phaser Game Scene render mượt mà:
  - Bản đồ lưới (grid-based map) màu tối hiện đại.
  - Background tương phản.
  - Nhân vật đại diện (placeholder player) di chuyển bằng **WASD / Phím mũi tên**.
  - Bộ đếm FPS trực quan thời gian thực (FPS counter badge).
- [x] 100% Typescript types trong `@market-mayhem/shared` biên dịch không có lỗi.

