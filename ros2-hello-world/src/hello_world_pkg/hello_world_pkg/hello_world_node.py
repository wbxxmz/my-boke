import rclpy
from rclpy.node import Node


class HelloWorld(Node):
    """最简单的 ROS2 节点：每隔 1 秒打印一次 hello world"""

    def __init__(self):
        # 注意：super 后面的括号不能少，少了节点名根本不会注册（博客第三步踩过的坑）
        super().__init__('hello_world')               # 员工的工牌：注册节点名
        self.create_timer(1.0, self.timer_callback)   # 排班表：登记每 1 秒叫一次

    def timer_callback(self):
        self.get_logger().info('hello world')         # 对讲机汇报：自带时间戳和节点名


def main():
    rclpy.init()                    # 开店之前，先通水通电
    node = HelloWorld()
    try:
        rclpy.spin(node)            # 店长上班：事件循环，到点叫人干活
    except KeyboardInterrupt:
        pass                        # Ctrl+C 走这里
    finally:
        node.destroy_node()         # 交回工牌：销毁节点，释放定时器等资源
        rclpy.shutdown()            # 关店断电：关闭全局上下文，释放 DDS 底层资源


if __name__ == '__main__':
    main()
