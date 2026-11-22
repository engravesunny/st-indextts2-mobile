# IndexTTS2 Player · 移动适配版

基于 [st-indextts2-plus](https://github.com/xiaoxiongweihu/st-indextts2-plus) 的移动端适配。手机自己的 SillyTavern 可以连接局域网里的 IndexTTS2。

1. 在 SillyTavern 的「扩展 → 安装扩展」粘贴本仓库 URL。安装后关闭旧版扩展，避免重复播放。
2. 打开「IndexTTS2 Player · 移动适配版 → 服务配置」。在「电脑语音服务地址」填 IndexTTS2 的 HTTP 地址和端口，例如 `http://192.168.0.10:7880`，点「应用到三个接口」。
3. 点「测试音色连接」。连接成功后，打开聊天消息旁的配音配置，给每个角色选音色。

「场景音效 → 导入背景音文件」可直接多选音频。场景标签使用文件名去掉后缀。缓存会自动保存，手动备份可以通过「参考音频＆缓存管理」导入或导出。若接口暂时不可达，配音配置会标记正在显示离线清单。实际合成和上传需要语音服务连接成功。

## 可选的手机本机中继

如果 App 阻止网页直连而且该 SillyTavern 支持服务端插件，将 `indextts2-mobile-relay.mjs` 作为 `plugins/indextts2-mobile.mjs` 安装，在 `config.yaml` 启用 `enableServerPlugins: true`，在启动环境中将 `INDEXTTS2_UPSTREAM` 设为电脑的 `http://局域网IPv4:7880`，然后重启 SillyTavern。插件只接受本机请求，只能访问启动时设置的固定局域网目标。默认的「自动选择」会优先使用已安装的中继。

如果 App 有单独的 GitHub 服务端插件安装入口，也可在那个入口安装同一个仓库。通过前端的「安装扩展」菜单安装的是前端扩展。SillyTavern 不会因此自动安装服务端插件。如果手机版不支持插件且阻止直连，可尝试用系统浏览器打开手机上正在运行的酒馆。

[SillyTavern 扩展安装文档](https://docs.sillytavern.app/extensions/#third-party-extensions) · [服务端插件文档](https://docs.sillytavern.app/for-contributors/server-plugins/)
