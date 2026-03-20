# Kubernetes 部署指南

本文档说明如何在 Kubernetes 集群上部署 Misskey (Sharkey) + PostgreSQL + Redis + Meilisearch。

## 前置要求

- Kubernetes 集群 (v1.25+)
- kubectl
- Cert-Manager (用于 HTTPS/Let's Encrypt)
- Nginx Ingress Controller
- 支持 `ReadWriteOnce` 的 StorageClass

## 文件结构

```
k8s/
├── base/                          # 基础资源定义
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── postgres/
│   │   ├── configmap.yaml
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   ├── redis/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── meilisearch/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── misskey/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       ├── hpa.yaml
│       ├── pdb.yaml
│       └── networkpolicy.yaml
├── overlays/
│   └── production/                # 生产环境覆盖
│       ├── kustomization.yaml
│       ├── secrets.env.example    # 密钥模板
│       └── config/
│           └── default.yml        # Misskey 配置
└── KUBERNETES_DEPLOYMENT.md
```

## 快速开始

### 1. 配置密钥

```bash
cd k8s/overlays/production
cp secrets.env.example secrets.env
# 编辑 secrets.env，填入真实的密码
```

### 2. 修改配置

编辑 `overlays/production/config/default.yml`：

- `url` — 你的域名
- `db.pass` — 与 `secrets.env` 中 `POSTGRES_PASSWORD` 一致
- `meilisearch.apiKey` — 与 `secrets.env` 中 `MEILI_MASTER_KEY` 一致

编辑 `overlays/production/kustomization.yaml`：

- `images[0].newName` — 你的镜像仓库地址
- `images[0].newTag` — 目标版本

编辑 `base/misskey/ingress.yaml`：

- `spec.tls[0].hosts` 和 `spec.rules[0].host` — 你的域名

### 3. 预览并部署

```bash
# 预览生成的清单
kubectl kustomize k8s/overlays/production

# 部署
kubectl apply -k k8s/overlays/production
```

### 4. 验证

```bash
kubectl get pods -n misskey -w
kubectl logs -n misskey deployment/misskey -f
```

### 5. 初始化

```bash
kubectl wait --for=condition=ready pod -l app=misskey -n misskey --timeout=300s
kubectl exec -it deployment/misskey -n misskey -- pnpm run migrate
```

## 架构

```
Internet → Ingress (HTTPS) → Misskey Service → Misskey Pods (2-5)
                                                  ├→ PostgreSQL (StatefulSet)
                                                  ├→ Redis
                                                  └→ Meilisearch
```

| 组件 | 类型 | 存储 | 说明 |
|------|------|------|------|
| Misskey | Deployment (2-5) | 100Gi RWO | 主应用，HPA 自动伸缩 |
| PostgreSQL | StatefulSet (1) | 50Gi (volumeClaimTemplate) | 数据库 |
| Redis | Deployment (1) | 10Gi RWO | 缓存/消息队列，AOF 持久化 |
| Meilisearch | Deployment (1) | 20Gi RWO | 全文搜索 |

## 安全特性

- **NetworkPolicy** — PostgreSQL/Redis/Meilisearch 仅允许 Misskey Pod 访问
- **PodDisruptionBudget** — 滚动更新时至少保留 1 个 Pod
- **Pod 反亲和性** — Misskey Pod 分散到不同节点
- **runAsNonRoot** — Misskey 以非 root 用户运行
- **Secret 分离** — 密钥通过 `.env` 文件管理，不提交到 Git

## 多副本注意

如果 Misskey 运行多副本，`misskey-files-pvc` 默认使用 `ReadWriteOnce`。
如果多个 Pod 需要同时写入文件，需要改为 `ReadWriteMany` 并配合 NFS/CephFS 等共享存储，
或使用对象存储 (S3) 替代本地文件存储。

## 常用操作

```bash
# 更新配置后重新部署
kubectl apply -k k8s/overlays/production
kubectl rollout restart deployment/misskey -n misskey

# 备份数据库
kubectl exec -n misskey postgres-0 -- pg_dump -U misskey misskey > backup.sql

# 查看 HPA 状态
kubectl get hpa -n misskey

# 回滚
kubectl rollout undo deployment/misskey -n misskey
```
