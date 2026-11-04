# Phản hồi trận đấu, tổng kết và chơi lại

## Trong trận

- Chiếm đất có thông báo số ô tăng thực tế, hiệu ứng pixel và âm báo khi bật âm thanh. Từ 50 ô trở lên được đánh dấu vùng lớn. Màu hiệu ứng theo nhân vật; không tính lại ô đã sở hữu trong cùng vòng chiếm.
- Bị cắt đuôi: chỉ rõ đối thủ và việc hồi sinh. Người cắt cũng nhận xác nhận. Thông báo bị cắt được ưu tiên để không bị thông báo đổi hạng che ngay.
- Vượt hạng: chỉ báo khi thực sự vượt điểm một người từng dẫn trước, vị trí mới giữ ít nhất 1,2 giây. Giới hạn nhắc mỗi 6 giây và không chúc mừng do người khác rời phòng hoặc do đồng điểm. Điều này giảm nhiễu từ các kỳ trả lợi tức.
- Âm thanh mặc định tắt, bật/tắt trong HUD. Các âm ngắn được tổng hợp bằng Web Audio sau thao tác bật của người chơi; không có nhạc nền hay tệp âm thanh tải từ ngoài. Chuyển tab không phát âm báo. Lựa chọn tồn tại trong phiên trang hiện tại.
- Snapshot chỉ giữ tối đa 12 sự kiện với số thứ tự tăng dần trong mỗi trận. Client bỏ sự kiện đã xử lý, không phát lại thông báo theo nhịp snapshot. Hiệu ứng pixel mới tôn trọng lựa chọn giảm chuyển động của trình duyệt.

## Tổng kết

Local/online dùng chung màn hình kết quả, giữ luật xếp hạng theo điểm và đồng hạng khi bằng điểm. Thống kê cá nhân gồm:

- Diện tích lớn nhất trong trận, không bị ghi đè khi hồi sinh.
- Số vòng chiếm đất thành công và tổng số ô tăng qua các vòng. Một ô mất rồi chiếm lại có thể được tính trong nhiều vòng; đây không phải số ô duy nhất của bản đồ.
- Số lần cắt đuôi và bị cắt đuôi. Nếu hai người cùng cắt một vệt trong một bước mô phỏng, chỉ ghi một lượt cho người chạm được xét đầu tiên. Bấm hồi sinh thủ công trong local không được tính thành bị cắt đuôi.
- Câu đúng/tổng câu đã trả lời; tính khi gửi đáp án hợp lệ, kể cả chưa kịp đọc xong trước khi hết giờ. Bot không được tính là người làm câu hỏi. Chi tiết đáp án và tổng câu đúng không được đưa vào snapshot thống kê trực tiếp của đối thủ, chỉ công bố thống kê ở kết quả cuối trận.
- Nguồn thu chủ yếu, các nguồn thu gộp và phí đất đã trả. Lợi tức đang chờ được quyết toán trước khi kết thúc như luật kinh tế hiện tại.

Các số đo lấy từ mô phỏng local hoặc server online, không suy ra số lần chết từ vị trí dịch chuyển. Xem snapshot kết quả nhiều lần không tăng thống kê. Phòng online chỉ xếp hạng những người còn trong trận; nếu kết thúc vì đối thủ rời, màn hình ghi rõ kết thúc sớm.

## Chơi lại

- Local: nút chơi lại khởi động lại scene, giữ tên/nhân vật/màu. Đồng hồ, điểm, lãnh thổ, nộ, câu hỏi, thống kê và lịch sử thông báo đều mới; không cần nhập lại tên.
- Online: khi kết thúc, mọi cờ sẵn sàng được xóa. Mỗi người xác nhận sẵn sàng trên màn kết quả; chủ phòng chỉ được bắt đầu khi còn ít nhất hai người và tất cả cùng sẵn sàng. Giữ nguyên mã phòng và ngoại hình, tạo UUID trận mới cùng toàn bộ trạng thái mới. Sự kiện mang UUID lượt trước bị từ chối.
- Chủ phòng vẫn có thể đưa cả nhóm về lobby để mời thêm người hoặc đổi ngoại hình. Không tự bắt đầu lượt mới thay quyết định của người chơi.

Thống kê chỉ tồn tại trong RAM/phiên chơi hiện tại, chưa phải lịch sử hoặc bảng xếp hạng tài khoản.
