# Session 上传测试指南

## 目的

在真正连接蓝牙设备前，用假数据验证整条数据链路是否正常工作。

## 前置条件

1. ✅ 数据库已启动（Docker Compose）
2. ✅ 已运行 `npx prisma db push` 创建 `DeviceData` 表
3. ✅ 后端服务正在运行（`npm run dev`）
4. ✅ 数据库中已有设备和场馆（Device 和 Clinic）

## 方法 1: 使用 PowerShell 脚本（Windows）

```powershell
cd ai-trainer-backend
.\scripts\test-session-upload.ps1
```

## 方法 2: 使用 Bash 脚本（Linux/Mac）

```bash
cd ai-trainer-backend
chmod +x scripts/test-session-upload.sh
./scripts/test-session-upload.sh
```

## 方法 3: 使用 curl（手动）

```bash
# 生成一条假数据
curl -X POST http://localhost:6001/api/session \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "VP-2025-000001",
    "startedAt": 1704067200000,
    "endedAt": 1704067800000,
    "samples": [
      {"t": 1704067200000, "hz": 30.5},
      {"t": 1704067260000, "hz": 31.2},
      {"t": 1704067320000, "hz": 29.8},
      {"t": 1704067380000, "hz": 32.1},
      {"t": 1704067440000, "hz": 30.9},
      {"t": 1704067500000, "hz": 31.5},
      {"t": 1704067560000, "hz": 30.2},
      {"t": 1704067620000, "hz": 32.0},
      {"t": 1704067680000, "hz": 29.5},
      {"t": 1704067740000, "hz": 31.8}
    ]
  }'
```

## 方法 4: 使用 Postman

1. 创建新请求
2. 方法: `POST`
3. URL: `http://localhost:6001/api/session`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):

```json
{
  "deviceId": "VP-2025-000001",
  "startedAt": 1704067200000,
  "endedAt": 1704067800000,
  "samples": [
    {"t": 1704067200000, "hz": 30.5},
    {"t": 1704067260000, "hz": 31.2},
    {"t": 1704067320000, "hz": 29.8},
    {"t": 1704067380000, "hz": 32.1},
    {"t": 1704067440000, "hz": 30.9},
    {"t": 1704067500000, "hz": 31.5},
    {"t": 1704067560000, "hz": 30.2},
    {"t": 1704067620000, "hz": 32.0},
    {"t": 1704067680000, "hz": 29.5},
    {"t": 1704067740000, "hz": 31.8}
  ]
}
```

6. 点击 "Send"
7. 重复发送 10 次

## 方法 5: 使用浏览器 Console

打开浏览器开发者工具（F12），在 Console 中运行：

```javascript
async function sendFakeSession() {
  const deviceId = 'VP-2025-000001';
  const now = Date.now();
  const startedAt = now - 600000; // 10分钟前
  const endedAt = now;
  
  const samples = [];
  for (let i = 0; i < 10; i++) {
    samples.push({
      t: startedAt + i * 60000,
      hz: 30 + (Math.random() * 10 - 5) // 30Hz ± 5Hz
    });
  }
  
  const payload = {
    deviceId,
    startedAt,
    endedAt,
    samples
  };
  
  try {
    const response = await fetch('http://localhost:6001/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log('✅ 成功:', data);
    return data;
  } catch (error) {
    console.error('❌ 失败:', error);
  }
}

// 发送 10 条数据
for (let i = 0; i < 10; i++) {
  await sendFakeSession();
  await new Promise(resolve => setTimeout(resolve, 500));
}
```

## 验证成功标准

✅ **只要数据库能看到这些数据 → 你赢了！**

### 检查数据库

#### 使用 Prisma Studio

```bash
cd ai-trainer-backend
npx prisma studio
```

然后查看：
- `Session` 表：应该有新创建的 Session 记录
- `DeviceData` 表：应该有对应的频率点记录（每个 Session 10 条）

#### 使用 SQL 查询

```sql
-- 查看最近的 Session
SELECT * FROM "Session" ORDER BY "startedAt" DESC LIMIT 10;

-- 查看对应的频率点数据
SELECT * FROM "DeviceData" 
WHERE "sessionId" IN (
  SELECT id FROM "Session" ORDER BY "startedAt" DESC LIMIT 1
) 
ORDER BY "createdAt" ASC;
```

#### 使用 API 查询

```bash
# 获取所有 Session
curl http://localhost:6001/api/session

# 获取特定 Session 详情
curl http://localhost:6001/api/session/{sessionId}
```

## 预期结果

- ✅ API 返回 `200 OK`
- ✅ 响应中包含 `session.id`
- ✅ `Session` 表中有新记录
- ✅ `DeviceData` 表中有对应的频率点记录（每个 Session 10 条）
- ✅ 数据的时间戳和频率值正确

## 常见问题

### 1. 设备不存在错误

```
Error: Device not found: VP-2025-000001
```

**解决**：先在数据库中创建设备和场馆：

```sql
-- 创建场馆
INSERT INTO "Clinic" (id, name) VALUES ('clinic-001', '测试场馆');

-- 创建设备
INSERT INTO "Device" (id, name, "clinicId") 
VALUES ('VP-2025-000001', '测试设备', 'clinic-001');
```

### 2. API 无法访问

**解决**：确保后端服务正在运行：

```bash
cd ai-trainer-backend
npm run dev
```

### 3. 数据库连接错误

**解决**：确保数据库已启动：

```bash
cd ai-trainer-backend
docker-compose up -d postgres
npx prisma db push
```

## 下一步

验证成功后，就可以开始连接真实的蓝牙设备了！🎉

