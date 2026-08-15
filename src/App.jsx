import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './routes/Login';
import DashboardLayout from './routes/DashboardLayout';
import NewLogsheets from './routes/NewLogsheets';
import ManageLogsheets from './routes/ManageLogsheets';
import LogsheetDetail from './routes/LogsheetDetail';
import ProductDetail from './routes/ProductDetail';
import SignatureSetup from './routes/SignatureSetup';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <NewLogsheets /> },
      { path: 'manage', element: <ManageLogsheets /> },
      { path: 'setup-signature', element: <SignatureSetup /> },
      { path: 'logsheet/:id', element: <LogsheetDetail /> },
      { path: 'logsheet/:id/product/:prodIdx', element: <ProductDetail /> },
      { path: 'addon/:id/product/:prodIdx', element: <ProductDetail /> }
    ]
  }
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}