import { LoginForm } from "@/components/login-form"
import { AuthLayout } from "@/components/auth-layout"

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" description="Sign in to your account to continue">
      <LoginForm />
    </AuthLayout>
  )
}
