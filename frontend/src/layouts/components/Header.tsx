import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserMenu } from '@/features/profile/components/UserMenu';
import { Logo } from '@/shared/ui/Logo';
import { useState } from 'react';

export const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { path: '/rates', label: 'Курсы' },
    { path: '/reviews', label: 'Отзывы' },
    { path: '/delivery', label: 'Доставка' },
    { path: '/working-hours', label: 'График работы' },
    { path: '/about', label: 'О нас' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'nav-link text-icmop-primary border-b-2 border-icmop-primary font-medium' 
      : 'nav-link text-gray-600 hover:text-icmop-primary transition-colors duration-200';
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <div className="flex-shrink-0">
            <Logo className="h-10" />
          </div>

          {/* Десктопное меню */}
          <nav className="hidden lg:flex items-center space-x-6">
            {menuItems.map(item => (
              <Link 
                key={item.path}
                to={item.path} 
                className={isActive(item.path)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Кнопка мобильного меню */}
          <button
            className="lg:hidden ml-4 p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        <div className="header-right">
          {isAuthenticated && user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="btn-text hover:text-icmop-primary transition-colors duration-200"
              >
                Вход
              </Link>
              <Link 
                to="/register" 
                className="btn btn-primary"
              >
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Мобильное меню */}
      {isMenuOpen && (
        <div className="lg:hidden">
          <nav className="px-2 pt-2 pb-4 space-y-2 bg-white border-t">
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-icmop-primary hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
