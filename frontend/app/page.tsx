import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-background">
      <div className="z-10 max-w-5xl w-full items-center justify-between">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-text mb-4">
            Restaurant SaaS Platform
          </h1>
          <p className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto">
            Create and manage your digital menu with ease. Publish your menu online and let customers order directly.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/auth/login"
            className="btn-primary w-full sm:w-auto px-8 py-3"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="w-full sm:w-auto px-8 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 font-medium cursor-pointer shadow-soft hover:shadow-soft-md"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  )
}
