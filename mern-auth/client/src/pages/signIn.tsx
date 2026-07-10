import { useState, type ChangeEvent, type FormEvent } from "react"
import { Eye, EyeOff } from "lucide-react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import { GoogleLogin } from "@react-oauth/google"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const SignIn = () => {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/signin",
        credentials
      )

      document.cookie = `token=${response.data.token}; path=/; max-age=86400; SameSite=Lax`
      setSuccess(response.data.message ?? "Signed in successfully!")
      setCredentials({ email: "", password: "" })
      navigate("/dashboard")
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/google",
        { idToken: credentialResponse.credential }
      )

      document.cookie = `token=${response.data.token}; path=/; max-age=86400; SameSite=Lax`
      setSuccess(response.data.message ?? "Signed in successfully!")
      navigate("/dashboard")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ?? "Google Sign-In failed. Please try again."
        )
      } else {
        setError("Google Sign-In failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError("Google Sign-In was unsuccessful. Please try again.")
  }

  return (
    <div className="flex min-h-svh w-full flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md text-left">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={credentials.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={credentials.password}
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
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p
                className="text-sm text-green-600 dark:text-green-400"
                role="status"
              >
                {success}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">Or</span>
              <div className="flex-grow border-t border-border"></div>
            </div>
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
