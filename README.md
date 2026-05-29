# MED-OCR Frontend

Frontend cho hệ thống quản lý bệnh án y tế có OCR. Ứng dụng này phục vụ 3 nhóm người dùng:

- `employee`: upload bệnh án, kiểm tra và chỉnh sửa dữ liệu OCR, submit để bác sĩ duyệt
- `doctor`: xem bệnh án chờ duyệt, approve/reject, chỉnh sửa dữ liệu OCR khi cần
- `admin`: quản lý tài khoản, xem toàn bộ bệnh án, quản lý bệnh nhân, xóa bệnh án

Project này đang bám theo kế hoạch trong [docs/FRONTEND_PLAN.md](docs/FRONTEND_PLAN.md). Tiến độ triển khai thực tế cũng được cập nhật trực tiếp trong file đó để có thể tiếp tục ở các lượt sau.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- Zustand
- Ant Design
- Tailwind CSS v4
- Lucide React

## Backend

Frontend hiện được cấu hình để gọi backend tại:

```txt
http://localhost:8080
```

Base API đang dùng trong code:

```txt
http://localhost:8080/api/v1
```

Tài khoản mẫu từ plan:

```txt
hoa1312004@gmail.com / Aa123456
```

## Chức năng hiện có

- Đăng nhập, đăng xuất, tự refresh token khi gặp `401`
- Parse role và permissions từ JWT `authorities`
- Sidebar và route ẩn/hiện theo permission
- Dashboard tổng quan bản đầu
- Danh sách bệnh án có tìm kiếm, lọc, phân trang
- Upload bệnh án ảnh/PDF để gọi OCR
- Trang chi tiết bệnh án:
  - xem ảnh gốc
  - xem thông tin bệnh nhân
  - xem dữ liệu OCR
  - sửa field OCR inline
  - submit / approve / reject / delete theo role
- Danh sách bệnh nhân
- Tra cứu bệnh nhân theo BHYT
- Quản lý tài khoản bản đầu cho admin

## Trạng thái hiện tại

Đây là bản triển khai đầu tiên đã build được và có khung chức năng chính. Một số phần vẫn đang ở mức v1:

- mobile sidebar/responsive chưa hoàn chỉnh
- loading skeleton/error boundary chưa đồng bộ toàn app
- chưa test end-to-end đầy đủ với mọi role
- bundle hiện còn khá lớn do dùng nhiều thành phần `antd`

Chi tiết tiến độ xem trong [docs/FRONTEND_PLAN.md](docs/FRONTEND_PLAN.md).

## Cài đặt

```bash
npm install
```

## Chạy môi trường dev

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Preview bản build

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Cấu trúc thư mục

```txt
src/
  api/          API modules và axios client
  components/   shared UI components
  config/       env/config hằng số
  hooks/        custom hooks
  layouts/      layout chính của app
  lib/          utility helpers
  pages/        các page theo domain
  router/       route config và guards
  store/        Zustand stores
  types/        TypeScript domain types
```

## Kiến trúc chính

### Auth

- Access token được gắn vào request bằng Axios interceptor
- Nếu request trả `401`, app tự gọi refresh token
- Role và permissions được parse từ JWT rồi lưu vào Zustand persist

Các file liên quan:

- [src/api/axios.ts](src/api/axios.ts)
- [src/store/auth.store.ts](src/store/auth.store.ts)
- [src/router/PrivateRoute.tsx](src/router/PrivateRoute.tsx)
- [src/router/PermissionRoute.tsx](src/router/PermissionRoute.tsx)

### Routing

Các route chính hiện có:

- `/login`
- `/dashboard`
- `/medical-records`
- `/medical-records/upload`
- `/medical-records/:id`
- `/patients`
- `/patients/search`
- `/accounts`

Config route nằm tại:

- [src/router/index.tsx](src/router/index.tsx)

### UI

UI hiện dùng:

- layout custom với sidebar riêng thay vì `Sider` mặc định
- Ant Design cho form/table/modal
- Tailwind cho layout, spacing, trạng thái và style hệ thống

Các file chính:

- [src/layouts/MainLayout.tsx](src/layouts/MainLayout.tsx)
- [src/layouts/Header.tsx](src/layouts/Header.tsx)
- [src/index.css](src/index.css)

## Lưu ý cho lần làm tiếp theo

Nếu tiếp tục phát triển project này, nên đọc theo thứ tự:

1. [docs/FRONTEND_PLAN.md](docs/FRONTEND_PLAN.md)
2. `README.md`
3. `src/router/index.tsx`
4. `src/store/auth.store.ts`
5. các page trong `src/pages/`

Ưu tiên việc tiếp theo:

1. test thật với backend cho cả `employee`, `doctor`, `admin`
2. sửa mismatch payload nếu backend trả khác plan
3. hoàn thiện responsive/mobile navigation
4. tối ưu `MedicalRecordDetailPage` và `AccountListPage`
5. thêm loading/error states đồng bộ
