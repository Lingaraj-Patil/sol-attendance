import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import {LogOut, User, Coins, ShoppingCart} from "lucide-react";

const Navbar = () => {
  const {user, logout} = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-md border-b-2 border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Coins className="h-8 w-8 text-yellow-600" />
              <span className="text-xl font-bold text-gray-900 font-serif">
                CurriculaFlex
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user.role === "student" && (
              <Link
                to="/marketplace"
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-yellow-50 rounded-lg transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Marketplace</span>
              </Link>
            )}

            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>

            {user.role === "student" && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <Coins className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-700">
                  {user.tokenBalance || 0} Tokens
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-yellow-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
