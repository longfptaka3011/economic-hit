# Bản phát hành chơi thử

URL: https://market-mayhem-hfuo.onrender.com

## Phạm vi hoàn thành

- Local với bot và phòng online 2–4 người, cùng một server Render phục vụ web và Socket.IO.
- Tên bắt buộc, 6 nhân vật, 8 màu; không trùng màu trong phòng. Thay ngoại hình ở lobby rồi sẵn sàng lại.
- Trận 8 phút, di chuyển, chiếm đất, cắt đuôi, hồi sinh, điểm kinh tế, bản đồ nhỏ và bảng kết quả. Chủ phòng đưa cả nhóm về lobby để chơi lượt mới.
- Nộ độc lập; giữ Space hoặc nút CHẠY để tăng tốc. Điều khiển cảm ứng giữ nhiều ngón cho hướng chéo và chạy nhanh.
- Năm chặng câu hỏi chung. Khóa chuyển động trong lúc học; mỗi người trả lời và xác nhận đọc xong trước khi cả nhóm tiếp tục.
- Hướng dẫn chiếm đất, tính điểm và quy tắc câu hỏi ở trang chủ/lobby. Phân biệt mô phỏng trong game với kiến thức giáo trình.
- Phaser tải khi bắt đầu trận, không nằm trong mã trang chủ ban đầu. Nút cảm ứng được nhả khi mất focus, hủy pointer, pause, kết thúc hoặc vào trạm câu hỏi.
- GitHub Actions build/test và build Docker, sau đó kiểm tra container trả health, HTML, JavaScript và ảnh tileset. Xem kết quả từng lần chạy trong tab Actions của repository.

## Kiểm tra trước khi mời người chơi

1. Mở URL công khai, đợi máy chủ kết nối. Tạo phòng, gửi mã 6 chữ số cho máy khác.
2. Chọn màu khác nhau, cùng sẵn sàng; chủ phòng bắt đầu. Kiểm tra mỗi máy thấy đúng tên, ngoại hình và chuyển động của nhau.
3. Trên điện thoại giữ một hướng và CHẠY; nhả tay để dừng. Thử chuyển ứng dụng rồi quay lại, bảo đảm không còn tự chạy.
4. Đến phút 1: cả phòng dừng. Một người trả lời trước chưa mở khóa; chỉ khi cả nhóm trả lời và xác nhận đọc xong mới tiếp tục.
5. Hết trận xem thứ hạng và về lobby. Người rời phòng không còn giữ nhóm chờ ở câu hỏi.

## Giới hạn vận hành

Phòng/trận lưu trong RAM một tiến trình. Restart hoặc deploy làm mất trận hiện tại; mất kết nối cần vào phòng mới, chưa có khôi phục phiên. Bản này không có tài khoản, lưu lịch sử hoặc bảng xếp hạng toàn cầu. Đây là phạm vi bản chơi thử, không phải hệ thống thi hoặc dịch vụ nhiều server.

Máy chủ tự thử kết nối lại khi chưa sẵn sàng; có thể chơi local với bot trong lúc chờ. Chưa có benchmark tải đồng thời hoặc chứng nhận tốc độ khung hình trên mọi điện thoại.
