# Clinic 数据结构

## Clinic 层次结构

```
Clinic
 ├── Devices
 ├── Coaches
 ├── Clients
 └── Sessions
```

## 数据模型关系

### 当前 Schema 状态

根据当前的 Prisma schema：

```prisma
model Clinic {
  id       String   @id @default(uuid())
  name     String
  devices  Device[]    // ✅ 已关联
  users    User[]      // ⚠️ 需要区分 Coaches 和 Clients
  sessions Session[]   // ✅ 已关联
}
```

### 需要明确的关系

1. **Devices** ✅ - 已通过 `Device.clinicId` 关联
2. **Coaches** ⚠️ - 当前通过 `User.clinicId` 关联，但需要区分角色
3. **Clients** ⚠️ - 当前通过 `User.clinicId` 关联，但需要区分角色
4. **Sessions** ✅ - 已通过 `Session.clinicId` 关联

## Schema 实现

### ✅ 已实现：使用 User.role 区分

在 `User` 模型中添加了 `role` 字段：

```prisma
model User {
  id       String  @id @default(uuid())
  email    String  @unique
  plan     String  @default("free") // free | pro | clinic
  role     String? // 'coach' | 'client' | null (用于 Clinic 用户)
  clinicId String?
  clinic   Clinic? @relation(fields: [clinicId], references: [id])
}

model Clinic {
  id       String   @id @default(uuid())
  name     String
  devices  Device[]    // ✅ 已关联
  users    User[]      // ✅ 已关联（包含 Coaches 和 Clients）
  sessions Session[]   // ✅ 已关联
}
```

**Role 说明**:
- `null`: 非 Clinic 用户（Free/Pro 用户）
- `'coach'`: Clinic 的教练
- `'client'`: Clinic 的客户

### 方案 2: 创建独立的 Coach 和 Client 模型（更复杂但更清晰）

```prisma
model Clinic {
  id       String   @id @default(uuid())
  name     String
  devices  Device[]
  coaches  Coach[]
  clients  Client[]
  sessions Session[]
}

model Coach {
  id       String  @id @default(uuid())
  userId   String  @unique
  clinicId String
  user     User    @relation(fields: [userId], references: [id])
  clinic   Clinic  @relation(fields: [clinicId], references: [id])
}

model Client {
  id       String  @id @default(uuid())
  userId   String  @unique
  clinicId String
  user     User    @relation(fields: [userId], references: [id])
  clinic   Clinic  @relation(fields: [clinicId], references: [id])
}
```

## 当前实现状态

### ✅ 已实现

- **Devices**: `Device.clinicId` → `Clinic.id` ✅
- **Sessions**: `Session.clinicId` → `Clinic.id` ✅
- **Users**: `User.clinicId` → `Clinic.id` ✅
- **Coaches/Clients 区分**: `User.role` 字段 ✅
- **Clinic API**: 完整的 REST API 端点 ✅

## 查询示例

### 获取 Clinic 的所有设备

```typescript
const clinic = await db.clinic.findUnique({
  where: { id: clinicId },
  include: {
    devices: true,
  },
});
```

### 获取 Clinic 的所有会话

```typescript
const clinic = await db.clinic.findUnique({
  where: { id: clinicId },
  include: {
    sessions: {
      include: {
        device: true,
      },
    },
  },
});
```

### 获取 Clinic 的教练（如果使用 role）

```typescript
const coaches = await db.user.findMany({
  where: {
    clinicId: clinicId,
    role: 'coach',
  },
});
```

### 获取 Clinic 的客户（如果使用 role）

```typescript
const clients = await db.user.findMany({
  where: {
    clinicId: clinicId,
    role: 'client',
  },
});
```

## API 端点

### ✅ 已实现的 Clinic 管理 API

```
GET    /api/clinic/{id}              - 获取 Clinic 详情（包含所有子资源）
GET    /api/clinic/{id}/devices      - 获取 Clinic 的设备列表
GET    /api/clinic/{id}/coaches      - 获取 Clinic 的教练列表
GET    /api/clinic/{id}/clients      - 获取 Clinic 的客户列表
GET    /api/clinic/{id}/sessions     - 获取 Clinic 的会话列表（支持分页）
```

详细 API 文档请参考：`docs/CLINIC_API.md`

## 相关文件

- **Schema**: `prisma/schema.prisma`
- **API 路由**: `app/api/clinic/` (待创建)

