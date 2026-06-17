import React, { useState, useEffect } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaEdit } from "react-icons/fa";
import api from "../../api";
import { toast } from "react-hot-toast";

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
      fetchVideos();
      setShowForm(false);
      setShowList(true);
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
      fileName: video.fileName,
    });

    setIsEditing(true);
    setShowForm(true);
    setShowList(false);
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

  return (
    <div className="max-w-5xl mx-auto mt-4 p-4 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {showForm ? (isEditing ? "Edit Video" : "Add Video") : "Videos"}
        </h2>
        <div className="space-x-2 space-y-3">
          <button
            onClick={() => {
              setShowForm(true);
              setShowList(false);
              setIsEditing(false);
            }}
            className={`px-4 py-2 rounded-full font-bold cursor-pointer ${showForm
              ? "bg-primary text-white"
              : "bg-white text-primary border border-primary"
              }`}
          >
            Add Video
          </button>
          <button
            onClick={() => {
              setShowList(true);
              setShowForm(false);
            }}
            className={`px-4 py-2 rounded-full font-bold cursor-pointer ${showList
              ? "bg-primary text-white"
              : "bg-white text-primary border border-primary"
              }`}
          >
            Show Video List
          </button>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row md:gap-4">
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
      )}

      {/* LIST */}
      {showList && (
        <div className="mt-4">
          <div className="hidden md:block bg-white shadow rounded-2xl overflow-x-auto">
            {videos.length === 0 ? (
              <p className="p-4 text-center">No videos added yet.</p>
            ) : (
              <table className="min-w-full text-sm rounded-lg overflow-hidden">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="px-3 py-4">ID</th>
                    <th className="px-3 py-4">Name</th>
                    <th className="px-3 py-4">Video</th>
                    <th className="px-3 py-4">Date</th>
                    <th className="px-3 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video) => (
                    <tr key={video.dbId} className="text-center border-gray-200">
                      <td className="px-3 py-4">{video.id}</td>
                      <td className="px-3 py-4">{video.name}</td>
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
                      <td className="px-3 py-4">{video.date}</td>
                      <td className="px-3 py-4 space-x-2">
                        <button
                          onClick={() => handleEdit(video)}
                          className="text-gray-600 cursor-pointer border p-2 rounded-full"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(video.dbId)}
                          className="text-gray-600 cursor-pointer border p-2 rounded-full"
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-4">
            {videos.length === 0 ? (
              <p className="p-4 text-center">No videos added yet.</p>
            ) : (
              videos.map((video) => (
                <div
                  key={video.dbId}
                  className="bg-white shadow rounded-2xl p-4 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">
                      #{video.id} - {video.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(video)}
                        className="text-gray-600 cursor-pointer border p-2 rounded-full"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(video.dbId)}
                        className="text-gray-600 cursor-pointer border p-2 rounded-full"
                      >
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  </div>
                  {video.url &&
                    (getYoutubeEmbedUrl(video.url) ? (
                      <iframe
                        src={getYoutubeEmbedUrl(video.url)}
                        title={video.name}
                        allowFullScreen
                        className="w-full h-56 rounded-lg mt-2"
                      />
                    ) : (
                      <video controls className="w-full h-auto rounded-lg mt-2">
                        <source src={video.url} />
                      </video>
                    ))}
                  <p className="text-sm">
                    <strong>Date:</strong> {video.date}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
