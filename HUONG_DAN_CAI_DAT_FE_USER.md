# 📚 Hướng Dẫn Cài Đặt - RSign Frontend

Tài liệu hướng dẫn cài đặt và chạy dự án RSign Frontend - Hệ thống ký số điện tử.

---

## 📋 Yêu Cầu Hệ Thống

### Phần mềm bắt buộc:

- **Node.js**: Phiên bản 18.x trở lên (khuyến nghị 20.x LTS)
- **npm**: Phiên bản 9.x trở lên (đi kèm với Node.js)
- **Git**: Để clone repository

### Kiểm tra phiên bản đã cài đặt:

```bash
node --version
npm --version
git --version
```

### Hệ điều hành hỗ trợ:

- ✅ Windows 10/11
- ✅ macOS 12+
- ✅ Linux (Ubuntu 20.04+, Fedora, etc.)

---

## 🚀 Các Bước Cài Đặt

### 1️⃣ Clone Repository

```bash
# Clone dự án từ GitHub
git clone https://github.com/binhtruong9418/rsign-fe.git

# Di chuyển vào thư mục dự án
cd rsign-fe
```

### 2️⃣ Cài Đặt Dependencies

```bash
# Cài đặt tất cả các package cần thiết
npm install
```

**Lưu ý:** Quá trình cài đặt có thể mất 2-5 phút tùy vào tốc độ mạng.

### 3️⃣ Cấu Hình Environment Variables (Tùy chọn)

Nếu dự án cần biến môi trường, tạo file `.env.local` trong thư mục gốc:

```bash
# Tạo file .env.local
cp .env.example .env.local
```

Sau đó chỉnh sửa file `.env.local` với các giá trị phù hợp:

```env
# API Backend URL (nếu có)
VITE_API_BASE_URL=https://api.rsign.example.com

# Các biến môi trường khác (nếu cần)
VITE_APP_NAME=RSign
```

### 4️⃣ Chạy Development Server

```bash
# Khởi động server phát triển
npm run dev
```

Sau khi chạy lệnh, ứng dụng sẽ khởi động tại:

- **Local**: `http://localhost:5173`
- **Network**: `http://192.168.x.x:5173` (truy cập từ thiết bị khác trong mạng LAN)

### 5️⃣ Build Production

Để build ứng dụng cho môi trường production:

```bash
# Build dự án
npm run build
```

File build sẽ được tạo trong thư mục `dist/`.

### 6️⃣ Preview Production Build

Xem trước bản build production trước khi deploy:

```bash
# Preview bản build
npm run preview
```

---

## 📦 Cấu Trúc Thư Mục

```
rsign-fe/
├── public/              # File tĩnh (images, icons, etc.)
│   └── image/          # Hình ảnh
├── src/                # Source code chính
│   ├── components/     # React components
│   │   ├── sign/      # Components liên quan đến ký số
│   │   └── ...
│   ├── pages/         # Các trang (routes)
│   ├── services/      # API services
│   │   ├── auth/      # Authentication services
│   │   └── document/  # Document services
│   ├── store/         # Zustand state management
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── constants/     # Hằng số
│   ├── locales/       # i18n translations (EN/VI)
│   ├── types.ts       # TypeScript types
│   ├── App.tsx        # Root component
│   └── index.tsx      # Entry point
├── docs/              # Tài liệu dự án
├── openspec/          # OpenSpec documentation
├── package.json       # NPM dependencies & scripts
├── vite.config.ts     # Vite configuration
├── tailwind.config.js # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── README.md          # README chính
```

---

## 🛠 Công Nghệ Sử Dụng

### Core

- **React 19.1.1**: UI library
- **TypeScript 5.8.2**: Type-safe JavaScript
- **Vite 6.2.0**: Build tool & dev server

### Routing & State

- **React Router DOM 7.9.3**: Client-side routing
- **Zustand 5.0.8**: State management
- **TanStack Query 5.90.2**: Data fetching & caching

### UI & Styling

- **Tailwind CSS 4.1.17**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Hot Toast**: Toast notifications

### Document Handling

- **pdfjs-dist 2.12.313**: PDF rendering
- **docx-preview 0.3.2**: DOCX preview

### Internationalization

- **i18next 25.7.2**: i18n framework
- **react-i18next 16.4.0**: React bindings cho i18next

### Other

- **Axios 1.12.2**: HTTP client
- **QRCode.react**: QR code generation
- **Canvas Confetti**: Celebration effects

---

## 🔧 Scripts NPM

| Lệnh              | Mô Tả                               |
| ----------------- | ----------------------------------- |
| `npm install`     | Cài đặt dependencies                |
| `npm run dev`     | Chạy development server (port 5173) |
| `npm run build`   | Build production bundle             |
| `npm run preview` | Preview production build            |

---

## 🌐 Cấu Hình Mạng

### Development Server

Server mặc định chạy trên:

- **Port**: 5173
- **Host**: `0.0.0.0` (cho phép truy cập từ mạng LAN)
- **Allowed Hosts**: `*.ducbinh203.tech`

### Thay Đổi Port

Nếu port 5173 đã được sử dụng, Vite sẽ tự động chọn port khác (5174, 5175...).

Để cấu hình port cố định, chỉnh sửa `vite.config.ts`:

```typescript
server: {
    port: 3000, // Port mong muốn
    host: "0.0.0.0",
}
```

---

## 🐛 Xử Lý Sự Cố

### Lỗi: "Cannot find module..."

```bash
# Xóa node_modules và lock file, sau đó cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: "Port 5173 is already in use"

```bash
# Tìm và kill process đang dùng port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# Hoặc để Vite tự động chọn port khác
# Vite sẽ thử port 5174, 5175...
```

### Lỗi Build hoặc TypeScript

```bash
# Xóa cache và build lại
rm -rf dist
npm run build
```

### Lỗi CORS khi gọi API

Kiểm tra cấu hình proxy trong `vite.config.ts` hoặc đảm bảo backend đã enable CORS.

### Hot Reload không hoạt động

```bash
# Restart dev server
# Ctrl + C để dừng
npm run dev
```

---

## 📱 Hỗ Trợ Đa Ngôn Ngữ

Dự án hỗ trợ 2 ngôn ngữ:

- 🇬🇧 **Tiếng Anh** (English)
- 🇻🇳 **Tiếng Việt** (Vietnamese)

File translation nằm trong `src/locales/`:

- `src/locales/en/translation.json`
- `src/locales/vi/translation.json`

---

## 🔐 Tính Năng Chính

1. **Authentication**
    - Đăng nhập / Đăng ký
    - Quên mật khẩu (2 bước: Email → OTP + Reset)
    - Xác thực email
    - Quản lý profile

2. **Document Management**
    - Xem danh sách tài liệu (Pending / Completed)
    - Chi tiết tài liệu
    - Preview PDF/DOCX/Image
    - Upload tài liệu

3. **Digital Signature**
    - Ký số trên PDF
    - Vẽ chữ ký tay
    - Preview chữ ký trên document
    - Session-based signing (30 phút)
    - Multi-signature support

4. **UI/UX**
    - Responsive design
    - Dark/Light theme support (qua Tailwind)
    - Toast notifications
    - Loading states
    - Error handling

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề trong quá trình cài đặt:

1. Kiểm tra lại các yêu cầu hệ thống
2. Xem phần "Xử Lý Sự Cố" ở trên
3. Tham khảo tài liệu trong thư mục `docs/`
4. Liên hệ team phát triển

---

## 📝 Ghi Chú

- Đảm bảo có kết nối internet ổn định khi cài đặt dependencies
- Khuyến nghị sử dụng Node.js LTS (Long Term Support)
- Đối với Windows, khuyến nghị cài Git Bash hoặc Windows Terminal
- Nên sử dụng VS Code với các extension: ESLint, Prettier, Tailwind CSS IntelliSense

---

## 🎯 Bước Tiếp Theo

Sau khi cài đặt thành công:

1. Đọc tài liệu API integration: `docs/FRONTEND_INTEGRATION.md`
2. Tìm hiểu về signing workflow: `docs/USER_SIGNING_WORKFLOW.md`
3. Xem hướng dẫn i18n: `docs/I18N_GUIDE.md`
4. Tham khảo design guidelines: `AGENTS.md`

---

**Chúc bạn code vui vẻ! 🚀**
