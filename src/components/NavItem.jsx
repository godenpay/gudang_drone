import React from 'react';

export default function NavItem({ icon, label, active, onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 rounded-lg transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      } ${!isOpen && 'justify-center'}`}
      title={label}
    >
      <span className="shrink-0">{icon}</span>
      {isOpen && <span className="ml-3 font-medium text-sm">{label}</span>}
    </button>
  );
}
