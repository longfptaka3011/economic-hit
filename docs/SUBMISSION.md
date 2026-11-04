# MARKET MAYHEM – Hướng dẫn bản nộp

## Sản phẩm

Game thành phố pixel art về **Các hình thức biểu hiện của giá trị thặng dư trong nền kinh tế thị trường** thuộc học phần Kinh tế chính trị Mác–Lênin. Người chơi chiếm đất, tích lũy điểm kinh tế và trả lời câu hỏi để giành lợi thế. Các quy tắc tính điểm là mô phỏng gameplay, không thay thế định nghĩa trong giáo trình.

- Chơi ngay: https://market-mayhem-hfuo.onrender.com
- Mã nguồn: https://github.com/longfptaka3011/economic-hit
- Một lượt kéo dài 8 phút. Luyện tập một mình hoặc thi đấu online 2–15 người.
- Bắt buộc đặt tên; chọn một trong 6 nhân vật và 16 màu. Mỗi người trong phòng online dùng màu riêng.
- Mỗi người nhận lịch 10 câu không trùng: 2 câu/chủ đề từ ngân hàng 75 câu. Câu đầu ở 1:00, sau đó mỗi 40 giây đến 7:00. Câu chưa làm được xếp hàng riêng; hết giờ vẫn kết thúc trận.

## Chạy tại máy

Yêu cầu Node.js 24 và pnpm 10.20.0 theo cấu hình dự án.

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm start
```

Mở http://localhost:3001. Server Express phục vụ cả client và Socket.IO sau khi build. Có thể đặt biến môi trường `PORT` khi cần đổi cổng. Docker và Render: [DEPLOY_RENDER.md](DEPLOY_RENDER.md).

## Kịch bản demo đề xuất

1. Mở trang chủ: giới thiệu bốn khu Công nghiệp, Thương nghiệp, Tài chính, Đất đai. Trình bày mục tiêu học tập và khác biệt giữa điểm mô phỏng với nội dung giáo trình.
2. Chọn **Chơi Thử Nghiệm**, đặt tên và ngoại hình. Đây là luyện tập một mình, không có bot. WASD/phím mũi tên để đi, giữ Space để chạy; điện thoại có nút cảm ứng. Đi ra ngoài lãnh thổ rồi quay về để chiếm một vòng đất.
3. Chỉ ra HUD nhỏ ở góc: thời gian, số ô/điểm, khu vực và thu nhập. Mở **Chi tiết** khi cần giải thích nguồn thu; thu gọn để quan sát bản đồ.
4. Tại câu hỏi đầu tiên ở phút 1:00, nhả Space và phím di chuyển để chứng minh không bị tự chọn. Bấm chuột/chạm vào đáp án rồi đọc giải thích. Đúng nhận khiên 5 giây và hồi tối đa 20 nộ; sai chờ đủ 5 giây. Không có phím bỏ qua câu hỏi.
5. Thi đấu thật: mở **Tạo Phòng**, chia sẻ mã sáu số. Các máy khác chọn **Vào Phòng**, tên/màu khác nhau. Mọi người bật sẵn sàng, chủ phòng bắt đầu. Có thể mời tối đa 15 người. Khi làm câu hỏi, chỉ người đó đứng yên và được bảo vệ hai chiều; người trả lời xong đi tiếp riêng.
6. Hết lượt xem tổng kết điểm, diện tích, câu hỏi và nguồn thu. Luyện tập có nút chơi lại; online yêu cầu mọi người sẵn sàng lại, giữ phòng và ngoại hình.

## Tài liệu và kiểm tra

- [Ngân hàng 75 câu, đáp án, giải thích và trang giáo trình](LEARNING_QUESTIONS.md).
- [Luật điểm và cân bằng kinh tế](ECONOMY_BALANCE.md).
- [Phòng 15 người, đồng bộ dữ liệu và kiểm thử](CROWD_PLAYTEST.md).
- [Chuyển động online](ONLINE_MOVEMENT.md).
- [Nguồn tài nguyên](../ASSET_CREDITS.md), [manifest](../ASSET_MANIFEST.md), [ảnh trang chủ và prompt](HOMEPAGE_ART.md).
- GitHub Actions chạy build, tests và kiểm tra container production cho mỗi lần push `main`. Kiểm tra `/health` để xác nhận phiên bản online và giới hạn 15 người.

## Phạm vi vận hành

Phòng đang lưu trong RAM của một server; deploy/restart kết thúc trận hiện tại. Mất kết nối cần tạo/vào phòng mới. Không có tài khoản, lịch sử trận hoặc bảng xếp hạng toàn cầu. Kết quả kiểm thử một phòng 15 người không phải cam kết số phòng đồng thời trên mọi cấu hình hosting. Bản luyện tập vẫn vào được khi chưa kết nối server.
