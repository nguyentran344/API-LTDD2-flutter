const Movie = require('../models/Movie');

exports.addMovie = async (req, res) => {
  try {
    const { title, genre, description } = req.body;

    const imagePath = req.files?.image?.[0]?.path || '';
    const videoPath = req.files?.video?.[0]?.path || '';

    const movie = new Movie({
      title,
      genre,
      description,
      image: imagePath.replace(/\\/g, "/"), // Cho server Linux/Windows
      video: videoPath.replace(/\\/g, "/")
    });

    await movie.save();
    res.status(201).json(movie);

  } catch (error) {
    console.error("❌ Lỗi khi thêm phim:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

exports.getMovies = async (req, res) => {
  try {
    const movies = await Movie.find().populate("reviews.user", "name"); // Chỉ lấy tên user
    res.send(movies);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách phim:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

exports.updateMovie = async (req, res) => {
  const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.send(updatedMovie);
};

exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Không tìm thấy phim' });
    }

    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Phim đã được xoá' });
  } catch (error) {
    console.error("❌ Lỗi khi xoá phim:", error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

exports.addReview = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "Bạn cần đăng nhập để đánh giá" });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id; // ✅ Lấy ID từ token

    const movie = await Movie.findById(id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

    // Thêm đánh giá mới
    movie.reviews.push({ user: userId, rating, comment });

    // Cập nhật điểm trung bình
    const totalRating = movie.reviews.reduce((sum, r) => sum + r.rating, 0);
    movie.rating = totalRating / movie.reviews.length;

    await movie.save();

    // 🔥 Populate user để lấy username
    const updatedMovie = await Movie.findById(id).populate("reviews.user", "username");

    res.status(200).json({ message: "Đánh giá thành công", reviews: updatedMovie.reviews });
  } catch (error) {
    console.error("Lỗi khi thêm đánh giá:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};
