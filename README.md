# Đuổi Chuột Siêu Âm | Ultrasonic Mouse Repeller

[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-00d4ff?style=for-the-badge&logo=github)](https://anlvdt.github.io/mouse-repeller/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**[VI]** Ứng dụng web (PWA) phát sóng siêu âm đuổi chuột, hoạt động trực tiếp trên trình duyệt. Dựa trên nghiên cứu khoa học về tần số 15–20 kHz gây khó chịu cho loài gặm nhấm.

**[EN]** A Progressive Web App that emits ultrasonic frequencies to repel mice, running directly in your browser. Based on scientific research on the 15–20 kHz frequency range that causes discomfort to rodents.

---

## Tính năng | Features

### Cốt lõi | Core
- Phát siêu âm 15–20 kHz qua loa thiết bị | Emit 15–20 kHz ultrasonic via device speakers
- 6 chế độ phát: FM Chaos, Quét tần số, Ngẫu nhiên, Xung, Giả thiên địch, Toàn dải | 6 patterns: FM Chaos, Sweep, Random, Burst, Predator Mimicry, Full Spectrum
- Trực quan hóa sóng âm thời gian thực | Real-time waveform visualization
- Hiệu ứng mèo đuổi chuột khi hoạt động | Cat chasing mouse animation when active

### Tự động hóa | Automation
- Tự đổi chế độ mỗi 1h/2h/4h (chống quen) | Auto-rotate patterns (anti-habituation)
- Lịch ngày/đêm tự động chuyển chế độ | Day/night auto-schedule
- Giờ cao điểm chuột 19:00–05:30 (dựa trên nghiên cứu đô thị) | Peak rat activity hours (research-based)
- Tự tối ưu hóa thiết lập khi bật | Auto-optimize settings on activation

### PWA & Tương thích | PWA & Compatibility
- Cài đặt như ứng dụng gốc trên mọi thiết bị | Install as native app on any device
- Hoạt động ngoại tuyến | Works offline
- Tương thích từ điện thoại đến màn hình Full HD (8 breakpoints)
- Vùng chạm tối thiểu 44px (chuẩn Apple/Google HIG) | Touch targets >= 44px
- Hỗ trợ safe area (notch) cho iPhone | Safe area support for notched devices

### Giao diện | UI/UX
- Thiết kế tối giản, chỉ cần một nút bấm | Minimalist one-button design
- Phông chữ Inter, gradient branding cao cấp | Inter font, premium gradient branding
- Toggle switches với hiệu ứng lò xo | Toggle switches with spring animation
- Hiệu ứng phát sáng xung quanh nút nguồn | Ambient glow breathing effect
- Toàn bộ biểu tượng dùng Lucide SVG | All icons use Lucide SVG

---

## Công nghệ | Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Giao diện | HTML5, CSS3, Vanilla JavaScript |
| Âm thanh | Web Audio API (OscillatorNode, GainNode) |
| Biểu tượng | Lucide Icons |
| Phông chữ | Google Fonts (Inter) |
| PWA | Service Worker, Web App Manifest |

---

## Cài đặt | Installation

### Chạy trực tiếp | Run directly
```bash
git clone https://github.com/anlvdt/mouse-repeller.git
cd mouse-repeller
npx -y http-server -p 8080 --cors
```

Mở trình duyệt tại | Open browser at: `http://localhost:8080`

### Cài đặt PWA | Install as PWA
1. Mở ứng dụng trên Chrome/Edge | Open in Chrome/Edge
2. Nhấn "Cài đặt" trên thanh địa chỉ | Click "Install" in address bar
3. Ứng dụng sẽ chạy như app gốc | App runs as native app

---

## Cách sử dụng | Usage

1. **Bấm nút nguồn** để bật phát siêu âm | **Press power button** to activate
2. Ứng dụng tự tối ưu: Âm lượng MAX, 15–20 kHz, FM Chaos | App auto-optimizes settings
3. **Đặt thiết bị** hướng loa vào khu vực chuột | **Place device** speakers facing mouse area
4. Bấm **biểu tượng bánh răng** để mở cài đặt nâng cao | Press **gear icon** for advanced settings

### Mẹo tăng hiệu quả | Tips for better results
- Bật âm lượng hệ thống lên mức tối đa | Set system volume to MAX
- Mỗi phòng cần một thiết bị riêng | Each room needs its own device
- Sử dụng chế độ tự đổi để chống quen | Use auto-rotate to prevent habituation
- Kết hợp với biện pháp vật lý khác | Combine with physical pest control measures

---

## Cơ sở khoa học | Scientific Background

Ứng dụng được phát triển dựa trên các nghiên cứu về hành vi loài gặm nhấm:

- Chuột nghe được tần số **1–100 kHz**, nhạy cảm nhất ở dải **15–20 kHz**
- Chuột đô thị hoạt động mạnh nhất trong khung giờ **19:00–05:30** (nghiên cứu về hoạt động ban đêm)
- Hiện tượng **quen (habituation)** xảy ra sau **3–7 ngày** với một tần số cố định nên cần đổi chế độ liên tục
- Kết hợp nhiều dạng sóng (sine, square, sawtooth) giúp **chống quen** hiệu quả hơn

---

## 👤 Author | Tác giả

**Le Van An** (Vietnam IT)

[![GitHub](https://img.shields.io/badge/GitHub-@anlvdt-181717?style=for-the-badge&logo=github)](https://github.com/anlvdt)
[![Facebook](https://img.shields.io/badge/Facebook-Laptop%20Le%20An-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/laptopleandotcom)

---

## 💖 Support the Developer | Ủng hộ tác giả

<a href="https://img.shields.io/badge/Sponsor-❤️-ea4aaa?style=for-the-badge">
  <img src="https://img.shields.io/badge/Sponsor_this_project-❤️-ea4aaa?style=for-the-badge" alt="Sponsor">
</a>

If you find this project useful, please consider supporting the developer:

Nếu bạn thấy dự án này hữu ích, hãy cân nhắc ủng hộ tác giả:

| 💳 Method | 🔢 Account | 👤 Name |
|-----------|------------|---------|
| **MB Bank** | `0360126996868` | LE VAN AN |
| **Momo** | `0976896621` | LE VAN AN |

### 🛒 Support via Shopee | Hỗ trợ qua Shopee

> 💡 **Tip**: You can support by just clicking the link - no purchase required!
>
> Bạn có thể hỗ trợ chỉ bằng cách click link - không cần mua hàng!

[![Shopee](https://img.shields.io/badge/Shopee-Laptop%20Le%20An-EE4D2D?style=for-the-badge&logo=shopee&logoColor=white)](https://collshp.com/laptopleandotcom?view=storefront)

---

## License

MIT License - See [LICENSE](LICENSE) for details.
