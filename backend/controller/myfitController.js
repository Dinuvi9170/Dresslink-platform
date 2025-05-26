// Check authentication status
export const checkAuthStatus = (req, res) => {
  if (req.isAuthenticated) {
    return res.status(200).json({ 
      isAuthenticated: true,
      user: req.user 
    });
  }
  return res.status(401).json({ 
    isAuthenticated: false,
    message: "Authentication required" 
  });
};

// Generic handler for MyFit requests
export const processMyFitData = (req, res) => {
  if (!req.isAuthenticated) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  return res.status(200).json({ success: true });
};