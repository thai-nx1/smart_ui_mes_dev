# Hướng dẫn sử dụng môi trường trong dự án

## Tổng quan

Dự án này hỗ trợ nhiều môi trường khác nhau để phát triển, kiểm thử và triển khai:

- **Development**: Môi trường phát triển cục bộ, được sử dụng trong quá trình phát triển.
- **Staging**: Môi trường kiểm thử, giống với môi trường production nhưng dùng để kiểm tra trước khi triển khai chính thức.
- **Production**: Môi trường chính thức, phục vụ người dùng thực.

## Các file môi trường

Dự án sử dụng các file sau để quản lý cấu hình cho từng môi trường:

- `.env`: Chứa các biến môi trường cho môi trường development (mặc định).
- `.env.staging`: Chứa các biến môi trường cho môi trường staging.
- `.env.production`: Chứa các biến môi trường cho môi trường production.
- `.env.example`: Mẫu file cấu hình, liệt kê tất cả các biến môi trường cần thiết mà không chứa giá trị thực.

## Danh sách biến môi trường

| Biến | Mô tả |
|------|-------|
| `VITE_APP_ENV` | Định danh môi trường hiện tại (development, staging, production) |
| `VITE_GRAPHQL_ENDPOINT` | URL của GraphQL API endpoint |
| `VITE_API_URL` | URL của REST API (nếu có) |

## Sử dụng trong code

Để truy cập các biến môi trường trong code, bạn có thể sử dụng module `env.ts`:

```typescript
import { config, isProduction, isDevelopment, isStaging } from '@/lib/env';

// Ví dụ sử dụng
console.log('Current environment:', config.env);
console.log('GraphQL endpoint:', config.graphqlEndpoint);

// Kiểm tra môi trường
if (isDevelopment()) {
  console.log('Development mode enabled');
}

if (isProduction()) {
  // Chỉ thực hiện trong môi trường production
}
```

## Khởi chạy ứng dụng với môi trường cụ thể

### Development (mặc định)

```
npm run dev
```

### Staging

```
npm run dev:staging
```
hoặc
```
npm run build:staging
```

### Production

```
npm run build
```

## Thêm biến môi trường mới

1. Thêm biến vào `.env.example` với mô tả cách sử dụng
2. Thêm giá trị tương ứng vào các file `.env`, `.env.staging`, `.env.production`
3. Cập nhật file `env.ts` để export biến mới
4. Cập nhật tài liệu này để mô tả biến mới

## Lưu ý quan trọng

- Không commit các file `.env`, `.env.staging`, `.env.production` chứa thông tin nhạy cảm
- Các biến môi trường bắt đầu bằng `VITE_` sẽ được tiếp cận từ phía client
- Các biến nhạy cảm (như API key, secret) không nên bắt đầu bằng `VITE_`