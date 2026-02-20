diff --git a//home/mak/food_link_api/SellerRegRequest.md b//home/mak/food_link_api/SellerRegRequest.md
new file mode 100644
--- /dev/null
+++ b//home/mak/food_link_api/SellerRegRequest.md
@@ -0,0 +1,126 @@
+# Seller Registration Request API (for Frontend)
+
+## Auth
+All endpoints below require `Authorization: Bearer <access_token>`.
+
+---
+
+## 1) Bind Email (for users registered by phone)
+If user has no email, seller request create/update is blocked.
+
+### Endpoint
+`POST /auth/bind-email`
+
+### Request body
+```json
+{
+  "email": "user@example.com"
+}
+```
+
+### Success response
+```json
+{
+  "data": {
+    "message": "Email bound successfully",
+    "user_id": 123,
+    "email": "user@example.com"
+  }
+}
+```
+
+### Errors
+- `400`: user already has email
+- `400`: email already used by another user
+- `401`: invalid/expired token
+
+---
+
+## 2) Seller Registration Request (user draft/application)
+User can have only one request.
+
+### 2.1 Create request
+`POST /sellers/registration-request`
+
+### 2.2 Get my request
+`GET /sellers/registration-request`
+
+### 2.3 Update my request
+`PUT /sellers/registration-request`
+
+### 2.4 Delete my request
+`DELETE /sellers/registration-request`
+
+---
+
+## Request payload (create/update)
+```json
+{
+  "full_name": "ООО Ромашка",
+  "short_name": "Ромашка",
+  "description": "Описание",
+  "inn": "7701234567",
+  "is_IP": false,
+  "ogrn": "1027700132195",
+  "terms_accepted": true
+}
+```
+
+All fields are optional (nullable), except `terms_accepted` defaults to `false` if omitted.
+
+---
+
+## Response model (GET/POST/PUT)
+```json
+{
+  "data": {
+    "id": 1,
+    "user_id": 123,
+    "full_name": "ООО Ромашка",
+    "short_name": "Ромашка",
+    "description": "Описание",
+    "inn": "7701234567",
+    "is_IP": false,
+    "ogrn": "1027700132195",
+    "status": "pending",
+    "terms_accepted": true,
+    "created_at": "2026-02-20T10:00:00+00:00",
+    "updated_at": "2026-02-20T10:05:00+00:00"
+  }
+}
+```
+
+`status` values:
+- `pending`
+- `rejected`
+- `approved`
+
+---
+
+## Business rules / errors
+- `400`: user already is seller (`is_seller = true`)
+- `400`: user has no email (for create/update)
+- `400`: user already has registration request (for create)
+- `404`: registration request not found (for get/update/delete)
+
+---
+
+## System messages in Master Chat
+### On create/update
+If request becomes fully filled and `terms_accepted = true`, system sends:
+
+`Ваша заявка на регистрацию продавца получена. Пожалуйста подождите пока мы проверим ее. Любые интересующие вас вопросы Вы можете задать в этом чате.`
+
+### On admin approval
+When admin approves request and creates seller:
+
+`Ваша заявка на регистрацию продавца была одобрена.`
+
+---
+
+## Recommended frontend flow
+1. If user has no email, call `POST /auth/bind-email`.
+2. Create request via `POST /sellers/registration-request`.
+3. Save edits via `PUT /sellers/registration-request`.
+4. Poll/get status via `GET /sellers/registration-request`.
+5. Show chat/system updates in support chat UI.
