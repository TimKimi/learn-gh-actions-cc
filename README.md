# learn-gh-actions-cc

一个专门用来学习 **GitHub Actions 全功能** 与 **Conventional Commits 规范** 的小型项目。包含：

- 多版本矩阵测试、缓存、制品上传/下载
- Docker 构建 + 服务容器集成测试
- GitHub Pages 自动部署
- 内网穿透冒烟测试（ngrok）
- 基于 Conventional Commits 的自动发版与 Changelog 生成
- 通过 `direnv` 隔离环境，实现“即用即删”

## 技术栈

Node.js + Express + Jest + ESLint + Docker + direnv + ngrok

---

## 快速开始

### 1. 前置要求

- **Node.js** ≥ 18（推荐 v20，使用 nvm 管理）
- **Git**
- **direnv**（安装后需配置 shell 钩子，见下文）
- **GitHub 账号**（用来体验 Actions）
- **ngrok 免费账号**（需要 authtoken，用于内网穿透）

> 如果你使用 WSL，建议在 `/etc/wsl.conf` 中添加：
> ```ini
> [interop]
> appendWindowsPath = false
> ```
> 然后重启 WSL，避免错误调用 Windows 版的 Node。

### 2. 克隆项目 & 进入

```bash
git clone https://github.com/你的用户名/learn-gh-actions-cc.git
cd learn-gh-actions-cc
```

### 3. 配置 direnv

项目已经为你准备了 `.envrc`，它会自动隔离 Node 环境并加载敏感信息。

```bash
# 允许 direnv 加载环境配置
direnv allow
```

复制环境变量模板并填入你的 ngrok authtoken：

```bash
cp .env.example .env
# 编辑 .env，将 NGROK_AUTHTOKEN 替换为你的真实 token
# 注意：等号前后不要有空格，例如 NGROK_AUTHTOKEN=2abc...
```

> 本项目的 `.envrc` 使用 `dotenv` 加载 `.env`，对格式的容错性更好。  
> 如果 `echo $NGROK_AUTHTOKEN` 为空，可先运行 `eval "$(direnv export bash)"` 强制导入。

### 4. 安装依赖

```bash
npm install
```

### 5. 本地验证

```bash
npm start          # 启动 Web 服务（默认 http://localhost:3000）
npm test           # 运行测试
npm run lint       # ESLint 静态检查
make tunnel        # （可选）启动 ngrok 隧道，暴露本地 3000 端口
```

---

## 项目结构

```
.
├── .envrc                  # direnv 环境定义
├── .env.example            # 环境变量模板（NGROK_AUTHTOKEN）
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci.yml          # 完整 CI/CD 流水线
│       └── release.yml     # 自动发布与 Changelog
├── .husky/
│   └── commit-msg          # 提交信息检查钩子
├── commitlint.config.js    # Conventional Commits 规则
├── eslint.config.mjs       # ESLint 扁平化配置（v10+）
├── .releaserc              # semantic-release 配置（禁用 npm）
├── Dockerfile
├── Makefile                # 本地快捷命令
├── package.json
├── public/
│   └── index.html          # 用于 GitHub Pages 部署
├── src/
│   ├── index.js            # Express 应用
│   └── index.test.js       # 测试用例
└── README.md
```

---

## 关键配置与设计思路

### direnv 环境隔离

- `.envrc` 使用 `layout node` 自动将 `node_modules/.bin` 加入 `PATH`。
- 通过 `dotenv .env` 加载敏感信息（不提交到 Git）。
- 离开项目目录后环境自动还原，删除目录后无残留。

### Conventional Commits 强制检查

- 采用 `commitlint` + `husky` 在提交时检查信息格式。
- 规则：必须包含 `type(scope): subject`，subject 全小写，body/footer 前需空行。
- 类型支持：`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`。
- 标记破坏性变更：在 `type` 后加 `!` 或 footer 中写 `BREAKING CHANGE:`。

如果钩子不生效，手动配置一次 hooks 路径：
```bash
git config core.hooksPath .husky
```

### ESLint

- 基于 ESLint v10+ 的扁平化配置（`eslint.config.mjs`）。
- 需要显式声明 Node.js 和 Jest 的全局变量（使用 `globals` 包）。
- 如果以后换用 CommonJS，可将配置后缀改为 `.mjs` 以避免模块解析错误。

### Docker

- `Dockerfile` 使用 `--ignore-scripts --omit=dev` 安装依赖，避免生产环境执行 `husky` 导致构建失败。
- 基础镜像建议与本地 Node 版本保持一致（如 `node:20-alpine`）。

### Makefile

- `make start`: 启动 Web 服务
- `make test`: 运行测试
- `make tunnel`: 使用 ngrok 暴露本地 3000 端口（自动读取 `$NGROK_AUTHTOKEN`）
- `make help`: 显示所有命令

---

## GitHub Actions 工作流

### CI/CD (`ci.yml`)

**触发条件**：`push` 到 `main`、`pull_request` 到 `main`，或手动触发（`workflow_dispatch`）。

**包含的 Job**：

| Job | 说明 |
|-----|------|
| `lint-and-test` | 矩阵策略并行测试 Node 18/20，缓存依赖，上传覆盖率产物 |
| `build-docker` | 构建 Docker 镜像并导出为 tar 包，保存为 workflow artifact |
| `integration-test` | 启动 Redis 服务容器 + 应用容器，执行集成测试 |
| `deploy-pages` | 仅 `main` 分支，将 `public/` 部署到 GitHub Pages（需仓库开启 Pages，源设为 Actions） |
| `smoke-test-ngrok` | 手动安装 ngrok，用 `NGROK_AUTHTOKEN` 创建隧道，验证公网健康检查 |

### 自动发布 (`release.yml`)

监听 `main` 分支推送，使用 `semantic-release`：

- 分析 Conventional Commits 自动计算版本（fix → patch, feat → minor, BREAKING CHANGE → major）
- 生成 `CHANGELOG.md`
- 创建 GitHub Release

**注意**：我们在 `.releaserc` 中只保留了 GitHub 相关插件，禁用 npm 发布，因此无需 `NPM_TOKEN`。

---

## GitHub 仓库设置

为了让所有功能正常运行，你需要手动开启以下设置：

1. **启用 GitHub Pages**  
   `Settings` → `Pages` → Source 选择 **GitHub Actions**。

2. **添加 Actions Secrets**  
   `Settings` → `Secrets and variables` → `Actions`  
   添加 `NGROK_AUTHTOKEN`，值为你的 ngrok 令牌。  
   （CI 中 ngrok 步骤需要使用此 secret）

3. **检查 Actions 权限**  
   `Settings` → `Actions` → `General`  
   确保 “Allow all actions and reusable workflows” 已选中，且 Workflow permissions 为 “Read and write permissions”。

---

## 常见问题排查

| 现象 | 原因 | 解决 |
|------|------|------|
| WSL 中 `npm start` 报 UNC 路径/找不到模块 | 调用了 Windows 版 Node | 在 `/etc/wsl.conf` 添加 `appendWindowsPath = false`，重启 WSL，并使用 WSL 内的 Node |
| `git commit` 未被 commitlint 拦截 | hooksPath 未指向 `.husky` | 执行 `git config core.hooksPath .husky` |
| ESLint 找不到 `@eslint/js` 或报模块错误 | 缺少依赖或配置后缀错误 | 安装 `@eslint/js` 和 `globals`；确保配置文件为 `eslint.config.mjs` |
| Docker 构建失败：`sh: husky: not found` | 生产依赖跳过了 husky 但 prepare 脚本仍在运行 | Dockerfile 中添加 `--ignore-scripts` 参数 |
| GitHub Pages 部署失败（403 / OIDC 错误） | 缺少 `id-token: write` 权限或未启用 Pages | 在 `deploy-pages` job 中添加 `permissions: pages: write, id-token: write`；在仓库 Settings 中启用 GitHub Actions 部署 |
| ngrok CI 步骤报 “Action not found” | 原第三方 Action 已失效 | 工作流中已改为手动下载 ngrok 客户端并启动 |
| Release 工作流报 `EGITNOPERMISSION` | 缺少 `contents: write` 权限 | 在 `release.yml` 中添加 `permissions: contents: write` |
| Release 报 `No npm token specified` | semantic-release 默认包含 npm 插件 | 项目根目录的 `.releaserc` 已禁用 npm，仅保留 GitHub 相关插件 |
| 本地 `make tunnel` 提示 `authentication failed` / 代理错误 | 设置了 HTTP 代理或 ngrok 配置中有代理 | 执行 `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY`；检查 `~/.config/ngrok/ngrok.yml` 中是否配置了 `proxy_url` 并删除 |
| ngrok 隧道成功但访问报 `ERR_NGROK_8012` | 本地 3000 端口没有服务在监听 | 先运行 `npm start` 启动服务，再在另一个终端执行 `make tunnel` |
| `echo $NGROK_AUTHTOKEN` 为空 | direnv 未正确导出变量 | 重新执行 `direnv allow`；或手动 `eval "$(direnv export bash)"`；确认 `.env` 格式正确无空格 |

---

## 学习路径建议

1. **体验完整 CI**：推送代码后观察 Actions 标签页，了解矩阵构建、制品传递、服务容器、环境部署的全流程。
2. **尝试不同类型的提交**：  
   - `feat(api): add new endpoint`  
   - `fix(docker): correct port binding`  
   - `docs(readme): update setup instructions`  
   观察 `git log` 和 Release 版本号的变化。
3. **测试破坏性变更**：提交包含 `BREAKING CHANGE: description` 脚标的信息，查看 `release.yml` 是否自动升级 major 版本。
4. **手动触发工作流**：使用 `workflow_dispatch`，输入不同环境名称，理解输入参数的用法。
5. **本地练习 ngrok**：运行 `make tunnel`，获取公网 URL，直接验证 Web 服务在公网的可用性。
6. **阅读工作流 YAML**：逐行理解 CI 中的每个步骤，加深对 GitHub Actions 生态的认识。

---

## 清理环境

项目最大的优点就是**用完即删，不留痕迹**：

```bash
cd ..
direnv deny        # 撤销 .envrc 授权
rm -rf learn-gh-actions-cc
```

如果你的 shell 配置里添加了 direnv 钩子且不再需要，也可以删除对应行。

---

## 许可

MIT – 随意修改和学习。