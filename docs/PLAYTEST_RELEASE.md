# Bản phát hành chơi thử

URL: https://market-mayhem-hfuo.onrender.com

## Phạm vi hoàn thành

- Luyện tập một mình và phòng online 2–15 người, cùng một server Render phục vụ web và Socket.IO.
- Tên bắt buộc, 6 nhân vật, 16 màu; không trùng màu trong phòng. Thay ngoại hình ở lobby rồi sẵn sàng lại.
- Trận 8 phút, di chuyển, chiếm đất, cắt đuôi, hồi sinh, điểm kinh tế, bản đồ nhỏ và bảng kết quả. Chủ phòng đưa cả nhóm về lobby để chơi lượt mới.
- Thông báo và hiệu ứng cho chiếm đất/cắt đuôi/vượt hạng, âm thanh mặc định tắt. Màn kết quả có diện tích lớn nhất, số lần giao tranh, câu đúng và nguồn thu. Local chơi lại ngay, online xác nhận sẵn sàng mới để bắt đầu ngay trên màn kết quả. Xem [FEEDBACK_AND_RESULTS.md](FEEDBACK_AND_RESULTS.md).
- HUD dùng chung local/online xếp hạng theo điểm, hiện khoảng cách dẫn đầu và thu nhập; hòa điểm được đồng hạng. Bốn khu xuất phát có cùng thu nhập cơ bản, thưởng đa dạng hóa tối đa 15%, chợ trung tâm giá trị cao hơn. Luật và bằng chứng xem [ECONOMY_BALANCE.md](ECONOMY_BALANCE.md).
- Nộ độc lập; giữ Space hoặc nút CHẠY để tăng tốc. Điều khiển cảm ứng giữ nhiều ngón cho hướng chéo và chạy nhanh.
- Mười chặng câu hỏi giống nhau cho cả phòng nhưng mở khóa độc lập. Người đang học/chờ phạt đứng yên, không bị cắt đuôi và cũng không cắt được đuôi đối thủ. Đọc giải thích và hết hình phạt (nếu sai) để đi tiếp; đồng hồ và kinh tế vẫn chạy. Popup vùng đất có cả local và online, tự ẩn và không khóa di chuyển.
- Mỗi người nhận 10 câu không trùng/trận, hai câu/chủ đề từ ngân hàng 75 câu: từ 1:00, mỗi 40 giây đến 7:00. Không phát thêm câu khi bị loại. Đúng nhận khiên 5 giây khi đi tiếp và hồi tối đa 20 nộ; sai bị khóa tiếp tục 5 giây từ lúc trả lời, không thưởng nộ và xóa khiên cũ khi đi tiếp. Thời gian đọc được tính vào hình phạt; không thể bỏ qua hoặc gia hạn thưởng bằng gửi lặp sự kiện. Hết giờ vẫn kết thúc kể cả chưa làm đủ câu.
- Lobby có quảng trường pixel art dùng lại Urban CC0, nhân vật tại bốn nhân vật xem trước và danh sách tối đa 15 người, thẻ người chơi và mã phòng nổi bật; tự bố trí lại trên điện thoại. Không tải tài nguyên mới.
- Hướng dẫn chiếm đất, tính điểm và quy tắc câu hỏi ở trang chủ/lobby. Phân biệt mô phỏng trong game với kiến thức giáo trình.
- Phaser tải khi bắt đầu trận, không nằm trong mã trang chủ ban đầu. Nút cảm ứng được nhả khi mất focus, hủy pointer, pause, kết thúc hoặc vào trạm câu hỏi.
- GitHub Actions build/test và build Docker, sau đó kiểm tra container trả health, HTML, JavaScript và ảnh tileset. Xem kết quả từng lần chạy trong tab Actions của repository.

## Kiểm tra trước khi mời người chơi

HUD mặc định thu gọn còn thời gian, điểm, số ô/hạng, khu vực và thu nhập. Bấm **Chi tiết** để xem gợi ý mở rộng, nguồn thu và bảng điểm online. Local là luyện tập một mình, không có bot, không có bảng xếp hạng giả; tổng kết chỉ hiển thị kết quả của bạn.

1. Mở URL công khai, đợi máy chủ kết nối. Tạo phòng, gửi mã 6 chữ số cho máy khác.
2. Chọn màu khác nhau, cùng sẵn sàng; chủ phòng bắt đầu. Kiểm tra mỗi máy thấy đúng tên, ngoại hình và chuyển động của nhau.
3. Trên điện thoại giữ một hướng và CHẠY; nhả tay để dừng. Thử chuyển ứng dụng rồi quay lại, bảo đảm không còn tự chạy.
4. Đến phút 1: cùng nhận câu hỏi, đồng hồ vẫn giảm. Một người trả lời rồi bấm tiếp tục, kiểm tra người đó đi được trong khi người kia vẫn đứng yên được bảo vệ và chưa nhận đáp án.
5. Hết trận xem thứ hạng và về lobby, kể cả còn người chưa trả lời. Thử đi sang vùng khác: popup giới thiệu vùng hiện rồi tự ẩn, không chặn di chuyển.

## Giới hạn vận hành

Phòng/trận lưu trong RAM một tiến trình. Restart hoặc deploy làm mất trận hiện tại; mất kết nối cần vào phòng mới, chưa có khôi phục phiên. Bản này không có tài khoản, lưu lịch sử hoặc bảng xếp hạng toàn cầu. Đây là phạm vi bản chơi thử, không phải hệ thống thi hoặc dịch vụ nhiều server.

Máy chủ tự thử kết nối lại khi chưa sẵn sàng; có thể chơi luyện tập một mình trong lúc chờ. Đã kiểm thử một phòng 15 kết nối; không quy đổi kết quả này thành bảo đảm tải nhiều phòng hoặc mọi thiết bị. Xem CROWD_PLAYTEST.md.
