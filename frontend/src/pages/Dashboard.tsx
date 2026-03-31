import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirects to new Home page
export default function Dashboard() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/', { replace: true }); }, [navigate]);
  return null;
}
