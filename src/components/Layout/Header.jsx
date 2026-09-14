import React from 'react';
import { HiOutlineMenu, HiOutlineSearch, HiOutlineBell, HiOutlineMoon } from 'react-icons/hi';

export default function Header({ title, onToggleSidebar }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="header-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <HiOutlineMenu />
        </button>
        <h2 className="header-title">{title}</h2>
      </div>

      <div className="header-right">
        <div className="header-search">
          <HiOutlineSearch className="header-search-icon" />
          <input type="text" placeholder="Search anything..." />
        </div>

        <button className="header-icon-btn" aria-label="Toggle theme">
          <HiOutlineMoon />
        </button>

        <button className="header-icon-btn" aria-label="Notifications">
          <HiOutlineBell />
          <span className="badge"></span>
        </button>

        <div className="header-avatar" title="Admin User">
          A
        </div>
      </div>
    </header>
  );
}
