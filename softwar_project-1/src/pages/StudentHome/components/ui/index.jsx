// مكونات UI محسنة مع التصميم الفاخر
export const Card = ({ children, className = "", hover = true }) => (
  <div className={`card ${hover ? 'hover:transform hover:-translate-y-2' : ''} ${className}`}>
    {children}
  </div>
);

export const Button = ({ children, className = "", variant = "default", size = "default", ...props }) => {
  const baseClasses = "btn flex items-center justify-center transition-all duration-300";
  const sizeClasses = {
    default: "px-6 py-3 text-sm",
    sm: "px-4 py-2 text-xs",
    lg: "px-8 py-4 text-base"
  };
  const variants = {
    default: "btn-primary",
    outline: "btn-outline",
    ghost: "bg-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100"
  };
  
  return (
    <button className={`${baseClasses} ${sizeClasses[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Badge = ({ children, className = "", variant = "default" }) => {
  const variants = {
    default: "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-600 text-white",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white"
  };
  
  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Input = ({ type = "text", placeholder, value, onChange, className = "", ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`input ${className}`}
    {...props}
  />
);

export const Progress = ({ value, className = "" }) => (
  <div className={`progress ${className}`}>
    <div 
      className="progress-bar"
      style={{ width: `${value}%` }}
    />
  </div>
);

// مكونات إضافية محسنة
export const Tabs = ({ value, onValueChange, children }) => (
  <div className="tabs">
    {children}
  </div>
);

export const TabsList = ({ children, className = "" }) => (
  <div className={`flex bg-gray-100/50 backdrop-blur-sm rounded-2xl p-1 ${className}`}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className = "", ...props }) => (
  <button
    className={`flex-1 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const Label = ({ children, className = "" }) => (
  <label className={`text-sm font-semibold text-gray-700 mb-2 block ${className}`}>
    {children}
  </label>
);

export const Separator = ({ className = "" }) => (
  <div className={`h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent ${className}`} />
);

export const Avatar = ({ children, className = "" }) => (
  <div className={`rounded-2xl overflow-hidden border-2 border-white shadow-lg ${className}`}>
    {children}
  </div>
);

export const AvatarImage = ({ src, alt = "" }) => (
  <img src={src} alt={alt} className="w-full h-full object-cover" />
);

export const AvatarFallback = ({ children }) => (
  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
    {children}
  </div>
);