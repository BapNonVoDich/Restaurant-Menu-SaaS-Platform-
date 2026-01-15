// Vietnamese translations for the Restaurant SaaS Platform
export const translations = {
  // Common
  common: {
    loading: 'Đang tải...',
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    create: 'Tạo mới',
    back: 'Quay lại',
    logout: 'Đăng xuất',
    yes: 'Có',
    no: 'Không',
  },
  
  // Auth
  auth: {
    login: 'Đăng nhập',
    register: 'Đăng ký',
    username: 'Tên đăng nhập',
    email: 'Email',
    password: 'Mật khẩu',
    confirmPassword: 'Xác nhận mật khẩu',
    signIn: 'Đăng nhập',
    signUp: 'Đăng ký',
    signingIn: 'Đang đăng nhập...',
    creatingAccount: 'Đang tạo tài khoản...',
    dontHaveAccount: 'Chưa có tài khoản? Đăng ký',
    alreadyHaveAccount: 'Đã có tài khoản? Đăng nhập',
    signInToAccount: 'Đăng nhập vào tài khoản của bạn',
    createYourAccount: 'Tạo tài khoản của bạn',
  },
  
  // Dashboard
  dashboard: {
    title: 'Bảng điều khiển',
    overview: 'Tổng quan',
    menuManagement: 'Quản lý thực đơn',
    categories: 'Danh mục',
    products: 'Sản phẩm',
    orders: 'Đơn hàng',
    subscription: 'Đăng ký',
    storeSettings: 'Cài đặt cửa hàng',
    storeName: 'Tên cửa hàng',
    urlSlug: 'URL Slug',
    menuUrl: 'URL thực đơn',
    publicationStatus: 'Trạng thái xuất bản',
    description: 'Mô tả',
    noDescription: 'Chưa có mô tả. Thêm mô tả trong cài đặt',
    quickActions: 'Thao tác nhanh',
    addProduct: 'Thêm sản phẩm',
    addProductDesc: 'Thêm một món mới vào thực đơn',
    manageCategories: 'Quản lý danh mục',
    manageCategoriesDesc: 'Tổ chức các món ăn của bạn',
    publishMenu: 'Xuất bản thực đơn',
    publishMenuDesc: 'Đăng ký để làm cho thực đơn công khai',
    menuIsLive: 'Thực đơn đã được công khai',
    menuIsLiveDesc: 'Thực đơn của bạn đã công khai tại',
    status: {
      active: 'Đã xuất bản (Thực đơn công khai)',
      inactive: 'Bản nháp (Thực đơn riêng tư - thanh toán để xuất bản)',
      trial: 'Thời gian dùng thử',
      expired: 'Đã hết hạn',
    },
    trialStatus: {
      active: 'Đang trong thời gian dùng thử',
      expired: 'Thời gian dùng thử đã hết hạn',
      daysLeft: 'Còn {days} ngày dùng thử',
    },
    banner: {
      private: 'Thực đơn của bạn hiện đang ở chế độ riêng tư. Thêm sản phẩm và danh mục, sau đó đăng ký để xuất bản thực đơn và làm cho nó có thể truy cập qua mã QR.',
    },
  },
  
  // Menu
  menu: {
    title: 'Quản lý thực đơn',
    viewManage: 'Xem và quản lý các món trong thực đơn',
    manageCategories: 'Quản lý danh mục',
    addProduct: 'Thêm sản phẩm',
    noProductsInCategory: 'Chưa có sản phẩm nào trong danh mục này.',
    emptyMenu: 'Thực đơn của bạn đang trống. Bắt đầu bằng cách tạo danh mục và sản phẩm.',
    createCategory: 'Tạo danh mục',
    available: 'Có sẵn',
    unavailable: 'Không có sẵn',
  },
  
  // Categories
  categories: {
    title: 'Danh mục',
    organizeMenu: 'Tổ chức thực đơn của bạn bằng danh mục',
    addCategory: 'Thêm danh mục',
    createNewCategory: 'Tạo danh mục mới',
    categoryName: 'Tên danh mục',
    sortOrder: 'Thứ tự sắp xếp',
    products: 'Sản phẩm',
    actions: 'Thao tác',
    viewProducts: 'Xem sản phẩm',
    noCategories: 'Chưa có danh mục nào. Tạo danh mục đầu tiên để tổ chức thực đơn của bạn.',
    placeholder: 'Ví dụ: Khai vị, Món chính, Tráng miệng',
  },
  
  // Products
  products: {
    title: 'Sản phẩm',
    manageProducts: 'Quản lý sản phẩm trong thực đơn',
    createNewProduct: 'Tạo sản phẩm mới',
    productName: 'Tên sản phẩm',
    price: 'Giá (VNĐ)',
    description: 'Mô tả',
    category: 'Danh mục',
    noCategory: 'Không có danh mục',
    imageUrl: 'URL hình ảnh',
    availableForOrdering: 'Có sẵn để đặt hàng',
    name: 'Tên',
    categoryLabel: 'Danh mục',
    status: 'Trạng thái',
    noProducts: 'Chưa có sản phẩm nào. Tạo sản phẩm đầu tiên để xây dựng thực đơn của bạn.',
    tip: 'Mẹo: Tạo danh mục trước để tổ chức sản phẩm tốt hơn.',
    placeholder: {
      name: 'ví dụ: Gà nướng',
      price: '50000',
      description: 'Mô tả sản phẩm...',
      image: 'https://example.com/image.jpg',
    },
  },
  
  // Subscription
  subscription: {
    title: 'Xuất bản thực đơn',
    subtitle: 'Đăng ký để xuất bản thực đơn của bạn và làm cho nó có thể truy cập công khai qua mã QR',
    backToDashboard: 'Quay lại bảng điều khiển',
    publishMenu: 'Xuất bản thực đơn',
    publishDesc: 'Thanh toán để xuất bản thực đơn của bạn và cho phép khách hàng truy cập qua mã QR',
    subscribe: 'Đăng ký ngay',
    processing: 'Đang xử lý...',
    currentStatus: 'Trạng thái hiện tại',
    trialActive: 'Bạn đang trong thời gian dùng thử 7 ngày miễn phí',
    trialExpired: 'Thời gian dùng thử đã hết. Vui lòng đăng ký để tiếp tục sử dụng.',
    paymentUrlError: 'Không nhận được URL thanh toán',
    paymentError: 'Không thể khởi tạo thanh toán',
  },
  
  // Orders
  orders: {
    title: 'Đơn hàng',
    manageOrders: 'Quản lý đơn hàng từ khách hàng',
  },
  
  // Settings
  settings: {
    title: 'Cài đặt cửa hàng',
    storeSettings: 'Cài đặt thông tin cửa hàng',
  },
  
  // Errors
  errors: {
    networkError: 'Lỗi kết nối. Vui lòng thử lại.',
    loginFailed: 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập của bạn.',
    registrationFailed: 'Đăng ký thất bại. Vui lòng kiểm tra thông tin đầu vào của bạn.',
    passwordsDoNotMatch: 'Mật khẩu không khớp',
    failedToCreate: 'Không thể tạo',
    failedToFetch: 'Không thể tải dữ liệu',
  },
}

export type TranslationKey = keyof typeof translations
