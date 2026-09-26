# Charlie Quizlet — Frontend

Ứng dụng học tập / thi trắc nghiệm kiểu Quizlet (Angular 22 zoneless, Tailwind CSS v4, Jest).
Backend là repo riêng: [`charlie-quizlet-be`](../charlie-quizlet-be) (Spring Boot + PostgreSQL). Quy tắc và hướng dẫn phía BE nằm trong `CQ_CODING_RULES.md` / `CQ_DEV_GUIDE.md` của repo đó.

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [CQ_SPEC.md](CQ_SPEC.md) | Luồng nghiệp vụ, cấu trúc thư mục, trạng thái hiện tại |
| [CQ_DEV_GUIDE.md](CQ_DEV_GUIDE.md) | Hướng dẫn kèm code mẫu: cấu hình, gọi API, xử lý lỗi, dialog, toast, loading, form, i18n, style, thêm trang mới |
| [CQ_CODING_RULES.md](CQ_CODING_RULES.md) | Quy định bắt buộc khi viết code |
| [CQ_LEARNING_PLAN.md](CQ_LEARNING_PLAN.md) | Lộ trình theo giai đoạn |

## Yêu cầu

- Node.js 22 hoặc 24 (qua `nvm`), dùng Angular CLI cài local (`npx ng ...`).
- Backend chạy ở `http://localhost:8080` (xem README của `charlie-quizlet-be`).

## Chạy

```bash
npm install
npm start                                  # http://localhost:4200
npx ng build --configuration development   # build dev
npm run build                              # build production
npm test                                   # unit test (Jest)
```

- URL API theo môi trường: `src/environments/` (dev `http://localhost:8080/api`, production `/api` qua reverse proxy).
- Trang xem UI kit (dev only): bỏ comment route `ui-showcase` trong `src/app/app.routes.ts`, mở `/ui-showcase`.
- Thêm file CSS mới vào `src/styles/` mà trình duyệt chưa nhận: khởi động lại `npm start`.
