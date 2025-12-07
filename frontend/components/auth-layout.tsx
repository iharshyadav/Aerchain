import type React from "react"
import Link from "next/link"
import { Package } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description: string
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-foreground/20 backdrop-blur rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold">Aerchain</span>
          </Link>

          <div className="space-y-6">
            <blockquote className="text-2xl font-medium leading-relaxed text-balance">
              "Aerchain has transformed how we manage our supply chain. The vendor collaboration features alone have
              saved us countless hours."
            </blockquote>
            <div>
              <p className="font-semibold">Sarah Johnson</p>
              <p className="text-primary-foreground/80">Head of Procurement, TechCorp</p>
            </div>
          </div>

          <div className="flex gap-8 text-sm text-primary-foreground/80">
            <div>
              <p className="text-3xl font-bold text-primary-foreground">500+</p>
              <p>Active Vendors</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">10K+</p>
              <p>Transactions</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">99.9%</p>
              <p>Uptime</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-semibold text-foreground">Aerchain</span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 text-muted-foreground">{description}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
