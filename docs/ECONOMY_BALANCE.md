# HUD và cân bằng cuộc đua điểm

## Điều kiện thắng

Hết 8 phút, xếp hạng theo điểm kinh tế nguyên hiển thị trên HUD. Diện tích là nguồn tạo thu nhập, không phải tiêu chí xếp hạng. Cùng điểm được đồng hạng, không phân thắng thua bằng ID hoặc diện tích. Điểm lẻ vẫn được tích lũy nội bộ; phần nguyên quyết định hạng ở mọi màn hình.

HUD local/online dùng chung `RaceHUD`: hạng cá nhân/tổng người chơi, điểm, khoảng cách dẫn đầu, tốc độ thu nhập trung bình, vùng hiện tại, ước tính thêm 25 ô, nguồn thu từng khu và bảng điểm. Hai mục chi tiết có thể đóng để dành chỗ cho bản đồ. Kết quả dùng cùng hàm xếp hạng với HUD.

## Luật cân bằng

| Khu | Thu nhập cơ bản | Cơ chế bổ sung |
|---|---:|---|
| Công nghiệp | 2 điểm/ô/giây | Tham gia thưởng đa dạng hóa |
| Thương nghiệp | 2 điểm/ô/giây | Tham gia thưởng đa dạng hóa |
| Tài chính | 2 điểm/ô/giây | Tích lũy theo ô, trả mỗi 2,5 giây; không lãi kép theo tổng điểm |
| Đất đai | 2 điểm/ô/giây | Thu phí đối thủ 5 điểm, tối đa một lần/0,8 giây cho mỗi người trả phí |
| Chợ trung tâm | 3 điểm/ô/giây | Giá trị cao hơn, không hưởng thưởng đa dạng hóa |
| Đất chung | 0,5 điểm/ô/giây | Không hưởng thưởng đa dạng hóa |

Một khu chính cần ít nhất 25 ô để tính vào đa dạng hóa. Từ khu thứ hai, mỗi khu đủ điều kiện tăng 5% thu nhập của bốn khu chính, tối đa 15%. Không cộng thưởng này lên phí đi qua đất. Thu phí chuyển điểm giữa hai người, không tạo điểm mới.

Ví dụ: 25 ô công nghiệp tạo 50 điểm/s. Thêm 25 ô thương nghiệp làm tổng thu nhập thành 105 điểm/s; thêm 25 ô chợ thay vào đó thành 125 điểm/s. Với 1.000 ô công nghiệp, thêm 25 ô thương nghiệp tạo lợi ích 152,5 điểm/s nhờ đa dạng hóa, cao hơn 75 điểm/s từ 25 ô chợ. Gợi ý trên HUD tính đúng chênh lệch này, nhưng không tính khoảng cách, đất trống hoặc đối thủ.

Lợi tức đã tích lũy không mất khi mất đất; trả ở kỳ tiếp theo. Khi trận kết thúc, quyết toán phần lợi tức còn chờ trước khi xếp hạng. Hiển thị tốc độ trung bình giúp tránh con số nhảy vọt theo frame trả lãi.

Đây là quy tắc cân bằng gameplay, không phải mô hình định lượng của giáo trình. Ngân hàng câu hỏi và nội dung lý luận không thay đổi.

## Bằng chứng cân bằng

Giữ nguyên 25 ô xuất phát trong 480 giây, không giao tranh hay thu phí:

| Khu xuất phát | Bản trước | Bản mới |
|---|---:|---:|
| Công nghiệp | 30.000 điểm | 24.000 điểm |
| Thương nghiệp | 21.600 điểm | 24.000 điểm |
| Tài chính, khởi đầu 0 vốn | 0 điểm | 24.000 điểm |
| Đất đai | 18.000 điểm | 24.000 điểm |

Unit tests kiểm tra mô phỏng đủ trận, thay đổi kích thước bước thời gian, mất/chuyển quyền đất, ngưỡng đa dạng hóa, thu phí và đồng hạng. Integration test dùng `OnlineMatch` thật với bốn điểm xuất phát, câu hỏi vẫn đến bình thường. Việc cân bằng này loại lợi thế thu nhập thụ động khi xuất phát; chưa chứng minh tỷ lệ thắng bằng nhau khi có giao tranh. Cần chơi thử thêm để đánh giá đường di chuyển, vị trí và phong cách người chơi.

## Mã nguồn

- `packages/shared/src/economy/EconomySystem.ts`: quy tắc duy nhất cho local/server, đếm ô theo revision ownership.
- `packages/shared/src/economy/raceStanding.ts`: điểm hiển thị, hạng, khoảng cách và giá trị mở rộng.
- `apps/client/src/game/ui/RaceHUD.tsx`: HUD dùng chung, bao gồm bản điện thoại.
