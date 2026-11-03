# TÀI LIỆU KIẾN TRÚC HỆ THỐNG — PHASE 1

## 1. Nguyên Tắc Thiết Kế (Core Design Principles)

1. **Server-Authoritative Multiplayer:** Client không bao giờ quyết định vị trí chính thức, diện tích chiếm đất hay điểm số. Toàn bộ logic trò chơi được tính toán trên Server thông qua Fixed-Timestep Loop.
2. **Monorepo Cohesion:** Gói `@market-mayhem/shared` là chân lý duy nhất (Single Source of Truth) cho các kiểu dữ liệu và hằng số giữa Client và Server.
3. **Component Reusability:** Phaser 3 được bọc bên trong React Component (`PhaserGame.tsx`), tự quản lý vòng đời (mount/unmount/destroy) sạch sẽ nhằm tránh memory leaks trên Single Page Application.
4. **Marxist Economic Foundation:** 4 phân khu kinh tế (Công nghiệp, Thương nghiệp, Tài chính, Đất đai) được định hình ngay từ cấu trúc dữ liệu nền tảng.

---

## 2. Giao Thức Mạng Giai Đoạn 1 (Phase 1 Network Protocol)

- **HTTP REST:**
  - `GET /health`: Trả về trạng thái máy chủ, phiên bản, thời gian hoạt động (uptime).
- **Socket.IO Real-time Events:**
  - `game:ping (clientTimestamp)` $\to$ Client gửi timestamp đo độ trễ.
  - `game:pong (clientTimestamp, serverTimestamp)` $\to$ Server hồi đáp, Client tính RTT (Round Trip Time).
  - `connection` & `disconnect`: Ghi nhận nhật ký kết nối kèm lý do ngắt kết nối.

