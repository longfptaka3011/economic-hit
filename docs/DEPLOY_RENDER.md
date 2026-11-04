# Bản chơi thử Render

[Triển khai repository economic-hit lên Render](https://render.com/deploy?repo=https://github.com/longfptaka3011/economic-hit). Đường dẫn này mở bước tạo dịch vụ từ `render.yaml`; cần đăng nhập Render và xác nhận triển khai. Link game công khai sẽ xuất hiện sau khi dịch vụ build và khởi động thành công.

## Những thay đổi trong bản này

- Trận local và online đều 8 phút (480 giây, bao gồm thời gian đọc câu hỏi; chỉ menu pause local dừng đồng hồ).
- Câu hỏi mở khóa độc lập: trả lời, đọc giải thích rồi tiếp tục ngay. Người đang làm bài đứng yên và được bảo vệ khỏi cắt đuôi; đối thủ vẫn chơi.
- Mỗi người 10 câu không trùng: từ 1:00, cách nhau 40 giây đến 7:00; hai câu/chủ đề. Không phát thêm câu khi bị loại.
- Trước khi chơi phải nhập tên nhân vật 2–24 ký tự; không chấp nhận toàn khoảng trắng.
- Chọn một trong 6 nhân vật và 8 màu trang phục. Màu cũng dùng cho tên/lãnh thổ. Mỗi người trong cùng phòng online dùng màu khác nhau để dễ phân biệt; có thể đổi lại ở lobby, sau đó cần sẵn sàng lại.
- Ngoại hình được server xác minh và đưa vào snapshot; các máy nhìn thấy cùng nhân vật/màu. Preview và sprite trong game dùng cùng cách lấy frame và tô màu vùng áo, không đổi màu tóc/da toàn bộ bằng tint.
- Local cũng kết thúc mô phỏng và hiện bảng kết quả khi hết 8 phút.

## Kiến trúc deploy

Một Render Web Service dùng Docker, một instance. Express phục vụ `apps/client/dist`, `/health` và Socket.IO trên cùng origin. Bản production không lấy URL localhost từ `.env` phát triển; trình duyệt gửi HTTP/WebSocket đến chính hostname của game. Vite development vẫn cho cấu hình `VITE_SERVER_URL` và proxy `/socket.io` về cổng 3001.

`Dockerfile` gồm build stage (Node 24, pnpm 10.20.0, frozen lockfile) và runtime stage chỉ cài dependency production của server/shared. Không đưa `.env`, node_modules của máy phát triển hoặc thư mục `.tmp` vào image. Container chạy bằng user `node`, phục vụ trên `$PORT` (mặc định 10000 trong image).

## Tạo dịch vụ trên Render

Repository dự kiến: `https://github.com/longfptaka3011/economic-hit`.

1. Kết nối tài khoản Render với repository này, chọn **New → Blueprint**, nhánh `main`, đọc `render.yaml` ở root.
2. Kiểm tra dịch vụ `market-mayhem`, runtime Docker, plan `free`, một instance và health check `/health`. Blueprint không tạo database hoặc ổ lưu trữ trả phí.
3. Deploy commit mới nhất. Chỉ xác nhận đã public khi Render báo live và URL HTTPS hoạt động.
4. Mở URL trong hai trình duyệt, tạo/vào cùng mã phòng và kiểm tra sẵn sàng, chạy nhanh, câu hỏi đồng bộ.

Có thể chọn New Web Service từ cùng repository và cấu hình Docker thủ công nếu không dùng Blueprint. Không chọn Static Site: chế độ đó không chạy server Socket.IO.

Nguồn cấu hình: [Docker on Render](https://render.com/docs/docker), [Blueprint YAML](https://render.com/docs/blueprint-spec), [WebSockets](https://render.com/docs/websocket).

## Giới hạn khi cho bạn bè thử

Phòng đang lưu trong RAM: deploy/restart làm kết thúc các phòng đang chơi. Render Free có thể ngủ sau 15 phút không có lưu lượng và cần khởi động lại khi có truy cập; không dùng để cam kết luôn online. Xem [giới hạn Free của Render](https://render.com/docs/free). Không tăng số instance khi chưa có shared room state/Socket.IO adapter.

## Kiểm tra trước phát hành

- `pnpm build` và `pnpm test`.
- HTTP production: `/`, route SPA, asset PNG, `/health` và Socket.IO cùng một cổng.
- Hai tab production xác minh tên bắt buộc, chọn nhân vật/màu, thay đổi ở lobby, từ chối màu trùng, ngoại hình trong snapshot, trận 480 giây và giao diện 390px.
- Dependency runtime được cài kiểm tra ở thư mục tạm với đúng pnpm 10.20.0 và frozen lockfile. Môi trường hiện không có Docker, nên chưa tuyên bố đã build image tại máy này; Render sẽ thực hiện Docker build.

Lệnh chạy production cục bộ sau build: `pnpm start` (mặc định cổng 3001); cấu hình biến môi trường `PORT` nếu cần cổng khác.
