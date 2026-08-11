import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './routes/Login';
import DashboardLayout from './routes/DashboardLayout';
import NewLogsheets from './routes/NewLogsheets';
import ManageLogsheets from './routes/ManageLogsheets';
import LogsheetDetail from './routes/LogsheetDetail';
import SignatureSetup from './routes/SignatureSetup';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/setup-signature',
    element: <ProtectedRoute><SignatureSetup /></ProtectedRoute>
  },
  {
    path: '/',
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <NewLogsheets /> },
      { path: 'manage', element: <ManageLogsheets /> }
    ]
  },
  {
    path: '/logsheet/:id',
    element: <ProtectedRoute><LogsheetDetail /></ProtectedRoute>
  }
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}