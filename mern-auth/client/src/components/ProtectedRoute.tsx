import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import axios from "axios"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading")

  useEffect(() => {
    // We no longer read the cookie with JS — httpOnly cookies are invisible to document.cookie.
    // Instead we call /me with withCredentials: true. The browser automatically attaches
    // the httpOnly cookie to the request. If the server returns 200 the user is authenticated,
    // if it returns 401 they are not.
    //
    // This works for ALL auth flows:
    //   - Local / Google  → token was set in the cookie by the server on signin
    //   - GitHub          → token was set in the cookie by the server after the OAuth callback
    axios
      .get("http://localhost:5000/api/auth/me", {
        withCredentials: true, // sends the httpOnly cookie automatically
      })
      .then(() => setStatus("authorized"))
      .catch(() => setStatus("unauthorized"))
  }, [])

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground text-sm">Verifying session...</p>
      </div>
    )
  }

  if (status === "unauthorized") {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}
