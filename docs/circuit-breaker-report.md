# BÁO CÁO TÌM HIỂU
# CIRCUIT BREAKER PATTERN TRONG KIẾN TRÚC MICROSERVICES

---

**Họ và tên:** Lê Minh Vương

**Mã sinh viên:** B21DCCN802

**Môn học:** Phát Triển Phần Mềm Hướng Dịch Vụ

---

## MỤC LỤC

1. Giới Thiệu
2. Vấn Đề Partial Failure trong Hệ Thống Phân Tán
3. Circuit Breaker Pattern
4. Triển Khai Circuit Breaker
5. Chiến Lược Phục Hồi từ Service Không Khả Dụng
6. Kết Luận
7. Tài Liệu Tham Khảo

---


## 1. GIỚI THIỆU

Trong kiến trúc microservices, các dịch vụ (services) giao tiếp với nhau thông qua mạng để thực hiện các chức năng nghiệp vụ. Một trong những thách thức lớn nhất của hệ thống phân tán là xử lý các tình huống lỗi một phần (partial failure), khi một hoặc một số dịch vụ trong hệ thống không thể phản hồi kịp thời hoặc hoàn toàn không khả dụng.

Khi một service thực hiện synchronous request (yêu cầu đồng bộ) đến một service khác, luôn tồn tại rủi ro về partial failure. Service có thể không phản hồi kịp thời vì nhiều lý do: service đang bị lỗi, đang được bảo trì, hoặc đang quá tải và phản hồi cực kỳ chậm. Vấn đề trở nên nghiêm trọng hơn khi client bị block (chặn) trong khi chờ phản hồi, dẫn đến nguy cơ lỗi lan truyền (cascading failure) đến các client khác và gây ra sự cố toàn hệ thống.

Circuit Breaker pattern là một giải pháp thiết kế quan trọng để xử lý vấn đề này. Pattern này hoạt động như một "cầu dao tự động" trong hệ thống điện, ngắt kết nối khi phát hiện lỗi vượt ngưỡng, ngăn chặn các yêu cầu tiếp tục được gửi đến service không khả dụng, và cho phép hệ thống phục hồi một cách an toàn.

Báo cáo này sẽ phân tích chi tiết về Circuit Breaker pattern, bao gồm vấn đề mà nó giải quyết, cơ chế hoạt động, cách triển khai, và các chiến lược phục hồi trong kiến trúc microservices.


## 2. VẤN ĐÈ PARTIAL FAILURE TRONG HỆ THỐNG PHÂN TÁN

### 2.1. Bản Chất của Partial Failure

Trong hệ thống phân tán, partial failure xảy ra khi một phần của hệ thống gặp sự cố trong khi các phần khác vẫn hoạt động bình thường. Vì client và service là các process riêng biệt, service có thể không phản hồi kịp thời cho yêu cầu của client. Các nguyên nhân phổ biến bao gồm:

- **Service bị lỗi hoặc đang bảo trì:** Service tạm thời không khả dụng
- **Service quá tải:** Service phản hồi cực kỳ chậm do số lượng request vượt quá khả năng xử lý
- **Vấn đề mạng:** Timeout, packet loss, hoặc latency cao

### 2.2. Cơ Chế Cascading Failure

Nguy hiểm lớn nhất của partial failure là khả năng lan truyền lỗi (cascading failure) trong toàn bộ hệ thống. Khi client bị block chờ phản hồi từ service không khả dụng, nó tiêu tốn các tài nguyên quý giá như threads. Nếu nhiều request cùng bị block, client sẽ cạn kiệt tài nguyên và không thể xử lý các request mới, dẫn đến việc client cũng trở nên không khả dụng. Lỗi này tiếp tục lan truyền đến các client của client, tạo ra hiệu ứng domino gây sự cố toàn hệ thống.

### 2.3. Kịch Bản Thực Tế: API Gateway và Order Service

Hình 3.2 minh họa một kịch bản điển hình của partial failure trong kiến trúc microservices:


```
┌─────────────┐                    ┌──────────────────────────────┐
│             │   POST /orders     │                              │
│  Mobile App │───────────────────>│       API Gateway            │
│             │                    │                              │
└─────────────┘                    │  ┌────────────────────────┐  │
                                   │  │  Order Service Proxy   │  │
                                   │  │  (Create order         │  │
                                   │  │   endpoint)            │  │
                                   │  └────────────────────────┘  │
                                   └──────────────┬───────────────┘
                                                  │ POST /orders
                                                  │
                                                  v
                                   ┌──────────────────────────────┐
                                   │      Order Service           │
                                   │   (Unresponsive remote       │
                                   │        service)              │
                                   └──────────────────────────────┘

Figure 3.2: An API gateway must protect itself from unresponsive services, 
such as the Order Service.
```

**Phân tích kịch bản:**

1. **Mobile client** gửi REST request đến **API Gateway**, điểm vào chính của ứng dụng cho các API client
2. **API Gateway** proxy request đến **Order Service** thông qua **OrderServiceProxy**
3. **Order Service** không phản hồi (unresponsive)

**Hậu quả của implementation ngây thơ:**

Một implementation ngây thơ của OrderServiceProxy sẽ block vô thời hạn, chờ đợi phản hồi. Điều này dẫn đến:

- **Trải nghiệm người dùng kém:** User phải chờ đợi lâu mà không nhận được phản hồi
- **Tiêu tốn tài nguyên:** Mỗi request bị block chiếm giữ một thread hoặc tài nguyên tương tự
- **Cạn kiệt tài nguyên:** API Gateway dần hết tài nguyên và không thể xử lý request mới
- **Toàn bộ API không khả dụng:** Hệ thống bị sự cố hoàn toàn

### 2.4. Giải Pháp Hai Phần

Để ngăn chặn partial failure lan truyền trong ứng dụng, cần thiết kế hệ thống với hai phần giải pháp:

1. **Thiết kế RPI proxies mạnh mẽ:** Các proxy như OrderServiceProxy phải được thiết kế để xử lý các remote service không phản hồi
2. **Quyết định cách phục hồi:** Xác định chiến lược phục hồi phù hợp khi remote service bị lỗi


## 3. CIRCUIT BREAKER PATTERN

### 3.1. Định Nghĩa Pattern

**Circuit Breaker** là một RPI (Remote Procedure Invocation) proxy có khả năng từ chối ngay lập tức các lời gọi trong một khoảng thời gian timeout sau khi số lượng lỗi liên tiếp vượt quá ngưỡng được chỉ định.

Pattern này hoạt động tương tự như cầu dao tự động trong hệ thống điện: khi phát hiện quá tải hoặc lỗi, nó "ngắt mạch" để bảo vệ hệ thống, sau đó tự động thử kết nối lại sau một khoảng thời gian.

### 3.2. Ba Cơ Chế Bảo Vệ Cốt Lõi

Theo cách tiếp cận được mô tả bởi Netflix, một robust RPI proxy cần kết hợp ba cơ chế sau:

#### 3.2.1. Network Timeouts

**Nguyên tắc:** Không bao giờ block vô thời hạn, luôn sử dụng timeout khi chờ phản hồi.

**Mục đích:** Đảm bảo tài nguyên không bị chiếm giữ vô thời hạn. Khi một request không nhận được phản hồi trong khoảng thời gian quy định, nó sẽ fail ngay lập tức thay vì chờ đợi mãi mãi.

**Cơ chế hoạt động:**
- Đặt timeout threshold cho mỗi request (ví dụ: 2 giây, 5 giây)
- Nếu không nhận được phản hồi trong thời gian này, request bị hủy
- Tài nguyên (thread, connection) được giải phóng ngay lập tức

#### 3.2.2. Limiting Outstanding Requests

**Nguyên tắc:** Áp đặt giới hạn trên cho số lượng request đang chờ xử lý mà client có thể gửi đến một service cụ thể.

**Mục đích:** Ngăn chặn việc tích tụ quá nhiều request đang chờ, bảo vệ tài nguyên của client.

**Cơ chế hoạt động:**
- Đặt giới hạn số request đồng thời (ví dụ: tối đa 100 concurrent requests)
- Khi đạt giới hạn, các request mới fail ngay lập tức
- Lý do: Nếu đã có nhiều request đang chờ, việc gửi thêm request là vô ích và chỉ làm tình hình tồi tệ hơn

#### 3.2.3. Circuit Breaker State Machine

**Nguyên tắc:** Theo dõi số lượng request thành công và thất bại, nếu tỷ lệ lỗi vượt quá ngưỡng, "trip" circuit breaker để các request tiếp theo fail ngay lập tức.

**Mục đích:** Ngăn chặn việc gửi request đến service rõ ràng không khả dụng, cho phép service có thời gian phục hồi.

### 3.3. Ba Trạng Thái của Circuit Breaker

Circuit Breaker hoạt động như một state machine với ba trạng thái:

#### **CLOSED (Đóng - Trạng thái bình thường)**
- Request được phép đi qua bình thường
- Circuit breaker theo dõi số lượng lỗi
- Nếu số lỗi liên tiếp vượt quá threshold → chuyển sang OPEN

#### **OPEN (Mở - Trạng thái bảo vệ)**
- Tất cả request bị từ chối ngay lập tức mà không gọi đến service
- Không lãng phí tài nguyên cho service không khả dụng
- Sau một khoảng timeout period → chuyển sang HALF-OPEN

#### **HALF-OPEN (Nửa mở - Trạng thái thử nghiệm)**
- Cho phép một số request thử nghiệm đi qua
- Nếu request thành công → chuyển về CLOSED (service đã phục hồi)
- Nếu request thất bại → quay lại OPEN (service vẫn chưa sẵn sàng)

### 3.4. Luồng Hoạt Động

```
                    ┌──────────────────────────────────┐
                    │                                  │
                    │         CLOSED                   │
                    │   (Normal operation)             │
                    │   - Requests pass through        │
                    │   - Track failures               │
                    │                                  │
                    └──────────┬───────────────────────┘
                               │
                               │ Failures exceed threshold
                               │
                               v
                    ┌──────────────────────────────────┐
                    │                                  │
                    │          OPEN                    │
                    │   (Protection mode)              │
                    │   - Reject all requests          │
                    │   - Wait for timeout             │
                    │                                  │
                    └──────────┬───────────────────────┘
                               │
                               │ Timeout expires
                               │
                               v
                    ┌──────────────────────────────────┐
                    │                                  │
                    │       HALF-OPEN                  │
                    │   (Testing mode)                 │
                    │   - Allow test requests          │
                    │                                  │
                    └──────┬───────────────────┬───────┘
                           │                   │
                  Success  │                   │ Failure
                           │                   │
                           v                   v
                       CLOSED                OPEN
```

### 3.5. Cấu Hình Threshold và Timeout

**Failure Threshold:** Số lượng lỗi liên tiếp hoặc tỷ lệ lỗi để trip circuit breaker
- Ví dụ: 5 lỗi liên tiếp, hoặc 50% request lỗi trong 10 giây

**Timeout Period:** Thời gian circuit breaker ở trạng thái OPEN trước khi chuyển sang HALF-OPEN
- Ví dụ: 30 giây, 60 giây
- Cho phép service có thời gian phục hồi

**Request Timeout:** Thời gian tối đa chờ phản hồi từ service
- Ví dụ: 2 giây, 5 giây

Việc cấu hình các tham số này phụ thuộc vào đặc điểm của từng service và yêu cầu nghiệp vụ cụ thể.


## 4. TRIỂN KHAI CIRCUIT BREAKER

### 4.1. Netflix Hystrix Library

Netflix Hystrix là một thư viện mã nguồn mở triển khai Circuit Breaker pattern và các pattern liên quan. Nếu đang sử dụng JVM, nên cân nhắc sử dụng Hystrix khi triển khai RPI proxies.

### 4.2. Alternative Libraries

Nếu không sử dụng JVM, cần sử dụng thư viện tương đương. Ví dụ, thư viện Polly phổ biến trong cộng đồng .NET.


## 5. CHIẾN LƯỢC PHỤC HỒI TỪ SERVICE KHÔNG KHẢ DỤ

### 5.1. Tầm Quan Trọng của Recovery Strategy

Sử dụng thư viện như Hystrix chỉ là một phần của giải pháp. Phần quan trọng không kém là quyết định cách service phục hồi từ một remote service không phản hồi. Chiến lược phục hồi phải được xem xét từng trường hợp cụ thể (case-by-case basis) dựa trên tầm quan trọng của dữ liệu và yêu cầu nghiệp vụ.

### 5.2. Chiến Lược 1: Error Propagation

**Mô tả:** Service đơn giản trả về lỗi cho client của nó.

**Khi nào áp dụng:** Khi dữ liệu từ remote service là bắt buộc (essential) và không thể thay thế.

**Ví dụ từ Figure 3.2:**
Trong kịch bản tạo Order, khi request POST /orders từ mobile app đến API Gateway, và Order Service không khả dụng:
- API Gateway không thể tạo order mà không có Order Service
- Lựa chọn duy nhất là trả về lỗi cho mobile client
- Client có thể hiển thị thông báo lỗi và yêu cầu user thử lại sau

**Ưu điểm:**
- Đơn giản, dễ triển khai
- Không tạo ra dữ liệu không chính xác
- User nhận biết rõ ràng có vấn đề

**Nhược điểm:**
- Trải nghiệm người dùng kém
- Chức năng hoàn toàn không khả dụng

### 5.3. Chiến Lược 2: Fallback Values

**Mô tả:** Trả về giá trị dự phòng (fallback value) như giá trị mặc định hoặc cached response.

**Khi nào áp dụng:** Khi dữ liệu từ remote service không phải là critical, và có thể chấp nhận dữ liệu cũ hoặc mặc định.

#### 5.3.1. Default Values
- Trả về giá trị mặc định an toàn
- Ví dụ: Empty list, default configuration, placeholder data

#### 5.3.2. Cached Responses
- Sử dụng dữ liệu đã cache từ request trước đó
- Phù hợp cho dữ liệu ít thay đổi
- Cần có cache invalidation strategy

### 5.4. Kịch Bản API Composition: Phân Biệt Dữ Liệu Essential và Non-Essential

Figure 3.3 minh họa một kịch bản phức tạp hơn với API composition pattern, nơi API Gateway cần gọi nhiều services và kết hợp kết quả:

```
┌─────────────┐                    ┌──────────────────────────────────────────┐
│             │  GET /orders/xyz   │                                          │
│  Mobile App │───────────────────>│          API Gateway                     │
│             │                    │                                          │
└─────────────┘                    │      ┌─────────────────────────┐         │
                                   │      │  Get order endpoint     │         │
                                   │      │                         │         │
                                   │      │  How to handle each     │         │
                                   │      │  unresponsive service?  │         │
                                   │      └─────────────────────────┘         │
                                   │                                          │
                                   │   ┌──────────────┐  ┌──────────────┐    │
                                   │   │Order Service │  │Kitchen Service│   │
                                   │   │    proxy     │  │    proxy      │   │
                                   │   └──────┬───────┘  └──────┬────────┘   │
                                   │          │                 │            │
                                   │   ┌──────────────┐  ┌──────────────┐    │
                                   │   │Delivery      │  │   ...        │    │
                                   │   │Service proxy │  │   Service    │    │
                                   │   └──────┬───────┘  │   proxy      │    │
                                   └──────────┼──────────┴──────┬────────────┘
                                              │                 │
                                              v                 v
                        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                        │    Order     │  │   Kitchen    │  │   Delivery   │
                        │   Service    │  │   Service    │  │   Service    │
                        │              │  │              │  │              │
                        │(Unresponsive │  │              │  │              │
                        │  service)    │  │              │  │              │
                        └──────────────┘  └──────────────┘  └──────────────┘

Figure 3.3: The API gateway implements the GET /orders/{orderId} endpoint 
using API composition. It calls several services, aggregates their responses, 
and sends a response to the mobile app. The code that implements the endpoint 
must have a strategy for handling the failure of each service that it calls.
```

**Phân tích kịch bản:**

API Gateway triển khai endpoint GET /orders/{orderId} bằng cách:
1. Gọi Order Service để lấy thông tin order
2. Gọi Kitchen Service để lấy thông tin ticket
3. Gọi Delivery Service để lấy thông tin delivery
4. Kết hợp (aggregate) các response và gửi về mobile app

### 5.5. Đánh Giá Mức Độ Quan Trọng của Dữ Liệu

Không phải tất cả dữ liệu từ các service đều quan trọng như nhau. Cần phân loại:

#### **Essential Data (Dữ liệu thiết yếu)**

**Order Service data:**
- Là dữ liệu cốt lõi, không thể thiếu
- Không có order data thì không thể hiển thị thông tin có ý nghĩa

**Recovery strategy:**
- Nếu Order Service không khả dụng → trả về cached version của dữ liệu
- Nếu không có cache → trả về error
- Không thể bỏ qua dữ liệu này

#### **Non-Essential Data (Dữ liệu không thiết yếu)**

**Kitchen Service và Delivery Service data:**
- Là dữ liệu bổ sung, hữu ích nhưng không bắt buộc
- Client vẫn có thể hiển thị thông tin hữu ích cho user ngay cả khi thiếu delivery status

**Recovery strategy:**
- Nếu Delivery Service không khả dụng → trả về cached version
- Nếu không có cache → bỏ qua (omit) dữ liệu này khỏi response
- Client vẫn nhận được order information và có thể hiển thị cho user

### 5.6. Decision Matrix cho Recovery Strategy

| Service Status | Data Criticality | Recovery Strategy |
|---------------|------------------|-------------------|
| Order Service unavailable | Essential | Return cached data OR return error |
| Kitchen Service unavailable | Non-essential | Return cached data OR omit from response |
| Delivery Service unavailable | Non-essential | Return cached data OR omit from response |

### 5.7. Graceful Degradation

Khái niệm graceful degradation là cho phép hệ thống tiếp tục hoạt động với chức năng giảm (degraded functionality) thay vì hoàn toàn không khả dụng:

- **Full functionality:** Tất cả services khả dụng, response đầy đủ
- **Degraded functionality:** Một số services không khả dụng, response thiếu một số thông tin không thiết yếu
- **Minimal functionality:** Chỉ essential services khả dụng, response chỉ có thông tin cơ bản
- **No functionality:** Essential services không khả dụng, trả về error

Cách tiếp cận này cải thiện đáng kể trải nghiệm người dùng và availability của hệ thống.


## 6. KẾT LUẬN

Circuit Breaker pattern là một giải pháp thiết kế quan trọng và cần thiết trong kiến trúc microservices để xử lý vấn đề partial failure. Pattern này đóng vai trò như một cơ chế bảo vệ, ngăn chặn lỗi lan truyền (cascading failure) và giúp hệ thống phục hồi một cách graceful.

### 6.1. Những Điểm Chính

**Vấn đề cốt lõi:** Trong hệ thống phân tán, partial failure là không thể tránh khỏi. Nếu không được xử lý đúng cách, một service không khả dụng có thể gây sự cố toàn bộ hệ thống thông qua cascading failure.

**Giải pháp ba lớp:** Circuit Breaker pattern kết hợp ba cơ chế bảo vệ:
1. Network timeouts để tránh block vô thời hạn
2. Request limiting để bảo vệ tài nguyên
3. Circuit breaker state machine để ngăn chặn request đến service không khả dụng

**State machine:** Circuit breaker hoạt động qua ba trạng thái (CLOSED, OPEN, HALF-OPEN), tự động phát hiện lỗi, bảo vệ hệ thống, và thử phục hồi kết nối.

**Implementation:** Các thư viện như Netflix Hystrix (JVM) và Polly (.NET) cung cấp implementation sẵn có, đã được kiểm chứng trong production với traffic cao.

**Recovery strategies:** Không có một chiến lược phục hồi nào phù hợp cho tất cả trường hợp. Cần đánh giá từng service dựa trên mức độ quan trọng của dữ liệu:
- Essential data: Sử dụng cache hoặc trả về error
- Non-essential data: Sử dụng cache hoặc omit khỏi response

### 6.2. Lợi Ích của Circuit Breaker Pattern

1. **Ngăn chặn cascading failure:** Cách ly lỗi, không để lan truyền
2. **Bảo vệ tài nguyên:** Tránh lãng phí tài nguyên cho service không khả dụng
3. **Cải thiện user experience:** Fail fast thay vì để user chờ đợi lâu
4. **Tự động phục hồi:** Tự động thử kết nối lại khi service phục hồi
5. **Graceful degradation:** Hệ thống tiếp tục hoạt động với chức năng giảm



## 7. TÀI LIỆU THAM KHẢO

**Microservices Patterns: With examples in Java**

