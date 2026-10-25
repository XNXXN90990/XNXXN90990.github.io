---
title: 小小Mac技巧
date: 2026-09-06
category: 教程
tags: [Mac, 教程]
cover: /covers/mac.svg
description: 只显示当前运行的应用
---
# 小小Mac技巧
只显示当前运行的应用

1. 打开终端（Terminal.app）

2. 输入下列指令后，按回车键运行，Dock栏只显示当前运行中的应用程序：
```
defaults write com.apple.dock static-only -bool TRUE; killall Dock
```
***

1. 想恢复原来状态，输入下列指令，按回车键运行即可：
```
defaults write com.apple.dock static-only -bool FALSE; killall Dock
```
***
