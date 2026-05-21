import { Outlet } from "react-router-dom";

/**
 * AuthLayout
 * Layout đơn giản cho các trang public: Login, Register, Forgot Password, v.v.
 * Hiển thị centered card trên nền gradient.
 */
const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="w-full max-w-md px-4">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
