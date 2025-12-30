# Hướng dẫn Đa ngôn ngữ (i18n) - RSign

## Tổng quan

Dự án RSign sử dụng `react-i18next` để hỗ trợ đa ngôn ngữ. Hiện tại hỗ trợ 2 ngôn ngữ:

- **Tiếng Việt (vi)** - Ngôn ngữ mặc định
- **English (en)**

## Cấu trúc thư mục

```
src/
├── i18n.ts                          # Cấu hình i18n
├── locales/
│   ├── vi/
│   │   └── translation.json         # Bản dịch tiếng Việt
│   └── en/
│       └── translation.json         # Bản dịch tiếng Anh
└── components/
    └── LanguageSwitcher.tsx         # Component chuyển đổi ngôn ngữ
```

## Cấu hình

File `src/i18n.ts` chứa cấu hình chính:

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      vi: { translation: viTranslation },
    },
    fallbackLng: "vi", // Ngôn ngữ mặc định
    debug: true,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });
```

## Sử dụng trong Component

### 1. Import hook useTranslation

```typescript
import { useTranslation } from "react-i18next";
```

### 2. Sử dụng trong component

```typescript
const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("header.home")}</h1>
      <p>{t("common.loading")}</p>
    </div>
  );
};
```

### 3. Sử dụng với tham số (interpolation)

```typescript
// Trong translation.json
{
  "welcome": "Xin chào, {{name}}!"
}

// Trong component
<p>{t('welcome', { name: 'John' })}</p>
```

## Cấu trúc Translation Keys

### Các nhóm translation chính:

#### 1. **sign_components** - Các component liên quan đến ký tài liệu

```json
{
  "sign_components": {
    "completed_view": {
      "title": "Tài liệu đã hoàn thành",
      "message": "...",
      "home_button": "Về trang chủ"
    },
    "signature_view": {
      "back": "Quay lại",
      "clear": "Xóa",
      "sign": "Ký tài liệu"
    },
    "document_viewer": {
      "zoom_in": "Phóng to",
      "zoom_out": "Thu nhỏ",
      "rotate": "Xoay",
      "reset": "Đặt lại"
    }
  }
}
```

#### 2. **dashboard_components** - Các component dashboard

```json
{
  "dashboard_components": {
    "create_modal": { ... },
    "status_filter": { ... },
    "document_grid": { ... },
    "file_upload": { ... }
  }
}
```

#### 3. **auth** - Xác thực

```json
{
  "auth": {
    "login": { ... },
    "register": { ... }
  }
}
```

#### 4. **common** - Các text chung

```json
{
  "common": {
    "loading": "Đang tải...",
    "cancel": "Hủy",
    "save": "Lưu",
    "pagination": {
      "previous": "Trước",
      "next": "Tiếp"
    }
  }
}
```

## Thêm Translation Mới

### Bước 1: Thêm key vào file translation

**src/locales/vi/translation.json:**

```json
{
  "my_feature": {
    "title": "Tiêu đề tính năng",
    "description": "Mô tả tính năng"
  }
}
```

**src/locales/en/translation.json:**

```json
{
  "my_feature": {
    "title": "Feature Title",
    "description": "Feature Description"
  }
}
```

### Bước 2: Sử dụng trong component

```typescript
const MyFeature = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t("my_feature.title")}</h2>
      <p>{t("my_feature.description")}</p>
    </div>
  );
};
```

## Component Chuyển Đổi Ngôn Ngữ

Component `LanguageSwitcher` đã được tích hợp sẵn:

```typescript
import LanguageSwitcher from "./components/LanguageSwitcher";

// Sử dụng trong Header hoặc bất kỳ đâu
<LanguageSwitcher />;
```

## Best Practices

### 1. Đặt tên key rõ ràng

✅ **Tốt:**

```json
{
  "document_detail": {
    "signature_heading": "Chữ ký",
    "signed_by": "Được ký bởi: {{email}}"
  }
}
```

❌ **Không tốt:**

```json
{
  "sig": "Chữ ký",
  "by": "Được ký bởi: {{email}}"
}
```

### 2. Nhóm theo tính năng

Tổ chức translation theo module/feature để dễ quản lý:

```json
{
  "feature_name": {
    "component_name": {
      "action": "Text"
    }
  }
}
```

### 3. Sử dụng namespace

Tránh trùng lặp key bằng cách sử dụng namespace:

```json
{
  "auth.login.title": "Đăng nhập",
  "auth.register.title": "Đăng ký"
}
```

### 4. Xử lý số nhiều (Pluralization)

```json
{
  "items_count": "{{count}} tài liệu",
  "items_count_plural": "{{count}} tài liệu"
}
```

```typescript
t("items_count", { count: 5 }); // "5 tài liệu"
```

## Testing

### Kiểm tra ngôn ngữ trong development

1. Mở ứng dụng
2. Click vào LanguageSwitcher
3. Chọn ngôn ngữ khác
4. Kiểm tra tất cả text đã được dịch

### Kiểm tra localStorage

```javascript
// Trong console
localStorage.getItem("i18nextLng"); // Xem ngôn ngữ hiện tại
```

## Troubleshooting

### Lỗi: Translation key không hiển thị

**Nguyên nhân:** Key không tồn tại trong file translation

**Giải pháp:**

1. Kiểm tra key có đúng không
2. Kiểm tra file translation có được import đúng không
3. Xóa cache và reload: `localStorage.clear()`

### Lỗi: Ngôn ngữ không thay đổi

**Giải pháp:**

1. Kiểm tra LanguageDetector đã được cấu hình
2. Xóa localStorage và thử lại
3. Kiểm tra console có lỗi không

## Tài liệu tham khảo

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector)

## Changelog

### v2.0 (2025-12-16)

- ✅ Thêm i18n cho Document Viewer toolbar (zoom, rotate, reset)
- ✅ Thêm i18n cho error messages (PDF, DOCX)
- ✅ Cập nhật tất cả hardcoded strings trong DocumentContentViewer

### v1.0 (Initial)

- ✅ Cấu hình i18n cơ bản
- ✅ Hỗ trợ Tiếng Việt và English
- ✅ Translation cho Auth, Dashboard, Document Detail
- ✅ Component LanguageSwitcher
