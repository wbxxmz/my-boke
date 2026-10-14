import rclpy
from rclpy.node import Node
from rclpy.time import Time
from tf2_ros import Buffer, TransformListener, TransformException


class FrameListener(Node):
    """TF2 监听者：每秒查询一次 camera_link 在 base_link 下的变换（博客第三篇）"""

    def __init__(self):
        super().__init__('frame_listener')                        # 挂工牌：节点名 frame_listener
        self.tf_buffer = Buffer()                                 # 本地缓存
        self.tf_listener = TransformListener(self.tf_buffer, self)   # 后台订阅 /tf，收到的变换存进缓存
        self.create_timer(1.0, self.query)                        # 排班：每秒查一次

    def query(self):
        try:
            transform = self.tf_buffer.lookup_transform(
                'base_link',                                      # 目标坐标系：我要它在这下面的位置
                'camera_link',                                    # 源坐标系：数据原来挂在它下面
                Time()                                            # 零时间 = 最新可用的变换
            )
            self.get_logger().info(f'平移: {transform.transform.translation}')
        except TransformException as e:
            self.get_logger().warn(f'查询失败: {e}')


def main():
    rclpy.init()
    node = FrameListener()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():        # 第一篇第六步的坑：Ctrl+C 时 spin 已先关过一次，裸调会报 already called
            rclpy.shutdown()


if __name__ == '__main__':
    main()
