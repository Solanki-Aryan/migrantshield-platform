import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Sidebar({ links, portalName }) {
  useLocation(); // re-render on route changes

  return (
    <aside className="sidebar">
      {portalName && (
        <div className="sidebar-header">{portalName}</div>
      )}
      <ul className="sidebar-nav">
        {links.map((link) => (
          <li key={link.path}>
            <NavLink
              to={link.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="sidebar-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
