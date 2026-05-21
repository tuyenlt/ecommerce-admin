import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import authApi from "@/api/authApi";
import useAuthStore from "@/store/authStore";

/**
 * LoginPage
 * Trang đăng nhập với form email + password.
 * Sau khi login thành công → lưu accessToken + user vào store → redirect dashboard.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await authApi.login(formData);
      const { user, accessToken } = response.data;

      setAuth({ user, accessToken });
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-zinc-700/50 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-4 pb-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold text-white">
            Chào mừng trở lại
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Đăng nhập vào tài khoản quản trị viên
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">
              Mật khẩu
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            id="login-submit"
            type="submit"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginPage;
