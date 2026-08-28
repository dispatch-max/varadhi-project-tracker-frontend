import { RegisterForm } from '@/components/auth/register-form'
import logoImg from '@/../public/projectlogo-removebg-preview.png'
export const metadata = {
  title: 'Register',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-14 h-14  mb-4">
            <img 
              src={logoImg.src} 
              alt="Varadhi Logo" 
              className="w-8 h-8 object-contain" 
            />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            Create Account
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fill in your details to get started
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <RegisterForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Internal tool — Varadhi Club © 2026
        </p>

      </div>
    </div>
  )
}