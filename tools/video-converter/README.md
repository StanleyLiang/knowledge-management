# Video Converter — MP4 to HLS (M3U8)

NATS JetStream worker，將 MP4 漸進式轉換為多解析度 HLS 串流。設計用於 K8s 高併發環境，每個 Pod 同時處理一個 job，透過水平擴展 replica 控制併發數。

## Architecture

```
Producer → NATS JetStream (video.convert) → Worker Pods (1 job/pod)
                                                ↓
                                      Download MP4 from S3
                                      ffprobe → 過濾適用解析度
                                      FFmpeg 360p → 480p → 720p → 1080p
                                      每個完成 → upload S3 → 更新 master.m3u8 → NATS 通知
```

### 核心特性

- **漸進式轉換** — 由低到高依序轉換，每完成一個解析度即可播放
- **Variant 級別續傳** — Pod crash 後新 Pod 檢查 S3 已完成的 variant，跳過繼續
- **主動取消** — 調用端 publish cancel subject，worker kill FFmpeg 並清理
- **永久/暫時錯誤區分** — 損壞檔案不重試 (`msg.term()`)，暫時性錯誤重送 (`msg.nak()`)
- **來源解析度過濾** — 不做無意義的放大，以短邊為基準支援橫式/直式/方形影片

## Quick Start (本地開發)

```bash
# 1. 啟動基礎設施 (NATS + MinIO + Worker)
cd tools/video-converter
docker compose up -d

# 2. 啟動 Demo Web App (另開 terminal)
npm run dev:video-demo

# 3. 開瀏覽器上傳 MP4 並觀看即時轉檔
open http://localhost:3333
```

### 服務端口

| 服務 | Port | 用途 |
|------|------|------|
| Demo Web App | 3333 | 上傳 + 進度 + HLS 播放 |
| NATS (TCP) | 4222 | Worker / Demo server 連線 |
| NATS (WebSocket) | 9222 | 瀏覽器即時訂閱狀態 |
| NATS (HTTP Monitor) | 8222 | NATS 監控 |
| MinIO (S3 API) | 9000 | 檔案存取 |
| MinIO (Console) | 9001 | Web 管理介面 |
| Worker (Health) | 8080 | K8s liveness/readiness |

## ABR Variants

| 名稱 | 解析度 | 視訊 Bitrate | 音訊 Bitrate |
|------|--------|-------------|-------------|
| 360p | 640x360 | 800 kbps | 96 kbps |
| 480p | 854x480 | 1,400 kbps | 128 kbps |
| 720p | 1280x720 | 2,800 kbps | 128 kbps |
| 1080p | 1920x1080 | 5,000 kbps | 192 kbps |

來源影片解析度低於某個 variant 時自動跳過。例如上傳 720p 影片只產出 360p、480p、720p。

## NATS Message Schema

### Job Subject: `video.convert` (JetStream)

```json
{
  "jobId": "uuid",
  "inputUrl": "s3://bucket/key",
  "outputBucket": "videos",
  "outputPrefix": "hls/<jobId>/",
  "hlsSegmentDuration": 10
}
```

### Status Subject: `video.convert.status.<jobId>` (Core NATS)

```json
{
  "jobId": "string",
  "status": "downloading | converting | uploading | completed | failed | cancelled",
  "currentVariant": "480p",
  "completedVariants": ["360p"],
  "progress": 45,
  "playlistUrl": "s3://bucket/hls/<jobId>/master.m3u8",
  "error": null,
  "updatedAt": "ISO 8601"
}
```

`completedVariants` 累加，調用端收到通知後即可用 `playlistUrl` 播放已完成的解析度。

### Cancel Subject: `video.convert.cancel.<jobId>` (Core NATS)

調用端 publish 任意 payload 至此 subject 即可取消正在處理的 job。

## 轉換流程

```
1. 收到 job → 下載 MP4 from S3
2. ffprobe 偵測來源解析度 → 過濾適用 variants
3. 檢查 S3 已完成的 variants (續傳)
4. 依序轉換每個 variant:
   ├── FFmpeg 轉檔 (progress callback → msg.working() 延長 ack)
   ├── 上傳 .ts segments + variant playlist.m3u8
   ├── 更新 master.m3u8 (累加新 variant)
   └── Publish status → 調用端可即時播放
5. 全部完成 → msg.ack() → 清理暫存檔
```

## Error Handling

| 情境 | 類型 | 處理 |
|------|------|------|
| 影片損壞 / 格式不支援 | 永久 | `msg.term()` 不重送 |
| FFmpeg codec 錯誤 | 永久 | `msg.term()` 不重送 |
| JSON 解析失敗 | 永久 | `msg.term()` 不重送 |
| S3 網路逾時 | 暫時 | `msg.nak()` → 重送至其他 Pod (可續傳) |
| FFmpeg hang 無進度 | 暫時 | 5 min timeout → kill → `msg.nak()` |
| Pod 被殺 (OOM/drain) | 暫時 | ack 逾時 → 自動重送 → 新 Pod 續傳 |
| 調用者取消 | — | kill FFmpeg → `msg.ack()` 不重送 |
| 超過最大重試 (3 次) | — | NATS advisory，需人工檢查 |
| Queue 排隊過久 | — | NATS `max_age` 24hr 自動丟棄 + 調用端自己計時 |

## Environment Variables

### Worker (必填)

| 變數 | 說明 |
|------|------|
| `S3_ENDPOINT` | S3/MinIO endpoint URL |
| `S3_ACCESS_KEY` | S3 access key |
| `S3_SECRET_KEY` | S3 secret key |

### Worker (選填)

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `NATS_URL` | `nats://localhost:4222` | NATS server |
| `NATS_STREAM` | `VIDEO_CONVERT` | JetStream stream 名稱 |
| `NATS_SUBJECT` | `video.convert` | Job subject |
| `NATS_DURABLE_NAME` | `video-converter` | Durable consumer 名稱 |
| `S3_REGION` | `us-east-1` | AWS region |
| `S3_FORCE_PATH_STYLE` | `true` | MinIO 相容 |
| `TEMP_DIR` | `/tmp/video-converter` | 暫存目錄 |
| `HEALTH_PORT` | `8080` | Health check port |
| `SHUTDOWN_TIMEOUT_MS` | `30000` | Graceful shutdown 超時 |
| `VARIANT_TIMEOUT_MS` | `300000` | 單一 variant 無進度超時 |
| `STREAM_MAX_AGE_SECONDS` | `86400` | Stream message 保留時間 |
| `ACK_WAIT_MS` | `300000` | NATS ack 等待時間 |
| `MAX_DELIVER` | `3` | 最大重送次數 |
| `HLS_SEGMENT_DURATION` | `10` | HLS segment 秒數 |

### Demo App

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `PORT` | `3333` | Demo server port |
| `NATS_URL` | `nats://localhost:4222` | NATS server (server-side) |
| `NATS_WS_URL` | `ws://localhost:9222` | NATS WebSocket (傳給瀏覽器) |
| `S3_ENDPOINT` | `http://localhost:9000` | MinIO endpoint |
| `S3_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `S3_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | 瀏覽器存取 MinIO 的 URL |

## File Structure

```
tools/video-converter/
├── src/
│   ├── index.js              # 主入口：processing loop + health server + graceful shutdown
│   ├── config.js             # 環境變數載入與驗證
│   ├── nats/
│   │   └── consumer.js       # JetStream stream/consumer 管理 + status publish + cancel subscribe
│   ├── services/
│   │   ├── converter.js      # FFmpeg 轉換 + ffprobe + variant 過濾 + master playlist 產生
│   │   ├── downloader.js     # S3/HTTP 下載 + SSRF 防護 + 5GB 大小限制
│   │   └── uploader.js       # S3 上傳 + variant 完成檢查 (續傳)
│   └── utils/
│       └── cleanup.js        # 暫存清理
├── k8s/
│   ├── deployment.yaml       # 2 replicas, emptyDir 10Gi, liveness/readiness probes
│   ├── configmap.yaml        # 非敏感設定
│   └── secret.yaml           # S3 credentials (placeholder)
├── Dockerfile                # node:20-slim + ffmpeg
├── docker-compose.yml        # NATS + MinIO + Worker + test utilities
├── nats.conf                 # JetStream + WebSocket (port 9222)
├── .dockerignore
└── package.json

apps/video-converter-demo/
├── server.js                 # Express: POST /api/upload → MinIO + NATS JetStream
├── public/
│   └── index.html            # 上傳 UI + nats.ws 即時進度 + hls.js 播放器
└── package.json
```

## K8s Deployment

```bash
# Build image
docker build -t video-converter:latest tools/video-converter/

# Apply manifests (先替換 secret.yaml 中的 credentials)
kubectl apply -f tools/video-converter/k8s/

# 調整併發數
kubectl scale deployment video-converter --replicas=5
```

### Resources

- Requests: 500m CPU / 512Mi RAM
- Limits: 2 CPU / 2Gi RAM
- Temp storage: emptyDir 10Gi (per Pod)
- Graceful shutdown: 60s `terminationGracePeriodSeconds`

## Key Design Decisions

### Caller-side timeout
Worker 不做 timeout 判斷。調用端自己計時，收到第一個 status (downloading) 就 cancel timer。NATS `max_age` 作為安全網自動清理過期 message。

### msg.working()
FFmpeg 轉換時在 progress callback 中呼叫 `msg.working()` 重置 NATS ack timer，避免長時間轉換被誤判超時。

### playlist.m3u8 作為完成標記
每個 variant 的 `playlist.m3u8` 在所有 .ts segments 上傳後最後上傳。續傳時用 HeadObject 檢查其存在性即可判斷 variant 是否完整。

### force_original_aspect_ratio=decrease + pad
FFmpeg scale filter 等比縮放至目標框內，搭配 `pad=ceil(iw/2)*2:ceil(ih/2)*2` 確保偶數寬高（libx264 要求）。
