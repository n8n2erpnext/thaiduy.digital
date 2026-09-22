import type { Locale } from '@/i18n/config'
import { getRegistry } from '@/content/repository'
import { textFor } from '@/content/types'

export type CvExperience = {
  company: string
  role: string
  period: string
  bullets: string[]
}

export type CvSystem = {
  name: string
  role: string
  summary: string
}

export type CvSkillGroup = {
  label: string
  items: string[]
}

export type CvContent = {
  version: string
  name: string
  headline: string
  location: string
  phone: string
  email: string
  website: string
  github: string
  summary: string
  focus: string[]
  experience: CvExperience[]
  systems: CvSystem[]
  skills: CvSkillGroup[]
  education: { school: string; credential: string }
}

const en: Omit<CvContent,'systems'> = {
  version:'CV_P.02',
  name:'Thái Đăng Duy',
  headline:'Operations Lead · Systems Builder · Data & Infrastructure',
  location:'Tien Giang, Vietnam',
  phone:'+84 909 507 475',
  email:'me@thaiduy.digital',
  website:'thaiduy.digital',
  github:'github.com/n8n2erpnext',
  summary:'Operations leader with hands-on experience across retail, warehousing, logistics and delivery, now building local-first analytics, automation, remote operations and observable infrastructure. Focused on turning field operations into auditable systems with clear state, bounded control and evidence.',
  focus:['Right goods','Right time','Right data'],
  experience:[
    {
      company:'Viettel Post Joint Stock Corporation',
      role:'Regional warehouse operator',
      period:'Sep 2024 – Present',
      bullets:[
        'Operate and coordinate regional warehouse processing activities across inbound, outbound and inventory flows.',
        'Keep dispatch complete, correct and on time across post-office routes inside and outside the province.',
        'Track first-mile, middle-mile and last-mile continuity, intervene in sorting bottlenecks and monitor delivery quality.',
        'Assign delivery routes, monitor courier workforce quality and handle customer-care cases.',
      ],
    },
    {
      company:'Bach Hoa Xanh Trading Joint Stock Company',
      role:'Assistant store manager',
      period:'May 2020 – Nov 2022',
      bullets:[
        'Supported daily store operations, revenue growth, promotions and campaign follow-through.',
        'Controlled ordering, receiving, FMCG/FRESH workflows, merchandising, FIFO and inventory accuracy.',
        'Managed store staff and resolved operational or team issues.',
      ],
    },
    {
      company:'An Thai Khang Joint Stock Company',
      role:'Warehouse and logistics department head',
      period:'Sep 2018 – Apr 2020',
      bullets:[
        'Managed and trained warehouse logistics staff while coordinating goods movement and stock accuracy.',
        'Controlled storage time, inter-warehouse transfers, delivery operations and delivery-coverage expansion.',
        'Built operating rules, department procedures and development plans with cost responsibility.',
      ],
    },
    {
      company:'Mobile World Joint Stock Company',
      role:'Store manager',
      period:'Nov 2015 – Apr 2018',
      bullets:[
        'Managed store staff, team capability and staffing proposals against operating needs.',
        'Planned revenue growth and tracked targets by product category.',
        'Controlled store image, merchandising, pricing, FIFO standards and customer complaint resolution.',
      ],
    },
  ],
  skills:[
    { label:'Operations', items:['Warehouse & logistics','Retail operations','Inventory control','Delivery routing','Process design'] },
    { label:'Data & automation', items:['Power BI','PostgreSQL','ERPNext / WMS','n8n','API workflows'] },
    { label:'Infrastructure', items:['Linux','Docker','LXD','Proxmox / KVM','NetBird','Observability'] },
    { label:'Engineering direction', items:['TypeScript','Next.js','Local-first systems','Auditability','AI-assisted operations'] },
  ],
  education:{ school:'Tien Giang College', credential:'Intermediate Graphic Design' },
}

const vi: Omit<CvContent,'systems'> = {
  version:'CV_P.02',
  name:'Thái Đăng Duy',
  headline:'Vận hành · Xây dựng hệ thống · Dữ liệu & Hạ tầng',
  location:'Tiền Giang, Việt Nam',
  phone:'+84 909 507 475',
  email:'me@thaiduy.digital',
  website:'thaiduy.digital',
  github:'github.com/n8n2erpnext',
  summary:'Có kinh nghiệm thực tế trong bán lẻ, kho vận, logistics và giao nhận; hiện tập trung xây dựng hệ phân tích local-first, tự động hóa, vận hành từ xa và hạ tầng có khả năng quan sát. Mục tiêu là biến kinh nghiệm vận hành thực địa thành những hệ thống có thể kiểm chứng, có ranh giới quyền hạn rõ ràng và luôn để lại bằng chứng.',
  focus:['Đúng hàng','Đúng lúc','Đúng dữ liệu'],
  experience:[
    {
      company:'Tổng Công ty Cổ phần Bưu chính Viettel',
      role:'Vận hành kho khu vực',
      period:'09/2024 – Hiện tại',
      bullets:[
        'Điều phối hoạt động xử lý kho khu vực từ nhập, xuất đến kiểm soát tồn kho.',
        'Đảm bảo hàng hóa được phân tuyến đầy đủ, chính xác và đúng thời gian cho các bưu cục trong và ngoài tỉnh.',
        'Theo dõi tính liên tục của first-mile, middle-mile và last-mile; can thiệp khi phát sinh nghẽn phân loại hoặc suy giảm chất lượng giao nhận.',
        'Phân tuyến giao hàng, theo dõi chất lượng lực lượng giao nhận và xử lý các trường hợp chăm sóc khách hàng.',
      ],
    },
    {
      company:'Công ty Cổ phần Thương mại Bách Hóa Xanh',
      role:'Trợ lý quản lý cửa hàng',
      period:'05/2020 – 11/2022',
      bullets:[
        'Hỗ trợ vận hành cửa hàng, tăng trưởng doanh thu, triển khai khuyến mãi và theo dõi hiệu quả chương trình.',
        'Kiểm soát đặt hàng, nhận hàng, luồng FMCG/FRESH, trưng bày, FIFO và độ chính xác tồn kho.',
        'Quản lý nhân sự cửa hàng và xử lý các vấn đề phát sinh trong vận hành hoặc nội bộ đội ngũ.',
      ],
    },
    {
      company:'Công ty Cổ phần An Thái Khang',
      role:'Trưởng bộ phận kho vận',
      period:'09/2018 – 04/2020',
      bullets:[
        'Quản lý, đào tạo nhân sự kho vận và điều phối luồng hàng trong khi duy trì độ chính xác tồn kho.',
        'Kiểm soát thời gian lưu kho, điều chuyển giữa các kho, hoạt động giao hàng và mở rộng vùng giao nhận.',
        'Xây dựng quy định vận hành, quy trình bộ phận và kế hoạch phát triển gắn với trách nhiệm chi phí.',
      ],
    },
    {
      company:'Công ty Cổ phần Thế Giới Di Động',
      role:'Quản lý cửa hàng',
      period:'11/2015 – 04/2018',
      bullets:[
        'Quản lý nhân sự cửa hàng, phát triển năng lực đội ngũ và đề xuất nhân sự theo nhu cầu vận hành.',
        'Lập kế hoạch tăng trưởng doanh thu và theo dõi mục tiêu theo nhóm sản phẩm.',
        'Kiểm soát hình ảnh cửa hàng, trưng bày, giá bán, FIFO và xử lý khiếu nại khách hàng.',
      ],
    },
  ],
  skills:[
    { label:'Vận hành', items:['Kho vận & logistics','Vận hành bán lẻ','Kiểm soát tồn kho','Phân tuyến giao nhận','Thiết kế quy trình'] },
    { label:'Dữ liệu & tự động hóa', items:['Power BI','PostgreSQL','ERPNext / WMS','n8n','API workflow'] },
    { label:'Hạ tầng', items:['Linux','Docker','LXD','Proxmox / KVM','NetBird','Observability'] },
    { label:'Hướng kỹ thuật', items:['TypeScript','Next.js','Local-first','Auditability','Vận hành có AI hỗ trợ'] },
  ],
  education:{ school:'Cao đẳng Tiền Giang', credential:'Trung cấp Thiết kế đồ họa' },
}

export async function buildCvContent(locale:Locale): Promise<CvContent> {
  const base=locale==='vi'?vi:en
  const projects=await getRegistry('project')
  const systems=projects.slice(0,4).map(item=>({
    name:textFor(item.label,locale),
    role:textFor(item.title,locale),
    summary:textFor(item.summary,locale),
  }))
  return { ...base, systems }
}
