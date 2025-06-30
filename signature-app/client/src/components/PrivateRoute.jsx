import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // Get token from localStorage
  const token = localStorage.getItem('token');

  // If there's no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If there is a token, render the protected component
  return children;
};

export default PrivateRoute; 