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
      home: 'Home', projects: 'Projects', writing: 'Writing', stack: 'Stack', about: 'About', music: 'Music Sensor',
      terms: 'Terms of Service', privacy: 'Privacy Policy', github: 'GitHub',
    },
    home: {
      eyebrow: 'THÁI DUY / LIVING SYSTEMS LAB',
      title: 'A public surface for systems that are actually alive.',
      lede: 'Projects, infrastructure, machine senses and field notes — presented as one calm digital organism. Motion comes from real state, not decorative noise.',
      enter: 'Enter living field', explore: 'Explore surfaces',
      principlesLabel: 'Design principles',
      principles: ['real state over fake motion', 'quiet when idle', 'reactive when alive'],
      fieldTop: 'LIVING FIELD / ORGANISM LENS', fieldTruth: 'SANITIZED RUNTIME · LIVE',
      fieldFooter: ['runtime truth · live', 'entity links · governed', 'telemetry · public projection'],
      organsEyebrow: 'ORGANS / PUBLIC STATE', organsTitle: 'Each system gets one truthful way to speak.',
      surfacesEyebrow: 'PUBLIC SURFACES', surfacesTitle: 'Not a portfolio dashboard. A readable system.',
      surfaces: [
        { kicker: 'PROJECTS', title: 'Systems with a pulse', copy: 'LightBI, Light Remote, Sentinel and the n8n2erpnext ecosystem will expose public state beside their human-readable stories.' },
        { kicker: 'WRITING', title: 'Field notes and long-form thinking', copy: 'Architecture notes, experiments and lessons live as durable writing instead of a separate build-log surface.' },
        { kicker: 'STACK', title: 'Infrastructure as a place', copy: 'Topology, nodes and services become an explorable surface while private network details stay private.' },
      ],
      manifesto: 'When the ecosystem is quiet, the site is quiet. When something real happens, the surface responds.',
      manifestoMeta: ['MB · THINKING', 'SENTINEL · WATCHING', 'MUSIC · LISTENING / HUMMING / RESTING', 'SYSTEM · CALM / ACTIVE / DEGRADED'],
    },
    entity: {
      aria: 'Living organism state console', top: 'ENTITY / ORGANISM LENS', notConnected: 'not connected',
      roles: { mb: 'semantic brain', sentinel: 'watching', music: 'listening', 'light-remote': 'remote nerve', lightbi: 'data cognition', n8n2erpnext: 'workflow circulation' },
      footer: [
        ['STATE PLANE', 'BOOTSTRAP'], ['PUBLIC SIGNAL', 'AMBIENT ONLY'], ['LIVE SOURCES', '0 CONNECTED'],
      ],
      canvasAria: 'Living ecosystem topology projected from sanitized runtime state.',
      canvasRoles: { mb: 'semantic brain', lightbi: 'data cognition', remote: 'remote nerve', core: 'public surface', sentinel: 'watching sense', music: 'acoustic sense' },
    },
    activity: {
      aria: 'Live activity rail', kicker: 'ACTIVITY / LIVE GRAPH', connected: 'STACK · LIVE', connecting: 'STACK · SYNCING',
      waiting: [['MB', 'semantic feed not connected'], ['SENTINEL', 'security feed not connected'], ['MUSIC SENSOR', 'acoustic feed not connected']],
      eventLabels: { 'surface.ready': 'surface ready', 'surface.heartbeat': 'surface heartbeat', 'runtime.state': 'runtime state', 'runtime.added': 'runtime added', 'runtime.removed': 'runtime removed' },
      stateLabels: { connected: 'connected', bootstrap: 'bootstrap' },
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
    stackSurface: {
      aria: 'Sanitized infrastructure topology', notConnected: 'STATE NOT CONNECTED',
      nodes: [
        { id: 'surface', label: 'PUBLIC SURFACE', role: 'thaiduy.digital' },
        { id: 'mesh', label: 'PRIVATE MESH', role: 'network connective tissue' },
        { id: 'arm', label: 'ARM MAIN', role: 'primary services' },
        { id: 'amd', label: 'AMD NODE', role: 'compute / service node' },
        { id: 'desktop', label: 'DESKTOP NODE', role: 'interactive edge' },
        { id: 'data', label: 'DATA PLANE', role: 'CMS / database / memory' },
      ],
      legend: { public: 'PUBLIC EDGE', private: 'PRIVATE RELATION', safe: 'SANITIZED VIEW' },
      note: 'This is a safe public projection. Private addresses, credentials, control paths and sensitive topology remain outside the website.',
    },
    section: {
      source: 'CONTENT SOURCE', managed: 'CONTROL REGISTRY', notConnected: 'NOT CONNECTED', empty: 'This surface is intentionally empty until its real content/state source is connected.', back: 'Return to living field',
    },
    sections: {
      projects: { eyebrow: 'PROJECTS / SYSTEMS', title: 'Systems with a pulse', copy: 'Projects will combine durable context with their sanitized public runtime state.' },
      writing: { eyebrow: 'WRITING / FIELD NOTES', title: 'Long-form thinking', copy: 'Architecture notes, principles and lessons learned will live here without competing with live system state.' },
      stack: { eyebrow: 'STACK / TOPOLOGY', title: 'Infrastructure as a place', copy: 'A safe public projection of nodes, services and relationships — never the private control plane.' },
      about: { eyebrow: 'ABOUT / PRACTICE', title: 'I build systems that have to keep working.', copy: 'thaiduy.digital is the public surface of that practice — projects, infrastructure, experiments and field notes, shown with enough truth to be useful without turning the website into a control plane.' },
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
      home: 'Trang chủ', projects: 'Dự án', writing: 'Bài viết', stack: 'Hạ tầng', about: 'Giới thiệu', music: 'Music Sensor',
      terms: 'Điều khoản dịch vụ', privacy: 'Chính sách quyền riêng tư', github: 'GitHub',
    },
    home: {
      eyebrow: 'THÁI DUY / PHÒNG LAB HỆ THỐNG SỐNG',
      title: 'Một không gian công khai cho những hệ thống đang thực sự vận hành.',
      lede: 'Dự án, hạ tầng, các cảm biến và ghi chép kỹ thuật — cùng hiện diện trong một hệ sinh thái số điềm tĩnh. Mọi chuyển động đều đến từ trạng thái thật, không phải hiệu ứng trang trí.',
      enter: 'Đi vào hệ thống', explore: 'Khám phá',
      principlesLabel: 'Nguyên tắc thiết kế',
      principles: ['ưu tiên trạng thái thật, không tạo chuyển động giả', 'im lặng khi không có gì xảy ra', 'phản ứng khi hệ thống hoạt động'],
      fieldTop: 'HỆ THỐNG / GÓC NHÌN TỔNG THỂ', fieldTruth: 'RUNTIME ĐÃ LƯỢC BỎ DỮ LIỆU NHẠY CẢM · LIVE',
      fieldFooter: ['runtime thực · live', 'liên kết thực thể · có kiểm soát', 'telemetry · hiển thị công khai'],
      organsEyebrow: 'HỆ THỐNG / TRẠNG THÁI CÔNG KHAI', organsTitle: 'Mỗi hệ thống có một cách riêng để cho thấy trạng thái thật.',
      surfacesEyebrow: 'KHÔNG GIAN CÔNG KHAI', surfacesTitle: 'Không phải một portfolio dạng dashboard. Đây là một hệ thống có thể đọc và quan sát.',
      surfaces: [
        { kicker: 'DỰ ÁN', title: 'Những hệ thống đang vận hành', copy: 'LightBI, Light Remote, Sentinel và n8n2erpnext hiển thị trạng thái công khai bên cạnh phần mô tả dễ hiểu với người đọc.' },
        { kicker: 'BÀI VIẾT', title: 'Ghi chép kỹ thuật và bài viết chuyên sâu', copy: 'Ghi chú kiến trúc, thử nghiệm và bài học được lưu thành những bài viết có thể đọc lại lâu dài, thay vì tách thành một build log riêng.' },
        { kicker: 'HẠ TẦNG', title: 'Hạ tầng như một không gian có thể khám phá', copy: 'Topology, node và service được trình bày thành một không gian có thể khám phá, trong khi chi tiết mạng riêng vẫn được giữ kín.' },
      ],
      manifesto: 'Khi hệ thống yên, website cũng yên. Khi có điều gì thực sự xảy ra, giao diện mới phản ứng.',
      manifestoMeta: ['MB · ĐANG SUY NGHĨ', 'SENTINEL · ĐANG QUAN SÁT', 'ÂM NHẠC · ĐANG NGHE / NGÂN NGA / NGHỈ', 'HỆ THỐNG · YÊN / HOẠT ĐỘNG / SUY GIẢM'],
    },
    entity: {
      aria: 'Bảng trạng thái hệ thống', top: 'HỆ THỐNG / GÓC NHÌN TỔNG THỂ', notConnected: 'chưa kết nối',
      roles: { mb: 'bộ não ngữ nghĩa', sentinel: 'đang quan sát', music: 'đang lắng nghe', 'light-remote': 'kết nối từ xa', lightbi: 'hiểu dữ liệu', n8n2erpnext: 'luồng workflow' },
      footer: [
        ['LỚP TRẠNG THÁI', 'KHỞI TẠO'], ['TÍN HIỆU CÔNG KHAI', 'CHỈ HIỂN THỊ'], ['NGUỒN LIVE', '0 KẾT NỐI'],
      ],
      canvasAria: 'Sơ đồ hệ sinh thái được dựng từ trạng thái runtime đã lược bỏ dữ liệu nhạy cảm.',
      canvasRoles: { mb: 'bộ não ngữ nghĩa', lightbi: 'hiểu dữ liệu', remote: 'kết nối từ xa', core: 'giao diện công khai', sentinel: 'cảm biến quan sát', music: 'cảm biến âm thanh' },
    },
    activity: {
      aria: 'Dòng hoạt động live', kicker: 'HOẠT ĐỘNG / BIỂU ĐỒ LIVE', connected: 'STACK · LIVE', connecting: 'STACK · ĐANG ĐỒNG BỘ',
      waiting: [['MB', 'nguồn ngữ nghĩa chưa kết nối'], ['SENTINEL', 'nguồn an ninh chưa kết nối'], ['MUSIC SENSOR', 'nguồn âm thanh chưa kết nối']],
      eventLabels: { 'surface.ready': 'giao diện sẵn sàng', 'surface.heartbeat': 'nhịp hệ thống', 'runtime.state': 'trạng thái runtime', 'runtime.added': 'runtime xuất hiện', 'runtime.removed': 'runtime biến mất' },
      stateLabels: { connected: 'đã kết nối', bootstrap: 'khởi tạo' },
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
    stackSurface: {
      aria: 'Sơ đồ hạ tầng đã lược bỏ dữ liệu nhạy cảm', notConnected: 'TRẠNG THÁI CHƯA KẾT NỐI',
      nodes: [
        { id: 'surface', label: 'BỀ MẶT CÔNG KHAI', role: 'thaiduy.digital' },
        { id: 'mesh', label: 'MESH RIÊNG', role: 'kết nối mạng nội bộ' },
        { id: 'arm', label: 'ARM MAIN', role: 'dịch vụ chính' },
        { id: 'amd', label: 'AMD NODE', role: 'node compute / dịch vụ' },
        { id: 'desktop', label: 'DESKTOP NODE', role: 'máy tương tác' },
        { id: 'data', label: 'DATA PLANE', role: 'CMS / database / bộ nhớ' },
      ],
      legend: { public: 'BIÊN CÔNG KHAI', private: 'LIÊN KẾT RIÊNG', safe: 'GÓC NHÌN AN TOÀN' },
      note: 'Đây là góc nhìn công khai đã được lược bỏ thông tin nhạy cảm. Địa chỉ riêng, credential, đường điều khiển và topology nội bộ không được đưa lên website.',
    },
    section: {
      source: 'NGUỒN NỘI DUNG', managed: 'CONTROL REGISTRY', notConnected: 'CHƯA KẾT NỐI', empty: 'Khu vực này được để trống có chủ ý cho đến khi nguồn nội dung hoặc trạng thái thật được kết nối.', back: 'Quay lại trang chính',
    },
    sections: {
      projects: { eyebrow: 'DỰ ÁN / HỆ THỐNG', title: 'Những hệ thống đang vận hành', copy: 'Mỗi dự án kết hợp phần mô tả lâu dài với trạng thái runtime công khai sau khi đã lược bỏ dữ liệu nhạy cảm.' },
      writing: { eyebrow: 'BÀI VIẾT / GHI CHÉP KỸ THUẬT', title: 'Ghi chép chuyên sâu', copy: 'Ghi chú kiến trúc, nguyên tắc và những bài học được lưu lại ở đây, tách khỏi phần trạng thái live của hệ thống.' },
      stack: { eyebrow: 'HẠ TẦNG / TOPOLOGY', title: 'Hạ tầng như một không gian có thể khám phá', copy: 'Một góc nhìn công khai, an toàn về node, service và các mối quan hệ — không phơi bày control plane riêng tư.' },
      about: { eyebrow: 'GIỚI THIỆU / CÁCH LÀM', title: 'Tôi xây những hệ thống phải vận hành bền bỉ.', copy: 'thaiduy.digital là nơi công khai cách tôi làm việc — dự án, hạ tầng, thử nghiệm và ghi chép kỹ thuật, đủ thật để hữu ích nhưng không biến website thành control plane.' },
    },
  },
} as const

export type Messages = (typeof messages)[Locale]
