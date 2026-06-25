import React, { useState, useEffect } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaEdit, FaTrash } from "react-icons/fa";
import api from "../../api";
import { toast } from "react-hot-toast";
import {
  FaSearch,
  FaFilter,
  FaTh,
  FaList,
  FaPlus,
} from "react-icons/fa";

export default function VideoForm() {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    url: "",
    file: null,
    fileName: "",
    dbId: null,
  });
  const [showForm, setShowForm] = useState(true);
  const [showList, setShowList] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Fetch all videos
  const fetchVideos = async () => {
    try {
      const res = await api.get("/videos");

      const formatted = res.data.map((item) => ({
        dbId: item.id,
        id: item.video_id,
        name: item.name,
        url: item.url,
        fileName: item.file_name,
        date: item.date,
      }));

      setVideos(formatted);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load videos");
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // ✅ Auto-generate ID
  useEffect(() => {
    if (!isEditing) {
      const lastId = videos.length > 0 ? videos[videos.length - 1].id : null;
      const newId = lastId
        ? "VI" + (parseInt(lastId.slice(2)) + 1).toString().padStart(3, "0")
        : "VI001";
      setForm((prev) => ({ ...prev, id: newId }));
    }
  }, [videos, isEditing]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);

      if (mobile) {
        setViewMode("card");
      } else {
        setViewMode("table");
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) =>
    setForm({ ...form, file: e.target.files[0], url: "" });

  // ✅ GoDaddy Upload Function
  const uploadVideoToGoDaddy = async (file) => {
    const formData = new FormData();
    formData.append("files[]", file);
    formData.append("category", "videos");

    toast.loading("Uploading video...");

    try {
      const res = await fetch("https://saravanashoppings.com/api/upload.php", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      toast.dismiss();

      if (data.success && data.urls.length > 0) {
        toast.success("Video uploaded successfully!");
        return data.urls[0];
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      toast.dismiss();
      console.error("Upload error:", err);
      toast.error("Video upload failed");
      return null;
    }
  };

  // ✅ Add / Update Video
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.url && !form.file) {
      toast.error("Please provide either a video URL or upload a file.");
      return;
    }

    let videoURL = form.url;

    try {
      if (form.file) {
        const uploadedUrl = await uploadVideoToGoDaddy(form.file);
        if (!uploadedUrl) throw new Error("Upload failed");
        videoURL = uploadedUrl;
      }

      const payload = {
        video_id: form.id,
        name: form.name,
        url: videoURL,
        file_name: form.file
          ? form.file.name
          : form.fileName,
      };

      if (isEditing && form.dbId) {
        await api.put(`/videos/${form.dbId}`, payload);
        toast.success("Video updated successfully!");
      } else {
        await api.post("/videos", payload);
        toast.success("Video added successfully!");
      }

      setForm({
        id: "",
        name: "",
        url: "",
        file: null,
        fileName: "",
        dbId: null,
      });
      setIsEditing(false);
      setShowModal(false);
      fetchVideos();
    } catch (err) {
      console.error(err);
      toast.error("Error saving video.");
    }
  };

  const handleEdit = (video) => {
    setForm({
      id: video.id,
      dbId: video.dbId,
      name: video.name,
      url: video.url,
      file: null,
      fileName: video.fileName || "",
    });

    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this video?")) {
      try {
        await api.delete(`/videos/${id}`);

        setVideos((prev) =>
          prev.filter((video) => video.dbId !== id)
        );

        toast.success("Video deleted successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Delete failed");
      }
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;

    try {
      if (url.includes("/shorts/")) {
        const id = url.split("/shorts/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${id}`;
      }

      if (url.includes("watch?v=")) {
        const id = new URL(url).searchParams.get("v");
        return `https://www.youtube.com/embed/${id}`;
      }

      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${id}`;
      }

      return null;
    } catch {
      return null;
    }
  };

  const filteredVideos = videos.filter((video) =>
    video.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto mt-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">

        {/* Search */}

        <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          <FaSearch className="text-gray-400" />

          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>

        <span className="text-sm text-gray-500">
          {filteredVideos.length} videos
        </span>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">

          {!isMobile && (
            <div className="flex bg-gray-100 rounded-xl p-1">

              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-lg ${viewMode === "card"
                  ? "bg-white shadow text-primary"
                  : ""
                  }`}
              >
                <FaTh />
              </button>

              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg ${viewMode === "table"
                  ? "bg-white shadow text-primary"
                  : ""
                  }`}
              >
                <FaList />
              </button>

            </div>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-xl"
          >
            <FaPlus />
            Add Video
          </button>

        </div>
      </div>

      {/* FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">

          <div className="bg-white w-full max-w-lg sm:max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">

            <div className="flex justify-between items-center border-b border-gray-200 pb-3">

              <h2 className="text-xl font-bold">
                {isEditing
                  ? "Edit Video"
                  : "Add Video"}
              </h2>

              <button
                className="cursor-pointer"
                onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                }}
              >
                ✕
              </button>

            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mb-6 mt-2">
              <div className="flex flex-col md:flex-row md:gap-4 ">
                <div className="flex-1">
                  <label>Video ID</label>
                  <input
                    type="text"
                    name="id"
                    value={form.id}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>
                <div className="flex-1">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Video Name"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:gap-4">
                <div className="flex-1">
                  <label>Video URL</label>
                  <input
                    type="text"
                    name="url"
                    value={form.url}
                    onChange={handleChange}
                    disabled={form.file}
                    placeholder="Enter YouTube or custom URL"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>
                <div className="flex-1">
                  <label>Or Upload Video</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                  {form.file && (
                    <p className="text-sm mt-1">Selected: {form.file.name}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="bg-primary cursor-pointer text-white px-4 py-2 rounded-full font-bold"
                >
                  {isEditing ? "Update Video" : "Add Video"}
                </button>
              </div>
            </form>

          </div>

        </div>
      )}

      {/* LIST */}

      <div className="mt-4">
        {!isMobile && viewMode === "table" && (
          <div className="bg-white shadow rounded-2xl overflow-x-auto">
            <table className="min-w-full text-sm rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-primary to-secondary text-white">
                  <th className="px-4 py-3">S.No.</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Videos</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🎬</span>
                        <p className="text-gray-500 font-medium">No videos added yet.</p>
                        <p className="text-gray-400 text-xs">Click "Add Video" to upload your first video.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVideos.map((video, index) => (
                    <tr key={video.dbId} className="text-center border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-4">{index + 1}.</td>
                      <td className="px-3 py-4 font-medium text-gray-800">{video.name}</td>
                      <td className="px-3 py-4 flex items-center justify-center">
                        {video.url &&
                          (getYoutubeEmbedUrl(video.url) ? (
                            <iframe
                              width="150"
                              height="90"
                              src={getYoutubeEmbedUrl(video.url)}
                              title={video.name}
                              allowFullScreen
                              className="rounded-lg"
                            />
                          ) : (
                            <video width="150" controls className="w-24 h-24">
                              <source src={video.url} />
                            </video>
                          ))}
                      </td>
                      <td className="px-3 py-4 space-x-2">
                        <button
                          onClick={() => handleEdit(video)}
                          className="text-gray-600 cursor-pointer border p-2 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(video.dbId)}
                          className="text-gray-600 cursor-pointer border p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Cards */}
        {(isMobile || viewMode === "card") && (
          <div>
            {filteredVideos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">🎬</span>
                  <p className="text-gray-500 font-medium">No videos added yet.</p>
                  <p className="text-gray-400 text-xs">Click "Add Video" to upload your first video.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredVideos.map((video, index) => (
                  <div
                    key={video.dbId}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                  >
                    <div className="aspect-video rounded-xl overflow-hidden mb-3">
                      {getYoutubeEmbedUrl(video.url) ? (
                        <iframe
                          src={getYoutubeEmbedUrl(video.url)}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      ) : (
                        <video controls className="w-full h-full object-cover">
                          <source src={video.url} />
                        </video>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg">{video.name}</h3>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(video)}
                        className="w-10 h-10 rounded-xl bg-green-50 text-green-600 cursor-pointer"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(video.dbId)}
                        className="w-10 h-10 rounded-xl bg-red-50 text-red-600 cursor-pointer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
