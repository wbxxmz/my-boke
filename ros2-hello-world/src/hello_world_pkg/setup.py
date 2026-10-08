from setuptools import find_packages, setup

package_name = 'hello_world_pkg'

setup(
    name=package_name,
    version='0.0.1',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='闫家豪',
    maintainer_email='1461766338@qq.com',
    description='博客《同样是Python，为什么ROS2代码看起来完全不一样》配套示例',
    license='Apache-2.0',
    entry_points={
        'console_scripts': [
            # 第一篇博客的示例
            'hello_world = hello_world_pkg.hello_world_node:main',
            # 第二篇博客：话题
            'talker = hello_world_pkg.talker:main',
            'listener = hello_world_pkg.listener:main',
            # 第二篇博客：服务
            'add_server = hello_world_pkg.add_server:main',
            'add_client = hello_world_pkg.add_client:main',
            # 第二篇博客：参数
            'configurable_node = hello_world_pkg.configurable_node:main',
        ],
    },
)
