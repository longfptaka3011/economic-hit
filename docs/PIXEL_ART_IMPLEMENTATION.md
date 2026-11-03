# Bản nâng cấp pixel art

> Các mục local dưới đây ghi lại những phase trước. Phase mới đã nối phòng online, server điều khiển trận và quiz đồng bộ: xem [MULTIPLAYER.md](MULTIPLAYER.md).

> Bản phát hành hiện tại đã có kết quả, điều khiển cảm ứng và Phaser tải khi vào trận; các mục chưa hoàn thành bên dưới là ghi chép lịch sử. Trạng thái hiện tại và giới hạn vận hành xem [PLAYTEST_RELEASE.md](PLAYTEST_RELEASE.md).

## Phạm vi

Nâng cấp trang chủ và bản chơi local hiện có. Không thay đổi thuật toán capture, tọa độ thế giới, tốc độ di chuyển, AI hoặc giao thức server. Tạo/vào phòng trên trang chủ vẫn là thông báo tính năng chưa triển khai, không phải multiplayer hoàn chỉnh.

## Quyết định triển khai

- Dùng hai PNG Kenney đã có trong repo sau khi đọc license CC0 đi kèm. Không tải thêm pack. Urban: 432×288, 27 cột; Tiny Town: 192×176, 12 cột. Mỗi frame 16×16, không có khoảng cách.
- Pixel nguồn được phóng nguyên 2×. Ô gameplay vẫn 16px và thế giới vẫn 256×256 ô. Không cần tăng kích thước logical map hoặc sửa capture.
- Thành phố chia thành 64 RenderTexture 512×512, được vẽ một lần bằng batch. Sprite tạm để đóng dấu được hủy sau khi bake. Không tạo hàng nghìn sprite môi trường sống trong display list.
- Các khu dùng chung palette và tileset: nhà máy mái đỏ, phố cửa hàng mái cam, văn phòng mái xám, khu đất có đồng ruộng và nhà nhỏ. Công viên xen kẽ phá nhịp lặp; chợ trung tâm có vòng quầy hàng và tượng đài/đài phun nước.
- Công trình là trang trí, không thêm vật cản mới vào gameplay đang cho phép đi qua mọi ô.
- Tách camera HUD khỏi camera thế giới; các đối tượng cấp cao có depth >= 500 thuộc UI. Zoom thế giới 1×/2×/3× không làm HUD bị phóng hoặc lệch. Đối tượng mới được phân loại sau mỗi update, gồm hiệu ứng và pause container sau resize.
- Minimap vẽ lại ownership khi capture/hồi sinh; viewport được giới hạn trong khung bản đồ. Ownership overlay giảm opacity để còn nhìn được nền.
- Trang chủ dùng canvas minh họa với asset local và chỉ tải Phaser khi bấm chơi. Không mở một Phaser game thứ hai chỉ để làm ảnh bìa.
- Gắn cleanup vào sự kiện SHUTDOWN thật của Phaser; chỉ gỡ listener do scene đăng ký. Đồng hồ dừng khi pause. Menu pause có đường về trang chủ.

## Xác minh

- `pnpm test`: 8 bài kiểm thử TerritoryCapture hiện có.
- `pnpm build`: kiểm tra TypeScript và build shared, server, client.
- Kiểm tra trình duyệt headless ở desktop 1440×1000 và chiều rộng 390px: trang chủ không tràn ngang; vào game, di chuyển tạo trail, zoom, pause, quay lại menu và vào game lần nữa.
- Đọc trạng thái runtime: scene active, 64 chunk được tạo, không có uncaught JavaScript exception trong lượt kiểm tra. Đồng hồ trước/sau 400ms pause bằng nhau.
- Chụp ảnh kiểm tra các khu, phát hiện và sửa ô roof/car/Tiny Town ghép sai. Smoke test dùng software rendering, không phải benchmark GPU hay chứng nhận 60 FPS.

## Chưa hoàn thành trong phạm vi này

- Multiplayer room/lobby và đồng bộ trận đấu thật.
- Màn kết quả khi hết thời gian và chu kỳ bắt đầu trận mới.
- Nút cảm ứng cho điện thoại; bản hiện tại điều khiển bằng bàn phím.
- Nhà máy/ngân hàng có artwork độc quyền và roof occlusion theo vị trí nhân vật; hiện dùng prefab ghép tile và chi tiết vẽ bằng code.
- Đóng gói font local sau khi xác minh license; hiện giữ các Google Fonts stylesheet có sẵn trong dự án và fallback monospace.

## Kỹ năng tăng tốc bằng thanh nộ

- Giữ Space đồng thời di chuyển để tăng tốc 1,6×: người chơi từ 175 lên tối đa 280 px/s. Đường chéo giữ cùng giới hạn tốc độ.
- Mỗi người chơi/bot có một `SprintAbility` riêng, khởi đầu 100 nộ. Tiêu hao 25 nộ/s, tương đương khoảng 4 giây tăng tốc liên tục.
- Sau 1 giây ngừng tăng tốc, hồi 20 nộ/s. Đứng yên giữ Space không tiêu hao. Khi cạn nộ, cần nhả Space và hồi ít nhất 20 nộ để dùng tiếp; không tự bật/tắt liên tục khi giữ phím.
- HUD hiển thị nộ của người chơi; thanh nhỏ dưới mỗi nhân vật hiển thị tài nguyên riêng. Thanh chuyển vàng khi tăng tốc, cam khi cạn. Hoạt ảnh đi bộ nhanh hơn trong lúc dùng kỹ năng.
- Bot dùng cùng quy tắc khi đuổi theo trail ở gần; tuần tra bình thường không tiêu hao nộ. Pause dừng cả hồi/tiêu hao; hồi sinh đặt lại 100 nộ.
- Chia frame dài thành các bước tối đa 1/60 giây, giới hạn catch-up 250ms sau khi tab bị treo/nền. Việc ghi trail và kiểm tra va chạm tiếp tục giữa các bước, tránh nhảy qua ô khi chạy nhanh. Thuật toán capture không đổi.
- Cấu hình cân bằng nằm tại `packages/shared/src/abilities/SprintAbility.ts`. Chưa thêm truyền trạng thái kỹ năng qua multiplayer vì trận đấu hiện vẫn chạy local.
- Kiểm tra: 15 unit tests và build toàn dự án qua. Browser smoke test xác nhận giữ Space tăng tốc thực tế, hết nộ về tốc độ thường, nhả để hồi, dùng lại, tài nguyên độc lập, pause, hồi sinh, bot tăng tốc và trail liên tục sau frame 250ms; không ghi nhận uncaught exception.

## Trạm tri thức

- Ngân hàng 25 câu hỏi tự biên soạn theo phần đọc của giáo trình người dùng cung cấp, chương 3 trang 100–111. Danh sách câu hỏi, đáp án, giải thích và nhịp các chặng nằm trong [LEARNING_QUESTIONS.md](LEARNING_QUESTIONS.md).
- Mốc chơi thực 1, 3, 6, 9 và 11 phút lần lượt mở câu hỏi về lợi nhuận, thương nghiệp, lợi tức, địa tô và tổng hợp. Có một trạm cứu nguy bổ sung theo tình huống bị cắt đuôi, có giới hạn để tránh hỏi liên tục.
- `QuizDirector` là state machine độc lập với Phaser/React; mỗi ID người thật chỉ gửi một lựa chọn cho mỗi round. Chỉ `finish` khi mọi ID đã trả lời. Đáp án đúng và giải thích chỉ xuất hiện trong view sau khi ID đó gửi lựa chọn.
- Trong bản local, chỉ đăng ký `local_player`. Bot bị đóng băng, không giả lập thành người đã trả lời. Cổng nhiều ID được kiểm thử nhưng chưa nối vào phòng hoặc giao thức server; đây không phải tính năng multiplayer đã hoàn chỉnh.
- React overlay có bốn lựa chọn, giải thích, số người đã trả lời, trang nguồn, nút tiếp tục và nút kết thúc lượt chơi. Không có nút bỏ qua để tiếp tục; trả lời sai vẫn được tiếp tục sau phần giải thích. Đúng hồi tối đa 20 nộ một lần khi tiếp tục.
- Scene khóa di chuyển, AI, capture, kinh tế, đồng hồ, tài nguyên, tweens, hoạt ảnh và scene timers trong round. Reset phím khi mở/đóng ngăn phím WASD/Space bị giữ từ trước. ESC không đi vòng qua quiz; overlay quản lý focus, Tab và giao diện cuộn trên màn hình nhỏ.
- Kiểm tra: tổng 23 unit tests qua, gồm bộ nhiều người chờ nhau, câu trả lời trùng/sai round, không lặp chặng, ngân hàng câu hỏi và phép tính. Browser smoke test xác nhận đóng băng người/bot/đồng hồ/nộ/tiền, không bỏ qua bằng ESC, khóa đáp án, xem giải thích, tiếp tục sau trả lời sai, phần thưởng không nhân đôi, bố cục 390px, thoát và bắt đầu lượt mới không giữ round cũ; không có uncaught JavaScript error.
