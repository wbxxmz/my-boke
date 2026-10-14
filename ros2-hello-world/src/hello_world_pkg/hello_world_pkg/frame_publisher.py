import rclpy
from rclpy.node import Node
from tf2_ros import TransformBroadcaster
from geometry_msgs.msg import TransformStamped


class FramePublisher(Node):
    """TF2 广播者：每 0.1 秒广播一次 base_link -> camera_link 的变换（博客第三篇）"""

    def __init__(self):
        super().__init__('frame_publisher')               # 挂工牌：节点名 frame_publisher
        self.tf_broadcaster = TransformBroadcaster(self)   # 给节点装一个"广播器"
        self.create_timer(0.1, self.broadcast)             # 排班：每 0.1 秒广播一次

    def broadcast(self):
        t = TransformStamped()                             # 一条"亲子关系记录"
        t.header.stamp = self.get_clock().now().to_msg()   # 盖时间戳：这条记录是什么时候量的
        t.header.frame_id = 'base_link'                    # 父坐标系
        t.child_frame_id = 'camera_link'                   # 子坐标系
        t.transform.translation.x = 0.1                    # 相机在基座上方 20cm、前方 10cm
        t.transform.translation.y = 0.0
        t.transform.translation.z = 0.2
        t.transform.rotation.w = 1.0                      # 没有旋转（单位四元数）
        self.tf_broadcaster.sendTransform(t)               # 把 t 发出去


def main():
    rclpy.init()
    node = FramePublisher()
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
