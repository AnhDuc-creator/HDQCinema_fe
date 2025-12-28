import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { message } from "antd";
import { login } from "../../services/api";
import googleLogo from "../../../assets/images/google-logo-9824.png";
import appleLogo from "../../../assets/images/apple-logo-9708.png";
import "./LogIn.scss";

const LogIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    // --- LOGIC GIẢ LẬP (MOCK) ĐỂ BẠN TEST GIAO DIỆN ---
    if (
      username === "member" ||
      username === "admin" ||
      username === "manager"
    ) {
      const mockToken = `fake-jwt-for-${username}`;
      const mockData = {
        token: mockToken,
        role: username,
        info: { name: `${username} Giả`, email: `${username}@cinema.com` },
      };

      localStorage.setItem("token", mockToken);
      localStorage.setItem("user", JSON.stringify(mockData));

      message.success("Đăng nhập giả lập thành công!");

      // Điều hướng
      if (mockData.role === "admin" || mockData.role === "manager") {
        navigate("/admin");
      } else {
        navigate(from, { replace: true });
      }
      return;
    }
    // --- KẾT THÚC GIẢ LẬP ---

    // // Giả lập đăng nhập cho tài khoản mới register
    // const savedUser = JSON.parse(localStorage.getItem("registeredUser"));
    // if (
    //   savedUser &&
    //   username === savedUser.username &&
    //   password === savedUser.password
    // ) {
    //   localStorage.setItem("token", "fake-jwt-token");
    //   localStorage.setItem(
    //     "user",
    //     JSON.stringify({ name: username, email: "user@example.com" })
    //   );
    //   message.success("Đăng nhập thành công!");
    //   navigate("/");
    // } else {
    //   alert("Sai tên đăng nhập hoặc mật khẩu!");
    // }
    // //Kết thúc giả lập đăng nhập

    // --- LOGIC ĐĂNG NHẬP THẬT VỚI BACKEND ---
    try {
      const res = await loginApi(username, password);

      if (res.result?.token) {
        const token = res.result.token;
        localStorage.setItem("token", token);

        // 1. Giải mã token để lấy role và payload
        const decoded = jwtDecode(token);

        // 2. Phân loại role dựa trên cấu trúc Backend (Employee có role, Member thì không)
        const role = decoded.employee?.role || "member";

        // 3. Lưu object user thống nhất
        const userData = {
          token: token,
          role: role,
          info: decoded.employee || decoded.member || res.result.user,
        };
        localStorage.setItem("user", JSON.stringify(userData));

        message.success(`Chào mừng ${userData.role} quay trở lại!`);

        // 4. Điều hướng thông minh
        if (role === "admin" || role === "manager") {
          navigate("/admin/dashboard");
        } else {
          navigate(from); // Quay lại trang cũ (ví dụ: đang đặt vé thì quay lại thanh toán)
        }
      }
    } catch (err) {
      console.error(err);
      message.error(
        err.message || "Tên đăng nhập hoặc mật khẩu không chính xác"
      );
    }
  };

  return (
    <div className="login-container">
      <div className="card">
        <form onSubmit={handleLogin}>
          <h2>ĐĂNG NHẬP VÀO TÀI KHOẢN</h2>
          <h3>Sử dụng email hoặc mật khẩu</h3>

          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Đăng nhập</button>

          <p className="switch-auth">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>

          <span className="or"></span>

          <div className="socials">
            <button
              type="button"
              className="social-btn"
              onClick={() => message.info("Chức năng Google chưa được bật")}
            >
              <img src={googleLogo} alt="Google" />
              <p>Google</p>
            </button>
            <button
              type="button"
              className="social-btn"
              onClick={() => message.info("Chức năng Apple chưa được bật")}
            >
              <img src={appleLogo} alt="Apple" />
              <p>Apple</p>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogIn;
