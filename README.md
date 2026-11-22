# IndexTTS2 Player · 移动适配版

基于 [st-indextts2-plus](https://github.com/xiaoxiongweihu/st-indextts2-plus) 的移动端适配。手机自己的 SillyTavern 可以连接局域网里的 IndexTTS2。

1. 在 SillyTavern 的「扩展 → 安装扩展」粘贴本仓库 URL。安装后关闭旧版扩展，避免重复播放。
2. 打开「IndexTTS2 Player · 移动适配版 → 服务配置」。在「电脑语音服务地址」填 IndexTTS2 的 HTTP 地址和端口，格式为 `http://电脑局域网IP:7880`，点「应用到三个接口」。
3. 如果手机浏览器能打开音色列表、酒馆内却直连失败，连接方式选择「酒馆内置转发」，再点「测试音色连接」。在 TauriTavern 中，此选项走原生语音接口。使用网页端 SillyTavern 时走 1.18 的 OpenAI Compatible 语音接口。电脑侧的 IndexTTS2 适配服务需提供 `POST /api/v1/sillytavern/{voices,speech,upload}`。TauriTavern 要求合规的音频响应，适配服务在 WAV 元数据区返回音色清单和上传结果，合成结果使用 MP3。

部分 Android 版本没有实现自定义语音转发接口。遇到这种情况，可以选「TauriTavern 局域网连接」，通过 App 的原生本地工作流接口读取音色和合成语音。需要电脑端 IndexTTS2 服务提供 `/api/v1/audio-workflow`，全程使用原来配置的电脑语音服务地址。TauriTavern Android 的「自动选择」也使用这条路径。

从 1.3.4 起，可以在播放器设置顶部点击「更新扩展」，由酒馆更新当前安装的仓库。更新成功后，点击「重新加载酒馆」加载新版。

在「配音配置」可先按音色分组选择参考音频并试听，再给角色绑定。每个角色当前选中的音色也可单独试听。「场景音效」里同样可以试听背景音。试听会播放已有音频，无需等待语音合成。

「场景音效 → 导入背景音文件」可直接多选音频。「TauriTavern 局域网连接」也能读取电脑上的同名场景音。场景标签使用文件名去掉后缀，播放器在朗读时播放对应的场景音。想让首句先出声时，启用「推理完 N 句后自动续播」并将句数设为 1。缓存会自动保存，手动备份可以通过「参考音频＆缓存管理」导入或导出。若接口暂时不可达，配音配置会标记正在显示离线清单。实际合成和上传需要语音服务连接成功。

GAL 模式优先解析原始消息。可以用仅显示的正则把 `[角色][表情][场景]「台词」` 渲染成 `角色：“台词”`，合成仍使用原始消息里的角色、表情和场景。

## 可选的手机本机中继

如果 App 阻止网页直连而且该 SillyTavern 支持服务端插件，将 `indextts2-mobile-relay.mjs` 作为 `plugins/indextts2-mobile.mjs` 安装，在 `config.yaml` 启用 `enableServerPlugins: true`，在启动环境中将 `INDEXTTS2_UPSTREAM` 设为电脑的 `http://局域网IPv4:7880`，然后重启 SillyTavern。插件只接受本机请求，只能访问启动时设置的固定局域网目标。默认的「自动选择」会优先使用已安装的中继。

如果 App 有单独的 GitHub 服务端插件安装入口，也可在那个入口安装同一个仓库。通过前端的「安装扩展」菜单安装的是前端扩展。SillyTavern 不会因此自动安装服务端插件。如果手机版不支持插件且阻止直连，可尝试用系统浏览器打开手机上正在运行的酒馆。

[SillyTavern 扩展安装文档](https://docs.sillytavern.app/extensions/#third-party-extensions) · [服务端插件文档](https://docs.sillytavern.app/for-contributors/server-plugins/)
