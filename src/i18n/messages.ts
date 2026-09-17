import type { Locale } from './config'

export const messages = {
  en: {
    meta: {
      title: 'Thái Duy — Living Systems Lab',
      description: 'A living public surface for projects, infrastructure, field notes and machine senses.',
    },
    header: {
      lab: 'systems lab',
      nav: { projects: 'Projects', log: 'Log', writing: 'Writing', stack: 'Stack', about: 'About' },
      primaryNav: 'Primary navigation', entityState: 'Entity state', bootstrap: 'BOOTSTRAP',
      language: 'VI', languageTitle: 'Switch to Vietnamese', homeLabel: 'Thái Duy home',
    },
    home: {
      eyebrow: 'THÁI DUY / LIVING SYSTEMS LAB',
      title: 'A public surface for systems that are actually alive.',
      lede: 'Projects, infrastructure, machine senses and field notes — presented as one calm digital organism. Motion comes from real state, not decorative noise.',
      enter: 'Enter living field', explore: 'Explore surfaces',
      principlesLabel: 'Design principles',
      principles: ['real state over fake motion', 'quiet when idle', 'reactive when alive'],
      fieldTop: 'LIVING FIELD / LOCAL PROTOTYPE', fieldTruth: 'EXTERNAL FEEDS · OFFLINE',
      fieldFooter: ['UI heartbeat · local', 'entity links · reserved', 'telemetry · not connected'],
      organsEyebrow: 'ORGANS / PUBLIC STATE', organsTitle: 'Each system gets one truthful way to speak.',
      surfacesEyebrow: 'PUBLIC SURFACES', surfacesTitle: 'Not a portfolio dashboard. A readable system.',
      surfaces: [
        { kicker: 'PROJECTS', title: 'Systems with a pulse', copy: 'LightBI, Light Remote, Sentinel and the n8n2erpnext ecosystem will expose public state beside their human-readable stories.' },
        { kicker: 'BUILD LOG', title: 'A visible history', copy: 'Deployments, milestones and field notes become an event rail instead of a disconnected archive of posts.' },
        { kicker: 'STACK', title: 'Infrastructure as a place', copy: 'Topology, nodes and services become an explorable surface while private network details stay private.' },
      ],
      manifesto: 'When the ecosystem is quiet, the site is quiet. When something real happens, the surface responds.',
      manifestoMeta: ['MB · THINKING', 'SENTINEL · WATCHING', 'MUSIC · LISTENING / HUMMING / RESTING', 'SYSTEM · CALM / ACTIVE / DEGRADED'],
      footerLeft: 'THAIDUY.DIGITAL / GREENFIELD 2026', footerRight: 'BOOTSTRAP · PORT 3000',
    },
    entity: {
      aria: 'Living entity bootstrap console', top: 'ENTITY / LOCAL PROTOTYPE', notConnected: 'not connected',
      roles: { mb: 'semantic brain', sentinel: 'watching', music: 'listening', 'light-remote': 'remote nerve', lightbi: 'data cognition', n8n2erpnext: 'workflow circulation' },
      footer: [
        ['STATE PLANE', 'BOOTSTRAP'], ['PUBLIC SIGNAL', 'AMBIENT ONLY'], ['LIVE SOURCES', '0 CONNECTED'],
      ],
      canvasAria: 'Living ecosystem topology prototype; external entity feeds are not connected yet.',
      canvasRoles: { mb: 'semantic brain', lightbi: 'data cognition', remote: 'remote nerve', core: 'public surface', sentinel: 'watching sense', music: 'acoustic sense' },
    },
    activity: {
      aria: 'Live activity rail', kicker: 'ACTIVITY / LIVE TRANSPORT', connected: 'SSE · CONNECTED', connecting: 'SSE · CONNECTING',
      waiting: [['MB', 'semantic feed not connected'], ['SENTINEL', 'security feed not connected'], ['MUSIC SENSOR', 'acoustic feed not connected']],
      eventLabels: { 'surface.ready': 'surface ready', 'surface.heartbeat': 'surface heartbeat' },
      stateLabels: { connected: 'connected', bootstrap: 'bootstrap' },
    },
    music: {
      aria: 'Sentinel Music Sensor prototype', kicker: 'SENTINEL / MUSIC SENSOR', title: 'Acoustic organ', state: 'RESTING · NOT CONNECTED',
      shellTitle: 'Sentinel Music Sensor is resting — live audio sensor is not connected yet.', waveAria: 'Resting music waveform',
      note: 'Renderer contract is ready. Genre, style, vocal prominence and realtime spectrum will come from Music Cortex — not from title heuristics.',
      layers: { bass: 'bass', lowMid: 'low-mid', mid: 'mid', vocal: 'vocal', presence: 'presence', air: 'air' },
      indicator: { resting: 'resting', listening: 'listening', humming: 'humming', notConnected: 'sensor not connected', hummingTitle: 'Sentinel is humming…', title: 'Sentinel Music Sensor' },
    },
    section: {
      source: 'CONTENT SOURCE', notConnected: 'NOT CONNECTED', empty: 'This surface is intentionally empty until its real content/state source is connected.', back: 'Return to living field',
    },
    sections: {
      projects: { eyebrow: 'PROJECTS / SYSTEMS', title: 'Systems with a pulse', copy: 'Projects will combine durable context with their sanitized public runtime state.' },
      log: { eyebrow: 'BUILD LOG / EVENTS', title: 'A visible history', copy: 'Milestones, deployments and field notes will arrive here as a chronological public event surface.' },
      writing: { eyebrow: 'WRITING / FIELD NOTES', title: 'Long-form thinking', copy: 'Architecture notes, principles and lessons learned will live here without competing with live system state.' },
      stack: { eyebrow: 'STACK / TOPOLOGY', title: 'Infrastructure as a place', copy: 'A safe public projection of nodes, services and relationships — never the private control plane.' },
      about: { eyebrow: 'ABOUT / CV', title: 'The human behind the systems', copy: 'Experience, background and CV stay readable while the rest of the site remains alive around it.' },
    },
  },
  vi: {
    meta: {
      title: 'Thái Duy — Phòng Lab Hệ Thống Sống',
      description: 'Bề mặt công khai sống cho dự án, hạ tầng, nhật ký kỹ thuật và các giác quan máy.',
    },
    header: {
      lab: 'phòng lab hệ thống',
      nav: { projects: 'Dự án', log: 'Nhật ký', writing: 'Bài viết', stack: 'Hạ tầng', about: 'Giới thiệu' },
      primaryNav: 'Điều hướng chính', entityState: 'Trạng thái thực thể', bootstrap: 'KHỞI TẠO',
      language: 'EN', languageTitle: 'Chuyển sang tiếng Anh', homeLabel: 'Trang chủ Thái Duy',
    },
    home: {
      eyebrow: 'THÁI DUY / PHÒNG LAB HỆ THỐNG SỐNG',
      title: 'Một bề mặt công khai cho những hệ thống thực sự đang sống.',
      lede: 'Dự án, hạ tầng, giác quan máy và nhật ký kỹ thuật — cùng tồn tại như một thực thể số điềm tĩnh. Chuyển động đến từ trạng thái thật, không phải hiệu ứng trang trí.',
      enter: 'Đi vào trường sống', explore: 'Khám phá các bề mặt',
      principlesLabel: 'Nguyên tắc thiết kế',
      principles: ['trạng thái thật thay cho chuyển động giả', 'yên khi hệ thống yên', 'phản ứng khi có sự sống'],
      fieldTop: 'TRƯỜNG SỐNG / BẢN THỬ CỤC BỘ', fieldTruth: 'NGUỒN NGOÀI · CHƯA KẾT NỐI',
      fieldFooter: ['nhịp UI · cục bộ', 'liên kết thực thể · đã chừa chỗ', 'telemetry · chưa kết nối'],
      organsEyebrow: 'CƠ QUAN / TRẠNG THÁI CÔNG KHAI', organsTitle: 'Mỗi hệ thống có một cách trung thực để lên tiếng.',
      surfacesEyebrow: 'CÁC BỀ MẶT CÔNG KHAI', surfacesTitle: 'Không phải dashboard portfolio. Đây là một hệ thống có thể đọc được.',
      surfaces: [
        { kicker: 'DỰ ÁN', title: 'Những hệ thống có nhịp sống', copy: 'LightBI, Light Remote, Sentinel và hệ sinh thái n8n2erpnext sẽ hiển thị trạng thái công khai bên cạnh câu chuyện dễ đọc dành cho con người.' },
        { kicker: 'NHẬT KÝ XÂY DỰNG', title: 'Một lịch sử nhìn thấy được', copy: 'Triển khai, cột mốc và ghi chép thực địa trở thành một dòng sự kiện thay vì những bài đăng rời rạc.' },
        { kicker: 'HẠ TẦNG', title: 'Hạ tầng như một không gian', copy: 'Topology, node và service trở thành một bề mặt có thể khám phá trong khi chi tiết mạng riêng vẫn được giữ kín.' },
      ],
      manifesto: 'Khi hệ sinh thái yên, website cũng yên. Khi có điều gì thật sự xảy ra, bề mặt sẽ phản ứng.',
      manifestoMeta: ['MB · ĐANG SUY NGHĨ', 'SENTINEL · ĐANG QUAN SÁT', 'ÂM NHẠC · ĐANG NGHE / NGÂN NGA / NGHỈ', 'HỆ THỐNG · YÊN / HOẠT ĐỘNG / SUY GIẢM'],
      footerLeft: 'THAIDUY.DIGITAL / GREENFIELD 2026', footerRight: 'KHỞI TẠO · PORT 3000',
    },
    entity: {
      aria: 'Bảng điều khiển khởi tạo thực thể sống', top: 'THỰC THỂ / BẢN THỬ CỤC BỘ', notConnected: 'chưa kết nối',
      roles: { mb: 'não ngữ nghĩa', sentinel: 'quan sát', music: 'lắng nghe', 'light-remote': 'dây thần kinh từ xa', lightbi: 'nhận thức dữ liệu', n8n2erpnext: 'tuần hoàn workflow' },
      footer: [
        ['MẶT PHẲNG TRẠNG THÁI', 'KHỞI TẠO'], ['TÍN HIỆU CÔNG KHAI', 'CHỈ AMBIENT'], ['NGUỒN LIVE', '0 KẾT NỐI'],
      ],
      canvasAria: 'Bản thử topology của hệ sinh thái sống; các nguồn thực thể bên ngoài chưa được kết nối.',
      canvasRoles: { mb: 'não ngữ nghĩa', lightbi: 'nhận thức dữ liệu', remote: 'dây thần kinh từ xa', core: 'bề mặt công khai', sentinel: 'giác quan quan sát', music: 'giác quan âm thanh' },
    },
    activity: {
      aria: 'Dòng hoạt động trực tiếp', kicker: 'HOẠT ĐỘNG / TRUYỀN TRỰC TIẾP', connected: 'SSE · ĐÃ KẾT NỐI', connecting: 'SSE · ĐANG KẾT NỐI',
      waiting: [['MB', 'nguồn ngữ nghĩa chưa kết nối'], ['SENTINEL', 'nguồn an ninh chưa kết nối'], ['MUSIC SENSOR', 'nguồn âm thanh chưa kết nối']],
      eventLabels: { 'surface.ready': 'bề mặt sẵn sàng', 'surface.heartbeat': 'nhịp tim bề mặt' },
      stateLabels: { connected: 'đã kết nối', bootstrap: 'khởi tạo' },
    },
    music: {
      aria: 'Bản thử Sentinel Music Sensor', kicker: 'SENTINEL / MUSIC SENSOR', title: 'Cơ quan âm thanh', state: 'ĐANG NGHỈ · CHƯA KẾT NỐI',
      shellTitle: 'Sentinel Music Sensor đang nghỉ — cảm biến âm thanh trực tiếp chưa được kết nối.', waveAria: 'Dạng sóng âm nhạc đang nghỉ',
      note: 'Hợp đồng renderer đã sẵn sàng. Genre, style, độ nổi của vocal và phổ tần thời gian thực sẽ đến từ Music Cortex — không còn đoán bằng tiêu đề bài hát.',
      layers: { bass: 'trầm', lowMid: 'trầm-trung', mid: 'trung', vocal: 'giọng hát', presence: 'độ hiện diện', air: 'dải cao' },
      indicator: { resting: 'đang nghỉ', listening: 'đang nghe', humming: 'đang ngân nga', notConnected: 'cảm biến chưa kết nối', hummingTitle: 'Sentinel đang ngân nga…', title: 'Sentinel Music Sensor' },
    },
    section: {
      source: 'NGUỒN NỘI DUNG', notConnected: 'CHƯA KẾT NỐI', empty: 'Bề mặt này được cố ý để trống cho đến khi nguồn nội dung/trạng thái thật được kết nối.', back: 'Trở về trường sống',
    },
    sections: {
      projects: { eyebrow: 'DỰ ÁN / HỆ THỐNG', title: 'Những hệ thống có nhịp sống', copy: 'Mỗi dự án sẽ kết hợp bối cảnh bền vững với trạng thái runtime công khai đã được làm sạch.' },
      log: { eyebrow: 'NHẬT KÝ XÂY DỰNG / SỰ KIỆN', title: 'Một lịch sử nhìn thấy được', copy: 'Cột mốc, lần triển khai và ghi chép thực địa sẽ xuất hiện ở đây như một dòng sự kiện công khai theo thời gian.' },
      writing: { eyebrow: 'BÀI VIẾT / GHI CHÉP THỰC ĐỊA', title: 'Những suy nghĩ dài hơi', copy: 'Ghi chú kiến trúc, nguyên tắc và bài học kinh nghiệm sẽ sống ở đây mà không tranh chỗ với trạng thái live của hệ thống.' },
      stack: { eyebrow: 'HẠ TẦNG / TOPOLOGY', title: 'Hạ tầng như một không gian', copy: 'Một hình chiếu công khai an toàn của node, service và các mối quan hệ — tuyệt đối không phải control plane riêng tư.' },
      about: { eyebrow: 'GIỚI THIỆU / CV', title: 'Con người phía sau những hệ thống', copy: 'Kinh nghiệm, hành trình và CV vẫn dễ đọc trong khi phần còn lại của website tiếp tục sống xung quanh.' },
    },
  },
} as const

export type Messages = (typeof messages)[Locale]
