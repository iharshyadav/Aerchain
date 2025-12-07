import { Suspense } from "react"
import { SignupForm } from "@/components/signup-form"
import { AuthLayout } from "@/components/auth-layout"

export default function SignupPage() {
  return (
    <AuthLayout title="Create an account" description="Get started with Aerchain today">
      <Suspense fallback={<div>Loading...</div>}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  )
}
