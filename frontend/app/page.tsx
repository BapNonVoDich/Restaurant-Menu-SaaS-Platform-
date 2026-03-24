import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-background">
      <div className="z-10 max-w-5xl w-full items-center justify-between">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-text mb-4">
            Nền tảng SaaS nhà hàng
          </h1>
          <p className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto">
            Tạo và quản lý menu số của bạn dễ dàng. Xuất bản menu trực tuyến và cho phép khách hàng đặt món ngay.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
          <Link
            href="/staff"
            className="w-full sm:w-auto px-8 py-3 bg-amber-50 text-amber-700 border-2 border-amber-500 rounded-lg hover:bg-amber-100 transition-all duration-200 font-medium cursor-pointer"
          >
            Cổng nhân viên
          </Link>
          <Link
            href="/auth/register-staff"
            className="w-full sm:w-auto px-8 py-3 bg-white text-amber-800 border-2 border-amber-400 rounded-lg hover:bg-amber-50 transition-all duration-200 font-medium cursor-pointer"
          >
            Đăng ký nhân viên
          </Link>
          <Link
            href="/auth/login"
            className="btn-primary w-full sm:w-auto px-8 py-3"
          >
            Đăng nhập
          </Link>
          <Link
            href="/auth/register"
            className="w-full sm:w-auto px-8 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 font-medium cursor-pointer shadow-soft hover:shadow-soft-md"
          >
            Bắt đầu
          </Link>
          <Link
            href="/demo/menu"
            className="w-full sm:w-auto px-8 py-3 bg-white text-text border-2 border-border rounded-lg hover:bg-background-muted transition-all duration-200 font-medium cursor-pointer"
          >
            Xem menu mẫu
          </Link>
        </div>
      </div>
    </main>
  )
}
