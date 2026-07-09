import { useState, type ChangeEvent, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { forgotPassword } from "@/lib/api"
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
import axios from "axios"

export const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const validateEmail = (val: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(val)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Frontend validation
    if (!email.trim()) {
      setError("Email is required.")
      setLoading(false)
      return
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.")
      setLoading(false)
      return
    }

    try {
      const data = await forgotPassword(email)
      setSuccess(data.message || "A password reset link has been sent to your email.")
      setEmail("")
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
          <CardTitle>Forgot password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a recovery link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
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
              <p
                className="text-sm text-green-600 dark:text-green-400"
                role="status"
              >
                {success}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending link..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              to="/signin"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
