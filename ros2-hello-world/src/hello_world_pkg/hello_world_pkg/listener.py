import rclpy
from rclpy.node import Node
from std_msgs.msg import String


class Listener(Node):
    """话题订阅者：监听 chat 频道，收到消息就打印"""

    def __init__(self):
        super().__init__('listener')                            # 挂工牌，节点名 listener
        self.sub = self.create_subscription(
            String, 'chat', self.callback, 10)                  # 声明：我听 chat 频道

    def callback(self, msg):                                    # 数据到了，框架来调我
        self.get_logger().info(f'收到: {msg.data}')             # 从纸条上读内容


def main():
    rclpy.init()
    node = Listener()
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
