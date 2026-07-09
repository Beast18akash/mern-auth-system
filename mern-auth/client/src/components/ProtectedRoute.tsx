import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import axios from "axios"

function getTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
  return match ? match[1] : null
}

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading")

  useEffect(() => {
    const token = getTokenFromCookie()

    if (!token) {
      setStatus("unauthorized")
      return
    }

    axios
      .get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
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
