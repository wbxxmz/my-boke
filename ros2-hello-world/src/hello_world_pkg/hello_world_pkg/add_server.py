import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts


class AddServer(Node):
    """服务端：提供两个整数相加的服务"""

    def __init__(self):
        super().__init__('add_server')                          # 挂工牌，节点名 add_server
        self.srv = self.create_service(
            AddTwoInts, 'add_two_ints', self.add_callback)      # 挂出服务窗口

    def add_callback(self, request, response):                 # 请求到了，框架来调我
        response.sum = request.a + request.b                   # 把结果写在小票上
        self.get_logger().info(
            f'{request.a} + {request.b} = {response.sum}')     # 用对讲机记一笔
        return response                                         # 把小票递回窗口


def main():
    rclpy.init()
    node = AddServer()
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
