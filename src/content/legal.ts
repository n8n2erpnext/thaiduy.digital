import type { Locale } from '@/i18n/config'

export type LegalSection = {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export type LegalDocument = {
  eyebrow: string
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

const termsEn: LegalDocument = {
  eyebrow: 'LEGAL / TERMS',
  title: 'Terms of Service',
  updated: 'Last updated: 18 September 2026',
  intro: 'These terms apply to your use of thaiduy.digital, a public systems lab and personal publishing surface operated by Thái Duy.',
  sections: [
    {
      title: '1. Using this website',
      paragraphs: [
        'You may browse the public pages, read published material and use the interactive public surfaces for ordinary personal or professional reference.',
        'Do not attempt to bypass access controls, interfere with the service, probe private infrastructure, abuse interactive endpoints, or use the website in a way that harms other visitors or connected systems.',
      ],
    },
    {
      title: '2. Public information and system state',
      paragraphs: [
        'Some pages display live or recently observed system state, telemetry, project status, machine-sense output and generated analysis. Public output is intentionally sanitized and may be delayed, incomplete or unavailable.',
        'Operational status, generated interpretation and experimental features are provided for informational purposes and should not be treated as a guarantee, service-level commitment, or professional advice.',
      ],
    },
    {
      title: '3. Writing, comments and community input',
      paragraphs: [
        'Where the site allows comments, reactions or other user submissions, you are responsible for what you submit and must have the right to share it.',
        'Spam, unlawful content, abuse, impersonation, credential material, private data about others, and content that creates security or operational risk may be moderated or removed.',
      ],
    },
    {
      title: '4. Intellectual property',
      paragraphs: [
        'Unless otherwise stated, the site design, original writing, original visualizations and original project material on thaiduy.digital remain the property of their respective owner or author.',
        'Third-party names, logos, repositories, libraries, datasets and linked services remain subject to their own licenses and terms. A link or reference does not imply ownership or endorsement.',
      ],
    },
    {
      title: '5. External links and projects',
      paragraphs: [
        'The site may link to GitHub repositories, project websites and other third-party services. Those destinations have their own terms and privacy practices.',
        'Leaving thaiduy.digital for an external service is your choice, and that external service is responsible for its own availability, content and handling of data.',
      ],
    },
    {
      title: '6. Availability and changes',
      paragraphs: [
        'This is an actively developed systems lab. Features, routes, experiments and public projections may change, pause or disappear without notice.',
        'The website is provided on an “as is” and “as available” basis to the extent permitted by applicable law.',
      ],
    },
    {
      title: '7. Updates to these terms',
      paragraphs: [
        'These terms may be updated when the website, its public features or applicable requirements change. The revision date at the top of this page identifies the current version.',
      ],
    },
  ],
}

const termsVi: LegalDocument = {
  eyebrow: 'PHÁP LÝ / ĐIỀU KHOẢN',
  title: 'Điều khoản dịch vụ',
  updated: 'Cập nhật lần cuối: 18 tháng 9 năm 2026',
  intro: 'Các điều khoản này áp dụng khi bạn sử dụng thaiduy.digital — một phòng lab hệ thống công khai kiêm không gian xuất bản cá nhân do Thái Duy vận hành.',
  sections: [
    {
      title: '1. Sử dụng website',
      paragraphs: [
        'Bạn có thể truy cập các trang công khai, đọc nội dung đã xuất bản và sử dụng các khu vực tương tác công khai cho mục đích tham khảo cá nhân hoặc công việc thông thường.',
        'Không được tìm cách vượt qua kiểm soát truy cập, gây gián đoạn dịch vụ, quét dò hạ tầng riêng tư, lạm dụng endpoint tương tác hoặc sử dụng website theo cách gây hại cho người dùng hay hệ thống được kết nối.',
      ],
    },
    {
      title: '2. Thông tin công khai và trạng thái hệ thống',
      paragraphs: [
        'Một số trang hiển thị trạng thái hệ thống trực tiếp hoặc gần thời gian thực, telemetry, trạng thái dự án, tín hiệu từ các cảm biến và phân tích tự động. Dữ liệu công khai đã được lược bỏ phần nhạy cảm và có thể bị trễ, thiếu hoặc tạm thời không khả dụng.',
        'Trạng thái vận hành, diễn giải tự động và các tính năng thử nghiệm chỉ nhằm mục đích cung cấp thông tin, không phải cam kết mức dịch vụ hay lời khuyên chuyên môn.',
      ],
    },
    {
      title: '3. Bài viết, bình luận và nội dung người dùng',
      paragraphs: [
        'Khi website cho phép bình luận, phản ứng hoặc nội dung do người dùng gửi lên, bạn chịu trách nhiệm về nội dung đó và phải có quyền chia sẻ.',
        'Spam, nội dung trái pháp luật, quấy rối, mạo danh, thông tin xác thực, dữ liệu riêng tư của người khác hoặc nội dung gây rủi ro bảo mật/vận hành có thể bị kiểm duyệt hoặc xóa.',
      ],
    },
    {
      title: '4. Quyền sở hữu trí tuệ',
      paragraphs: [
        'Trừ khi có ghi chú khác, thiết kế website, bài viết gốc, trực quan hóa gốc và tài liệu dự án gốc trên thaiduy.digital thuộc về chủ sở hữu hoặc tác giả tương ứng.',
        'Tên, logo, repository, thư viện, dataset và dịch vụ của bên thứ ba vẫn tuân theo giấy phép và điều khoản riêng của họ. Việc liên kết hoặc nhắc tới không đồng nghĩa với quyền sở hữu hay sự ủng hộ.',
      ],
    },
    {
      title: '5. Liên kết và dịch vụ bên ngoài',
      paragraphs: [
        'Website có thể liên kết tới GitHub, website dự án hoặc dịch vụ bên thứ ba. Các nơi đó có điều khoản và chính sách riêng tư riêng.',
        'Khi bạn rời thaiduy.digital để tới dịch vụ bên ngoài, dịch vụ đó chịu trách nhiệm cho tính khả dụng, nội dung và cách xử lý dữ liệu của họ.',
      ],
    },
    {
      title: '6. Khả dụng và thay đổi',
      paragraphs: [
        'Đây là một phòng lab hệ thống đang được phát triển liên tục. Tính năng, route, thử nghiệm và các góc nhìn công khai có thể thay đổi, tạm dừng hoặc bị gỡ mà không cần báo trước.',
        'Trong phạm vi pháp luật cho phép, website được cung cấp theo trạng thái “như hiện có” và “theo khả năng sẵn có”.',
      ],
    },
    {
      title: '7. Cập nhật điều khoản',
      paragraphs: [
        'Điều khoản này có thể được cập nhật khi website, tính năng công khai hoặc yêu cầu áp dụng thay đổi. Ngày cập nhật ở đầu trang cho biết phiên bản hiện hành.',
      ],
    },
  ],
}

const privacyEn: LegalDocument = {
  eyebrow: 'LEGAL / PRIVACY',
  title: 'Privacy Policy',
  updated: 'Last updated: 18 September 2026',
  intro: 'This policy explains what thaiduy.digital may process when you visit or interact with the public website and how that information is used.',
  sections: [
    {
      title: '1. Information processed automatically',
      paragraphs: [
        'The site may process ordinary request and analytics information needed to operate, secure and understand the public service.',
      ],
      bullets: [
        'Visit and page-view information such as path, referrer domain and campaign parameters.',
        'Coarse country or region signals supplied by the delivery platform; the public analytics layer does not require a precise street address.',
        'Browser, operating system, device category, language and basic performance measurements such as page-load or interaction metrics.',
        'Operational and security logs needed to detect abuse, investigate failures and protect the service.',
      ],
    },
    {
      title: '2. Information you choose to provide',
      paragraphs: [
        'If you use an account-enabled feature such as a reaction or comment, the site may process the account identifier required for that feature together with the content or action you submit.',
        'If you deliberately include personal information in a public comment, that information may become visible with the comment. Avoid posting secrets, credentials or information you do not want published.',
      ],
    },
    {
      title: '3. Cookies and local preferences',
      paragraphs: [
        'The site may use a small cookie or equivalent browser storage for functional preferences such as language selection and for authentication when an account-enabled feature requires it.',
        'These mechanisms are used to provide the requested functionality rather than to build an advertising profile.',
      ],
    },
    {
      title: '4. How information is used',
      paragraphs: [
        'Information is used to deliver pages, remember requested preferences, measure reliability and performance, understand aggregate usage, moderate community features, diagnose problems and protect the site and connected systems.',
        'Data is not sold to advertisers.',
      ],
    },
    {
      title: '5. Live systems and machine-sense data',
      paragraphs: [
        'Public runtime, topology and machine-sense views are deliberately sanitized before presentation. Private addresses, credentials and sensitive control paths are not intended to be exposed through the public site.',
        'For Sentinel Music Sensor, heard melodies are not stored or replayed by the public humming system. Abstract musical attributes may be retained to support interpretation or generated musical personality.',
      ],
    },
    {
      title: '6. Service providers and external destinations',
      paragraphs: [
        'Hosting, delivery, authentication, code hosting, storage or analytics infrastructure may process limited technical data as part of providing the service, subject to the relevant provider terms.',
        'Links to third-party sites such as GitHub leave thaiduy.digital and are governed by the privacy practices of those destinations.',
      ],
    },
    {
      title: '7. Retention and security',
      paragraphs: [
        'Operational, analytics and community data is retained only for as long as it remains useful for the feature, reliability, security, moderation or record-keeping purpose for which it was collected.',
        'Reasonable technical and organizational safeguards are used, but no internet service can promise absolute security.',
      ],
    },
    {
      title: '8. Your choices',
      paragraphs: [
        'You can avoid optional interactive features, change the site language, and leave the site without creating an account for ordinary public browsing.',
        'For questions or reasonable requests about information associated with you, use the public contact channels linked from thaiduy.digital or the GitHub organization linked in the footer.',
      ],
    },
    {
      title: '9. Policy updates',
      paragraphs: [
        'This policy may change as the site and its public features evolve. The revision date at the top identifies the current version.',
      ],
    },
  ],
}

const privacyVi: LegalDocument = {
  eyebrow: 'PHÁP LÝ / QUYỀN RIÊNG TƯ',
  title: 'Chính sách quyền riêng tư',
  updated: 'Cập nhật lần cuối: 18 tháng 9 năm 2026',
  intro: 'Chính sách này giải thích dữ liệu mà thaiduy.digital có thể xử lý khi bạn truy cập hoặc tương tác với website công khai và cách dữ liệu đó được sử dụng.',
  sections: [
    {
      title: '1. Dữ liệu được xử lý tự động',
      paragraphs: [
        'Website có thể xử lý dữ liệu request và analytics thông thường cần thiết để vận hành, bảo vệ và hiểu cách dịch vụ công khai được sử dụng.',
      ],
      bullets: [
        'Thông tin lượt truy cập và lượt xem như path, referrer domain và tham số chiến dịch.',
        'Tín hiệu quốc gia hoặc khu vực ở mức khái quát do nền tảng phân phối cung cấp; lớp analytics công khai không cần địa chỉ đường phố chính xác.',
        'Trình duyệt, hệ điều hành, loại thiết bị, ngôn ngữ và các chỉ số hiệu năng cơ bản như thời gian tải hoặc độ phản hồi.',
        'Log vận hành và bảo mật cần thiết để phát hiện lạm dụng, điều tra sự cố và bảo vệ dịch vụ.',
      ],
    },
    {
      title: '2. Dữ liệu bạn chủ động cung cấp',
      paragraphs: [
        'Nếu bạn dùng tính năng cần tài khoản như lượt thích hoặc bình luận, website có thể xử lý định danh tài khoản cần thiết cùng nội dung hoặc hành động bạn gửi.',
        'Nếu bạn chủ động đưa dữ liệu cá nhân vào bình luận công khai, dữ liệu đó có thể hiển thị cùng bình luận. Không đăng secret, credential hoặc thông tin mà bạn không muốn công khai.',
      ],
    },
    {
      title: '3. Cookie và tùy chọn cục bộ',
      paragraphs: [
        'Website có thể dùng một cookie nhỏ hoặc cơ chế lưu trữ tương đương để ghi nhớ tùy chọn chức năng như ngôn ngữ và phục vụ xác thực khi một tính năng có tài khoản yêu cầu.',
        'Các cơ chế này phục vụ chức năng được yêu cầu, không nhằm xây dựng hồ sơ quảng cáo.',
      ],
    },
    {
      title: '4. Mục đích sử dụng dữ liệu',
      paragraphs: [
        'Dữ liệu được dùng để cung cấp trang, ghi nhớ tùy chọn, đo độ ổn định và hiệu năng, hiểu mức sử dụng ở dạng tổng hợp, kiểm duyệt tính năng cộng đồng, chẩn đoán lỗi và bảo vệ website cùng các hệ thống kết nối.',
        'Dữ liệu không được bán cho nhà quảng cáo.',
      ],
    },
    {
      title: '5. Runtime công khai và dữ liệu cảm biến',
      paragraphs: [
        'Các góc nhìn runtime, topology và dữ liệu cảm biến đều được lược bỏ phần nhạy cảm trước khi hiển thị. Địa chỉ riêng, credential và đường điều khiển nhạy cảm không được đưa lên website công khai.',
        'Đối với Sentinel Music Sensor, giai điệu đã nghe không được lưu hoặc phát lại qua chức năng ngân nga công khai. Các thuộc tính âm nhạc trừu tượng có thể được giữ lại để hỗ trợ diễn giải hoặc định hình phong cách sáng tác do hệ thống tạo ra.',
      ],
    },
    {
      title: '6. Nhà cung cấp dịch vụ và liên kết bên ngoài',
      paragraphs: [
        'Các dịch vụ hosting, delivery, authentication, code hosting, storage hoặc analytics có thể xử lý một lượng dữ liệu kỹ thuật giới hạn trong quá trình cung cấp dịch vụ, theo điều khoản của từng nhà cung cấp.',
        'Liên kết tới website bên thứ ba như GitHub sẽ rời thaiduy.digital và chịu chính sách quyền riêng tư của điểm đến đó.',
      ],
    },
    {
      title: '7. Lưu giữ và bảo mật',
      paragraphs: [
        'Dữ liệu vận hành, analytics và cộng đồng chỉ được lưu trong khoảng thời gian còn cần thiết cho chức năng, độ ổn định, bảo mật, kiểm duyệt hoặc mục đích lưu vết tương ứng.',
        'Website áp dụng các biện pháp kỹ thuật và tổ chức hợp lý, nhưng không có dịch vụ Internet nào có thể cam kết an toàn tuyệt đối.',
      ],
    },
    {
      title: '8. Lựa chọn của bạn',
      paragraphs: [
        'Bạn có thể không sử dụng các tính năng tương tác tùy chọn, đổi ngôn ngữ website và rời website mà không cần tạo tài khoản đối với việc xem nội dung công khai thông thường.',
        'Nếu có câu hỏi hoặc yêu cầu hợp lý liên quan đến dữ liệu gắn với bạn, hãy dùng các kênh công khai được liên kết từ thaiduy.digital hoặc tổ chức GitHub trong footer.',
      ],
    },
    {
      title: '9. Cập nhật chính sách',
      paragraphs: [
        'Chính sách này có thể thay đổi khi website và các tính năng công khai phát triển. Ngày cập nhật ở đầu trang xác định phiên bản hiện hành.',
      ],
    },
  ],
}

export function getLegalDocument(type: 'terms' | 'privacy', locale: Locale): LegalDocument {
  if (type === 'terms') return locale === 'vi' ? termsVi : termsEn
  return locale === 'vi' ? privacyVi : privacyEn
}
