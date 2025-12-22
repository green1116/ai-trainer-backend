# Clinic API 文档

## Clinic 层次结构

```
Clinic
 ├── Devices
 ├── Coaches
 ├── Clients
 └── Sessions
```

## API 端点

### 1. 获取 Clinic 详情

**端点**: `GET /api/clinic/{id}`

**描述**: 获取 Clinic 的完整信息，包括设备、教练、客户和会话

**响应**:
```typescript
{
  id: string;
  name: string;
  devices: Array<{
    id: string;
    name: string | null;
    createdAt: Date;
  }>;
  coaches: Array<{
    id: string;
    email: string;
    plan: string;
    role: string;
  }>;
  clients: Array<{
    id: string;
    email: string;
    plan: string;
    role: string;
  }>;
  sessions: Array<{
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    deviceId: string;
  }>;
  stats: {
    deviceCount: number;
    coachCount: number;
    clientCount: number;
    sessionCount: number;
  };
}
```

### 2. 获取 Clinic 的设备列表

**端点**: `GET /api/clinic/{id}/devices`

**描述**: 获取 Clinic 的所有设备及其最近会话

**响应**:
```typescript
{
  clinicId: string;
  clinicName: string;
  devices: Array<{
    id: string;
    name: string | null;
    createdAt: Date;
    sessionCount: number;
    recentSessions: Array<{
      id: string;
      startedAt: Date;
      endedAt: Date | null;
    }>;
  }>;
  count: number;
}
```

### 3. 获取 Clinic 的教练列表

**端点**: `GET /api/clinic/{id}/coaches`

**描述**: 获取 Clinic 的所有教练

**响应**:
```typescript
{
  clinicId: string;
  clinicName: string;
  coaches: Array<{
    id: string;
    email: string;
    plan: string;
    role: 'coach';
  }>;
  count: number;
}
```

### 4. 获取 Clinic 的客户列表

**端点**: `GET /api/clinic/{id}/clients`

**描述**: 获取 Clinic 的所有客户

**响应**:
```typescript
{
  clinicId: string;
  clinicName: string;
  clients: Array<{
    id: string;
    email: string;
    plan: string;
    role: 'client';
  }>;
  count: number;
}
```

### 5. 获取 Clinic 的会话列表

**端点**: `GET /api/clinic/{id}/sessions`

**查询参数**:
- `limit`: 每页数量（默认: 50）
- `offset`: 偏移量（默认: 0）

**响应**:
```typescript
{
  clinicId: string;
  clinicName: string;
  sessions: Array<{
    id: string;
    deviceId: string;
    device: {
      id: string;
      name: string | null;
    };
    startedAt: Date;
    endedAt: Date | null;
    duration: number | null; // seconds
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

## 数据模型

### User Role 字段

```prisma
model User {
  id       String  @id @default(uuid())
  email    String  @unique
  plan     String  @default("free") // free | pro | clinic
  role     String? // 'coach' | 'client' | null
  clinicId String?
  clinic   Clinic? @relation(fields: [clinicId], references: [id])
}
```

**Role 说明**:
- `null`: 非 Clinic 用户（Free/Pro 用户）
- `'coach'`: Clinic 的教练
- `'client'`: Clinic 的客户

## 使用示例

### 获取 Clinic 完整信息

```typescript
const response = await fetch('/api/clinic/clinic-id');
const clinic = await response.json();

console.log('设备数量:', clinic.stats.deviceCount);
console.log('教练数量:', clinic.stats.coachCount);
console.log('客户数量:', clinic.stats.clientCount);
console.log('会话数量:', clinic.stats.sessionCount);
```

### 获取设备列表

```typescript
const response = await fetch('/api/clinic/clinic-id/devices');
const { devices } = await response.json();

devices.forEach(device => {
  console.log(`设备 ${device.name}: ${device.sessionCount} 个会话`);
});
```

### 获取教练列表

```typescript
const response = await fetch('/api/clinic/clinic-id/coaches');
const { coaches } = await response.json();

coaches.forEach(coach => {
  console.log(`教练: ${coach.email}`);
});
```

### 获取会话列表（分页）

```typescript
const response = await fetch('/api/clinic/clinic-id/sessions?limit=20&offset=0');
const { sessions, pagination } = await response.json();

console.log(`共 ${pagination.total} 个会话`);
sessions.forEach(session => {
  console.log(`会话 ${session.id}: ${session.duration} 秒`);
});
```

## 相关文件

- **Schema**: `prisma/schema.prisma`
- **Clinic 详情**: `app/api/clinic/[id]/route.ts`
- **设备列表**: `app/api/clinic/[id]/devices/route.ts`
- **教练列表**: `app/api/clinic/[id]/coaches/route.ts`
- **客户列表**: `app/api/clinic/[id]/clients/route.ts`
- **会话列表**: `app/api/clinic/[id]/sessions/route.ts`

