.PHONY: help tunnel start test

help:                   ## 显示帮助
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

start:                  ## 启动应用（端口 3000）
	npm start

test:                   ## 运行测试
	npm test

tunnel:                 ## 使用 ngrok 暴露本地 3000 端口
	ngrok http 3000 --authtoken $$NGROK_AUTHTOKEN