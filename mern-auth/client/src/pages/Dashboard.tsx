import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface User {
  _id: string
  fullname: string
  email: string
  profilePicture: string | null
  providers: string[]
  createdAt: string
}

export const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // withCredentials: true sends the httpOnly cookie automatically.
    // No need to read document.cookie — it can't see httpOnly cookies anyway.
    axios
      .get("http://localhost:5000/api/auth/me", {
        withCredentials: true,
      })
      .then((res) => setUser(res.data.user))
      .catch(() => navigate("/signin", { replace: true }))
  }, [navigate])

  const handleSignOut = async () => {
    // Tell the server to clear the httpOnly cookie.
    // Clearing it client-side via document.cookie won't work for httpOnly cookies.
    await axios
      .post("http://localhost:5000/api/auth/logout", {}, {
        withCredentials: true,
      })
      .catch(() => {}) // ignore errors — navigate regardless

    navigate("/signin")
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {user ? (
        <Card className="w-full max-w-md text-left">
          <CardHeader>
            <CardTitle>Welcome, {user.fullname}!</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {user.profilePicture && (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="h-14 w-14 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Signed in with
              </span>
              <span className="text-sm capitalize">
                {user.providers?.join(", ") ?? "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Member since
              </span>
              <span className="text-sm">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                User ID
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {user._id}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      )}

      <Button variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  )
}
