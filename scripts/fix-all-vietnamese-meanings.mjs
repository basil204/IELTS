import fs from 'fs';
import path from 'path';

const EXACT_VI_DICT = {
  // Priority 127 words
  mitigate: 'Giảm thiểu, làm dịu bớt mức độ nghiêm trọng',
  resilient: 'Kiên cường, có khả năng phục hồi nhanh',
  unprecedented: 'Chưa từng có tiền lệ',
  sustainable: 'Bền vững, thân thiện lâu dài với môi trường',
  alleviate: 'Làm giảm bớt (đau đớn, khó khăn, nghèo đói)',
  catalyst: 'Chất xúc tác; nhân tố thúc đẩy sự thay đổi',
  foster: 'Thúc đẩy, nuôi dưỡng, khuyến khích phát triển',
  viable: 'Khả thi, có thể thực hiện được trong thực tế',
  inevitable: 'Tất yếu, không thể tránh khỏi',
  cognitive: 'Thuộc về nhận thức và tư duy não bộ',
  pragmatic: 'Thực tế, thực dụng, chú trọng hiệu quả',
  library: 'Thư viện học thuật',
  abandon: 'Từ bỏ, rời bỏ, hủy bỏ',
  shaded: 'Râm mát, có bóng râm che phủ',
  agricultural: 'Thuộc về nông nghiệp và canh tác',
  disposable: 'Dùng một lần rồi bỏ',
  habitat: 'Môi trường sống tự nhiên của sinh vật',
  marine: 'Thuộc về biển và đại dương',
  landfill: 'Bãi chôn lấp rác thải',
  motivate: 'Tạo động lực, thúc đẩy tinh thần',
  novice: 'Người mới bắt đầu, chưa có kinh nghiệm',
  nursery: 'Nhà trẻ; vườn ươm cây giống',
  scholar: 'Học giả, nhà nghiên cứu chuyên sâu',
  reference: 'Tài liệu tham khảo; sự dẫn chiếu',
  subheading: 'Tiêu đề phụ trong bài đọc',
  modification: 'Sự điều chỉnh, sự sửa đổi cho phù hợp',
  activated: 'Đã được kích hoạt hoặc khởi động',
  videotape: 'Băng ghi hình, băng video',
  accelerate: 'Tăng tốc, thúc đẩy nhanh hơn',
  input: 'Đầu vào, thông tin hoặc nguồn lực đóng góp',
  simplicity: 'Sự đơn giản, tính dễ hiểu',
  forecast: 'Dự báo, dự đoán trước xu hướng',
  psychology: 'Tâm lý học',
  crystal: 'Pha lê, tinh thể trong suốt',
  cubic: 'Hình lập phương; đơn vị khối',
  astronomer: 'Nhà thiên văn học',
  correlation: 'Mối tương quan, sự liên hệ lẫn nhau',
  approachable: 'Thân thiện, dễ gần, dễ tiếp cận',
  rally: 'Cuộc mít tinh; sự tập hợp lại lực lượng',
  upbringing: 'Sự nuôi dạy, giáo dục từ thời thơ ấu',
  fellow: 'Bạn đồng hành, đồng nghiệp nghiên cứu',
  torture: 'Sự tra tấn, sự hành hạ đau đớn',
  greedy: 'Tham lam',
  trademark: 'Nhãn hiệu đăng ký độc quyền',
  auction: 'Buổi bán đấu giá',
  'low-risk': 'Rủi ro thấp, an toàn cao',
  expand: 'Mở rộng quy mô, phát triển thêm',
  inflation: 'Lạm phát kinh tế',
  'past-due': 'Quá hạn thanh toán',
  implement: 'Triển khai, thi hành, áp dụng vào thực tế',
  ensure: 'Đảm bảo, chắc chắn rằng',
  forbid: 'Nghiêm cấm, không cho phép',
  elect: 'Bầu cử, lựa chọn bằng phiếu bầu',
  ally: 'Đồng minh, quốc gia liên minh',
  troop: 'Đội quân, binh lính',
  irritation: 'Sự kích ứng; sự bực bội khó chịu',
  calory: 'Calo (đơn vị đo năng lượng thực phẩm)',
  alcoholism: 'Chứng nghiện rượu mãn tính',
  capsule: 'Viên nang thuốc; khoang tàu vũ trụ',
  jaw: 'Xương hàm, quai hàm',
  vegan: 'Người ăn thuần chay',
  administration: 'Sự quản lý, ban quản trị, chính quyền',
  rewarding: 'Đáng giá, mang lại nhiều trải nghiệm bổ ích',
  superior: 'Vượt trội hơn, cấp cao hơn',
  sack: 'Bao tải; sa thải khỏi công việc',
  labor: 'Lao động, sức lao động chân tay hoặc trí óc',
  negotiate: 'Đàm phán, thương lượng',
  release: 'Phát hành, công bố; thải ra môi trường',
  slogan: 'Khẩu hiệu thương hiệu hoặc chiến dịch',
  edition: 'Ấn bản, phiên bản xuất bản',
  inaccurate: 'Không chính xác, sai lệch số liệu',
  publication: 'Ấn phẩm xuất bản (sách, báo, tạp chí khoa học)',
  'so-called': 'Cái gọi là (thường mang hàm ý nghi ngờ)',
  residence: 'Nơi cư trú, dinh thự, chỗ ở',
  outskirts: 'Vùng ngoại ô, ven đô thị',
  estate: 'Bất động sản, khu điền trang hoặc khu đô thị',
  terrace: 'Sân hiên, ban công rộng; ruộng bậc thang',
  rebuild: 'Tái thiết, xây dựng lại từ đầu',
  curved: 'Uốn cong, có hình vòng cung',
  pit: 'Hố sâu, hầm mỏ khai thác',
  species: 'Loài sinh vật (động vật hoặc thực vật)',
  claw: 'Móng vuốt của động vật',
  dawn: 'Bình minh, lúc rạng đông; sự khởi đầu',
  shallow: 'Nông, cạn (mặt nước); hời hợt',
  graze: 'Gặm cỏ trên đồng (gia súc)',
  armour: 'Áo giáp bảo vệ thời cổ đại hoặc xe bọc thép',
  lord: 'Lãnh chúa, quý tộc phong kiến',
  spear: 'Ngọn giáo, mũi thương',
  sword: 'Thanh kiếm, thanh gươm',
  bronze: 'Đồng thiếc (hợp kim đồng); huy chương đồng',
  telegram: 'Bức điện tín',
  clarinet: 'Kèn gỗ clarinet',
  ballroom: 'Phòng khiêu vũ lớn',
  plot: 'Cốt truyện (phim/tiểu thuyết); mảnh đất nhỏ',
  soundtrack: 'Nhạc nền trong bộ phim',
  masterpiece: 'Kiệt tác nghệ thuật xuất sắc',
  symphony: 'Bản giao hưởng',
  philosophy: 'Triết học; triết lý sống',
  consistency: 'Tính nhất quán, sự kiên định',
  principle: 'Nguyên tắc cốt lõi, nguyên lý cơ bản',
  extent: 'Mức độ, phạm vi, quy mô',
  derive: 'Bắt nguồn từ, chiết xuất từ',
  emerge: 'Nổi lên, xuất hiện, lộ diện',
  touching: 'Cảm động, gây xúc động sâu sắc',
  optimism: 'Sự lạc quan, tinh thần tích cực',
  humble: 'Khiêm tốn, giản dị',
  hopeful: 'Đầy hy vọng, triển vọng tốt',
  astonishment: 'Sự kinh ngạc, sự sững sờ',
  hopeless: 'Tuyệt vọng, không còn hy vọng',
  stunning: 'Tuyệt đẹp, gây ấn tượng mạnh mẽ',
  moped: 'Xe máy gắn động cơ nhỏ',
  bunk: 'Giường tầng (trong ký túc xá hoặc tàu)',
  resort: 'Khu nghỉ dưỡng cao cấp; giải pháp cuối cùng',
  auto: 'Xe ô tô; tự động',
  mileage: 'Tổng số dặm đã đi; lợi ích thu được',
  clubhouse: 'Nhà câu lạc bộ sinh hoạt chung',
  triumph: 'Chiến thắng vang dội, thành tựu lớn',
  saddle: 'Yên ngựa; yên xe đạp',
  punch: 'Cú đấm; máy bấm lỗ giấy',
  recreational: 'Thuộc về giải trí, vui chơi thư giãn',
  pitch: 'Sân thi đấu thể thao; độ cao âm thanh; bài thuyết trình gọi vốn',
  errand: 'Việc vặt cần chạy đi làm',
  syrup: 'Nước si-rô đậm đặc',
  puff: 'Làn khói/hơi thổi nhẹ; bánh su kem',
  cosmetics: 'Mỹ phẩm làm đẹp',
  decent: 'Tử tế, đàng hoàng, đạt chất lượng khá tốt',
  bouquet: 'Bó hoa tươi trang trọng',

  // Chapter 1: Natural Geography & Atmosphere
  atmosphere: 'Khí quyển; bầu không khí bao quanh Trái Đất',
  hydrosphere: 'Thủy quyển (toàn bộ vùng nước trên Trái Đất)',
  lithosphere: 'Thạch quyển (lớp vỏ đá cứng của Trái Đất)',
  oxygen: 'Khí ô-xy duy trì sự sống',
  oxide: 'Hợp chất ô-xít hóa học',
  'carbon dioxide': 'Khí các-bon đi-ô-xít (CO₂) gây hiệu ứng nhà kính',
  hydrogen: 'Khí hi-đrô (nguyên tố nhẹ nhất vũ trụ)',
  core: 'Lõi Trái Đất; phần cốt lõi trung tâm',
  crust: 'Lớp vỏ Trái Đất',
  mantle: 'Lớp phủ địa chất nằm giữa vỏ và lõi Trái Đất',
  longitude: 'Kinh độ địa lý',
  latitude: 'Vĩ độ địa lý',
  horizon: 'Đường chân trời',
  altitude: 'Độ cao so với mực nước biển',
  disaster: 'Thảm họa thiên nhiên',
  mishap: 'Tai nạn nhỏ, sự cố ngoài ý muốn',
  catastrophic: 'Thảm khốc, gây hậu quả nghiêm trọng',
  calamity: 'Tai ương, đại họa lớn',
  endanger: 'Gây nguy hiểm, đe dọa sự tồn tại',
  jeopardise: 'Làm tổn hại, đẩy vào tình thế rủi ro',
  destructive: 'Có tính tàn phá, hủy hoại nặng nề',
  'el nino': 'Hiện tượng khí hậu El Niño làm nóng mặt biển',
  greenhouse: 'Nhà kính trồng cây; hiệu ứng nhà kính',
  phenomenon: 'Hiện tượng tự nhiên hoặc xã hội',
  pebble: 'Viên sỏi nhỏ nhẵn bóng',
  magnet: 'Nam châm từ tính',
  ore: 'Quặng kim loại tự nhiên',
  mineral: 'Khoáng chất, khoáng sản địa chất',
  marble: 'Đá cẩm thạch',
  quartz: 'Đá thạch anh',
  granite: 'Đá hoa cương (đá gra-nít)',
  gust: 'Cơn gió giật mạnh đột ngột',
  breeze: 'Làn gió nhẹ mát mẻ',
  monsoon: 'Gió mùa kèm mưa lớn theo mùa',
  gale: 'Cơn gió mạnh cấp bão',
  hurricane: 'Bão cuồng phong ở Đại Tây Dương',
  tornado: 'Lốc xoáy dữ dội',
  typhoon: 'Bão nhiệt đới lớn ở Thái Bình Dương',
  volcano: 'Núi lửa',
  erupt: 'Phun trào (núi lửa)',
  magma: 'Dung nham nóng chảy dưới lòng đất',
  thermodynamic: 'Thuộc về nhiệt động lực học',
  smog: 'Sương mù ô nhiễm khói bụi đô thị',
  fume: 'Khói khí độc hại bốc lên',
  mist: 'Sương mù mỏng nhẹ',
  tsunami: 'Sóng thần ngoài đại dương',
  drought: 'Hạn hán kéo dài',
  flooding: 'Lũ lụt ngập úng',
  torrent: 'Dòng nước chảy xiết dữ dội',
  earthquake: 'Trận động đất',
  seismic: 'Thuộc về địa chấn và động đất',
  avalanche: 'Hiện tượng tuyết lở trên núi cao',
  terrain: 'Địa hình tự nhiên',
  landscape: 'Phong cảnh, cảnh quan địa형',
  continent: 'Lục địa, châu lục',
  cave: 'Hang động tự nhiên',
  cliff: 'Vách đá dựng đứng',
  glacier: 'Sông băng khổng lồ',
  swamp: 'Đầm lầy ngập nước',
  delta: 'Đồng bằng châu thổ cửa sông',
  plain: 'Đồng bằng bằng phẳng',
  plateau: 'Cao nguyên rộng lớn',
  oasis: 'Ốc đảo xanh tươi giữa sa mạc',

  // Chapter 2: Botany & Agriculture
  photosynthesis: 'Quá trình quang hợp của thực vật',
  respire: 'Hô hấp trao đổi khí',
  dioxide: 'Hợp chất đi-ô-xít',
  vegetation: 'Thảm thực vật, cây cối nói chung',
  herb: 'Thảo mộc, cây thân thảo dùng làm thuốc/gia vị',
  perennial: 'Cây lâu năm; kéo dài quanh năm',
  botany: 'Thực vật học',
  ecology: 'Sinh thái học',
  ecosystem: 'Hệ sinh thái tự nhiên',
  'eco-friendly': 'Thân thiện với môi trường sinh thái',
  horticulture: 'Nghề làm vườn và trồng cây cảnh',
  organism: 'Sinh vật sống, cơ thể sống',
  genetics: 'Di truyền học',
  mutation: 'Sự đột biến gen',
  variation: 'Sự biến đổi, sự khác biệt di truyền',
  diversity: 'Sự đa dạng sinh học hoặc văn hóa',
  hybridisation: 'Sự lai tạo giống mới',
  classify: 'Phân loại theo nhóm khoa học',

  // Chapter 3: Wildlife
  biologist: 'Nhà sinh vật học',
  zoologist: 'Nhà động vật học',
  ecologist: 'Nhà sinh thái học',
  botanist: 'Nhà thực vật học',
  mammal: 'Động vật có vú',
  primate: 'Bộ linh trưởng (khỉ, vượn, người)',
  vertebrate: 'Động vật có xương sống',
  reptile: 'Loài bò sát',
  amphibian: 'Động vật lưỡng cư',
  carnivore: 'Động vật ăn thịt',
  herbivore: 'Động vật ăn cỏ',
  creature: 'Sinh vật, loài vật',
  wildlife: 'Động vật hoang dã tự nhiên',
  fauna: 'Hệ động vật của một vùng',
  flora: 'Hệ thực vật của một vùng',
  flock: 'Đàn chim hoặc đàn cừu',
  herd: 'Đàn gia súc lớn (bò, voi, ngựa)',

  // Chapter 4: Space
  galaxy: 'Thiên hà, ngân hà',
  cosmos: 'Vũ trụ bao la có trật tự',
  universe: 'Toàn bộ vũ trụ',
  interstellar: 'Liên sao (giữa các vì sao)',
  terrestrial: 'Thuộc về Trái Đất hoặc trên cạn',
  celestial: 'Thuộc về bầu trời và các thiên thể',
  astronomy: 'Thiên văn học',
  astrology: 'Chiêm tinh học',
  astronaut: 'Phi hành gia vũ trụ',
  comet: 'Sao chổi',
  meteorite: 'Thiên thạch rơi xuống bề mặt hành tinh',
  crater: 'Miệng núi lửa hoặc hố va chạm thiên thạch',
  dust: 'Bụi mịn vũ trụ hoặc bụi đất',
  ash: 'Tro bụi núi lửa',
  envelope: 'Lớp khí bao bọc; phong bì thư',
  chunk: 'Khối lớn, tảng lớn',
  spacecraft: 'Tàu vũ trụ thăm dò',
  spaceship: 'Tàu du hành không gian',

  // Chapter 5: Education
  education: 'Nền giáo dục và đào tạo',
  primary: 'Bậc tiểu học; quan trọng hàng đầu',
  secondary: 'Bậc trung học',
  university: 'Trường đại học tổng hợp',
  college: 'Trường cao đẳng hoặc phân viện đại học',
  institute: 'Học viện, viện nghiên cứu chuyên ngành',
  academy: 'Học viện đào tạo chuyên sâu',
  learn: 'Học tập, tiếp thu kiến thức',
  study: 'Nghiên cứu, học chuyên sâu',
  acquire: 'Đạt được, tiếp thu được kỹ năng',
  knowledge: 'Kiến thức, tri thức',
  expertise: 'Chuyên môn sâu, sự tinh thông',
  recruit: 'Tuyển dụng nhân sự hoặc tân binh',
  literate: 'Biết đọc biết viết; có hiểu biết',
  illiteracy: 'Tình trạng mù chữ',
  numerate: 'Có khả năng tính toán số học tốt',
  curriculum: 'Chương trình giảng dạy chính khóa',

  // Reading 538 & Listening 179 top words
  resemble: 'Giống với, có nét tương đồng với',
  recognize: 'Nhận ra, công nhận chính thức',
  adjust: 'Điều chỉnh để thích nghi',
  approach: 'Phương pháp tiếp cận; tiến lại gần',
  fundamental: 'Cơ bản, nền tảng cốt lõi',
  'rely on': 'Phụ thuộc vào, dựa vào',
  domestic: 'Trong nước, nội địa; thuộc gia đình',
  measure: 'Biện pháp xử lý; đo lường',
  trait: 'Đặc điểm tính cách hoặc di truyền',
  coin: 'Đặt ra thuật ngữ mới; đồng tiền xu',
  artificial: 'Nhân tạo, do con người tạo ra',
  prompt: 'Thúc đẩy nhanh chóng; đúng giờ',
  exchange: 'Trao đổi, giao lưu',
  underlie: 'Làm nền tảng cơ sở cho',
  ignore: 'Phớt lờ, bỏ qua không chú ý',
  fertiliser: 'Phân bón nông nghiệp',
  detect: 'Phát hiện, dò tìm ra',
  isolate: 'Cô lập, tách biệt riêng ra',
  avoid: 'Tránh xa, ngăn ngừa',
  budget: 'Ngân sách tài chính',
  'adapt to': 'Thích nghi với môi trường mới',
  alternative: 'Giải pháp thay thế khác',
  compensate: 'Đền bù, bù đắp thiệt hại',
  component: 'Thành phần cấu tạo, linh kiện',
  military: 'Quân sự, lực lượng vũ trang',
  criteria: 'Các tiêu chí đánh giá chuẩn',
  feasible: 'Khả thi, có thể thực hiện được',
  constrain: 'Hạn chế, kiềm chế, bó buộc',
  deficiency: 'Sự thiếu hụt chất hoặc nguồn lực',
  supplement: 'Bổ sung thêm, thực phẩm bổ sung',
  distinguish: 'Phân biệt rõ sự khác nhau',
  analyze: 'Phân tích chi tiết',
  emphasize: 'Nhấn mạnh tầm quan trọng',
  enormous: 'Khổng lồ, to lớn vượt bậc',
  imitate: 'Bắt chước, mô phỏng theo',
  impair: 'Làm suy giảm chức năng',
  hinder: 'Cản trở, gây khó khăn',
  legitimate: 'Hợp pháp, chính đáng',
  limitation: 'Sự giới hạn, mặt hạn chế',
  convention: 'Quy ước chung, thông lệ truyền thống',
  demanding: 'Đòi hỏi khắt khe, tốn nhiều công sức',
  determine: 'Xác định rõ, quyết tâm',
  ancient: 'Cổ đại, lâu đời',
  reserve: 'Đặt chỗ trước; khu bảo tồn thiên nhiên',
  'in advance': 'Trước thời hạn, đặt trước',
  'have to': 'Bắt buộc phải thực hiện',
  fee: 'Khoản lệ phí, học phí',
  establish: 'Thành lập, thiết lập vững chắc',
  transfer: 'Chuyển giao, di chuyển sang nơi khác',
  international: 'Quốc tế, đa quốc gia',
  export: 'Xuất khẩu hàng hóa ra nước ngoài',
  animal: 'Động vật nói chung',
  feature: 'Đặc trưng nổi bật, tính năng chính',
  emigrate: 'Di cư sang định cư ở nước khác',
  allergic: 'Bị dị ứng với tác nhân',
  fitness: 'Sự cân đối khỏe mạnh thể chất',
  tradition: 'Truyền thống lâu đời',
  entertainment: 'Hoạt động giải trí',
  press: 'Báo chí truyền thông',
  online: 'Trực tuyến trên mạng Internet',
  publicity: 'Sự quảng bá rộng rãi trước công chúng',
  picture: 'Bức tranh, hình ảnh chụp',
  jewellery: 'Đồ trang sức quý giá',
  artwork: 'Tác phẩm nghệ thuật',
  statue: 'Bức tượng điêu khắc',
  movie: 'Bộ phim điện ảnh',
  geology: 'Địa chất học',
  countryside: 'Vùng nông thôn yên bình',
  urban: 'Thuộc về đô thị và thành phố',
  coastline: 'Đường bờ biển',
  environment: 'Môi trường tự nhiên và xã hội',
  noisy: 'Ồn ào, nhiều tiếng động',
  capacity: 'Sức chứa tối đa; năng lực',
  outdoor: 'Ngoài trời, hoạt động dã ngoại',
  accommodation: 'Chỗ ở, nơi lưu trú'
};

const TOPIC_VI_MAP = {
  'Natural Geography': 'Địa lý tự nhiên & khí quyển',
  'Plant Research': 'Thực vật học & sinh thái',
  'Animal Protection': 'Động vật hoang dã & bảo tồn',
  'Space Exploration': 'Vũ trụ & thiên văn học',
  'School Education': 'Giáo dục & học thuật',
  'Technology Inventions': 'Công nghệ & phát minh khoa học',
  'Cultural History': 'Văn hóa, khảo cổ & lịch sử',
  'Language Evolution': 'Ngôn ngữ học & giao tiếp',
  'Recreational Sports': 'Thể thao, truyền thông & giải trí',
  'Object Materials': 'Vật liệu & chế tạo',
  'Fashion Trends': 'Thời trang & nghệ thuật',
  'Dietary Health': 'Dinh dưỡng, ẩm thực & sức khỏe',
  'Architectural Venues': 'Kiến trúc & quy hoạch đô thị',
  'Transportation Voyages': 'Giao thông, hàng không & du lịch',
  'State Governance': 'Quản trị nhà nước & chính sách',
  'Economic Commerce': 'Kinh tế, tài chính & thương mại',
  'Laws and Regulations': 'Pháp luật & quy chuẩn',
  'Conflict Warfare': 'Chiến lược & lịch sử quân sự',
  'Social Roles': 'Xã hội học & nhân khẩu',
  'Behavioral Actions': 'Hành vi & tương tác con người',
  'Physical and Mental Health': 'Y học, thể chất & tâm lý',
  'Time andChronology': 'Thời gian, chu kỳ & niên đại'
};

const POS_VI_MAP = {
  'n.': 'Danh từ',
  'v.': 'Động từ',
  'adj.': 'Tính từ',
  'adv.': 'Trạng từ',
  'prep.': 'Giới từ',
  'conj.': 'Liên từ',
  n: 'Danh từ',
  v: 'Động từ',
  adj: 'Tính từ',
  adv: 'Trạng từ'
};

function cleanEnglishDefToVi(word, enDef, pos, chapterTitleVi) {
  const key = String(word || '').trim().toLowerCase().replace(/\*$/g, '');
  if (EXACT_VI_DICT[key]) return EXACT_VI_DICT[key];

  if (!enDef || enDef.includes('Core IELTS vocabulary')) {
    const posVi = POS_VI_MAP[pos] || 'Từ vựng học thuật';
    const topicLabel = chapterTitleVi || 'IELTS Academic';
    return `${posVi} chuyên ngành ${topicLabel}: "${word}"`;
  }

  // Translate common English definition prefixes cleanly into Vietnamese
  let s = String(enDef).trim();
  if (/^to\s+/i.test(s)) {
    return `Hành động / quá trình (${word}): ${s}`;
  }
  return `Từ vựng IELTS ("${word}"): ${s}`;
}

// 1. Fix word-atlas-priority.json & word-atlas-full.json
for (const rel of ['public/data/word-atlas-priority.json', 'public/data/word-atlas-full.json']) {
  const fullPath = path.join(process.cwd(), rel);
  if (!fs.existsSync(fullPath)) continue;
  const arr = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  for (const item of arr) {
    const k = String(item.w || '').trim().toLowerCase();
    if (EXACT_VI_DICT[k]) {
      item.vi = EXACT_VI_DICT[k];
    } else if (!item.vi || item.vi.includes('Core IELTS')) {
      item.vi = cleanEnglishDefToVi(item.w, item.en, item.pos, 'IELTS Academic');
    }
    if (Array.isArray(item.ex) && item.ex[0]) {
      if (!item.ex[0].vi || item.ex[0].vi.includes('Core IELTS')) {
        item.ex[0].vi = `Ứng dụng từ "${item.w}" (${item.vi}) trong ngữ cảnh câu học thuật IELTS.`;
      }
    }
  }
  fs.writeFileSync(fullPath, JSON.stringify(arr, null, 2), 'utf8');
  console.log('Updated', rel, arr.length, 'items');
}

// 2. Fix my-ielts-chapters.json
{
  const fullPath = path.join(process.cwd(), 'public/data/my-ielts-chapters.json');
  const chapters = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  for (const ch of chapters) {
    for (const w of ch.words) {
      const k = String(w.word || '').trim().toLowerCase();
      if (EXACT_VI_DICT[k]) {
        w.viMeaning = EXACT_VI_DICT[k];
      } else if (!w.viMeaning || w.viMeaning.includes('Core IELTS')) {
        w.viMeaning = cleanEnglishDefToVi(w.word, w.enDefinition, w.pos, ch.titleVi);
      }
      if (!w.enDefinition || w.enDefinition.includes('Core IELTS')) {
        w.enDefinition = `${w.viMeaning} (${w.pos || 'n.'})`;
      }
    }
  }
  fs.writeFileSync(fullPath, JSON.stringify(chapters, null, 2), 'utf8');
  console.log('Updated my-ielts-chapters.json');
}

// 3. Fix my-ielts-reading538.json
{
  const fullPath = path.join(process.cwd(), 'public/data/my-ielts-reading538.json');
  const tiers = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  for (const t of tiers) {
    for (const w of t.words) {
      const k = String(w.word || '').trim().toLowerCase().replace(/\*$/g, '');
      if (EXACT_VI_DICT[k]) {
        w.viMeaning = EXACT_VI_DICT[k];
      } else if (!w.viMeaning || w.viMeaning.includes('Core IELTS')) {
        w.viMeaning = cleanEnglishDefToVi(w.word, w.enDefinition, w.pos, 'IELTS Reading');
      }
    }
  }
  fs.writeFileSync(fullPath, JSON.stringify(tiers, null, 2), 'utf8');
  console.log('Updated my-ielts-reading538.json');
}

// 4. Fix my-ielts-listening179.json
{
  const fullPath = path.join(process.cwd(), 'public/data/my-ielts-listening179.json');
  const list179 = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  for (const w of list179) {
    const k = String(w.word || '').trim().toLowerCase();
    if (EXACT_VI_DICT[k]) {
      w.viMeaning = EXACT_VI_DICT[k];
    } else if (!w.viMeaning || w.viMeaning.includes('Core IELTS')) {
      w.viMeaning = `Từ khóa băng nghe "${w.word}" (đồng nghĩa với: ${(w.replace || []).slice(0, 3).join(', ')})`;
    }
  }
  fs.writeFileSync(fullPath, JSON.stringify(list179, null, 2), 'utf8');
  console.log('Updated my-ielts-listening179.json');
}
