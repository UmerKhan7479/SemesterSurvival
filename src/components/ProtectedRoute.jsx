import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUpload } from '../context/UploadContext';

const ProtectedRoute = ({ children }) => {
    const { user } = useUpload();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
