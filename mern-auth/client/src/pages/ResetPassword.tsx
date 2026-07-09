import { useState, type ChangeEvent, type FormEvent } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { resetPassword } from "@/lib/api"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import axios from "axios"

export const ResetPassword = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswords((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const { password, confirmPassword } = passwords

    // Frontend validations
    if (!password || !confirmPassword) {
      setError("All fields are required.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    if (!token) {
      setError("Invalid or missing reset token.")
      setLoading(false)
      return
    }

    try {
      const data = await resetPassword(token, password)
      setSuccess(data.message || "Password updated successfully!")
      setPasswords({ password: "", confirmPassword: "" })
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        navigate("/signin")
      }, 3000)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ?? "Something went wrong. Please try again."
        )
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md text-left">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.password}
                  onChange={handleChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={passwords.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {success && (
              <div className="flex flex-col gap-1">
                <p
                  className="text-sm text-green-600 dark:text-green-400"
                  role="status"
                >
                  {success}
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirecting to Sign In page in 3 seconds...
                </p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !!success}>
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
