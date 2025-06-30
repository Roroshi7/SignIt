import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createContext, useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentViewer from './pages/DocumentViewer';
import ExternalSign from './pages/ExternalSign';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Create AuthContext
export const AuthContext = createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // You could also fetch user data here if needed
    }
  }, []);

  const authContextValue = {
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/document/:id" element={<PrivateRoute><DocumentViewer /></PrivateRoute>} />
            <Route path="/external-sign/:token" element={<ExternalSign />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
