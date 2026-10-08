import rclpy
from rclpy.node import Node
from std_msgs.msg import String


class Talker(Node):
    """话题发布者：每秒往 chat 频道发一条 hello"""

    def __init__(self):
        super().__init__('talker')                              # 挂工牌，节点名 talker
        self.pub = self.create_publisher(String, 'chat', 10)    # 往 chat 频道挂广播喇叭
        self.create_timer(1.0, self.timer_callback)             # 排班：每秒喊一次

    def timer_callback(self):
        msg = String()                                          # 拿一张空白纸条
        msg.data = 'hello'                                      # 在纸条上写内容
        self.pub.publish(msg)                                   # 喊出去，不等任何人
        self.get_logger().info(f'发布: {msg.data}')             # 用对讲机记一笔


def main():
    rclpy.init()
    node = Talker()
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
