import React from 'react';

export function HowToPlay() {
  return <details className="how-to-play"><summary>HƯỚNG DẪN CHƠI · 8 PHÚT</summary>
    <ol>
      <li><strong>Mở rộng lãnh thổ:</strong> đi ra khỏi vùng màu của bạn, vẽ một vòng rồi quay về vùng của mình để chiếm phần đất bao quanh.</li>
      <li><strong>Bảo vệ đường vẽ:</strong> khi ở ngoài lãnh thổ, đối thủ có thể cắt đuôi khiến bạn phải hồi sinh. Bạn cũng có thể cắt đuôi đối thủ.</li>
      <li><strong>Điều khiển:</strong> WASD hoặc phím mũi tên; giữ Space để tăng tốc bằng nộ. Trên điện thoại, giữ các nút hướng và nút CHẠY. Nhả nút CHẠY khi cạn nộ để hồi lại.</li>
      <li><strong>Đua điểm, không đua diện tích:</strong> hết 8 phút, nhiều điểm kinh tế nhất thắng; bằng điểm được đồng hạng. Cả 4 khu xuất phát đều 2 điểm/ô/giây, chợ trung tâm 3 điểm/ô/giây. Mỗi khu thêm đủ 25 ô tăng 5% thu nhập bốn khu, tối đa 15%. Lợi tức tài chính trả mỗi 2,5 giây, không tính lãi kép theo điểm đã có.</li>
      <li><strong>Trạm tri thức:</strong> mỗi người nhận 10 câu không trùng, 2 câu/chủ đề từ ngân hàng 75 câu. Câu đầu ở phút 1:00, sau đó mỗi 40 giây đến phút 7:00. Câu chưa làm được xếp hàng; bị loại không phát thêm câu. Đúng: đọc giải thích, đi tiếp với khiên 5 giây và hồi tối đa 20 nộ. Sai: đứng yên, không cắt đuôi được trong 5 giây kể từ lúc trả lời; sau đó mới được đi tiếp, không thưởng nộ và bị xóa khiên cũ. Đồng hồ và đối thủ vẫn chạy; không chờ cả phòng. Hết giờ, trận kết thúc kể cả còn câu chưa làm.</li>
    </ol>
    <p>Chơi thử: một người và bot. Chơi cùng bạn bè: tạo phòng, chia sẻ mã 6 chữ số, từ 2–4 người cùng sẵn sàng. Điểm và phí đi qua đất là quy tắc mô phỏng của game; không thay thế nội dung giáo trình về lợi nhuận, lợi tức và địa tô.</p>
  </details>;
}
