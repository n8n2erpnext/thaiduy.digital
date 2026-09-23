import type { Locale } from './config'

export const messages = {
  en: {
    meta: {
      title: 'Thái Duy — Living Systems Lab',
      description: 'A living public surface for projects, infrastructure, field notes and machine senses.',
    },
    header: {
      lab: 'systems lab',
      nav: { projects: 'Projects', writing: 'Writing', stack: 'Stack', about: 'About' },
      primaryNav: 'Primary navigation', entityState: 'Entity state', bootstrap: 'BOOTSTRAP',
      language: 'VI', languageTitle: 'Switch to Vietnamese', homeLabel: 'Thái Duy home',
    },
    footerMenu: {
      navigate: 'Navigate', elsewhere: 'Elsewhere', legal: 'Legal',
      home: 'Home', projects: 'Projects', writing: 'Writing', stack: 'Stack', about: 'About', guestbook: 'Discuss', music: 'Music Sensor',
      terms: 'Terms of Service', privacy: 'Privacy Policy', github: 'GitHub',
    },
    home: {
      eyebrow: 'THÁI DUY / LIVING SYSTEMS LAB',
      title: 'A public surface for systems that are actually alive.',
      lede: 'Projects, infrastructure, machine senses and field notes — presented as one living digital organism. Motion comes from real state, not decorative noise.',
    },
    music: {
      aria: 'Sentinel Music Sensor', kicker: 'SENTINEL / MUSIC SENSOR', title: 'Acoustic organ', state: 'RESTING',
      shellTitle: 'Sentinel Music Sensor public state.', waveAria: 'Music sensor waveform',
      note: 'Genre, style, arrangement and acoustic features are governed by Music Cortex; the public surface stays quiet when no real playback signal is active.',
      layers: { bass: 'bass', lowMid: 'low-mid', mid: 'mid', vocal: 'vocal', presence: 'presence', air: 'air' },
      indicator: { resting: 'resting', listening: 'listening', humming: 'humming', notConnected: 'sensor not connected', hummingTitle: 'Sentinel is humming…', title: 'Sentinel Music Sensor' },
      explorer: {
        cardTitle: 'Inside the listening loop', open: 'Inspect Music Sensor',
        semantic: 'Semantic ear', acoustic: 'Acoustic organ', cortex: 'Music Cortex', afterglow: 'Afterglow',
        eyebrow: 'SENTINEL / MUSIC SENSOR', pageTitle: 'How Sentinel listens, understands and hums.',
        lede: 'A public view of the listening loop: semantic evidence, acoustic shape, governed interpretation, abstract memory and self-composed humming.',
        live: 'LIVE INTERPRETATION', pipeline: 'LISTENING LOOP', knowledge: 'MUSIC KNOWLEDGE', composition: 'SELF-COMPOSITION',
        noComposition: 'Sentinel is not composing right now. The composer wakes only during autonomous humming.',
        privacy: 'Heard melodies are never stored or replayed. Only abstract musical features may influence later humming.',
      },
    },
    projectSurface: {
      aria: 'Project systems surface', sourceOff: 'STATE SOURCE · OFFLINE', sourceLive: 'LIVE · STACK', runtime: 'PUBLIC RUNTIME', notConnected: 'NOT CONNECTED', states: { online: 'ONLINE', degraded: 'DEGRADED', paused: 'PAUSED', private: 'PRIVATE', unknown: 'UNKNOWN', offline: 'OFFLINE' },
      items: [
        { id: 'lightbi', name: 'LightBI', role: 'Local-first BI / governed analytics', summary: 'Turns raw operational data into trusted analysis while keeping data understanding, governance and presentation separate.', plane: 'DATA / SEMANTIC', mode: 'PRODUCT SYSTEM' },
        { id: 'light-remote', name: 'Light Remote', role: 'Remote control plane', summary: 'A permission-aware bridge from AI clients to authorized machines, with policy, approvals and device-local execution boundaries.', plane: 'REMOTE / CONTROL', mode: 'INFRA SYSTEM' },
        { id: 'sentinel', name: 'Sentinel', role: 'Autonomous security sense', summary: 'Learns from network and system signals, watches for anomalies, and turns infrastructure noise into understandable observations.', plane: 'SECURITY / SENSE', mode: 'LEARNING SYSTEM' },
        { id: 'n8n2erpnext', name: 'n8n2erpnext', role: 'Workflow circulation', summary: 'The automation backbone connecting operational systems, scheduled work and service-to-service movement across the ecosystem.', plane: 'AUTOMATION / FLOW', mode: 'WORKFLOW SYSTEM' },
      ],
    },
    section: {
      source: 'CONTENT SOURCE', managed: 'CONTROL REGISTRY', notConnected: 'NOT CONNECTED', empty: 'This surface is intentionally empty until its real content/state source is connected.', back: 'Return to living field',
    },
    sections: {
      projects: { eyebrow: 'PROJECTS / SYSTEMS', title: 'Systems with a pulse', copy: 'Projects will combine durable context with their sanitized public runtime state.' },
      writing: { eyebrow: 'WRITING / FIELD NOTES', title: 'Long-form thinking', copy: 'Architecture notes, principles and lessons learned will live here without competing with live system state.' },
      stack: { eyebrow: 'STACK / TOPOLOGY', title: 'Infrastructure as a place', copy: 'A safe public projection of nodes, services and relationships — never the private control plane.' },
      about: { eyebrow: 'ABOUT / PRACTICE', title: 'I build systems that have to keep working.', copy: 'thaiduy.digital is the public surface of that practice — projects, infrastructure, experiments and field notes, shown with enough truth to be useful without turning the website into a control plane.' },
      guestbook: { eyebrow: 'DISCUSS / COMMUNITY', title: 'A small place for useful conversations.', copy: 'Start a topic, ask a question, reply to someone or leave a thought. Reading is public; posting uses Google sign-in and moderated messages.' },
    },
  },
  vi: {
    meta: {
      title: 'Thái Duy — Phòng Lab Hệ Thống Sống',
      description: 'Không gian công khai cho dự án, hạ tầng, ghi chép kỹ thuật và các tín hiệu từ những hệ thống đang vận hành.',
    },
    header: {
      lab: 'phòng lab hệ thống',
      nav: { projects: 'Dự án', writing: 'Bài viết', stack: 'Hạ tầng', about: 'Giới thiệu' },
      primaryNav: 'Điều hướng chính', entityState: 'Trạng thái thực thể', bootstrap: 'KHỞI TẠO',
      language: 'EN', languageTitle: 'Chuyển sang tiếng Anh', homeLabel: 'Trang chủ Thái Duy',
    },
    footerMenu: {
      navigate: 'Điều hướng', elsewhere: 'Liên kết khác', legal: 'Pháp lý',
      home: 'Trang chủ', projects: 'Dự án', writing: 'Bài viết', stack: 'Hạ tầng', about: 'Giới thiệu', guestbook: 'Discuss', music: 'Music Sensor',
      terms: 'Điều khoản dịch vụ', privacy: 'Chính sách quyền riêng tư', github: 'GitHub',
    },
    home: {
      eyebrow: 'THÁI DUY / PHÒNG LAB HỆ THỐNG SỐNG',
      title: 'Một không gian công khai cho những hệ thống đang thực sự vận hành.',
      lede: 'Dự án, hạ tầng, các cảm biến và ghi chép kỹ thuật — cùng hiện diện trong một hệ sinh thái số đang vận hành. Mọi chuyển động đều đến từ trạng thái thật, không phải hiệu ứng trang trí.',
    },
    music: {
      aria: 'Sentinel Music Sensor', kicker: 'SENTINEL / MUSIC SENSOR', title: 'Bộ cảm biến âm thanh', state: 'ĐANG NGHỈ',
      shellTitle: 'Trạng thái công khai của Sentinel Music Sensor.', waveAria: 'Dạng sóng của cảm biến âm nhạc',
      note: 'Genre, style, arrangement và các đặc trưng âm học do Music Cortex quản trị; giao diện công khai sẽ giữ yên khi không có tín hiệu phát nhạc thật.',
      layers: { bass: 'trầm', lowMid: 'trầm-trung', mid: 'trung', vocal: 'giọng hát', presence: 'độ hiện diện', air: 'dải cao' },
      indicator: { resting: 'đang nghỉ', listening: 'đang nghe', humming: 'đang ngân nga', notConnected: 'cảm biến chưa kết nối', hummingTitle: 'Sentinel đang ngân nga…', title: 'Sentinel Music Sensor' },
      explorer: {
        cardTitle: 'Bên trong vòng lắng nghe', open: 'Mở Music Sensor',
        semantic: 'Bộ đọc ngữ nghĩa', acoustic: 'Bộ cảm biến âm thanh', cortex: 'Music Cortex', afterglow: 'Dư âm',
        eyebrow: 'SENTINEL / MUSIC SENSOR', pageTitle: 'Cách Sentinel lắng nghe, hiểu và tự ngân nga.',
        lede: 'Một góc nhìn công khai về vòng lắng nghe: bằng chứng ngữ nghĩa, tín hiệu âm học, diễn giải có kiểm soát, ký ức trừu tượng và phần ngân nga do Sentinel tự sáng tác.',
        live: 'DIỄN GIẢI TRỰC TIẾP', pipeline: 'VÒNG LẮNG NGHE', knowledge: 'TRI THỨC ÂM NHẠC', composition: 'TỰ SÁNG TÁC',
        noComposition: 'Sentinel hiện không sáng tác. Bộ sáng tác chỉ hoạt động khi nó bắt đầu tự ngân nga.',
        privacy: 'Giai điệu đã nghe không bao giờ được lưu hay phát lại. Chỉ các đặc trưng âm nhạc trừu tượng mới có thể ảnh hưởng lần ngân nga sau.',
      },
    },
    projectSurface: {
      aria: 'Trạng thái công khai của dự án', sourceOff: 'NGUỒN TRẠNG THÁI · OFFLINE', sourceLive: 'LIVE · STACK', runtime: 'RUNTIME CÔNG KHAI', notConnected: 'CHƯA KẾT NỐI', states: { online: 'ĐANG CHẠY', degraded: 'SUY GIẢM', paused: 'TẠM DỪNG', private: 'RIÊNG TƯ', unknown: 'CHƯA RÕ', offline: 'OFFLINE' },
      items: [
        { id: 'lightbi', name: 'LightBI', role: 'BI local-first / phân tích có quản trị', summary: 'Biến dữ liệu vận hành thô thành phân tích đáng tin cậy, đồng thời tách rõ hiểu dữ liệu, quản trị và trình bày.', plane: 'DỮ LIỆU / NGỮ NGHĨA', mode: 'SẢN PHẨM' },
        { id: 'light-remote', name: 'Light Remote', role: 'Lớp điều khiển từ xa', summary: 'Cầu nối kiểm soát quyền truy cập từ AI client tới máy đã được cấp phép, với policy, approval và ranh giới thực thi ngay tại thiết bị.', plane: 'REMOTE / ĐIỀU KHIỂN', mode: 'HẠ TẦNG' },
        { id: 'sentinel', name: 'Sentinel', role: 'Hệ cảm biến an ninh tự chủ', summary: 'Học từ tín hiệu mạng và hệ thống, theo dõi các dấu hiệu bất thường và biến nhiễu hạ tầng thành những quan sát dễ hiểu.', plane: 'AN NINH / GIÁC QUAN', mode: 'AGENT HỌC' },
        { id: 'n8n2erpnext', name: 'n8n2erpnext', role: 'Điều phối workflow', summary: 'Xương sống tự động hóa kết nối các hệ vận hành, tác vụ theo lịch và luồng giao tiếp giữa các service.', plane: 'TỰ ĐỘNG HÓA / LUỒNG', mode: 'WORKFLOW' },
      ],
    },
    section: {
      source: 'NGUỒN NỘI DUNG', managed: 'CONTROL REGISTRY', notConnected: 'CHƯA KẾT NỐI', empty: 'Khu vực này được để trống có chủ ý cho đến khi nguồn nội dung hoặc trạng thái thật được kết nối.', back: 'Quay lại trang chính',
    },
    sections: {
      projects: { eyebrow: 'DỰ ÁN / HỆ THỐNG', title: 'Những hệ thống đang vận hành', copy: 'Mỗi dự án kết hợp phần mô tả lâu dài với trạng thái runtime công khai sau khi đã lược bỏ dữ liệu nhạy cảm.' },
      writing: { eyebrow: 'BÀI VIẾT / GHI CHÉP KỸ THUẬT', title: 'Ghi chép chuyên sâu', copy: 'Ghi chú kiến trúc, nguyên tắc và những bài học được lưu lại ở đây, tách khỏi phần trạng thái live của hệ thống.' },
      stack: { eyebrow: 'HẠ TẦNG / TOPOLOGY', title: 'Hạ tầng như một không gian có thể khám phá', copy: 'Một góc nhìn công khai, an toàn về node, service và các mối quan hệ — không phơi bày control plane riêng tư.' },
      about: { eyebrow: 'GIỚI THIỆU / CÁCH LÀM', title: 'Tôi xây những hệ thống phải vận hành bền bỉ.', copy: 'thaiduy.digital là nơi công khai cách tôi làm việc — dự án, hạ tầng, thử nghiệm và ghi chép kỹ thuật, đủ thật để hữu ích nhưng không biến website thành control plane.' },
      guestbook: { eyebrow: 'DISCUSS / TRAO ĐỔI', title: 'Một góc nhỏ cho những cuộc trao đổi hữu ích.', copy: 'Mở chủ đề, đặt câu hỏi, trả lời một người hoặc góp một ý. Ai cũng đọc được; muốn đăng cần đăng nhập Google và nội dung sẽ được duyệt.' },
    },
  },
} as const

export type Messages = (typeof messages)[Locale]
