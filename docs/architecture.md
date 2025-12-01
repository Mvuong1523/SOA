# System Architecture

## Overview
- Hệ thống Đặt Hàng là một hệ thống microservices được thiết kế nhằm hỗ trợ khách hàng lựa chọn sản phẩm và thực hiện quá trình đặt hàng thông qua giao diện web. Hệ thống tiếp nhận thông tin khách hàng và sản phẩm, kiểm tra yêu cầu đặt hàng, và xác minh số lượng tồn kho trước khi xử lý đơn hàng. Nếu số lượng tồn kho đáp ứng đủ, hệ thống sẽ lưu trữ đơn hàng, cập nhật tồn kho, và gửi email xác nhận đến khách hàng. Trong trường hợp số lượng không đủ, quá trình đặt hàng sẽ bị dừng lại. Mục tiêu chính của hệ thống là đảm bảo tính tách biệt, tái sử dụng, và khả năng mở rộng linh hoạt giữa các dịch vụ, đồng thời mang lại trải nghiệm người dùng hiệu quả và an toàn. Hệ thống được triển khai dựa trên kiến trúc hướng dịch vụ (SOA) và sử dụng Docker để thuận tiện trong việc triển khai, quản lý và mở rộng.
- Các thành phần chính bao gồm các microservices xử lý từng chức năng cụ thể, giao tiếp qua API Gateway , và lưu trữ dữ liệu trong cơ sở dữ liệu MySQL. Hệ thống cũng tích hợp xác thực JWT để bảo mật và các công cụ giám sát như Prometheus/Grafana (tùy chọn) để theo dõi hiệu suất.

## System Components

- **Make-Order-Service (Task Service)**:  
  Dịch vụ này khởi động quy trình đặt hàng thông qua endpoint `POST /ordering`. Nó gọi các dịch vụ khác (Auth-Service, User-Service, Product-Service, Oder-Service, Cart-Service) để xác thực và xử lý yêu cầu, sau đó gửi thông báo kết quả qua Notification-Service.
- **Auth-Service (Microservice)**:  
  Dịch vụ này tập trung hóa logic xác thực token JWT thông qua endpoint `GET /validate-token`. Các dịch vụ khác gọi Auth-Service để kiểm tra tính hợp lệ của token trước khi thực hiện các thao tác.
- **User-Service (Entity Service)**:  
  Quản lý thông tin khách hàng và xác thực thông tin khách hàng. Cung cấp hai endpoint: `POST /login` để khách hàng đăng nhập và nhận JWT token, và `GET /customer/{customer_id}` để lấy thông tin chi tiết về khách hàng.
- **Product-Service (Entity Service)**:  
  Quản lý thông tin sản phẩm, kiểm tra tồn kho sản phẩm, cập nhập tồn kho khi đặt hàng thành công. Cung cấp 2 endpoint : `GET/product/{product_id}` để lấy thông tin sản phẩm và `POST/product/{product_id}` để cập nhật tồn kho
- **Cart-Service (Entity Service)**:  
  Lấy thông tin giỏi hàng , và cập nhật giỏ hàng sau khi đặt hàng thành công. Cung cấp 2 endpoint `GET /cart/{customerId}`  để Lấy thông tin giỏ hàng và  `PUT /cart/{customerId})` để Cập nhập giỏ hàng
- **Order-service(Entity Service)**:
  Tạo đơn hàng khi thông tin hợp lệ thông qua endpoint `POST /order`
- **Notification-Service (Utility Service)**:  
  Gửi thông báo đến khách hàng thông qua endpoint `POST /notification`, ví dụ: thông báo đặt hàng thành công.
- **API Gateway (Nginx)**:  
  Đóng vai trò là điểm truy cập duy nhất cho frontend, định tuyến các yêu cầu đến các dịch vụ phù hợp dựa trên đường dẫn URL (ví dụ: `/ordering` → Make-Oder-Service, `/validate-token` → Auth-Service). API Gateway cũng hỗ trợ các tính năng như ghi log và giám sát (Prometheus/Grafana).
- **Frontend (React)**:  
  Giao diện web được xây dựng bằng React và boostrap , tương tác với API Gateway để hiển thị danh sách sản phẩm, thực hiện đặt hàng, và hiển thị thông báo.

- **Database (MySQL)**:  
  Lưu trữ thông tin về khách hàng (`users`), Sản phẩm (`product`), và lịch sử mua hàng (`ordering`).

## Communication
- **Giao tiếp giữa các dịch vụ**: 
  Tất cả các dịch vụ giao tiếp với nhau thông qua **RESTful APIs**, sử dụng HTTP với định dạng JSON. Các yêu cầu được gửi qua API Gateway, đảm bảo tính nhất quán và bảo mật. Ví dụ:
  - Order-Service gọi Auth-Service (`GET /validate-token`) để xác thực token.
  - Order-Service gọi User-Service (`GET /customer/{customer_id}`) để lấy thông tin khách hàng.
  - Order-Service gọi Product-Service (`GET /product/{product_id}`) lấy thông tin sản phẩm.
- **Mạng nội bộ**:  
    Hệ thống sử dụng Docker Compose để triển khai các dịch vụ. Các dịch vụ giao tiếp với nhau bằng tên dịch vụ trong mạng Docker (ví dụ: `http://auth-service:8000`, `http://postgres:5432`). API Gateway (Nginx) định tuyến các yêu cầu từ frontend đến các dịch vụ dựa trên cấu hình trong `nginx.conf`.    
- **Xác thực**:  
    JWT (JSON Web Tokens) được sử dụng để xác thực. Frontend gửi token trong header `Authorization: Bearer <token>` cho mỗi yêu cầu. Make-Order-Service gọi Auth-Service để xác thực token trước khi xử lý yêu cầu.
    
## Data Flow
 - **Luồng đăng nhập**:
  1. Frontend gửi `POST /login` đến API Gateway với thông tin đăng nhập (username/password).
  2. API Gateway định tuyến đến User-Service.
  3. User-Service kiểm tra thông tin trong MySQL, tạo JWT token, và trả về cho frontend.
  4. Frontend lưu token để sử dụng cho các yêu cầu sau.

- **Luồng đặt hàng**:
  1. Frontend gửi `POST /ordering` đến API Gateway với JWT token, `customer_id`, `product_id`, `cart_id`, và `action` (Đặt hàng).
  2. API Gateway định tuyến đến Make-Order-Service.
  3. Make-Order-Service gọi Auth-Service (`GET /validate-token`) qua API Gateway để xác thực token.
  4. Auth-Service trả về `customer_id` nếu token hợp lệ.
  5. Make-Order-Service gọi User-Service (`GET /customer/{customer_id}`) để xác minh khách hàng.
  6. Make-Order-Service gọi Cart-Service (`Get/customer_id`) để lấy thông tin sản phẩm trong giỏ hàng của khách hàng.
  7. Make-Order-Service gọi Product-Service (`GET /product/{product_id}`) để kiểm tra trạng thái sản phẩm có còn trong kho không.
  8. Nếu thông tin hợp lệ, Make-Order-Service gọi Order-Service (`POST /ordering` hoặc `POST /return`) để thực hiện giao dịch.
  9. Order-Service cập nhật trạng thái sản phẩm trong MySQL.
  10. Make-Order-Service gọi Notification-Service (`POST /notification`) để gửi thông báo.
  11. Kết quả được trả về cho frontend qua API Gateway.

- **Phụ thuộc bên ngoài**:  
  - **MySQL**: Lưu trữ dữ liệu của User-Service, Product-Service, và Order-Service, Cart-Service.
  - Không có phụ thuộc bên ngoài khác (ví dụ: API bên thứ ba).

## Diagram
Hình minh họa kiến trúc hệ thống được lưu tại `docs/assets/architecture.png`:

![](assets/architecture.png)

Hình minh họa Cơ sở dữ liệu hệ thống được lưu tại `docs/assets/CSDL.png`:
![](assets/CSDL.png)

## Scalability & Fault Tolerance
- **Khả năng mở rộng**:
  - Mỗi dịch vụ được triển khai trong container Docker riêng, cho phép mở rộng độc lập. Ví dụ, nếu Make-Order-Service chịu tải cao, có thể tăng số lượng instance bằng cách điều chỉnh Docker Compose hoặc sử dụng một orchestrator như Kubernetes.
  - API Gateway (Nginx) hỗ trợ cân bằng tải, phân phối yêu cầu đến các instance của dịch vụ.
  -MySQL có thể được mở rộng bằng cách sử dụng các kỹ thuật như replication (read replicas) để tăng hiệu suất đọc.

- **Khả năng chịu lỗi**:
  - Hệ thống microservices đảm bảo rằng sự cố ở một dịch vụ (ví dụ: Notification-Service) không ảnh hưởng đến các dịch vụ khác
  - Docker Compose tự động khởi động lại các container nếu chúng gặp sự cố.
  - API Gateway có thể được cấu hình để thử lại (retry) hoặc chuyển hướng yêu cầu nếu một dịch vụ không phản hồi.
  - Dữ liệu trong MySQL được bảo vệ thông qua các cơ chế sao lưu và khôi phục.