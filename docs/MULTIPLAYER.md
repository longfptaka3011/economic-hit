# Phase multiplayer: phòng, trận và Trạm tri thức chung

> Bản hiện tại: 8 phút, tạo nhân vật bắt buộc, hỗ trợ nút cảm ứng. Chơi tại https://market-mayhem-hfuo.onrender.com. Xem [PLAYTEST_RELEASE.md](PLAYTEST_RELEASE.md) và [DEPLOY_RENDER.md](DEPLOY_RENDER.md).

## Chạy và chơi thử

1. Chạy `pnpm build`, sau đó `pnpm start:server` và `pnpm dev:client` trong hai terminal. Có thể dùng `pnpm dev:server` khi môi trường hỗ trợ tsx watch.
2. Mở client ở `http://localhost:5173`, chọn **Tạo phòng**, nhập tên. Mã phòng gồm sáu chữ số.
3. Mở tab/trình duyệt thứ hai, chọn **Vào phòng**, nhập tên và mã phòng. Phòng hỗ trợ 2–15 người.
4. Mọi người nhấn **Sẵn sàng**, chủ phòng nhấn **Bắt đầu**. WASD/mũi tên để di chuyển, giữ Space để tăng tốc và tiêu hao nộ; cuộn chuột đổi zoom. Điện thoại dùng các nút hướng và giữ CHẠY, có thể giữ nhiều ngón cùng lúc.
5. Mỗi người nhận 10 câu không trùng, hai câu/chủ đề từ ngân hàng 75 câu (15/chủ đề), giống nhau cho cả phòng. Câu đầu ở 1:00, mỗi 40 giây phát câu tiếp theo, câu cuối ở 7:00. Bị loại không phát thêm câu. Người đang học/chờ phạt đứng yên và được bảo vệ khỏi cắt đuôi, không thể cắt đuôi người khác. Đúng được tiếp tục với khiên 5 giây và hồi tối đa 20 nộ. Sai phải chờ 5 giây từ lúc gửi đáp án, không thưởng nộ và bị xóa khiên cũ khi đi tiếp. Server kiểm soát thời gian; mọi người tiến độc lập, đồng hồ và kinh tế vẫn chạy. Câu chưa làm được xếp hàng; hết giờ vẫn kết thúc trận.
6. Hết 8 phút hoặc còn dưới hai người, trận kết thúc. Xếp hạng theo điểm kinh tế, có thống kê cá nhân và nguồn thu. Mỗi người xác nhận sẵn sàng mới trên màn kết quả, chủ phòng bắt đầu lại ngay khi đủ ít nhất hai người và tất cả sẵn sàng; hoặc về lobby để mời thêm người. Chi tiết [FEEDBACK_AND_RESULTS.md](FEEDBACK_AND_RESULTS.md).

Khi phát triển, Vite proxy Socket.IO về `http://localhost:3001`, hoặc dùng `VITE_SERVER_URL`. Production luôn dùng cùng origin với trang web. Hướng dẫn Docker/Render nằm trong [DEPLOY_RENDER.md](DEPLOY_RENDER.md).

## Phân chia trách nhiệm

Phòng hỗ trợ tối đa **15 người**, 16 màu để chọn, mỗi người một màu. Phòng 5–15 người dùng các điểm xuất phát ngẫu nhiên trên vành đai quanh chợ, cùng 25 ô và 50 điểm/giây ban đầu. Kiểm thử tải và quy tắc bấm câu hỏi xem [CROWD_PLAYTEST.md](CROWD_PLAYTEST.md).

- `OnlineMatch.ts`: server giữ vị trí, nộ, shield, trail, capture, điểm và đồng hồ. Client chỉ gửi hướng di chuyển và yêu cầu tăng tốc; không gửi vị trí hay tự cộng điểm. Input được chuẩn hóa, kiểm tra số hữu hạn và sequence; hết 500ms không có input thì dừng.
- Server mô phỏng 60 bước/giây, gửi snapshot 10 lần/giây. Bắt đầu/rời phòng gửi bản đất đầy đủ; cập nhật thường chỉ gửi ô đất thay đổi. Đuôi gửi điểm đầu/cuối/đổi hướng, client dựng lại đúng các ô; WebSocket thương lượng nén gói lớn. Client dự đoán hình ảnh nhân vật của bạn bằng vật lý dùng chung và hiệu chỉnh theo input server đã nhận; nội suy đối thủ với bộ đệm 120ms. Hồi sinh/tiếp tục câu hỏi xóa lịch sử chuyển động cũ. Không tự quyết định capture, va chạm hay điểm. Chi tiết và giới hạn xem [ONLINE_MOVEMENT.md](ONLINE_MOVEMENT.md).
- Local/server dùng chung EconomySystem, cache số ô theo revision ownership. Bốn khu chính có cùng thu nhập cơ bản, lợi tức trả cố định theo ô, không lãi kép theo tổng điểm; đa dạng hóa tối đa 15%, chợ trung tâm có giá trị cao hơn. HUD và kết quả cùng xếp hạng theo điểm, bằng điểm được đồng hạng. Chi tiết [ECONOMY_BALANCE.md](ECONOMY_BALANCE.md). Điểm game không phải mô hình định lượng của giáo trình.
- `setupOnline`: quản lý membership, mã phòng, chủ phòng, ready/start, snapshot và quiz. Chỉ chủ phòng bắt đầu khi mọi người ready; không vào giữa trận. Đáp án/explanation chỉ gửi cho người đã trả lời; không phát toàn bộ đáp án trong snapshot.
- RaceQuizDirector dùng chung với local. Mỗi người có hàng đợi câu hỏi và cổng trả lời/đọc giải thích riêng; mốc mới vẫn đến theo thời gian trận, không ghi đè câu chưa xong. Server xác minh chuyển động, bảo vệ người học và cộng thưởng đúng một lần khi tiếp tục. Mỗi trận có UUID riêng để loại input/answer/continue của lượt cũ. `snapshot.paused` không còn thể hiện câu hỏi; `player.learning` là trạng thái cá nhân.
- OnlineScene dùng lại CityMapRenderer, PlayerRenderer, TerritoryRenderer và camera. HUD React hiển thị mã phòng, đồng hồ, mọi người, nộ, minimap, kết quả và nút rời trận. ESC không tạm dừng trận online của người khác.

## Rời phòng và mất kết nối

- Socket rời/mất kết nối bị loại ngay khỏi trận; xóa trail và lãnh thổ, loại khỏi quorum câu hỏi. Không để người còn lại chờ một người đã rời.
- Chủ phòng rời: chuyển quyền cho người còn lại đầu tiên. Phòng hết người được xóa khỏi RAM. Còn dưới hai người thì kết thúc trận.
- Client có thông báo khi mất kết nối; kết nối lại không khôi phục phiên cũ. Có thể tạo/vào phòng mới. Chưa có grace period hoặc reconnect token.
- Người chưa trả lời chỉ giữ câu hỏi của riêng mình; không chặn đối thủ hoặc kết thúc trận. Có thể rời trận, không có nút bỏ qua câu hỏi để tiếp tục.

## Sửa nền tảng khi bắt đầu phase

Ở thời điểm đọc repo, PhaserGame và MainScene chứa các đoạn phiên bản cũ/mới bị ghép trùng, client báo lỗi cú pháp. Đã lưu bản sao trước sửa tại `.tmp/phase-multiplayer-backup`, bỏ đoạn trùng và khôi phục local: pixel rendering, sprint, discovery, quiz, pause/resize/cleanup. Giữ bố cục home hiện có; nối nút tạo/vào phòng thật và cập nhật nhãn phase.

## Kiểm chứng phase ban đầu (cơ chế chờ chung đã được thay thế)

- `pnpm build`: TypeScript shared/server/client và Vite.
- `pnpm test`: 30 tests, gồm 23 tests trước, 6 tests server match, 1 integration test Socket.IO ba client thật. Kiểm tra host/ready, input, sprint, capture, cắt trail/hồi sinh, freeze, quorum, riêng tư view đáp án, disconnect, kết thúc và lobby lượt mới.
- Browser hai tab: tạo/vào phòng, ready/start, nhận cùng match ID, di chuyển và sprint qua server, đợi mốc câu hỏi thật đầu tiên ở phút 1, đóng băng cả hai, một đáp án chưa mở khóa, từng người xác nhận đọc xong, cùng tiếp tục, rời trận/kết quả/lobby. Lượt kiểm tra cuối không có uncaught exception.
- Kiểm tra local sau sửa: câu hỏi, khóa di chuyển khi học, đồng hồ/điểm/nộ, xem đáp án sai, tiếp tục, phần thưởng đúng một lần, thoát/bắt đầu lại và layout 390px. Không có uncaught exception.
- Hình ảnh online/lobby/quiz/kết quả được chụp tại desktop và 390px bằng software renderer. Chưa benchmark 60 FPS trên nhiều thiết bị hoặc kiểm thử tải Internet.

## Giới hạn của bản thử nghiệm

Phòng và trạng thái chỉ lưu trong RAM một tiến trình. Restart server mất trận. Chưa có tài khoản, lưu lịch sử, khôi phục kết nối, ghép trận công khai, lưu thống kê học tập hoặc hạ tầng nhiều server. Toàn bộ ngân hàng câu hỏi vẫn có trong client phục vụ local; đây là hoạt động học tập, không phải hệ thống thi chống xem đáp án.
