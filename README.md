## PocketSpace

这是一个入门的基于 [Pocket](https://github.com/pocketbase/pocketbase) 的一个演示和学习的基础项目， 使用了 PocketBase 的 avaScripts SDK 。它是一个多用户的任务管理系统，使用 PocketBase 作为完整的后端服务，同时带有后台管理界面。

项目的整体结构：

Directory structure:
└── pocket_space/
    ├── README.md
    ├── test_user.txt
    ├── package.json
    ├── go_backend/
    │   └── hello_world.go
    ├── pocketbase/
    │   ├── 账户密码.txt
    │   ├── pb_data/
    │   │   └── types.d.ts
    │   └── pb_migrations/
    │       ├── 1770281461_created_tasks.js
    │       ├── 1770283232_updated_tasks.js
    │       └── 1770285164_updated_users.js
    └── public/
        ├── app.js
        ├── index.html
        └── style.css

test_user.txt: 主要记录了一些测试账户
主要文件在 public 中， go_backend 是用于尝试使用 go 语言而不使用 SDK 来编写后端逻辑，对该项目本身没有影响。

- 启动后端 pocketbase 服务： ./pocketbasse/pocketbase serve
- 启动前端服务：npx http-server public -p 8080