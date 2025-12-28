import adminApi from "./adminApi";

// src/admin/services/bookings.js
export const getBookings = async (params = {}) => {
  try {
    // 1. Lấy danh sách booking và các bảng bổ trợ cùng lúc
    const [bookingsRes, moviesRes, cinemasRes, roomsRes, showtimesRes] =
      await Promise.all([
        adminApi.get("/bookings", { params }),
        adminApi.get("/movies"),
        adminApi.get("/cinemas"),
        adminApi.get("/rooms"),
        adminApi.get("/showtimes"), // Sửa từ show_times thành showtimes
      ]);

    const movies = moviesRes.data;
    const cinemas = cinemasRes.data;
    const rooms = roomsRes.data;
    const showtimes = showtimesRes.data;

    // 2. Map dữ liệu ngay tại client bằng hàm .find()
    const enrichedBookings = bookingsRes.data.map((booking) => {
      // Tìm showtime tương ứng (hỗ trợ cả showtimeId và showtime_id từ DB)
      const stId =
        booking.showtimeId ||
        booking.showtime_id ||
        booking.booking_details?.[0]?.showtime_id;
      const st = showtimes.find((s) => s.id === stId || s.showtime_id === stId);

      const movie = movies.find(
        (m) => m.id === st?.movieId || m.movie_id === st?.movie_id
      );
      const room = rooms.find(
        (r) => r.id === st?.roomId || r.room_id === st?.room_id
      );
      const cinema = cinemas.find(
        (c) => c.id === st?.cinemaId || c.cinema_id === st?.cinema_id
      );

      return {
        id: booking.id,
        code: booking.booking_id || booking.code,
        userName: booking.userName || "Khách vãng lai",
        userEmail: booking.userEmail || "",
        movieTitle: movie?.title || booking.movieTitle || "N/A",
        cinemaName: cinema?.name || booking.cinemaName || "N/A",
        roomName: room?.name || booking.roomName || "N/A",
        showDate: st?.date || booking.showDate,
        showTime: st?.startTime || booking.showTime,
        seats: booking.seats || [],
        totalAmount: booking.totalAmount || booking.total_price || 0,
        status: (
          booking.status ||
          booking.booking_status ||
          "pending"
        ).toLowerCase(),
        paymentStatus:
          booking.paymentStatus ||
          (booking.booking_status === "CONFIRMED" ? "paid" : "pending"),
        createdAt: booking.createdAt || booking.create_time,
      };
    });

    return { bookings: enrichedBookings };
  } catch (error) {
    throw error.response?.data || { message: "Lỗi đồng bộ dữ liệu đặt vé" };
  }
};

export const getBookingById = async (id) => {
  try {
    const response = await adminApi.get(`/bookings/${id}`);
    const booking = response.data;

    // Get full detail like getBookings
    const details = booking.booking_details || [];
    if (details.length === 0) return booking;

    const firstDetail = details[0];
    const showtime = await adminApi.get(
      `/showtimes/${firstDetail.showtime_id}`
    );
    const [movie, room] = await Promise.all([
      adminApi.get(`/movies/${showtime.data.movie_id}`),
      adminApi.get(`/rooms/${showtime.data.room_id}`),
    ]);
    const cinema = await adminApi.get(`/cinemas/${room.data.cinema_id}`);
    const seats = await Promise.all(
      details.map((d) => adminApi.get(`/seats/${d.seat_id}`))
    );

    return {
      id: booking.booking_id,
      code: booking.booking_id,
      userName: "Customer",
      userEmail: "customer@example.com",
      userPhone: "0901234567",
      movieTitle: movie.data.title,
      cinemaName: cinema.data.name,
      roomName: room.data.room_name,
      showDate: showtime.data.start_time.split("T")[0],
      showTime: showtime.data.start_time.split("T")[1].slice(0, 5),
      seats: seats.map((s) => `${s.data.seat_row}${s.data.seat_number}`),
      ticketPrice: details[0].price,
      totalAmount: booking.total_price,
      discount: 0,
      paymentMethod: "Online",
      paymentStatus:
        booking.booking_status === "CONFIRMED" ? "paid" : "pending",
      status: booking.booking_status.toLowerCase(),
      createdAt: booking.create_time,
    };
  } catch (error) {
    throw error.response?.data || { message: "Lỗi khi tải thông tin đặt vé" };
  }
};

export const cancelBooking = async (id, reason = "") => {
  try {
    const response = await adminApi.patch(`/bookings/${id}`, {
      booking_status: "CANCELLED",
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Lỗi khi hủy đặt vé" };
  }
};

export const confirmPayment = async (id) => {
  try {
    const response = await adminApi.patch(`/bookings/${id}`, {
      booking_status: "CONFIRMED",
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Lỗi khi xác nhận thanh toán" };
  }
};

export const getBookingStats = async (params = {}) => {
  try {
    const response = await adminApi.get("/bookings");
    const bookings = response.data;

    const today = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter((b) =>
      b.create_time.startsWith(today)
    );

    return {
      totalBookings: bookings.length,
      todayRevenue: todayBookings.reduce((sum, b) => sum + b.total_price, 0),
    };
  } catch (error) {
    throw error.response?.data || { message: "Lỗi khi tải thống kê" };
  }
};
