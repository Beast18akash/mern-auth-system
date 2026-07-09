import { Routes, Route } from 'react-router-dom'
import { SignUp } from './pages/signUp.tsx'
import { SignIn } from './pages/signIn.tsx'
import { Home } from './pages/Home.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { ForgotPassword } from './pages/ForgotPassword.tsx'
import { ResetPassword } from './pages/ResetPassword.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
