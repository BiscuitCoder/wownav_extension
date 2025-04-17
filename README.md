# 书签导航生成器 Chrome 扩展

一个简单而强大的 Chrome 扩展，可以将您的书签转换为美观的在线导航页面。

## 功能特点

- 🎯 一键将 Chrome 书签转换为在线导航页面
- 🎨 支持自定义主题颜色
- 📝 支持 SEO 优化设置（标题、描述、关键词）
- 🤖 支持 AI 自定义代码注入
- 📱 响应式设计，适配各种设备
- 🔍 支持书签分类展示
- 💾 支持选择性导出书签

## 使用方法

1. 安装扩展后，点击 Chrome 工具栏中的扩展图标
2. 在左侧选择需要导出的书签
3. 在右侧填写 SEO 信息：
   - 网站标题
   - 网站描述
   - 关键词
   - 主题颜色
4. （可选）在自定义代码框中输入需求，AI 将生成相应的代码
5. 点击"生成在线导航"按钮
6. 等待生成完成后，点击链接查看生成的导航页面

## 服务启动

https://github.com/BiscuitCoder/wownav_ts

## 自定义代码示例

```text
加载完成后，在搜索栏下面，插入一个banner图片链接为：
https://github.com/lxdao-official/.github/raw/main/images/LXDAO.png

图片要求：
1. 加入一个css的心跳循环动画
2. 图片宽度为100%自适应
3. 点击这个图片alert('欢迎各位LX，让给我们共创良心社会🤝~ ')
```

## 注意事项

- 生成导航页面时需要联网
- 使用 AI 自定义代码功能时，生成时间可能较长
- 建议定期备份您的书签数据

## 技术栈

- Chrome Extension API
- HTML5/CSS3
- JavaScript
- DeepSeek API

## 许可证

MIT License 