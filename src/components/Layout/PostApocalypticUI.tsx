import React, { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'info';
  icon?: ReactNode;
  cornerDecoration?: boolean;
  blinkingIndicator?: boolean;
}

/**
 * Post-apocalyptic styled UI panel component
 */
export const Panel: React.FC<PanelProps> = ({
  children,
  className = '',
  title,
  variant = 'primary',
  icon,
  cornerDecoration = true,
  blinkingIndicator = false,
}) => {
  // Define color scheme based on variant
  const colors = {
    primary: {
      border: 'border-cyan-700/40',
      headerBg: 'bg-gray-800',
      headerText: 'text-cyan-400',
      indicator: 'bg-cyan-400',
    },
    danger: {
      border: 'border-red-700/40',
      headerBg: 'bg-gray-800',
      headerText: 'text-red-400',
      indicator: 'bg-red-400',
    },
    warning: {
      border: 'border-amber-600/40',
      headerBg: 'bg-gray-800',
      headerText: 'text-amber-400',
      indicator: 'bg-amber-400',
    },
    info: {
      border: 'border-blue-600/40',
      headerBg: 'bg-gray-800',
      headerText: 'text-blue-400',
      indicator: 'bg-blue-400',
    },
  };

  return (
    <div
      className={`bg-gray-900/80 backdrop-blur-md ${colors[variant].border} border rounded-lg relative overflow-hidden shadow-lg ${className}`}
    >
      {/* Corner decorations if enabled */}
      {cornerDecoration && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-500/40 rounded-tl-sm"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-500/40 rounded-tr-sm"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-500/40 rounded-bl-sm"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-500/40 rounded-br-sm"></div>
        </>
      )}

      {/* Panel header */}
      {title && (
        <div
          className={`px-4 py-2 ${colors[variant].headerBg} border-b ${colors[variant].border} flex items-center justify-between font-mono`}
        >
          <div className="flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            <h3
              className={`${colors[variant].headerText} font-bold tracking-wider text-sm`}
            >
              {title}
            </h3>
          </div>

          {blinkingIndicator && (
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full ${colors[variant].indicator} animate-pulse mr-1`}
              ></div>
              <span className={`text-xs ${colors[variant].headerText}`}>
                ACTIVE
              </span>
            </div>
          )}
        </div>
      )}

      {/* Panel content */}
      <div className="p-4">{children}</div>

      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
    </div>
  );
};

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'danger' | 'warning' | 'info' | 'neutral';
  pulsing?: boolean;
  className?: string;
}

/**
 * Post-apocalyptic styled badge component
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  pulsing = false,
  className = '',
}) => {
  // Define color scheme based on variant
  const colors = {
    primary: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50',
    danger: 'bg-red-900/60 text-red-300 border-red-700/50',
    warning: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
    info: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
    neutral: 'bg-gray-800/60 text-gray-300 border-gray-700/50',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded border text-xs font-mono ${colors[variant]} ${pulsing ? 'animate-pulse' : ''} ${className}`}
    >
      {children}
    </span>
  );
};

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'warning' | 'info' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

/**
 * Post-apocalyptic styled button component
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  className = '',
  fullWidth = false,
}) => {
  // Define styles based on variant
  const variantStyles = {
    primary: 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-500/30',
    danger: 'bg-red-700 hover:bg-red-600 text-white border-red-500/30',
    warning: 'bg-amber-700 hover:bg-amber-600 text-white border-amber-500/30',
    info: 'bg-blue-700 hover:bg-blue-600 text-white border-blue-500/30',
    ghost:
      'bg-transparent hover:bg-gray-800/50 text-cyan-400 border-cyan-700/30',
  };

  // Define sizes
  const sizeStyles = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-2.5 px-5',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        border rounded font-mono flex items-center justify-center transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:ring-opacity-50
        ${className}
      `}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

/**
 * Text input with post-apocalyptic styling
 */
export const TextInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    icon?: ReactNode;
  }
> = ({ label, icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-cyan-300 text-xs font-mono mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full bg-gray-800 border border-cyan-700/30 text-white rounded-md
            py-2 px-4 ${icon ? 'pl-10' : ''} focus:outline-none focus:border-cyan-600
            focus:ring-1 focus:ring-cyan-500 placeholder-gray-500 ${className}
          `}
        />
      </div>
    </div>
  );
};

/**
 * Status indicator component
 */
export const StatusIndicator: React.FC<{
  status: 'online' | 'offline' | 'warning' | 'critical';
  label?: string;
  className?: string;
}> = ({ status, label, className = '' }) => {
  // Define styles based on status
  const statusStyles = {
    online: {
      color: 'text-green-400',
      bgColor: 'bg-green-400',
      borderColor: 'border-green-400/50',
    },
    offline: {
      color: 'text-gray-400',
      bgColor: 'bg-gray-400',
      borderColor: 'border-gray-400/50',
    },
    warning: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-400',
      borderColor: 'border-amber-400/50',
    },
    critical: {
      color: 'text-red-400',
      bgColor: 'bg-red-400',
      borderColor: 'border-red-400/50',
    },
  };

  return (
    <div
      className={`flex items-center px-2 py-1 rounded-md bg-gray-800/60 backdrop-blur-sm border ${statusStyles[status].borderColor} ${className}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${statusStyles[status].bgColor} mr-2 animate-pulse`}
      ></div>
      <span className={`text-xs font-mono ${statusStyles[status].color}`}>
        {label || status.toUpperCase()}
      </span>
    </div>
  );
};

const PostApocalypticUI = {
  Panel,
  Badge,
  Button,
  TextInput,
  StatusIndicator,
};

export default PostApocalypticUI;
