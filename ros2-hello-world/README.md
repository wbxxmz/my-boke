# ros2-hello-world

ROS2 学习博客系列的配套代码：

1. [同样是 Python，为什么 ROS2 代码看起来完全不一样](https://wbxxmz.github.io/my-boke/posts/ros2-python-diff/)——从函数到类、从顺序执行到回调驱动
2. [同样是 Python，ROS2 节点之间怎么说话：话题、服务、参数](https://wbxxmz.github.io/my-boke/posts/ros2-python-2/)——节点间的三种通信方式

同一个需求——每隔 1 秒打印 `hello world`——分别用普通 Python 和 ROS2 各写一遍，仓库里的每一行代码都和博客正文一一对应。

## 文件结构

```
ros2-hello-world/
├── hello.py                                # 普通版：while + print（对应第一篇第一~四步）
└── src/
    └── hello_world_pkg/                    # ROS2 版：节点 + 定时器回调
        ├── hello_world_pkg/
        │   ├── __init__.py
        │   ├── hello_world_node.py         # 第一篇：节点本体（对应第一~六步）
        │   ├── talker.py                   # 第二篇：话题发布者（广播）
        │   ├── listener.py                 # 第二篇：话题订阅者（收听）
        │   ├── add_server.py               # 第二篇：服务端（点单窗口）
        │   ├── add_client.py               # 第二篇：客户端（拿号排队）
        │   └── configurable_node.py        # 第二篇：参数（调配方）
        ├── package.xml
        ├── resource/
        │   └── hello_world_pkg
        ├── setup.cfg
        └── setup.py                        # entry_points 注册了 hello_world 命令
```

## 环境信息

> 待核实：在装好的 Ubuntu 里跑下面三条命令，把真实结果填进表格（博客待办第 ④ 项）
>
> - `lsb_release -a`
> - `ros2 doctor`
> - `python3 --version`

| 项目 | 版本 |
|------|------|
| 系统 | Ubuntu 22.04 |
| ROS2 | Humble |
| Python | 3.10 |

## 运行普通版

```bash
python3 hello.py
```

> ⌨️ 待补：`python3 hello.py` 的真实终端输出（每秒滚动打印一行 hello world）

## 构建并运行 ROS2 版

```bash
# 1. source ROS2 环境
source /opt/ros/humble/setup.bash

# 2. 在仓库根目录构建
cd ros2-hello-world
colcon build

# 3. source 工作空间（新终端跑之前也要先 source）
source install/setup.bash

# 4. 运行节点
ros2 run hello_world_pkg hello_world
```

> ⌨️ 待补：`ros2 run` 的真实日志输出，形如下面这样（自带时间戳和节点名，正好佐证博客第五步讲的 logger）：
>
> ```
> [INFO] [1726999999.999999999] [hello_world]: hello world
> ```

## 确认节点在跑

新开一个终端（记得先 source）：

```bash
ros2 node list
```

> 📷 截图待补：输出里能看到 `/hello_world`

## 博客里踩过的坑，仓库里可以直接复现

1. `super.__init__` 少括号 → 节点名不注册（博客第三步）
   把 `hello_world_node.py` 里的 `super().__init__('hello_world')` 改成 `super.__init__('hello_world')`，重新 build 后跑 `ros2 node list`，节点名就对不上了。

2. 改代码不 build → 行为没变（博客第七步）
   - 把 `hello_world_node.py` 里的打印内容改成 `hello ROS2`
   - 直接 `ros2 run hello_world_pkg hello_world` → 打印的还是旧的
   - `colcon build && source install/setup.bash` 之后再跑 → 才变成新的

> 📷 截图待补：改代码不 build 的「翻车现场」（失败的截图比成功更有说服力）

## 退出时的清理

节点运行中按 `Ctrl+C`，会触发 `KeyboardInterrupt`，`finally` 里的 `destroy_node()` + `shutdown()` 兜底清理（博客第六步）。

> 📷 截图待补：按 Ctrl+C 后终端打印的清理日志
