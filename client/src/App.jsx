import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import ExamsListPage from './pages/ExamsListPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import CreateExamPage from './pages/CreateExamPage';
import EditExamPage from './pages/EditExamPage';
import ExamSubmissionsPage from './pages/ExamSubmissionsPage';
import TakeExamPage from './pages/TakeExamPage';
import ExamResultPage from './pages/ExamResultPage';
import MyAttemptsPage from './pages/MyAttemptsPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
              <Header />
              <main className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/users/:id" element={<PublicProfilePage />} />
                  
                  {/* Protected Common Routes */}
                  <Route
                    path="/exams"
                    element={
                      <ProtectedRoute>
                        <ExamsListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/groups"
                    element={
                      <ProtectedRoute>
                        <GroupsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/groups/:id"
                    element={
                      <ProtectedRoute>
                        <GroupDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Student Exam Routes */}
                  <Route
                    path="/exams/:id/take"
                    element={
                      <ProtectedRoute>
                        <TakeExamPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/exams/results/:attemptId"
                    element={
                      <ProtectedRoute>
                        <ExamResultPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-attempts"
                    element={
                      <ProtectedRoute>
                        <MyAttemptsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Teacher / Staff Routes */}
                  <Route
                    path="/teacher/dashboard"
                    element={
                      <ProtectedRoute>
                        <TeacherDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <TeacherDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/exams/create"
                    element={
                      <ProtectedRoute>
                        <CreateExamPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/exams/create"
                    element={
                      <ProtectedRoute>
                        <CreateExamPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/exams/:id/edit"
                    element={
                      <ProtectedRoute>
                        <EditExamPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/exams/:id/edit"
                    element={
                      <ProtectedRoute>
                        <EditExamPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/exams/:id/submissions"
                    element={
                      <ProtectedRoute>
                        <ExamSubmissionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/exams/:id/submissions"
                    element={
                      <ProtectedRoute>
                        <ExamSubmissionsPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Administrator Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
