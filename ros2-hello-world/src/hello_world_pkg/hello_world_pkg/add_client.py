import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts


class AddClient(Node):
    """服务客户端：调用 add_two_ints 服务，计算 3 + 5"""

    def __init__(self):
        super().__init__('add_client')                          # 挂工牌，节点名 add_client
        self.client = self.create_client(
            AddTwoInts, 'add_two_ints')                        # 找到 add_two_ints 窗口
        while not self.client.wait_for_service(timeout_sec=1.0):  # 窗口没开张，每隔1秒问一次
            self.get_logger().info('等待服务端...')
        self.send_request()                                     # 窗口开了，进去办业务

    def send_request(self):
        request = AddTwoInts.Request()                          # 拿一张空白点单条
        request.a = 3                                           # 填 a=3
        request.b = 5                                           # 填 b=5
        self.future = self.client.call_async(request)           # 把点单条递进去，不原地等
        self.future.add_done_callback(self.response_callback)   # 小票出好了再叫我

    def response_callback(self, future):                        # 小票出好了，框架来叫我
        response = future.result()                              # 从小票里取出结果
        self.get_logger().info(f'结果: {response.sum}')         # 看一眼找零


def main():
    rclpy.init()
    node = AddClient()
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
