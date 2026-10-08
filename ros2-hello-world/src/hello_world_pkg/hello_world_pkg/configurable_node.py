import rclpy
from rclpy.node import Node
from std_msgs.msg import String


class ConfigurableNode(Node):
    """带参数的节点：发布频率和内容都可通过参数配置"""

    def __init__(self):
        super().__init__('configurable_node')                   # 挂工牌

        # 声明参数（不声明就用，会报错）
        self.declare_parameter('publish_frequency', 1.0)        # 发布频率，默认 1.0
        self.declare_parameter('message_content', 'hello')      # 发布内容，默认 hello

        # 获取参数
        freq = self.get_parameter('publish_frequency').value    # 读出发布频率
        self.count = 0                                          # 序号，方便截图数频率

        self.pub = self.create_publisher(String, 'chat', 10)    # 往 chat 频道挂广播喇叭
        self.create_timer(freq, self.timer_callback)            # 按读出的频率排班

    def timer_callback(self):
        self.count += 1
        msg = String()                                          # 拿一张空白纸条
        msg.data = self.get_parameter(
            'message_content').value                            # 每次发布前读最新值
        self.pub.publish(msg)                                   # 喊出去
        now = time.strftime('%H:%M:%S')                         # 可读时间，截图里能直接看间隔
        self.get_logger().info(f'[{now}] #{self.count} 发布: {msg.data}')  # 用对讲机记一笔


def main():
    rclpy.init()
    node = ConfigurableNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == '__main__':
    main()
