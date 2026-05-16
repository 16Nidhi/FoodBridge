import React from 'react';
import './Dashboard.css';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = 'fas fa-box-open', 
  title, 
  description, 
  actionText, 
  onAction 
}) => {
  return (
    <div className="db-empty-state">
      <div className="db-empty-icon">
        <i className={icon}></i>
      </div>
      <h3 className="db-empty-title">{title}</h3>
      <p className="db-empty-desc">{description}</p>
      {actionText && onAction && (
        <button className="db-btn db-btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;