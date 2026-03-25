import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';

function PublicRoutes({ onLogin }) {
  return (
    <Routes>
      <Route path="/*" element={<Login onLogin={onLogin} />} />
    </Routes>
  );
}

export default PublicRoutes;
