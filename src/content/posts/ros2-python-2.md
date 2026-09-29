---
title: 同样是 Python，为什么 ROS2 节点之间不能直接调用函数？
pubDate: 2026-09-29
description: 用奶茶店比喻讲清 ROS2 节点间的三种通信方式——话题、服务和参数，为什么不能像普通 Python 那样直接调用函数。
tags:
  - ROS2
  - Python
  - 机器人
---

# 同样是 Python，为什么 ROS2 节点之间不能直接调用函数？

## 开头

上一篇博客我写了 ROS2 代码为什么看起来不一样。核心观点是：普通 Python 是“我调用别人”，ROS2 是“别人调用我”。

这篇写另一个初学者绕不开的问题：**既然节点是独立进程，它们之间怎么说话？**

在普通 Python 里，这很简单——`import` 另一个模块，调用它的函数，拿返回值。但在 ROS2 里，你不能这样做。

为什么？

这篇用奶茶店把这件事讲清楚。每个比喻后面我都会跟一句技术翻译，确保你既记住了奶茶，也记住了 ROS2。

> 环境：Ubuntu 22.04 + ROS2 Humble + Python 3.10  
> 完整代码：[GitHub 链接]


## 一、普通 Python 的通信方式

先看普通 Python 怎么做。

```python
# module_a.py
def get_sensor_data():
    return 42

# module_b.py
from module_a import get_sensor_data

data = get_sensor_data()
print(data)
```

`module_b` 直接调用 `module_a` 的函数，拿到返回值，继续干活。

**特点**：

- 同步：调用后等返回
- 紧耦合：`module_b` 必须知道 `module_a` 的函数名
- 进程内：同一个 Python 进程里
- 直接：函数调用，拿返回值

记住这四条——等会儿在 ROS2 里它们会被逐条推翻，对比着看，差异就全出来了。

**奶茶店翻译**：这像后厨和点单员是同一个人。点单员直接问后厨“珍珠煮好了吗”，后厨回答“好了”。一句话的事，不需要对讲机。

**但 ROS2 里，点单员和后厨是两个人，不在同一个房间。**


## 二、ROS2 为什么不能这样

ROS2 的节点是**独立进程**。它们可能：

- 跑在同一台机器上，也可能跑在不同机器上
- 用 Python 写，也可能用 C++ 写
- 同时运行，也可能先后启动
- 一个节点崩溃，不影响其他节点

**技术翻译**：进程隔离意味着两个节点各有各的内存空间，互相看不见对方的函数和变量，自然也没有直接函数调用。你需要一种**跨进程通信机制**——说白了就是两个进程之间交换数据的办法：不直接调函数，而是把数据打包成消息发出去，对方收到后自己拆开处理。

**奶茶店翻译**：点单员和后厨是两个人，不在同一个房间。点单员不能直接喊“珍珠煮好了吗”，因为后厨可能听不见，可能不在，可能在忙别的。他们需要对讲机。

对讲机就是 ROS2 的通信机制。但“通信”不止一种方式，ROS2 提供了三种：

- **话题**：广播
- **服务**：点单
- **参数**：调配方


## 三、话题——广播模式

### 奶茶店版本

话题就像店里的广播。点单员对着对讲机喊“3 号桌要一杯珍珠奶茶”，所有在后厨的人都听到了。谁关心谁处理，不关心的继续干自己的活。

点单员不关心谁听到了，也不等回复。喊完就继续接下一单。

### 技术翻译

- 发布者/订阅者模型
- 异步：发布者不等订阅者
- 多对多：一个话题可以有多个发布者和多个订阅者
- 适合场景：传感器数据流、持续的状态广播

### 代码示例

```python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

# 发布者
class Talker(Node):
    def __init__(self):
        super().__init__('talker')
        self.pub = self.create_publisher(String, 'chat', 10)
        self.create_timer(1.0, self.timer_callback)

    def timer_callback(self):
        msg = String()
        msg.data = 'hello'
        self.pub.publish(msg)
        self.get_logger().info(f'发布: {msg.data}')

# 订阅者
class Listener(Node):
    def __init__(self):
        super().__init__('listener')
        self.sub = self.create_subscription(String, 'chat', self.callback, 10)

    def callback(self, msg):
        self.get_logger().info(f'收到: {msg.data}')
```

### 逐行拆解（和普通 Python 对着看）

**Talker（发布者）**：

- `super().__init__('talker')`：把自己注册进 ROS2 系统，节点名叫 talker。普通 Python 里类实例化只是内存里多个对象，谁也不知道它存在。
- `create_publisher(String, 'chat', 10)`：往 `chat` 频道挂一个广播喇叭，`10` 是队列深度（发得比收得快时最多先攒 10 条）。注意：你没有拿到任何"订阅者"的引用——不知道、也不需要知道谁在听。
- `create_timer(1.0, self.timer_callback)`：上一篇讲过的控制反转。不是你写 `while True` 循环，是框架每秒来调你一次。
- `self.pub.publish(msg)`：喊出去就完事，不等任何人。对比 `data = get_sensor_data()`——那是要停下来等返回值的。

**Listener（订阅者）**：

- `create_subscription(String, 'chat', self.callback, 10)`：声明"我听 `chat` 频道，消息来了调我的 callback"。
- `callback(self, msg)`：全文最"ROS2"的一行。**数据到了，是框架来调你这个函数，不是你伸手去拿。**你从"主动要数据的人"变成了"被通知的人"。

| | 普通 Python | ROS2 话题 |
|---|---|---|
| 数据怎么来 | `data = get_data()` 主动调 | 数据到了，框架调你的 callback |
| 要认识对方吗 | 必须 import 且知道函数名 | 双方只知道频道名 `chat` |
| 对方没启动 | `ImportError`，直接崩 | 发布者照发，订阅者上线后收后续消息 |
| 等不等结果 | 等返回值 | 发完就走 |

> 为了聚焦通信本身，本文示例都省略了 `main` 函数（`rclpy.init`、`spin` 和资源清理）。完整可运行代码放在 GitHub 仓库里，结构和上一篇的 hello_world 一样。

### 什么时候用

- 数据是持续的、流式的
- 发布者不关心谁收到
- 多个订阅者可能对同一数据感兴趣
- 例子：相机图像、激光雷达数据、机器人位姿

### 什么时候不该用

- 需要等一个回复才能继续
- 任务是一次性的，不是持续流


## 四、服务——点单模式

### 奶茶店版本

服务就像顾客点单。顾客问“你们有没有珍珠？”店员回答“有”或“没有”。顾客等回答，拿到回答才继续。

这是一问一答，有明确的请求和响应。

### 技术翻译

- 客户端/服务端模型
- 同步：客户端发请求后等响应
- 一对一：一个请求对应一个响应
- 适合场景：一次性查询、配置修改、触发某个动作

### 代码示例

```python
from example_interfaces.srv import AddTwoInts

# 服务端
class AddServer(Node):
    def __init__(self):
        super().__init__('add_server')
        self.srv = self.create_service(AddTwoInts, 'add_two_ints', self.add_callback)

    def add_callback(self, request, response):
        response.sum = request.a + request.b
        self.get_logger().info(f'{request.a} + {request.b} = {response.sum}')
        return response

# 客户端
class AddClient(Node):
    def __init__(self):
        super().__init__('add_client')
        self.client = self.create_client(AddTwoInts, 'add_two_ints')
        while not self.client.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('等待服务端...')
        self.send_request()

    def send_request(self):
        request = AddTwoInts.Request()
        request.a = 3
        request.b = 5
        self.future = self.client.call_async(request)
        self.future.add_done_callback(self.response_callback)

    def response_callback(self, future):
        response = future.result()
        self.get_logger().info(f'结果: {response.sum}')
```

### 逐行拆解（和普通 Python 对着看）

**AddServer（服务端）**：

- `create_service(AddTwoInts, 'add_two_ints', self.add_callback)`：挂出一个服务窗口，声明"加法业务在这里办"，窗口名叫 `add_two_ints`。
- `add_callback(self, request, response)`：和普通函数的两大区别：
  - 参数不是你挑的——`request` 是接口定义好的请求结构体（`a`、`b`），相当于顾客递进来的点单条
  - 结果不是 `return` 一个裸值——要填进 `response` 再还回去，相当于把找零写在小票上
- 这个函数同样不是你调的：请求到了，框架来调你。

**AddClient（客户端）**：

- `wait_for_service(timeout_sec=1.0)`：普通 Python 里 import 完函数就一定在；ROS2 的服务端是独立进程，可能还没启动，所以要先等窗口开张。
- `AddTwoInts.Request()`、`request.a = 3`：填点单条。字段名来自接口定义，不是随意的参数列表。
- `call_async(request)` + `add_done_callback(...)`：发出请求后**不原地干等**，而是"回复到了再叫我"。为什么不能像普通函数一样同步等？因为节点只有一个执行循环在转，你卡住等回复，节点上其他活就全停了。

**最关键的一个对比**：普通 Python 的 `data = get_sensor_data()` 一行就完成了"发请求 + 等结果"；ROS2 拆成两段——`call_async` 负责发，`response_callback` 负责收。不是 ROS2 爱啰嗦，是"别人调用我"的模型下，你没法原地等。

### 什么时候用

- 需要一问一答
- 任务是一次性的
- 客户端需要拿到结果才能继续
- 例子：查询地图信息、保存配置、触发校准

### 什么时候不该用

- 数据是持续流的
- 发布者不需要等回复
- 任务耗时很长（这时候用 Action 更合适，后面会写）


## 五、参数——调配方

### 奶茶店版本

参数就像店里的配方表。珍珠煮多久、糖放多少、冰加几块，这些不是“通信”，是配置。

店长可以随时调整配方，所有员工按新配方执行。顾客不关心配方，只关心奶茶好不好喝。

### 技术翻译

- 键值对，属于节点自身
- 不是节点之间的通信，是节点的运行时配置
- 可以在启动时设置，也可以运行时动态修改
- 适合场景：阈值、频率、路径、模式开关

### 代码示例

```python
class ConfigurableNode(Node):
    def __init__(self):
        super().__init__('configurable_node')

        # 声明参数
        self.declare_parameter('publish_frequency', 1.0)
        self.declare_parameter('message_content', 'hello')

        # 获取参数
        freq = self.get_parameter('publish_frequency').value

        self.pub = self.create_publisher(String, 'chat', 10)
        self.create_timer(freq, self.timer_callback)

    def timer_callback(self):
        msg = String()
        msg.data = self.get_parameter('message_content').value  # 每次发布前读最新值
        self.pub.publish(msg)
```

### 逐行拆解（和普通 Python 对着看）

- `declare_parameter('publish_frequency', 1.0)`：普通 Python 里 `self.freq = 1.0` 赋值就能用；ROS2 参数要先**声明**——登记"我这个节点有这个配置项，默认 1.0"。不声明就 get 或 set，都会报错（第七节的错误四就是它）。
- `get_parameter('publish_frequency').value`：普通 Python 直接读 `self.freq`；这里要多敲一层 `.value`——参数系统存的是"带类型的值"，`.value` 才把真正的数字取出来。
- `msg.data = self.get_parameter('message_content').value`：**用的时候现读**。参数值变了不会自动同步到你的变量里，这正是下面"运行时修改"要讲的那件事。

**最关键的一个对比**：普通 Python 的配置就是普通变量，赋值完随便读；ROS2 的参数是登记在节点名下的键值对，有自己的声明规则和读写接口——本质上像节点自带的迷你配置服务。第四节学的服务知识在这里直接复用：`ros2 param set` 底层就是在调这个节点的 `set_parameters` 服务。

运行时修改：

```bash
ros2 param set /configurable_node publish_frequency 2.0
ros2 param set /configurable_node message_content "world"
```

> **重要**：`ros2 param set` 只是更新了节点里参数存的值，代码要"用的时候去读"，新值才会生效。上面 `timer_callback` 每次发布前都重新读 `message_content`，所以 set 完下一条消息就变了；而 `publish_frequency` 不行——timer 的频率在 `create_timer` 那一刻就定死了，set 之后没有任何代码去重建 timer，改了也不会变（CLI 还会返回成功，更具迷惑性）。想让参数一变就自动触发逻辑（比如运行时改频率），需要注册参数回调，属于进阶内容。现在先记住这句：**set 了 ≠ 生效，读了才生效**。

### 什么时候用

- 节点的行为需要可配置
- 同一个节点在不同场景下需要不同设置
- 不想改代码就能调整行为
- 例子：发布频率、检测阈值、目标位置

### 什么时候不该用

- 数据需要在节点之间传递
- 需要一对多广播
- 需要请求/响应


## 六、三种机制对比

| 维度 | 话题 | 服务 | 参数 |
|---|---|---|---|
| 模型 | 发布/订阅 | 请求/响应 | 键值对 |
| 同步/异步 | 异步 | 同步 | —（节点自身操作） |
| 方向 | 多对多 | 一对一 | 节点自身 |
| 是否等回复 | 不等 | 等 | —（不属于节点间通信） |
| 适合场景 | 持续数据流 | 一次性任务 | 运行时配置 |
| 奶茶店翻译 | 广播 | 点单 | 调配方 |
| 典型例子 | 相机图像 | 查询地图 | 发布频率 |


## 七、常见错误

**错误一：用话题做请求/响应**

发布一个“请求”话题，等一个“响应”话题。这本质上是在用话题模拟服务，复杂且容易出错。需要一问一答，直接用服务。

**错误二：用服务传持续数据**

服务是一次性的，不适合高频数据流。传感器数据用话题。

**错误三：把参数当通信手段**

参数是节点自己的配置，不是用来在节点之间传数据的。如果你想“通知”另一个节点某个值变了，应该用话题，不是参数。

**错误四：忘了参数要先声明**

ROS2 里参数必须先 `declare_parameter` 才能 `get_parameter`。不声明就取，会报错。


## 八、回到第一篇的核心观点

第一篇讲的是**控制反转**：不是你调用框架，是框架调用你。

这一篇讲的是**消息传递**：不是你调用另一个节点的函数，是你发消息，框架负责传递。

两者合起来，就是 ROS2 的编程模型：

> **你声明要做什么，框架负责什么时候做、怎么传。**

**奶茶店翻译**：你不是自己冲奶茶，也不是直接指挥后厨。你开了家店，定了规矩，店长负责调度，对讲机负责传话。


## 九、对学习者的启示

- 看到“持续”“流”“广播”，想话题
- 看到“查询”“触发”“一次性”，想服务
- 看到“配置”“阈值”“频率”，想参数
- 不确定的时候，先问：这个数据是持续流的，还是一问一答的，还是配置？


## 结尾

话题、服务、参数不是三个孤立的知识点，是三种解决不同问题的工具。选对了，系统简洁可靠；选错了，怎么调都别扭。

奶茶店类比能帮你理解这三种通信方式的基本逻辑，但它不能帮你理解 QoS 协商、服务超时处理、参数回调这些细节——比如上面"改了发布频率却不变"的问题，完整解法就是参数回调。那些是另一层东西，需要另外的类比或者直接读文档。

下一篇我会写 TF2——机器人怎么理解“杯子在我的左边”这句话。

如果文中有理解错误的地方，欢迎指出。

**环境信息**：
- Ubuntu 22.04
- ROS2 Humble
- Python 3.10
- 完整代码：[GitHub 链接]


## 附：三种通信方式速查表

| 场景 | 用哪个 | 为什么 |
|---|---|---|
| 相机持续发图像 | 话题 | 持续数据流，多对多 |
| 查询地图上某个点是否可通行 | 服务 | 一问一答，需要结果 |
| 调整检测阈值 | 参数 | 节点自身配置 |
| 机器人持续广播位姿 | 话题 | 持续状态广播 |
| 触发一次校准 | 服务 | 一次性任务 |
| 设置发布频率 | 参数 | 启动时加载（运行时改需参数回调） |