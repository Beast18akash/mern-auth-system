import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export const Home = () => {
  const navigate = useNavigate()

  const handleSignOut = () => {
    // Clear the token cookie
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    // Redirect to sign-in page
    navigate("/signin")
  }

  return (
    <div className="flex min-h-svh w-full flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">Welcome to the Home Page!</h1>
      <p>You are successfully signed in.</p>
      <Link
        to="/dashboard"
        className="text-primary underline-offset-4 hover:underline text-sm"
      >
        Go to Dashboard
      </Link>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  )
}