/* ============================================================
 * Surayson 下载站 · 下载目录数据模块（JSON 结构）
 *
 * 说明：以 JS 模块形式提供。页面直接以 file:// 打开时，
 * 浏览器会拦截对本地文件的 fetch，因此数据通过 <script>
 * 挂载到 window，同时兼容 http(s) 部署，无需构建步骤。
 *
 * 字段：
 *   updated          最近更新日期
 *   groups[]         分组
 *     id / no / title / desc
 *     items[]        下载条目
 *       title    文件名
 *       desc     说明文字
 *       icon     图标类型（对应 style.css 中 .icon-* 类）
 *       platform 平台文本（标签匹配：win / mac / linux / 全平台）
 *       size     展示用大小
 *       bytes    字节数（用于资源总量统计）
 *       url      下载直链
 * ============================================================ */

window.SURAYSON_DATA = {
    updated: "2026-09-20",
    groups: [
        {
            id: "ide",
            no: "01",
            title: "集成开发环境",
            desc: "一体化 IDE：代码编辑、编译、烧录与调试",
            items: [
                {
                    title: "stm32cubeide_2.2.0_Windows_x86_64.exe",
                    desc: "STM32CubeIDE 2.2.0 （Windows x64）",
                    icon: "exe",
                    platform: "Windows x64",
                    size: "860.5 MB",
                    bytes: 902335048,
                    url: "https://cloud-sumi-use.obs.cn-east-3.myhuaweicloud.com/stm32tools/stm32cubeide_2.2.0_Windows_x86_64.exe",
                },
                {
                    title: "stm32cubemx_2.2.0_MacOS_aarch64.dmg",
                    desc: "STM32CubeIDE 2.2.0（macOS · Apple Silicon）",
                    icon: "dmg",
                    platform: "macOS · ARM64",
                    size: "901.5 MB",
                    bytes: 945272017,
                    url: "https://cloud-sumi-use.obs.cn-east-3.myhuaweicloud.com/stm32tools/stm32cubemx_2.2.0_MacOS_aarch64.dmg",
                },
            ],
        },
        {
            id: "cubemx",
            no: "02",
            title: "STM32CubeMX",
            desc: "图形化外设配置与工程代码生成",
            items: [
                {
                    title: "stm32cubemx_setup_Windows_x86_64.exe",
                    desc: "Windows 安装程序（x86_64）",
                    icon: "exe-mx",
                    platform: "Windows x64",
                    size: "550.2 MB",
                    bytes: 576924784,
                    url: "https://cloud-sumi-use.obs.cn-east-3.myhuaweicloud.com/stm32tools/stm32cubemx_setup_Windows_x86_64.exe",
                },
                {
                    title: "stm32cubemx_setup_MacOS_aarch64.zip",
                    desc: "macOS 压缩包（Apple Silicon）",
                    icon: "zip",
                    platform: "macOS · ARM64",
                    size: "577.5 MB",
                    bytes: 605591124,
                    url: "https://cloud-sumi-use.obs.cn-east-3.myhuaweicloud.com/stm32tools/stm32cubemx_setup_MacOS_aarch64.zip",
                },
            ],
        },
        {
            id: "proteus",
            no: "03",
            title: "Proteus 仿真",
            desc: "电路原理图仿真与 PCB 设计",
            items: [
                {
                    title: "Proteus_9.0.iso",
                    desc: "Proteus 9.0 电路仿真与 PCB 设计套件",
                    icon: "iso",
                    platform: "Windows x64",
                    size: "781.0 MB",
                    bytes: 818970624,
                    url: "https://cloud-sumi-use.obs.cn-east-3.myhuaweicloud.com/stm32tools/Proteus_9.0.iso",
                },
            ],
        },
        {
            id: "tools",
            no: "04",
            title: "调试与驱动",
            desc: "ST-Link 调试器驱动及配套工具",
            items: [
                {
                    title: "stlink.7z",
                    desc: "ST-Link 调试器驱动与配套烧录工具",
                    icon: "7z",
                    platform: "全平台",
                    size: "4.8 MB",
                    bytes: 5051455,
                    url: "https://cloud-sumi-use.obs.cn-east-3.myhuaweicloud.com/stm32tools/stlink.7z",
                },
            ],
        },
    ],
};
