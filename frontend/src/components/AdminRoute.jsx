import React from 'react';
import { Navigate } from 'react-router-dom';

function AdminRoute({ children }) {
    const role = localStorage.getItem('user_role');

    if (role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default AdminRoute;
