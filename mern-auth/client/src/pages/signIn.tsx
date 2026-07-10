import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { Eye, EyeOff } from "lucide-react"
import axios from "axios"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
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
  const [searchParams] = useSearchParams()

  const [credentials, setCredentials] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Show a friendly message when GitHub redirects back with ?error=
  useEffect(() => {
    const oauthError = searchParams.get("error")
    if (!oauthError) return

    const errorMessages: Record<string, string> = {
      github_auth_cancelled: "GitHub sign-in was cancelled.",
      github_auth_failed: "GitHub sign-in failed. Please try again.",
      github_redirect_failed: "Could not connect to GitHub. Please try again.",
      invalid_state: "Invalid OAuth state. Please try again.",
      no_code: "No authorization code received from GitHub.",
    }

    setError(
      errorMessages[oauthError] ?? "Authentication failed. Please try again."
    )
  }, [searchParams])

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

  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/github"
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

            {/* Email */}
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

            {/* Password */}
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

            {/* Messages */}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400" role="status">
                {success}
              </p>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-border" />
              <span className="mx-4 flex-shrink text-xs uppercase text-muted-foreground">
                Or
              </span>
              <div className="flex-grow border-t border-border" />
            </div>

            {/* Google */}
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
              />
            </div>

            {/* GitHub */}
            <button
              type="button"
              onClick={handleGitHubLogin}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.52 11.52 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

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
