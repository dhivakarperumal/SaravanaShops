const pool = require("../config/db");

// Get All Videos
exports.getVideos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        video_id,
        name,
        url,
        file_name,
        DATE_FORMAT(created_at,'%d/%m/%Y') as date
      FROM videos
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Add Video
exports.addVideo = async (req, res) => {
  try {
    const { video_id, name, url, file_name } = req.body;

    const [result] = await pool.query(
      `
      INSERT INTO videos
      (video_id,name,url,file_name)
      VALUES (?,?,?,?)
      `,
      [video_id, name, url, file_name]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Update Video
exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { video_id, name, url, file_name } = req.body;

    await pool.query(
      `
      UPDATE videos
      SET
      video_id=?,
      name=?,
      url=?,
      file_name=?
      WHERE id=?
      `,
      [video_id, name, url, file_name, id]
    );

    res.json({
      success: true,
      message: "Video updated",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Delete Video
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM videos WHERE id=?",
      [id]
    );

    res.json({
      success: true,
      message: "Video deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};